ALTER TABLE tenant_settings ADD COLUMN driver_earnings_rate DECIMAL(5,2) NULL;
CREATE TABLE driver_earnings_ledger (
  id BIGINT AUTO_INCREMENT PRIMARY KEY, tenant_id VARCHAR(36) NOT NULL, driver_id BIGINT NOT NULL, ride_id BIGINT NULL,
  entry_type VARCHAR(30) NOT NULL, status VARCHAR(30) NOT NULL, amount DECIMAL(12,2) NULL, currency VARCHAR(3) NOT NULL,
  invoice_total DECIMAL(12,2) NULL, earnings_rate DECIMAL(5,2) NULL, reason VARCHAR(1000) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, created_by VARCHAR(255) NULL, updated_at TIMESTAMP NULL, updated_by VARCHAR(255) NULL,
  CONSTRAINT uk_driver_earnings_base_ride UNIQUE (ride_id, entry_type),
  INDEX idx_driver_earnings_driver (tenant_id, driver_id, created_at),
  INDEX idx_driver_earnings_tenant (tenant_id, created_at)
);
