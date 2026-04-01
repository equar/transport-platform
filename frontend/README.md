# Frontend

React and TypeScript frontend for the transportation management platform. The frontend includes the public SaaS website, authentication flows, the internal administration application shell, and dedicated role-aware portals.

## Stack

- React 18
- TypeScript
- Vite
- Material UI
- React Router
- Axios

## Source Structure

```text
src/
|-- app/       providers, router, and layouts
|-- features/  public, admin, and portal feature modules
`-- shared/    reusable platform UI, theme, API, and config
```

## Local Run

```powershell
npm ci
npm run typecheck
npm run dev
```

Production validation:

```powershell
npm run build
```

## Environment Variables

```text
VITE_API_BASE_URL=/api
```

## Production Notes

- The frontend expects the backend to be served behind `/api`.
- Route access is role-aware and tenant-scoped routes require a tenant-bound session.
- Feature-gated tenant navigation now fails closed until runtime capabilities load successfully.
- Public, auth, admin, and portal routes are intentionally separated through dedicated layouts and protected routing rules.

## Current Frontend Scope

- Public website with marketing, pricing, FAQ, contact, and company application entry points.
- Authentication flows for sign-in, access notices, forgot password, reset password, and protected-route handling.
- Internal application shell for platform and company users with navigation across core transportation and administration modules.
- Dedicated driver portal, rider or guardian portal, and organization portal experiences.
- Shared UI primitives for loading, empty, error, page-card, status-chip, and layout consistency across the full app.
- Centralized API client, runtime capability handling, and role-aware routing.

## Route Areas

- Public site routes under `/`
- Auth routes such as `/login`, `/forgot-password`, `/reset-password`, and `/unauthorized`
- Internal authenticated application routes for administration and operations
- Driver portal routes under `/portal/driver`
- Rider or guardian portal routes under `/portal/rider`
- Organization portal routes under `/portal/organization`

## Deferred Work

- Additional performance optimization such as deeper route-level code splitting.
- Further accessibility, telemetry, and deployment-specific UX hardening as the product evolves.
- Future expansion of domain workflows beyond the currently implemented public, admin, and portal experiences.
