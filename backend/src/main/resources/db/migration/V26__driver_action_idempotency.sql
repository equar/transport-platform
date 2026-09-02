CREATE TABLE driver_action_idempotency (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    idempotency_key VARCHAR(120) NOT NULL,
    ride_id BIGINT NOT NULL,
    action_name VARCHAR(40) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_driver_action_idempotency UNIQUE (tenant_id, user_id, idempotency_key),
    CONSTRAINT fk_driver_action_idempotency_user FOREIGN KEY (user_id) REFERENCES app_users (id),
    CONSTRAINT fk_driver_action_idempotency_ride FOREIGN KEY (ride_id) REFERENCES rides (id)
);

