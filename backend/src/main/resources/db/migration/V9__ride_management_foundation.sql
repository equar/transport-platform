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
CREATE UNIQUE INDEX uq_rides_recurrence_pickup ON rides (recurrence_schedule_id, scheduled_pickup_at);