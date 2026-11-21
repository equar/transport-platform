-- Fail on existing duplicate active ride charges rather than silently altering financial history.
ALTER TABLE invoices ADD CONSTRAINT uq_invoice_tenant_id UNIQUE (tenant_id, id);
ALTER TABLE invoice_line_items ADD CONSTRAINT fk_invoice_line_tenant
    FOREIGN KEY (tenant_id, invoice_id) REFERENCES invoices(tenant_id, id);
ALTER TABLE invoice_line_items ADD CONSTRAINT ck_invoice_ride_reference
    CHECK (charge_source_type <> 'RIDE' OR source_reference_id IS NOT NULL);
-- Keep voided history, but exclude its ride sources from the active unique constraint.
ALTER TABLE invoice_line_items ADD COLUMN ride_claim_active BOOLEAN NOT NULL DEFAULT TRUE;
UPDATE invoice_line_items li JOIN invoices i ON i.id = li.invoice_id
SET li.ride_claim_active = FALSE WHERE i.status = 'VOID';
ALTER TABLE invoice_line_items ADD COLUMN active_ride_id BIGINT
    GENERATED ALWAYS AS (CASE WHEN charge_source_type = 'RIDE' AND ride_claim_active
        THEN source_reference_id ELSE NULL END) STORED;
ALTER TABLE invoice_line_items ADD CONSTRAINT uq_invoice_active_ride UNIQUE (tenant_id, active_ride_id);

CREATE TABLE invoice_generation_idempotency (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    idempotency_key VARCHAR(120) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    request_hash VARCHAR(64) NOT NULL,
    invoice_id BIGINT NULL,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT uq_invoice_generation_request UNIQUE (tenant_id, user_id, idempotency_key),
    CONSTRAINT fk_invoice_generation_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);
