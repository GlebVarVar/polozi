//! End-to-end API tests. Each test provisions an isolated Postgres database,
//! runs migrations + seed, and drives the real router in-process via `oneshot`.
//!
//! Requires a reachable Postgres (the docker-compose one on :5433 works):
//!   docker compose up -d postgres
//!   cargo test -p polozi-api
//! Override the server with TEST_DATABASE_URL / DATABASE_URL if needed.

use std::sync::atomic::{AtomicU32, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

use axum::{
    body::Body,
    http::{header, Method, Request, StatusCode},
    Router,
};
use polozi_api::{app, run_migrations, seed};
use serde_json::{json, Value};
use sqlx::{postgres::PgPoolOptions, Connection, Executor, PgConnection, PgPool};
use totp_rs::{Algorithm, Secret, TOTP};
use tower::ServiceExt; // for `oneshot`

// ---------------- harness ----------------

static COUNTER: AtomicU32 = AtomicU32::new(0);

fn unique_suffix() -> String {
    let n = COUNTER.fetch_add(1, Ordering::SeqCst);
    let t = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    format!("{t}_{n}")
}

fn base_url() -> String {
    std::env::var("TEST_DATABASE_URL")
        .or_else(|_| std::env::var("DATABASE_URL"))
        .unwrap_or_else(|_| "postgres://polozi:polozi@localhost:5433/polozi".to_string())
}

fn with_db(url: &str, db: &str) -> String {
    let (prefix, _) = url.rsplit_once('/').expect("database url must contain a db name");
    format!("{prefix}/{db}")
}

struct TestApp {
    router: Router,
    pool: PgPool,
    db: String,
}

async fn setup() -> TestApp {
    let base = base_url();
    let db = format!("polozi_test_{}", unique_suffix());

    let mut admin = PgConnection::connect(&base).await.expect(
        "connect to base DB — is Postgres up? run `docker compose up -d postgres` (host port 5433)",
    );
    // CREATE DATABASE serializes on template1; retry if a sibling test holds it.
    let mut attempt = 0;
    loop {
        match admin
            .execute(format!(r#"CREATE DATABASE "{db}""#).as_str())
            .await
        {
            Ok(_) => break,
            Err(e) if attempt < 10 => {
                attempt += 1;
                tokio::time::sleep(std::time::Duration::from_millis(150)).await;
                let _ = e;
            }
            Err(e) => panic!("create test database failed: {e}"),
        }
    }
    admin.close().await.ok();

    let url = with_db(&base, &db);
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&url)
        .await
        .expect("connect to test database");
    run_migrations(&pool).await.expect("run migrations");
    seed::seed(&pool).await.expect("seed data");

    TestApp {
        router: app(pool.clone()),
        pool,
        db,
    }
}

impl TestApp {
    async fn teardown(self) {
        self.pool.close().await;
        if let Ok(mut admin) = PgConnection::connect(&base_url()).await {
            let _ = admin
                .execute(format!(r#"DROP DATABASE IF EXISTS "{}" WITH (FORCE)"#, self.db).as_str())
                .await;
            admin.close().await.ok();
        }
    }
}

async fn req(
    router: &Router,
    method: Method,
    path: &str,
    token: Option<&str>,
    body: Option<Value>,
) -> (StatusCode, Value) {
    let mut b = Request::builder().method(method).uri(path);
    if let Some(t) = token {
        b = b.header(header::AUTHORIZATION, format!("Bearer {t}"));
    }
    let request = match body {
        Some(v) => b
            .header(header::CONTENT_TYPE, "application/json")
            .body(Body::from(serde_json::to_vec(&v).unwrap()))
            .unwrap(),
        None => b.body(Body::empty()).unwrap(),
    };
    let resp = router.clone().oneshot(request).await.unwrap();
    let status = resp.status();
    let bytes = axum::body::to_bytes(resp.into_body(), usize::MAX).await.unwrap();
    let value = if bytes.is_empty() {
        Value::Null
    } else {
        serde_json::from_slice(&bytes).unwrap_or(Value::Null)
    };
    (status, value)
}

/// Current TOTP code for a base32 secret (same params as the server).
fn totp_now(secret_b32: &str) -> String {
    let bytes = Secret::Encoded(secret_b32.to_string()).to_bytes().unwrap();
    let totp = TOTP::new(Algorithm::SHA1, 6, 1, 30, bytes, None, "test".to_string()).unwrap();
    totp.generate_current().unwrap()
}

async fn admin_token(router: &Router) -> String {
    let (s, body) = req(
        router,
        Method::POST,
        "/api/auth/login",
        None,
        Some(json!({ "username": "admin", "password": "admin123" })),
    )
    .await;
    assert_eq!(s, StatusCode::OK, "admin login failed: {body:?}");
    body["token"].as_str().expect("admin token").to_string()
}

// ---------------- health + swagger ----------------

#[tokio::test]
async fn health_and_swagger_are_served() {
    let t = setup().await;

    let (s, body) = req(&t.router, Method::GET, "/health", None, None).await;
    assert_eq!(s, StatusCode::OK);
    assert_eq!(body["status"], "ok");

    // OpenAPI document
    let (s, doc) = req(&t.router, Method::GET, "/api-docs/openapi.json", None, None).await;
    assert_eq!(s, StatusCode::OK, "openapi.json not served");
    assert_eq!(doc["info"]["title"], "Položi! API");
    let paths = doc["paths"].as_object().expect("openapi paths object");
    for p in [
        "/health",
        "/api/auth/login",
        "/api/categories",
        "/api/questions/{id}",
        "/api/account/register",
        "/api/account/login",
    ] {
        assert!(paths.contains_key(p), "openapi is missing path {p}");
    }

    // Swagger UI HTML
    let (s, _) = req(&t.router, Method::GET, "/swagger/", None, None).await;
    assert!(
        s.is_success() || s.is_redirection(),
        "swagger UI not served: {s}"
    );

    t.teardown().await;
}

// ---------------- public content flow ----------------

#[tokio::test]
async fn public_content_flow() {
    let t = setup().await;

    // categories + questions exist; take real ids from the responses so the
    // test is independent of whatever seed/migration content is loaded.
    let (s, cats) = req(&t.router, Method::GET, "/api/categories", None, None).await;
    assert_eq!(s, StatusCode::OK);
    assert!(!cats.as_array().unwrap().is_empty(), "no categories");

    let (s, qs) = req(&t.router, Method::GET, "/api/questions", None, None).await;
    assert_eq!(s, StatusCode::OK);
    let qs = qs.as_array().unwrap().clone();
    assert!(!qs.is_empty(), "no questions");
    let q_id = qs[0]["id"].as_str().unwrap().to_string();
    let cat_id = qs[0]["categoryId"].as_str().unwrap().to_string();

    // filtering by a category returns only that category's questions
    let (s, filtered) = req(
        &t.router,
        Method::GET,
        &format!("/api/questions?categoryId={cat_id}"),
        None,
        None,
    )
    .await;
    assert_eq!(s, StatusCode::OK);
    let filtered = filtered.as_array().unwrap();
    assert!(!filtered.is_empty());
    assert!(filtered.iter().all(|q| q["categoryId"] == cat_id.as_str()));

    // fetch one question by id, and a 404 for a missing one
    let (s, q) = req(
        &t.router,
        Method::GET,
        &format!("/api/questions/{q_id}"),
        None,
        None,
    )
    .await;
    assert_eq!(s, StatusCode::OK);
    assert_eq!(q["id"].as_str().unwrap(), q_id);
    assert!(q["answers"].is_array());

    let (s, _) = req(
        &t.router,
        Method::GET,
        "/api/questions/__missing__",
        None,
        None,
    )
    .await;
    assert_eq!(s, StatusCode::NOT_FOUND);

    let (s, schools) = req(&t.router, Method::GET, "/api/schools", None, None).await;
    assert_eq!(s, StatusCode::OK);
    let schools = schools.as_array().unwrap().clone();
    assert!(!schools.is_empty(), "no schools");
    let school_id = schools[0]["id"].as_str().unwrap().to_string();

    let (s, cities) = req(&t.router, Method::GET, "/api/cities", None, None).await;
    assert_eq!(s, StatusCode::OK);
    assert!(!cities.as_array().unwrap().is_empty());

    // school detail + review flow: the count grows by exactly one
    let (s, detail) = req(
        &t.router,
        Method::GET,
        &format!("/api/schools/{school_id}"),
        None,
        None,
    )
    .await;
    assert_eq!(s, StatusCode::OK);
    let before = detail["reviewCount"].as_i64().unwrap();

    let (s, review) = req(
        &t.router,
        Method::POST,
        &format!("/api/schools/{school_id}/reviews"),
        None,
        Some(json!({ "rating": 5, "comment": "Odlično", "authorName": "Marko" })),
    )
    .await;
    assert_eq!(s, StatusCode::OK);
    assert_eq!(review["authorName"], "Marko");

    let (_, detail) = req(
        &t.router,
        Method::GET,
        &format!("/api/schools/{school_id}"),
        None,
        None,
    )
    .await;
    assert_eq!(detail["reviewCount"].as_i64().unwrap(), before + 1);

    // invalid rating rejected
    let (s, _) = req(
        &t.router,
        Method::POST,
        &format!("/api/schools/{school_id}/reviews"),
        None,
        Some(json!({ "rating": 6, "comment": "", "authorName": "x" })),
    )
    .await;
    assert_eq!(s, StatusCode::BAD_REQUEST);

    t.teardown().await;
}

// ---------------- admin auth + CRUD flow ----------------

#[tokio::test]
async fn admin_auth_and_crud_flow() {
    let t = setup().await;

    // login
    let (s, body) = req(
        &t.router,
        Method::POST,
        "/api/auth/login",
        None,
        Some(json!({ "username": "admin", "password": "admin123" })),
    )
    .await;
    assert_eq!(s, StatusCode::OK);
    assert_eq!(body["requires2fa"], false);
    assert_eq!(body["twofaEnabled"], false);
    let token = body["token"].as_str().unwrap().to_string();

    // wrong password
    let (s, _) = req(
        &t.router,
        Method::POST,
        "/api/auth/login",
        None,
        Some(json!({ "username": "admin", "password": "nope" })),
    )
    .await;
    assert_eq!(s, StatusCode::UNAUTHORIZED);

    // admin route requires a token
    let (s, _) = req(
        &t.router,
        Method::POST,
        "/api/admin/categories",
        None,
        Some(json!({ "id": "cat_x", "name": "X", "iconName": "i", "orderIndex": 9 })),
    )
    .await;
    assert_eq!(s, StatusCode::UNAUTHORIZED);

    // create category — the count grows by exactly one
    let (_, before) = req(&t.router, Method::GET, "/api/categories", None, None).await;
    let n0 = before.as_array().unwrap().len();
    let (s, _) = req(
        &t.router,
        Method::POST,
        "/api/admin/categories",
        Some(&token),
        Some(json!({ "id": "cat_x", "name": "X", "iconName": "i", "orderIndex": 9 })),
    )
    .await;
    assert_eq!(s, StatusCode::OK);

    let (_, cats) = req(&t.router, Method::GET, "/api/categories", None, None).await;
    assert_eq!(cats.as_array().unwrap().len(), n0 + 1);

    // update category
    let (s, _) = req(
        &t.router,
        Method::PUT,
        "/api/admin/categories/cat_x",
        Some(&token),
        Some(json!({ "id": "cat_x", "name": "X2", "iconName": "i", "orderIndex": 9 })),
    )
    .await;
    assert_eq!(s, StatusCode::OK);

    // create a question in it
    let (s, _) = req(
        &t.router,
        Method::POST,
        "/api/admin/questions",
        Some(&token),
        Some(json!({
            "id": "q_x", "categoryId": "cat_x", "text": "?",
            "type": "multipleChoice", "difficulty": 1, "orderIndex": 0,
            "answers": [{ "text": "a", "isCorrect": true, "orderIndex": 0 }]
        })),
    )
    .await;
    assert_eq!(s, StatusCode::OK);

    let (s, q) = req(&t.router, Method::GET, "/api/questions/q_x", None, None).await;
    assert_eq!(s, StatusCode::OK);
    assert_eq!(q["answers"].as_array().unwrap().len(), 1);

    // delete question, then it's gone
    let (s, _) = req(
        &t.router,
        Method::DELETE,
        "/api/admin/questions/q_x",
        Some(&token),
        None,
    )
    .await;
    assert_eq!(s, StatusCode::NO_CONTENT);
    let (s, _) = req(&t.router, Method::GET, "/api/questions/q_x", None, None).await;
    assert_eq!(s, StatusCode::NOT_FOUND);

    // delete category
    let (s, _) = req(
        &t.router,
        Method::DELETE,
        "/api/admin/categories/cat_x",
        Some(&token),
        None,
    )
    .await;
    assert_eq!(s, StatusCode::NO_CONTENT);

    // school CRUD
    let (s, _) = req(
        &t.router,
        Method::POST,
        "/api/admin/schools",
        Some(&token),
        Some(json!({ "id": "s_x", "name": "S", "city": "Testville" })),
    )
    .await;
    assert_eq!(s, StatusCode::OK);
    let (s, _) = req(&t.router, Method::GET, "/api/schools/s_x", None, None).await;
    assert_eq!(s, StatusCode::OK);
    let (s, _) = req(
        &t.router,
        Method::PUT,
        "/api/admin/schools/s_x",
        Some(&token),
        Some(json!({ "id": "s_x", "name": "S2", "city": "Testville" })),
    )
    .await;
    assert_eq!(s, StatusCode::OK);
    let (s, _) = req(
        &t.router,
        Method::DELETE,
        "/api/admin/schools/s_x",
        Some(&token),
        None,
    )
    .await;
    assert_eq!(s, StatusCode::NO_CONTENT);

    t.teardown().await;
}

// ---------------- app-user accounts + progress sync ----------------

#[tokio::test]
async fn user_account_and_progress_flow() {
    let t = setup().await;

    // register
    let (s, body) = req(
        &t.router,
        Method::POST,
        "/api/account/register",
        None,
        Some(json!({ "email": "a@b.com", "password": "secret1" })),
    )
    .await;
    assert_eq!(s, StatusCode::OK);
    assert_eq!(body["email"], "a@b.com");
    let user_token = body["token"].as_str().unwrap().to_string();

    // duplicate + invalid inputs
    for (payload, why) in [
        (json!({ "email": "a@b.com", "password": "secret1" }), "duplicate"),
        (json!({ "email": "bad", "password": "secret1" }), "bad email"),
        (json!({ "email": "c@d.com", "password": "short" }), "short pw"),
    ] {
        let (s, _) = req(&t.router, Method::POST, "/api/account/register", None, Some(payload)).await;
        assert_eq!(s, StatusCode::BAD_REQUEST, "expected 400 for {why}");
    }

    // login (correct + wrong)
    let (s, _) = req(
        &t.router,
        Method::POST,
        "/api/account/login",
        None,
        Some(json!({ "email": "a@b.com", "password": "secret1" })),
    )
    .await;
    assert_eq!(s, StatusCode::OK);
    let (s, _) = req(
        &t.router,
        Method::POST,
        "/api/account/login",
        None,
        Some(json!({ "email": "a@b.com", "password": "wrong" })),
    )
    .await;
    assert_eq!(s, StatusCode::UNAUTHORIZED);

    // progress: empty -> save -> read back
    let (s, prog) = req(&t.router, Method::GET, "/api/account/progress", Some(&user_token), None).await;
    assert_eq!(s, StatusCode::OK);
    assert_eq!(prog, json!({}));

    let blob = json!({
        "attempts": [{ "questionId": "q_001", "categoryId": "cat_signs", "isCorrect": true, "date": 1 }],
        "exams": []
    });
    let (s, _) = req(
        &t.router,
        Method::PUT,
        "/api/account/progress",
        Some(&user_token),
        Some(blob.clone()),
    )
    .await;
    assert_eq!(s, StatusCode::OK);

    let (s, prog) = req(&t.router, Method::GET, "/api/account/progress", Some(&user_token), None).await;
    assert_eq!(s, StatusCode::OK);
    assert_eq!(prog["attempts"].as_array().unwrap().len(), 1);

    // progress requires a user token
    let (s, _) = req(&t.router, Method::GET, "/api/account/progress", None, None).await;
    assert_eq!(s, StatusCode::UNAUTHORIZED);

    // an admin token must NOT unlock user progress, and a user token must NOT
    // unlock admin routes — roles are isolated.
    let admin = admin_token(&t.router).await;
    let (s, _) = req(&t.router, Method::GET, "/api/account/progress", Some(&admin), None).await;
    assert_eq!(s, StatusCode::UNAUTHORIZED);

    let (s, _) = req(
        &t.router,
        Method::POST,
        "/api/admin/categories",
        Some(&user_token),
        Some(json!({ "id": "cat_hack", "name": "H", "iconName": "i", "orderIndex": 0 })),
    )
    .await;
    assert_eq!(s, StatusCode::UNAUTHORIZED);

    t.teardown().await;
}

// ---------------- admin 2FA flow ----------------

#[tokio::test]
async fn admin_2fa_flow() {
    let t = setup().await;

    let token = admin_token(&t.router).await;

    // status: off
    let (s, st) = req(&t.router, Method::GET, "/api/admin/2fa/status", Some(&token), None).await;
    assert_eq!(s, StatusCode::OK);
    assert_eq!(st["enabled"], false);

    // setup requires a session
    let (s, _) = req(&t.router, Method::POST, "/api/admin/2fa/setup", None, None).await;
    assert_eq!(s, StatusCode::UNAUTHORIZED);

    // setup -> secret + otpauth url
    let (s, setup) = req(&t.router, Method::POST, "/api/admin/2fa/setup", Some(&token), None).await;
    assert_eq!(s, StatusCode::OK);
    let secret = setup["secret"].as_str().unwrap().to_string();
    assert!(setup["otpauthUrl"].as_str().unwrap().starts_with("otpauth://"));

    // enabling with a wrong code fails, with the right code succeeds
    let (s, _) = req(
        &t.router,
        Method::POST,
        "/api/admin/2fa/enable",
        Some(&token),
        Some(json!({ "code": "000000" })),
    )
    .await;
    assert_eq!(s, StatusCode::BAD_REQUEST);

    let (s, en) = req(
        &t.router,
        Method::POST,
        "/api/admin/2fa/enable",
        Some(&token),
        Some(json!({ "code": totp_now(&secret) })),
    )
    .await;
    assert_eq!(s, StatusCode::OK);
    assert_eq!(en["enabled"], true);

    // now a plain login is gated: no token, an mfaToken instead
    let (s, body) = req(
        &t.router,
        Method::POST,
        "/api/auth/login",
        None,
        Some(json!({ "username": "admin", "password": "admin123" })),
    )
    .await;
    assert_eq!(s, StatusCode::OK);
    assert_eq!(body["requires2fa"], true);
    assert!(body["token"].is_null());
    let mfa = body["mfaToken"].as_str().unwrap().to_string();

    // wrong code rejected
    let (s, _) = req(
        &t.router,
        Method::POST,
        "/api/auth/login/2fa",
        Some(&mfa),
        Some(json!({ "code": "000000" })),
    )
    .await;
    assert_eq!(s, StatusCode::UNAUTHORIZED);

    // right code -> full admin token
    let (s, verified) = req(
        &t.router,
        Method::POST,
        "/api/auth/login/2fa",
        Some(&mfa),
        Some(json!({ "code": totp_now(&secret) })),
    )
    .await;
    assert_eq!(s, StatusCode::OK);
    let full_token = verified["token"].as_str().unwrap().to_string();

    // the full token works on admin routes
    let (s, st) = req(&t.router, Method::GET, "/api/admin/2fa/status", Some(&full_token), None).await;
    assert_eq!(s, StatusCode::OK);
    assert_eq!(st["enabled"], true);

    // disable -> back to direct login
    let (s, dis) = req(
        &t.router,
        Method::POST,
        "/api/admin/2fa/disable",
        Some(&full_token),
        Some(json!({ "code": totp_now(&secret) })),
    )
    .await;
    assert_eq!(s, StatusCode::OK);
    assert_eq!(dis["enabled"], false);

    let (s, body) = req(
        &t.router,
        Method::POST,
        "/api/auth/login",
        None,
        Some(json!({ "username": "admin", "password": "admin123" })),
    )
    .await;
    assert_eq!(s, StatusCode::OK);
    assert_eq!(body["requires2fa"], false);
    assert!(body["token"].is_string());

    t.teardown().await;
}
