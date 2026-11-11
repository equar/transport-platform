ALTER TABLE app_users
    ADD COLUMN email_verified_at DATETIME(6) NULL,
    ADD COLUMN email_verification_email VARCHAR(150) NULL,
    ADD COLUMN email_verification_token_hash VARCHAR(64) NULL,
    ADD COLUMN email_verification_expires_at DATETIME(6) NULL,
    ADD COLUMN email_verification_requested_at DATETIME(6) NULL;

CREATE UNIQUE INDEX uk_app_users_email_verification_token ON app_users (email_verification_token_hash);
