-- Consolidated baseline migration
-- Generated to initialize schema and seed data in one first Flyway step
-- Source migrations merged in version order

-- ================================================================
-- BEGIN V1__init_foundation.sql
-- ================================================================
CREATE TABLE tenants (
    id VARCHAR(36) NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_tenants PRIMARY KEY (id),
    CONSTRAINT uk_tenants_code UNIQUE (code)
);

CREATE TABLE app_users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NULL,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_app_users PRIMARY KEY (id),
    CONSTRAINT uk_app_users_tenant_email UNIQUE (tenant_id, email),
    CONSTRAINT fk_app_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_name VARCHAR(64) NOT NULL,
    CONSTRAINT pk_user_roles PRIMARY KEY (user_id, role_name),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES app_users(id)
);

CREATE INDEX idx_app_users_tenant_id ON app_users (tenant_id);
CREATE INDEX idx_app_users_email ON app_users (email);

-- END V1__init_foundation.sql

-- ================================================================
-- BEGIN V2__tenant_application_workflow.sql
-- ================================================================
ALTER TABLE tenants
    ADD COLUMN tenant_code VARCHAR(50) NULL AFTER code,
    ADD COLUMN company_name VARCHAR(150) NULL AFTER tenant_code,
    ADD COLUMN legal_name VARCHAR(150) NULL AFTER company_name,
    ADD COLUMN email VARCHAR(150) NULL AFTER legal_name,

    -- Schema-only baseline. Platform admin bootstrap is handled from application properties.
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_notification_templates PRIMARY KEY (id),
    CONSTRAINT uq_notification_templates_tenant_code UNIQUE (tenant_id, template_code),
    CONSTRAINT fk_notification_templates_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_notification_templates_tenant_status ON notification_templates (tenant_id, status);
CREATE INDEX idx_notification_templates_event_channel ON notification_templates (tenant_id, event_type, channel);

CREATE TABLE notifications (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    notification_code VARCHAR(50) NOT NULL,
    recipient_user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message VARCHAR(4000) NOT NULL,
    notification_type VARCHAR(60) NOT NULL,
    channel VARCHAR(30) NOT NULL,
    related_entity_type VARCHAR(60) NULL,
    related_entity_id VARCHAR(100) NULL,
    delivery_status VARCHAR(30) NOT NULL,
    read_status VARCHAR(30) NOT NULL,
    sent_at DATETIME(6) NULL,
    read_at DATETIME(6) NULL,
    error_message VARCHAR(1000) NULL,
    metadata_json VARCHAR(4000) NULL,
    status VARCHAR(30) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_notifications PRIMARY KEY (id),
    CONSTRAINT uq_notifications_tenant_code UNIQUE (tenant_id, notification_code),
    CONSTRAINT fk_notifications_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_notifications_recipient_user FOREIGN KEY (recipient_user_id) REFERENCES app_users(id)
);

CREATE INDEX idx_notifications_recipient_read ON notifications (tenant_id, recipient_user_id, read_status, status);
CREATE INDEX idx_notifications_type_channel ON notifications (tenant_id, recipient_user_id, notification_type, channel);
CREATE INDEX idx_notifications_created_at ON notifications (tenant_id, recipient_user_id, created_at);

CREATE TABLE compliance_issues (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    source_key VARCHAR(200) NOT NULL,
    entity_type VARCHAR(30) NOT NULL,
    entity_id BIGINT NOT NULL,
    entity_code VARCHAR(80) NOT NULL,
    entity_name_summary VARCHAR(255) NOT NULL,
    issue_type VARCHAR(50) NOT NULL,
    severity VARCHAR(30) NOT NULL,
    related_document_type VARCHAR(80) NULL,
    expiry_date DATE NULL,
    summary VARCHAR(500) NOT NULL,
    recommended_action VARCHAR(1000) NULL,
    issue_status VARCHAR(30) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_compliance_issues PRIMARY KEY (id),
    CONSTRAINT uq_compliance_issues_tenant_source UNIQUE (tenant_id, source_key),
    CONSTRAINT fk_compliance_issues_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_compliance_issues_tenant_status ON compliance_issues (tenant_id, issue_status);
CREATE INDEX idx_compliance_issues_entity ON compliance_issues (tenant_id, entity_type, entity_id);
CREATE INDEX idx_compliance_issues_severity ON compliance_issues (tenant_id, severity);
-- END V13__notifications_and_compliance_foundation.sql

-- ================================================================
-- BEGIN V14__incident_reporting_and_settings_foundation.sql
-- ================================================================
CREATE TABLE incidents (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    incident_code VARCHAR(50) NOT NULL,
    incident_type VARCHAR(50) NOT NULL,
    severity VARCHAR(30) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(4000) NOT NULL,
    reported_at DATETIME(6) NOT NULL,
    reported_by_user_id BIGINT NULL,
    reported_by_name_snapshot VARCHAR(150) NOT NULL,
    related_ride_id BIGINT NULL,
    related_driver_id BIGINT NULL,
    related_vehicle_id BIGINT NULL,
    related_rider_id BIGINT NULL,
    related_guardian_id BIGINT NULL,
    related_organization_id BIGINT NULL,
    assigned_to_user_id BIGINT NULL,
    resolution_summary VARCHAR(2000) NULL,
    root_cause_summary VARCHAR(2000) NULL,
    corrective_action_summary VARCHAR(2000) NULL,
    notes VARCHAR(4000) NULL,
    status VARCHAR(30) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_incidents PRIMARY KEY (id),
    CONSTRAINT uq_incidents_tenant_code UNIQUE (tenant_id, incident_code),
    CONSTRAINT fk_incidents_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_incidents_reported_user FOREIGN KEY (reported_by_user_id) REFERENCES app_users(id),
    CONSTRAINT fk_incidents_assigned_user FOREIGN KEY (assigned_to_user_id) REFERENCES app_users(id)
);

CREATE INDEX idx_incidents_tenant_status ON incidents (tenant_id, status);
CREATE INDEX idx_incidents_tenant_severity ON incidents (tenant_id, severity);
CREATE INDEX idx_incidents_tenant_reported_at ON incidents (tenant_id, reported_at);

CREATE TABLE tenant_settings (
    tenant_id VARCHAR(36) NOT NULL,
    timezone VARCHAR(80) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    date_format VARCHAR(30) NOT NULL,
    default_ride_lead_time_minutes INT NOT NULL,
    allow_manual_ride_creation BIT NOT NULL,
    allow_round_trip_rides BIT NOT NULL,
    dispatch_strict_compliance_mode BIT NOT NULL,
    default_invoice_due_days INT NOT NULL,
    default_notification_preferences_summary VARCHAR(500) NULL,
    require_driver_license BIT NOT NULL,
    require_background_check BIT NOT NULL,
    require_drug_test BIT NOT NULL,
    require_vehicle_registration BIT NOT NULL,
    require_vehicle_insurance BIT NOT NULL,
    require_vehicle_inspection BIT NOT NULL,
    expiring_soon_threshold_days INT NOT NULL,
    invoice_prefix VARCHAR(20) NOT NULL,
    payment_prefix VARCHAR(20) NOT NULL,
    pricing_rule_prefix VARCHAR(20) NOT NULL,
    tax_enabled BIT NOT NULL,
    default_tax_rate DECIMAL(5,2) NOT NULL,
    allow_manual_invoice_overrides BIT NOT NULL,
    company_logo_url VARCHAR(500) NULL,
    primary_color VARCHAR(20) NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_tenant_settings PRIMARY KEY (tenant_id),
    CONSTRAINT fk_tenant_settings_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
-- END V14__incident_reporting_and_settings_foundation.sql

-- ================================================================
-- BEGIN V15__portal_access_foundation.sql
-- ================================================================
CREATE TABLE portal_user_scopes (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    app_user_id BIGINT NOT NULL,
    portal_subject_type VARCHAR(40) NOT NULL,
    portal_subject_id BIGINT NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_portal_user_scopes PRIMARY KEY (id),
    CONSTRAINT uk_portal_user_scopes_app_user UNIQUE (app_user_id),
    CONSTRAINT uk_portal_user_scopes_subject UNIQUE (tenant_id, portal_subject_type, portal_subject_id),
    CONSTRAINT fk_portal_user_scopes_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_portal_user_scopes_app_user FOREIGN KEY (app_user_id) REFERENCES app_users(id)
);

CREATE INDEX idx_portal_user_scopes_tenant_subject ON portal_user_scopes (tenant_id, portal_subject_type, portal_subject_id);
-- END V15__portal_access_foundation.sql

-- ================================================================
-- BEGIN V16__saas_commercialization_foundation.sql
-- ================================================================
CREATE TABLE subscription_plans (
    id BIGINT NOT NULL AUTO_INCREMENT,
    plan_code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(2000) NULL,
    tier VARCHAR(30) NOT NULL,
    monthly_price DECIMAL(12, 2) NOT NULL,
    annual_price DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    max_users INT NOT NULL,
    max_drivers INT NOT NULL,
    max_vehicles INT NOT NULL,
    max_riders INT NOT NULL,
    max_organizations INT NOT NULL,
    notes VARCHAR(2000) NULL,
    status VARCHAR(30) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_subscription_plans_plan_code UNIQUE (plan_code)
);

CREATE TABLE subscription_plan_feature_codes (
    subscription_plan_id BIGINT NOT NULL,
    feature_code VARCHAR(100) NOT NULL,
    PRIMARY KEY (subscription_plan_id, feature_code),
    CONSTRAINT fk_subscription_plan_feature_codes_plan FOREIGN KEY (subscription_plan_id)
        REFERENCES subscription_plans (id)
);

CREATE TABLE tenant_subscriptions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    subscription_plan_id BIGINT NOT NULL,
    effective_start_date DATE NOT NULL,
    effective_end_date DATE NULL,
    renewal_date DATE NULL,
    is_trial BIT NOT NULL,
    trial_end_date DATE NULL,
    notes VARCHAR(2000) NULL,
    status VARCHAR(30) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_tenant_subscriptions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_tenant_subscriptions_plan FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans (id)
);

CREATE INDEX idx_tenant_subscriptions_tenant_status ON tenant_subscriptions (tenant_id, status);
CREATE INDEX idx_tenant_subscriptions_plan_status ON tenant_subscriptions (subscription_plan_id, status);

CREATE TABLE feature_flags (
    id BIGINT NOT NULL AUTO_INCREMENT,
    flag_code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(2000) NULL,
    module_key VARCHAR(80) NOT NULL,
    enabled_by_default BIT NOT NULL,
    platform_managed_only BIT NOT NULL,
    notes VARCHAR(2000) NULL,
    status VARCHAR(30) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_feature_flags_flag_code UNIQUE (flag_code)
);

CREATE TABLE tenant_feature_overrides (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    feature_flag_id BIGINT NOT NULL,
    enabled BIT NOT NULL,
    notes VARCHAR(2000) NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_tenant_feature_overrides_tenant_flag UNIQUE (tenant_id, feature_flag_id),
    CONSTRAINT fk_tenant_feature_overrides_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_tenant_feature_overrides_flag FOREIGN KEY (feature_flag_id) REFERENCES feature_flags (id)
);

ALTER TABLE tenant_settings
    ADD COLUMN display_name VARCHAR(150) NULL AFTER tenant_id,
    ADD COLUMN secondary_color VARCHAR(20) NULL AFTER primary_color,
    ADD COLUMN accent_color VARCHAR(20) NULL AFTER secondary_color,
    ADD COLUMN favicon_url VARCHAR(500) NULL AFTER company_logo_url,
    ADD COLUMN website VARCHAR(500) NULL AFTER favicon_url,
    ADD COLUMN custom_login_welcome_text VARCHAR(500) NULL AFTER website,
    ADD COLUMN custom_footer_text VARCHAR(500) NULL AFTER custom_login_welcome_text;
-- END V16__saas_commercialization_foundation.sql

-- ================================================================
-- BEGIN V17__relax_legacy_tenant_columns.sql
-- ================================================================
-- V2 copied all legacy tenant values into the current tenant model but retained
-- the original code/name columns as required fields. Keep their historical data
-- for compatibility, while allowing current entity inserts to use tenant_code,
-- company_name, and status exclusively.
ALTER TABLE tenants
    MODIFY COLUMN code VARCHAR(50) NULL,
    MODIFY COLUMN name VARCHAR(150) NULL;

-- END V17__relax_legacy_tenant_columns.sql

-- ================================================================
-- BEGIN V18__enforce_globally_unique_user_email.sql
-- ================================================================
ALTER TABLE app_users
    DROP INDEX uk_app_users_tenant_email,
    ADD CONSTRAINT uk_app_users_email UNIQUE (email);

-- END V18__enforce_globally_unique_user_email.sql

-- ================================================================
-- BEGIN V19__driver_location_snapshots.sql
-- ================================================================
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

-- END V19__driver_location_snapshots.sql

-- ================================================================
-- BEGIN V20__align_driver_location_snapshot_numeric_types.sql
-- ================================================================
ALTER TABLE driver_location_snapshots
    MODIFY COLUMN latitude DOUBLE NOT NULL,
    MODIFY COLUMN longitude DOUBLE NOT NULL,
    MODIFY COLUMN accuracy_meters DOUBLE NULL,
    MODIFY COLUMN speed_mps DOUBLE NULL,
    MODIFY COLUMN heading_degrees DOUBLE NULL;

-- END V20__align_driver_location_snapshot_numeric_types.sql

-- ================================================================
-- BEGIN V21__password_flow_hardening.sql
-- ================================================================
ALTER TABLE app_users
    ADD COLUMN must_change_password BIT NOT NULL DEFAULT b'0',
    ADD COLUMN password_changed_at TIMESTAMP NULL,
    ADD COLUMN password_reset_token_hash VARCHAR(255) NULL,
    ADD COLUMN password_reset_token_expires_at TIMESTAMP NULL,
    ADD COLUMN password_reset_requested_at TIMESTAMP NULL;

-- END V21__password_flow_hardening.sql

-- ================================================================
-- BEGIN V22__portal_push_device_tokens.sql
-- ================================================================
CREATE TABLE portal_push_device_tokens (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    app_user_id BIGINT NOT NULL,
    push_token VARCHAR(255) NOT NULL,
    platform VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    last_registered_at TIMESTAMP NOT NULL,
    last_delivered_at TIMESTAMP NULL,
    last_delivery_status VARCHAR(20) NULL,
    last_delivery_error VARCHAR(500) NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT pk_portal_push_device_tokens PRIMARY KEY (id),
    CONSTRAINT uk_portal_push_device_tokens_token UNIQUE (push_token),
    CONSTRAINT fk_portal_push_device_tokens_user FOREIGN KEY (app_user_id) REFERENCES app_users(id)
);

CREATE INDEX ix_portal_push_device_tokens_user_status
    ON portal_push_device_tokens (tenant_id, app_user_id, status);

-- END V22__portal_push_device_tokens.sql

-- ================================================================
-- BEGIN V23__sync_linked_ride_resources_from_routes.sql
-- ================================================================
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

-- END V23__sync_linked_ride_resources_from_routes.sql

-- ================================================================
-- BEGIN V24__auth_session_rotation.sql
-- ================================================================
CREATE TABLE auth_refresh_sessions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    family_id VARCHAR(36) NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    issued_at TIMESTAMP(6) NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    used_at TIMESTAMP(6) NULL,
    revoked_at TIMESTAMP(6) NULL,
    replaced_by_token_hash VARCHAR(64) NULL,
    client_type VARCHAR(20) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_auth_refresh_sessions_user
        FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE CASCADE,
    CONSTRAINT uk_auth_refresh_sessions_token_hash UNIQUE (token_hash),
    INDEX idx_auth_refresh_sessions_family (family_id),
    INDEX idx_auth_refresh_sessions_user (user_id),
    INDEX idx_auth_refresh_sessions_expiry (expires_at)
);


