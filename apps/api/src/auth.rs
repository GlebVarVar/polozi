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

use totp_rs::{Algorithm, Secret, TOTP};

use crate::{
    error::AppError,
    models::{
        AuthResponse, LoginInput, LoginResponse, TwoFaCodeInput, TwoFaSetupResponse,
        TwoFaStatusResponse, UserAuthInput,
    },
};

const TOTP_ISSUER: &str = "Položi! Backoffice";

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

fn make_token_with(sub: &str, role: &str, ttl: Duration) -> Result<String, AppError> {
    let exp = (Utc::now() + ttl).timestamp() as usize;
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

fn make_token(sub: &str, role: &str) -> Result<String, AppError> {
    make_token_with(sub, role, Duration::days(30))
}

// ---------- TOTP helpers ----------

fn totp_from_secret(secret_b32: &str, account: &str) -> Result<TOTP, AppError> {
    let bytes = Secret::Encoded(secret_b32.to_string())
        .to_bytes()
        .map_err(|_| AppError::Internal("invalid totp secret".into()))?;
    TOTP::new(
        Algorithm::SHA1,
        6,
        1, // skew: accept the adjacent 30s windows for clock drift
        30,
        bytes,
        Some(TOTP_ISSUER.to_string()),
        account.to_string(),
    )
    .map_err(|e| AppError::Internal(e.to_string()))
}

fn verify_totp(secret_b32: &str, account: &str, code: &str) -> Result<bool, AppError> {
    let totp = totp_from_secret(secret_b32, account)?;
    totp
        .check_current(code.trim())
        .map_err(|e| AppError::Internal(e.to_string()))
}

fn bearer(headers: &axum::http::HeaderMap) -> Option<String> {
    headers
        .get(axum::http::header::AUTHORIZATION)?
        .to_str()
        .ok()?
        .strip_prefix("Bearer ")
        .map(str::to_string)
}

fn decode_claims(token: &str) -> Result<Claims, AppError> {
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(jwt_secret().as_bytes()),
        &Validation::default(),
    )
    .map(|d| d.claims)
    .map_err(|_| AppError::Unauthorized)
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
    let row: Option<(String, bool)> =
        sqlx::query_as("SELECT password_hash, totp_enabled FROM admins WHERE username = $1")
            .bind(&input.username)
            .fetch_optional(&pool)
            .await?;

    let Some((hash, totp_enabled)) = row else {
        return Err(AppError::Unauthorized);
    };
    if !verify_password(&input.password, &hash) {
        return Err(AppError::Unauthorized);
    }

    if totp_enabled {
        // Password OK, but require a TOTP code. Hand back a short-lived token
        // that only /api/auth/login/2fa accepts.
        let mfa_token = make_token_with(&input.username, "mfa", Duration::minutes(5))?;
        return Ok(Json(LoginResponse {
            token: None,
            requires_2fa: true,
            mfa_token: Some(mfa_token),
            twofa_enabled: true,
        }));
    }

    let token = make_token(&input.username, "admin")?;
    Ok(Json(LoginResponse {
        token: Some(token),
        requires_2fa: false,
        mfa_token: None,
        twofa_enabled: false,
    }))
}

/// POST /api/auth/login/2fa — exchange an MFA token + TOTP code for a full token.
pub async fn login_2fa(
    axum::extract::State(pool): axum::extract::State<PgPool>,
    headers: axum::http::HeaderMap,
    Json(input): Json<TwoFaCodeInput>,
) -> Result<Json<LoginResponse>, AppError> {
    let mfa_token = bearer(&headers).ok_or(AppError::Unauthorized)?;
    let claims = decode_claims(&mfa_token)?;
    if claims.role != "mfa" {
        return Err(AppError::Unauthorized);
    }
    let username = claims.sub;

    let row: Option<(bool, Option<String>)> =
        sqlx::query_as("SELECT totp_enabled, totp_secret FROM admins WHERE username = $1")
            .bind(&username)
            .fetch_optional(&pool)
            .await?;
    let Some((true, Some(secret))) = row else {
        return Err(AppError::Unauthorized);
    };
    if !verify_totp(&secret, &username, &input.code)? {
        return Err(AppError::Unauthorized);
    }

    let token = make_token(&username, "admin")?;
    Ok(Json(LoginResponse {
        token: Some(token),
        requires_2fa: false,
        mfa_token: None,
        twofa_enabled: true,
    }))
}

