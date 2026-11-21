-- Match existing tenant-key collation rather than the server/database default.
SET @v24_charset=(SELECT character_set_name FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='tenants' AND column_name='id');
SET @v24_collation=(SELECT collation_name FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='tenants' AND column_name='id');

-- Resumable after interrupted MySQL DDL; existing records and successful migration history are preserved.
-- Temporary credentials have an explicit expiry; no perpetual temporary passwords.
UPDATE app_users SET temporary_password_expires_at=DATE_ADD(UTC_TIMESTAMP(6),INTERVAL 24 HOUR)
WHERE must_change_password=TRUE AND temporary_password_expires_at IS NULL;

SET @v24_ddl=IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='privacy_retention_policies' AND column_name='location_days'),'SELECT 1','ALTER TABLE privacy_retention_policies ADD COLUMN location_days INT NULL');
PREPARE v24_stmt FROM @v24_ddl;
EXECUTE v24_stmt;
DEALLOCATE PREPARE v24_stmt;

SET @v24_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='privacy_retention_policies' AND constraint_name='ck_privacy_location_days'),'SELECT 1','ALTER TABLE privacy_retention_policies ADD CONSTRAINT ck_privacy_location_days CHECK (location_days IS NULL OR location_days BETWEEN 1 AND 36500)');
PREPARE v24_stmt FROM @v24_ddl;
EXECUTE v24_stmt;
DEALLOCATE PREPARE v24_stmt;

SET @v24_ddl=IF(EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='driver_location_snapshots' AND index_name='idx_location_driver_latest'),'SELECT 1','CREATE INDEX idx_location_driver_latest ON driver_location_snapshots(tenant_id,driver_id,captured_at DESC,id DESC)');
PREPARE v24_stmt FROM @v24_ddl;
EXECUTE v24_stmt;
DEALLOCATE PREPARE v24_stmt;

SET @v24_ddl=IF(EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='driver_location_snapshots' AND index_name='idx_location_retention'),'SELECT 1','CREATE INDEX idx_location_retention ON driver_location_snapshots(tenant_id,created_at,id)');
PREPARE v24_stmt FROM @v24_ddl;
EXECUTE v24_stmt;
DEALLOCATE PREPARE v24_stmt;

SET @v24_ddl=IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='driver_action_idempotency' AND column_name='result_json'),'SELECT 1','ALTER TABLE driver_action_idempotency ADD COLUMN result_json LONGTEXT NULL');
PREPARE v24_stmt FROM @v24_ddl;
EXECUTE v24_stmt;
DEALLOCATE PREPARE v24_stmt;

ALTER TABLE driver_action_idempotency MODIFY COLUMN idempotency_key VARCHAR(120) CHARACTER SET ascii COLLATE ascii_bin NOT NULL;

SET @v24_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='rides' AND constraint_name='uq_rides_tenant_id_id'),'SELECT 1','ALTER TABLE rides ADD CONSTRAINT uq_rides_tenant_id_id UNIQUE(tenant_id,id)');
PREPARE v24_stmt FROM @v24_ddl;
EXECUTE v24_stmt;
DEALLOCATE PREPARE v24_stmt;

SET @v24_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='payments' AND constraint_name='uq_payments_tenant_id_id'),'SELECT 1','ALTER TABLE payments ADD CONSTRAINT uq_payments_tenant_id_id UNIQUE(tenant_id,id)');
PREPARE v24_stmt FROM @v24_ddl;
EXECUTE v24_stmt;
DEALLOCATE PREPARE v24_stmt;

SET @v24_ddl=IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='driver_earnings_ledger' AND column_name='source_invoice_id'),'SELECT 1','ALTER TABLE driver_earnings_ledger ADD COLUMN source_invoice_id BIGINT NULL');
PREPARE v24_stmt FROM @v24_ddl;
EXECUTE v24_stmt;
DEALLOCATE PREPARE v24_stmt;