-- END V24__auth_session_rotation.sql

-- ================================================================
-- BEGIN V25__ride_optimistic_locking.sql
-- ================================================================
ALTER TABLE rides ADD COLUMN entity_version BIGINT NOT NULL DEFAULT 0;


-- END V25__ride_optimistic_locking.sql

-- ================================================================
-- BEGIN V26__driver_action_idempotency.sql
-- ================================================================
CREATE TABLE driver_action_idempotency (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    idempotency_key VARCHAR(120) NOT NULL,
    ride_id BIGINT NOT NULL,
    action_name VARCHAR(40) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_driver_action_idempotency UNIQUE (tenant_id, user_id, idempotency_key),
    CONSTRAINT fk_driver_action_idempotency_user FOREIGN KEY (user_id) REFERENCES app_users (id),
    CONSTRAINT fk_driver_action_idempotency_ride FOREIGN KEY (ride_id) REFERENCES rides (id)
);


-- END V26__driver_action_idempotency.sql

-- ================================================================
-- BEGIN V27__tenant_transport_compliance.sql
-- ================================================================
CREATE TABLE tenant_transport_compliance (
    tenant_id VARCHAR(36) NOT NULL,
    operating_scope VARCHAR(40) NOT NULL,
    verification_status VARCHAR(30) NOT NULL,
    primary_state VARCHAR(2) NOT NULL,
    operating_authority_type VARCHAR(80) NULL,
    operating_authority_number VARCHAR(120) NULL,
    operating_authority_expires_on DATE NULL,
    insurance_verified BIT NOT NULL,
    insurance_expires_on DATE NULL,
    student_safeguarding_policy_verified BIT NOT NULL,
    ferpa_data_agreement_verified BIT NOT NULL,
    employee_transport_consent_policy_verified BIT NOT NULL,
    accessibility_policy_verified BIT NOT NULL,
    attested_by VARCHAR(150) NULL,
    attested_at DATETIME(6) NULL,
    verified_by VARCHAR(150) NULL,
    verified_at DATETIME(6) NULL,
    verification_notes VARCHAR(2000) NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (tenant_id),
    CONSTRAINT fk_tenant_transport_compliance_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id)
);


-- END V27__tenant_transport_compliance.sql

-- ================================================================
-- BEGIN V28__seed_multi_tenant_realistic_test_data.sql
-- ================================================================
-- Seed realistic multi-role test data for admin, tenant admin, driver, passenger (rider), and guardian.
-- Safety: this migration is additive only. It does not update or delete existing records.
-- Emails are globally unique and follow the requested base-email alias pattern.

SET @seed_now = CURRENT_TIMESTAMP(6);
SET @seed_by = 'v28-seed';
SET @seed_password = '$2a$10$PaQW5g5WNZnvrhL6d9DBGOdS2HBHvP19sgr18rCXT6DNYjVrKT2ba';

SET @tenant1_id = '11c3d4ea-5f89-4b19-9011-111111111111';
SET @tenant2_id = '22c3d4ea-5f89-4b19-9011-222222222222';

-- -----------------------------------------------------------------------------
-- Tenants
-- -----------------------------------------------------------------------------
INSERT INTO tenants
    (id, tenant_code, company_name, legal_name, email, phone, address_line1, city, state, zip_code,
     country, business_type, subscription_plan, notes, status, active, created_by, created_at, updated_by, updated_at)
SELECT
    @tenant1_id, 'TENANT1-OPS', 'Tenant One Transit', 'Tenant One Transit LLC',
    'samuelweld2018+tenant1@gmail.com', '404-555-1201', '100 Tenant One Way', 'Atlanta', 'GA', '30301',
    'United States', 'NEMT Provider', 'Professional',
    'Scenario test tenant 1 for end-to-end multi-role workflows.', 'ACTIVE', TRUE,
    @seed_by, @seed_now, @seed_by, @seed_now
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1
    FROM tenants
    WHERE id = @tenant1_id
       OR tenant_code = 'TENANT1-OPS'
       OR legal_name = 'Tenant One Transit LLC'
);

INSERT INTO tenants
    (id, tenant_code, company_name, legal_name, email, phone, address_line1, city, state, zip_code,
     country, business_type, subscription_plan, notes, status, active, created_by, created_at, updated_by, updated_at)
SELECT
    @tenant2_id, 'TENANT2-OPS', 'Tenant Two Mobility', 'Tenant Two Mobility Inc',
    'samuelweld2018+tenant2@gmail.com', '404-555-2201', '200 Tenant Two Ave', 'Atlanta', 'GA', '30302',
    'United States', 'NEMT Provider', 'Growth',
    'Scenario test tenant 2 for cross-tenant isolation validation.', 'ACTIVE', TRUE,
    @seed_by, @seed_now, @seed_by, @seed_now
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1
    FROM tenants
    WHERE id = @tenant2_id
       OR tenant_code = 'TENANT2-OPS'
       OR legal_name = 'Tenant Two Mobility Inc'
);

INSERT IGNORE INTO tenant_service_types (tenant_id, service_type) VALUES
    (@tenant1_id, 'NEMT'), (@tenant1_id, 'ADA_PARATRANSIT'), (@tenant1_id, 'GENERAL_TRANSPORT'),
    (@tenant2_id, 'NEMT'), (@tenant2_id, 'GENERAL_TRANSPORT');

-- -----------------------------------------------------------------------------
-- App users (global admin + tenant roles)
-- -----------------------------------------------------------------------------
INSERT INTO app_users
    (tenant_id, email, first_name, last_name, password_hash, status, enabled, locked, created_by, created_at, updated_by, updated_at)
SELECT
    NULL, 'samuelweld2018@gmail.com', 'Samuel', 'PlatformAdmin', @seed_password,
    'ACTIVE', TRUE, FALSE, @seed_by, @seed_now, @seed_by, @seed_now
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE email = 'samuelweld2018@gmail.com');

INSERT INTO app_users
    (tenant_id, email, first_name, last_name, password_hash, status, enabled, locked, created_by, created_at, updated_by, updated_at)
SELECT
    @tenant1_id, 'samuelweld2018+ta1t1@gmail.com', 'Samuel', 'Tenant1Admin', @seed_password,
    'ACTIVE', TRUE, FALSE, @seed_by, @seed_now, @seed_by, @seed_now
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE email = 'samuelweld2018+ta1t1@gmail.com');

INSERT INTO app_users
    (tenant_id, email, first_name, last_name, password_hash, status, enabled, locked, created_by, created_at, updated_by, updated_at)
SELECT
    @tenant1_id, 'samuelweld2018+d1t1@gmail.com', 'Samuel', 'Driver1Tenant1', @seed_password,
    'ACTIVE', TRUE, FALSE, @seed_by, @seed_now, @seed_by, @seed_now
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE email = 'samuelweld2018+d1t1@gmail.com');

INSERT INTO app_users
    (tenant_id, email, first_name, last_name, password_hash, status, enabled, locked, created_by, created_at, updated_by, updated_at)
