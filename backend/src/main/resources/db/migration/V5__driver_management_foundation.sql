CREATE TABLE drivers (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    driver_code VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NULL,
    email VARCHAR(150) NULL,
    phone VARCHAR(50) NOT NULL,
    alternate_phone VARCHAR(50) NULL,
    address_line1 VARCHAR(200) NULL,
    address_line2 VARCHAR(200) NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    zip_code VARCHAR(30) NULL,
    country VARCHAR(100) NULL,
    driver_type VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL,
    hire_date DATE NULL,
    start_date DATE NULL,
    availability_summary VARCHAR(200) NULL,
    license_number VARCHAR(80) NULL,
    license_state VARCHAR(80) NULL,
    license_expiry_date DATE NULL,
    background_check_status VARCHAR(30) NOT NULL,
    background_check_expiry_date DATE NULL,
    drug_test_status VARCHAR(30) NOT NULL,
    drug_test_expiry_date DATE NULL,
    training_status VARCHAR(30) NOT NULL,
    training_completion_date DATE NULL,
    emergency_contact_name VARCHAR(150) NULL,
    emergency_contact_phone VARCHAR(50) NULL,
    emergency_contact_relationship VARCHAR(100) NULL,
    notes VARCHAR(2000) NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_drivers PRIMARY KEY (id),
    CONSTRAINT uq_drivers_tenant_driver_code UNIQUE (tenant_id, driver_code),
    CONSTRAINT fk_drivers_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_drivers_tenant_id ON drivers (tenant_id);
CREATE INDEX idx_drivers_status ON drivers (status);
CREATE INDEX idx_drivers_name ON drivers (last_name, first_name);
CREATE INDEX idx_drivers_license_number ON drivers (license_number);

CREATE TABLE driver_documents (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    driver_id BIGINT NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(255) NULL,
    content_type VARCHAR(120) NULL,
    storage_path VARCHAR(500) NULL,
    document_number VARCHAR(120) NULL,
    issuing_authority VARCHAR(150) NULL,
    issue_date DATE NULL,
    expiry_date DATE NULL,
    verification_status VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL,
    notes VARCHAR(2000) NULL,
    uploaded_by VARCHAR(100) NOT NULL,
    uploaded_at DATETIME(6) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_driver_documents PRIMARY KEY (id),
    CONSTRAINT fk_driver_documents_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_driver_documents_driver FOREIGN KEY (driver_id) REFERENCES drivers(id)
);

CREATE INDEX idx_driver_documents_driver_id ON driver_documents (driver_id);
CREATE INDEX idx_driver_documents_tenant_id ON driver_documents (tenant_id);
CREATE INDEX idx_driver_documents_document_type ON driver_documents (document_type);
CREATE INDEX idx_driver_documents_status ON driver_documents (status);
CREATE INDEX idx_driver_documents_verification_status ON driver_documents (verification_status);
CREATE INDEX idx_driver_documents_expiry_date ON driver_documents (expiry_date);