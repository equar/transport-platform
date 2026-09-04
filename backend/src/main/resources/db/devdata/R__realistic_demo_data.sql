-- Development-only, repeatable demo dataset.
-- Every account uses Password123. This location is loaded only by local/dev profiles.

SET @tenant_id = 'demo-metro-mobility-000000000001';
SET @now = CURRENT_TIMESTAMP(6);
SET @password = '$2a$10$PaQW5g5WNZnvrhL6d9DBGOdS2HBHvP19sgr18rCXT6DNYjVrKT2ba';

INSERT INTO tenants
    (id, tenant_code, company_name, legal_name, email, phone, address_line1, city, state, zip_code,
     country, business_type, subscription_plan, notes, status, active, created_by, created_at, updated_by, updated_at)
VALUES
    (@tenant_id, 'METRO-DEMO', 'Metro Mobility', 'Metro Mobility Services LLC', 'operations@metromobility.test',
     '404-555-0100', '1200 Transit Way', 'Atlanta', 'GA', '30309', 'United States', 'NEMT Provider',
     'Professional', 'Realistic development tenant for end-to-end workflow testing.', 'ACTIVE', TRUE,
     'demo-seed', @now, 'demo-seed', @now)
ON DUPLICATE KEY UPDATE company_name = VALUES(company_name), status = 'ACTIVE', updated_at = @now;

INSERT IGNORE INTO tenant_service_types (tenant_id, service_type) VALUES
    (@tenant_id, 'NEMT'), (@tenant_id, 'ADA_PARATRANSIT'), (@tenant_id, 'GENERAL_TRANSPORT');

INSERT INTO app_users
    (tenant_id, email, first_name, last_name, password_hash, status, enabled, locked, created_by, created_at, updated_by, updated_at)
VALUES
    (NULL, 'platform.admin@demo.test', 'Priya', 'Platform', @password, 'ACTIVE', TRUE, FALSE, 'demo-seed', @now, 'demo-seed', @now),
    (@tenant_id, 'tenant.admin@demo.test', 'Amelia', 'Brooks', @password, 'ACTIVE', TRUE, FALSE, 'demo-seed', @now, 'demo-seed', @now),
    (@tenant_id, 'dispatcher@demo.test', 'Marcus', 'Reed', @password, 'ACTIVE', TRUE, FALSE, 'demo-seed', @now, 'demo-seed', @now),
    (@tenant_id, 'billing@demo.test', 'Sofia', 'Patel', @password, 'ACTIVE', TRUE, FALSE, 'demo-seed', @now, 'demo-seed', @now),
    (@tenant_id, 'compliance@demo.test', 'Daniel', 'Kim', @password, 'ACTIVE', TRUE, FALSE, 'demo-seed', @now, 'demo-seed', @now),
    (@tenant_id, 'driver@demo.test', 'James', 'Wilson', @password, 'ACTIVE', TRUE, FALSE, 'demo-seed', @now, 'demo-seed', @now),
    (@tenant_id, 'rider@demo.test', 'Evelyn', 'Carter', @password, 'ACTIVE', TRUE, FALSE, 'demo-seed', @now, 'demo-seed', @now),
    (@tenant_id, 'guardian@demo.test', 'Olivia', 'Carter', @password, 'ACTIVE', TRUE, FALSE, 'demo-seed', @now, 'demo-seed', @now),
    (@tenant_id, 'organization@demo.test', 'Noah', 'Williams', @password, 'ACTIVE', TRUE, FALSE, 'demo-seed', @now, 'demo-seed', @now),
    (@tenant_id, 'viewer@demo.test', 'Taylor', 'Morgan', @password, 'ACTIVE', TRUE, FALSE, 'demo-seed', @now, 'demo-seed', @now)
ON DUPLICATE KEY UPDATE password_hash = @password, status = 'ACTIVE', enabled = TRUE, locked = FALSE, updated_at = @now;