SELECT
    @tenant1_id, 'samuelweld2018+p1t1@gmail.com', 'Samuel', 'Passenger1Tenant1', @seed_password,
    'ACTIVE', TRUE, FALSE, @seed_by, @seed_now, @seed_by, @seed_now
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE email = 'samuelweld2018+p1t1@gmail.com');

INSERT INTO app_users
    (tenant_id, email, first_name, last_name, password_hash, status, enabled, locked, created_by, created_at, updated_by, updated_at)
SELECT
    @tenant1_id, 'samuelweld2018+g1t1@gmail.com', 'Samuel', 'Guardian1Tenant1', @seed_password,
    'ACTIVE', TRUE, FALSE, @seed_by, @seed_now, @seed_by, @seed_now
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE email = 'samuelweld2018+g1t1@gmail.com');

INSERT INTO app_users
    (tenant_id, email, first_name, last_name, password_hash, status, enabled, locked, created_by, created_at, updated_by, updated_at)
SELECT
    @tenant2_id, 'samuelweld2018+ta1t2@gmail.com', 'Samuel', 'Tenant2Admin', @seed_password,
    'ACTIVE', TRUE, FALSE, @seed_by, @seed_now, @seed_by, @seed_now
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE email = 'samuelweld2018+ta1t2@gmail.com');

INSERT INTO app_users
    (tenant_id, email, first_name, last_name, password_hash, status, enabled, locked, created_by, created_at, updated_by, updated_at)
SELECT
    @tenant2_id, 'samuelweld2018+d1t2@gmail.com', 'Samuel', 'Driver1Tenant2', @seed_password,
    'ACTIVE', TRUE, FALSE, @seed_by, @seed_now, @seed_by, @seed_now
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE email = 'samuelweld2018+d1t2@gmail.com');

INSERT INTO app_users
    (tenant_id, email, first_name, last_name, password_hash, status, enabled, locked, created_by, created_at, updated_by, updated_at)
SELECT
    @tenant2_id, 'samuelweld2018+p1t2@gmail.com', 'Samuel', 'Passenger1Tenant2', @seed_password,
    'ACTIVE', TRUE, FALSE, @seed_by, @seed_now, @seed_by, @seed_now
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE email = 'samuelweld2018+p1t2@gmail.com');

INSERT INTO app_users
    (tenant_id, email, first_name, last_name, password_hash, status, enabled, locked, created_by, created_at, updated_by, updated_at)
SELECT
    @tenant2_id, 'samuelweld2018+g1t2@gmail.com', 'Samuel', 'Guardian1Tenant2', @seed_password,
    'ACTIVE', TRUE, FALSE, @seed_by, @seed_now, @seed_by, @seed_now
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE email = 'samuelweld2018+g1t2@gmail.com');

INSERT IGNORE INTO user_roles (user_id, role_name)
SELECT id, 'ROLE_PLATFORM_ADMIN' FROM app_users WHERE email = 'samuelweld2018@gmail.com';
INSERT IGNORE INTO user_roles (user_id, role_name)
SELECT id, 'ROLE_TENANT_ADMIN' FROM app_users WHERE email IN ('samuelweld2018+ta1t1@gmail.com', 'samuelweld2018+ta1t2@gmail.com');
INSERT IGNORE INTO user_roles (user_id, role_name)
SELECT id, 'ROLE_DRIVER' FROM app_users WHERE email IN ('samuelweld2018+d1t1@gmail.com', 'samuelweld2018+d1t2@gmail.com');
INSERT IGNORE INTO user_roles (user_id, role_name)
SELECT id, 'ROLE_RIDER' FROM app_users WHERE email IN ('samuelweld2018+p1t1@gmail.com', 'samuelweld2018+p1t2@gmail.com');
INSERT IGNORE INTO user_roles (user_id, role_name)
SELECT id, 'ROLE_GUARDIAN' FROM app_users WHERE email IN ('samuelweld2018+g1t1@gmail.com', 'samuelweld2018+g1t2@gmail.com');

-- -----------------------------------------------------------------------------
-- Drivers and vehicles
-- -----------------------------------------------------------------------------
INSERT INTO drivers
    (tenant_id, driver_code, first_name, last_name, date_of_birth, email, phone, address_line1, city, state,
     zip_code, country, driver_type, status, hire_date, start_date, availability_summary, license_number,
     license_state, license_expiry_date, background_check_status, background_check_expiry_date, drug_test_status,
     drug_test_expiry_date, training_status, training_completion_date, emergency_contact_name,
     emergency_contact_phone, emergency_contact_relationship, notes, created_by, created_at, updated_by, updated_at)
SELECT
    @tenant1_id, 'DRV-T1-001', 'Samuel', 'DriverOneT1', '1990-06-14', 'samuelweld2018+d1t1@gmail.com',
    '404-555-1301', '10 Driver Lane', 'Atlanta', 'GA', '30303', 'United States',
    'EMPLOYEE', 'ACTIVE', '2024-01-10', '2024-01-15', 'Weekdays 06:00-18:00',
    'GA-DL-T1-1001', 'GA', DATE_ADD(CURRENT_DATE, INTERVAL 24 MONTH),
    'CLEAR', DATE_ADD(CURRENT_DATE, INTERVAL 12 MONTH),
    'CLEAR', DATE_ADD(CURRENT_DATE, INTERVAL 12 MONTH),
    'COMPLETED', DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH),
    'Alex DriverEmergency', '404-555-1302', 'Spouse',
    'Primary tenant1 production-like test driver.', @seed_by, @seed_now, @seed_by, @seed_now
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM drivers WHERE tenant_id = @tenant1_id AND driver_code = 'DRV-T1-001');

INSERT INTO drivers
    (tenant_id, driver_code, first_name, last_name, date_of_birth, email, phone, address_line1, city, state,
     zip_code, country, driver_type, status, hire_date, start_date, availability_summary, license_number,
     license_state, license_expiry_date, background_check_status, background_check_expiry_date, drug_test_status,
     drug_test_expiry_date, training_status, training_completion_date, emergency_contact_name,
     emergency_contact_phone, emergency_contact_relationship, notes, created_by, created_at, updated_by, updated_at)
SELECT
    @tenant2_id, 'DRV-T2-001', 'Samuel', 'DriverOneT2', '1988-04-22', 'samuelweld2018+d1t2@gmail.com',
    '404-555-2301', '20 Driver Road', 'Atlanta', 'GA', '30304', 'United States',
    'CONTRACTOR', 'ACTIVE', '2024-02-10', '2024-02-14', 'Weekdays 08:00-20:00',
    'GA-DL-T2-2001', 'GA', DATE_ADD(CURRENT_DATE, INTERVAL 18 MONTH),
    'CLEAR', DATE_ADD(CURRENT_DATE, INTERVAL 10 MONTH),
    'CLEAR', DATE_ADD(CURRENT_DATE, INTERVAL 10 MONTH),
    'COMPLETED', DATE_SUB(CURRENT_DATE, INTERVAL 4 MONTH),
    'Jamie DriverEmergency', '404-555-2302', 'Sibling',
    'Primary tenant2 production-like test driver.', @seed_by, @seed_now, @seed_by, @seed_now
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM drivers WHERE tenant_id = @tenant2_id AND driver_code = 'DRV-T2-001');

SET @driver_t1_id = (SELECT id FROM drivers WHERE tenant_id = @tenant1_id AND driver_code = 'DRV-T1-001' LIMIT 1);
SET @driver_t2_id = (SELECT id FROM drivers WHERE tenant_id = @tenant2_id AND driver_code = 'DRV-T2-001' LIMIT 1);

INSERT INTO vehicles
    (tenant_id, vehicle_code, ownership_type, make, model, vehicle_year, color, vin, plate_number, plate_state,
     capacity, wheelchair_capacity, fuel_type, insurance_policy_number, insurance_expiry_date,
     registration_expiry_date, inspection_expiry_date, mileage, assigned_driver_id, notes, status,
     created_by, created_at, updated_by, updated_at)
SELECT
    @tenant1_id, 'VEH-T1-001', 'COMPANY_OWNED', 'Ford', 'Transit', 2023, 'White',
    '1FTBW9CK0PKT10001', 'T1M001', 'GA', 10, 2, 'GASOLINE',
    'POL-T1-1001', DATE_ADD(CURRENT_DATE, INTERVAL 10 MONTH), DATE_ADD(CURRENT_DATE, INTERVAL 9 MONTH),
    DATE_ADD(CURRENT_DATE, INTERVAL 8 MONTH), 35600, @driver_t1_id,
    'Wheelchair-capable van assigned to tenant1 driver.', 'ACTIVE',
    @seed_by, @seed_now, @seed_by, @seed_now
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE tenant_id = @tenant1_id AND vehicle_code = 'VEH-T1-001');

INSERT INTO vehicles
    (tenant_id, vehicle_code, ownership_type, make, model, vehicle_year, color, vin, plate_number, plate_state,
     capacity, wheelchair_capacity, fuel_type, insurance_policy_number, insurance_expiry_date,
     registration_expiry_date, inspection_expiry_date, mileage, assigned_driver_id, notes, status,
     created_by, created_at, updated_by, updated_at)
SELECT
    @tenant2_id, 'VEH-T2-001', 'COMPANY_OWNED', 'Toyota', 'Sienna', 2022, 'Silver',
    '5TDKRKEC5NS20001', 'T2M001', 'GA', 7, 1, 'HYBRID',
    'POL-T2-2001', DATE_ADD(CURRENT_DATE, INTERVAL 11 MONTH), DATE_ADD(CURRENT_DATE, INTERVAL 7 MONTH),
    DATE_ADD(CURRENT_DATE, INTERVAL 6 MONTH), 42200, @driver_t2_id,
    'Hybrid van assigned to tenant2 driver.', 'ACTIVE',
    @seed_by, @seed_now, @seed_by, @seed_now
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE tenant_id = @tenant2_id AND vehicle_code = 'VEH-T2-001');

SET @vehicle_t1_id = (SELECT id FROM vehicles WHERE tenant_id = @tenant1_id AND vehicle_code = 'VEH-T1-001' LIMIT 1);
SET @vehicle_t2_id = (SELECT id FROM vehicles WHERE tenant_id = @tenant2_id AND vehicle_code = 'VEH-T2-001' LIMIT 1);

INSERT IGNORE INTO vehicle_service_types (vehicle_id, service_type) VALUES
    (@vehicle_t1_id, 'NEMT'), (@vehicle_t1_id, 'ADA_PARATRANSIT'),
    (@vehicle_t2_id, 'NEMT');

-- Driver profile image records
INSERT INTO driver_documents
    (tenant_id, driver_id, document_type, file_name, original_file_name, content_type, storage_path,
     document_number, issuing_authority, issue_date, expiry_date, verification_status, status, notes,
     uploaded_by, uploaded_at, created_by, created_at, updated_by, updated_at)
SELECT
    @tenant1_id, @driver_t1_id, 'PROFILE_PHOTO',
    'samuelweld2018-d1t1-profile.jpg', 'samuelweld2018-d1t1-profile.jpg', 'image/jpeg',
    CONCAT('tenants/', @tenant1_id, '/drivers/DRV-T1-001/profile/samuelweld2018-d1t1-profile.jpg'),
    NULL, NULL, NULL, NULL, 'VERIFIED', 'ACTIVE', 'Seeded driver profile photo for tenant1.',
    @seed_by, @seed_now, @seed_by, @seed_now, @seed_by, @seed_now
