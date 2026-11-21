-- Schema-only preparation; stop writers and run offline protection before serving traffic.
ALTER TABLE rider_mobility_needs
  MODIFY COLUMN mobility_need VARCHAR(512) NOT NULL;
ALTER TABLE rides
  MODIFY COLUMN pickup_address_line1 TEXT NOT NULL,
  MODIFY COLUMN pickup_address_line2 TEXT NULL,
  MODIFY COLUMN pickup_city TEXT NOT NULL,
  MODIFY COLUMN pickup_state TEXT NOT NULL,
  MODIFY COLUMN pickup_zip_code TEXT NOT NULL,
  MODIFY COLUMN pickup_country TEXT NOT NULL,
  MODIFY COLUMN dropoff_address_line1 TEXT NOT NULL,
  MODIFY COLUMN dropoff_address_line2 TEXT NULL,
  MODIFY COLUMN dropoff_city TEXT NOT NULL,
  MODIFY COLUMN dropoff_state TEXT NOT NULL,
  MODIFY COLUMN dropoff_zip_code TEXT NOT NULL,
  MODIFY COLUMN dropoff_country TEXT NOT NULL,
  MODIFY COLUMN wheelchair_required VARCHAR(512) NOT NULL,
  MODIFY COLUMN escort_required VARCHAR(512) NOT NULL,
  MODIFY COLUMN special_instructions TEXT NULL,
  MODIFY COLUMN internal_notes TEXT NULL,
  MODIFY COLUMN operational_notes TEXT NULL,
  MODIFY COLUMN cancellation_reason TEXT NULL;
ALTER TABLE recurring_ride_schedules
  MODIFY COLUMN pickup_address_line1 TEXT NOT NULL,
  MODIFY COLUMN pickup_address_line2 TEXT NULL,
  MODIFY COLUMN pickup_city TEXT NOT NULL,
  MODIFY COLUMN pickup_state TEXT NOT NULL,
  MODIFY COLUMN pickup_zip_code TEXT NOT NULL,
  MODIFY COLUMN pickup_country TEXT NOT NULL,
  MODIFY COLUMN dropoff_address_line1 TEXT NOT NULL,
  MODIFY COLUMN dropoff_address_line2 TEXT NULL,
  MODIFY COLUMN dropoff_city TEXT NOT NULL,
  MODIFY COLUMN dropoff_state TEXT NOT NULL,
  MODIFY COLUMN dropoff_zip_code TEXT NOT NULL,
  MODIFY COLUMN dropoff_country TEXT NOT NULL,
  MODIFY COLUMN wheelchair_required VARCHAR(512) NOT NULL,
  MODIFY COLUMN escort_required VARCHAR(512) NOT NULL,
  MODIFY COLUMN special_instructions TEXT NULL,
  MODIFY COLUMN internal_notes TEXT NULL;
ALTER TABLE ride_events
  MODIFY COLUMN notes TEXT NULL;
ALTER TABLE drivers
  MODIFY COLUMN date_of_birth VARCHAR(512) NULL,
  MODIFY COLUMN address_line1 TEXT NULL,
  MODIFY COLUMN address_line2 TEXT NULL,
  MODIFY COLUMN city TEXT NULL,
  MODIFY COLUMN state TEXT NULL,
  MODIFY COLUMN zip_code TEXT NULL,
  MODIFY COLUMN country TEXT NULL,
  MODIFY COLUMN emergency_contact_name TEXT NULL,
  MODIFY COLUMN emergency_contact_phone TEXT NULL,
  MODIFY COLUMN emergency_contact_relationship TEXT NULL,
  MODIFY COLUMN notes TEXT NULL,
  MODIFY COLUMN availability_summary TEXT NULL;
ALTER TABLE guardians
  MODIFY COLUMN address_line1 TEXT NULL,
  MODIFY COLUMN address_line2 TEXT NULL,
  MODIFY COLUMN city TEXT NULL,
  MODIFY COLUMN state TEXT NULL,
  MODIFY COLUMN zip_code TEXT NULL,
  MODIFY COLUMN country TEXT NULL,
  MODIFY COLUMN notes TEXT NULL;
ALTER TABLE rider_guardians
  MODIFY COLUMN notes TEXT NULL;
ALTER TABLE notifications
  MODIFY COLUMN message TEXT NOT NULL,
  MODIFY COLUMN metadata_json TEXT NULL,
  MODIFY COLUMN error_message TEXT NULL;
ALTER TABLE driver_location_snapshots
  MODIFY COLUMN latitude VARCHAR(512) NOT NULL,
  MODIFY COLUMN longitude VARCHAR(512) NOT NULL;
ALTER TABLE trip_verified_stops
  MODIFY COLUMN pickup_latitude VARCHAR(512) NOT NULL,
  MODIFY COLUMN pickup_longitude VARCHAR(512) NOT NULL,
  MODIFY COLUMN dropoff_latitude VARCHAR(512) NOT NULL,
  MODIFY COLUMN dropoff_longitude VARCHAR(512) NOT NULL;
ALTER TABLE report_export_jobs
  MODIFY COLUMN result_csv LONGTEXT NULL,
  MODIFY COLUMN request_json LONGTEXT NOT NULL;
ALTER TABLE contracts
  MODIFY COLUMN notes TEXT NULL,
  MODIFY COLUMN service_window_notes TEXT NULL,
  MODIFY COLUMN rate_notes TEXT NULL;
ALTER TABLE organization_contacts
  MODIFY COLUMN notes TEXT NULL;
ALTER TABLE organizations
  MODIFY COLUMN notes TEXT NULL;
