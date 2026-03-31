# Foundation Requirements

## Delivered In This Foundation

- Monorepo split into backend, frontend, infra, docs, and GitHub automation.
- Backend package-by-feature structure with common technical modules.
- Frontend feature-oriented structure with router, layouts, auth skeleton, and shared platform utilities.
- Docker-based local runtime for MySQL, backend, and frontend.
- Base multi-tenant request context and JWT authentication skeleton.
- Flyway database migration baseline.
- Environment-specific backend profiles for local, dev, and prod.
- Professional starter documentation and CI workflow.

## Explicitly Deferred

- Real authentication workflow and credential management.
- Tenant provisioning lifecycle.
- Business capabilities such as shipments, dispatch, fleet, drivers, billing, or reports.
- Observability and compliance hardening beyond baseline configuration.
- Automated test suites beyond build verification.

## Non-Functional Expectations For Future Batches

- Tenant-safe data access patterns.
- Consistent API error handling.
- Secure-by-default endpoints.
- Zero business logic in infrastructure and configuration layers.
- Clear separation between feature modules and shared technical concerns.