FROM DUAL
WHERE @driver_t1_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM driver_documents
      WHERE tenant_id = @tenant1_id
        AND driver_id = @driver_t1_id
        AND document_type = 'PROFILE_PHOTO'
  );

INSERT INTO driver_documents
    (tenant_id, driver_id, document_type, file_name, original_file_name, content_type, storage_path,
     document_number, issuing_authority, issue_date, expiry_date, verification_status, status, notes,
     uploaded_by, uploaded_at, created_by, created_at, updated_by, updated_at)
SELECT
    @tenant2_id, @driver_t2_id, 'PROFILE_PHOTO',
    'samuelweld2018-d1t2-profile.jpg', 'samuelweld2018-d1t2-profile.jpg', 'image/jpeg',
    CONCAT('tenants/', @tenant2_id, '/drivers/DRV-T2-001/profile/samuelweld2018-d1t2-profile.jpg'),
    NULL, NULL, NULL, NULL, 'VERIFIED', 'ACTIVE', 'Seeded driver profile photo for tenant2.',
    @seed_by, @seed_now, @seed_by, @seed_now, @seed_by, @seed_now
FROM DUAL
WHERE @driver_t2_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM driver_documents
      WHERE tenant_id = @tenant2_id
        AND driver_id = @driver_t2_id
        AND document_type = 'PROFILE_PHOTO'
  );

-- Vehicle image records
INSERT INTO vehicle_documents
    (tenant_id, vehicle_id, document_type, file_name, original_file_name, content_type, storage_path,
     document_number, issuing_authority, issue_date, expiry_date, verification_status, status, notes,
     uploaded_by, uploaded_at, created_by, created_at, updated_by, updated_at)
SELECT
    @tenant1_id, @vehicle_t1_id, 'VEHICLE_PHOTO',
    'veh-t1-001-front.jpg', 'veh-t1-001-front.jpg', 'image/jpeg',
    CONCAT('tenants/', @tenant1_id, '/vehicles/VEH-T1-001/photos/veh-t1-001-front.jpg'),
    NULL, NULL, NULL, NULL, 'VERIFIED', 'ACTIVE', 'Seeded vehicle image for tenant1 driver vehicle.',
    @seed_by, @seed_now, @seed_by, @seed_now, @seed_by, @seed_now
FROM DUAL
WHERE @vehicle_t1_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM vehicle_documents
      WHERE tenant_id = @tenant1_id
        AND vehicle_id = @vehicle_t1_id
        AND document_type = 'VEHICLE_PHOTO'
  );

INSERT INTO vehicle_documents
    (tenant_id, vehicle_id, document_type, file_name, original_file_name, content_type, storage_path,
     document_number, issuing_authority, issue_date, expiry_date, verification_status, status, notes,
     uploaded_by, uploaded_at, created_by, created_at, updated_by, updated_at)
SELECT
    @tenant2_id, @vehicle_t2_id, 'VEHICLE_PHOTO',
    'veh-t2-001-front.jpg', 'veh-t2-001-front.jpg', 'image/jpeg',
    CONCAT('tenants/', @tenant2_id, '/vehicles/VEH-T2-001/photos/veh-t2-001-front.jpg'),
    NULL, NULL, NULL, NULL, 'VERIFIED', 'ACTIVE', 'Seeded vehicle image for tenant2 driver vehicle.',
    @seed_by, @seed_now, @seed_by, @seed_now, @seed_by, @seed_now
FROM DUAL
WHERE @vehicle_t2_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM vehicle_documents
      WHERE tenant_id = @tenant2_id
        AND vehicle_id = @vehicle_t2_id
        AND document_type = 'VEHICLE_PHOTO'
  );

-- -----------------------------------------------------------------------------
-- Passenger (rider) and guardian
-- -----------------------------------------------------------------------------
INSERT INTO riders
    (tenant_id, rider_code, rider_type, first_name, last_name, date_of_birth, gender, email, primary_phone,
     home_address_line1, city, state, zip_code, country, default_pickup_address, default_dropoff_address,
     pickup_notes, wheelchair_required, escort_required, special_instructions, emergency_contact_name,
     emergency_contact_phone, emergency_contact_relationship, notes, status,
     created_by, created_at, updated_by, updated_at)
SELECT
    @tenant1_id, 'RDR-T1-001', 'NEMT', 'Samuel', 'PassengerOneT1', '1959-09-19', 'MALE',
    'samuelweld2018+p1t1@gmail.com', '404-555-1401',
    '300 Rider Street', 'Atlanta', 'GA', '30305', 'United States',
    '300 Rider Street, Atlanta, GA 30305', '500 Medical Plaza, Atlanta, GA 30305',
    'Call before arrival.', TRUE, FALSE, 'Needs wheelchair securement.',
    'Samuel GuardianOneT1', '404-555-1501', 'Child',
    'Tenant1 passenger for guardian-linked realistic scenarios.', 'ACTIVE',
    @seed_by, @seed_now, @seed_by, @seed_now
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM riders WHERE tenant_id = @tenant1_id AND rider_code = 'RDR-T1-001');

INSERT INTO riders
    (tenant_id, rider_code, rider_type, first_name, last_name, date_of_birth, gender, email, primary_phone,
     home_address_line1, city, state, zip_code, country, default_pickup_address, default_dropoff_address,
     pickup_notes, wheelchair_required, escort_required, special_instructions, emergency_contact_name,
     emergency_contact_phone, emergency_contact_relationship, notes, status,
     created_by, created_at, updated_by, updated_at)
SELECT
    @tenant2_id, 'RDR-T2-001', 'OTHER', 'Samuel', 'PassengerOneT2', '1972-05-11', 'FEMALE',
    'samuelweld2018+p1t2@gmail.com', '404-555-2401',
    '400 Rider Avenue', 'Atlanta', 'GA', '30306', 'United States',
    '400 Rider Avenue, Atlanta, GA 30306', '700 Wellness Center, Atlanta, GA 30306',
    'Use side entrance.', FALSE, TRUE, 'Passenger travels with escort.',
    'Samuel GuardianOneT2', '404-555-2501', 'Sibling',
    'Tenant2 passenger for role and tenant segregation tests.', 'ACTIVE',
    @seed_by, @seed_now, @seed_by, @seed_now
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM riders WHERE tenant_id = @tenant2_id AND rider_code = 'RDR-T2-001');

SET @rider_t1_id = (SELECT id FROM riders WHERE tenant_id = @tenant1_id AND rider_code = 'RDR-T1-001' LIMIT 1);
SET @rider_t2_id = (SELECT id FROM riders WHERE tenant_id = @tenant2_id AND rider_code = 'RDR-T2-001' LIMIT 1);

INSERT IGNORE INTO rider_mobility_needs (rider_id, mobility_need) VALUES
    (@rider_t1_id, 'WHEELCHAIR');

INSERT INTO guardians
    (tenant_id, first_name, last_name, relation_to_rider_default, email, phone, address_line1, city, state,
     zip_code, country, preferred_communication_method, billing_contact, authorized_for_pickup, notes, status,
     created_by, created_at, updated_by, updated_at)
SELECT
    @tenant1_id, 'Samuel', 'GuardianOneT1', 'CHILD', 'samuelweld2018+g1t1@gmail.com', '404-555-1501',
    '305 Guardian Lane', 'Atlanta', 'GA', '30305', 'United States',
    'SMS', TRUE, TRUE, 'Primary guardian and billing contact for tenant1 passenger.', 'ACTIVE',
    @seed_by, @seed_now, @seed_by, @seed_now
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM guardians WHERE tenant_id = @tenant1_id AND email = 'samuelweld2018+g1t1@gmail.com');

INSERT INTO guardians
    (tenant_id, first_name, last_name, relation_to_rider_default, email, phone, address_line1, city, state,
     zip_code, country, preferred_communication_method, billing_contact, authorized_for_pickup, notes, status,
     created_by, created_at, updated_by, updated_at)
SELECT
    @tenant2_id, 'Samuel', 'GuardianOneT2', 'SIBLING', 'samuelweld2018+g1t2@gmail.com', '404-555-2501',
    '405 Guardian Road', 'Atlanta', 'GA', '30306', 'United States',
    'EMAIL', TRUE, TRUE, 'Primary guardian and billing contact for tenant2 passenger.', 'ACTIVE',
    @seed_by, @seed_now, @seed_by, @seed_now
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM guardians WHERE tenant_id = @tenant2_id AND email = 'samuelweld2018+g1t2@gmail.com');

SET @guardian_t1_id = (SELECT id FROM guardians WHERE tenant_id = @tenant1_id AND email = 'samuelweld2018+g1t1@gmail.com' LIMIT 1);
SET @guardian_t2_id = (SELECT id FROM guardians WHERE tenant_id = @tenant2_id AND email = 'samuelweld2018+g1t2@gmail.com' LIMIT 1);

INSERT IGNORE INTO rider_guardians
    (tenant_id, rider_id, guardian_id, relationship_type, primary_guardian, authorized_for_pickup,
     billing_contact, notes, status, created_by, created_at, updated_by, updated_at)
VALUES
    (@tenant1_id, @rider_t1_id, @guardian_t1_id, 'CHILD', TRUE, TRUE, TRUE,
     'Tenant1 primary guardian relationship.', 'ACTIVE', @seed_by, @seed_now, @seed_by, @seed_now),
    (@tenant2_id, @rider_t2_id, @guardian_t2_id, 'SIBLING', TRUE, TRUE, TRUE,
     'Tenant2 primary guardian relationship.', 'ACTIVE', @seed_by, @seed_now, @seed_by, @seed_now);

-- -----------------------------------------------------------------------------
-- Portal scopes and ride scenarios
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO portal_user_scopes
    (tenant_id, app_user_id, portal_subject_type, portal_subject_id, created_by, created_at, updated_by, updated_at)
SELECT @tenant1_id, id, 'DRIVER', @driver_t1_id, @seed_by, @seed_now, @seed_by, @seed_now
FROM app_users
WHERE email = 'samuelweld2018+d1t1@gmail.com' AND @driver_t1_id IS NOT NULL;

INSERT IGNORE INTO portal_user_scopes
    (tenant_id, app_user_id, portal_subject_type, portal_subject_id, created_by, created_at, updated_by, updated_at)
SELECT @tenant1_id, id, 'RIDER', @rider_t1_id, @seed_by, @seed_now, @seed_by, @seed_now
FROM app_users
WHERE email = 'samuelweld2018+p1t1@gmail.com' AND @rider_t1_id IS NOT NULL;

INSERT IGNORE INTO portal_user_scopes
    (tenant_id, app_user_id, portal_subject_type, portal_subject_id, created_by, created_at, updated_by, updated_at)
SELECT @tenant1_id, id, 'GUARDIAN', @guardian_t1_id, @seed_by, @seed_now, @seed_by, @seed_now
FROM app_users
WHERE email = 'samuelweld2018+g1t1@gmail.com' AND @guardian_t1_id IS NOT NULL;

INSERT IGNORE INTO portal_user_scopes
    (tenant_id, app_user_id, portal_subject_type, portal_subject_id, created_by, created_at, updated_by, updated_at)
SELECT @tenant2_id, id, 'DRIVER', @driver_t2_id, @seed_by, @seed_now, @seed_by, @seed_now
FROM app_users
WHERE email = 'samuelweld2018+d1t2@gmail.com' AND @driver_t2_id IS NOT NULL;

INSERT IGNORE INTO portal_user_scopes
    (tenant_id, app_user_id, portal_subject_type, portal_subject_id, created_by, created_at, updated_by, updated_at)
