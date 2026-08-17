ALTER TABLE driver_location_snapshots
    MODIFY COLUMN latitude DOUBLE NOT NULL,
    MODIFY COLUMN longitude DOUBLE NOT NULL,
    MODIFY COLUMN accuracy_meters DOUBLE NULL,
    MODIFY COLUMN speed_mps DOUBLE NULL,
    MODIFY COLUMN heading_degrees DOUBLE NULL;
