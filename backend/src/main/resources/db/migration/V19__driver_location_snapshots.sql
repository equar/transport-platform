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
