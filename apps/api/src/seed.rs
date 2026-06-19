use sqlx::PgPool;

use crate::auth::hash_password;

/// Seeds initial data on first run (idempotent — only runs when tables are empty).
pub async fn seed(pool: &PgPool) -> anyhow::Result<()> {
    seed_admin(pool).await?;
    seed_content(pool).await?;
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

async fn seed_content(pool: &PgPool) -> anyhow::Result<()> {
    let (count,): (i64,) = sqlx::query_as("SELECT COUNT(*) FROM categories")
        .fetch_one(pool)
        .await?;
    if count > 0 {
        return Ok(());
    }

    // Categories
    let categories = [
        ("cat_signs", "Saobraćajni znakovi", "sign", 0),
        ("cat_rules", "Pravila saobraćaja", "car", 1),
        ("cat_first_aid", "Prva pomoć", "cross", 2),
    ];
    for (id, name, icon, order) in categories {
        sqlx::query(
            "INSERT INTO categories (id, name, icon_name, order_index) VALUES ($1,$2,$3,$4)",
        )
        .bind(id)
        .bind(name)
        .bind(icon)
        .bind(order as i32)
        .execute(pool)
        .await?;
    }

    // Questions with answers: (id, cat, text, type, explanation, difficulty, order, correct_text, answers[(text,correct)])
    type Q = (
        &'static str,
        &'static str,
        &'static str,
        &'static str,
        Option<&'static str>,
        i32,
        i32,
        Option<&'static str>,
        Vec<(&'static str, bool)>,
    );
    let questions: Vec<Q> = vec![
        (
            "q_001", "cat_signs", "Koji je oblik znaka STOP?", "multipleChoice",
            Some("Znak STOP je osmougaonog (oktagonalnog) oblika crvene boje."), 1, 0, None,
            vec![("Osmougaoni", true), ("Trougaoni", false), ("Kružni", false), ("Pravougaoni", false)],
        ),
        (
            "q_002", "cat_signs", "Šta označava trougaoni znak sa crvenom ivicom?", "multipleChoice",
            Some("Trougaoni znakovi sa crvenom ivicom su znakovi opasnosti."), 1, 1, None,
            vec![("Opasnost", true), ("Zabranu", false), ("Obavezu", false), ("Obaveštenje", false)],
        ),
        (
            "q_003", "cat_rules", "Ko ima prednost na raskrsnici bez saobraćajnih znakova?", "multipleChoice",
            Some("Pravilo desne strane: prednost ima vozilo koje dolazi sa desne strane."), 1, 0, None,
            vec![("Vozilo s desne strane", true), ("Vozilo s leve strane", false), ("Brže vozilo", false)],
        ),
        (
            "q_004", "cat_rules", "Najveća dozvoljena brzina u naselju (ako nije drugačije označeno)?", "openText",
            Some("U naselju je najveća dozvoljena brzina 50 km/h."), 2, 1, Some("50"),
            vec![],
        ),
        (
            "q_005", "cat_rules", "Na koliko metara van naselja se postavlja sigurnosni trougao?", "openText",
            Some("Sigurnosni trougao se postavlja na najmanje 100 metara van naselja."), 2, 2, Some("100"),
            vec![],
        ),
        (
            "q_006", "cat_first_aid", "Koji je prvi korak kod pružanja prve pomoći na mestu nezgode?", "multipleChoice",
            Some("Prvo se obezbeđuje mesto nezgode kako bi se sprečile dalje povrede."), 1, 0, None,
            vec![("Obezbediti mesto nezgode", true), ("Pozvati porodicu", false), ("Pomeriti povređenog", false)],
        ),
    ];

    for (id, cat, text, qtype, expl, diff, order, correct_text, answers) in questions {
        sqlx::query(
            "INSERT INTO questions (id, category_id, text, type, explanation, difficulty, order_index, correct_text_answer)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
        )
        .bind(id).bind(cat).bind(text).bind(qtype).bind(expl).bind(diff).bind(order).bind(correct_text)
        .execute(pool).await?;
        for (i, (atext, correct)) in answers.into_iter().enumerate() {
            sqlx::query(
                "INSERT INTO answers (question_id, text, is_correct, order_index) VALUES ($1,$2,$3,$4)",
            )
            .bind(id).bind(atext).bind(correct).bind(i as i32)
            .execute(pool).await?;
        }
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
        .bind(id).bind(name).bind(city).bind(addr).bind(phone).bind(from as i32).bind(to as i32).bind(website)
        .execute(pool).await?;
    }

    tracing::info!("seeded content: categories, questions, schools");
    Ok(())
}
