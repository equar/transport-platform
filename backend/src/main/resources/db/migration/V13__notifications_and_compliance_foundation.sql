CREATE TABLE notification_templates (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    template_code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    event_type VARCHAR(60) NOT NULL,
    channel VARCHAR(30) NOT NULL,
    subject_template VARCHAR(255) NULL,
    title_template VARCHAR(255) NULL,
    body_template VARCHAR(4000) NOT NULL,
    description VARCHAR(2000) NULL,
    is_default BIT NOT NULL,
    status VARCHAR(30) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
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