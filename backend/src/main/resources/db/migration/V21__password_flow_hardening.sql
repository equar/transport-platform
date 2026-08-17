ALTER TABLE app_users
    ADD COLUMN must_change_password BIT NOT NULL DEFAULT b'0',
    ADD COLUMN password_changed_at TIMESTAMP NULL,
    ADD COLUMN password_reset_token_hash VARCHAR(255) NULL,
    ADD COLUMN password_reset_token_expires_at TIMESTAMP NULL,
    ADD COLUMN password_reset_requested_at TIMESTAMP NULL;
