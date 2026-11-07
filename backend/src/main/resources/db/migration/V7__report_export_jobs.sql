CREATE TABLE report_export_jobs (
 id VARCHAR(36) PRIMARY KEY,
 tenant_id VARCHAR(36) NOT NULL,
 user_id BIGINT NOT NULL,
 request_json TEXT NOT NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
 progress INT NOT NULL DEFAULT 0,
 result_csv MEDIUMTEXT NULL,
 error_message VARCHAR(500) NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 expires_at TIMESTAMP NOT NULL,
 lease_until TIMESTAMP NULL,
 INDEX idx_export_queue(status, lease_until),
 INDEX idx_export_owner(tenant_id, user_id, created_at)
);
