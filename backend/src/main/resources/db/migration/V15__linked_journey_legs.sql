ALTER TABLE rides ADD COLUMN linked_ride_id BIGINT NULL, ADD COLUMN journey_leg VARCHAR(16) NULL;
CREATE INDEX idx_rides_linked_ride ON rides (linked_ride_id);
ALTER TABLE rides ADD CONSTRAINT fk_rides_linked_ride FOREIGN KEY (linked_ride_id) REFERENCES rides(id);