SET @v24_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='driver_earnings_ledger' AND constraint_name='fk_earnings_source_invoice'),'SELECT 1','ALTER TABLE driver_earnings_ledger ADD CONSTRAINT fk_earnings_source_invoice FOREIGN KEY(tenant_id,source_invoice_id) REFERENCES invoices(tenant_id,id)');
PREPARE v24_stmt FROM @v24_ddl;
EXECUTE v24_stmt;
DEALLOCATE PREPARE v24_stmt;

SET @v24_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='driver_earnings_ledger' AND constraint_name='fk_earnings_tenant'),'SELECT 1','ALTER TABLE driver_earnings_ledger ADD CONSTRAINT fk_earnings_tenant FOREIGN KEY(tenant_id) REFERENCES tenants(id)');
PREPARE v24_stmt FROM @v24_ddl;
EXECUTE v24_stmt;
DEALLOCATE PREPARE v24_stmt;

SET @v24_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='driver_earnings_ledger' AND constraint_name='fk_earnings_driver'),'SELECT 1','ALTER TABLE driver_earnings_ledger ADD CONSTRAINT fk_earnings_driver FOREIGN KEY(tenant_id,driver_id) REFERENCES drivers(tenant_id,id)');
PREPARE v24_stmt FROM @v24_ddl;
EXECUTE v24_stmt;
DEALLOCATE PREPARE v24_stmt;

SET @v24_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='driver_earnings_ledger' AND constraint_name='fk_earnings_ride'),'SELECT 1','ALTER TABLE driver_earnings_ledger ADD CONSTRAINT fk_earnings_ride FOREIGN KEY(tenant_id,ride_id) REFERENCES rides(tenant_id,id)');
PREPARE v24_stmt FROM @v24_ddl;
EXECUTE v24_stmt;
DEALLOCATE PREPARE v24_stmt;

SET @v24_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='driver_earnings_ledger' AND constraint_name='ck_earned_ride_required'),'SELECT 1','ALTER TABLE driver_earnings_ledger ADD CONSTRAINT ck_earned_ride_required CHECK(entry_type<>''EARNED'' OR ride_id IS NOT NULL)');
PREPARE v24_stmt FROM @v24_ddl;
EXECUTE v24_stmt;
DEALLOCATE PREPARE v24_stmt;

-- Compensate V17 only for untouched rows that could have been approved by that migration.
-- Preserve previous state and amount; never infer human approval.
SET @v24_ddl=CONCAT('CREATE TABLE IF NOT EXISTS earnings_legacy_reviews (
    ledger_id BIGINT NOT NULL PRIMARY KEY,
    previous_status VARCHAR(30) NOT NULL,
    previous_amount DECIMAL(12,2) NULL,
    source_migration VARCHAR(30) NOT NULL,
    queued_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    resolved_at DATETIME(6) NULL,
    CONSTRAINT fk_legacy_earnings_review FOREIGN KEY(ledger_id) REFERENCES driver_earnings_ledger(id)
) DEFAULT CHARACTER SET ',@v24_charset,' COLLATE ',@v24_collation);
PREPARE v24_stmt FROM @v24_ddl;
EXECUTE v24_stmt;
DEALLOCATE PREPARE v24_stmt;

INSERT IGNORE INTO earnings_legacy_reviews(ledger_id,previous_status,previous_amount,source_migration)
SELECT e.id,e.status,e.amount,'17'
FROM driver_earnings_ledger e JOIN flyway_schema_history f ON f.version='17' AND f.success=TRUE
WHERE e.entry_type='EARNED' AND e.status='APPROVED'
AND e.updated_at<TIMESTAMPADD(SECOND,1,f.installed_on)
AND NOT EXISTS(SELECT 1 FROM audit_logs a WHERE CONVERT(a.tenant_id USING utf8mb4) COLLATE utf8mb4_unicode_ci=CONVERT(e.tenant_id USING utf8mb4) COLLATE utf8mb4_unicode_ci AND a.entity_type='DRIVER_EARNINGS_LEDGER' AND CAST(a.entity_id AS BINARY)=CAST(e.id AS BINARY) AND a.action_name='EARNINGS_APPROVED');

