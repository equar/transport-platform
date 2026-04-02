ALTER TABLE app_users
    ADD COLUMN invitation_send_count INT NOT NULL DEFAULT 0 AFTER last_invitation_sent_at,
    ADD COLUMN last_invitation_delivery_status VARCHAR(30) NULL AFTER invitation_send_count,
    ADD COLUMN last_invitation_failure_message VARCHAR(1000) NULL AFTER last_invitation_delivery_status;

UPDATE app_users
SET invitation_send_count = CASE
        WHEN last_invitation_sent_at IS NULL THEN 0
        ELSE 1
    END,
    last_invitation_delivery_status = CASE
        WHEN last_invitation_sent_at IS NULL THEN NULL
        ELSE 'SENT'
    END
WHERE invitation_send_count = 0
  AND last_invitation_delivery_status IS NULL;