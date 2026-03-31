CREATE TABLE vehicles (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    vehicle_code VARCHAR(50) NOT NULL,
    ownership_type VARCHAR(30) NOT NULL,
    make VARCHAR(120) NOT NULL,
    model VARCHAR(120) NOT NULL,
    vehicle_year INT NOT NULL,
    color VARCHAR(80) NULL,
    vin VARCHAR(17) NULL,
    plate_number VARCHAR(30) NOT NULL,
    plate_state VARCHAR(80) NOT NULL,
    capacity INT NOT NULL,
    wheelchair_capacity INT NULL,
    fuel_type VARCHAR(30) NULL,
    insurance_policy_number VARCHAR(120) NULL,
    insurance_expiry_date DATE NULL,
    registration_expiry_date DATE NULL,
    inspection_expiry_date DATE NULL,
    mileage BIGINT NULL,
    assigned_driver_id BIGINT NULL,
    notes VARCHAR(2000) NULL,
    status VARCHAR(30) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_vehicles PRIMARY KEY (id),
    CONSTRAINT uq_vehicles_tenant_vehicle_code UNIQUE (tenant_id, vehicle_code),
    CONSTRAINT uq_vehicles_tenant_vin UNIQUE (tenant_id, vin),
    CONSTRAINT uq_vehicles_tenant_plate UNIQUE (tenant_id, plate_number, plate_state),
    CONSTRAINT fk_vehicles_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_vehicles_tenant_id ON vehicles (tenant_id);
CREATE INDEX idx_vehicles_status ON vehicles (status);
CREATE INDEX idx_vehicles_make_model ON vehicles (make, model);
CREATE INDEX idx_vehicles_plate ON vehicles (plate_number, plate_state);

CREATE TABLE vehicle_service_types (
    vehicle_id BIGINT NOT NULL,
    service_type VARCHAR(80) NOT NULL,
    CONSTRAINT fk_vehicle_service_types_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

CREATE INDEX idx_vehicle_service_types_vehicle_id ON vehicle_service_types (vehicle_id);
CREATE INDEX idx_vehicle_service_types_type ON vehicle_service_types (service_type);

CREATE TABLE vehicle_documents (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    vehicle_id BIGINT NOT NULL,
    document_type VARCHAR(60) NOT NULL,
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
    CONSTRAINT pk_vehicle_documents PRIMARY KEY (id),
    CONSTRAINT fk_vehicle_documents_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_vehicle_documents_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

CREATE INDEX idx_vehicle_documents_vehicle_id ON vehicle_documents (vehicle_id);
CREATE INDEX idx_vehicle_documents_tenant_id ON vehicle_documents (tenant_id);
CREATE INDEX idx_vehicle_documents_document_type ON vehicle_documents (document_type);
CREATE INDEX idx_vehicle_documents_status ON vehicle_documents (status);
CREATE INDEX idx_vehicle_documents_verification_status ON vehicle_documents (verification_status);
CREATE INDEX idx_vehicle_documents_expiry_date ON vehicle_documents (expiry_date);