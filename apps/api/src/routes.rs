use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde::Deserialize;
use sqlx::PgPool;

use crate::{
    auth::AdminUser,
    error::{AppError, AppResult},
    models::*,
};

// ===================== Categories =====================

/// GET /api/categories
#[utoipa::path(get, path = "/api/categories", tag = "Categories",
    responses((status = 200, body = Vec<Category>)))]
pub async fn list_categories(State(pool): State<PgPool>) -> AppResult<Json<Vec<Category>>> {
    let rows = sqlx::query_as::<_, Category>(
        "SELECT id, name, icon_name, order_index FROM categories ORDER BY order_index, name",
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

/// POST /api/admin/categories
#[utoipa::path(post, path = "/api/admin/categories", tag = "Admin: Categories",
    request_body = CategoryInput, security(("bearer" = [])),
    responses((status = 200, body = Category), (status = 401)))]
pub async fn create_category(
    _admin: AdminUser,
    State(pool): State<PgPool>,
    Json(input): Json<CategoryInput>,
) -> AppResult<Json<Category>> {
    let row = sqlx::query_as::<_, Category>(
        "INSERT INTO categories (id, name, icon_name, order_index) VALUES ($1,$2,$3,$4)
         RETURNING id, name, icon_name, order_index",
    )
    .bind(&input.id)
    .bind(&input.name)
    .bind(&input.icon_name)
    .bind(input.order_index)
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

/// PUT /api/admin/categories/{id}
#[utoipa::path(put, path = "/api/admin/categories/{id}", tag = "Admin: Categories",
    params(("id" = String, Path)), request_body = CategoryInput, security(("bearer" = [])),
    responses((status = 200, body = Category), (status = 404)))]
pub async fn update_category(
    _admin: AdminUser,
    State(pool): State<PgPool>,
    Path(id): Path<String>,
    Json(input): Json<CategoryInput>,
) -> AppResult<Json<Category>> {
    let row = sqlx::query_as::<_, Category>(
        "UPDATE categories SET name=$2, icon_name=$3, order_index=$4 WHERE id=$1
         RETURNING id, name, icon_name, order_index",
    )
    .bind(&id)
    .bind(&input.name)
    .bind(&input.icon_name)
    .bind(input.order_index)
    .fetch_optional(&pool)
    .await?
    .ok_or(AppError::NotFound)?;
    Ok(Json(row))
}

/// DELETE /api/admin/categories/{id}
#[utoipa::path(delete, path = "/api/admin/categories/{id}", tag = "Admin: Categories",
    params(("id" = String, Path)), security(("bearer" = [])),
    responses((status = 204), (status = 404)))]
pub async fn delete_category(
    _admin: AdminUser,
    State(pool): State<PgPool>,
    Path(id): Path<String>,
) -> AppResult<axum::http::StatusCode> {
    let res = sqlx::query("DELETE FROM categories WHERE id=$1")
        .bind(&id)
        .execute(&pool)
        .await?;
    if res.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }
    Ok(axum::http::StatusCode::NO_CONTENT)
}

// ===================== Questions =====================

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuestionsQuery {
    pub category_id: Option<String>,
    pub difficulty: Option<i32>,
    pub limit: Option<i64>,
}

async fn load_answers(pool: &PgPool, question_ids: &[String]) -> AppResult<Vec<(String, Answer)>> {
    if question_ids.is_empty() {
        return Ok(vec![]);
    }
    let rows = sqlx::query_as::<_, (String, i64, String, bool, i32)>(
        "SELECT question_id, id, text, is_correct, order_index FROM answers
         WHERE question_id = ANY($1) ORDER BY order_index, id",
    )
    .bind(question_ids)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(|(qid, id, text, is_correct, order_index)| {
            (
                qid,
                Answer {
                    id,
                    text,
                    is_correct,
                    order_index,
                },
            )
        })
        .collect())
}

fn assemble(rows: Vec<QuestionRow>, answers: Vec<(String, Answer)>) -> Vec<Question> {
    use std::collections::HashMap;
    let mut grouped: HashMap<String, Vec<Answer>> = HashMap::new();
    for (qid, a) in answers {
        grouped.entry(qid).or_default().push(a);
    }
    rows.into_iter()
        .map(|r| Question {
            answers: grouped.remove(&r.id).unwrap_or_default(),
            id: r.id,
            category_id: r.category_id,
            text: r.text,
            r#type: r.r#type,
            image_name: r.image_name,
            explanation: r.explanation,
            difficulty: r.difficulty,
            order_index: r.order_index,
            correct_text_answer: r.correct_text_answer,
        })
        .collect()
}