ALTER TABLE service_areas
  MODIFY COLUMN notes TEXT NULL;
ALTER TABLE tenants
  MODIFY COLUMN notes TEXT NULL;
ALTER TABLE routes
  MODIFY COLUMN notes TEXT NULL,
  MODIFY COLUMN manifest_notes TEXT NULL;
ALTER TABLE route_stops
  MODIFY COLUMN notes TEXT NULL;
ALTER TABLE vehicles
  MODIFY COLUMN notes TEXT NULL;
ALTER TABLE vehicle_documents
  MODIFY COLUMN notes TEXT NULL;
ALTER TABLE driver_documents
  MODIFY COLUMN notes TEXT NULL;
ALTER TABLE company_applications
  MODIFY COLUMN review_notes TEXT NULL,
  MODIFY COLUMN notes TEXT NULL;
ALTER TABLE company_application_review_events
  MODIFY COLUMN notes TEXT NULL;
ALTER TABLE incidents
  MODIFY COLUMN notes TEXT NULL,
  MODIFY COLUMN corrective_action_summary TEXT NULL,
  MODIFY COLUMN root_cause_summary TEXT NULL,
  MODIFY COLUMN resolution_summary TEXT NULL,
  MODIFY COLUMN reported_by_name_snapshot TEXT NOT NULL,
  MODIFY COLUMN description TEXT NOT NULL,
  MODIFY COLUMN title TEXT NOT NULL;
ALTER TABLE tenant_feature_overrides
  MODIFY COLUMN notes TEXT NULL;
ALTER TABLE subscription_plans
  MODIFY COLUMN notes TEXT NULL;
ALTER TABLE tenant_subscriptions
  MODIFY COLUMN notes TEXT NULL;
ALTER TABLE feature_flags
  MODIFY COLUMN notes TEXT NULL;
ALTER TABLE invoices
  MODIFY COLUMN notes TEXT NULL;
ALTER TABLE payments
  MODIFY COLUMN notes TEXT NULL;
ALTER TABLE pricing_rules
  MODIFY COLUMN notes TEXT NULL;
ALTER TABLE invoice_line_items
  MODIFY COLUMN notes TEXT NULL;
ALTER TABLE driver_earnings_ledger
  MODIFY COLUMN reason TEXT NULL;
ALTER TABLE tenant_transport_compliance
  MODIFY COLUMN verification_notes TEXT NULL;
ALTER TABLE riders
  DROP INDEX idx_riders_phone,
  MODIFY COLUMN date_of_birth VARCHAR(512) NULL,
  MODIFY COLUMN primary_phone TEXT NOT NULL,
  MODIFY COLUMN alternate_phone TEXT NULL,
  MODIFY COLUMN home_address_line1 TEXT NULL,
  MODIFY COLUMN home_address_line2 TEXT NULL,
  MODIFY COLUMN city TEXT NULL,
  MODIFY COLUMN state TEXT NULL,
  MODIFY COLUMN zip_code TEXT NULL,
  MODIFY COLUMN country TEXT NULL,
  MODIFY COLUMN default_pickup_address TEXT NULL,
  MODIFY COLUMN default_dropoff_address TEXT NULL,
  MODIFY COLUMN pickup_notes TEXT NULL,
  MODIFY COLUMN dropoff_notes TEXT NULL,
  MODIFY COLUMN wheelchair_required VARCHAR(512) NOT NULL,
  MODIFY COLUMN escort_required VARCHAR(512) NOT NULL,
  MODIFY COLUMN special_instructions TEXT NULL,
  MODIFY COLUMN care_notes_summary TEXT NULL,
  MODIFY COLUMN emergency_contact_name TEXT NULL,
  MODIFY COLUMN emergency_contact_phone TEXT NULL,
  MODIFY COLUMN emergency_contact_relationship TEXT NULL,
  MODIFY COLUMN notes TEXT NULL,
  ADD COLUMN wheelchair_lookup VARCHAR(64) NULL, ADD COLUMN escort_lookup VARCHAR(64) NULL;
CREATE TABLE rider_private_search_tokens (rider_id BIGINT NOT NULL, token VARCHAR(64) NOT NULL, PRIMARY KEY(rider_id,token), INDEX idx_rider_private_token(token,rider_id), CONSTRAINT fk_private_search_rider FOREIGN KEY(rider_id) REFERENCES riders(id));
CREATE TABLE privacy_retention_policies (
 scope_key VARCHAR(36) NOT NULL PRIMARY KEY,
 operational_review_days INT NULL,
 audit_days INT NULL,
 notification_days INT NULL,
 cleanup_enabled BOOLEAN NULL,
 legal_hold BOOLEAN NOT NULL DEFAULT FALSE,
 updated_by BIGINT NULL,
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
);
INSERT INTO privacy_retention_policies(scope_key,cleanup_enabled) VALUES('PLATFORM',FALSE);
CREATE TABLE privacy_retention_reviews (
 tenant_id VARCHAR(36) NOT NULL,
 entity_type VARCHAR(10) NOT NULL,
 entity_id BIGINT NOT NULL,
 reviewed_at DATETIME(6) NOT NULL,
 reviewed_by BIGINT NOT NULL,
 retention_reason VARCHAR(40) NOT NULL,
 PRIMARY KEY(tenant_id,entity_type,entity_id)
);
CREATE TABLE privacy_protection_state (id INT PRIMARY KEY, protected_at DATETIME(6) NOT NULL, inventory_hash VARCHAR(64) NOT NULL);
CREATE INDEX idx_riders_private_flags ON riders(tenant_id,wheelchair_lookup,escort_lookup);