INSERT IGNORE INTO user_roles (user_id, role_name)
SELECT id, 'ROLE_PLATFORM_ADMIN' FROM app_users WHERE email = 'platform.admin@demo.test';
INSERT IGNORE INTO user_roles (user_id, role_name)
SELECT id, 'ROLE_TENANT_ADMIN' FROM app_users WHERE email = 'tenant.admin@demo.test';
INSERT IGNORE INTO user_roles (user_id, role_name)
SELECT id, 'ROLE_DISPATCHER' FROM app_users WHERE email = 'dispatcher@demo.test';
INSERT IGNORE INTO user_roles (user_id, role_name)
SELECT id, 'ROLE_BILLING_ADMIN' FROM app_users WHERE email = 'billing@demo.test';
INSERT IGNORE INTO user_roles (user_id, role_name)
SELECT id, 'ROLE_COMPLIANCE_ADMIN' FROM app_users WHERE email = 'compliance@demo.test';
INSERT IGNORE INTO user_roles (user_id, role_name)
SELECT id, 'ROLE_DRIVER' FROM app_users WHERE email = 'driver@demo.test';
INSERT IGNORE INTO user_roles (user_id, role_name)
SELECT id, 'ROLE_RIDER' FROM app_users WHERE email = 'rider@demo.test';
INSERT IGNORE INTO user_roles (user_id, role_name)
SELECT id, 'ROLE_GUARDIAN' FROM app_users WHERE email = 'guardian@demo.test';
INSERT IGNORE INTO user_roles (user_id, role_name)
SELECT id, 'ROLE_ORGANIZATION_USER' FROM app_users WHERE email = 'organization@demo.test';
INSERT IGNORE INTO user_roles (user_id, role_name)
SELECT id, 'ROLE_VIEWER' FROM app_users WHERE email = 'viewer@demo.test';

-- Optional: seed explicit test drivers for a known tenant admin account.
-- Runs only when the tenant-scoped user exists.
SET @requested_tenant_id = (
        SELECT tenant_id
        FROM app_users
        WHERE lower(email) = 'samuelweld2018+11@gmail.com'
        LIMIT 1
);

INSERT INTO drivers
        (tenant_id, driver_code, first_name, last_name, email, phone, driver_type, status,
         background_check_status, drug_test_status, training_status, created_by, created_at, updated_by, updated_at)
SELECT @requested_tenant_id, 'DRV-TST-D1', 'Test', 'Driver One', 'samuelweld2018+d1@gmail.com',
             '404-555-2101', 'EMPLOYEE', 'ACTIVE', 'CLEAR', 'CLEAR', 'COMPLETED', 'demo-seed', @now, 'demo-seed', @now
WHERE @requested_tenant_id IS NOT NULL
    AND NOT EXISTS (
            SELECT 1
            FROM drivers
            WHERE tenant_id = @requested_tenant_id
                AND lower(email) = 'samuelweld2018+d1@gmail.com');

INSERT INTO drivers
        (tenant_id, driver_code, first_name, last_name, email, phone, driver_type, status,
         background_check_status, drug_test_status, training_status, created_by, created_at, updated_by, updated_at)
SELECT @requested_tenant_id, 'DRV-TST-D2', 'Test', 'Driver Two', 'samuelweld2018+d2@gmail.com',
             '404-555-2102', 'EMPLOYEE', 'ACTIVE', 'CLEAR', 'CLEAR', 'COMPLETED', 'demo-seed', @now, 'demo-seed', @now
WHERE @requested_tenant_id IS NOT NULL
    AND NOT EXISTS (
            SELECT 1
            FROM drivers
            WHERE tenant_id = @requested_tenant_id
                AND lower(email) = 'samuelweld2018+d2@gmail.com');

INSERT INTO drivers
        (tenant_id, driver_code, first_name, last_name, email, phone, driver_type, status,
         background_check_status, drug_test_status, training_status, created_by, created_at, updated_by, updated_at)
SELECT @requested_tenant_id, 'DRV-TST-D3', 'Test', 'Driver Three', 'samuelweld2018+d3@gmail.com',
             '404-555-2103', 'EMPLOYEE', 'ACTIVE', 'CLEAR', 'CLEAR', 'COMPLETED', 'demo-seed', @now, 'demo-seed', @now
WHERE @requested_tenant_id IS NOT NULL
    AND NOT EXISTS (
            SELECT 1
            FROM drivers
            WHERE tenant_id = @requested_tenant_id
                AND lower(email) = 'samuelweld2018+d3@gmail.com');

INSERT IGNORE INTO app_users
        (tenant_id, email, first_name, last_name, password_hash, status, enabled, locked, created_by, created_at, updated_by, updated_at)
SELECT @requested_tenant_id, 'samuelweld2018+d1@gmail.com', 'Test', 'Driver One', @password,
             'ACTIVE', TRUE, FALSE, 'demo-seed', @now, 'demo-seed', @now
WHERE @requested_tenant_id IS NOT NULL;

INSERT IGNORE INTO app_users
        (tenant_id, email, first_name, last_name, password_hash, status, enabled, locked, created_by, created_at, updated_by, updated_at)
