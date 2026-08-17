UPDATE rides r
JOIN route_stops rs
    ON rs.ride_id = r.id
   AND rs.tenant_id = r.tenant_id
JOIN routes rt
    ON rt.id = rs.route_id
   AND rt.tenant_id = r.tenant_id
SET r.route_id = COALESCE(r.route_id, rt.id),
    r.driver_id = COALESCE(r.driver_id, rt.assigned_driver_id),
    r.vehicle_id = COALESCE(r.vehicle_id, rt.assigned_vehicle_id),
    r.status = CASE
        WHEN r.status = 'SCHEDULED'
             AND COALESCE(r.driver_id, rt.assigned_driver_id) IS NOT NULL
            THEN 'ASSIGNED'
        ELSE r.status
    END,
    r.updated_at = CURRENT_TIMESTAMP,
    r.updated_by = 'flyway:V23__sync_linked_ride_resources_from_routes'
WHERE (r.route_id IS NULL)
   OR (r.driver_id IS NULL AND rt.assigned_driver_id IS NOT NULL)
   OR (r.vehicle_id IS NULL AND rt.assigned_vehicle_id IS NOT NULL)
   OR (r.status = 'SCHEDULED' AND COALESCE(r.driver_id, rt.assigned_driver_id) IS NOT NULL);
