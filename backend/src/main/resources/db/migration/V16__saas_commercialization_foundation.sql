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