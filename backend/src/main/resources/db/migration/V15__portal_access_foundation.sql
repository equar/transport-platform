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