CREATE TABLE portal_booking_requests (
 tenant_id VARCHAR(36) NOT NULL,
 user_id BIGINT NOT NULL,
 idempotency_key VARCHAR(120) NOT NULL,
 request_hash VARCHAR(64) NOT NULL,
 ride_id BIGINT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (tenant_id,user_id,idempotency_key)
);
