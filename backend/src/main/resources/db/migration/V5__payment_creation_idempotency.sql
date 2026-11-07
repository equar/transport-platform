CREATE TABLE payment_creation_idempotency (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    idempotency_key VARCHAR(120) NOT NULL,
    request_hash VARCHAR(64) NOT NULL,
    payment_id BIGINT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_payment_creation_idempotency UNIQUE (tenant_id, user_id, idempotency_key),
    CONSTRAINT fk_payment_creation_idempotency_user FOREIGN KEY (user_id) REFERENCES app_users (id),
    CONSTRAINT fk_payment_creation_idempotency_payment FOREIGN KEY (payment_id) REFERENCES payments (id),
    INDEX idx_payment_creation_idempotency_payment (payment_id)
);