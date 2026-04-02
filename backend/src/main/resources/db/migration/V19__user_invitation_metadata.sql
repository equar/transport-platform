ALTER TABLE app_users
    ADD COLUMN last_invitation_sent_at DATETIME(6) NULL AFTER last_login_at;