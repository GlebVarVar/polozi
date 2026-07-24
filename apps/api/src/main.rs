use polozi_api::{app, run_migrations, seed};
use sqlx::postgres::PgPoolOptions;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

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

    run_migrations(&pool).await?;
    seed::seed(&pool).await?;

    let port = std::env::var("PORT").unwrap_or_else(|_| "3001".to_string());
    let addr = format!("0.0.0.0:{port}");
    tracing::info!("listening on {addr}");
    tracing::info!("swagger UI at http://localhost:{port}/swagger");

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app(pool)).await?;
    Ok(())
}
