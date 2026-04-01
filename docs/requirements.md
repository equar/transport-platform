# Platform Requirements Snapshot

## Delivered In The Current Repository

- Monorepo structure for backend, frontend, infrastructure, documentation, and CI automation.
- Multi-tenant backend with feature-oriented modules, shared technical infrastructure, JWT-based security, tenant context handling, audit support, and Flyway-managed schema evolution.
- Public SaaS website covering marketing, pricing, FAQ, contact, and company application entry points.
- Authentication and protected-route flows for sign-in, access notices, and password recovery UX.
- Internal administration and operations experience spanning tenant, user, role, rider, driver, vehicle, route, ride, dispatch, compliance, billing, reporting, incidents, notifications, and settings domains.
- Dedicated driver, rider or guardian, and organization portal experiences with scoped navigation and visibility.
- Docker-based local runtime for MySQL, backend, and frontend, plus separate local developer run paths.
- Shared frontend UX primitives for loading, empty, error, layout, and status presentation consistency.
- Environment-specific backend profiles and local or dev Swagger exposure.

## Still Deferred Or Continuing

- Additional production hardening for scale, observability, and deployment automation as operational needs evolve.
- External integrations, downstream workflow wiring, and ecosystem connectivity beyond the currently implemented platform scope.
- Further accessibility, telemetry, and performance optimization work beyond the current baseline.
- Future domain expansion beyond the current public, admin, transportation, billing, compliance, and portal feature set.

## Ongoing Non-Functional Requirements

- Tenant-safe data access patterns at every backend boundary.
- Consistent API envelopes, validation, and error handling.
- Secure-by-default endpoints with backend-enforced authorization.
- Clear separation between shared technical concerns and feature-owned business logic.
- Role-aware frontend navigation that remains aligned with backend authorization and tenant scope.
