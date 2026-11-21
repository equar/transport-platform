-- Temporary credentials have an explicit expiry; no account gets a perpetual temporary password.
UPDATE app_users SET temporary_password_expires_at=DATE_ADD(UTC_TIMESTAMP(6),INTERVAL 24 HOUR)
WHERE must_change_password=TRUE AND temporary_password_expires_at IS NULL;
ALTER TABLE privacy_retention_policies ADD COLUMN location_days INT NULL,
    ADD CONSTRAINT ck_privacy_location_days CHECK (location_days IS NULL OR location_days BETWEEN 1 AND 36500);
CREATE INDEX idx_location_driver_latest ON driver_location_snapshots(tenant_id,driver_id,captured_at DESC,id DESC);
CREATE INDEX idx_location_retention ON driver_location_snapshots(tenant_id,created_at,id);
ALTER TABLE driver_action_idempotency ADD COLUMN result_json LONGTEXT NULL,
    MODIFY COLUMN idempotency_key VARCHAR(120) CHARACTER SET ascii COLLATE ascii_bin NOT NULL;
ALTER TABLE rides ADD CONSTRAINT uq_rides_tenant_id_id UNIQUE(tenant_id,id);
ALTER TABLE payments ADD CONSTRAINT uq_payments_tenant_id_id UNIQUE(tenant_id,id);
ALTER TABLE driver_earnings_ledger ADD COLUMN source_invoice_id BIGINT NULL,
    ADD CONSTRAINT fk_earnings_source_invoice FOREIGN KEY(tenant_id,source_invoice_id) REFERENCES invoices(tenant_id,id),
    ADD CONSTRAINT fk_earnings_tenant FOREIGN KEY(tenant_id) REFERENCES tenants(id),
    ADD CONSTRAINT fk_earnings_driver FOREIGN KEY(tenant_id,driver_id) REFERENCES drivers(tenant_id,id),
    ADD CONSTRAINT fk_earnings_ride FOREIGN KEY(tenant_id,ride_id) REFERENCES rides(tenant_id,id),
    ADD CONSTRAINT ck_earned_ride_required CHECK(entry_type<>'EARNED' OR ride_id IS NOT NULL);

-- Compensate V17 only for untouched rows that could have been approved by that migration.
-- Preserve previous state and amount; never infer that a human approved a legacy row.
CREATE TABLE earnings_legacy_reviews (
    ledger_id BIGINT NOT NULL PRIMARY KEY,
    previous_status VARCHAR(30) NOT NULL,
    previous_amount DECIMAL(12,2) NULL,
    source_migration VARCHAR(30) NOT NULL,
    queued_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    resolved_at DATETIME(6) NULL,
    CONSTRAINT fk_legacy_earnings_review FOREIGN KEY(ledger_id) REFERENCES driver_earnings_ledger(id)
);
INSERT INTO earnings_legacy_reviews(ledger_id,previous_status,previous_amount,source_migration)
SELECT e.id,e.status,e.amount,'17'
FROM driver_earnings_ledger e JOIN flyway_schema_history f ON f.version='17' AND f.success=TRUE
WHERE e.entry_type='EARNED' AND e.status='APPROVED'
AND e.updated_at<TIMESTAMPADD(SECOND,1,f.installed_on)
AND NOT EXISTS(SELECT 1 FROM audit_logs a WHERE a.tenant_id=e.tenant_id AND a.entity_type='DRIVER_EARNINGS_LEDGER' AND a.entity_id=CAST(e.id AS CHAR) AND a.action_name='EARNINGS_APPROVED');
UPDATE driver_earnings_ledger e JOIN earnings_legacy_reviews q ON q.ledger_id=e.id SET e.status='PENDING_REVIEW';

