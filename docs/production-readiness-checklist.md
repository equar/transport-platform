# Production Readiness Checklist

Use this checklist for every release candidate. A release is approved only when every applicable P0 item is complete, all remaining P1 items have written acceptance from the release owner, and the review report is complete.

## Review Metadata

- Release version:
- Commit SHA:
- Environment reviewed:
- Release owner:
- Review date:
- Reviewers:

## Severity And Decision

| Severity | Meaning | Release rule |
| --- | --- | --- |
| P0 | Security, safety, data loss, tenant isolation, or service availability risk | Must be resolved before release |
| P1 | Significant workflow, reliability, or supportability risk | Must be resolved or explicitly accepted |
| P2 | Important improvement with a practical workaround | Schedule and track |

## Shared Release Gates

- [ ] Scope, commit SHA, configuration changes, database changes, and rollback procedure are documented.
- [ ] No secrets, access tokens, password-reset links, or sensitive rider data are logged or committed.
- [ ] Production configuration uses approved values and does not enable test or development behavior.
- [ ] The API contract and error response changes have been reviewed by affected web and mobile clients.
- [ ] Every sensitive mutation has server-side authorization, tenant scope validation, validation, audit evidence, and a defined failure response.
- [ ] All P0 findings from the previous report are closed and P1 acceptances are still valid.

## Backend Gates

- [ ] Login and refresh token issuance verify active user status, assigned roles, account lock status, and active tenant status.
- [ ] Password changes, resets, role removal, suspension, and tenant deactivation invalidate affected refresh sessions.
- [ ] Cross-tenant access is denied for direct identifier, search, export, download, and mutation paths.
- [ ] Ride, dispatch, invoice, payment, vehicle, and compliance transitions verify current state and caller role.
- [ ] Externally retried or money-impacting mutations accept idempotency keys and return a stable result for replays.
- [ ] Concurrent updates to ride assignment/status, driver/vehicle availability, invoices, and payments return a clear conflict rather than silently overwriting data.
- [ ] Database migrations are forward-only, independently reviewed, and validated against an empty database and a representative staged database.
- [ ] Unit tests and MySQL-backed integration tests cover authorization, tenant isolation, token/session invalidation, transitions, idempotency, and conflict behavior.
- [ ] Correlation IDs appear in request logs and are propagated to asynchronous work.
- [ ] Health, readiness, error rate, request latency, database connectivity, and background delivery failures are observable through private operational tooling.

## Role Scenario Gates

### Platform Administrator

- [ ] Create, activate, suspend, and review a tenant without assigning tenant context from the client.
- [ ] Manage plans, feature access, and global users with an audit trail.
- [ ] Review platform-wide operational errors without exposing cross-tenant personal data unnecessarily.

### Tenant Administrator And Staff

- [ ] Manage drivers, riders, vehicles, routes, users, and operational configuration only within the current tenant.
- [ ] Dispatcher can assign, monitor, and resolve ride exceptions with an explicit current status and next valid action.
- [ ] Billing staff can create, collect, void, and reconcile financial records without duplicate charging.
- [ ] Compliance staff can identify expiring or invalid documents and complete the remediation workflow.

### Driver

- [ ] Driver sees only assigned rides, routes, profile, compliance obligations, and current vehicle assignment.
- [ ] Driver can complete only valid trip transitions and receives a clear result when an action is queued, synchronized, rejected, or conflicted.
- [ ] Offline trip actions replay safely with idempotency and ownership checks after connectivity returns.
- [ ] Driver can submit required compliance documents from a phone and see their review state.

### Rider

- [ ] Rider can view accurate profile data, upcoming ride state, trip details, and allowed cancellation options.
- [ ] Rider can create a booking without duplicate submission and receives a comprehensible validation or availability error.
- [ ] Rider receives timely, privacy-safe status updates and can access support during a service exception.

### Guardian

- [ ] Guardian sees only authorized linked riders and their rides.
- [ ] Guardian can request or manage rides only for an authorized linked rider.
- [ ] Guardian receives clear late-ride and ride-exception updates with a support path.

### Organization User

- [ ] Organization user can manage only their authorized roster, bookings, contracts, and billing records.
- [ ] Bulk operations validate every affected record, report partial failures, and retain an audit trail.

## Web Experience Gates

- [ ] Every route is protected by role and feature checks; backend permissions remain authoritative.
- [ ] Each page has loading, empty, unavailable, unauthorized, error, retry, and mutation-pending states where applicable.
- [ ] Primary operational actions are visible without using large decorative banners or competing calls to action.
- [ ] Tables, filters, forms, and dialogs remain usable at narrow browser widths and desktop widths.
- [ ] Destructive actions require clear confirmation; buttons disable while requests are in progress.
- [ ] Conflict and idempotency responses tell the operator what happened and how to continue.
- [ ] Dialog focus, keyboard dismissal, visible labels, and non-color status cues work for custom interactions.
- [ ] Role-critical browser tests cover platform admin, dispatcher, driver portal, rider/guardian portal, and organization portal scenarios.

## Mobile Experience Gates

- [ ] Validate at least one small and one large iOS phone and Android phone. Tablet behavior is out of scope.
- [ ] Phone navigation is role-specific, touch targets are reliable, and trip actions remain available without visual crowding.
- [ ] Mobile credentials use secure device storage in production; insecure simulator fallback is disabled in release builds.
- [ ] Foreground return validates or refreshes the session, and concurrent refresh/logout actions cannot corrupt session state.
- [ ] Push permission denial, token registration failure, deep-link validation, and sign-out token cleanup have clear recovery behavior.
- [ ] Offline mutation replay uses bounded retry, backoff, idempotency, ownership validation, and visible queued/conflict state.
- [ ] Driver status changes, rider booking/cancellation, guardian tracking, and notification deep links have device smoke-test evidence.
- [ ] Mobile unit tests cover session, API refresh/retry, offline queue, deep links, and role routing.

## Deployment And Recovery Gates

- [ ] Staging deployment completed from the approved artifact and passed readiness checks.
- [ ] A full scripted ride journey produced expected logs, metrics, audit records, and notifications.
- [ ] Background notification failures retry safely and appear in operational monitoring.
- [ ] The deployment can roll back to the previous application artifact without a destructive database rollback.
- [ ] The host runs with least privilege, protected filesystem/device settings, restart policy, and explicit writable paths.
- [ ] Mobile release builds are signed, installed from TestFlight/Play internal testing, and tested against the staging API.

## Approval

- Release owner decision: `APPROVED` / `APPROVED WITH P1 ACCEPTANCE` / `REJECTED`
- Accepted risks and expiry date:
- Approver name and date: