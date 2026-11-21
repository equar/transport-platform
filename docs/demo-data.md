# Development demo data

Demo data is disabled by default. For a disposable development database, explicitly set `APP_DEV_SEED_ENABLED=true` with the `local` or `dev` Spring profile to load a repeatable, idempotent Metro Mobility dataset. The flag is rejected in production or without a development profile. Supply a private `APP_SECURITY_JWT_SECRET`; no signing-secret fallback is provided.

All demo accounts use the password `Password123`. Driver, rider and guardian
accounts sign in only through the mobile app, not the web workspace.

| Role | Email |
| --- | --- |
| Platform administrator | `platform.admin@demo.test` |
| Tenant administrator | `tenant.admin@demo.test` |
| Dispatcher | `dispatcher@demo.test` |
| Billing administrator | `billing@demo.test` |
| Compliance administrator | `compliance@demo.test` |
| Driver (mobile only) | `driver@demo.test` |
| Rider (mobile only) | `rider@demo.test` |
| Guardian (mobile only) | `guardian@demo.test` |
| Organization portal | `organization@demo.test` |
| Read-only viewer | `viewer@demo.test` |

The seed also creates a tenant, an organization and contact, two drivers, two vehicles, two riders, a guardian relationship, portal scopes, a current route, two rides, pricing, a partially paid invoice and payment, a critical compliance issue, an active incident, and unread dispatch notifications.

Flyway runs `R__realistic_demo_data.sql` after the versioned schema migrations. Restart the backend with the `local` or `dev` profile and `APP_DEV_SEED_ENABLED=true` to install or refresh the data. Never enable this flag on a shared or real-data database.
