-- Platform SaaS invoices are deliberately separate from tenant transport invoices.
CREATE TABLE subscription_driver_status_periods (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 tenant_id VARCHAR(36) NOT NULL,
 driver_id BIGINT NOT NULL,
 status VARCHAR(30) NOT NULL,
 effective_from DATETIME(6) NOT NULL,
 effective_to DATETIME(6) NULL,
 open_driver_id BIGINT GENERATED ALWAYS AS (CASE WHEN effective_to IS NULL THEN driver_id ELSE NULL END) STORED,
 UNIQUE KEY uk_driver_status_open (open_driver_id),
 INDEX idx_driver_status_meter (tenant_id, effective_from, effective_to, status),
 CONSTRAINT fk_meter_driver FOREIGN KEY (driver_id) REFERENCES drivers(id),
 CONSTRAINT fk_meter_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
-- Metering begins now, never invents historical driver statuses.
INSERT INTO subscription_driver_status_periods (tenant_id,driver_id,status,effective_from)
 SELECT tenant_id,id,status,UTC_TIMESTAMP(6) FROM drivers;
CREATE TABLE subscription_billing_accounts (
 subscription_id BIGINT NOT NULL PRIMARY KEY,
 tenant_id VARCHAR(36) NOT NULL,
 enabled BOOLEAN NOT NULL DEFAULT FALSE,
 monthly_driver_rate DECIMAL(12,2) NULL,
 first_renewal_date DATE NULL,
 next_renewal_date DATE NULL,
 next_renewal_at DATETIME(6) NULL,
 anchor_time TIME(6) NULL,
 anchor_day INT NULL,
 payment_due_days INT NOT NULL DEFAULT 14,
 collection_mode VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 CONSTRAINT fk_sub_billing_subscription FOREIGN KEY (subscription_id) REFERENCES tenant_subscriptions(id),
 CONSTRAINT fk_sub_billing_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
 INDEX idx_sub_billing_due (enabled,next_renewal_date,subscription_id)
);
INSERT INTO subscription_billing_accounts (subscription_id,tenant_id) SELECT id,tenant_id FROM tenant_subscriptions;
CREATE TABLE subscription_billing_rates (
 subscription_id BIGINT NOT NULL,
 effective_on DATE NOT NULL,
 monthly_driver_rate DECIMAL(12,2) NOT NULL,
 PRIMARY KEY (subscription_id,effective_on),
 CONSTRAINT fk_sub_rate_account FOREIGN KEY (subscription_id) REFERENCES subscription_billing_accounts(subscription_id)
);
CREATE TABLE platform_subscription_invoices (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 subscription_id BIGINT NOT NULL,
 tenant_id VARCHAR(36) NOT NULL,
 tenant_name VARCHAR(150) NOT NULL,
 plan_code VARCHAR(50) NOT NULL,
 period_start DATE NOT NULL,
 period_end DATE NOT NULL,
 due_date DATE NOT NULL,
 metered_at DATETIME(6) NOT NULL,
 driver_count INT NOT NULL,
 driver_ids_json JSON NOT NULL,
 monthly_driver_rate DECIMAL(12,2) NOT NULL,
 currency VARCHAR(3) NOT NULL DEFAULT 'USD',
 amount DECIMAL(14,2) NOT NULL,
 paid_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
 collection_mode VARCHAR(20) NOT NULL,
 collection_state VARCHAR(30) NOT NULL DEFAULT 'NOT_ATTEMPTED',
 status VARCHAR(20) NOT NULL DEFAULT 'ISSUED',
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 UNIQUE KEY uk_subscription_cycle (subscription_id,period_start),
 INDEX idx_platform_invoice_tenant (tenant_id,id),
 CONSTRAINT fk_platform_invoice_subscription FOREIGN KEY (subscription_id) REFERENCES tenant_subscriptions(id),
 CONSTRAINT fk_platform_invoice_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
CREATE TABLE platform_subscription_payments (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 invoice_id BIGINT NOT NULL,
 amount DECIMAL(14,2) NOT NULL,
 payment_reference VARCHAR(150) NOT NULL,
 source VARCHAR(30) NOT NULL,
 recorded_by VARCHAR(150) NOT NULL,
 recorded_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 UNIQUE KEY uk_platform_payment_reference (source,payment_reference),
 CONSTRAINT fk_platform_payment_invoice FOREIGN KEY (invoice_id) REFERENCES platform_subscription_invoices(id)
);
-- Existing companies receive a subscription only where their selected plan exists.
INSERT INTO tenant_subscriptions (tenant_id,subscription_plan_id,effective_start_date,is_trial,status,created_by,created_at,updated_by,updated_at)
 SELECT t.id,p.id,UTC_DATE(),FALSE,IF(t.status='SUSPENDED','SUSPENDED','ACTIVE'),'migration',UTC_TIMESTAMP(6),'migration',UTC_TIMESTAMP(6)
 FROM tenants t JOIN subscription_plans p ON UPPER(p.plan_code)=UPPER(t.subscription_plan) AND p.status='ACTIVE'
 WHERE NOT EXISTS (SELECT 1 FROM tenant_subscriptions s WHERE s.tenant_id=t.id);

INSERT INTO subscription_billing_accounts (subscription_id,tenant_id) SELECT s.id,s.tenant_id FROM tenant_subscriptions s WHERE NOT EXISTS (SELECT 1 FROM subscription_billing_accounts a WHERE a.subscription_id=s.id);
