ALTER TABLE subscription_plans
    ADD CONSTRAINT ck_plan_capacity_nonnegative CHECK (
        max_users >= 0 AND max_drivers >= 0 AND max_vehicles >= 0
        AND max_riders >= 0 AND max_organizations >= 0);
CREATE INDEX idx_subscription_effective_access ON tenant_subscriptions (tenant_id, effective_start_date, id);
CREATE INDEX idx_subscription_overdue_access ON platform_subscription_invoices (tenant_id, status, due_date);
