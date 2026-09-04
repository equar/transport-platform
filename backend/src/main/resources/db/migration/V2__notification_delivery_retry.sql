ALTER TABLE notifications
    ADD COLUMN delivery_attempt_count INT NOT NULL DEFAULT 0,
    ADD COLUMN next_delivery_attempt_at DATETIME(6) NULL;

CREATE INDEX idx_notifications_delivery_retry
    ON notifications (channel, delivery_status, next_delivery_attempt_at);