SELECT @tenant2_id, id, 'RIDER', @rider_t2_id, @seed_by, @seed_now, @seed_by, @seed_now
FROM app_users
WHERE email = 'samuelweld2018+p1t2@gmail.com' AND @rider_t2_id IS NOT NULL;

INSERT IGNORE INTO portal_user_scopes
    (tenant_id, app_user_id, portal_subject_type, portal_subject_id, created_by, created_at, updated_by, updated_at)
SELECT @tenant2_id, id, 'GUARDIAN', @guardian_t2_id, @seed_by, @seed_now, @seed_by, @seed_now
FROM app_users
WHERE email = 'samuelweld2018+g1t2@gmail.com' AND @guardian_t2_id IS NOT NULL;

INSERT INTO rides
    (tenant_id, ride_number, rider_id, guardian_id, service_type, trip_type,
     pickup_address_line1, pickup_city, pickup_state, pickup_zip_code, pickup_country,
     dropoff_address_line1, dropoff_city, dropoff_state, dropoff_zip_code, dropoff_country,
     scheduled_pickup_at, scheduled_dropoff_at, wheelchair_required, escort_required, companion_count,
     special_instructions, operational_notes, priority_level, billing_type, driver_id, vehicle_id,
     status, created_by, created_at, updated_by, updated_at)
SELECT
    @tenant1_id, 'RIDE-T1-001', @rider_t1_id, @guardian_t1_id, 'NEMT', 'ONE_WAY',
    '300 Rider Street', 'Atlanta', 'GA', '30305', 'United States',
    '500 Medical Plaza', 'Atlanta', 'GA', '30305', 'United States',
    DATE_ADD(CURRENT_DATE, INTERVAL 9 HOUR), DATE_ADD(CURRENT_DATE, INTERVAL 10 HOUR),
    TRUE, FALSE, 0, 'Wheelchair securement required.',
    'Assigned to driver and vehicle for active dispatch workflow testing.', 'HIGH', 'PRIVATE_PAY',
    @driver_t1_id, @vehicle_t1_id,
    'ASSIGNED', @seed_by, @seed_now, @seed_by, @seed_now
FROM DUAL
WHERE @rider_t1_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM rides WHERE tenant_id = @tenant1_id AND ride_number = 'RIDE-T1-001');

INSERT INTO rides
    (tenant_id, ride_number, rider_id, guardian_id, service_type, trip_type,
     pickup_address_line1, pickup_city, pickup_state, pickup_zip_code, pickup_country,
     dropoff_address_line1, dropoff_city, dropoff_state, dropoff_zip_code, dropoff_country,
     scheduled_pickup_at, scheduled_dropoff_at, wheelchair_required, escort_required, companion_count,
     special_instructions, operational_notes, priority_level, billing_type, driver_id, vehicle_id,
     status, created_by, created_at, updated_by, updated_at)
SELECT
    @tenant2_id, 'RIDE-T2-001', @rider_t2_id, @guardian_t2_id, 'GENERAL_TRANSPORT', 'ROUND_TRIP',
    '400 Rider Avenue', 'Atlanta', 'GA', '30306', 'United States',
    '700 Wellness Center', 'Atlanta', 'GA', '30306', 'United States',
    DATE_ADD(CURRENT_DATE, INTERVAL 11 HOUR), DATE_ADD(CURRENT_DATE, INTERVAL 12 HOUR),
    FALSE, TRUE, 1, 'Escort accompanies passenger.',
    'Tenant2 trip for guardian notifications and route assignment testing.', 'STANDARD', 'SPONSORED',
    @driver_t2_id, @vehicle_t2_id,
    'SCHEDULED', @seed_by, @seed_now, @seed_by, @seed_now
FROM DUAL
WHERE @rider_t2_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM rides WHERE tenant_id = @tenant2_id AND ride_number = 'RIDE-T2-001');

-- END V28__seed_multi_tenant_realistic_test_data.sql

-- ================================================================
-- BEGIN V29__seed_bulk_operational_scenarios.sql
-- ================================================================
-- Bulk operational scenario seed data.
-- Goal: realistic high-volume test data for tenant admin/dispatcher workflows.
-- Safety: additive only; no updates/deletes, all inserts are guarded.

SET @seed_now = CURRENT_TIMESTAMP(6);
SET @seed_by = 'v29-bulk-seed';
SET @seed_password = '$2a$10$PaQW5g5WNZnvrhL6d9DBGOdS2HBHvP19sgr18rCXT6DNYjVrKT2ba';

CREATE TEMPORARY TABLE tmp_seq_20 (n INT PRIMARY KEY);
CREATE TEMPORARY TABLE tmp_seq_20_b (n INT PRIMARY KEY);
CREATE TEMPORARY TABLE tmp_seq_50 (n INT PRIMARY KEY);
CREATE TEMPORARY TABLE tmp_seq_10 (n INT PRIMARY KEY);

INSERT INTO tmp_seq_20 (n)
WITH RECURSIVE seq AS (
    SELECT 1 AS n
    UNION ALL
    SELECT n + 1 FROM seq WHERE n < 20
)
SELECT n FROM seq;

INSERT INTO tmp_seq_20_b (n)
SELECT n FROM tmp_seq_20;

INSERT INTO tmp_seq_50 (n)
WITH RECURSIVE seq AS (
    SELECT 1 AS n
    UNION ALL
    SELECT n + 1 FROM seq WHERE n < 50
)
SELECT n FROM seq;

INSERT INTO tmp_seq_10 (n)
WITH RECURSIVE seq AS (
    SELECT 1 AS n
    UNION ALL
    SELECT n + 1 FROM seq WHERE n < 10
)
SELECT n FROM seq;

-- -----------------------------------------------------------------------------
-- Tenants (20)
-- -----------------------------------------------------------------------------
INSERT INTO tenants
    (id, tenant_code, company_name, legal_name, email, phone, address_line1, city, state, zip_code,
     country, business_type, subscription_plan, notes, status, active, created_by, created_at, updated_by, updated_at)
SELECT
    CONCAT('44000000-0000-4000-8000-', LPAD(s.n, 12, '0')) AS id,
    CONCAT('TENANT-', LPAD(s.n, 2, '0')) AS tenant_code,
    CONCAT('Tenant ', LPAD(s.n, 2, '0'), ' Mobility') AS company_name,
    CONCAT('Tenant ', LPAD(s.n, 2, '0'), ' Mobility LLC') AS legal_name,
    CONCAT('samuelweld2018+t', LPAD(s.n, 2, '0'), '@gmail.com') AS email,
    CONCAT('404-700-', LPAD(s.n, 4, '0')) AS phone,
    CONCAT(s.n, '00 Fleet Avenue') AS address_line1,
    'Atlanta' AS city,
    'GA' AS state,
    CONCAT('30', LPAD(s.n, 3, '0')) AS zip_code,
    'United States' AS country,
    'NEMT Provider' AS business_type,
    CASE WHEN s.n <= 10 THEN 'Professional' ELSE 'Growth' END AS subscription_plan,
    'Bulk tenant seeded for dispatch, assignment, and role workflow testing.' AS notes,
    'ACTIVE' AS status,
    TRUE AS active,
    @seed_by,
    @seed_now,
    @seed_by,
    @seed_now
FROM tmp_seq_20 s
LEFT JOIN tenants t
    ON t.tenant_code = CONCAT('TENANT-', LPAD(s.n, 2, '0'))
WHERE t.id IS NULL;

INSERT IGNORE INTO tenant_service_types (tenant_id, service_type)
SELECT CONCAT('44000000-0000-4000-8000-', LPAD(s.n, 12, '0')), 'NEMT' FROM tmp_seq_20 s;
INSERT IGNORE INTO tenant_service_types (tenant_id, service_type)
SELECT CONCAT('44000000-0000-4000-8000-', LPAD(s.n, 12, '0')), 'GENERAL_TRANSPORT' FROM tmp_seq_20 s;
INSERT IGNORE INTO tenant_service_types (tenant_id, service_type)
SELECT CONCAT('44000000-0000-4000-8000-', LPAD(s.n, 12, '0')), 'ADA_PARATRANSIT' FROM tmp_seq_20 s;

-- -----------------------------------------------------------------------------
-- Platform admin baseline
-- -----------------------------------------------------------------------------
INSERT INTO app_users
    (tenant_id, email, first_name, last_name, password_hash, status, enabled, locked, created_by, created_at, updated_by, updated_at)
SELECT
    NULL,
    'samuelweld2018@gmail.com',
    'Samuel',
    'PlatformAdmin',
    @seed_password,
    'ACTIVE',
    TRUE,
    FALSE,
    @seed_by,
    @seed_now,
    @seed_by,
    @seed_now
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE email = 'samuelweld2018@gmail.com');

INSERT IGNORE INTO user_roles (user_id, role_name)
SELECT id, 'ROLE_PLATFORM_ADMIN' FROM app_users WHERE email = 'samuelweld2018@gmail.com';

-- -----------------------------------------------------------------------------
-- Tenant admins and dispatchers (1 each per tenant)
-- -----------------------------------------------------------------------------
INSERT INTO app_users
    (tenant_id, email, first_name, last_name, password_hash, status, enabled, locked, created_by, created_at, updated_by, updated_at)
SELECT
    CONCAT('44000000-0000-4000-8000-', LPAD(s.n, 12, '0')) AS tenant_id,
    CONCAT('samuelweld2018+ta1t', LPAD(s.n, 2, '0'), '@gmail.com') AS email,
    'Samuel' AS first_name,
    CONCAT('TenantAdminT', LPAD(s.n, 2, '0')) AS last_name,
    @seed_password,
    'ACTIVE',
    TRUE,
    FALSE,
    @seed_by,
    @seed_now,
    @seed_by,
    @seed_now
FROM tmp_seq_20 s
LEFT JOIN app_users u
    ON u.email = CONCAT('samuelweld2018+ta1t', LPAD(s.n, 2, '0'), '@gmail.com')
WHERE u.id IS NULL;

INSERT INTO app_users
    (tenant_id, email, first_name, last_name, password_hash, status, enabled, locked, created_by, created_at, updated_by, updated_at)
SELECT
    CONCAT('44000000-0000-4000-8000-', LPAD(s.n, 12, '0')) AS tenant_id,
    CONCAT('samuelweld2018+dp1t', LPAD(s.n, 2, '0'), '@gmail.com') AS email,
    'Samuel' AS first_name,
    CONCAT('DispatcherT', LPAD(s.n, 2, '0')) AS last_name,
    @seed_password,
    'ACTIVE',
    TRUE,
    FALSE,
    @seed_by,
    @seed_now,
    @seed_by,
    @seed_now
FROM tmp_seq_20 s
LEFT JOIN app_users u
    ON u.email = CONCAT('samuelweld2018+dp1t', LPAD(s.n, 2, '0'), '@gmail.com')
WHERE u.id IS NULL;

INSERT IGNORE INTO user_roles (user_id, role_name)
SELECT id, 'ROLE_TENANT_ADMIN'
FROM app_users
WHERE email LIKE 'samuelweld2018+ta1t%@gmail.com';

INSERT IGNORE INTO user_roles (user_id, role_name)
SELECT id, 'ROLE_DISPATCHER'
FROM app_users
WHERE email LIKE 'samuelweld2018+dp1t%@gmail.com';

