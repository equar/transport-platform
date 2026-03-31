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
CREATE INDEX idx_rides_route_id ON rides (route_id);