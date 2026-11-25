-- Resumable MySQL DDL. Never assume the database default still matches existing tenant keys.
SET @review_charset=(SELECT character_set_name FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='tenants' AND column_name='id');
SET @review_collation=(SELECT collation_name FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='tenants' AND column_name='id');

SET @review_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE table_schema=DATABASE() AND table_name='invoice_line_items' AND constraint_name='uq_scope_invoice_line_items_id'),'SELECT 1','ALTER TABLE invoice_line_items ADD CONSTRAINT uq_scope_invoice_line_items_id UNIQUE(tenant_id,id)');
PREPARE review_stmt FROM @review_ddl;
EXECUTE review_stmt;
DEALLOCATE PREPARE review_stmt;

SET @review_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE table_schema=DATABASE() AND table_name='driver_earnings_ledger' AND constraint_name='uq_scope_driver_earnings_id'),'SELECT 1','ALTER TABLE driver_earnings_ledger ADD CONSTRAINT uq_scope_driver_earnings_id UNIQUE(tenant_id,id)');
PREPARE review_stmt FROM @review_ddl;
EXECUTE review_stmt;
DEALLOCATE PREPARE review_stmt;

SET @review_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE table_schema=DATABASE() AND table_name='platform_subscription_invoices' AND constraint_name='uq_scope_subscription_invoice_id'),'SELECT 1','ALTER TABLE platform_subscription_invoices ADD CONSTRAINT uq_scope_subscription_invoice_id UNIQUE(tenant_id,id)');
PREPARE review_stmt FROM @review_ddl;
EXECUTE review_stmt;
DEALLOCATE PREPARE review_stmt;

SET @review_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE table_schema=DATABASE() AND table_name='platform_subscription_payments' AND constraint_name='uq_scope_subscription_payment_id'),'SELECT 1','ALTER TABLE platform_subscription_payments ADD CONSTRAINT uq_scope_subscription_payment_id UNIQUE(invoice_id,id)');
PREPARE review_stmt FROM @review_ddl;
EXECUTE review_stmt;
DEALLOCATE PREPARE review_stmt;

SET @review_ddl=IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='driver_documents' AND column_name='version'),'SELECT 1','ALTER TABLE driver_documents ADD COLUMN version BIGINT NOT NULL DEFAULT 0');
PREPARE review_stmt FROM @review_ddl;
EXECUTE review_stmt;
DEALLOCATE PREPARE review_stmt;

SET @review_ddl=IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='vehicle_documents' AND column_name='version'),'SELECT 1','ALTER TABLE vehicle_documents ADD COLUMN version BIGINT NOT NULL DEFAULT 0');
PREPARE review_stmt FROM @review_ddl;
EXECUTE review_stmt;
DEALLOCATE PREPARE review_stmt;

SET @review_ddl=IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='driver_earnings_ledger' AND column_name='version'),'SELECT 1','ALTER TABLE driver_earnings_ledger ADD COLUMN version BIGINT NOT NULL DEFAULT 0');
PREPARE review_stmt FROM @review_ddl;
EXECUTE review_stmt;
DEALLOCATE PREPARE review_stmt;

SET @review_ddl=CONCAT('CREATE TABLE IF NOT EXISTS invoice_ride_allocations (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 tenant_id VARCHAR(36) NOT NULL, invoice_id BIGINT NOT NULL, line_item_id BIGINT NOT NULL,
 ride_id BIGINT NOT NULL, amount DECIMAL(12,2) NOT NULL, claim_active BOOLEAN NOT NULL DEFAULT TRUE,
 active_ride_id BIGINT GENERATED ALWAYS AS (CASE WHEN claim_active THEN ride_id ELSE NULL END) STORED,
 CONSTRAINT uq_allocation_active_ride UNIQUE(tenant_id,active_ride_id),
 CONSTRAINT uq_allocation_line_ride UNIQUE(line_item_id,ride_id),
 CONSTRAINT fk_allocation_invoice FOREIGN KEY(tenant_id,invoice_id) REFERENCES invoices(tenant_id,id),
 CONSTRAINT fk_allocation_ride FOREIGN KEY(tenant_id,ride_id) REFERENCES rides(tenant_id,id),
 CONSTRAINT fk_allocation_line FOREIGN KEY(tenant_id,line_item_id) REFERENCES invoice_line_items(tenant_id,id) ON DELETE CASCADE,
 CONSTRAINT ck_allocation_amount CHECK(amount>=0),
 INDEX idx_allocation_invoice(tenant_id,invoice_id)
) ENGINE=InnoDB DEFAULT CHARACTER SET ',@review_charset,' COLLATE ',@review_collation);
PREPARE review_stmt FROM @review_ddl;
EXECUTE review_stmt;
DEALLOCATE PREPARE review_stmt;

UPDATE invoice_ride_allocations a JOIN invoices i ON i.tenant_id=a.tenant_id AND i.id=a.invoice_id SET a.claim_active=FALSE WHERE i.status='VOID';

INSERT INTO invoice_ride_allocations(tenant_id,invoice_id,line_item_id,ride_id,amount,claim_active)
 SELECT li.tenant_id,li.invoice_id,li.id,li.source_reference_id,li.line_amount,i.status<>'VOID'
 FROM invoice_line_items li JOIN rides r ON r.tenant_id=li.tenant_id AND r.id=li.source_reference_id JOIN invoices i ON i.id=li.invoice_id AND i.tenant_id=li.tenant_id
 WHERE li.charge_source_type='RIDE' AND li.source_reference_id IS NOT NULL
 AND NOT EXISTS(SELECT 1 FROM invoice_ride_allocations a WHERE a.tenant_id=li.tenant_id AND a.line_item_id=li.id AND a.ride_id=li.source_reference_id);