/// GET /api/questions
#[utoipa::path(get, path = "/api/questions", tag = "Questions",
    params(("categoryId" = Option<String>, Query), ("difficulty" = Option<i32>, Query), ("limit" = Option<i64>, Query)),
    responses((status = 200, body = Vec<Question>)))]
pub async fn list_questions(
    State(pool): State<PgPool>,
    Query(q): Query<QuestionsQuery>,
) -> AppResult<Json<Vec<Question>>> {
    let rows = sqlx::query_as::<_, QuestionRow>(
        "SELECT id, category_id, text, type, image_name, explanation, difficulty, order_index, correct_text_answer
         FROM questions
         WHERE ($1::text IS NULL OR category_id = $1)
           AND ($2::int IS NULL OR difficulty = $2)
         ORDER BY order_index, id
         LIMIT $3",
    )
    .bind(q.category_id)
    .bind(q.difficulty)
    .bind(q.limit.unwrap_or(10_000))
    .fetch_all(&pool)
    .await?;

    let ids: Vec<String> = rows.iter().map(|r| r.id.clone()).collect();
    let answers = load_answers(&pool, &ids).await?;
    Ok(Json(assemble(rows, answers)))
}

/// GET /api/questions/{id}
#[utoipa::path(get, path = "/api/questions/{id}", tag = "Questions",
    params(("id" = String, Path)),
    responses((status = 200, body = Question), (status = 404)))]
pub async fn get_question(
    State(pool): State<PgPool>,
    Path(id): Path<String>,
) -> AppResult<Json<Question>> {
    let row = sqlx::query_as::<_, QuestionRow>(
        "SELECT id, category_id, text, type, image_name, explanation, difficulty, order_index, correct_text_answer
         FROM questions WHERE id = $1",
    )
    .bind(&id)
    .fetch_optional(&pool)
    .await?
    .ok_or(AppError::NotFound)?;
    let answers = load_answers(&pool, &[row.id.clone()]).await?;
    Ok(Json(assemble(vec![row], answers).pop().unwrap()))
}

async fn upsert_answers(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    question_id: &str,
    answers: &[AnswerInput],
) -> AppResult<()> {
    sqlx::query("DELETE FROM answers WHERE question_id = $1")
        .bind(question_id)
        .execute(&mut **tx)
        .await?;
    for a in answers {
        sqlx::query(
            "INSERT INTO answers (question_id, text, is_correct, order_index) VALUES ($1,$2,$3,$4)",
        )
        .bind(question_id)
        .bind(&a.text)
        .bind(a.is_correct)
        .bind(a.order_index)
        .execute(&mut **tx)
        .await?;
    }
    Ok(())
}

/// POST /api/admin/questions
#[utoipa::path(post, path = "/api/admin/questions", tag = "Admin: Questions",
    request_body = QuestionInput, security(("bearer" = [])),
    responses((status = 200, body = Question), (status = 401)))]
pub async fn create_question(
    _admin: AdminUser,
    State(pool): State<PgPool>,
    Json(input): Json<QuestionInput>,
) -> AppResult<Json<Question>> {
    let mut tx = pool.begin().await?;
    sqlx::query(
        "INSERT INTO questions (id, category_id, text, type, image_name, explanation, difficulty, order_index, correct_text_answer)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
    )
    .bind(&input.id)
    .bind(&input.category_id)
    .bind(&input.text)
    .bind(&input.r#type)
    .bind(&input.image_name)
    .bind(&input.explanation)
    .bind(input.difficulty)
    .bind(input.order_index)
    .bind(&input.correct_text_answer)
    .execute(&mut *tx)
    .await?;
    upsert_answers(&mut tx, &input.id, &input.answers).await?;
    tx.commit().await?;
    get_question(State(pool), Path(input.id)).await
}

/// PUT /api/admin/questions/{id}
#[utoipa::path(put, path = "/api/admin/questions/{id}", tag = "Admin: Questions",
    params(("id" = String, Path)), request_body = QuestionInput, security(("bearer" = [])),
    responses((status = 200, body = Question), (status = 404)))]
