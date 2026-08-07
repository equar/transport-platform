ALTER TABLE app_users
    DROP INDEX uk_app_users_tenant_email,
    ADD CONSTRAINT uk_app_users_email UNIQUE (email);