SET @review_ddl=CONCAT('CREATE TABLE IF NOT EXISTS driver_payouts (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, tenant_id VARCHAR(36) NOT NULL, driver_id BIGINT NOT NULL,
 amount DECIMAL(12,2) NOT NULL, paid_on DATE NOT NULL, reference VARCHAR(150) NOT NULL,
 notes TEXT NULL, created_by BIGINT NOT NULL, created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 reversed_at TIMESTAMP(6) NULL, reversal_reason TEXT NULL,
 CONSTRAINT uq_scope_driver_payout_id UNIQUE(tenant_id,id),
 CONSTRAINT uq_driver_payout_reference UNIQUE(tenant_id,reference),
 CONSTRAINT fk_payout_driver FOREIGN KEY(tenant_id,driver_id) REFERENCES drivers(tenant_id,id),
 CONSTRAINT ck_payout_positive CHECK(amount>0), INDEX idx_driver_payout(tenant_id,driver_id)
) ENGINE=InnoDB DEFAULT CHARACTER SET ',@review_charset,' COLLATE ',@review_collation);
PREPARE review_stmt FROM @review_ddl;
EXECUTE review_stmt;
DEALLOCATE PREPARE review_stmt;

SET @review_ddl=CONCAT('CREATE TABLE IF NOT EXISTS driver_payout_allocations (
 tenant_id VARCHAR(36) NOT NULL, payout_id BIGINT NOT NULL, ledger_id BIGINT NOT NULL, amount DECIMAL(12,2) NOT NULL,
 PRIMARY KEY(payout_id,ledger_id), FOREIGN KEY(tenant_id,payout_id) REFERENCES driver_payouts(tenant_id,id),
 FOREIGN KEY(tenant_id,ledger_id) REFERENCES driver_earnings_ledger(tenant_id,id), CHECK(amount>0)
) ENGINE=InnoDB DEFAULT CHARACTER SET ',@review_charset,' COLLATE ',@review_collation);
PREPARE review_stmt FROM @review_ddl;
EXECUTE review_stmt;
DEALLOCATE PREPARE review_stmt;

SET @review_ddl=CONCAT('CREATE TABLE IF NOT EXISTS invoice_route_claims (
 tenant_id VARCHAR(36) NOT NULL, route_id BIGINT NOT NULL, line_item_id BIGINT NOT NULL,
 PRIMARY KEY(tenant_id,route_id), UNIQUE(line_item_id),
 FOREIGN KEY(tenant_id,route_id) REFERENCES routes(tenant_id,id),
 FOREIGN KEY(tenant_id,line_item_id) REFERENCES invoice_line_items(tenant_id,id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET ',@review_charset,' COLLATE ',@review_collation);
PREPARE review_stmt FROM @review_ddl;
EXECUTE review_stmt;
DEALLOCATE PREPARE review_stmt;

SET @review_ddl=IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='platform_subscription_invoices' AND column_name='credited_amount'),'SELECT 1','ALTER TABLE platform_subscription_invoices ADD COLUMN credited_amount DECIMAL(14,2) NOT NULL DEFAULT 0');
PREPARE review_stmt FROM @review_ddl;
EXECUTE review_stmt;
DEALLOCATE PREPARE review_stmt;

SET @review_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE table_schema=DATABASE() AND table_name='platform_subscription_invoices' AND constraint_name='ck_subscription_credit'),'SELECT 1','ALTER TABLE platform_subscription_invoices ADD CONSTRAINT ck_subscription_credit CHECK(credited_amount>=0 AND credited_amount<=amount)');
PREPARE review_stmt FROM @review_ddl;
EXECUTE review_stmt;
DEALLOCATE PREPARE review_stmt;

SET @review_ddl=CONCAT('CREATE TABLE IF NOT EXISTS platform_subscription_adjustments (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, tenant_id VARCHAR(36) NOT NULL, invoice_id BIGINT NOT NULL,
 payment_id BIGINT NULL, kind VARCHAR(30) NOT NULL, amount DECIMAL(14,2) NOT NULL,
 reference VARCHAR(150) NOT NULL, reason TEXT NOT NULL, created_by BIGINT NOT NULL,
 created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 UNIQUE(tenant_id,reference), FOREIGN KEY(tenant_id,invoice_id) REFERENCES platform_subscription_invoices(tenant_id,id),
 FOREIGN KEY(invoice_id,payment_id) REFERENCES platform_subscription_payments(invoice_id,id), CHECK(amount>0)
) ENGINE=InnoDB DEFAULT CHARACTER SET ',@review_charset,' COLLATE ',@review_collation);
PREPARE review_stmt FROM @review_ddl;
EXECUTE review_stmt;
DEALLOCATE PREPARE review_stmt;

SET @review_ddl=IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='driver_documents' AND column_name='verified_file_sha256'),'SELECT 1','ALTER TABLE driver_documents ADD COLUMN verified_file_sha256 VARCHAR(64) NULL');
PREPARE review_stmt FROM @review_ddl;
EXECUTE review_stmt;
DEALLOCATE PREPARE review_stmt;

SET @review_ddl=IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='vehicle_documents' AND column_name='verified_file_sha256'),'SELECT 1','ALTER TABLE vehicle_documents ADD COLUMN verified_file_sha256 VARCHAR(64) NULL');
PREPARE review_stmt FROM @review_ddl;
EXECUTE review_stmt;
DEALLOCATE PREPARE review_stmt;
