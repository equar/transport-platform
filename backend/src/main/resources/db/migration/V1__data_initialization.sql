-- Consolidated schema-only baseline migration

-- Generated from the original V1 through V27 migrations; test-data seed migrations are intentionally excluded.

-- ================================================================
-- BEGIN V1__init_foundation.sql
CREATE TABLE tenants (
    id VARCHAR(36) NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_tenants PRIMARY KEY (id),
    CONSTRAINT uk_tenants_code UNIQUE (code)
);

CREATE TABLE app_users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NULL,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_app_users PRIMARY KEY (id),
    CONSTRAINT uk_app_users_tenant_email UNIQUE (tenant_id, email),
    CONSTRAINT fk_app_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_name VARCHAR(64) NOT NULL,
    CONSTRAINT pk_user_roles PRIMARY KEY (user_id, role_name),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES app_users(id)
);

CREATE INDEX idx_app_users_tenant_id ON app_users (tenant_id);
CREATE INDEX idx_app_users_email ON app_users (email);
-- END V1__init_foundation.sql

-- ================================================================
-- BEGIN V2__tenant_application_workflow.sql
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
-- END V2__tenant_application_workflow.sql

-- ================================================================
-- BEGIN V3__user_management_foundation.sql
ALTER TABLE app_users
    ADD COLUMN first_name VARCHAR(100) NULL AFTER email,
    ADD COLUMN last_name VARCHAR(100) NULL AFTER first_name,
    ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' AFTER password_hash,
    ADD COLUMN last_login_at DATETIME(6) NULL AFTER status;

UPDATE app_users
SET status = CASE
    WHEN locked = TRUE THEN 'SUSPENDED'
    WHEN enabled = TRUE THEN 'ACTIVE'
    ELSE 'INVITED'
END;

UPDATE app_users
SET first_name = COALESCE(first_name, CASE WHEN tenant_id IS NULL THEN 'Platform' ELSE 'Team' END),
    last_name = COALESCE(last_name, CASE WHEN tenant_id IS NULL THEN 'Administrator' ELSE 'Member' END)
WHERE first_name IS NULL OR last_name IS NULL;

CREATE INDEX idx_app_users_status ON app_users (status);-- END V3__user_management_foundation.sql

-- ================================================================
-- BEGIN V4__audit_log_foundation.sql
CREATE TABLE audit_logs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    actor_user_id BIGINT NULL,
    actor_email VARCHAR(150) NULL,
    actor_name VARCHAR(150) NULL,
    tenant_id VARCHAR(36) NULL,
    module_name VARCHAR(80) NOT NULL,
    action_name VARCHAR(80) NOT NULL,
    entity_type VARCHAR(80) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    summary VARCHAR(500) NOT NULL,
    old_value_json TEXT NULL,
    new_value_json TEXT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_audit_logs PRIMARY KEY (id),
    CONSTRAINT fk_audit_logs_actor_user FOREIGN KEY (actor_user_id) REFERENCES app_users(id),
    CONSTRAINT fk_audit_logs_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at);
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs (tenant_id);
CREATE INDEX idx_audit_logs_module_name ON audit_logs (module_name);
CREATE INDEX idx_audit_logs_action_name ON audit_logs (action_name);-- END V4__audit_log_foundation.sql

-- ================================================================
-- BEGIN V5__driver_management_foundation.sql
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
CREATE INDEX idx_driver_documents_expiry_date ON driver_documents (expiry_date);-- END V5__driver_management_foundation.sql

-- ================================================================
-- BEGIN V6__vehicle_management_foundation.sql
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
CREATE INDEX idx_vehicle_documents_expiry_date ON vehicle_documents (expiry_date);-- END V6__vehicle_management_foundation.sql