SELECT @requested_tenant_id, 'samuelweld2018+d2@gmail.com', 'Test', 'Driver Two', @password,
             'ACTIVE', TRUE, FALSE, 'demo-seed', @now, 'demo-seed', @now
WHERE @requested_tenant_id IS NOT NULL;

INSERT IGNORE INTO app_users
        (tenant_id, email, first_name, last_name, password_hash, status, enabled, locked, created_by, created_at, updated_by, updated_at)
SELECT @requested_tenant_id, 'samuelweld2018+d3@gmail.com', 'Test', 'Driver Three', @password,
             'ACTIVE', TRUE, FALSE, 'demo-seed', @now, 'demo-seed', @now
WHERE @requested_tenant_id IS NOT NULL;

UPDATE app_users
SET password_hash = @password,
        status = 'ACTIVE',
        enabled = TRUE,
        locked = FALSE,
        updated_by = 'demo-seed',
        updated_at = @now
WHERE tenant_id = @requested_tenant_id
    AND lower(email) IN (
            'samuelweld2018+d1@gmail.com',
            'samuelweld2018+d2@gmail.com',
            'samuelweld2018+d3@gmail.com');

INSERT IGNORE INTO user_roles (user_id, role_name)
SELECT id, 'ROLE_DRIVER'
FROM app_users
WHERE tenant_id = @requested_tenant_id
    AND lower(email) IN (
            'samuelweld2018+d1@gmail.com',
            'samuelweld2018+d2@gmail.com',
            'samuelweld2018+d3@gmail.com');

SET @driver_test_1_id = (
        SELECT id
        FROM drivers
        WHERE tenant_id = @requested_tenant_id
            AND lower(email) = 'samuelweld2018+d1@gmail.com'
        LIMIT 1
);
SET @driver_test_2_id = (
        SELECT id
        FROM drivers
        WHERE tenant_id = @requested_tenant_id
            AND lower(email) = 'samuelweld2018+d2@gmail.com'
        LIMIT 1
);
SET @driver_test_3_id = (
        SELECT id
        FROM drivers
        WHERE tenant_id = @requested_tenant_id
            AND lower(email) = 'samuelweld2018+d3@gmail.com'
        LIMIT 1
);

INSERT IGNORE INTO portal_user_scopes
        (tenant_id, app_user_id, portal_subject_type, portal_subject_id, created_by, created_at, updated_by, updated_at)
SELECT @requested_tenant_id, id, 'DRIVER', @driver_test_1_id, 'demo-seed', @now, 'demo-seed', @now
FROM app_users
WHERE @requested_tenant_id IS NOT NULL
    AND @driver_test_1_id IS NOT NULL
    AND tenant_id = @requested_tenant_id
    AND lower(email) = 'samuelweld2018+d1@gmail.com';

INSERT IGNORE INTO portal_user_scopes
        (tenant_id, app_user_id, portal_subject_type, portal_subject_id, created_by, created_at, updated_by, updated_at)
SELECT @requested_tenant_id, id, 'DRIVER', @driver_test_2_id, 'demo-seed', @now, 'demo-seed', @now
FROM app_users
WHERE @requested_tenant_id IS NOT NULL
    AND @driver_test_2_id IS NOT NULL
    AND tenant_id = @requested_tenant_id
    AND lower(email) = 'samuelweld2018+d2@gmail.com';

INSERT IGNORE INTO portal_user_scopes
        (tenant_id, app_user_id, portal_subject_type, portal_subject_id, created_by, created_at, updated_by, updated_at)
SELECT @requested_tenant_id, id, 'DRIVER', @driver_test_3_id, 'demo-seed', @now, 'demo-seed', @now
FROM app_users
WHERE @requested_tenant_id IS NOT NULL
    AND @driver_test_3_id IS NOT NULL
    AND tenant_id = @requested_tenant_id
    AND lower(email) = 'samuelweld2018+d3@gmail.com';

INSERT INTO organizations
    (tenant_id, organization_code, organization_type, name, legal_name, address_line1, city, state, zip_code,
     country, primary_phone, primary_email, notes, status, created_by, created_at, updated_by, updated_at)
VALUES
    (@tenant_id, 'ORG-WELLNESS', 'DIALYSIS_CENTER', 'Peachtree Dialysis Center', 'Peachtree Renal Care Inc.',
     '880 Peachtree Street NE', 'Atlanta', 'GA', '30309', 'United States', '404-555-0140',
     'transport@peachtreedialysis.test', 'High-volume weekday dialysis partner.', 'ACTIVE', 'demo-seed', @now, 'demo-seed', @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), status = 'ACTIVE', updated_at = @now;
