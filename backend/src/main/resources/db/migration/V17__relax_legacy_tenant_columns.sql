-- V2 copied all legacy tenant values into the current tenant model but retained
-- the original code/name columns as required fields. Keep their historical data
-- for compatibility, while allowing current entity inserts to use tenant_code,
-- company_name, and status exclusively.
ALTER TABLE tenants
    MODIFY COLUMN code VARCHAR(50) NULL,
    MODIFY COLUMN name VARCHAR(150) NULL;
