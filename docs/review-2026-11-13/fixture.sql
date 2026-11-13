-- DISPOSABLE LOCAL REVIEW DATABASE ONLY. Synthetic compliance metadata, not real verification.
INSERT INTO tenant_transport_compliance
(tenant_id,operating_scope,verification_status,primary_state,insurance_verified,insurance_expires_on,
student_safeguarding_policy_verified,ferpa_data_agreement_verified,employee_transport_consent_policy_verified,
accessibility_policy_verified,created_by,created_at,updated_by,updated_at)
VALUES ('demo-metro-mobility-000000000001','STUDENT_AND_WORKFORCE','VERIFIED','GA',1,'2030-12-31',1,1,1,1,
'isolated-review-fixture',NOW(),'isolated-review-fixture',NOW())
ON DUPLICATE KEY UPDATE operating_scope='STUDENT_AND_WORKFORCE', verification_status='VERIFIED', insurance_verified=1,
insurance_expires_on='2030-12-31';
INSERT INTO driver_documents
(tenant_id,driver_id,document_type,file_name,expiry_date,verification_status,status,uploaded_by,uploaded_at,created_by,created_at,updated_by,updated_at)
SELECT 'demo-metro-mobility-000000000001',1,t.kind,'synthetic-review-document','2030-12-31','VERIFIED','ACTIVE',
'isolated-review-fixture',NOW(),'isolated-review-fixture',NOW(),'isolated-review-fixture',NOW()
FROM (SELECT 'DRIVER_LICENSE' kind UNION ALL SELECT 'BACKGROUND_CHECK' UNION ALL SELECT 'DRUG_TEST' UNION ALL SELECT 'CONTRACT_AGREEMENT') t;
INSERT INTO vehicle_documents
(tenant_id,vehicle_id,document_type,file_name,expiry_date,verification_status,status,uploaded_by,uploaded_at,created_by,created_at,updated_by,updated_at)
SELECT 'demo-metro-mobility-000000000001',1,t.kind,'synthetic-review-document','2030-12-31','VERIFIED','ACTIVE',
'isolated-review-fixture',NOW(),'isolated-review-fixture',NOW(),'isolated-review-fixture',NOW()
FROM (SELECT 'VEHICLE_REGISTRATION' kind UNION ALL SELECT 'VEHICLE_INSURANCE' UNION ALL SELECT 'VEHICLE_INSPECTION') t;
