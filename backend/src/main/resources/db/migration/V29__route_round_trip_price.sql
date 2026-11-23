ALTER TABLE routes ADD COLUMN round_trip_price DECIMAL(12,2) NULL;
ALTER TABLE routes ADD CONSTRAINT chk_route_round_trip_price CHECK (round_trip_price >= 0);
ALTER TABLE routes ADD COLUMN billing_trip_type VARCHAR(20) NULL,
    ADD COLUMN bill_to_type VARCHAR(20) NULL,
    ADD COLUMN bill_to_id BIGINT NULL,
    ADD COLUMN auto_invoice_id BIGINT NULL;
ALTER TABLE routes ADD CONSTRAINT fk_route_auto_invoice_tenant
    FOREIGN KEY (tenant_id, auto_invoice_id) REFERENCES invoices (tenant_id, id);
ALTER TABLE routes ADD CONSTRAINT uq_route_auto_invoice UNIQUE (auto_invoice_id);
