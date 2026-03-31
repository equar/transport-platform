# Frontend Foundation

React and TypeScript frontend foundation for the transportation management SaaS platform.

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
|-- features/  feature-owned modules
`-- shared/    reusable platform UI, theme, API, and config
```

## Local Run

```powershell
npm ci
npm run typecheck
npm run dev
```

## Environment Variables

```text
VITE_API_BASE_URL=/api
```

## Production Notes

- The frontend expects the backend to be served behind `/api`.
- Route access is role-aware and tenant-scoped routes require a tenant-bound session.
- Feature-gated tenant navigation now fails closed until runtime capabilities load successfully.

## Foundation Scope

- Router and route composition.
- Protected route and auth session shell.
- Shared Material UI theme and layout primitives.
- Centralized API client.
- Starter pages for login and authenticated dashboard shell.

## Deferred Work

- Real identity retrieval and token refresh UX.
- Feature-level domain pages and forms.
- Notifications, telemetry, and accessibility hardening beyond the baseline.
