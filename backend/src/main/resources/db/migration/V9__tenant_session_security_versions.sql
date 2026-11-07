-- An access generation invalidates JWTs and refresh tokens on administrative identity changes.
ALTER TABLE app_users ADD COLUMN security_version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE auth_refresh_sessions ADD COLUMN security_version BIGINT NOT NULL DEFAULT 0;