SET @organization_id = (SELECT id FROM organizations WHERE tenant_id = @tenant_id AND organization_code = 'ORG-WELLNESS');

INSERT INTO organization_contacts
    (tenant_id, organization_id, first_name, last_name, title, department, email, phone,
     preferred_communication_method, is_primary, notes, status, created_by, created_at, updated_by, updated_at)
SELECT @tenant_id, @organization_id, 'Noah', 'Williams', 'Transportation Coordinator', 'Patient Services',
       'organization@demo.test', '404-555-0141', 'EMAIL', TRUE, 'Primary portal contact.', 'ACTIVE',
       'demo-seed', @now, 'demo-seed', @now
WHERE NOT EXISTS (SELECT 1 FROM organization_contacts WHERE tenant_id = @tenant_id AND email = 'organization@demo.test');
SET @organization_contact_id = (SELECT id FROM organization_contacts WHERE tenant_id = @tenant_id AND email = 'organization@demo.test' LIMIT 1);

INSERT INTO drivers
    (tenant_id, driver_code, first_name, last_name, date_of_birth, email, phone, address_line1, city, state,
     zip_code, country, driver_type, status, hire_date, start_date, availability_summary, license_number,
     license_state, license_expiry_date, background_check_status, background_check_expiry_date, drug_test_status,
     drug_test_expiry_date, training_status, training_completion_date, emergency_contact_name,
     emergency_contact_phone, emergency_contact_relationship, notes, created_by, created_at, updated_by, updated_at)
VALUES
    (@tenant_id, 'DRV-1001', 'James', 'Wilson', '1986-04-18', 'driver@demo.test', '404-555-0111',
     '42 Auburn Avenue', 'Atlanta', 'GA', '30303', 'United States', 'EMPLOYEE', 'ACTIVE', '2023-01-09',
     '2023-01-16', 'Weekdays 06:00–16:00', 'GA-DL-921845', 'GA', DATE_ADD(CURRENT_DATE, INTERVAL 14 MONTH),
     'CLEAR', DATE_ADD(CURRENT_DATE, INTERVAL 9 MONTH), 'CLEAR', DATE_ADD(CURRENT_DATE, INTERVAL 7 MONTH),
     'COMPLETED', DATE_SUB(CURRENT_DATE, INTERVAL 5 MONTH), 'Maya Wilson', '404-555-0112', 'Spouse',
     'Lead NEMT driver; wheelchair securement certified.', 'demo-seed', @now, 'demo-seed', @now),
    (@tenant_id, 'DRV-1002', 'Aisha', 'Johnson', '1991-09-02', 'aisha.driver@demo.test', '404-555-0113',
     '310 Edgewood Avenue', 'Atlanta', 'GA', '30312', 'United States', 'CONTRACTOR', 'PENDING_REVIEW', NULL,
     NULL, 'Weekdays 10:00–20:00', 'GA-DL-551203', 'GA', DATE_ADD(CURRENT_DATE, INTERVAL 2 MONTH),
     'PENDING', NULL, 'CLEAR', DATE_ADD(CURRENT_DATE, INTERVAL 10 MONTH), 'NOT_STARTED', NULL,
     'Kwame Johnson', '404-555-0114', 'Brother', 'Awaiting background check approval.', 'demo-seed', @now, 'demo-seed', @now)
ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = @now;
SET @driver_id = (SELECT id FROM drivers WHERE tenant_id = @tenant_id AND driver_code = 'DRV-1001');

INSERT INTO vehicles
    (tenant_id, vehicle_code, ownership_type, make, model, vehicle_year, color, vin, plate_number, plate_state,
     capacity, wheelchair_capacity, fuel_type, insurance_policy_number, insurance_expiry_date,
     registration_expiry_date, inspection_expiry_date, mileage, assigned_driver_id, notes, status,
     created_by, created_at, updated_by, updated_at)
