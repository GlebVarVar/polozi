-- Categories
CREATE TABLE IF NOT EXISTS categories (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    icon_name   TEXT NOT NULL DEFAULT '',
    order_index INTEGER NOT NULL DEFAULT 0
);

-- Questions
CREATE TABLE IF NOT EXISTS questions (
    id                  TEXT PRIMARY KEY,
    category_id         TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    text                TEXT NOT NULL,
    type                TEXT NOT NULL DEFAULT 'multipleChoice',
    image_name          TEXT,
    explanation         TEXT,
    difficulty          INTEGER NOT NULL DEFAULT 1,
    order_index         INTEGER NOT NULL DEFAULT 0,
    correct_text_answer TEXT
);
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category_id);

-- Answers
CREATE TABLE IF NOT EXISTS answers (
    id          BIGSERIAL PRIMARY KEY,
    question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    text        TEXT NOT NULL,
    is_correct  BOOLEAN NOT NULL DEFAULT FALSE,
    order_index INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id);

-- Driving schools
CREATE TABLE IF NOT EXISTS schools (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    city            TEXT NOT NULL,
    address         TEXT NOT NULL DEFAULT '',
    phone           TEXT NOT NULL DEFAULT '',
    price_from      INTEGER NOT NULL DEFAULT 0,
    price_to        INTEGER NOT NULL DEFAULT 0,
    website         TEXT,
    google_maps_url TEXT
);
CREATE INDEX IF NOT EXISTS idx_schools_city ON schools(city);

-- School reviews
CREATE TABLE IF NOT EXISTS reviews (
    id          BIGSERIAL PRIMARY KEY,
    school_id   TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT NOT NULL DEFAULT '',
    author_name TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviews_school ON reviews(school_id);

-- Admin users (backoffice)
CREATE TABLE IF NOT EXISTS admins (
    id            BIGSERIAL PRIMARY KEY,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