-- -----------------------------------------------------------------------------
-- Drivers (50 per tenant), driver users, vehicles, and image documents
-- -----------------------------------------------------------------------------
INSERT INTO drivers
    (tenant_id, driver_code, first_name, last_name, date_of_birth, email, phone, address_line1, city, state,
     zip_code, country, driver_type, status, hire_date, start_date, availability_summary, license_number,
     license_state, license_expiry_date, background_check_status, background_check_expiry_date, drug_test_status,
     drug_test_expiry_date, training_status, training_completion_date, emergency_contact_name,
     emergency_contact_phone, emergency_contact_relationship, notes, created_by, created_at, updated_by, updated_at)
SELECT
    CONCAT('44000000-0000-4000-8000-', LPAD(t.n, 12, '0')) AS tenant_id,
    CONCAT('DRV-T', LPAD(t.n, 2, '0'), '-', LPAD(d.n, 3, '0')) AS driver_code,
    'Samuel' AS first_name,
    CONCAT('Driver', LPAD(d.n, 3, '0'), 'T', LPAD(t.n, 2, '0')) AS last_name,
    DATE_SUB(CURRENT_DATE, INTERVAL (8000 + d.n) DAY) AS date_of_birth,
    CONCAT('samuelweld2018+d', LPAD(d.n, 2, '0'), 't', LPAD(t.n, 2, '0'), '@gmail.com') AS email,
    CONCAT('404-', LPAD(100 + t.n, 3, '0'), '-', LPAD(d.n, 4, '0')) AS phone,
    CONCAT(d.n, ' Driver Circle') AS address_line1,
    'Atlanta' AS city,
    'GA' AS state,
    CONCAT('31', LPAD(t.n, 3, '0')) AS zip_code,
    'United States' AS country,
    CASE WHEN MOD(d.n, 2) = 0 THEN 'EMPLOYEE' ELSE 'CONTRACTOR' END AS driver_type,
    CASE WHEN MOD(d.n, 10) = 0 THEN 'INACTIVE' ELSE 'ACTIVE' END AS status,
    DATE_SUB(CURRENT_DATE, INTERVAL (200 + d.n) DAY) AS hire_date,
    DATE_SUB(CURRENT_DATE, INTERVAL (180 + d.n) DAY) AS start_date,
    CASE
        WHEN MOD(d.n, 3) = 0 THEN 'Weekdays 06:00-14:00'
        WHEN MOD(d.n, 3) = 1 THEN 'Weekdays 10:00-18:00'
        ELSE 'Weekends 08:00-20:00'
    END AS availability_summary,
    CONCAT('GA-DL-T', LPAD(t.n, 2, '0'), '-', LPAD(d.n, 4, '0')) AS license_number,
    'GA' AS license_state,
    DATE_ADD(CURRENT_DATE, INTERVAL 18 MONTH) AS license_expiry_date,
    'CLEAR' AS background_check_status,
    DATE_ADD(CURRENT_DATE, INTERVAL 12 MONTH) AS background_check_expiry_date,
    'CLEAR' AS drug_test_status,
    DATE_ADD(CURRENT_DATE, INTERVAL 12 MONTH) AS drug_test_expiry_date,
    'COMPLETED' AS training_status,
    DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY) AS training_completion_date,
    CONCAT('EmergencyContactT', LPAD(t.n, 2, '0'), 'D', LPAD(d.n, 3, '0')) AS emergency_contact_name,
    CONCAT('404-', LPAD(500 + t.n, 3, '0'), '-', LPAD(d.n, 4, '0')) AS emergency_contact_phone,
    'Family' AS emergency_contact_relationship,
    'Bulk seeded driver for dispatch and assignment testing.' AS notes,
    @seed_by,
    @seed_now,
    @seed_by,
    @seed_now
FROM tmp_seq_20 t
CROSS JOIN tmp_seq_50 d
LEFT JOIN drivers existing
    ON existing.tenant_id = CONCAT('44000000-0000-4000-8000-', LPAD(t.n, 12, '0'))
   AND existing.driver_code = CONCAT('DRV-T', LPAD(t.n, 2, '0'), '-', LPAD(d.n, 3, '0'))
WHERE existing.id IS NULL;

INSERT INTO app_users
    (tenant_id, email, first_name, last_name, password_hash, status, enabled, locked, created_by, created_at, updated_by, updated_at)
SELECT
    CONCAT('44000000-0000-4000-8000-', LPAD(t.n, 12, '0')) AS tenant_id,
    CONCAT('samuelweld2018+d', LPAD(d.n, 2, '0'), 't', LPAD(t.n, 2, '0'), '@gmail.com') AS email,
    'Samuel',
    CONCAT('DriverUser', LPAD(d.n, 3, '0'), 'T', LPAD(t.n, 2, '0')),
    @seed_password,
    'ACTIVE',
    TRUE,
    FALSE,
    @seed_by,
    @seed_now,
    @seed_by,
    @seed_now
FROM tmp_seq_20 t
CROSS JOIN tmp_seq_50 d
LEFT JOIN app_users u
    ON u.email = CONCAT('samuelweld2018+d', LPAD(d.n, 2, '0'), 't', LPAD(t.n, 2, '0'), '@gmail.com')
WHERE u.id IS NULL;

INSERT IGNORE INTO user_roles (user_id, role_name)
SELECT id, 'ROLE_DRIVER'
FROM app_users
WHERE email LIKE 'samuelweld2018+d%t%@gmail.com';

INSERT INTO vehicles
    (tenant_id, vehicle_code, ownership_type, make, model, vehicle_year, color, vin, plate_number, plate_state,
     capacity, wheelchair_capacity, fuel_type, insurance_policy_number, insurance_expiry_date,
     registration_expiry_date, inspection_expiry_date, mileage, assigned_driver_id, notes, status,
     created_by, created_at, updated_by, updated_at)
SELECT
    CONCAT('44000000-0000-4000-8000-', LPAD(t.n, 12, '0')) AS tenant_id,
    CONCAT('VEH-T', LPAD(t.n, 2, '0'), '-', LPAD(d.n, 3, '0')) AS vehicle_code,
    'COMPANY_OWNED' AS ownership_type,
    CASE WHEN MOD(d.n, 2) = 0 THEN 'Ford' ELSE 'Toyota' END AS make,
    CASE WHEN MOD(d.n, 2) = 0 THEN 'Transit' ELSE 'Sienna' END AS model,
    CASE WHEN MOD(d.n, 2) = 0 THEN 2023 ELSE 2022 END AS vehicle_year,
    CASE WHEN MOD(d.n, 2) = 0 THEN 'White' ELSE 'Silver' END AS color,
    CONCAT('V', LPAD(t.n, 2, '0'), LPAD(d.n, 3, '0'), 'ABCDEFGHJKL') AS vin,
    CONCAT('T', LPAD(t.n, 2, '0'), 'D', LPAD(d.n, 3, '0')) AS plate_number,
    'GA' AS plate_state,
    8 AS capacity,
    2 AS wheelchair_capacity,
    CASE WHEN MOD(d.n, 2) = 0 THEN 'GASOLINE' ELSE 'HYBRID' END AS fuel_type,
    CONCAT('POL-T', LPAD(t.n, 2, '0'), '-', LPAD(d.n, 4, '0')) AS insurance_policy_number,
    DATE_ADD(CURRENT_DATE, INTERVAL 9 MONTH) AS insurance_expiry_date,
    DATE_ADD(CURRENT_DATE, INTERVAL 7 MONTH) AS registration_expiry_date,
    DATE_ADD(CURRENT_DATE, INTERVAL 6 MONTH) AS inspection_expiry_date,
    (20000 + d.n * 150) AS mileage,
    drv.id AS assigned_driver_id,
    'Bulk seeded vehicle assigned to matching driver index.' AS notes,
    'ACTIVE' AS status,
    @seed_by,
    @seed_now,
    @seed_by,
    @seed_now
FROM tmp_seq_20 t
CROSS JOIN tmp_seq_50 d
JOIN drivers drv
    ON drv.tenant_id = CONCAT('44000000-0000-4000-8000-', LPAD(t.n, 12, '0'))
   AND drv.driver_code = CONCAT('DRV-T', LPAD(t.n, 2, '0'), '-', LPAD(d.n, 3, '0'))
LEFT JOIN vehicles v
    ON v.tenant_id = CONCAT('44000000-0000-4000-8000-', LPAD(t.n, 12, '0'))
   AND v.vehicle_code = CONCAT('VEH-T', LPAD(t.n, 2, '0'), '-', LPAD(d.n, 3, '0'))
WHERE v.id IS NULL;

INSERT IGNORE INTO vehicle_service_types (vehicle_id, service_type)
SELECT id, 'NEMT' FROM vehicles WHERE tenant_id LIKE '44000000-0000-4000-8000-%' AND vehicle_code LIKE 'VEH-T%';

INSERT INTO driver_documents
    (tenant_id, driver_id, document_type, file_name, original_file_name, content_type, storage_path,
     document_number, issuing_authority, issue_date, expiry_date, verification_status, status, notes,
     uploaded_by, uploaded_at, created_by, created_at, updated_by, updated_at)
SELECT
    drv.tenant_id,
    drv.id,
    'PROFILE_PHOTO',
    CONCAT(LOWER(drv.driver_code), '-profile.jpg') AS file_name,
    CONCAT(LOWER(drv.driver_code), '-profile.jpg') AS original_file_name,
    'image/jpeg' AS content_type,
    CONCAT('tenants/', drv.tenant_id, '/drivers/', drv.driver_code, '/profile/', LOWER(drv.driver_code), '-profile.jpg') AS storage_path,
    NULL,
    NULL,
    NULL,
    NULL,
    'VERIFIED',
    'ACTIVE',
    'Bulk seeded profile image for driver.' AS notes,
    @seed_by,
    @seed_now,
    @seed_by,
    @seed_now,
    @seed_by,
    @seed_now
FROM drivers drv
LEFT JOIN driver_documents dd
    ON dd.driver_id = drv.id
   AND dd.document_type = 'PROFILE_PHOTO'
WHERE drv.tenant_id LIKE '44000000-0000-4000-8000-%'
  AND dd.id IS NULL;

INSERT INTO vehicle_documents
    (tenant_id, vehicle_id, document_type, file_name, original_file_name, content_type, storage_path,
     document_number, issuing_authority, issue_date, expiry_date, verification_status, status, notes,
     uploaded_by, uploaded_at, created_by, created_at, updated_by, updated_at)
SELECT
    veh.tenant_id,
    veh.id,
    'VEHICLE_PHOTO',
    CONCAT(LOWER(veh.vehicle_code), '-photo.jpg') AS file_name,
    CONCAT(LOWER(veh.vehicle_code), '-photo.jpg') AS original_file_name,
    'image/jpeg' AS content_type,
    CONCAT('tenants/', veh.tenant_id, '/vehicles/', veh.vehicle_code, '/photos/', LOWER(veh.vehicle_code), '-photo.jpg') AS storage_path,
    NULL,
    NULL,
    NULL,
    NULL,
    'VERIFIED',
    'ACTIVE',
    'Bulk seeded vehicle photo for operational testing.' AS notes,
    @seed_by,
    @seed_now,
    @seed_by,
    @seed_now,
    @seed_by,
    @seed_now
FROM vehicles veh
LEFT JOIN vehicle_documents vd
    ON vd.vehicle_id = veh.id
   AND vd.document_type = 'VEHICLE_PHOTO'
WHERE veh.tenant_id LIKE '44000000-0000-4000-8000-%'
  AND vd.id IS NULL;

