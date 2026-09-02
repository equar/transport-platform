CREATE TABLE auth_refresh_sessions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    family_id VARCHAR(36) NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    issued_at TIMESTAMP(6) NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    used_at TIMESTAMP(6) NULL,
    revoked_at TIMESTAMP(6) NULL,
    replaced_by_token_hash VARCHAR(64) NULL,
    client_type VARCHAR(20) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_auth_refresh_sessions_user
        FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE CASCADE,
    CONSTRAINT uk_auth_refresh_sessions_token_hash UNIQUE (token_hash),
    INDEX idx_auth_refresh_sessions_family (family_id),
    INDEX idx_auth_refresh_sessions_user (user_id),
    INDEX idx_auth_refresh_sessions_expiry (expires_at)
);

