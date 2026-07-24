use sqlx::PgPool;

use crate::auth::hash_password;

/// Seeds initial data on first run (idempotent — only runs when tables are empty).
///
/// NOTE: categories, questions and answers are NOT seeded here — they come from
/// the data migration `0003_mup_questions.sql` (the official MUP question bank),
/// which runs lock-safe via sqlx before this. This function only handles the
/// admin user and the demo driving schools.
pub async fn seed(pool: &PgPool) -> anyhow::Result<()> {
    seed_admin(pool).await?;
    seed_schools(pool).await?;
    Ok(())
}

async fn seed_admin(pool: &PgPool) -> anyhow::Result<()> {
    let (count,): (i64,) = sqlx::query_as("SELECT COUNT(*) FROM admins")
        .fetch_one(pool)
        .await?;
    if count > 0 {
        return Ok(());
    }
    let username = std::env::var("ADMIN_USERNAME").unwrap_or_else(|_| "admin".to_string());
    let password = std::env::var("ADMIN_PASSWORD").unwrap_or_else(|_| "admin123".to_string());
    let hash = hash_password(&password)?;
    sqlx::query("INSERT INTO admins (username, password_hash) VALUES ($1, $2)")
        .bind(&username)
        .bind(&hash)
        .execute(pool)
        .await?;
    tracing::info!("seeded admin user '{username}'");
    Ok(())
}

async fn seed_schools(pool: &PgPool) -> anyhow::Result<()> {
    let (count,): (i64,) = sqlx::query_as("SELECT COUNT(*) FROM schools")
        .fetch_one(pool)
        .await?;
    if count > 0 {
        return Ok(());
    }

    // Schools
    let schools = [
        ("vir_west_beograd", "Auto škola VIR - WEST", "Beograd", "Omladinskih brigada 86J", "+381 65 310 3100", 116000, 116000, Some("https://autoskolavir.com/")),
        ("vozd_beograd", "Auto škola Vožd", "Beograd", "Knez Mihailova 25", "+381 11 123 4567", 80000, 120000, None),
        ("novi_put_ns", "Auto škola Novi Put", "Novi Sad", "Bulevar Oslobođenja 100", "+381 21 234 567", 90000, 130000, None),
        ("nis_drive", "Auto škola Niš Drive", "Niš", "Vožda Karađorđa 10", "+381 18 000 000", 70000, 100000, None),
        ("krusevac_auto", "Auto škola Kruševac", "Kruševac", "Vidovdanska 15", "+381 37 345 678", 60000, 90000, None),
    ];
    for (id, name, city, addr, phone, from, to, website) in schools {
        sqlx::query(
            "INSERT INTO schools (id, name, city, address, phone, price_from, price_to, website) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
        )
        .bind(id).bind(name).bind(city).bind(addr).bind(phone).bind(from).bind(to).bind(website)
        .execute(pool).await?;
    }

    tracing::info!("seeded {} driving schools", schools.len());
    Ok(())
}
