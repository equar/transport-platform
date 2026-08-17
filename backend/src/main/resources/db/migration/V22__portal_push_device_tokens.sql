CREATE TABLE portal_push_device_tokens (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    app_user_id BIGINT NOT NULL,
    push_token VARCHAR(255) NOT NULL,
    platform VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    last_registered_at TIMESTAMP NOT NULL,
    last_delivered_at TIMESTAMP NULL,
    last_delivery_status VARCHAR(20) NULL,
    last_delivery_error VARCHAR(500) NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT pk_portal_push_device_tokens PRIMARY KEY (id),
    CONSTRAINT uk_portal_push_device_tokens_token UNIQUE (push_token),
    CONSTRAINT fk_portal_push_device_tokens_user FOREIGN KEY (app_user_id) REFERENCES app_users(id)
);

CREATE INDEX ix_portal_push_device_tokens_user_status
    ON portal_push_device_tokens (tenant_id, app_user_id, status);