-- ================================================================
-- BEGIN V7__rider_guardian_management_foundation.sql
CREATE TABLE riders (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    rider_code VARCHAR(50) NOT NULL,
    rider_type VARCHAR(30) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NULL,
    gender VARCHAR(30) NULL,
    email VARCHAR(150) NULL,
    primary_phone VARCHAR(50) NOT NULL,
    alternate_phone VARCHAR(50) NULL,
    home_address_line1 VARCHAR(200) NULL,
    home_address_line2 VARCHAR(200) NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    zip_code VARCHAR(30) NULL,
    country VARCHAR(100) NULL,
    default_pickup_address VARCHAR(300) NULL,
    default_dropoff_address VARCHAR(300) NULL,
    pickup_notes VARCHAR(1000) NULL,
    dropoff_notes VARCHAR(1000) NULL,
    preferred_pickup_window_start TIME NULL,
    preferred_pickup_window_end TIME NULL,
    preferred_dropoff_window_start TIME NULL,
    preferred_dropoff_window_end TIME NULL,
    wheelchair_required BIT NOT NULL,
    escort_required BIT NOT NULL,
    special_instructions VARCHAR(2000) NULL,
    care_notes_summary VARCHAR(2000) NULL,
    emergency_contact_name VARCHAR(150) NULL,
    emergency_contact_phone VARCHAR(50) NULL,
    emergency_contact_relationship VARCHAR(100) NULL,
    organization_id BIGINT NULL,
    notes VARCHAR(2000) NULL,
    status VARCHAR(30) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_riders PRIMARY KEY (id),
    CONSTRAINT uq_riders_tenant_rider_code UNIQUE (tenant_id, rider_code),
    CONSTRAINT fk_riders_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_riders_tenant_id ON riders (tenant_id);
CREATE INDEX idx_riders_status ON riders (status);
CREATE INDEX idx_riders_type ON riders (rider_type);
CREATE INDEX idx_riders_name ON riders (last_name, first_name);
CREATE INDEX idx_riders_phone ON riders (primary_phone);

CREATE TABLE rider_mobility_needs (
    rider_id BIGINT NOT NULL,
    mobility_need VARCHAR(40) NOT NULL,
    CONSTRAINT fk_rider_mobility_needs_rider FOREIGN KEY (rider_id) REFERENCES riders(id)
);

CREATE INDEX idx_rider_mobility_needs_rider_id ON rider_mobility_needs (rider_id);
CREATE INDEX idx_rider_mobility_needs_need ON rider_mobility_needs (mobility_need);

CREATE TABLE guardians (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NOT NULL,
    relation_to_rider_default VARCHAR(100) NULL,
    email VARCHAR(150) NULL,
    phone VARCHAR(50) NOT NULL,
    alternate_phone VARCHAR(50) NULL,
    address_line1 VARCHAR(200) NULL,
    address_line2 VARCHAR(200) NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    zip_code VARCHAR(30) NULL,
    country VARCHAR(100) NULL,
    preferred_communication_method VARCHAR(30) NULL,
    billing_contact BIT NOT NULL,
    authorized_for_pickup BIT NOT NULL,
    notes VARCHAR(2000) NULL,
    status VARCHAR(30) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_guardians PRIMARY KEY (id),
    CONSTRAINT fk_guardians_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_guardians_tenant_id ON guardians (tenant_id);
CREATE INDEX idx_guardians_status ON guardians (status);
CREATE INDEX idx_guardians_name ON guardians (last_name, first_name);
CREATE INDEX idx_guardians_phone ON guardians (phone);

CREATE TABLE rider_guardians (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    rider_id BIGINT NOT NULL,
    guardian_id BIGINT NOT NULL,
    relationship_type VARCHAR(40) NOT NULL,
    primary_guardian BIT NOT NULL,
    authorized_for_pickup BIT NOT NULL,
    billing_contact BIT NOT NULL,
    notes VARCHAR(2000) NULL,
    status VARCHAR(30) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_rider_guardians PRIMARY KEY (id),
    CONSTRAINT uq_rider_guardians_tenant_rider_guardian UNIQUE (tenant_id, rider_id, guardian_id),
    CONSTRAINT fk_rider_guardians_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_rider_guardians_rider FOREIGN KEY (rider_id) REFERENCES riders(id),
    CONSTRAINT fk_rider_guardians_guardian FOREIGN KEY (guardian_id) REFERENCES guardians(id)
);

CREATE INDEX idx_rider_guardians_tenant_id ON rider_guardians (tenant_id);
CREATE INDEX idx_rider_guardians_rider_id ON rider_guardians (rider_id);
CREATE INDEX idx_rider_guardians_guardian_id ON rider_guardians (guardian_id);
CREATE INDEX idx_rider_guardians_status ON rider_guardians (status);
CREATE INDEX idx_rider_guardians_primary_guardian ON rider_guardians (primary_guardian);-- END V7__rider_guardian_management_foundation.sql

-- ================================================================
-- BEGIN V8__organization_contract_service_area_foundation.sql
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
-- END V8__organization_contract_service_area_foundation.sql

-- ================================================================
-- BEGIN V9__ride_management_foundation.sql
CREATE TABLE recurring_ride_schedules (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    recurrence_code VARCHAR(50) NOT NULL,
    rider_id BIGINT NOT NULL,
    guardian_id BIGINT NULL,
    organization_id BIGINT NULL,
    contract_id BIGINT NULL,
    service_area_id BIGINT NULL,
    service_type VARCHAR(40) NOT NULL,
    trip_type VARCHAR(30) NOT NULL,
    pickup_address_line1 VARCHAR(200) NOT NULL,
    pickup_address_line2 VARCHAR(200) NULL,
    pickup_city VARCHAR(100) NOT NULL,
    pickup_state VARCHAR(100) NOT NULL,
    pickup_zip_code VARCHAR(30) NOT NULL,
    pickup_country VARCHAR(100) NOT NULL,
    dropoff_address_line1 VARCHAR(200) NOT NULL,
    dropoff_address_line2 VARCHAR(200) NULL,
    dropoff_city VARCHAR(100) NOT NULL,
    dropoff_state VARCHAR(100) NOT NULL,
    dropoff_zip_code VARCHAR(30) NOT NULL,
    dropoff_country VARCHAR(100) NOT NULL,
    scheduled_pickup_time TIME NOT NULL,
    scheduled_dropoff_time TIME NULL,
    return_pickup_time TIME NULL,
    return_dropoff_time TIME NULL,
    recurrence_pattern_type VARCHAR(30) NOT NULL,
    interval_days INT NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    occurrence_limit INT NULL,
    wheelchair_required BIT NOT NULL,
    escort_required BIT NOT NULL,
    companion_count INT NOT NULL,
    special_instructions VARCHAR(2000) NULL,
    internal_notes VARCHAR(2000) NULL,
    billing_type VARCHAR(40) NULL,
    status VARCHAR(30) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_recurring_ride_schedules PRIMARY KEY (id),
    CONSTRAINT uq_recurring_ride_schedules_tenant_code UNIQUE (tenant_id, recurrence_code),
    CONSTRAINT fk_recurring_ride_schedules_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_recurring_ride_schedules_rider FOREIGN KEY (rider_id) REFERENCES riders(id),
    CONSTRAINT fk_recurring_ride_schedules_guardian FOREIGN KEY (guardian_id) REFERENCES guardians(id),
    CONSTRAINT fk_recurring_ride_schedules_organization FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_recurring_ride_schedules_contract FOREIGN KEY (contract_id) REFERENCES contracts(id),
    CONSTRAINT fk_recurring_ride_schedules_service_area FOREIGN KEY (service_area_id) REFERENCES service_areas(id)
);

CREATE INDEX idx_recurring_ride_schedules_tenant_id ON recurring_ride_schedules (tenant_id);
CREATE INDEX idx_recurring_ride_schedules_status ON recurring_ride_schedules (status);
CREATE INDEX idx_recurring_ride_schedules_rider_id ON recurring_ride_schedules (rider_id);
CREATE INDEX idx_recurring_ride_schedules_dates ON recurring_ride_schedules (start_date, end_date);

CREATE TABLE recurring_ride_schedule_days_of_week (
    recurring_ride_schedule_id BIGINT NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    CONSTRAINT fk_recurring_ride_schedule_days FOREIGN KEY (recurring_ride_schedule_id)
        REFERENCES recurring_ride_schedules(id)
);

CREATE INDEX idx_recurring_ride_schedule_days_schedule_id
    ON recurring_ride_schedule_days_of_week (recurring_ride_schedule_id);

CREATE TABLE recurring_ride_schedule_skip_dates (
    recurring_ride_schedule_id BIGINT NOT NULL,
    skip_date DATE NOT NULL,
    CONSTRAINT fk_recurring_ride_schedule_skip_dates FOREIGN KEY (recurring_ride_schedule_id)
        REFERENCES recurring_ride_schedules(id)
);

CREATE INDEX idx_recurring_ride_schedule_skip_dates_schedule_id
    ON recurring_ride_schedule_skip_dates (recurring_ride_schedule_id);

CREATE TABLE rides (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    ride_number VARCHAR(50) NOT NULL,
    rider_id BIGINT NOT NULL,
    guardian_id BIGINT NULL,
    organization_id BIGINT NULL,
    contract_id BIGINT NULL,
    service_area_id BIGINT NULL,
    service_type VARCHAR(40) NOT NULL,
    trip_type VARCHAR(30) NOT NULL,
    pickup_address_line1 VARCHAR(200) NOT NULL,
    pickup_address_line2 VARCHAR(200) NULL,
    pickup_city VARCHAR(100) NOT NULL,
    pickup_state VARCHAR(100) NOT NULL,
    pickup_zip_code VARCHAR(30) NOT NULL,
    pickup_country VARCHAR(100) NOT NULL,
    dropoff_address_line1 VARCHAR(200) NOT NULL,
    dropoff_address_line2 VARCHAR(200) NULL,
    dropoff_city VARCHAR(100) NOT NULL,
    dropoff_state VARCHAR(100) NOT NULL,
    dropoff_zip_code VARCHAR(30) NOT NULL,
    dropoff_country VARCHAR(100) NOT NULL,
    scheduled_pickup_at DATETIME(6) NOT NULL,
    scheduled_dropoff_at DATETIME(6) NULL,
    return_pickup_at DATETIME(6) NULL,
    return_dropoff_at DATETIME(6) NULL,
    wheelchair_required BIT NOT NULL,
    escort_required BIT NOT NULL,
    companion_count INT NOT NULL,
    special_instructions VARCHAR(2000) NULL,
    internal_notes VARCHAR(2000) NULL,
    operational_notes VARCHAR(2000) NULL,
    priority_level VARCHAR(30) NULL,
    billing_type VARCHAR(40) NULL,
    driver_id BIGINT NULL,
    vehicle_id BIGINT NULL,
    route_id BIGINT NULL,
    recurrence_schedule_id BIGINT NULL,
    cancellation_reason VARCHAR(1000) NULL,
    cancelled_at DATETIME(6) NULL,
    cancelled_by VARCHAR(100) NULL,
    status VARCHAR(30) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_rides PRIMARY KEY (id),
    CONSTRAINT uq_rides_tenant_number UNIQUE (tenant_id, ride_number),
    CONSTRAINT fk_rides_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_rides_rider FOREIGN KEY (rider_id) REFERENCES riders(id),
    CONSTRAINT fk_rides_guardian FOREIGN KEY (guardian_id) REFERENCES guardians(id),
    CONSTRAINT fk_rides_organization FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_rides_contract FOREIGN KEY (contract_id) REFERENCES contracts(id),
    CONSTRAINT fk_rides_service_area FOREIGN KEY (service_area_id) REFERENCES service_areas(id),
    CONSTRAINT fk_rides_driver FOREIGN KEY (driver_id) REFERENCES drivers(id),
    CONSTRAINT fk_rides_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    CONSTRAINT fk_rides_recurrence_schedule FOREIGN KEY (recurrence_schedule_id) REFERENCES recurring_ride_schedules(id)
);

CREATE INDEX idx_rides_tenant_id ON rides (tenant_id);
CREATE INDEX idx_rides_status ON rides (status);
CREATE INDEX idx_rides_rider_id ON rides (rider_id);
CREATE INDEX idx_rides_organization_id ON rides (organization_id);
CREATE INDEX idx_rides_scheduled_pickup_at ON rides (scheduled_pickup_at);
CREATE INDEX idx_rides_recurrence_schedule_id ON rides (recurrence_schedule_id);
CREATE UNIQUE INDEX uq_rides_recurrence_pickup ON rides (recurrence_schedule_id, scheduled_pickup_at);-- END V9__ride_management_foundation.sql

-- ================================================================
-- BEGIN V10__dispatch_route_operations_foundation.sql
CREATE TABLE routes (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    route_code VARCHAR(50) NOT NULL,
    route_name VARCHAR(150) NOT NULL,
    route_date DATE NOT NULL,
    service_type VARCHAR(40) NOT NULL,
    assigned_driver_id BIGINT NULL,
    assigned_vehicle_id BIGINT NULL,
    start_time TIME NULL,
    end_time TIME NULL,
    manifest_notes VARCHAR(2000) NULL,
    notes VARCHAR(2000) NULL,
    status VARCHAR(30) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_routes PRIMARY KEY (id),
    CONSTRAINT uq_routes_tenant_code UNIQUE (tenant_id, route_code),
    CONSTRAINT fk_routes_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_routes_driver FOREIGN KEY (assigned_driver_id) REFERENCES drivers(id),
    CONSTRAINT fk_routes_vehicle FOREIGN KEY (assigned_vehicle_id) REFERENCES vehicles(id)
);

CREATE INDEX idx_routes_tenant_date ON routes (tenant_id, route_date);
CREATE INDEX idx_routes_status ON routes (status);
CREATE INDEX idx_routes_service_type ON routes (service_type);

CREATE TABLE route_stops (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    route_id BIGINT NOT NULL,
    ride_id BIGINT NOT NULL,
    stop_sequence INT NOT NULL,
    planned_pickup_at DATETIME(6) NULL,
    planned_dropoff_at DATETIME(6) NULL,
    notes VARCHAR(1000) NULL,
    status VARCHAR(30) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_route_stops PRIMARY KEY (id),
    CONSTRAINT uq_route_stops_route_ride UNIQUE (route_id, ride_id),
    CONSTRAINT uq_route_stops_route_sequence UNIQUE (route_id, stop_sequence),
    CONSTRAINT fk_route_stops_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_route_stops_route FOREIGN KEY (route_id) REFERENCES routes(id),
    CONSTRAINT fk_route_stops_ride FOREIGN KEY (ride_id) REFERENCES rides(id)
);

CREATE INDEX idx_route_stops_tenant_route ON route_stops (tenant_id, route_id, stop_sequence);
CREATE INDEX idx_route_stops_ride_id ON route_stops (ride_id);

CREATE TABLE ride_events (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    ride_id BIGINT NOT NULL,
    event_type VARCHAR(40) NOT NULL,
    actor_user_id BIGINT NULL,
    actor_name VARCHAR(150) NULL,
    actor_email VARCHAR(150) NULL,
    previous_status VARCHAR(30) NULL,
    new_status VARCHAR(30) NULL,
    notes VARCHAR(2000) NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_ride_events PRIMARY KEY (id),
    CONSTRAINT fk_ride_events_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_ride_events_ride FOREIGN KEY (ride_id) REFERENCES rides(id)
);

CREATE INDEX idx_ride_events_tenant_ride ON ride_events (tenant_id, ride_id, created_at);
CREATE INDEX idx_ride_events_type ON ride_events (event_type);

ALTER TABLE rides
    ADD CONSTRAINT fk_rides_route FOREIGN KEY (route_id) REFERENCES routes(id);

CREATE INDEX idx_rides_driver_id ON rides (driver_id);
CREATE INDEX idx_rides_vehicle_id ON rides (vehicle_id);
CREATE INDEX idx_rides_route_id ON rides (route_id);-- END V10__dispatch_route_operations_foundation.sql

-- ================================================================
-- BEGIN V11__billing_foundation.sql
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
-- END V11__billing_foundation.sql

-- ================================================================
-- BEGIN V12__billing_payments_and_receivables.sql
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
CREATE INDEX idx_collection_notes_tenant_next_follow_up ON collection_notes (tenant_id, next_follow_up_date);-- END V12__billing_payments_and_receivables.sql

-- ================================================================
-- BEGIN V13__notifications_and_compliance_foundation.sql
CREATE TABLE notification_templates (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    template_code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    event_type VARCHAR(60) NOT NULL,
    channel VARCHAR(30) NOT NULL,
    subject_template VARCHAR(255) NULL,
    title_template VARCHAR(255) NULL,
    body_template VARCHAR(4000) NOT NULL,
    description VARCHAR(2000) NULL,
    is_default BIT NOT NULL,
    status VARCHAR(30) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_notification_templates PRIMARY KEY (id),
    CONSTRAINT uq_notification_templates_tenant_code UNIQUE (tenant_id, template_code),
    CONSTRAINT fk_notification_templates_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_notification_templates_tenant_status ON notification_templates (tenant_id, status);
CREATE INDEX idx_notification_templates_event_channel ON notification_templates (tenant_id, event_type, channel);

CREATE TABLE notifications (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    notification_code VARCHAR(50) NOT NULL,
    recipient_user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message VARCHAR(4000) NOT NULL,
    notification_type VARCHAR(60) NOT NULL,
    channel VARCHAR(30) NOT NULL,
    related_entity_type VARCHAR(60) NULL,
    related_entity_id VARCHAR(100) NULL,
    delivery_status VARCHAR(30) NOT NULL,
    read_status VARCHAR(30) NOT NULL,
    sent_at DATETIME(6) NULL,
    read_at DATETIME(6) NULL,
    error_message VARCHAR(1000) NULL,
    metadata_json VARCHAR(4000) NULL,
    status VARCHAR(30) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_notifications PRIMARY KEY (id),
    CONSTRAINT uq_notifications_tenant_code UNIQUE (tenant_id, notification_code),
    CONSTRAINT fk_notifications_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_notifications_recipient_user FOREIGN KEY (recipient_user_id) REFERENCES app_users(id)
);

CREATE INDEX idx_notifications_recipient_read ON notifications (tenant_id, recipient_user_id, read_status, status);
CREATE INDEX idx_notifications_type_channel ON notifications (tenant_id, recipient_user_id, notification_type, channel);
CREATE INDEX idx_notifications_created_at ON notifications (tenant_id, recipient_user_id, created_at);

CREATE TABLE compliance_issues (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    source_key VARCHAR(200) NOT NULL,
    entity_type VARCHAR(30) NOT NULL,
    entity_id BIGINT NOT NULL,
    entity_code VARCHAR(80) NOT NULL,
    entity_name_summary VARCHAR(255) NOT NULL,
    issue_type VARCHAR(50) NOT NULL,
    severity VARCHAR(30) NOT NULL,
    related_document_type VARCHAR(80) NULL,
    expiry_date DATE NULL,
    summary VARCHAR(500) NOT NULL,
    recommended_action VARCHAR(1000) NULL,
    issue_status VARCHAR(30) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_compliance_issues PRIMARY KEY (id),
    CONSTRAINT uq_compliance_issues_tenant_source UNIQUE (tenant_id, source_key),
    CONSTRAINT fk_compliance_issues_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_compliance_issues_tenant_status ON compliance_issues (tenant_id, issue_status);
CREATE INDEX idx_compliance_issues_entity ON compliance_issues (tenant_id, entity_type, entity_id);
CREATE INDEX idx_compliance_issues_severity ON compliance_issues (tenant_id, severity);-- END V13__notifications_and_compliance_foundation.sql

-- ================================================================
-- BEGIN V14__incident_reporting_and_settings_foundation.sql
CREATE TABLE incidents (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    incident_code VARCHAR(50) NOT NULL,
    incident_type VARCHAR(50) NOT NULL,
    severity VARCHAR(30) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(4000) NOT NULL,
    reported_at DATETIME(6) NOT NULL,
    reported_by_user_id BIGINT NULL,
    reported_by_name_snapshot VARCHAR(150) NOT NULL,
    related_ride_id BIGINT NULL,
    related_driver_id BIGINT NULL,
    related_vehicle_id BIGINT NULL,
    related_rider_id BIGINT NULL,
    related_guardian_id BIGINT NULL,
    related_organization_id BIGINT NULL,
    assigned_to_user_id BIGINT NULL,
    resolution_summary VARCHAR(2000) NULL,
    root_cause_summary VARCHAR(2000) NULL,
    corrective_action_summary VARCHAR(2000) NULL,
    notes VARCHAR(4000) NULL,
    status VARCHAR(30) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_incidents PRIMARY KEY (id),
    CONSTRAINT uq_incidents_tenant_code UNIQUE (tenant_id, incident_code),
    CONSTRAINT fk_incidents_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_incidents_reported_user FOREIGN KEY (reported_by_user_id) REFERENCES app_users(id),
    CONSTRAINT fk_incidents_assigned_user FOREIGN KEY (assigned_to_user_id) REFERENCES app_users(id)
);

CREATE INDEX idx_incidents_tenant_status ON incidents (tenant_id, status);
CREATE INDEX idx_incidents_tenant_severity ON incidents (tenant_id, severity);
CREATE INDEX idx_incidents_tenant_reported_at ON incidents (tenant_id, reported_at);

CREATE TABLE tenant_settings (
    tenant_id VARCHAR(36) NOT NULL,
    timezone VARCHAR(80) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    date_format VARCHAR(30) NOT NULL,
    default_ride_lead_time_minutes INT NOT NULL,
    allow_manual_ride_creation BIT NOT NULL,
    allow_round_trip_rides BIT NOT NULL,
    dispatch_strict_compliance_mode BIT NOT NULL,
    default_invoice_due_days INT NOT NULL,
    default_notification_preferences_summary VARCHAR(500) NULL,
    require_driver_license BIT NOT NULL,
    require_background_check BIT NOT NULL,
    require_drug_test BIT NOT NULL,
    require_vehicle_registration BIT NOT NULL,
    require_vehicle_insurance BIT NOT NULL,
    require_vehicle_inspection BIT NOT NULL,
    expiring_soon_threshold_days INT NOT NULL,
    invoice_prefix VARCHAR(20) NOT NULL,
    payment_prefix VARCHAR(20) NOT NULL,
    pricing_rule_prefix VARCHAR(20) NOT NULL,
    tax_enabled BIT NOT NULL,
    default_tax_rate DECIMAL(5,2) NOT NULL,
    allow_manual_invoice_overrides BIT NOT NULL,
    company_logo_url VARCHAR(500) NULL,
    primary_color VARCHAR(20) NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_tenant_settings PRIMARY KEY (tenant_id),
    CONSTRAINT fk_tenant_settings_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);-- END V14__incident_reporting_and_settings_foundation.sql

-- ================================================================
-- BEGIN V15__portal_access_foundation.sql
CREATE TABLE portal_user_scopes (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    app_user_id BIGINT NOT NULL,
    portal_subject_type VARCHAR(40) NOT NULL,
    portal_subject_id BIGINT NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_portal_user_scopes PRIMARY KEY (id),
    CONSTRAINT uk_portal_user_scopes_app_user UNIQUE (app_user_id),
    CONSTRAINT uk_portal_user_scopes_subject UNIQUE (tenant_id, portal_subject_type, portal_subject_id),
    CONSTRAINT fk_portal_user_scopes_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_portal_user_scopes_app_user FOREIGN KEY (app_user_id) REFERENCES app_users(id)
);

CREATE INDEX idx_portal_user_scopes_tenant_subject ON portal_user_scopes (tenant_id, portal_subject_type, portal_subject_id);-- END V15__portal_access_foundation.sql

-- ================================================================
-- BEGIN V16__saas_commercialization_foundation.sql
CREATE TABLE subscription_plans (
    id BIGINT NOT NULL AUTO_INCREMENT,
    plan_code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(2000) NULL,
    tier VARCHAR(30) NOT NULL,
    monthly_price DECIMAL(12, 2) NOT NULL,
    annual_price DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    max_users INT NOT NULL,
    max_drivers INT NOT NULL,
    max_vehicles INT NOT NULL,
    max_riders INT NOT NULL,
    max_organizations INT NOT NULL,
    notes VARCHAR(2000) NULL,
    status VARCHAR(30) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_subscription_plans_plan_code UNIQUE (plan_code)
);

CREATE TABLE subscription_plan_feature_codes (
    subscription_plan_id BIGINT NOT NULL,
    feature_code VARCHAR(100) NOT NULL,
    PRIMARY KEY (subscription_plan_id, feature_code),
    CONSTRAINT fk_subscription_plan_feature_codes_plan FOREIGN KEY (subscription_plan_id)
        REFERENCES subscription_plans (id)
);

CREATE TABLE tenant_subscriptions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    subscription_plan_id BIGINT NOT NULL,
    effective_start_date DATE NOT NULL,
    effective_end_date DATE NULL,
    renewal_date DATE NULL,
    is_trial BIT NOT NULL,
    trial_end_date DATE NULL,
    notes VARCHAR(2000) NULL,
    status VARCHAR(30) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_tenant_subscriptions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_tenant_subscriptions_plan FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans (id)
);

CREATE INDEX idx_tenant_subscriptions_tenant_status ON tenant_subscriptions (tenant_id, status);
CREATE INDEX idx_tenant_subscriptions_plan_status ON tenant_subscriptions (subscription_plan_id, status);

CREATE TABLE feature_flags (
    id BIGINT NOT NULL AUTO_INCREMENT,
    flag_code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(2000) NULL,
    module_key VARCHAR(80) NOT NULL,
    enabled_by_default BIT NOT NULL,
    platform_managed_only BIT NOT NULL,
    notes VARCHAR(2000) NULL,
    status VARCHAR(30) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_feature_flags_flag_code UNIQUE (flag_code)
);

CREATE TABLE tenant_feature_overrides (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    feature_flag_id BIGINT NOT NULL,
    enabled BIT NOT NULL,
    notes VARCHAR(2000) NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_tenant_feature_overrides_tenant_flag UNIQUE (tenant_id, feature_flag_id),
    CONSTRAINT fk_tenant_feature_overrides_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_tenant_feature_overrides_flag FOREIGN KEY (feature_flag_id) REFERENCES feature_flags (id)
);

ALTER TABLE tenant_settings
    ADD COLUMN display_name VARCHAR(150) NULL AFTER tenant_id,
    ADD COLUMN secondary_color VARCHAR(20) NULL AFTER primary_color,
    ADD COLUMN accent_color VARCHAR(20) NULL AFTER secondary_color,
    ADD COLUMN favicon_url VARCHAR(500) NULL AFTER company_logo_url,
    ADD COLUMN website VARCHAR(500) NULL AFTER favicon_url,
    ADD COLUMN custom_login_welcome_text VARCHAR(500) NULL AFTER website,
    ADD COLUMN custom_footer_text VARCHAR(500) NULL AFTER custom_login_welcome_text;-- END V16__saas_commercialization_foundation.sql

-- ================================================================
-- BEGIN V17__relax_legacy_tenant_columns.sql
-- V2 copied all legacy tenant values into the current tenant model but retained
-- the original code/name columns as required fields. Keep their historical data
-- for compatibility, while allowing current entity inserts to use tenant_code,
-- company_name, and status exclusively.
ALTER TABLE tenants
    MODIFY COLUMN code VARCHAR(50) NULL,
    MODIFY COLUMN name VARCHAR(150) NULL;
-- END V17__relax_legacy_tenant_columns.sql

-- ================================================================
-- BEGIN V18__enforce_globally_unique_user_email.sql
ALTER TABLE app_users
    DROP INDEX uk_app_users_tenant_email,
    ADD CONSTRAINT uk_app_users_email UNIQUE (email);
-- END V18__enforce_globally_unique_user_email.sql

-- ================================================================
-- BEGIN V19__driver_location_snapshots.sql
CREATE TABLE driver_location_snapshots (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    ride_id BIGINT NOT NULL,
    driver_id BIGINT NOT NULL,
    vehicle_id BIGINT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    accuracy_meters DECIMAL(8, 2) NULL,
    speed_mps DECIMAL(8, 2) NULL,
    heading_degrees DECIMAL(6, 2) NULL,
    captured_at DATETIME(6) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_by VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_driver_location_snapshot_ride FOREIGN KEY (ride_id) REFERENCES rides(id),
    CONSTRAINT fk_driver_location_snapshot_driver FOREIGN KEY (driver_id) REFERENCES drivers(id),
    CONSTRAINT fk_driver_location_snapshot_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

CREATE INDEX idx_driver_location_snapshot_tenant_ride_captured
    ON driver_location_snapshots (tenant_id, ride_id, captured_at DESC, id DESC);
-- END V19__driver_location_snapshots.sql

-- ================================================================
-- BEGIN V20__align_driver_location_snapshot_numeric_types.sql
ALTER TABLE driver_location_snapshots
    MODIFY COLUMN latitude DOUBLE NOT NULL,
    MODIFY COLUMN longitude DOUBLE NOT NULL,
    MODIFY COLUMN accuracy_meters DOUBLE NULL,
    MODIFY COLUMN speed_mps DOUBLE NULL,
    MODIFY COLUMN heading_degrees DOUBLE NULL;
-- END V20__align_driver_location_snapshot_numeric_types.sql

-- ================================================================
-- BEGIN V21__password_flow_hardening.sql
ALTER TABLE app_users
    ADD COLUMN must_change_password BIT NOT NULL DEFAULT b'0',
    ADD COLUMN password_changed_at TIMESTAMP NULL,
    ADD COLUMN password_reset_token_hash VARCHAR(255) NULL,
    ADD COLUMN password_reset_token_expires_at TIMESTAMP NULL,
    ADD COLUMN password_reset_requested_at TIMESTAMP NULL;
-- END V21__password_flow_hardening.sql

-- ================================================================
-- BEGIN V22__portal_push_device_tokens.sql
CREATE TABLE portal_push_device_tokens (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    app_user_id BIGINT NOT NULL,
    push_token VARCHAR(255) NOT NULL,
    platform VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    last_registered_at TIMESTAMP NOT NULL,
    last_delivered_at TIMESTAMP NULL,
    last_delivery_status VARCHAR(20) NULL,
    last_delivery_error VARCHAR(500) NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT pk_portal_push_device_tokens PRIMARY KEY (id),
    CONSTRAINT uk_portal_push_device_tokens_token UNIQUE (push_token),
    CONSTRAINT fk_portal_push_device_tokens_user FOREIGN KEY (app_user_id) REFERENCES app_users(id)
);

CREATE INDEX ix_portal_push_device_tokens_user_status
    ON portal_push_device_tokens (tenant_id, app_user_id, status);
-- END V22__portal_push_device_tokens.sql

-- ================================================================
-- BEGIN V23__sync_linked_ride_resources_from_routes.sql
UPDATE rides r
JOIN route_stops rs
    ON rs.ride_id = r.id
   AND rs.tenant_id = r.tenant_id
JOIN routes rt
    ON rt.id = rs.route_id
   AND rt.tenant_id = r.tenant_id
SET r.route_id = COALESCE(r.route_id, rt.id),
    r.driver_id = COALESCE(r.driver_id, rt.assigned_driver_id),
    r.vehicle_id = COALESCE(r.vehicle_id, rt.assigned_vehicle_id),
    r.status = CASE
        WHEN r.status = 'SCHEDULED'
             AND COALESCE(r.driver_id, rt.assigned_driver_id) IS NOT NULL
            THEN 'ASSIGNED'
        ELSE r.status
    END,
    r.updated_at = CURRENT_TIMESTAMP,
    r.updated_by = 'flyway:V23__sync_linked_ride_resources_from_routes'
WHERE (r.route_id IS NULL)
   OR (r.driver_id IS NULL AND rt.assigned_driver_id IS NOT NULL)
   OR (r.vehicle_id IS NULL AND rt.assigned_vehicle_id IS NOT NULL)
   OR (r.status = 'SCHEDULED' AND COALESCE(r.driver_id, rt.assigned_driver_id) IS NOT NULL);
-- END V23__sync_linked_ride_resources_from_routes.sql

-- ================================================================
-- BEGIN V24__auth_session_rotation.sql
CREATE TABLE auth_refresh_sessions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    family_id VARCHAR(36) NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    issued_at TIMESTAMP(6) NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    used_at TIMESTAMP(6) NULL,
    revoked_at TIMESTAMP(6) NULL,
    replaced_by_token_hash VARCHAR(64) NULL,
    client_type VARCHAR(20) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_auth_refresh_sessions_user
        FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE CASCADE,
    CONSTRAINT uk_auth_refresh_sessions_token_hash UNIQUE (token_hash),
    INDEX idx_auth_refresh_sessions_family (family_id),
    INDEX idx_auth_refresh_sessions_user (user_id),
    INDEX idx_auth_refresh_sessions_expiry (expires_at)
);

-- END V24__auth_session_rotation.sql

-- ================================================================
-- BEGIN V25__ride_optimistic_locking.sql
ALTER TABLE rides ADD COLUMN entity_version BIGINT NOT NULL DEFAULT 0;

-- END V25__ride_optimistic_locking.sql

-- ================================================================
-- BEGIN V26__driver_action_idempotency.sql
CREATE TABLE driver_action_idempotency (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    idempotency_key VARCHAR(120) NOT NULL,
    ride_id BIGINT NOT NULL,
    action_name VARCHAR(40) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_driver_action_idempotency UNIQUE (tenant_id, user_id, idempotency_key),
    CONSTRAINT fk_driver_action_idempotency_user FOREIGN KEY (user_id) REFERENCES app_users (id),
    CONSTRAINT fk_driver_action_idempotency_ride FOREIGN KEY (ride_id) REFERENCES rides (id)
);

-- END V26__driver_action_idempotency.sql

-- ================================================================
-- BEGIN V27__tenant_transport_compliance.sql
CREATE TABLE tenant_transport_compliance (
    tenant_id VARCHAR(36) NOT NULL,
    operating_scope VARCHAR(40) NOT NULL,
    verification_status VARCHAR(30) NOT NULL,
    primary_state VARCHAR(2) NOT NULL,
    operating_authority_type VARCHAR(80) NULL,
    operating_authority_number VARCHAR(120) NULL,
    operating_authority_expires_on DATE NULL,
    insurance_verified BIT NOT NULL,
    insurance_expires_on DATE NULL,
    student_safeguarding_policy_verified BIT NOT NULL,
    ferpa_data_agreement_verified BIT NOT NULL,
    employee_transport_consent_policy_verified BIT NOT NULL,
    accessibility_policy_verified BIT NOT NULL,
    attested_by VARCHAR(150) NULL,
    attested_at DATETIME(6) NULL,
    verified_by VARCHAR(150) NULL,
    verified_at DATETIME(6) NULL,
    verification_notes VARCHAR(2000) NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (tenant_id),
    CONSTRAINT fk_tenant_transport_compliance_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id)
);

-- END V27__tenant_transport_compliance.sql

