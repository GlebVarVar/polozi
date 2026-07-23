use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use axum::{
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
    Json,
};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::PgPool;

use crate::{
    error::AppError,
    models::{AuthResponse, LoginInput, LoginResponse, UserAuthInput},
};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    /// "admin" for backoffice admins, "user" for app users. Defaults to empty
    /// for tokens minted before roles existed (those no longer pass either guard).
    #[serde(default)]
    pub role: String,
    pub exp: usize,
}

fn jwt_secret() -> String {
    std::env::var("JWT_SECRET").unwrap_or_else(|_| "dev-insecure-secret-change-me".to_string())
}

pub fn hash_password(password: &str) -> anyhow::Result<String> {
    let salt = SaltString::generate(&mut OsRng);
    let hash = Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| anyhow::anyhow!(e.to_string()))?
        .to_string();
    Ok(hash)
}

fn verify_password(password: &str, hash: &str) -> bool {
    match PasswordHash::new(hash) {
        Ok(parsed) => Argon2::default()
            .verify_password(password.as_bytes(), &parsed)
            .is_ok(),
        Err(_) => false,
    }
}

fn make_token(sub: &str, role: &str) -> Result<String, AppError> {
    let exp = (Utc::now() + Duration::days(30)).timestamp() as usize;
    let claims = Claims {
        sub: sub.to_string(),
        role: role.to_string(),
        exp,
    };
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(jwt_secret().as_bytes()),
    )
    .map_err(|e| AppError::Internal(e.to_string()))
}

/// POST /api/auth/login
#[utoipa::path(
    post,
    path = "/api/auth/login",
    tag = "Auth",
    request_body = LoginInput,
    responses(
        (status = 200, description = "Logged in", body = LoginResponse),
        (status = 401, description = "Invalid credentials")
    )
)]
pub async fn login(
    axum::extract::State(pool): axum::extract::State<PgPool>,
    Json(input): Json<LoginInput>,
) -> Result<Json<LoginResponse>, AppError> {
    let row: Option<(String,)> =
        sqlx::query_as("SELECT password_hash FROM admins WHERE username = $1")
            .bind(&input.username)
            .fetch_optional(&pool)
            .await?;

    let Some((hash,)) = row else {
        return Err(AppError::Unauthorized);
    };
    if !verify_password(&input.password, &hash) {
        return Err(AppError::Unauthorized);
    }

    let token = make_token(&input.username, "admin")?;
    Ok(Json(LoginResponse { token }))
}

/// POST /api/account/register — create an app-user account.
#[utoipa::path(
    post,
    path = "/api/account/register",
    tag = "Account",
    request_body = UserAuthInput,
    responses(
        (status = 200, description = "Registered", body = AuthResponse),
        (status = 400, description = "Invalid input or email taken")
    )
)]
pub async fn register(
    axum::extract::State(pool): axum::extract::State<PgPool>,
    Json(input): Json<UserAuthInput>,
) -> Result<Json<AuthResponse>, AppError> {
    let email = input.email.trim().to_lowercase();
    if !email.contains('@') || email.len() < 3 {
        return Err(AppError::BadRequest("invalid email".into()));
    }
    if input.password.len() < 6 {
        return Err(AppError::BadRequest(
            "password must be at least 6 characters".into(),
        ));
    }

    let existing: Option<(i64,)> = sqlx::query_as("SELECT id FROM users WHERE email = $1")
        .bind(&email)
        .fetch_optional(&pool)
        .await?;
    if existing.is_some() {
        return Err(AppError::BadRequest("email already registered".into()));
    }

    let hash = hash_password(&input.password).map_err(|e| AppError::Internal(e.to_string()))?;
    let (id,): (i64,) =
        sqlx::query_as("INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id")
            .bind(&email)
            .bind(&hash)
            .fetch_one(&pool)
            .await?;

    let token = make_token(&id.to_string(), "user")?;
    Ok(Json(AuthResponse { token, email }))
}

/// POST /api/account/login — log an app user in.
#[utoipa::path(
    post,
    path = "/api/account/login",
    tag = "Account",
    request_body = UserAuthInput,
    responses(
        (status = 200, description = "Logged in", body = AuthResponse),
        (status = 401, description = "Invalid credentials")
    )
)]
pub async fn user_login(
    axum::extract::State(pool): axum::extract::State<PgPool>,
    Json(input): Json<UserAuthInput>,
) -> Result<Json<AuthResponse>, AppError> {
    let email = input.email.trim().to_lowercase();
    let row: Option<(i64, String)> =
        sqlx::query_as("SELECT id, password_hash FROM users WHERE email = $1")
            .bind(&email)
            .fetch_optional(&pool)
            .await?;

    let Some((id, hash)) = row else {
        return Err(AppError::Unauthorized);
    };
    if !verify_password(&input.password, &hash) {
        return Err(AppError::Unauthorized);
    }

    let token = make_token(&id.to_string(), "user")?;
    Ok(Json(AuthResponse { token, email }))
}

/// Extractor that requires a valid admin JWT in the `Authorization: Bearer` header.
pub struct AdminUser(#[allow(dead_code)] pub String);

impl<S> FromRequestParts<S> for AdminUser
where
    S: Send + Sync,
{
    type Rejection = (StatusCode, Json<serde_json::Value>);

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let reject = || {
            (
                StatusCode::UNAUTHORIZED,
                Json(json!({ "error": "Unauthorized" })),
            )
        };

        let header = parts
            .headers
            .get(axum::http::header::AUTHORIZATION)
            .and_then(|v| v.to_str().ok())
            .ok_or_else(reject)?;

        let token = header.strip_prefix("Bearer ").ok_or_else(reject)?;

        let data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(jwt_secret().as_bytes()),
            &Validation::default(),
        )
        .map_err(|_| reject())?;

        if data.claims.role != "admin" {
            return Err(reject());
        }

        Ok(AdminUser(data.claims.sub))
    }
}

/// Extractor that requires a valid app-user JWT. Holds the user id.
pub struct AuthUser(pub i64);

impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = (StatusCode, Json<serde_json::Value>);

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let reject = || {
            (
                StatusCode::UNAUTHORIZED,
                Json(json!({ "error": "Unauthorized" })),
            )
        };

        let header = parts
            .headers
            .get(axum::http::header::AUTHORIZATION)
            .and_then(|v| v.to_str().ok())
            .ok_or_else(reject)?;

        let token = header.strip_prefix("Bearer ").ok_or_else(reject)?;

        let data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(jwt_secret().as_bytes()),
            &Validation::default(),
        )
        .map_err(|_| reject())?;

        if data.claims.role != "user" {
            return Err(reject());
        }

        let id = data.claims.sub.parse::<i64>().map_err(|_| reject())?;
        Ok(AuthUser(id))
    }
}