/// GET /api/admin/2fa/status — whether 2FA is enabled for the current admin.
pub async fn twofa_status(
    admin: AdminUser,
    axum::extract::State(pool): axum::extract::State<PgPool>,
) -> Result<Json<TwoFaStatusResponse>, AppError> {
    let (enabled,): (bool,) =
        sqlx::query_as("SELECT totp_enabled FROM admins WHERE username = $1")
            .bind(&admin.0)
            .fetch_one(&pool)
            .await?;
    Ok(Json(TwoFaStatusResponse { enabled }))
}

/// POST /api/admin/2fa/setup — generate a fresh secret (not yet enabled).
pub async fn twofa_setup(
    admin: AdminUser,
    axum::extract::State(pool): axum::extract::State<PgPool>,
) -> Result<Json<TwoFaSetupResponse>, AppError> {
    let (enabled,): (bool,) =
        sqlx::query_as("SELECT totp_enabled FROM admins WHERE username = $1")
            .bind(&admin.0)
            .fetch_one(&pool)
            .await?;
    if enabled {
        return Err(AppError::BadRequest("2FA is already enabled".into()));
    }

    let secret = Secret::generate_secret().to_encoded().to_string();
    let totp = totp_from_secret(&secret, &admin.0)?;
    let otpauth_url = totp.get_url();

    sqlx::query("UPDATE admins SET totp_secret = $1 WHERE username = $2")
        .bind(&secret)
        .bind(&admin.0)
        .execute(&pool)
        .await?;

    Ok(Json(TwoFaSetupResponse {
        secret,
        otpauth_url,
    }))
}

/// POST /api/admin/2fa/enable — confirm a code and turn 2FA on.
pub async fn twofa_enable(
    admin: AdminUser,
    axum::extract::State(pool): axum::extract::State<PgPool>,
    Json(input): Json<TwoFaCodeInput>,
) -> Result<Json<TwoFaStatusResponse>, AppError> {
    let row: Option<(Option<String>, bool)> =
        sqlx::query_as("SELECT totp_secret, totp_enabled FROM admins WHERE username = $1")
            .bind(&admin.0)
            .fetch_optional(&pool)
            .await?;
    let Some((Some(secret), enabled)) = row else {
        return Err(AppError::BadRequest("run setup first".into()));
    };
    if enabled {
        return Err(AppError::BadRequest("2FA is already enabled".into()));
    }
    if !verify_totp(&secret, &admin.0, &input.code)? {
        return Err(AppError::BadRequest("invalid code".into()));
    }

    sqlx::query("UPDATE admins SET totp_enabled = TRUE WHERE username = $1")
        .bind(&admin.0)
        .execute(&pool)
        .await?;
    Ok(Json(TwoFaStatusResponse { enabled: true }))
}

/// POST /api/admin/2fa/disable — turn 2FA off (requires a current code).
pub async fn twofa_disable(
    admin: AdminUser,
    axum::extract::State(pool): axum::extract::State<PgPool>,
    Json(input): Json<TwoFaCodeInput>,
) -> Result<Json<TwoFaStatusResponse>, AppError> {
    let row: Option<(Option<String>, bool)> =
        sqlx::query_as("SELECT totp_secret, totp_enabled FROM admins WHERE username = $1")
            .bind(&admin.0)
            .fetch_optional(&pool)
            .await?;
    let Some((Some(secret), true)) = row else {
        return Err(AppError::BadRequest("2FA is not enabled".into()));
    };
    if !verify_totp(&secret, &admin.0, &input.code)? {
        return Err(AppError::BadRequest("invalid code".into()));
    }

    sqlx::query("UPDATE admins SET totp_enabled = FALSE, totp_secret = NULL WHERE username = $1")
        .bind(&admin.0)
        .execute(&pool)
        .await?;
    Ok(Json(TwoFaStatusResponse { enabled: false }))
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
