ALTER TABLE app_users
 ADD COLUMN mfa_secret VARCHAR(512) NULL,
 ADD COLUMN mfa_pending_secret VARCHAR(512) NULL,
 ADD COLUMN mfa_pending_expires_at DATETIME(6) NULL,
 ADD COLUMN mfa_last_counter BIGINT NOT NULL DEFAULT -1,
 ADD COLUMN mfa_recovery_hashes TEXT NULL;
