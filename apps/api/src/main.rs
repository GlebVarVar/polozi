use axum::{
    extract::{Path, Query},
    routing::get,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use utoipa::{OpenApi, ToSchema};
use utoipa_swagger_ui::SwaggerUi;

#[derive(OpenApi)]
#[openapi(
    info(
        title = "Položi! API",
        version = "0.1.0",
        description = "API for the Položi! driving exam preparation app"
    ),
    paths(health, list_categories, get_category, list_questions),
    components(schemas(
        HealthResponse,
        Category,
        Question,
        Answer,
    ))
)]
struct ApiDoc;

// --- Health ---

#[derive(Serialize, ToSchema)]
struct HealthResponse {
    status: &'static str,
    version: &'static str,
}

#[utoipa::path(
    get,
    path = "/health",
    tag = "System",
    responses((status = 200, description = "Service is healthy", body = HealthResponse))
)]
async fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok",
        version: env!("CARGO_PKG_VERSION"),
    })
}

// --- Categories ---

#[derive(Serialize, ToSchema)]
struct Category {
    id: u32,
    name: String,
    question_count: u32,
}

fn mock_categories() -> Vec<Category> {
    vec![
        Category { id: 1, name: "Saobraćajni znakovi".into(), question_count: 120 },
        Category { id: 2, name: "Pravila saobraćaja".into(), question_count: 95 },
        Category { id: 3, name: "Prva pomoć".into(), question_count: 40 },
        Category { id: 4, name: "Propisi".into(), question_count: 60 },
    ]
}

#[utoipa::path(
    get,
    path = "/api/categories",
    tag = "Categories",
    responses((status = 200, description = "List of question categories", body = Vec<Category>))
)]
async fn list_categories() -> Json<Vec<Category>> {
    Json(mock_categories())
}

#[utoipa::path(
    get,
    path = "/api/categories/{id}",
    tag = "Categories",
    params(("id" = u32, Path, description = "Category ID")),
    responses(
        (status = 200, description = "Category found", body = Category),
        (status = 404, description = "Category not found")
    )
)]
async fn get_category(Path(id): Path<u32>) -> Result<Json<Category>, axum::http::StatusCode> {
    mock_categories()
        .into_iter()
        .find(|c| c.id == id)
        .map(Json)
        .ok_or(axum::http::StatusCode::NOT_FOUND)
}

// --- Questions ---

#[derive(Serialize, ToSchema)]
struct Answer {
    id: u32,
    text: String,
    is_correct: bool,
}

#[derive(Serialize, ToSchema)]
struct Question {
    id: u32,
    category_id: u32,
    text: String,
    answers: Vec<Answer>,
}

#[derive(Deserialize, utoipa::IntoParams)]
struct QuestionsQuery {
    /// Filter by category ID
    category_id: Option<u32>,
    /// Maximum number of questions to return
    limit: Option<u32>,
}

fn mock_questions() -> Vec<Question> {
    vec![
        Question {
            id: 1,
            category_id: 1,
            text: "Šta znači ovaj saobraćajni znak?".into(),
            answers: vec![
                Answer { id: 1, text: "Zabrana zaustavljanja".into(), is_correct: false },
                Answer { id: 2, text: "Zabrana parkiranja".into(), is_correct: true },
                Answer { id: 3, text: "Zabrana prolaza".into(), is_correct: false },
            ],
        },
        Question {
            id: 2,
            category_id: 2,
            text: "Ko ima prednost na raskrsnici bez signalizacije?".into(),
            answers: vec![
                Answer { id: 4, text: "Vozilo koje dolazi sa leve strane".into(), is_correct: false },
                Answer { id: 5, text: "Vozilo koje dolazi sa desne strane".into(), is_correct: true },
                Answer { id: 6, text: "Vozilo koje ide brže".into(), is_correct: false },
            ],
        },
        Question {
            id: 3,
            category_id: 3,
            text: "Koji je prvi korak kod pružanja prve pomoći?".into(),
            answers: vec![
                Answer { id: 7, text: "Proveriti disajne puteve".into(), is_correct: false },
                Answer { id: 8, text: "Obezbediti mesto nezgode".into(), is_correct: true },
                Answer { id: 9, text: "Pozvati hitnu pomoć".into(), is_correct: false },
            ],
        },
    ]
}

#[utoipa::path(
    get,
    path = "/api/questions",
    tag = "Questions",
    params(QuestionsQuery),
    responses((status = 200, description = "List of questions", body = Vec<Question>))
)]
async fn list_questions(Query(params): Query<QuestionsQuery>) -> Json<Vec<Question>> {
    let mut questions = mock_questions();

    if let Some(cat_id) = params.category_id {
        questions.retain(|q| q.category_id == cat_id);
    }

    if let Some(limit) = params.limit {
        questions.truncate(limit as usize);
    }

    Json(questions)
}

// --- Main ---

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "polozi_api=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/health", get(health))
        .route("/api/categories", get(list_categories))
        .route("/api/categories/{id}", get(get_category))
        .route("/api/questions", get(list_questions))
        .merge(SwaggerUi::new("/swagger").url("/api-docs/openapi.json", ApiDoc::openapi()))
        .layer(TraceLayer::new_for_http())
        .layer(cors);

    let addr = "0.0.0.0:3001";
    tracing::info!("listening on {addr}");
    tracing::info!("swagger UI at http://localhost:3001/swagger");

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
