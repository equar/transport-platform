# Architecture Overview

## Context

The platform is a multi-tenant transportation management SaaS application that combines a public website, a role-aware internal operations application, and dedicated external portals. The current repository already contains implemented business domains and shared platform infrastructure rather than only a technical foundation.

## Architectural Principles

- Multi-tenant by default. Tenant awareness must be preserved across request processing, service logic, persistence, API responses, and portal scoping.
- Package by feature on the backend. Shared technical concerns are centralized under `common`, while business capabilities are isolated under `features`.
- Feature-based modules on the frontend. Application runtime concerns live in `src/app`, cross-cutting reusable assets live in `src/shared`, and domain capabilities live in `src/features`.
- Explicit API contracts. Controllers should return the shared response envelope and preserve stable error shapes.
- Role-aware application surfaces. Public website, authentication, internal administration, and portal experiences are intentionally separated through routing, layouts, and authorization.

## Backend Structure

```text
backend/src/main/java/com/transportplatform/tms
|-- common/
|   |-- audit/
|   |-- config/
|   |-- exception/
|   |-- response/
|   |-- security/
|   `-- tenant/
`-- features/
    |-- auth/
    |-- tenant/
    |-- user/
    |-- role/
    |-- platform/
    |-- companyapplication/
    |-- rider/
    |-- driver/
    |-- vehicle/
    |-- route/
    |-- ride/
    |-- dispatch/
    |-- compliance/
    |-- billing/
    |-- report/
    |-- incident/
    |-- notification/
    |-- runtime/
    |-- saas/
    |-- settings/
    |-- driverportal/
    |-- riderguardianportal/
    `-- organizationportal/
```

### Backend Responsibilities

- `audit`: JPA auditing, base entity, current auditor resolution.
- `config`: core runtime configuration beans.
- `exception`: canonical error codes and global exception translation.
- `response`: API envelope and pagination contracts.
- `security`: JWT primitives, filter chain, access-denied and unauthenticated responses.
- `tenant`: request tenant resolution and context propagation.
- domain features: tenant-safe transportation, billing, compliance, reporting, notification, onboarding, and portal-scoped business flows.

## Frontend Structure

```text
frontend/src
|-- app/
|   |-- layouts/
|   |-- providers/
|   |-- pages/
|   `-- router/
|-- features/
|   |-- public/
|   |-- auth/
|   |-- dashboard/
|   |-- dispatch/
|   |-- rides/
|   |-- drivers/
|   |-- vehicles/
|   |-- billing/
|   |-- compliance/
|   |-- reports/
|   |-- notifications/
|   |-- driver-portal/
|   |-- rider-guardian-portal/
|   `-- organization-portal/
`-- shared/
    |-- api/
    |-- components/
    |-- config/
    `-- theme/
```

### Frontend Responsibilities

- `app`: route composition, provider wiring, application layouts, not-found and top-level application pages.
- `features/public`: public website content and lead-in journeys.
- `features/auth`: authentication state, sign-in and recovery flows, access protection, and post-login routing.
- `features/*`: internal admin and operational modules plus portal-specific experiences.
- `shared`: generic API client, design system primitives, environment handling, and theme.

## Application Surfaces

- Public site: unauthenticated routes for marketing, pricing, FAQ, support, and onboarding entry points.
- Auth surface: login, password recovery, unauthorized, and route-guard transitions.
- Internal app shell: authenticated experience for platform and company users across administration and operations.
- Driver portal: scoped ride, route, compliance, notification, and profile views.
- Rider or guardian portal: scoped ride, billing, payment, notification, and profile views.
- Organization portal: scoped roster, contacts, contracts, rides, billing, and profile views.

## Multi-Tenant Baseline

- Tenant context is resolved during request handling and applied before business logic executes.
- Tenant-aware access must be enforced across service methods and repository queries.
- Frontend route visibility is role-aware, but backend authorization and tenant scoping remain the source of truth.
- The implementation remains compatible with evolving persistence and deployment strategies as scale and compliance requirements grow.

## Security And Session Model

- JWT-backed authentication is used for API access.
- Security filters protect API routes while allowing required public and health endpoints.
- Authentication state on the frontend determines route selection and portal entry, but backend authorization enforces actual access.
- Swagger and OpenAPI exposure are restricted to local and dev profiles.

## Delivery Approach

- Backend and frontend capabilities are delivered in feature-oriented slices that include schema, API, authorization, and UI together.
- Shared primitives such as loading states, page cards, status chips, and protected route handling are reused across public, admin, and portal surfaces to keep the platform coherent.
- Future work should extend the current architecture without collapsing portal-specific boundaries or weakening tenant-safe access rules.
