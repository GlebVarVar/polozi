pub mod auth;
pub mod error;
pub mod models;
pub mod routes;
pub mod seed;

use axum::{
    extract::State,
    http::StatusCode,
    routing::{delete, get, post, put},
    Json, Router,
};
use serde::Serialize;
use sqlx::PgPool;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};
use utoipa::{
    openapi::security::{Http, HttpAuthScheme, SecurityScheme},
    Modify, OpenApi, ToSchema,
};
use utoipa_swagger_ui::SwaggerUi;

#[derive(Serialize, ToSchema)]
pub struct HealthResponse {
    pub status: &'static str,
    pub version: &'static str,
}

/// Liveness probe — does not touch the database.
#[utoipa::path(get, path = "/health", tag = "System",
    responses((status = 200, body = HealthResponse)))]
pub async fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok",
        version: env!("CARGO_PKG_VERSION"),
    })
}

#[derive(Serialize, ToSchema)]
pub struct HealthDbResponse {
    pub status: &'static str,
    pub db: &'static str,
}

/// Readiness probe — verifies the database round-trips.
/// Returns 503 when the database is unreachable so orchestrators can pull
/// the instance from rotation without restarting it.
#[utoipa::path(get, path = "/health/db", tag = "System",
    responses(
        (status = 200, body = HealthDbResponse),
        (status = 503, body = HealthDbResponse),
    ))]
pub async fn health_db(State(pool): State<PgPool>) -> (StatusCode, Json<HealthDbResponse>) {
    match sqlx::query_scalar::<_, i32>("SELECT 1")
        .fetch_one(&pool)
        .await
    {
        Ok(_) => (
            StatusCode::OK,
            Json(HealthDbResponse { status: "ok", db: "up" }),
        ),
        Err(e) => {
            tracing::error!("db health failed: {e}");
            (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(HealthDbResponse {
                    status: "degraded",
                    db: "down",
                }),
            )
        }
    }
}

struct SecurityAddon;
impl Modify for SecurityAddon {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        if let Some(components) = openapi.components.as_mut() {
            components.add_security_scheme(
                "bearer",
                SecurityScheme::Http(Http::new(HttpAuthScheme::Bearer)),
            );
        }
    }
}

#[derive(OpenApi)]
#[openapi(
    info(title = "Položi! API", version = "0.1.0", description = "API for the Položi! driving exam app"),
    modifiers(&SecurityAddon),
    paths(
        health,
        health_db,
        auth::login,
        auth::register, auth::user_login,
        routes::list_categories, routes::create_category, routes::update_category, routes::delete_category,
        routes::list_questions, routes::get_question, routes::create_question, routes::update_question, routes::delete_question,
        routes::list_schools, routes::list_cities, routes::get_school, routes::create_school, routes::update_school, routes::delete_school,
        routes::add_review,
    ),
    components(schemas(
        HealthResponse,
        HealthDbResponse,
        models::Category, models::CategoryInput,
        models::Answer, models::AnswerInput,
        models::Question, models::QuestionInput,
        models::School, models::SchoolDetail, models::SchoolInput,
        models::Review, models::ReviewInput,
        models::LoginInput, models::LoginResponse,
        models::UserAuthInput, models::AuthResponse,
    ))
)]
pub struct ApiDoc;

/// Build the full application router (all routes + Swagger UI) over a pool.
pub fn app(pool: PgPool) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        .route("/health", get(health))
        .route("/health/db", get(health_db))
        .route("/api/auth/login", post(auth::login))
        .route("/api/auth/login/2fa", post(auth::login_2fa))
        // admin 2FA management
        .route("/api/admin/2fa/status", get(auth::twofa_status))
        .route("/api/admin/2fa/setup", post(auth::twofa_setup))
        .route("/api/admin/2fa/enable", post(auth::twofa_enable))
        .route("/api/admin/2fa/disable", post(auth::twofa_disable))
        // app-user accounts + progress sync
        .route("/api/account/register", post(auth::register))
        .route("/api/account/login", post(auth::user_login))
        .route(
            "/api/account/progress",
            get(routes::get_progress).put(routes::put_progress),
        )
        // public content
        .route("/api/categories", get(routes::list_categories))
        .route("/api/questions", get(routes::list_questions))
        .route("/api/questions/{id}", get(routes::get_question))
        .route("/api/schools", get(routes::list_schools))
        .route("/api/cities", get(routes::list_cities))
        .route("/api/schools/{id}", get(routes::get_school))
        .route("/api/schools/{id}/reviews", post(routes::add_review))
        // admin: categories
        .route("/api/admin/categories", post(routes::create_category))
        .route("/api/admin/categories/{id}", put(routes::update_category))
        .route("/api/admin/categories/{id}", delete(routes::delete_category))
        // admin: questions
        .route("/api/admin/questions", post(routes::create_question))
        .route("/api/admin/questions/{id}", put(routes::update_question))
        .route("/api/admin/questions/{id}", delete(routes::delete_question))
        // admin: schools
        .route("/api/admin/schools", post(routes::create_school))
        .route("/api/admin/schools/{id}", put(routes::update_school))
        .route("/api/admin/schools/{id}", delete(routes::delete_school))
        .merge(SwaggerUi::new("/swagger").url("/api-docs/openapi.json", ApiDoc::openapi()))
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .with_state(pool)
}

/// Run pending SQL migrations.
pub async fn run_migrations(pool: &PgPool) -> anyhow::Result<()> {
    sqlx::migrate!("./migrations").run(pool).await?;
    Ok(())
}