VALUES
    (@tenant_id, 'VEH-201', 'COMPANY_OWNED', 'Ford', 'Transit', 2023, 'Silver', '1FTBR1C80PKA10201',
     'MMT201', 'GA', 8, 2, 'GASOLINE', 'INS-MM-88420', DATE_ADD(CURRENT_DATE, INTERVAL 8 MONTH),
     DATE_ADD(CURRENT_DATE, INTERVAL 6 MONTH), DATE_ADD(CURRENT_DATE, INTERVAL 4 MONTH), 28450, @driver_id,
     'Primary wheelchair-accessible unit.', 'ACTIVE', 'demo-seed', @now, 'demo-seed', @now),
    (@tenant_id, 'VEH-202', 'COMPANY_OWNED', 'Toyota', 'Sienna', 2022, 'White', '5TDKRKEC5NS102202',
     'MMT202', 'GA', 6, 1, 'HYBRID', 'INS-MM-88421', DATE_ADD(CURRENT_DATE, INTERVAL 1 MONTH),
     DATE_ADD(CURRENT_DATE, INTERVAL 5 MONTH), DATE_SUB(CURRENT_DATE, INTERVAL 5 DAY), 46210, NULL,
     'Held for overdue inspection.', 'MAINTENANCE', 'demo-seed', @now, 'demo-seed', @now)
ON DUPLICATE KEY UPDATE status = VALUES(status), assigned_driver_id = VALUES(assigned_driver_id), updated_at = @now;
SET @vehicle_id = (SELECT id FROM vehicles WHERE tenant_id = @tenant_id AND vehicle_code = 'VEH-201');
SET @maintenance_vehicle_id = (SELECT id FROM vehicles WHERE tenant_id = @tenant_id AND vehicle_code = 'VEH-202');
INSERT IGNORE INTO vehicle_service_types (vehicle_id, service_type) VALUES (@vehicle_id, 'NEMT'), (@vehicle_id, 'ADA_PARATRANSIT');

INSERT INTO riders
    (tenant_id, rider_code, rider_type, first_name, last_name, date_of_birth, gender, email, primary_phone,
     home_address_line1, city, state, zip_code, country, default_pickup_address, default_dropoff_address,
     pickup_notes, wheelchair_required, escort_required, special_instructions, emergency_contact_name,
     emergency_contact_phone, emergency_contact_relationship, organization_id, notes, status,
     created_by, created_at, updated_by, updated_at)
VALUES
    (@tenant_id, 'RDR-3001', 'ELDERLY', 'Evelyn', 'Carter', '1948-11-23', 'FEMALE', 'rider@demo.test',
     '404-555-0121', '155 Piedmont Avenue NE', 'Atlanta', 'GA', '30308', 'United States',
     '155 Piedmont Avenue NE, Atlanta, GA 30308', '880 Peachtree Street NE, Atlanta, GA 30309',
     'Call on arrival; use the north lobby.', TRUE, FALSE, 'Wheelchair lift and securement required.',
     'Olivia Carter', '404-555-0122', 'Daughter', @organization_id, 'Dialysis Monday, Wednesday, Friday.',
     'ACTIVE', 'demo-seed', @now, 'demo-seed', @now),
    (@tenant_id, 'RDR-3002', 'NEMT', 'Robert', 'Miller', '1962-03-08', 'MALE', 'robert.rider@demo.test',
     '404-555-0123', '75 Boulevard NE', 'Atlanta', 'GA', '30312', 'United States',
     '75 Boulevard NE, Atlanta, GA 30312', '550 Peachtree Street NE, Atlanta, GA 30308',
     'Front porch pickup.', FALSE, TRUE, 'Rider travels with a care escort.', 'Susan Miller', '404-555-0124',
     'Spouse', NULL, 'Recurring physical therapy transport.', 'ACTIVE', 'demo-seed', @now, 'demo-seed', @now)
ON DUPLICATE KEY UPDATE status = VALUES(status), organization_id = VALUES(organization_id), updated_at = @now;
SET @rider_id = (SELECT id FROM riders WHERE tenant_id = @tenant_id AND rider_code = 'RDR-3001');
SET @rider_two_id = (SELECT id FROM riders WHERE tenant_id = @tenant_id AND rider_code = 'RDR-3002');
INSERT IGNORE INTO rider_mobility_needs (rider_id, mobility_need) VALUES (@rider_id, 'WHEELCHAIR');

INSERT INTO guardians
    (tenant_id, first_name, last_name, relation_to_rider_default, email, phone, address_line1, city, state,
     zip_code, country, preferred_communication_method, billing_contact, authorized_for_pickup, notes, status,
     created_by, created_at, updated_by, updated_at)
SELECT @tenant_id, 'Olivia', 'Carter', 'CHILD', 'guardian@demo.test', '404-555-0122',
       '220 Juniper Street NE', 'Atlanta', 'GA', '30308', 'United States', 'SMS', TRUE, TRUE,
       'Primary family and billing contact.', 'ACTIVE', 'demo-seed', @now, 'demo-seed', @now
