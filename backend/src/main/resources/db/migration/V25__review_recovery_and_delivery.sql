CREATE TABLE workflow_locks (
    tenant_id VARCHAR(36) NOT NULL,
    workflow VARCHAR(40) NOT NULL,
    subject_id BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (tenant_id, workflow, subject_id)
);

ALTER TABLE notifications ADD COLUMN delivery_claim VARCHAR(36) NULL,
    ADD COLUMN delivery_lease_until DATETIME(6) NULL;

CREATE TABLE recovery_email_jobs (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    payload TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    attempts INT NOT NULL DEFAULT 0,
    claim_token VARCHAR(36) NULL,
    next_attempt_at DATETIME(6) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_recovery_email_user FOREIGN KEY (user_id) REFERENCES app_users(id),
    INDEX idx_recovery_email_due (status, next_attempt_at)
);

CREATE TABLE auth_rate_windows (
    key_hash CHAR(64) NOT NULL PRIMARY KEY,
    window_started_at DATETIME(6) NOT NULL,
    requests BIGINT NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    INDEX idx_auth_rate_expiry (expires_at)
);

ALTER TABLE platform_subscription_invoices ADD COLUMN collection_provider VARCHAR(120) NULL;

-- Unknown historical providers must be identified before any recovery attempt.
UPDATE platform_subscription_invoices SET collection_provider='legacy-unresolved' WHERE collection_state IN ('PENDING','REVIEW_REQUIRED') AND collection_provider IS NULL;
