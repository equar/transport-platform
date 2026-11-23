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

## Operational boundaries and reporting policy

Billing is USD-only. Invoice, pricing and company-settings APIs reject other currencies; database checks reject historical non-USD rows rather than relabel their amounts. Payments and refunds are manual records of funds already moved outside this application. Recording a receipt does not charge a card or initiate a transfer. Non-cash receipts require their original receipt/transaction identifier. Cash entries can include a receipt or voucher identifier. Original external transaction identifiers cannot be recorded twice against the same invoice; a transfer allocated to different invoices can retain its original identifier.

Sign-in throttling combines a shared per-account budget of 20 attempts per five minutes with a per-IP budget of 100 per minute (configurable through `APP_SECURITY_LOGIN_IP_MAX_REQUESTS`). The larger IP budget accommodates staff sharing a network; account keys are hashed before persistence.

Platform administrators manage transport companies and platform subscription billing. Tenant administrators manage company operations and permissions. Billing administrators can access invoice/payment reports; compliance administrators can access compliance/incident reports. Other report categories remain restricted to tenant administrators. Rider, guardian and driver accounts each have one dedicated mobile role; staff use separate accounts. Database composite foreign keys supplement service-level tenant checks on transport, document, billing and tracking relationships. Audit actors and platform support identities remain governed by explicit service policies.

Arrival confirmation normally comes from the rider or authorized guardian; a signature is optional. If app confirmation is unavailable, only a tenant administrator may approve a verified arrival exception after all three location milestones have been applied. The exception requires a reason, is recorded under the administrator's identity, and notifies trip participants. It never manufactures a passenger signature.

Trip queries refresh every 15 seconds while the screen is focused and the app is active. Location history remains bounded. Dispatch reserves a default 15-minute turnaround, configured with `app.dispatch.turnaround-minutes`. When verified stop coordinates exist, transfer planning adds an estimated distance allowance using a 30% road-distance factor and `app.dispatch.transfer-average-mph` (default 25). This is not a traffic-aware road ETA; dispatch must review routes without verified coordinates and unusual road conditions.

Invoice totals exclude draft and void invoices. Aging uses the tenant service date: current, 1–30, 31–60, 61–90 and over 90 days overdue. Actual trip times come only from consumed milestone evidence. On-time performance means no more than five minutes late, measured against the tenant-timezone schedule; the denominator includes only records with both the relevant schedule and evidence. Missing evidence is reported as unavailable, never zero. Distance and duration count passenger trip legs, so pooled legs can overlap; these metrics must not be presented as vehicle mileage or fleet utilization. Deadhead mileage, actual driver payouts, processor settlement and regulatory submissions require their own source records and are not inferred from passenger evidence or manual receipts.

Interactive reports remain limited to 5,000 rows. Background CSV exports read 1,000-row keyset pages bounded by the tenant’s maximum record ID when the job starts, recheck owner/role/tenant access per page, and retain the existing 100,000-row/4 MB output limits. USD and tenant-boundary migrations are resumable and deliberately reject inconsistent historical financial data; resolve any flagged records explicitly before deployment rather than rewriting their ownership or currency automatically.