WHERE NOT EXISTS (SELECT 1 FROM guardians WHERE tenant_id = @tenant_id AND email = 'guardian@demo.test');
SET @guardian_id = (SELECT id FROM guardians WHERE tenant_id = @tenant_id AND email = 'guardian@demo.test' LIMIT 1);
INSERT IGNORE INTO rider_guardians
    (tenant_id, rider_id, guardian_id, relationship_type, primary_guardian, authorized_for_pickup,
     billing_contact, notes, status, created_by, created_at, updated_by, updated_at)
VALUES (@tenant_id, @rider_id, @guardian_id, 'CHILD', TRUE, TRUE, TRUE, 'Primary contact.', 'ACTIVE', 'demo-seed', @now, 'demo-seed', @now);

INSERT IGNORE INTO portal_user_scopes
    (tenant_id, app_user_id, portal_subject_type, portal_subject_id, created_by, created_at, updated_by, updated_at)
SELECT @tenant_id, id, 'DRIVER', @driver_id, 'demo-seed', @now, 'demo-seed', @now FROM app_users WHERE email = 'driver@demo.test';
INSERT IGNORE INTO portal_user_scopes
    (tenant_id, app_user_id, portal_subject_type, portal_subject_id, created_by, created_at, updated_by, updated_at)
SELECT @tenant_id, id, 'RIDER', @rider_id, 'demo-seed', @now, 'demo-seed', @now FROM app_users WHERE email = 'rider@demo.test';
INSERT IGNORE INTO portal_user_scopes
    (tenant_id, app_user_id, portal_subject_type, portal_subject_id, created_by, created_at, updated_by, updated_at)
SELECT @tenant_id, id, 'GUARDIAN', @guardian_id, 'demo-seed', @now, 'demo-seed', @now FROM app_users WHERE email = 'guardian@demo.test';
INSERT IGNORE INTO portal_user_scopes
    (tenant_id, app_user_id, portal_subject_type, portal_subject_id, created_by, created_at, updated_by, updated_at)
SELECT @tenant_id, id, 'ORGANIZATION_CONTACT', @organization_contact_id, 'demo-seed', @now, 'demo-seed', @now FROM app_users WHERE email = 'organization@demo.test';

INSERT INTO routes
    (tenant_id, route_code, route_name, route_date, service_type, assigned_driver_id, assigned_vehicle_id,
     start_time, end_time, manifest_notes, status, created_by, created_at, updated_by, updated_at)
VALUES
    (@tenant_id, 'ROUTE-AM-01', 'Midtown Medical AM', CURRENT_DATE, 'NEMT', @driver_id, @vehicle_id,
     '07:00:00', '12:30:00', 'Three scheduled pickups; wheelchair vehicle required.', 'IN_PROGRESS',
     'demo-seed', @now, 'demo-seed', @now)
ON DUPLICATE KEY UPDATE route_date = CURRENT_DATE, assigned_driver_id = @driver_id, assigned_vehicle_id = @vehicle_id, status = 'IN_PROGRESS', updated_at = @now;
SET @route_id = (SELECT id FROM routes WHERE tenant_id = @tenant_id AND route_code = 'ROUTE-AM-01');

INSERT INTO rides
    (tenant_id, ride_number, rider_id, guardian_id, organization_id, service_type, trip_type,
     pickup_address_line1, pickup_city, pickup_state, pickup_zip_code, pickup_country,
     dropoff_address_line1, dropoff_city, dropoff_state, dropoff_zip_code, dropoff_country,
     scheduled_pickup_at, scheduled_dropoff_at, wheelchair_required, escort_required, companion_count,
     special_instructions, operational_notes, priority_level, billing_type, driver_id, vehicle_id, route_id,
     status, created_by, created_at, updated_by, updated_at)
VALUES
    (@tenant_id, 'RIDE-TODAY-001', @rider_id, @guardian_id, @organization_id, 'NEMT', 'ROUND_TRIP',
     '155 Piedmont Avenue NE', 'Atlanta', 'GA', '30308', 'United States', '880 Peachtree Street NE',
     'Atlanta', 'GA', '30309', 'United States', DATE_ADD(CURRENT_DATE, INTERVAL 8 HOUR),
     DATE_ADD(CURRENT_DATE, INTERVAL 9 HOUR), TRUE, FALSE, 0, 'Wheelchair lift required.',
     'Driver confirmed by dispatch.', 'HIGH', 'SPONSORED', @driver_id, @vehicle_id, @route_id,
     'PICKED_UP', 'demo-seed', @now, 'demo-seed', @now),
    (@tenant_id, 'RIDE-TODAY-002', @rider_two_id, NULL, NULL, 'GENERAL_TRANSPORT', 'ONE_WAY',
     '75 Boulevard NE', 'Atlanta', 'GA', '30312', 'United States', '550 Peachtree Street NE',
     'Atlanta', 'GA', '30308', 'United States', DATE_ADD(CURRENT_DATE, INTERVAL 11 HOUR),
     DATE_ADD(CURRENT_DATE, INTERVAL 12 HOUR), FALSE, TRUE, 1, 'Escort accompanies rider.',
     'Awaiting vehicle assignment.', 'STANDARD', 'PRIVATE_PAY', NULL, NULL, NULL,
     'SCHEDULED', 'demo-seed', @now, 'demo-seed', @now)