UPDATE driver_earnings_ledger e JOIN earnings_legacy_reviews q ON q.ledger_id=e.id SET e.status='PENDING_REVIEW' WHERE q.resolved_at IS NULL AND e.status='APPROVED';

SET @v24_ddl=CONCAT('CREATE TABLE IF NOT EXISTS credit_notes (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,tenant_id VARCHAR(36) NOT NULL,source_invoice_id BIGINT NOT NULL,
 credit_number VARCHAR(50) NOT NULL,bill_to_type VARCHAR(30) NOT NULL,bill_to_id BIGINT NOT NULL,
 amount DECIMAL(12,2) NOT NULL,currency VARCHAR(3) NOT NULL,status VARCHAR(20) NOT NULL,
 reason TEXT NOT NULL,void_reason TEXT NULL,created_by BIGINT NOT NULL,created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 UNIQUE KEY uq_credit_number(tenant_id,credit_number),
 UNIQUE KEY uq_credit_tenant_id(tenant_id,id),
 CONSTRAINT ck_credit_amount CHECK(amount>0),
 CONSTRAINT fk_credit_tenant FOREIGN KEY(tenant_id) REFERENCES tenants(id),
 CONSTRAINT fk_credit_invoice FOREIGN KEY(tenant_id,source_invoice_id) REFERENCES invoices(tenant_id,id)
) DEFAULT CHARACTER SET ',@v24_charset,' COLLATE ',@v24_collation);
PREPARE v24_stmt FROM @v24_ddl;
EXECUTE v24_stmt;
DEALLOCATE PREPARE v24_stmt;

SET @v24_ddl=IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='payments' AND column_name='refunded_amount'),'SELECT 1','ALTER TABLE payments ADD COLUMN refunded_amount DECIMAL(12,2) NOT NULL DEFAULT 0');
PREPARE v24_stmt FROM @v24_ddl;
EXECUTE v24_stmt;
DEALLOCATE PREPARE v24_stmt;

SET @v24_ddl=IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='payments' AND column_name='source_credit_note_id'),'SELECT 1','ALTER TABLE payments ADD COLUMN source_credit_note_id BIGINT NULL');
PREPARE v24_stmt FROM @v24_ddl;
EXECUTE v24_stmt;
DEALLOCATE PREPARE v24_stmt;

SET @v24_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='payments' AND constraint_name='ck_payment_refunds'),'SELECT 1','ALTER TABLE payments ADD CONSTRAINT ck_payment_refunds CHECK(refunded_amount>=0 AND refunded_amount<=amount)');
PREPARE v24_stmt FROM @v24_ddl;
EXECUTE v24_stmt;
DEALLOCATE PREPARE v24_stmt;

SET @v24_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='payments' AND constraint_name='fk_payment_credit_note'),'SELECT 1','ALTER TABLE payments ADD CONSTRAINT fk_payment_credit_note FOREIGN KEY(tenant_id,source_credit_note_id) REFERENCES credit_notes(tenant_id,id)');
PREPARE v24_stmt FROM @v24_ddl;
EXECUTE v24_stmt;
DEALLOCATE PREPARE v24_stmt;

SET @v24_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='payments' AND constraint_name='ck_credit_payment_origin'),'SELECT 1','ALTER TABLE payments ADD CONSTRAINT ck_credit_payment_origin CHECK(payment_method<>''CREDIT_NOTE'' OR source_credit_note_id IS NOT NULL)');
PREPARE v24_stmt FROM @v24_ddl;
EXECUTE v24_stmt;
DEALLOCATE PREPARE v24_stmt;

