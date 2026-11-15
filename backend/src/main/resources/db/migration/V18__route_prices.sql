ALTER TABLE routes
    ADD COLUMN price DECIMAL(12, 2) NULL;

ALTER TABLE recurring_ride_schedules
    ADD COLUMN price_per_ride DECIMAL(12, 2) NULL;

ALTER TABLE rides
    ADD COLUMN quoted_price DECIMAL(12, 2) NULL;
