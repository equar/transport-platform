CREATE TABLE demo_inquiries (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 contact_name VARCHAR(150) NOT NULL,
 company VARCHAR(200) NOT NULL,
 email VARCHAR(254) NOT NULL,
 phone VARCHAR(50) NOT NULL,
 message TEXT NOT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE push_delivery_jobs (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 notification_id BIGINT NOT NULL,
 device_token_id BIGINT NOT NULL,
 attempts INT NOT NULL DEFAULT 0,
 receipt_id VARCHAR(255) NULL,
 accepted_at TIMESTAMP NULL,
 receipt_attempts INT NOT NULL DEFAULT 0,
 status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
 next_attempt_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
 error_message VARCHAR(500) NULL,
 UNIQUE KEY uk_push_delivery (notification_id, device_token_id),
 INDEX idx_push_due (status, next_attempt_at)
);