pub async fn update_question(
    _admin: AdminUser,
    State(pool): State<PgPool>,
    Path(id): Path<String>,
    Json(input): Json<QuestionInput>,
) -> AppResult<Json<Question>> {
    let mut tx = pool.begin().await?;
    let res = sqlx::query(
        "UPDATE questions SET category_id=$2, text=$3, type=$4, image_name=$5, explanation=$6,
         difficulty=$7, order_index=$8, correct_text_answer=$9 WHERE id=$1",
    )
    .bind(&id)
    .bind(&input.category_id)
    .bind(&input.text)
    .bind(&input.r#type)
    .bind(&input.image_name)
    .bind(&input.explanation)
    .bind(input.difficulty)
    .bind(input.order_index)
    .bind(&input.correct_text_answer)
    .execute(&mut *tx)
    .await?;
    if res.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }
    upsert_answers(&mut tx, &id, &input.answers).await?;
    tx.commit().await?;
    get_question(State(pool), Path(id)).await
}

/// DELETE /api/admin/questions/{id}
#[utoipa::path(delete, path = "/api/admin/questions/{id}", tag = "Admin: Questions",
    params(("id" = String, Path)), security(("bearer" = [])),
    responses((status = 204), (status = 404)))]
pub async fn delete_question(
    _admin: AdminUser,
    State(pool): State<PgPool>,
    Path(id): Path<String>,
) -> AppResult<axum::http::StatusCode> {
    let res = sqlx::query("DELETE FROM questions WHERE id=$1")
        .bind(&id)
        .execute(&pool)
        .await?;
    if res.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }
    Ok(axum::http::StatusCode::NO_CONTENT)
}

// ===================== Schools =====================

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SchoolsQuery {
    pub city: Option<String>,
}

const SCHOOL_COLS: &str =
    "id, name, city, address, phone, price_from, price_to, website, google_maps_url";

/// GET /api/schools
#[utoipa::path(get, path = "/api/schools", tag = "Schools",
    params(("city" = Option<String>, Query)),
    responses((status = 200, body = Vec<School>)))]
pub async fn list_schools(
    State(pool): State<PgPool>,
    Query(q): Query<SchoolsQuery>,
) -> AppResult<Json<Vec<School>>> {
    let rows = sqlx::query_as::<_, School>(&format!(
        "SELECT {SCHOOL_COLS} FROM schools
         WHERE ($1::text IS NULL OR lower(city) = lower($1)) ORDER BY name"
    ))
    .bind(q.city)
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

/// GET /api/cities
#[utoipa::path(get, path = "/api/cities", tag = "Schools",
    responses((status = 200, body = Vec<String>)))]
pub async fn list_cities(State(pool): State<PgPool>) -> AppResult<Json<Vec<String>>> {
    let rows: Vec<(String,)> =
        sqlx::query_as("SELECT DISTINCT city FROM schools ORDER BY city")
            .fetch_all(&pool)
            .await?;
    Ok(Json(rows.into_iter().map(|(c,)| c).collect()))
}

/// GET /api/schools/{id}
#[utoipa::path(get, path = "/api/schools/{id}", tag = "Schools",
    params(("id" = String, Path)),
    responses((status = 200, body = SchoolDetail), (status = 404)))]
pub async fn get_school(
    State(pool): State<PgPool>,
    Path(id): Path<String>,
) -> AppResult<Json<SchoolDetail>> {
    let school = sqlx::query_as::<_, School>(&format!(
        "SELECT {SCHOOL_COLS} FROM schools WHERE id = $1"
    ))
    .bind(&id)
    .fetch_optional(&pool)
    .await?
    .ok_or(AppError::NotFound)?;

    let reviews = sqlx::query_as::<_, Review>(
        "SELECT id, rating, comment, author_name, created_at FROM reviews
         WHERE school_id = $1 ORDER BY created_at DESC",
    )
    .bind(&id)
    .fetch_all(&pool)
    .await?;

    let review_count = reviews.len() as i64;
    let average_rating = if review_count > 0 {
        reviews.iter().map(|r| r.rating as f64).sum::<f64>() / review_count as f64
    } else {
        0.0
    };

    Ok(Json(SchoolDetail {
        school,
        average_rating,
        review_count,
        reviews,
    }))
}

