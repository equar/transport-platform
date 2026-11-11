ALTER TABLE company_applications
    ADD COLUMN email_verified_at DATETIME(6) NULL,
    ADD COLUMN verification_token_hash VARCHAR(64) NULL,
    ADD COLUMN verification_expires_at DATETIME(6) NULL,
    ADD COLUMN verification_requested_at DATETIME(6) NULL;

CREATE UNIQUE INDEX uk_application_verification_token ON company_applications (verification_token_hash);

UPDATE company_applications
SET status = 'PENDING_EMAIL_VERIFICATION'
WHERE status IN ('SUBMITTED', 'UNDER_REVIEW');