-- -----------------------------------------------------------------------------
-- Riders (20 per tenant), guardians (10 per tenant), relationships and user roles
-- -----------------------------------------------------------------------------
INSERT INTO riders
    (tenant_id, rider_code, rider_type, first_name, last_name, date_of_birth, gender, email, primary_phone,
     home_address_line1, city, state, zip_code, country, default_pickup_address, default_dropoff_address,
     pickup_notes, wheelchair_required, escort_required, special_instructions, emergency_contact_name,
     emergency_contact_phone, emergency_contact_relationship, notes, status,
     created_by, created_at, updated_by, updated_at)
SELECT
    CONCAT('44000000-0000-4000-8000-', LPAD(t.n, 12, '0')) AS tenant_id,
    CONCAT('RDR-T', LPAD(t.n, 2, '0'), '-', LPAD(r.n, 3, '0')) AS rider_code,
    CASE WHEN MOD(r.n, 2) = 0 THEN 'NEMT' ELSE 'OTHER' END AS rider_type,
    'Samuel' AS first_name,
    CONCAT('Rider', LPAD(r.n, 3, '0'), 'T', LPAD(t.n, 2, '0')) AS last_name,
    DATE_SUB(CURRENT_DATE, INTERVAL (10000 + r.n) DAY) AS date_of_birth,
    CASE WHEN MOD(r.n, 2) = 0 THEN 'FEMALE' ELSE 'MALE' END AS gender,
    CONCAT('samuelweld2018+p', LPAD(r.n, 2, '0'), 't', LPAD(t.n, 2, '0'), '@gmail.com') AS email,
    CONCAT('404-', LPAD(200 + t.n, 3, '0'), '-', LPAD(r.n, 4, '0')) AS primary_phone,
    CONCAT(r.n, ' Rider Street') AS home_address_line1,
    'Atlanta' AS city,
    'GA' AS state,
    CONCAT('32', LPAD(t.n, 3, '0')) AS zip_code,
    'United States' AS country,
    CONCAT(r.n, ' Rider Street, Atlanta, GA ', CONCAT('32', LPAD(t.n, 3, '0'))) AS default_pickup_address,
    CONCAT(r.n, ' Medical Plaza, Atlanta, GA ', CONCAT('32', LPAD(t.n, 3, '0'))) AS default_dropoff_address,
    'Call before arrival.' AS pickup_notes,
    CASE WHEN MOD(r.n, 3) = 0 THEN TRUE ELSE FALSE END AS wheelchair_required,
    CASE WHEN r.n <= 10 THEN TRUE ELSE FALSE END AS escort_required,
    CASE
        WHEN MOD(r.n, 3) = 0 THEN 'Wheelchair securement required.'
        WHEN r.n <= 10 THEN 'Guardian may accompany rider.'
        ELSE 'Standard transport.'
    END AS special_instructions,
    CONCAT('EmergencyRiderT', LPAD(t.n, 2, '0'), LPAD(r.n, 3, '0')),
    CONCAT('404-', LPAD(260 + t.n, 3, '0'), '-', LPAD(r.n, 4, '0')),
    CASE WHEN r.n <= 10 THEN 'Guardian' ELSE 'Self' END,
    'Bulk seeded rider for guardian/non-guardian scenario testing.' AS notes,
    'ACTIVE' AS status,
    @seed_by,
    @seed_now,
    @seed_by,
    @seed_now
FROM tmp_seq_20 t
CROSS JOIN tmp_seq_20_b r
LEFT JOIN riders existing
    ON existing.tenant_id = CONCAT('44000000-0000-4000-8000-', LPAD(t.n, 12, '0'))
   AND existing.rider_code = CONCAT('RDR-T', LPAD(t.n, 2, '0'), '-', LPAD(r.n, 3, '0'))
WHERE existing.id IS NULL;

INSERT INTO app_users
    (tenant_id, email, first_name, last_name, password_hash, status, enabled, locked, created_by, created_at, updated_by, updated_at)
SELECT
    CONCAT('44000000-0000-4000-8000-', LPAD(t.n, 12, '0')) AS tenant_id,
    CONCAT('samuelweld2018+p', LPAD(r.n, 2, '0'), 't', LPAD(t.n, 2, '0'), '@gmail.com') AS email,
    'Samuel',
    CONCAT('RiderUser', LPAD(r.n, 3, '0'), 'T', LPAD(t.n, 2, '0')),
    @seed_password,
    'ACTIVE',
    TRUE,
    FALSE,
    @seed_by,
    @seed_now,
    @seed_by,
    @seed_now
FROM tmp_seq_20 t
CROSS JOIN tmp_seq_20_b r
LEFT JOIN app_users u
    ON u.email = CONCAT('samuelweld2018+p', LPAD(r.n, 2, '0'), 't', LPAD(t.n, 2, '0'), '@gmail.com')
WHERE u.id IS NULL;

INSERT IGNORE INTO user_roles (user_id, role_name)
SELECT id, 'ROLE_RIDER'
FROM app_users
WHERE email LIKE 'samuelweld2018+p%t%@gmail.com';

INSERT INTO guardians
    (tenant_id, first_name, last_name, relation_to_rider_default, email, phone, address_line1, city, state,
     zip_code, country, preferred_communication_method, billing_contact, authorized_for_pickup, notes, status,
     created_by, created_at, updated_by, updated_at)
SELECT
    CONCAT('44000000-0000-4000-8000-', LPAD(t.n, 12, '0')) AS tenant_id,
    'Samuel' AS first_name,
    CONCAT('Guardian', LPAD(g.n, 3, '0'), 'T', LPAD(t.n, 2, '0')) AS last_name,
    CASE
        WHEN MOD(g.n, 5) = 0 THEN 'SPOUSE'
        WHEN MOD(g.n, 2) = 0 THEN 'CHILD'
        ELSE 'SIBLING'
    END AS relation_to_rider_default,
    CONCAT('samuelweld2018+g', LPAD(g.n, 2, '0'), 't', LPAD(t.n, 2, '0'), '@gmail.com') AS email,
    CONCAT('404-', LPAD(300 + t.n, 3, '0'), '-', LPAD(g.n, 4, '0')) AS phone,
    CONCAT(g.n, ' Guardian Drive') AS address_line1,
    'Atlanta' AS city,
    'GA' AS state,
    CONCAT('33', LPAD(t.n, 3, '0')) AS zip_code,
    'United States' AS country,
    CASE WHEN MOD(g.n, 2) = 0 THEN 'SMS' ELSE 'EMAIL' END AS preferred_communication_method,
    TRUE AS billing_contact,
    TRUE AS authorized_for_pickup,
    'Bulk seeded guardian for linked rider scenarios.' AS notes,
    'ACTIVE' AS status,
    @seed_by,
    @seed_now,
    @seed_by,
    @seed_now
FROM tmp_seq_20 t
CROSS JOIN tmp_seq_10 g
LEFT JOIN guardians existing
    ON existing.tenant_id = CONCAT('44000000-0000-4000-8000-', LPAD(t.n, 12, '0'))
   AND existing.email = CONCAT('samuelweld2018+g', LPAD(g.n, 2, '0'), 't', LPAD(t.n, 2, '0'), '@gmail.com')
WHERE existing.id IS NULL;

INSERT INTO app_users
    (tenant_id, email, first_name, last_name, password_hash, status, enabled, locked, created_by, created_at, updated_by, updated_at)
SELECT
    CONCAT('44000000-0000-4000-8000-', LPAD(t.n, 12, '0')) AS tenant_id,
    CONCAT('samuelweld2018+g', LPAD(g.n, 2, '0'), 't', LPAD(t.n, 2, '0'), '@gmail.com') AS email,
    'Samuel',
    CONCAT('GuardianUser', LPAD(g.n, 3, '0'), 'T', LPAD(t.n, 2, '0')),
    @seed_password,
    'ACTIVE',
    TRUE,
    FALSE,
    @seed_by,
    @seed_now,
    @seed_by,
    @seed_now
FROM tmp_seq_20 t
CROSS JOIN tmp_seq_10 g
LEFT JOIN app_users u
    ON u.email = CONCAT('samuelweld2018+g', LPAD(g.n, 2, '0'), 't', LPAD(t.n, 2, '0'), '@gmail.com')
WHERE u.id IS NULL;

INSERT IGNORE INTO user_roles (user_id, role_name)
SELECT id, 'ROLE_GUARDIAN'
FROM app_users
WHERE email LIKE 'samuelweld2018+g%t%@gmail.com';

INSERT IGNORE INTO rider_guardians
    (tenant_id, rider_id, guardian_id, relationship_type, primary_guardian, authorized_for_pickup,
     billing_contact, notes, status, created_by, created_at, updated_by, updated_at)
SELECT
    rid.tenant_id,
    rid.id,
    g.id,
    CASE
        WHEN MOD(seq.n, 5) = 0 THEN 'SPOUSE'
        WHEN MOD(seq.n, 2) = 0 THEN 'CHILD'
        ELSE 'SIBLING'
    END AS relationship_type,
    TRUE,
    TRUE,
    TRUE,
    'Bulk seeded rider-guardian link.' AS notes,
    'ACTIVE' AS status,
    @seed_by,
    @seed_now,
    @seed_by,
    @seed_now
FROM tmp_seq_20 t
JOIN tmp_seq_10 seq ON 1 = 1
JOIN riders rid
    ON rid.tenant_id = CONCAT('44000000-0000-4000-8000-', LPAD(t.n, 12, '0'))
   AND rid.rider_code = CONCAT('RDR-T', LPAD(t.n, 2, '0'), '-', LPAD(seq.n, 3, '0'))
JOIN guardians g
    ON g.tenant_id = rid.tenant_id
   AND g.email = CONCAT('samuelweld2018+g', LPAD(seq.n, 2, '0'), 't', LPAD(t.n, 2, '0'), '@gmail.com');

-- -----------------------------------------------------------------------------
-- Portal scopes
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO portal_user_scopes
    (tenant_id, app_user_id, portal_subject_type, portal_subject_id, created_by, created_at, updated_by, updated_at)
SELECT
    drv.tenant_id,
    usr.id,
    'DRIVER',
    drv.id,
    @seed_by,
    @seed_now,
    @seed_by,
    @seed_now
FROM drivers drv
JOIN app_users usr
    ON usr.email = drv.email
WHERE drv.tenant_id LIKE '44000000-0000-4000-8000-%';

INSERT IGNORE INTO portal_user_scopes
    (tenant_id, app_user_id, portal_subject_type, portal_subject_id, created_by, created_at, updated_by, updated_at)
SELECT
    rid.tenant_id,
    usr.id,
    'RIDER',
    rid.id,
    @seed_by,
    @seed_now,
    @seed_by,
    @seed_now
FROM riders rid
JOIN app_users usr
    ON usr.email = rid.email
WHERE rid.tenant_id LIKE '44000000-0000-4000-8000-%';

INSERT IGNORE INTO portal_user_scopes
    (tenant_id, app_user_id, portal_subject_type, portal_subject_id, created_by, created_at, updated_by, updated_at)
SELECT
    g.tenant_id,
    usr.id,
    'GUARDIAN',
    g.id,
    @seed_by,
    @seed_now,
    @seed_by,
    @seed_now
FROM guardians g
JOIN app_users usr
    ON usr.email = g.email
WHERE g.tenant_id LIKE '44000000-0000-4000-8000-%';

-- -----------------------------------------------------------------------------
-- Routes (20 per tenant), rides (20 per tenant), and route stops
-- -----------------------------------------------------------------------------
INSERT INTO routes
    (tenant_id, route_code, route_name, route_date, service_type, assigned_driver_id, assigned_vehicle_id,
     start_time, end_time, manifest_notes, notes, status, created_by, created_at, updated_by, updated_at)