SET @v24_ddl=CONCAT('CREATE TABLE IF NOT EXISTS payment_refunds (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,tenant_id VARCHAR(36) NOT NULL,payment_id BIGINT NOT NULL,invoice_id BIGINT NOT NULL,
 amount DECIMAL(12,2) NOT NULL,currency VARCHAR(3) NOT NULL,external_reference VARCHAR(150) NOT NULL,reason TEXT NOT NULL,
 created_by BIGINT NOT NULL,created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 UNIQUE KEY uq_refund_reference(tenant_id,external_reference),
 CONSTRAINT ck_refund_positive CHECK(amount>0),
 CONSTRAINT fk_refund_payment FOREIGN KEY(tenant_id,payment_id) REFERENCES payments(tenant_id,id),
 CONSTRAINT fk_refund_invoice FOREIGN KEY(tenant_id,invoice_id) REFERENCES invoices(tenant_id,id)
) DEFAULT CHARACTER SET ',@v24_charset,' COLLATE ',@v24_collation);
PREPARE v24_stmt FROM @v24_ddl;
EXECUTE v24_stmt;
DEALLOCATE PREPARE v24_stmt;

SET @v24_ddl=CONCAT('CREATE TABLE IF NOT EXISTS credit_applications (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,tenant_id VARCHAR(36) NOT NULL,credit_note_id BIGINT NOT NULL,invoice_id BIGINT NOT NULL,payment_id BIGINT NOT NULL,
 amount DECIMAL(12,2) NOT NULL,currency VARCHAR(3) NOT NULL,created_by BIGINT NOT NULL,created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 UNIQUE KEY uq_credit_application_payment(payment_id),
 CONSTRAINT ck_credit_application_positive CHECK(amount>0),
 CONSTRAINT fk_credit_application_note FOREIGN KEY(tenant_id,credit_note_id) REFERENCES credit_notes(tenant_id,id),
 CONSTRAINT fk_credit_application_invoice FOREIGN KEY(tenant_id,invoice_id) REFERENCES invoices(tenant_id,id),
 CONSTRAINT fk_credit_application_payment FOREIGN KEY(tenant_id,payment_id) REFERENCES payments(tenant_id,id)
) DEFAULT CHARACTER SET ',@v24_charset,' COLLATE ',@v24_collation);
PREPARE v24_stmt FROM @v24_ddl;
EXECUTE v24_stmt;
DEALLOCATE PREPARE v24_stmt;

SET @v24_ddl=CONCAT('CREATE TABLE IF NOT EXISTS billing_adjustment_intents (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,tenant_id VARCHAR(36) NOT NULL,request_key VARCHAR(120) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 operation VARCHAR(30) NOT NULL,request_hash VARCHAR(64) NOT NULL,result_id BIGINT NOT NULL,created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 UNIQUE KEY uq_billing_adjustment_intent(tenant_id,request_key)
) DEFAULT CHARACTER SET ',@v24_charset,' COLLATE ',@v24_collation);
PREPARE v24_stmt FROM @v24_ddl;
EXECUTE v24_stmt;
DEALLOCATE PREPARE v24_stmt;

SET @v24_ddl=CONCAT('CREATE TABLE IF NOT EXISTS audit_integrity_heads (
 scope_key VARCHAR(36) NOT NULL PRIMARY KEY,sequence_no BIGINT NOT NULL,signature CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL
) DEFAULT CHARACTER SET ',@v24_charset,' COLLATE ',@v24_collation);
PREPARE v24_stmt FROM @v24_ddl;
EXECUTE v24_stmt;
DEALLOCATE PREPARE v24_stmt;

SET @v24_ddl=CONCAT('CREATE TABLE IF NOT EXISTS audit_integrity_ledger (
 scope_key VARCHAR(36) NOT NULL,sequence_no BIGINT NOT NULL,event_type VARCHAR(30) NOT NULL,audit_id BIGINT NOT NULL,
 content_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,previous_signature CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 signature CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 PRIMARY KEY(scope_key,sequence_no),UNIQUE KEY uq_audit_evidence(scope_key,audit_id,event_type)
) DEFAULT CHARACTER SET ',@v24_charset,' COLLATE ',@v24_collation);
PREPARE v24_stmt FROM @v24_ddl;
EXECUTE v24_stmt;
DEALLOCATE PREPARE v24_stmt;