CREATE TABLE credit_notes (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,tenant_id VARCHAR(36) NOT NULL,source_invoice_id BIGINT NOT NULL,
 credit_number VARCHAR(50) NOT NULL,bill_to_type VARCHAR(30) NOT NULL,bill_to_id BIGINT NOT NULL,
 amount DECIMAL(12,2) NOT NULL,currency VARCHAR(3) NOT NULL,status VARCHAR(20) NOT NULL,
 reason TEXT NOT NULL,void_reason TEXT NULL,created_by BIGINT NOT NULL,created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 UNIQUE KEY uq_credit_number(tenant_id,credit_number),
 UNIQUE KEY uq_credit_tenant_id(tenant_id,id),
 CONSTRAINT ck_credit_amount CHECK(amount>0),
 CONSTRAINT fk_credit_tenant FOREIGN KEY(tenant_id) REFERENCES tenants(id),
 CONSTRAINT fk_credit_invoice FOREIGN KEY(tenant_id,source_invoice_id) REFERENCES invoices(tenant_id,id)
);
ALTER TABLE payments ADD COLUMN refunded_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
 ADD COLUMN source_credit_note_id BIGINT NULL,
 ADD CONSTRAINT ck_payment_refunds CHECK(refunded_amount>=0 AND refunded_amount<=amount),
 ADD CONSTRAINT fk_payment_credit_note FOREIGN KEY(tenant_id,source_credit_note_id) REFERENCES credit_notes(tenant_id,id),
 ADD CONSTRAINT ck_credit_payment_origin CHECK(payment_method<>'CREDIT_NOTE' OR source_credit_note_id IS NOT NULL);
CREATE TABLE payment_refunds (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,tenant_id VARCHAR(36) NOT NULL,payment_id BIGINT NOT NULL,invoice_id BIGINT NOT NULL,
 amount DECIMAL(12,2) NOT NULL,currency VARCHAR(3) NOT NULL,external_reference VARCHAR(150) NOT NULL,reason TEXT NOT NULL,
 created_by BIGINT NOT NULL,created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 UNIQUE KEY uq_refund_reference(tenant_id,external_reference),
 CONSTRAINT ck_refund_positive CHECK(amount>0),
 CONSTRAINT fk_refund_payment FOREIGN KEY(tenant_id,payment_id) REFERENCES payments(tenant_id,id),
 CONSTRAINT fk_refund_invoice FOREIGN KEY(tenant_id,invoice_id) REFERENCES invoices(tenant_id,id)
);
CREATE TABLE credit_applications (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,tenant_id VARCHAR(36) NOT NULL,credit_note_id BIGINT NOT NULL,invoice_id BIGINT NOT NULL,payment_id BIGINT NOT NULL,
 amount DECIMAL(12,2) NOT NULL,currency VARCHAR(3) NOT NULL,created_by BIGINT NOT NULL,created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 UNIQUE KEY uq_credit_application_payment(payment_id),
 CONSTRAINT ck_credit_application_positive CHECK(amount>0),
 CONSTRAINT fk_credit_application_note FOREIGN KEY(tenant_id,credit_note_id) REFERENCES credit_notes(tenant_id,id),
 CONSTRAINT fk_credit_application_invoice FOREIGN KEY(tenant_id,invoice_id) REFERENCES invoices(tenant_id,id),
 CONSTRAINT fk_credit_application_payment FOREIGN KEY(tenant_id,payment_id) REFERENCES payments(tenant_id,id)
);
CREATE TABLE billing_adjustment_intents (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,tenant_id VARCHAR(36) NOT NULL,request_key VARCHAR(120) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 operation VARCHAR(30) NOT NULL,request_hash VARCHAR(64) NOT NULL,result_id BIGINT NOT NULL,created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 UNIQUE KEY uq_billing_adjustment_intent(tenant_id,request_key)
);
CREATE TABLE audit_integrity_heads (
 scope_key VARCHAR(36) NOT NULL PRIMARY KEY,sequence_no BIGINT NOT NULL,signature CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL
);
CREATE TABLE audit_integrity_ledger (
 scope_key VARCHAR(36) NOT NULL,sequence_no BIGINT NOT NULL,event_type VARCHAR(30) NOT NULL,audit_id BIGINT NOT NULL,
 content_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,previous_signature CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 signature CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 PRIMARY KEY(scope_key,sequence_no),UNIQUE KEY uq_audit_evidence(scope_key,audit_id,event_type)
);
