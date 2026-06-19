use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use utoipa::ToSchema;

// ---------- Categories ----------

#[derive(Debug, Serialize, FromRow, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct Category {
    pub id: String,
    pub name: String,
    pub icon_name: String,
    pub order_index: i32,
}

#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CategoryInput {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub icon_name: String,
    #[serde(default)]
    pub order_index: i32,
}

// ---------- Answers ----------

#[derive(Debug, Serialize, FromRow, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct Answer {
    pub id: i64,
    pub text: String,
    pub is_correct: bool,
    pub order_index: i32,
}

#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct AnswerInput {
    pub text: String,
    #[serde(default)]
    pub is_correct: bool,
    #[serde(default)]
    pub order_index: i32,
}

// ---------- Questions ----------

#[derive(Debug, Serialize, FromRow)]
pub struct QuestionRow {
    pub id: String,
    pub category_id: String,
    pub text: String,
    pub r#type: String,
    pub image_name: Option<String>,
    pub explanation: Option<String>,
    pub difficulty: i32,
    pub order_index: i32,
    pub correct_text_answer: Option<String>,
}

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct Question {
    pub id: String,
    pub category_id: String,
    pub text: String,
    #[serde(rename = "type")]
    pub r#type: String,
    pub image_name: Option<String>,
    pub explanation: Option<String>,
    pub difficulty: i32,
    pub order_index: i32,
    pub correct_text_answer: Option<String>,
    pub answers: Vec<Answer>,
}

#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct QuestionInput {
    pub id: String,
    pub category_id: String,
    pub text: String,
    #[serde(rename = "type", default = "default_question_type")]
    pub r#type: String,
    pub image_name: Option<String>,
    pub explanation: Option<String>,
    #[serde(default = "default_difficulty")]
    pub difficulty: i32,
    #[serde(default)]
    pub order_index: i32,
    pub correct_text_answer: Option<String>,
    #[serde(default)]
    pub answers: Vec<AnswerInput>,
}

fn default_question_type() -> String {
    "multipleChoice".to_string()
}
fn default_difficulty() -> i32 {
    1
}

// ---------- Schools ----------

#[derive(Debug, Serialize, FromRow, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct School {
    pub id: String,
    pub name: String,
    pub city: String,
    pub address: String,
    pub phone: String,
    pub price_from: i32,
    pub price_to: i32,
    pub website: Option<String>,
    #[serde(rename = "googleMapsURL")]
    #[sqlx(rename = "google_maps_url")]
    pub google_maps_url: Option<String>,
}

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct SchoolDetail {
    #[serde(flatten)]
    pub school: School,
    pub average_rating: f64,
    pub review_count: i64,
    pub reviews: Vec<Review>,
}

#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct SchoolInput {
    pub id: String,
    pub name: String,
    pub city: String,
    #[serde(default)]
    pub address: String,
    #[serde(default)]
    pub phone: String,
    #[serde(default)]
    pub price_from: i32,
    #[serde(default)]
    pub price_to: i32,
    pub website: Option<String>,
    #[serde(rename = "googleMapsURL")]
    pub google_maps_url: Option<String>,
}

// ---------- Reviews ----------

#[derive(Debug, Serialize, FromRow, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct Review {
    pub id: i64,
    pub rating: i32,
    pub comment: String,
    pub author_name: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ReviewInput {
    pub rating: i32,
    #[serde(default)]
    pub comment: String,
    #[serde(default)]
    pub author_name: String,
}

// ---------- Auth ----------

#[derive(Debug, Deserialize, ToSchema)]
pub struct LoginInput {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct LoginResponse {
    pub token: String,
}
