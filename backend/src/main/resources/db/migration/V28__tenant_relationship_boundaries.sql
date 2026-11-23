-- Enforce tenant identity on financial, document, dispatch and tracking relationships.
-- Existing inconsistent data fails validation; it is never reassigned automatically.
SET @scope_ddl=IF(EXISTS(SELECT 1 FROM (SELECT index_name FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='contracts' AND non_unique=0 GROUP BY index_name HAVING GROUP_CONCAT(column_name ORDER BY seq_in_index)='tenant_id,id') AS matching_index),'SELECT 1','ALTER TABLE contracts ADD CONSTRAINT uq_scope_contracts_id UNIQUE (tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM (SELECT index_name FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='driver_location_snapshots' AND non_unique=0 GROUP BY index_name HAVING GROUP_CONCAT(column_name ORDER BY seq_in_index)='tenant_id,id') AS matching_index),'SELECT 1','ALTER TABLE driver_location_snapshots ADD CONSTRAINT uq_scope_driver_location_snapshots_id UNIQUE (tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM (SELECT index_name FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='drivers' AND non_unique=0 GROUP BY index_name HAVING GROUP_CONCAT(column_name ORDER BY seq_in_index)='tenant_id,id') AS matching_index),'SELECT 1','ALTER TABLE drivers ADD CONSTRAINT uq_scope_drivers_id UNIQUE (tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM (SELECT index_name FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='guardians' AND non_unique=0 GROUP BY index_name HAVING GROUP_CONCAT(column_name ORDER BY seq_in_index)='tenant_id,id') AS matching_index),'SELECT 1','ALTER TABLE guardians ADD CONSTRAINT uq_scope_guardians_id UNIQUE (tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM (SELECT index_name FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='invoices' AND non_unique=0 GROUP BY index_name HAVING GROUP_CONCAT(column_name ORDER BY seq_in_index)='tenant_id,id') AS matching_index),'SELECT 1','ALTER TABLE invoices ADD CONSTRAINT uq_scope_invoices_id UNIQUE (tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM (SELECT index_name FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='organizations' AND non_unique=0 GROUP BY index_name HAVING GROUP_CONCAT(column_name ORDER BY seq_in_index)='tenant_id,id') AS matching_index),'SELECT 1','ALTER TABLE organizations ADD CONSTRAINT uq_scope_organizations_id UNIQUE (tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM (SELECT index_name FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='pricing_rules' AND non_unique=0 GROUP BY index_name HAVING GROUP_CONCAT(column_name ORDER BY seq_in_index)='tenant_id,id') AS matching_index),'SELECT 1','ALTER TABLE pricing_rules ADD CONSTRAINT uq_scope_pricing_rules_id UNIQUE (tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM (SELECT index_name FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='recurring_ride_schedules' AND non_unique=0 GROUP BY index_name HAVING GROUP_CONCAT(column_name ORDER BY seq_in_index)='tenant_id,id') AS matching_index),'SELECT 1','ALTER TABLE recurring_ride_schedules ADD CONSTRAINT uq_scope_recurring_ride_schedules_id UNIQUE (tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM (SELECT index_name FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='riders' AND non_unique=0 GROUP BY index_name HAVING GROUP_CONCAT(column_name ORDER BY seq_in_index)='tenant_id,id') AS matching_index),'SELECT 1','ALTER TABLE riders ADD CONSTRAINT uq_scope_riders_id UNIQUE (tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM (SELECT index_name FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='rides' AND non_unique=0 GROUP BY index_name HAVING GROUP_CONCAT(column_name ORDER BY seq_in_index)='tenant_id,id') AS matching_index),'SELECT 1','ALTER TABLE rides ADD CONSTRAINT uq_scope_rides_id UNIQUE (tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM (SELECT index_name FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='routes' AND non_unique=0 GROUP BY index_name HAVING GROUP_CONCAT(column_name ORDER BY seq_in_index)='tenant_id,id') AS matching_index),'SELECT 1','ALTER TABLE routes ADD CONSTRAINT uq_scope_routes_id UNIQUE (tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM (SELECT index_name FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='service_areas' AND non_unique=0 GROUP BY index_name HAVING GROUP_CONCAT(column_name ORDER BY seq_in_index)='tenant_id,id') AS matching_index),'SELECT 1','ALTER TABLE service_areas ADD CONSTRAINT uq_scope_service_areas_id UNIQUE (tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM (SELECT index_name FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='tenant_subscriptions' AND non_unique=0 GROUP BY index_name HAVING GROUP_CONCAT(column_name ORDER BY seq_in_index)='tenant_id,id') AS matching_index),'SELECT 1','ALTER TABLE tenant_subscriptions ADD CONSTRAINT uq_scope_tenant_subscriptions_id UNIQUE (tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM (SELECT index_name FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='trip_milestone_evidence' AND non_unique=0 GROUP BY index_name HAVING GROUP_CONCAT(column_name ORDER BY seq_in_index)='tenant_id,id') AS matching_index),'SELECT 1','ALTER TABLE trip_milestone_evidence ADD CONSTRAINT uq_scope_trip_milestone_evidence_id UNIQUE (tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM (SELECT index_name FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='vehicles' AND non_unique=0 GROUP BY index_name HAVING GROUP_CONCAT(column_name ORDER BY seq_in_index)='tenant_id,id') AS matching_index),'SELECT 1','ALTER TABLE vehicles ADD CONSTRAINT uq_scope_vehicles_id UNIQUE (tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='collection_notes' AND constraint_name='fk_scope_collection_notes_invoice_id'),'SELECT 1','ALTER TABLE collection_notes ADD CONSTRAINT fk_scope_collection_notes_invoice_id FOREIGN KEY (tenant_id,invoice_id) REFERENCES invoices(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='contracts' AND constraint_name='fk_scope_contracts_organization_id'),'SELECT 1','ALTER TABLE contracts ADD CONSTRAINT fk_scope_contracts_organization_id FOREIGN KEY (tenant_id,organization_id) REFERENCES organizations(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='driver_documents' AND constraint_name='fk_scope_driver_documents_driver_id'),'SELECT 1','ALTER TABLE driver_documents ADD CONSTRAINT fk_scope_driver_documents_driver_id FOREIGN KEY (tenant_id,driver_id) REFERENCES drivers(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='driver_location_snapshots' AND constraint_name='fk_scope_driver_location_snapshots_driver_id'),'SELECT 1','ALTER TABLE driver_location_snapshots ADD CONSTRAINT fk_scope_driver_location_snapshots_driver_id FOREIGN KEY (tenant_id,driver_id) REFERENCES drivers(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='driver_location_snapshots' AND constraint_name='fk_scope_driver_location_snapshots_ride_id'),'SELECT 1','ALTER TABLE driver_location_snapshots ADD CONSTRAINT fk_scope_driver_location_snapshots_ride_id FOREIGN KEY (tenant_id,ride_id) REFERENCES rides(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='driver_location_snapshots' AND constraint_name='fk_scope_driver_location_snapshots_vehicle_id'),'SELECT 1','ALTER TABLE driver_location_snapshots ADD CONSTRAINT fk_scope_driver_location_snapshots_vehicle_id FOREIGN KEY (tenant_id,vehicle_id) REFERENCES vehicles(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='invoice_generation_idempotency' AND constraint_name='fk_scope_invoice_generation_idempotency_invoice_id'),'SELECT 1','ALTER TABLE invoice_generation_idempotency ADD CONSTRAINT fk_scope_invoice_generation_idempotency_invoice_id FOREIGN KEY (tenant_id,invoice_id) REFERENCES invoices(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='invoice_line_items' AND constraint_name='fk_scope_invoice_line_items_invoice_id'),'SELECT 1','ALTER TABLE invoice_line_items ADD CONSTRAINT fk_scope_invoice_line_items_invoice_id FOREIGN KEY (tenant_id,invoice_id) REFERENCES invoices(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='invoice_line_items' AND constraint_name='fk_scope_invoice_line_items_pricing_rule_id'),'SELECT 1','ALTER TABLE invoice_line_items ADD CONSTRAINT fk_scope_invoice_line_items_pricing_rule_id FOREIGN KEY (tenant_id,pricing_rule_id) REFERENCES pricing_rules(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='invoices' AND constraint_name='fk_scope_invoices_contract_id'),'SELECT 1','ALTER TABLE invoices ADD CONSTRAINT fk_scope_invoices_contract_id FOREIGN KEY (tenant_id,contract_id) REFERENCES contracts(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='invoices' AND constraint_name='fk_scope_invoices_guardian_id'),'SELECT 1','ALTER TABLE invoices ADD CONSTRAINT fk_scope_invoices_guardian_id FOREIGN KEY (tenant_id,guardian_id) REFERENCES guardians(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='invoices' AND constraint_name='fk_scope_invoices_organization_id'),'SELECT 1','ALTER TABLE invoices ADD CONSTRAINT fk_scope_invoices_organization_id FOREIGN KEY (tenant_id,organization_id) REFERENCES organizations(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='invoices' AND constraint_name='fk_scope_invoices_rider_id'),'SELECT 1','ALTER TABLE invoices ADD CONSTRAINT fk_scope_invoices_rider_id FOREIGN KEY (tenant_id,rider_id) REFERENCES riders(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='organization_contacts' AND constraint_name='fk_scope_organization_contacts_organization_id'),'SELECT 1','ALTER TABLE organization_contacts ADD CONSTRAINT fk_scope_organization_contacts_organization_id FOREIGN KEY (tenant_id,organization_id) REFERENCES organizations(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='payments' AND constraint_name='fk_scope_payments_invoice_id'),'SELECT 1','ALTER TABLE payments ADD CONSTRAINT fk_scope_payments_invoice_id FOREIGN KEY (tenant_id,invoice_id) REFERENCES invoices(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='platform_subscription_invoices' AND constraint_name='fk_scope_platform_subscription_invoices_subscription_id'),'SELECT 1','ALTER TABLE platform_subscription_invoices ADD CONSTRAINT fk_scope_platform_subscription_invoices_subscription_id FOREIGN KEY (tenant_id,subscription_id) REFERENCES tenant_subscriptions(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='recurring_ride_schedules' AND constraint_name='fk_scope_recurring_ride_schedules_contract_id'),'SELECT 1','ALTER TABLE recurring_ride_schedules ADD CONSTRAINT fk_scope_recurring_ride_schedules_contract_id FOREIGN KEY (tenant_id,contract_id) REFERENCES contracts(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='recurring_ride_schedules' AND constraint_name='fk_scope_recurring_ride_schedules_guardian_id'),'SELECT 1','ALTER TABLE recurring_ride_schedules ADD CONSTRAINT fk_scope_recurring_ride_schedules_guardian_id FOREIGN KEY (tenant_id,guardian_id) REFERENCES guardians(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='recurring_ride_schedules' AND constraint_name='fk_scope_recurring_ride_schedules_organization_id'),'SELECT 1','ALTER TABLE recurring_ride_schedules ADD CONSTRAINT fk_scope_recurring_ride_schedules_organization_id FOREIGN KEY (tenant_id,organization_id) REFERENCES organizations(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='recurring_ride_schedules' AND constraint_name='fk_scope_recurring_ride_schedules_rider_id'),'SELECT 1','ALTER TABLE recurring_ride_schedules ADD CONSTRAINT fk_scope_recurring_ride_schedules_rider_id FOREIGN KEY (tenant_id,rider_id) REFERENCES riders(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='recurring_ride_schedules' AND constraint_name='fk_scope_recurring_ride_schedules_service_area_id'),'SELECT 1','ALTER TABLE recurring_ride_schedules ADD CONSTRAINT fk_scope_recurring_ride_schedules_service_area_id FOREIGN KEY (tenant_id,service_area_id) REFERENCES service_areas(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='ride_events' AND constraint_name='fk_scope_ride_events_ride_id'),'SELECT 1','ALTER TABLE ride_events ADD CONSTRAINT fk_scope_ride_events_ride_id FOREIGN KEY (tenant_id,ride_id) REFERENCES rides(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='rider_guardians' AND constraint_name='fk_scope_rider_guardians_guardian_id'),'SELECT 1','ALTER TABLE rider_guardians ADD CONSTRAINT fk_scope_rider_guardians_guardian_id FOREIGN KEY (tenant_id,guardian_id) REFERENCES guardians(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='rider_guardians' AND constraint_name='fk_scope_rider_guardians_rider_id'),'SELECT 1','ALTER TABLE rider_guardians ADD CONSTRAINT fk_scope_rider_guardians_rider_id FOREIGN KEY (tenant_id,rider_id) REFERENCES riders(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='rides' AND constraint_name='fk_scope_rides_contract_id'),'SELECT 1','ALTER TABLE rides ADD CONSTRAINT fk_scope_rides_contract_id FOREIGN KEY (tenant_id,contract_id) REFERENCES contracts(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='rides' AND constraint_name='fk_scope_rides_driver_id'),'SELECT 1','ALTER TABLE rides ADD CONSTRAINT fk_scope_rides_driver_id FOREIGN KEY (tenant_id,driver_id) REFERENCES drivers(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='rides' AND constraint_name='fk_scope_rides_guardian_id'),'SELECT 1','ALTER TABLE rides ADD CONSTRAINT fk_scope_rides_guardian_id FOREIGN KEY (tenant_id,guardian_id) REFERENCES guardians(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='rides' AND constraint_name='fk_scope_rides_organization_id'),'SELECT 1','ALTER TABLE rides ADD CONSTRAINT fk_scope_rides_organization_id FOREIGN KEY (tenant_id,organization_id) REFERENCES organizations(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='rides' AND constraint_name='fk_scope_rides_recurrence_schedule_id'),'SELECT 1','ALTER TABLE rides ADD CONSTRAINT fk_scope_rides_recurrence_schedule_id FOREIGN KEY (tenant_id,recurrence_schedule_id) REFERENCES recurring_ride_schedules(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='rides' AND constraint_name='fk_scope_rides_rider_id'),'SELECT 1','ALTER TABLE rides ADD CONSTRAINT fk_scope_rides_rider_id FOREIGN KEY (tenant_id,rider_id) REFERENCES riders(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='rides' AND constraint_name='fk_scope_rides_service_area_id'),'SELECT 1','ALTER TABLE rides ADD CONSTRAINT fk_scope_rides_service_area_id FOREIGN KEY (tenant_id,service_area_id) REFERENCES service_areas(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='rides' AND constraint_name='fk_scope_rides_vehicle_id'),'SELECT 1','ALTER TABLE rides ADD CONSTRAINT fk_scope_rides_vehicle_id FOREIGN KEY (tenant_id,vehicle_id) REFERENCES vehicles(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='route_stops' AND constraint_name='fk_scope_route_stops_ride_id'),'SELECT 1','ALTER TABLE route_stops ADD CONSTRAINT fk_scope_route_stops_ride_id FOREIGN KEY (tenant_id,ride_id) REFERENCES rides(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='route_stops' AND constraint_name='fk_scope_route_stops_route_id'),'SELECT 1','ALTER TABLE route_stops ADD CONSTRAINT fk_scope_route_stops_route_id FOREIGN KEY (tenant_id,route_id) REFERENCES routes(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='routes' AND constraint_name='fk_scope_routes_assigned_driver_id'),'SELECT 1','ALTER TABLE routes ADD CONSTRAINT fk_scope_routes_assigned_driver_id FOREIGN KEY (tenant_id,assigned_driver_id) REFERENCES drivers(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='routes' AND constraint_name='fk_scope_routes_assigned_vehicle_id'),'SELECT 1','ALTER TABLE routes ADD CONSTRAINT fk_scope_routes_assigned_vehicle_id FOREIGN KEY (tenant_id,assigned_vehicle_id) REFERENCES vehicles(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='subscription_billing_accounts' AND constraint_name='fk_scope_subscription_billing_accounts_subscription_id'),'SELECT 1','ALTER TABLE subscription_billing_accounts ADD CONSTRAINT fk_scope_subscription_billing_accounts_subscription_id FOREIGN KEY (tenant_id,subscription_id) REFERENCES tenant_subscriptions(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='subscription_driver_status_periods' AND constraint_name='fk_scope_subscription_driver_status_periods_driver_id'),'SELECT 1','ALTER TABLE subscription_driver_status_periods ADD CONSTRAINT fk_scope_subscription_driver_status_periods_driver_id FOREIGN KEY (tenant_id,driver_id) REFERENCES drivers(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='trip_delivery_confirmations' AND constraint_name='fk_scope_trip_delivery_confirmations_dropoff_evidence_id'),'SELECT 1','ALTER TABLE trip_delivery_confirmations ADD CONSTRAINT fk_scope_trip_delivery_confirmations_dropoff_evidence_id FOREIGN KEY (tenant_id,dropoff_evidence_id) REFERENCES trip_milestone_evidence(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='trip_delivery_confirmations' AND constraint_name='fk_scope_trip_delivery_confirmations_ride_id'),'SELECT 1','ALTER TABLE trip_delivery_confirmations ADD CONSTRAINT fk_scope_trip_delivery_confirmations_ride_id FOREIGN KEY (tenant_id,ride_id) REFERENCES rides(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='trip_milestone_evidence' AND constraint_name='fk_scope_trip_milestone_evidence_ride_id'),'SELECT 1','ALTER TABLE trip_milestone_evidence ADD CONSTRAINT fk_scope_trip_milestone_evidence_ride_id FOREIGN KEY (tenant_id,ride_id) REFERENCES rides(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='trip_milestone_evidence' AND constraint_name='fk_scope_trip_milestone_evidence_snapshot_id'),'SELECT 1','ALTER TABLE trip_milestone_evidence ADD CONSTRAINT fk_scope_trip_milestone_evidence_snapshot_id FOREIGN KEY (tenant_id,snapshot_id) REFERENCES driver_location_snapshots(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='trip_verified_stops' AND constraint_name='fk_scope_trip_verified_stops_ride_id'),'SELECT 1','ALTER TABLE trip_verified_stops ADD CONSTRAINT fk_scope_trip_verified_stops_ride_id FOREIGN KEY (tenant_id,ride_id) REFERENCES rides(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

SET @scope_ddl=IF(EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='vehicle_documents' AND constraint_name='fk_scope_vehicle_documents_vehicle_id'),'SELECT 1','ALTER TABLE vehicle_documents ADD CONSTRAINT fk_scope_vehicle_documents_vehicle_id FOREIGN KEY (tenant_id,vehicle_id) REFERENCES vehicles(tenant_id,id)');
PREPARE scope_stmt FROM @scope_ddl;
EXECUTE scope_stmt;
DEALLOCATE PREPARE scope_stmt;

