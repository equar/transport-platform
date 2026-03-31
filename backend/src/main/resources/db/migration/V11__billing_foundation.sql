CREATE TABLE pricing_rules (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    pricing_rule_code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(2000) NULL,
    pricing_model VARCHAR(40) NOT NULL,
    bill_to_type VARCHAR(30) NOT NULL,
    service_type VARCHAR(40) NULL,
    rider_type VARCHAR(40) NULL,
    organization_type VARCHAR(40) NULL,
    contract_type VARCHAR(40) NULL,
    trip_type VARCHAR(30) NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    effective_start_date DATE NOT NULL,
    effective_end_date DATE NULL,
    priority_order INT NOT NULL,
    notes VARCHAR(2000) NULL,
    status VARCHAR(30) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_pricing_rules PRIMARY KEY (id),
    CONSTRAINT uq_pricing_rules_tenant_code UNIQUE (tenant_id, pricing_rule_code),
    CONSTRAINT fk_pricing_rules_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_pricing_rules_tenant_status ON pricing_rules (tenant_id, status);
CREATE INDEX idx_pricing_rules_tenant_effective ON pricing_rules (tenant_id, effective_start_date, effective_end_date);
CREATE INDEX idx_pricing_rules_bill_to ON pricing_rules (tenant_id, bill_to_type, pricing_model);

CREATE TABLE invoices (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    invoice_number VARCHAR(50) NOT NULL,
    bill_to_type VARCHAR(30) NOT NULL,
    bill_to_id BIGINT NOT NULL,
    bill_to_name_snapshot VARCHAR(200) NOT NULL,
    contract_id BIGINT NULL,
    organization_id BIGINT NULL,
    rider_id BIGINT NULL,
    guardian_id BIGINT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    billing_period_start DATE NULL,
    billing_period_end DATE NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    tax_amount DECIMAL(12, 2) NOT NULL,
    discount_amount DECIMAL(12, 2) NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    amount_paid DECIMAL(12, 2) NOT NULL,
    balance_due DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    notes VARCHAR(2000) NULL,
    void_reason VARCHAR(1000) NULL,
    status VARCHAR(30) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_invoices PRIMARY KEY (id),
    CONSTRAINT uq_invoices_tenant_number UNIQUE (tenant_id, invoice_number),
    CONSTRAINT fk_invoices_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_invoices_contract FOREIGN KEY (contract_id) REFERENCES contracts(id),
    CONSTRAINT fk_invoices_organization FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_invoices_rider FOREIGN KEY (rider_id) REFERENCES riders(id),
    CONSTRAINT fk_invoices_guardian FOREIGN KEY (guardian_id) REFERENCES guardians(id)
);

CREATE INDEX idx_invoices_tenant_status ON invoices (tenant_id, status);
CREATE INDEX idx_invoices_tenant_bill_to ON invoices (tenant_id, bill_to_type, bill_to_id);
CREATE INDEX idx_invoices_tenant_dates ON invoices (tenant_id, invoice_date, due_date);

CREATE TABLE invoice_line_items (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    invoice_id BIGINT NOT NULL,
    line_number INT NOT NULL,
    description VARCHAR(250) NOT NULL,
    charge_source_type VARCHAR(30) NOT NULL,
    source_reference_id BIGINT NULL,
    pricing_rule_id BIGINT NULL,
    quantity DECIMAL(12, 2) NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    line_amount DECIMAL(12, 2) NOT NULL,
    service_date DATE NULL,
    service_period_label VARCHAR(120) NULL,
    notes VARCHAR(2000) NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_invoice_line_items PRIMARY KEY (id),
    CONSTRAINT uq_invoice_line_items_invoice_line UNIQUE (invoice_id, line_number),
    CONSTRAINT fk_invoice_line_items_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_invoice_line_items_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    CONSTRAINT fk_invoice_line_items_pricing_rule FOREIGN KEY (pricing_rule_id) REFERENCES pricing_rules(id)
);

CREATE INDEX idx_invoice_line_items_invoice ON invoice_line_items (invoice_id, line_number);
CREATE INDEX idx_invoice_line_items_source ON invoice_line_items (tenant_id, charge_source_type, source_reference_id);