/// POST /api/admin/schools
#[utoipa::path(post, path = "/api/admin/schools", tag = "Admin: Schools",
    request_body = SchoolInput, security(("bearer" = [])),
    responses((status = 200, body = School), (status = 401)))]
pub async fn create_school(
    _admin: AdminUser,
    State(pool): State<PgPool>,
    Json(input): Json<SchoolInput>,
) -> AppResult<Json<School>> {
    let row = sqlx::query_as::<_, School>(&format!(
        "INSERT INTO schools (id, name, city, address, phone, price_from, price_to, website, google_maps_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING {SCHOOL_COLS}"
    ))
    .bind(&input.id)
    .bind(&input.name)
    .bind(&input.city)
    .bind(&input.address)
    .bind(&input.phone)
    .bind(input.price_from)
    .bind(input.price_to)
    .bind(&input.website)
    .bind(&input.google_maps_url)
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

/// PUT /api/admin/schools/{id}
#[utoipa::path(put, path = "/api/admin/schools/{id}", tag = "Admin: Schools",
    params(("id" = String, Path)), request_body = SchoolInput, security(("bearer" = [])),
    responses((status = 200, body = School), (status = 404)))]
pub async fn update_school(
    _admin: AdminUser,
    State(pool): State<PgPool>,
    Path(id): Path<String>,
    Json(input): Json<SchoolInput>,
) -> AppResult<Json<School>> {
    let row = sqlx::query_as::<_, School>(&format!(
        "UPDATE schools SET name=$2, city=$3, address=$4, phone=$5, price_from=$6, price_to=$7,
         website=$8, google_maps_url=$9 WHERE id=$1 RETURNING {SCHOOL_COLS}"
    ))
    .bind(&id)
    .bind(&input.name)
    .bind(&input.city)
    .bind(&input.address)
    .bind(&input.phone)
    .bind(input.price_from)
    .bind(input.price_to)
    .bind(&input.website)
    .bind(&input.google_maps_url)
    .fetch_optional(&pool)
    .await?
    .ok_or(AppError::NotFound)?;
    Ok(Json(row))
}

/// DELETE /api/admin/schools/{id}
#[utoipa::path(delete, path = "/api/admin/schools/{id}", tag = "Admin: Schools",
    params(("id" = String, Path)), security(("bearer" = [])),
    responses((status = 204), (status = 404)))]
pub async fn delete_school(
    _admin: AdminUser,
    State(pool): State<PgPool>,
    Path(id): Path<String>,
) -> AppResult<axum::http::StatusCode> {
    let res = sqlx::query("DELETE FROM schools WHERE id=$1")
        .bind(&id)
        .execute(&pool)
        .await?;
    if res.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }
    Ok(axum::http::StatusCode::NO_CONTENT)
}

/// POST /api/schools/{id}/reviews  (public)
#[utoipa::path(post, path = "/api/schools/{id}/reviews", tag = "Schools",
    params(("id" = String, Path)), request_body = ReviewInput,
    responses((status = 200, body = Review), (status = 400), (status = 404)))]
pub async fn add_review(
    State(pool): State<PgPool>,
    Path(id): Path<String>,
    Json(input): Json<ReviewInput>,
) -> AppResult<Json<Review>> {
    if !(1..=5).contains(&input.rating) {
        return Err(AppError::BadRequest("rating must be 1..5".into()));
    }
    let exists: Option<(String,)> = sqlx::query_as("SELECT id FROM schools WHERE id=$1")
        .bind(&id)
        .fetch_optional(&pool)
        .await?;
    if exists.is_none() {
        return Err(AppError::NotFound);
    }

    let author = if input.author_name.trim().is_empty() {
        "Anoniman".to_string()
    } else {
        input.author_name
    };

    let row = sqlx::query_as::<_, Review>(
        "INSERT INTO reviews (school_id, rating, comment, author_name) VALUES ($1,$2,$3,$4)
         RETURNING id, rating, comment, author_name, created_at",
    )
    .bind(&id)
    .bind(input.rating)
    .bind(&input.comment)
    .bind(&author)
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}
