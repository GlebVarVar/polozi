-- TOTP-based two-factor auth for backoffice admins.
ALTER TABLE admins ADD COLUMN IF NOT EXISTS totp_secret  TEXT;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN NOT NULL DEFAULT FALSE;
