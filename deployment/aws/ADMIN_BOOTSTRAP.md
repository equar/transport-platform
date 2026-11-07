# System administrator bootstrap

Transport follows Bingo's deployment bootstrap pattern for these two identities:

- `apps@bakaroo.com`
- `equarhishe@gmail.com`

Each new identity receives the exclusive `ROLE_PLATFORM_ADMIN` role with no tenant. This is the system/super administrator role; it is separate from a tenant administrator.

## Deployment configuration

| Setting | Value |
| --- | --- |
| `APP_BOOTSTRAP_PLATFORM_ADMIN_EMAIL_ENABLED` | `true` in the deployment workflow; disabled by default outside it |
| `APP_BOOTSTRAP_PLATFORM_ADMIN_EMAILS` | `apps@bakaroo.com,equarhishe@gmail.com` |
| `APP_BOOTSTRAP_PLATFORM_ADMIN_ENABLED` | `false` (legacy single-account mode) |
| `APP_EMAIL_ENABLED` | `true` |
| `APP_EMAIL_PROVIDER` | `microsoft-graph` |

Configure `APP_EMAIL_FROM` and the existing Microsoft Graph client/tenant ID and secret. Logging-only delivery is rejected. No shared or hardcoded bootstrap password is needed. Both bootstrap modes cannot be enabled together. Existing single-account configuration remains available for backward compatibility.

After Flyway migration V10, the production startup runner validates the entire email list and creates each missing identity in a separate transaction. Each account gets a distinct cryptographically random, readable temporary password, stored only as a BCrypt hash and emailed only to that account. Sign in at **https://admin.transport.bakaroo.com/login**, within **24 hours**, then choose a new password. The current recovery flow can replace an expired password.

Existing identities are skipped without changing passwords, tenant, role, status, or sending another email. An existing non-administrator is never promoted. Any unrelated existing system administrators are retained; this bootstrap provisions the two named accounts rather than deleting other access.

Delivery failure rolls back that account and fails startup, allowing a later deployment to retry. Accounts completed earlier are skipped on retry. Email-provider acceptance is not proof of inbox delivery: check junk folders and provider delivery/bounce monitoring. Mail and database commit cannot be atomic; a rare commit failure after sending can produce another email on retry. Concurrent creation is constrained by the unique email index.

The deployment activation waits for application readiness, including startup runners, before accepting a release. Logs contain only created/skipped counts and sanitized provider failures, never temporary passwords. Production SQL/bind logging must remain disabled.

The checks can remain enabled for idempotent future deployments or be disabled with `APP_BOOTSTRAP_PLATFORM_ADMIN_EMAIL_ENABLED=false`. Disabling them does not disable the accounts.

## Verified production rollout

Release `system-admin-bootstrap-1794025453` applied migration V10 and created both named accounts (2 created, 0 skipped). Both were verified active, without a tenant, with only `ROLE_PLATFORM_ADMIN`, a required password change, and an unexpired temporary password. The email provider accepted both sends; inbox delivery was not independently verified. Existing administrators were retained.

Both public API health checks and local application readiness passed. Public Nginx intentionally exposes only the root health endpoint, so readiness is checked on loopback. The backend suite passed 175 tests and deployment checks passed 23 tests. Source/workflow changes remain in the working tree for commit.
