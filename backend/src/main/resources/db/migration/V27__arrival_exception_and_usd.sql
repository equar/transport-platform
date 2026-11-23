-- USD-only policy: fail rather than silently relabel historical financial amounts.
-- All DDL is resumable; no existing financial or audit history is rewritten.
SET @review_ddl=IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='trip_delivery_confirmations' AND column_name='exception_reason'),'SELECT 1','ALTER TABLE trip_delivery_confirmations ADD COLUMN exception_reason TEXT NULL');
PREPARE review_stmt FROM @review_ddl;
EXECUTE review_stmt;
DEALLOCATE PREPARE review_stmt;

SET @review_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='invoices' AND constraint_name='chk_invoices_usd'),'SELECT 1','ALTER TABLE invoices ADD CONSTRAINT chk_invoices_usd CHECK (currency = ''USD'')');
PREPARE review_stmt FROM @review_ddl;
EXECUTE review_stmt;
DEALLOCATE PREPARE review_stmt;

SET @review_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='pricing_rules' AND constraint_name='chk_pricing_rules_usd'),'SELECT 1','ALTER TABLE pricing_rules ADD CONSTRAINT chk_pricing_rules_usd CHECK (currency = ''USD'')');
PREPARE review_stmt FROM @review_ddl;
EXECUTE review_stmt;
DEALLOCATE PREPARE review_stmt;

SET @review_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='tenant_settings' AND constraint_name='chk_tenant_settings_usd'),'SELECT 1','ALTER TABLE tenant_settings ADD CONSTRAINT chk_tenant_settings_usd CHECK (currency = ''USD'')');
PREPARE review_stmt FROM @review_ddl;
EXECUTE review_stmt;
DEALLOCATE PREPARE review_stmt;

SET @review_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='pricing_rules' AND constraint_name='uq_pricing_tenant_id'),'SELECT 1','ALTER TABLE pricing_rules ADD CONSTRAINT uq_pricing_tenant_id UNIQUE (tenant_id,id)');
PREPARE review_stmt FROM @review_ddl;
EXECUTE review_stmt;
DEALLOCATE PREPARE review_stmt;

SET @review_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='payments' AND constraint_name='fk_scope_payments_invoice_id'),'SELECT 1','ALTER TABLE payments ADD CONSTRAINT fk_scope_payments_invoice_id FOREIGN KEY (tenant_id,invoice_id) REFERENCES invoices(tenant_id,id)');
PREPARE review_stmt FROM @review_ddl;
EXECUTE review_stmt;
DEALLOCATE PREPARE review_stmt;

SET @review_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='invoice_line_items' AND constraint_name='fk_scope_invoice_line_items_pricing_rule_id'),'SELECT 1','ALTER TABLE invoice_line_items ADD CONSTRAINT fk_scope_invoice_line_items_pricing_rule_id FOREIGN KEY (tenant_id,pricing_rule_id) REFERENCES pricing_rules(tenant_id,id)');
PREPARE review_stmt FROM @review_ddl;
EXECUTE review_stmt;
DEALLOCATE PREPARE review_stmt;

SET @review_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='trip_verified_stops' AND constraint_name='fk_scope_trip_verified_stops_ride_id'),'SELECT 1','ALTER TABLE trip_verified_stops ADD CONSTRAINT fk_scope_trip_verified_stops_ride_id FOREIGN KEY (tenant_id,ride_id) REFERENCES rides(tenant_id,id)');
PREPARE review_stmt FROM @review_ddl;
EXECUTE review_stmt;
DEALLOCATE PREPARE review_stmt;

SET @review_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='trip_milestone_evidence' AND constraint_name='fk_scope_trip_milestone_evidence_ride_id'),'SELECT 1','ALTER TABLE trip_milestone_evidence ADD CONSTRAINT fk_scope_trip_milestone_evidence_ride_id FOREIGN KEY (tenant_id,ride_id) REFERENCES rides(tenant_id,id)');
PREPARE review_stmt FROM @review_ddl;
EXECUTE review_stmt;
DEALLOCATE PREPARE review_stmt;

SET @review_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='trip_milestone_evidence' AND constraint_name='fk_scope_trip_milestone_evidence_driver_id'),'SELECT 1','ALTER TABLE trip_milestone_evidence ADD CONSTRAINT fk_scope_trip_milestone_evidence_driver_id FOREIGN KEY (tenant_id,driver_id) REFERENCES drivers(tenant_id,id)');
PREPARE review_stmt FROM @review_ddl;
EXECUTE review_stmt;
DEALLOCATE PREPARE review_stmt;

SET @review_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='trip_delivery_confirmations' AND constraint_name='fk_scope_trip_delivery_confirmations_ride_id'),'SELECT 1','ALTER TABLE trip_delivery_confirmations ADD CONSTRAINT fk_scope_trip_delivery_confirmations_ride_id FOREIGN KEY (tenant_id,ride_id) REFERENCES rides(tenant_id,id)');
PREPARE review_stmt FROM @review_ddl;
EXECUTE review_stmt;
DEALLOCATE PREPARE review_stmt;

