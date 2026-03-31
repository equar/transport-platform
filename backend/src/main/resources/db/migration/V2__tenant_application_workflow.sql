ALTER TABLE tenants
    ADD COLUMN tenant_code VARCHAR(50) NULL AFTER code,
    ADD COLUMN company_name VARCHAR(150) NULL AFTER tenant_code,
    ADD COLUMN legal_name VARCHAR(150) NULL AFTER company_name,
    ADD COLUMN email VARCHAR(150) NULL AFTER legal_name,
    ADD COLUMN phone VARCHAR(50) NULL AFTER email,
    ADD COLUMN address_line1 VARCHAR(200) NULL AFTER phone,
    ADD COLUMN address_line2 VARCHAR(200) NULL AFTER address_line1,
    ADD COLUMN city VARCHAR(100) NULL AFTER address_line2,
    ADD COLUMN state VARCHAR(100) NULL AFTER city,
    ADD COLUMN zip_code VARCHAR(30) NULL AFTER state,
    ADD COLUMN country VARCHAR(100) NULL AFTER zip_code,
    ADD COLUMN business_type VARCHAR(100) NULL AFTER country,
    ADD COLUMN subscription_plan VARCHAR(50) NULL AFTER business_type,
    ADD COLUMN notes VARCHAR(2000) NULL AFTER subscription_plan,
    ADD COLUMN status VARCHAR(30) NULL AFTER notes;

UPDATE tenants
SET tenant_code = COALESCE(tenant_code, code),
    company_name = COALESCE(company_name, name),
    legal_name = COALESCE(legal_name, name),
    status = COALESCE(status, CASE WHEN active THEN 'ACTIVE' ELSE 'INACTIVE' END);

ALTER TABLE tenants
    MODIFY COLUMN tenant_code VARCHAR(50) NOT NULL,
    MODIFY COLUMN company_name VARCHAR(150) NOT NULL,
    MODIFY COLUMN legal_name VARCHAR(150) NOT NULL,
    MODIFY COLUMN status VARCHAR(30) NOT NULL;

CREATE UNIQUE INDEX uk_tenants_tenant_code ON tenants (tenant_code);
CREATE UNIQUE INDEX uk_tenants_legal_name ON tenants (legal_name);

CREATE TABLE tenant_service_types (
    tenant_id VARCHAR(36) NOT NULL,
    service_type VARCHAR(80) NOT NULL,
    CONSTRAINT pk_tenant_service_types PRIMARY KEY (tenant_id, service_type),
    CONSTRAINT fk_tenant_service_types_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE company_applications (
    id BIGINT NOT NULL AUTO_INCREMENT,
    application_number VARCHAR(50) NOT NULL,
    legal_company_name VARCHAR(150) NOT NULL,
    dba_name VARCHAR(150) NULL,
    contact_first_name VARCHAR(100) NOT NULL,
    contact_last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    business_type VARCHAR(100) NOT NULL,
    address_line1 VARCHAR(200) NOT NULL,
    address_line2 VARCHAR(200) NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(30) NOT NULL,
    country VARCHAR(100) NOT NULL,
    fleet_size INT NULL,
    number_of_drivers INT NULL,
    notes VARCHAR(2000) NULL,
    review_notes VARCHAR(2000) NULL,
    rejection_reason VARCHAR(2000) NULL,
    status VARCHAR(30) NOT NULL,
    approved_tenant_id VARCHAR(36) NULL,
    owner_user_id BIGINT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_company_applications PRIMARY KEY (id),
    CONSTRAINT uk_company_applications_application_number UNIQUE (application_number),
    CONSTRAINT fk_company_applications_tenant FOREIGN KEY (approved_tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_company_applications_owner_user FOREIGN KEY (owner_user_id) REFERENCES app_users(id)
);

CREATE TABLE company_application_service_types (
    company_application_id BIGINT NOT NULL,
    service_type VARCHAR(80) NOT NULL,
    CONSTRAINT pk_company_application_service_types PRIMARY KEY (company_application_id, service_type),
    CONSTRAINT fk_company_application_service_types_application FOREIGN KEY (company_application_id) REFERENCES company_applications(id)
);

CREATE TABLE company_application_review_events (
    id BIGINT NOT NULL AUTO_INCREMENT,
    company_application_id BIGINT NOT NULL,
    action VARCHAR(40) NOT NULL,
    from_status VARCHAR(30) NULL,
    to_status VARCHAR(30) NOT NULL,
    notes VARCHAR(2000) NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_company_application_review_events PRIMARY KEY (id),
    CONSTRAINT fk_company_application_review_events_application FOREIGN KEY (company_application_id) REFERENCES company_applications(id)
);

CREATE INDEX idx_company_applications_status ON company_applications (status);
CREATE INDEX idx_company_applications_email ON company_applications (email);
CREATE INDEX idx_company_applications_legal_company_name ON company_applications (legal_company_name);
