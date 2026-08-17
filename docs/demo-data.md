# Development demo data

The `local` and `dev` Spring profiles load a repeatable, idempotent dataset for a realistic Metro Mobility operation. Production does not load this data.

All demo accounts use the password `Password123`.

| Role | Email |
| --- | --- |
| Platform administrator | `platform.admin@demo.test` |
| Tenant administrator | `tenant.admin@demo.test` |
| Dispatcher | `dispatcher@demo.test` |
| Billing administrator | `billing@demo.test` |
| Compliance administrator | `compliance@demo.test` |
| Driver portal | `driver@demo.test` |
| Rider portal | `rider@demo.test` |
| Guardian portal | `guardian@demo.test` |
| Organization portal | `organization@demo.test` |
| Read-only viewer | `viewer@demo.test` |

The seed also creates a tenant, an organization and contact, two drivers, two vehicles, two riders, a guardian relationship, portal scopes, a current route, two rides, pricing, a partially paid invoice and payment, a critical compliance issue, an active incident, and unread dispatch notifications.

Flyway runs `R__realistic_demo_data.sql` after the versioned schema migrations. Restart the backend with the `local` or `dev` profile to install or refresh the data.
