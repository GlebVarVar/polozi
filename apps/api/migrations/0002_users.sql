-- App users (end-users of the mobile/web app — distinct from backoffice `admins`)
CREATE TABLE IF NOT EXISTS users (
    id            BIGSERIAL PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-user progress snapshot: the whole client progress state (attempts + exam
-- sessions) stored as a JSON blob, mirroring the app's localStorage shape.
CREATE TABLE IF NOT EXISTS user_progress (
    user_id    BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data       JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
