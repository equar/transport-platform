-- Ownership is independent of the operational driver assignment. Existing records
-- retain their ownership labels; administrators explicitly identify missing owners.
ALTER TABLE drivers ADD CONSTRAINT uq_drivers_tenant_id_id UNIQUE (tenant_id, id);
ALTER TABLE vehicles ADD COLUMN owner_driver_id BIGINT NULL;
ALTER TABLE vehicles ADD INDEX idx_vehicles_tenant_owner (tenant_id, owner_driver_id);
ALTER TABLE vehicles ADD CONSTRAINT fk_vehicles_owner_tenant
    FOREIGN KEY (tenant_id, owner_driver_id) REFERENCES drivers (tenant_id, id);
