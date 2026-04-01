---
applyTo: "backend/src/main/java/**/*.java,backend/src/test/java/**/*.java,frontend/src/features/auth/**/*.{ts,tsx},frontend/src/shared/api/**/*.ts,frontend/src/app/router/**/*.tsx,frontend/src/features/driver-portal/**/*.{ts,tsx},frontend/src/features/rider-guardian-portal/**/*.{ts,tsx},frontend/src/features/organization-portal/**/*.{ts,tsx}"
description: "Review multi-tenant isolation, authorization, scoped data access, backend validation, auth flows, router access control, and portal data boundaries."
---

# Multi-Tenant And Security Review

## Review Goals

Review changes for:

- Tenant isolation
- Role-based authorization
- Portal-scoped visibility
- Auth and session correctness
- Backend enforcement of sensitive operations

## Backend Tenant Review

Ensure:

- Tenant context is resolved from the authenticated user or security context
- Tenant-scoped queries include tenant filtering
- Service methods validate tenant ownership before returning or mutating data
- Controllers do not accept tenant identity as trusted client input

Never:

- Return cross-tenant data
- Bypass tenant checks because a route is frontend-protected
- Expose data purely on the basis of guessed identifiers

## Backend Security Review

Ensure:

- Role-based access control is explicit and appropriate
- Sensitive operations fail closed
- Resource lookups validate both existence and access rights
- Error handling does not leak sensitive implementation details

When reviewing portal APIs, confirm the backend enforces scope even if the frontend already hides unavailable routes.

## Frontend Auth Review

Ensure:

- Route protection aligns with backend authorization rules
- Post-login redirects respect the user’s actual accessible scope
- Invalid access and expired session flows are handled intentionally
- Shared API client behavior for `401` and `403` responses is consistent and user-safe

Never rely on frontend route visibility as the only security mechanism.

## Portal Scope Review

For driver, rider, guardian, and organization experiences, ensure:

- Users see only records in their allowed scope
- Navigation does not advertise inaccessible areas
- Detail pages do not assume access based on route shape alone
- Empty, unauthorized, and expired-session states are handled cleanly

## Data Exposure Review

Check for:

- Unnecessary internal IDs in API contracts or UI surfaces
- Overly broad payloads for portal pages
- Sensitive fields included without a real product need

Prefer the smallest response model needed for the feature.

## Test Expectations

Add or update tests when behavior changes around:

- Tenant isolation
- Role checks
- Resource scoping
- Unauthorized or forbidden access
- Session invalidation flows when applicable

## Production Readiness

Ensure:

- Security-sensitive logic is enforced on the backend
- Frontend access logic is clear and maintainable
- Auth and authorization flows remain aligned across router, API client, and backend enforcement
