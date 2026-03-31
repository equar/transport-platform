# Architecture Overview

## Context

The platform is a multi-tenant transportation management SaaS foundation designed for incremental delivery. The current repository establishes technical cross-cutting capabilities and deployment structure while deferring business workflows until later implementation batches.

## Architectural Principles

- Multi-tenant by default. Every future business capability must be tenant-aware at the request, service, persistence, and response layers.
- Package by feature on the backend. Shared technical concerns are centralized under `common`, while business capabilities are isolated under `features`.
- Feature-based modules on the frontend. Application runtime concerns live in `src/app`, cross-cutting reusable assets live in `src/shared`, and domain features live in `src/features`.
- Explicit API contracts. Controllers should return the shared response envelope and preserve stable error shapes.
- Incremental delivery. Business modules should be implemented in bounded batches that include schema, API, authorization, and UI slices together.

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
    `-- auth/
        |-- api/
        |-- application/
        `-- domain/
```

### Backend Foundation Responsibilities

- `audit`: JPA auditing, base entity, current auditor resolution.
- `config`: core runtime configuration beans.
- `exception`: canonical error codes and global exception translation.
- `response`: API envelope and pagination contracts.
- `security`: JWT primitives, filter chain, access-denied and unauthenticated responses.
- `tenant`: request tenant resolution and context propagation.

## Frontend Structure

```text
frontend/src
|-- app/
|   |-- layouts/
|   |-- providers/
|   `-- router/
|-- features/
|   |-- auth/
|   `-- dashboard/
`-- shared/
    |-- api/
    |-- components/
    |-- config/
    `-- theme/
```

### Frontend Foundation Responsibilities

- `app`: route composition, provider wiring, application layouts.
- `features/auth`: authentication state, login flow skeleton, route protection.
- `shared`: generic API client, design system primitives, environment handling, theme.

## Multi-Tenant Baseline

- Initial tenant resolution is request-based through the `X-Tenant-Id` header.
- Tenant context is established before application logic runs and cleared at request completion.
- Persistence strategy is intentionally left extensible. The current baseline supports evolving into shared-schema, schema-per-tenant, or database-per-tenant approaches depending on scale and compliance needs.

## Security Baseline

- Stateless JWT authentication.
- Security filter chain configured for API-only usage.
- Health endpoints remain open.
- Auth endpoints exist as skeletons and are intentionally not fully implemented yet.

## Delivery Roadmap

1. Complete auth and identity module.
2. Add tenant onboarding and administration.
3. Add transportation order domain.
4. Add operational modules such as fleet, dispatch, and tracking.
5. Add analytics, reporting, and integrations.