SELECT
    tenant_id,
    route_code,
    route_name,
    route_date,
    service_type,
    assigned_driver_id,
    assigned_vehicle_id,
    start_time,
    end_time,
    manifest_notes,
    notes,
    status,
    @seed_by,
    @seed_now,
    @seed_by,
    @seed_now
FROM (
    SELECT
        CONCAT('44000000-0000-4000-8000-', LPAD(t.n, 12, '0')) AS tenant_id,
        CONCAT('RT-T', LPAD(t.n, 2, '0'), '-', LPAD(r.n, 2, '0')) AS route_code,
        CONCAT('Tenant ', LPAD(t.n, 2, '0'), ' Route ', LPAD(r.n, 2, '0')) AS route_name,
        DATE_ADD(CURRENT_DATE, INTERVAL MOD(r.n, 3) DAY) AS route_date,
        CASE
            WHEN MOD(r.n, 3) = 0 THEN 'NEMT'
            WHEN MOD(r.n, 3) = 1 THEN 'ADA_PARATRANSIT'
            ELSE 'GENERAL_TRANSPORT'
        END AS service_type,
        drv.id AS assigned_driver_id,
        veh.id AS assigned_vehicle_id,
        ADDTIME('06:00:00', SEC_TO_TIME((r.n - 1) * 900)) AS start_time,
        ADDTIME('08:00:00', SEC_TO_TIME((r.n - 1) * 900)) AS end_time,
        'Bulk seeded route manifest for dispatcher assignment testing.' AS manifest_notes,
        'Bulk seeded route note.' AS notes,
        CASE
            WHEN MOD(r.n, 5) = 0 THEN 'COMPLETED'
            WHEN MOD(r.n, 5) = 1 THEN 'IN_PROGRESS'
            WHEN MOD(r.n, 5) = 2 THEN 'READY'
            ELSE 'PLANNED'
        END AS status
    FROM tmp_seq_20 t
    CROSS JOIN tmp_seq_20_b r
    JOIN drivers drv
        ON drv.tenant_id = CONCAT('44000000-0000-4000-8000-', LPAD(t.n, 12, '0'))
       AND drv.driver_code = CONCAT('DRV-T', LPAD(t.n, 2, '0'), '-', LPAD(r.n, 3, '0'))
    JOIN vehicles veh
        ON veh.tenant_id = drv.tenant_id
       AND veh.vehicle_code = CONCAT('VEH-T', LPAD(t.n, 2, '0'), '-', LPAD(r.n, 3, '0'))
) src
LEFT JOIN routes existing
    ON existing.tenant_id = src.tenant_id
   AND existing.route_code = src.route_code
WHERE existing.id IS NULL;

INSERT INTO rides
    (tenant_id, ride_number, rider_id, guardian_id, service_type, trip_type,
     pickup_address_line1, pickup_city, pickup_state, pickup_zip_code, pickup_country,
     dropoff_address_line1, dropoff_city, dropoff_state, dropoff_zip_code, dropoff_country,
     scheduled_pickup_at, scheduled_dropoff_at, wheelchair_required, escort_required, companion_count,
     special_instructions, operational_notes, priority_level, billing_type, driver_id, vehicle_id, route_id,
     status, created_by, created_at, updated_by, updated_at)
SELECT
    src.tenant_id,
    src.ride_number,
    src.rider_id,
    src.guardian_id,
    src.service_type,
    src.trip_type,
    src.pickup_address_line1,
    src.pickup_city,
    src.pickup_state,
    src.pickup_zip_code,
    src.pickup_country,
    src.dropoff_address_line1,
    src.dropoff_city,
    src.dropoff_state,
    src.dropoff_zip_code,
    src.dropoff_country,
    src.scheduled_pickup_at,
    src.scheduled_dropoff_at,
    src.wheelchair_required,
    src.escort_required,
    src.companion_count,
    src.special_instructions,
    src.operational_notes,
    src.priority_level,
    src.billing_type,
    src.driver_id,
    src.vehicle_id,
    src.route_id,
    src.status,
    @seed_by,
    @seed_now,
    @seed_by,
    @seed_now
FROM (
    SELECT
        CONCAT('44000000-0000-4000-8000-', LPAD(t.n, 12, '0')) AS tenant_id,
        CONCAT('RIDE-T', LPAD(t.n, 2, '0'), '-', LPAD(r.n, 3, '0')) AS ride_number,
        rid.id AS rider_id,
        CASE WHEN r.n <= 10 THEN g.id ELSE NULL END AS guardian_id,
        CASE
            WHEN MOD(r.n, 3) = 0 THEN 'NEMT'
            WHEN MOD(r.n, 3) = 1 THEN 'ADA_PARATRANSIT'
            ELSE 'GENERAL_TRANSPORT'
        END AS service_type,
        CASE WHEN MOD(r.n, 2) = 0 THEN 'ROUND_TRIP' ELSE 'ONE_WAY' END AS trip_type,
        CONCAT(r.n, ' Pickup Lane') AS pickup_address_line1,
        'Atlanta' AS pickup_city,
        'GA' AS pickup_state,
        CONCAT('34', LPAD(t.n, 3, '0')) AS pickup_zip_code,
        'United States' AS pickup_country,
        CONCAT(r.n, ' Dropoff Plaza') AS dropoff_address_line1,
        'Atlanta' AS dropoff_city,
        'GA' AS dropoff_state,
        CONCAT('35', LPAD(t.n, 3, '0')) AS dropoff_zip_code,
        'United States' AS dropoff_country,
        CASE
            WHEN MOD(r.n, 5) = 0 THEN DATE_SUB(TIMESTAMP(CURRENT_DATE, '10:00:00'), INTERVAL 2 DAY)
            WHEN MOD(r.n, 5) = 1 THEN DATE_ADD(TIMESTAMP(CURRENT_DATE, '07:00:00'), INTERVAL r.n HOUR)
            WHEN MOD(r.n, 5) = 2 THEN DATE_ADD(TIMESTAMP(CURRENT_DATE, '08:00:00'), INTERVAL r.n HOUR)
            WHEN MOD(r.n, 5) = 3 THEN DATE_ADD(TIMESTAMP(CURRENT_DATE, '09:00:00'), INTERVAL r.n HOUR)
            ELSE DATE_ADD(TIMESTAMP(CURRENT_DATE, '11:00:00'), INTERVAL r.n HOUR)
        END AS scheduled_pickup_at,
        CASE
            WHEN MOD(r.n, 5) = 0 THEN DATE_SUB(TIMESTAMP(CURRENT_DATE, '11:00:00'), INTERVAL 2 DAY)
            ELSE DATE_ADD(TIMESTAMP(CURRENT_DATE, '12:00:00'), INTERVAL r.n HOUR)
        END AS scheduled_dropoff_at,
        CASE WHEN MOD(r.n, 3) = 0 THEN TRUE ELSE FALSE END AS wheelchair_required,
        CASE WHEN r.n <= 10 THEN TRUE ELSE FALSE END AS escort_required,
        CASE WHEN r.n <= 10 THEN 1 ELSE 0 END AS companion_count,
        CASE
            WHEN r.n <= 10 THEN 'Rider has guardian and possible escort.'
            ELSE 'Rider is traveling without guardian.'
        END AS special_instructions,
        CASE
            WHEN MOD(r.n, 5) = 0 THEN 'Completed historical ride.'
            WHEN MOD(r.n, 5) = 1 THEN 'Assigned and ready for pickup.'
            WHEN MOD(r.n, 5) = 2 THEN 'Driver currently en route.'
            WHEN MOD(r.n, 5) = 3 THEN 'Rider has been picked up.'
            ELSE 'Scheduled and awaiting assignment confirmation.'
        END AS operational_notes,
        CASE
            WHEN MOD(r.n, 4) = 0 THEN 'HIGH'
            WHEN MOD(r.n, 4) = 1 THEN 'STANDARD'
            WHEN MOD(r.n, 4) = 2 THEN 'URGENT'
            ELSE 'LOW'
        END AS priority_level,
        CASE WHEN MOD(r.n, 2) = 0 THEN 'SPONSORED' ELSE 'PRIVATE_PAY' END AS billing_type,
        drv.id AS driver_id,
        veh.id AS vehicle_id,
        rt.id AS route_id,
        CASE
            WHEN MOD(r.n, 5) = 0 THEN 'COMPLETED'
            WHEN MOD(r.n, 5) = 1 THEN 'ASSIGNED'
            WHEN MOD(r.n, 5) = 2 THEN 'DRIVER_EN_ROUTE'
            WHEN MOD(r.n, 5) = 3 THEN 'PICKED_UP'
            ELSE 'SCHEDULED'
        END AS status
    FROM tmp_seq_20 t
    CROSS JOIN tmp_seq_20_b r
    JOIN riders rid
        ON rid.tenant_id = CONCAT('44000000-0000-4000-8000-', LPAD(t.n, 12, '0'))
       AND rid.rider_code = CONCAT('RDR-T', LPAD(t.n, 2, '0'), '-', LPAD(r.n, 3, '0'))
    LEFT JOIN guardians g
        ON g.tenant_id = rid.tenant_id
       AND g.email = CONCAT('samuelweld2018+g', LPAD(r.n, 2, '0'), 't', LPAD(t.n, 2, '0'), '@gmail.com')
    JOIN drivers drv
        ON drv.tenant_id = rid.tenant_id
       AND drv.driver_code = CONCAT('DRV-T', LPAD(t.n, 2, '0'), '-', LPAD(r.n, 3, '0'))
    JOIN vehicles veh
        ON veh.tenant_id = rid.tenant_id
       AND veh.vehicle_code = CONCAT('VEH-T', LPAD(t.n, 2, '0'), '-', LPAD(r.n, 3, '0'))
    JOIN routes rt
        ON rt.tenant_id = rid.tenant_id
       AND rt.route_code = CONCAT('RT-T', LPAD(t.n, 2, '0'), '-', LPAD(r.n, 2, '0'))
) src
LEFT JOIN rides existing
    ON existing.tenant_id = src.tenant_id
   AND existing.ride_number = src.ride_number
WHERE existing.id IS NULL;

INSERT INTO route_stops
    (tenant_id, route_id, ride_id, stop_sequence, planned_pickup_at, planned_dropoff_at, notes, status,
     created_by, created_at, updated_by, updated_at)
SELECT
    rt.tenant_id,
    rt.id,
    rd.id,
    1,
    rd.scheduled_pickup_at,
    rd.scheduled_dropoff_at,
    'Primary stop for seeded route/ride pair.' AS notes,
    'ACTIVE' AS status,
    @seed_by,
    @seed_now,
    @seed_by,
    @seed_now
FROM routes rt
JOIN rides rd
    ON rd.tenant_id = rt.tenant_id
   AND rd.route_id = rt.id
LEFT JOIN route_stops rs
    ON rs.route_id = rt.id
   AND rs.ride_id = rd.id
WHERE rt.tenant_id LIKE '44000000-0000-4000-8000-%'
  AND rs.id IS NULL;

DROP TEMPORARY TABLE tmp_seq_10;
DROP TEMPORARY TABLE tmp_seq_50;
DROP TEMPORARY TABLE tmp_seq_20_b;
DROP TEMPORARY TABLE tmp_seq_20;

-- END V29__seed_bulk_operational_scenarios.sql