ON DUPLICATE KEY UPDATE scheduled_pickup_at = VALUES(scheduled_pickup_at), scheduled_dropoff_at = VALUES(scheduled_dropoff_at),
    driver_id = VALUES(driver_id), vehicle_id = VALUES(vehicle_id), route_id = VALUES(route_id), status = VALUES(status), updated_at = @now;
SET @ride_id = (SELECT id FROM rides WHERE tenant_id = @tenant_id AND ride_number = 'RIDE-TODAY-001');
INSERT INTO route_stops
    (tenant_id, route_id, ride_id, stop_sequence, planned_pickup_at, planned_dropoff_at, notes, status,
     created_by, created_at, updated_by, updated_at)
VALUES (@tenant_id, @route_id, @ride_id, 1, DATE_ADD(CURRENT_DATE, INTERVAL 8 HOUR),
        DATE_ADD(CURRENT_DATE, INTERVAL 9 HOUR), 'North lobby pickup.', 'ACTIVE', 'demo-seed', @now, 'demo-seed', @now)
ON DUPLICATE KEY UPDATE planned_pickup_at = VALUES(planned_pickup_at), status = VALUES(status), updated_at = @now;

INSERT INTO pricing_rules
    (tenant_id, pricing_rule_code, name, description, pricing_model, bill_to_type, service_type, trip_type,
     amount, currency, effective_start_date, priority_order, notes, status, created_by, created_at, updated_by, updated_at)
VALUES (@tenant_id, 'PRICE-NEMT-BASE', 'NEMT base trip', 'Standard organization-billed NEMT trip rate.',
        'PER_TRIP', 'ORGANIZATION', 'NEMT', 'ROUND_TRIP', 95.00, 'USD', DATE_SUB(CURRENT_DATE, INTERVAL 1 YEAR),
        10, 'Demo rate used by the Peachtree account.', 'ACTIVE', 'demo-seed', @now, 'demo-seed', @now)
ON DUPLICATE KEY UPDATE amount = VALUES(amount), status = 'ACTIVE', updated_at = @now;
SET @pricing_rule_id = (SELECT id FROM pricing_rules WHERE tenant_id = @tenant_id AND pricing_rule_code = 'PRICE-NEMT-BASE');

INSERT INTO invoices
    (tenant_id, invoice_number, bill_to_type, bill_to_id, bill_to_name_snapshot, organization_id, rider_id,
     guardian_id, invoice_date, due_date, billing_period_start, billing_period_end, subtotal, tax_amount,
     discount_amount, total_amount, amount_paid, balance_due, currency, notes, status,
     created_by, created_at, updated_by, updated_at)
VALUES (@tenant_id, 'INV-DEMO-1001', 'ORGANIZATION', @organization_id, 'Peachtree Dialysis Center',
        @organization_id, @rider_id, @guardian_id, DATE_SUB(CURRENT_DATE, INTERVAL 20 DAY),
        DATE_ADD(CURRENT_DATE, INTERVAL 10 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY), CURRENT_DATE,
        380.00, 0.00, 0.00, 380.00, 190.00, 190.00, 'USD', 'Four NEMT service trips.',
        'PARTIALLY_PAID', 'demo-seed', @now, 'demo-seed', @now)
ON DUPLICATE KEY UPDATE amount_paid = 190.00, balance_due = 190.00, status = 'PARTIALLY_PAID', updated_at = @now;
SET @invoice_id = (SELECT id FROM invoices WHERE tenant_id = @tenant_id AND invoice_number = 'INV-DEMO-1001');

INSERT INTO invoice_line_items
    (tenant_id, invoice_id, line_number, description, charge_source_type, source_reference_id, pricing_rule_id,
     quantity, unit_price, line_amount, service_date, service_period_label, notes,
     created_by, created_at, updated_by, updated_at)
