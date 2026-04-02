INSERT INTO notification_templates (
    tenant_id,
    template_code,
    name,
    event_type,
    channel,
    subject_template,
    title_template,
    body_template,
    description,
    is_default,
    status,
    created_by,
    created_at,
    updated_by,
    updated_at
)
SELECT
    t.id,
    CONCAT('NTM-INV-', UPPER(SUBSTRING(REPLACE(t.id, '-', ''), 1, 8))),
    'Default user invitation email',
    'USER_INVITATION',
    'EMAIL',
    'Set up your workspace account',
    'Complete your account setup',
    'Hello {{fullName}},\n\nYour workspace account is ready. Use this secure link to choose your password and activate access:\n{{activationUrl}}\n\nIf you did not expect this invitation, you can ignore this email.',
    'Default email template used for tenant user invitation and onboarding links.',
    b'1',
    'ACTIVE',
    'system',
    UTC_TIMESTAMP(6),
    'system',
    UTC_TIMESTAMP(6)
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1
    FROM notification_templates nt
    WHERE nt.tenant_id = t.id
      AND nt.event_type = 'USER_INVITATION'
      AND nt.channel = 'EMAIL'
);