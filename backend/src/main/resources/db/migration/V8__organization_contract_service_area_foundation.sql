CREATE TABLE organizations (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    organization_code VARCHAR(50) NOT NULL,
    organization_type VARCHAR(40) NOT NULL,
    name VARCHAR(150) NOT NULL,
    legal_name VARCHAR(200) NULL,
    address_line1 VARCHAR(200) NULL,
    address_line2 VARCHAR(200) NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    zip_code VARCHAR(30) NULL,
    country VARCHAR(100) NULL,
    billing_address_line1 VARCHAR(200) NULL,
    billing_address_line2 VARCHAR(200) NULL,
    billing_city VARCHAR(100) NULL,
    billing_state VARCHAR(100) NULL,
    billing_zip_code VARCHAR(30) NULL,
    billing_country VARCHAR(100) NULL,
    primary_phone VARCHAR(50) NULL,
    primary_email VARCHAR(150) NULL,
    website VARCHAR(200) NULL,
    notes VARCHAR(2000) NULL,
    status VARCHAR(30) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_organizations PRIMARY KEY (id),
    CONSTRAINT uq_organizations_tenant_code UNIQUE (tenant_id, organization_code),
    CONSTRAINT fk_organizations_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_organizations_tenant_id ON organizations (tenant_id);
CREATE INDEX idx_organizations_status ON organizations (status);
CREATE INDEX idx_organizations_type ON organizations (organization_type);
CREATE INDEX idx_organizations_name ON organizations (name);

CREATE TABLE organization_contacts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    organization_id BIGINT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    title VARCHAR(100) NULL,
    department VARCHAR(100) NULL,
    email VARCHAR(150) NULL,
    phone VARCHAR(50) NULL,
    alternate_phone VARCHAR(50) NULL,
    preferred_communication_method VARCHAR(30) NULL,
    is_primary BIT NOT NULL,
    notes VARCHAR(2000) NULL,
    status VARCHAR(30) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_organization_contacts PRIMARY KEY (id),
    CONSTRAINT fk_organization_contacts_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_organization_contacts_organization FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE INDEX idx_organization_contacts_tenant_id ON organization_contacts (tenant_id);
CREATE INDEX idx_organization_contacts_organization_id ON organization_contacts (organization_id);
CREATE INDEX idx_organization_contacts_status ON organization_contacts (status);
CREATE INDEX idx_organization_contacts_primary ON organization_contacts (is_primary);

CREATE TABLE contracts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    contract_code VARCHAR(50) NOT NULL,
    organization_id BIGINT NOT NULL,
    contract_type VARCHAR(40) NOT NULL,
    contract_name VARCHAR(150) NOT NULL,
    description VARCHAR(2000) NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    renewal_date DATE NULL,
    billing_model VARCHAR(40) NULL,
    rate_notes VARCHAR(2000) NULL,
    invoice_frequency VARCHAR(40) NULL,
    service_window_notes VARCHAR(2000) NULL,
    terms_and_conditions_summary VARCHAR(4000) NULL,
    notes VARCHAR(2000) NULL,
    status VARCHAR(30) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_contracts PRIMARY KEY (id),
    CONSTRAINT uq_contracts_tenant_code UNIQUE (tenant_id, contract_code),
    CONSTRAINT fk_contracts_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_contracts_organization FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE INDEX idx_contracts_tenant_id ON contracts (tenant_id);
CREATE INDEX idx_contracts_organization_id ON contracts (organization_id);
CREATE INDEX idx_contracts_status ON contracts (status);
CREATE INDEX idx_contracts_type ON contracts (contract_type);
CREATE INDEX idx_contracts_dates ON contracts (start_date, end_date, renewal_date);

CREATE TABLE contract_service_types (
    contract_id BIGINT NOT NULL,
    service_type VARCHAR(40) NOT NULL,
    CONSTRAINT fk_contract_service_types_contract FOREIGN KEY (contract_id) REFERENCES contracts(id)
);

CREATE INDEX idx_contract_service_types_contract_id ON contract_service_types (contract_id);

CREATE TABLE service_areas (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    area_code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(2000) NULL,
    coverage_type VARCHAR(30) NOT NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    zip_code VARCHAR(30) NULL,
    county VARCHAR(100) NULL,
    operating_days_summary VARCHAR(200) NULL,
    operating_hours_summary VARCHAR(200) NULL,
    notes VARCHAR(2000) NULL,
    status VARCHAR(30) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_service_areas PRIMARY KEY (id),
    CONSTRAINT uq_service_areas_tenant_code UNIQUE (tenant_id, area_code),
    CONSTRAINT fk_service_areas_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_service_areas_tenant_id ON service_areas (tenant_id);
CREATE INDEX idx_service_areas_status ON service_areas (status);
CREATE INDEX idx_service_areas_coverage_type ON service_areas (coverage_type);

CREATE TABLE service_area_service_types (
    service_area_id BIGINT NOT NULL,
    service_type VARCHAR(40) NOT NULL,
    CONSTRAINT fk_service_area_service_types_service_area FOREIGN KEY (service_area_id) REFERENCES service_areas(id)
);

CREATE INDEX idx_service_area_service_types_area_id ON service_area_service_types (service_area_id);

ALTER TABLE riders
    ADD CONSTRAINT fk_riders_organization FOREIGN KEY (organization_id) REFERENCES organizations(id);