VALUES (@tenant_id, @invoice_id, 1, 'NEMT round trips — Evelyn Carter', 'RIDE', @ride_id, @pricing_rule_id,
        4.00, 95.00, 380.00, CURRENT_DATE, 'Current service period', 'Organization contract billing.',
        'demo-seed', @now, 'demo-seed', @now)
ON DUPLICATE KEY UPDATE quantity = 4.00, unit_price = 95.00, line_amount = 380.00, updated_at = @now;

INSERT INTO payments
    (tenant_id, invoice_id, payment_number, payment_date, amount, payment_method, reference_number,
     payer_name, payer_contact, notes, status, created_by, created_at, updated_by, updated_at)
VALUES (@tenant_id, @invoice_id, 'PAY-DEMO-1001', DATE_SUB(CURRENT_DATE, INTERVAL 4 DAY), 190.00, 'ACH',
        'ACH-883104', 'Peachtree Dialysis Center', 'billing@peachtreedialysis.test', 'Partial invoice payment.',
        'APPLIED', 'demo-seed', @now, 'demo-seed', @now)
ON DUPLICATE KEY UPDATE amount = 190.00, status = 'APPLIED', updated_at = @now;

SET @compliance_user_id = (SELECT id FROM app_users WHERE email = 'compliance@demo.test');
SET @tenant_admin_id = (SELECT id FROM app_users WHERE email = 'tenant.admin@demo.test');
INSERT INTO compliance_issues
    (tenant_id, source_key, entity_type, entity_id, entity_code, entity_name_summary, issue_type, severity,
     related_document_type, expiry_date, summary, recommended_action, issue_status,
     created_by, created_at, updated_by, updated_at)
VALUES (@tenant_id, 'DEMO-VEH-202-INSPECTION', 'VEHICLE', @maintenance_vehicle_id, 'VEH-202',
        '2022 Toyota Sienna', 'EXPIRED_DOCUMENT', 'CRITICAL', 'INSPECTION', DATE_SUB(CURRENT_DATE, INTERVAL 5 DAY),
        'Vehicle inspection has expired.', 'Keep vehicle out of service and upload a renewed inspection.', 'OPEN',
        'demo-seed', @now, 'demo-seed', @now)
ON DUPLICATE KEY UPDATE expiry_date = VALUES(expiry_date), issue_status = 'OPEN', updated_at = @now;

INSERT INTO incidents
    (tenant_id, incident_code, incident_type, severity, title, description, reported_at, reported_by_user_id,
     reported_by_name_snapshot, related_ride_id, related_driver_id, related_vehicle_id, related_rider_id,
     assigned_to_user_id, notes, status, created_by, created_at, updated_by, updated_at)
VALUES (@tenant_id, 'INC-DEMO-001', 'OTHER_OPERATIONAL_INCIDENT', 'MEDIUM', 'Medical appointment pickup delayed',
        'Traffic near Midtown delayed the pickup by approximately 18 minutes.', DATE_SUB(@now, INTERVAL 2 HOUR),
        @tenant_admin_id, 'Amelia Brooks', @ride_id, @driver_id, @vehicle_id, @rider_id, @compliance_user_id,
        'Guardian was notified and the clinic accepted the revised arrival time.', 'IN_REVIEW',
        'demo-seed', @now, 'demo-seed', @now)
ON DUPLICATE KEY UPDATE incident_type = 'OTHER_OPERATIONAL_INCIDENT', status = 'IN_REVIEW', updated_at = @now;

INSERT INTO notifications
    (tenant_id, notification_code, recipient_user_id, title, message, notification_type, channel,
     related_entity_type, related_entity_id, delivery_status, read_status, sent_at, status,
     created_by, created_at, updated_by, updated_at)
SELECT @tenant_id, CONCAT('DEMO-DISPATCH-', id), id, 'Unassigned ride needs attention',
       'RIDE-TODAY-002 is scheduled today and still needs a driver and vehicle.', 'RIDE_STATUS_CHANGED', 'IN_APP',
       'RIDE', 'RIDE-TODAY-002', 'SENT', 'UNREAD', @now, 'ACTIVE', 'demo-seed', @now, 'demo-seed', @now
FROM app_users WHERE email IN ('tenant.admin@demo.test', 'dispatcher@demo.test')
ON DUPLICATE KEY UPDATE message = VALUES(message), notification_type = 'RIDE_STATUS_CHANGED',
    delivery_status = 'SENT', read_status = 'UNREAD', updated_at = @now;
