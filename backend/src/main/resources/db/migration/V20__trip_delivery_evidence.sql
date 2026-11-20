CREATE TABLE trip_verified_stops (
 ride_id BIGINT PRIMARY KEY,
 tenant_id VARCHAR(36) NOT NULL,
 address_hash VARCHAR(64) NOT NULL,
 pickup_latitude DOUBLE NOT NULL,
 pickup_longitude DOUBLE NOT NULL,
 dropoff_latitude DOUBLE NOT NULL,
 dropoff_longitude DOUBLE NOT NULL,
 verified_by BIGINT NOT NULL,
 verified_at DATETIME(6) NOT NULL,
 CONSTRAINT fk_trip_stops_ride FOREIGN KEY (ride_id) REFERENCES rides(id)
);
CREATE TABLE trip_milestone_evidence (
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 ride_id BIGINT NOT NULL,
 tenant_id VARCHAR(36) NOT NULL,
 driver_id BIGINT NOT NULL,
 vehicle_id BIGINT NOT NULL,
 address_hash VARCHAR(64) NOT NULL,
 milestone VARCHAR(30) NOT NULL,
 snapshot_id BIGINT NOT NULL,
 distance_meters DOUBLE NOT NULL,
 accuracy_meters DOUBLE NOT NULL,
 odometer_miles DECIMAL(9,1) NULL,
 recorded_by BIGINT NOT NULL,
 recorded_at DATETIME(6) NOT NULL,
 consumed_at DATETIME(6) NULL,
 INDEX idx_trip_milestone (ride_id,milestone,id),
 CONSTRAINT fk_trip_evidence_ride FOREIGN KEY (ride_id) REFERENCES rides(id),
 CONSTRAINT fk_trip_evidence_snapshot FOREIGN KEY (snapshot_id) REFERENCES driver_location_snapshots(id)
);
CREATE TABLE trip_delivery_confirmations (
 ride_id BIGINT PRIMARY KEY,
 tenant_id VARCHAR(36) NOT NULL,
 dropoff_evidence_id BIGINT NOT NULL,
 confirmed_by BIGINT NOT NULL,
 confirmer_name VARCHAR(150) NOT NULL,
 subject_type VARCHAR(20) NOT NULL,
 subject_id BIGINT NOT NULL,
 confirmed_at DATETIME(6) NOT NULL,
 CONSTRAINT fk_trip_confirmation_ride FOREIGN KEY (ride_id) REFERENCES rides(id),
 CONSTRAINT fk_trip_confirmation_evidence FOREIGN KEY (dropoff_evidence_id) REFERENCES trip_milestone_evidence(id)
);
