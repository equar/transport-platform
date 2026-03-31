ALTER TABLE app_users
    ADD COLUMN first_name VARCHAR(100) NULL AFTER email,
    ADD COLUMN last_name VARCHAR(100) NULL AFTER first_name,
    ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' AFTER password_hash,
    ADD COLUMN last_login_at DATETIME(6) NULL AFTER status;

UPDATE app_users
SET status = CASE
    WHEN locked = TRUE THEN 'SUSPENDED'
    WHEN enabled = TRUE THEN 'ACTIVE'
    ELSE 'INVITED'
END;

UPDATE app_users
SET first_name = COALESCE(first_name, CASE WHEN tenant_id IS NULL THEN 'Platform' ELSE 'Team' END),
    last_name = COALESCE(last_name, CASE WHEN tenant_id IS NULL THEN 'Administrator' ELSE 'Member' END)
WHERE first_name IS NULL OR last_name IS NULL;

CREATE INDEX idx_app_users_status ON app_users (status);