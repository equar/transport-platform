CREATE TABLE payments (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    invoice_id BIGINT NOT NULL,
    payment_number VARCHAR(50) NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    reference_number VARCHAR(150) NULL,
    payer_name VARCHAR(200) NULL,
    payer_contact VARCHAR(200) NULL,
    external_transaction_id VARCHAR(150) NULL,
    notes VARCHAR(2000) NULL,
    void_reason VARCHAR(1000) NULL,
    status VARCHAR(30) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_payments PRIMARY KEY (id),
    CONSTRAINT uq_payments_tenant_number UNIQUE (tenant_id, payment_number),
    CONSTRAINT fk_payments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_payments_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

CREATE INDEX idx_payments_tenant_status ON payments (tenant_id, status);
CREATE INDEX idx_payments_tenant_invoice ON payments (tenant_id, invoice_id);
CREATE INDEX idx_payments_tenant_date ON payments (tenant_id, payment_date);

CREATE TABLE collection_notes (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    invoice_id BIGINT NOT NULL,
    contact_method VARCHAR(30) NOT NULL,
    note VARCHAR(2000) NOT NULL,
    next_follow_up_date DATE NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_collection_notes PRIMARY KEY (id),
    CONSTRAINT fk_collection_notes_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_collection_notes_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

CREATE INDEX idx_collection_notes_invoice ON collection_notes (invoice_id, created_at);
CREATE INDEX idx_collection_notes_tenant_next_follow_up ON collection_notes (tenant_id, next_follow_up_date);