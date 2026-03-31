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
CREATE INDEX idx_rider_guardians_primary_guardian ON rider_guardians (primary_guardian);