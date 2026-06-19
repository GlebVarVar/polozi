mod auth;
mod error;
mod models;
mod routes;
mod seed;

use axum::{
    routing::{delete, get, post, put},
    Json, Router,
};
use serde::Serialize;
use sqlx::postgres::PgPoolOptions;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use utoipa::{
    openapi::security::{Http, HttpAuthScheme, SecurityScheme},
    Modify, OpenApi, ToSchema,
};
use utoipa_swagger_ui::SwaggerUi;

#[derive(Serialize, ToSchema)]
struct HealthResponse {
    status: &'static str,
    version: &'static str,
}

#[utoipa::path(get, path = "/health", tag = "System",
    responses((status = 200, body = HealthResponse)))]
async fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok",
        version: env!("CARGO_PKG_VERSION"),
    })
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
        auth::login,
        routes::list_categories, routes::create_category, routes::update_category, routes::delete_category,
        routes::list_questions, routes::get_question, routes::create_question, routes::update_question, routes::delete_question,
        routes::list_schools, routes::list_cities, routes::get_school, routes::create_school, routes::update_school, routes::delete_school,
        routes::add_review,
    ),
    components(schemas(
        HealthResponse,
        models::Category, models::CategoryInput,
        models::Answer, models::AnswerInput,
        models::Question, models::QuestionInput,
        models::School, models::SchoolDetail, models::SchoolInput,
        models::Review, models::ReviewInput,
        models::LoginInput, models::LoginResponse,
    ))
)]
struct ApiDoc;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "polozi_api=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://polozi:polozi@localhost:5432/polozi".to_string());

    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&database_url)
        .await?;

    sqlx::migrate!("./migrations").run(&pool).await?;
    seed::seed(&pool).await?;

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/health", get(health))
        .route("/api/auth/login", post(auth::login))
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
        .with_state(pool);

    let port = std::env::var("PORT").unwrap_or_else(|_| "3001".to_string());
    let addr = format!("0.0.0.0:{port}");
    tracing::info!("listening on {addr}");
    tracing::info!("swagger UI at http://localhost:{port}/swagger");

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}
