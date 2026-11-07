# Transport platform review — November 6, 2026

Implementation follow-up: [delivered changes, verification, and remaining external validation](implementation-2026-11-06.md). Findings below describe the original review baseline.

## Assessment and scope

The platform has broad functional coverage: tenant administration, dispatch, ride lifecycles, recurring rides, compliance, billing, reporting, and separate driver, rider, guardian, and organization experiences. Feature-oriented code, tenant-scoped access services, optimistic ride versioning, driver-action idempotency, refresh sessions, and Flyway migrations provide a useful foundation.

The biggest opportunity is dependable completion of everyday tasks. Prioritize account recovery, private session boundaries, offline trip execution, trustworthy tracking, and faster booking before adding more modules.

This is a source-code and local build/test review. It is not an authenticated browser walkthrough, device usability study, penetration test, production configuration audit, or measured load test. Confirmed code behavior is distinguished below from concurrency risks and proposed product enhancements. Application source was not changed.

## Validation

- Web: `npm run build` passed; `npm test` passed one test file containing four tests.
- Mobile: `npm run typecheck` passed. `npm run test:ci` failed before tests started: jest-expo requires the missing `@react-native/jest-preset` package.
- Backend: ordinary Maven verification initially encountered sandbox restrictions writing Maven metadata. `mvn -o -B verify` compiled and reached tests using cached dependencies. Maven reported 127 tests, zero assertion failures, and four errors: MySQL/Testcontainers integration classes could not initialize because Docker was unavailable. Full backend verification therefore did not pass.
- CI currently builds/verifies the backend and builds/typechecks the web app. It does not run web tests or validate mobile.

## Highest-priority findings

### 1. Password recovery cannot complete for signed-out users — high

Evidence: `backend/.../common/security/SecurityConfig.java` permits login, refresh, logout, and status, but neither `/v1/auth/forgot-password` nor `/v1/auth/reset-password`; all other routes require authentication. `features/auth/api/AuthController.java` defines both recovery endpoints.

Separately, `mobile/app/(auth)/forgot-password.tsx` only sets submitted state and promises an email; it makes no API call. Web `ForgotPasswordPage.tsx` invokes the API but lacks a catch that converts server failures into displayed errors.

Enhancement: allow anonymous access to these two narrowly scoped endpoints, retain generic account-existence responses, apply recovery rate limits, connect mobile recovery, and handle expired/used links and delivery failures. Verify request → email → link → reset → login for a signed-out user on both clients.

### 2. Mobile data cache survives account changes — high privacy risk

Evidence: `mobile/app/_layout.tsx` creates a process-wide QueryClient. Keys such as `['driver-ride', rideId]`, `['guardian-linked-riders']`, and `['rider-payments']` omit tenant/user identity. `mobile/src/auth/AuthContext.tsx` clears credentials and the offline queue at sign-out, but does not cancel or clear query state. Session expiry only sets session to null.

A subsequent user can encounter prior cached data before a new fetch finishes; in-flight requests can also complete across the session boundary. This is a client-side exposure risk inferred from cache behavior, not evidence of a backend tenant authorization bypass.

Enhancement: cancel outstanding requests and clear private cached data on logout, expiry, and account replacement; scope private query keys to tenant and user. Test two same-role accounts using the same device, including overlapping numeric entity IDs.

### 3. Offline driver actions can be lost or stranded — high

Evidence: `mobile/src/stores/offlineQueueStore.ts` drops an item after its third caught failure without retaining a permanent failure record. `drain()` processes a snapshot and finally replaces the entire queue, which can overwrite actions added during processing. There is no single-flight drain guard. Retry times are stored, but the root layout triggers drains on connectivity events rather than scheduling them when due.

The preflight status comparison also runs before replaying the idempotency key: if the server applied a prior request but its response was lost, a retry can be reported as a conflict instead of recovering the original success.

Enhancement: retain failed items in a visible needs-attention state; reconcile by action ID; serialize draining; update queue entries individually; schedule retries while online and when the app resumes. Expose pending/synced/failed status, a safe manual retry, and dispatcher escalation. Test connection loss after server commit, concurrent enqueue/drain, process restart, account change, and retry exhaustion.

### 4. Tracking is tied to the ride detail screen — high operational gap

Evidence: `mobile/app/(driver)/rides/[rideId].tsx` requests foreground location and captures a snapshot every 60 seconds inside a screen effect. Leaving/unmounting the screen removes that timer. There is no app-level background trip tracking implementation in the reviewed source. The same screen always renders an “Online” badge, regardless of connectivity.

Navigation always targets the pickup address, even after pickup; the missing-address fallback can construct `undefined,undefined`.

Enhancement: move active-trip tracking to a lifecycle-aware service, with appropriate platform permissions and an explicit tracking indicator. Show online/offline, last successful sync, location age, and permission state. Navigate to pickup before boarding and drop-off after boarding; handle unavailable addresses. Test device lock, app backgrounding, external navigation, permission denial, and reconnection on physical iOS/Android devices.

### 5. Assignment conflict checks need concurrency protection — high risk to validate

Evidence: `DispatchAssignmentValidationService` reads other active rides and checks time overlap before `DispatchService` saves assignments. `Ride` has optimistic versioning, which protects concurrent edits to the same ride; it does not serialize two different rides claiming the same driver/vehicle. The reviewed assignment path does not lock the shared resource or its reservation window.

Enhancement: make resource reservation atomic using a consistent locking/reservation strategy and an authoritative overlap check inside that boundary. Include travel/turnaround buffers. Add a MySQL concurrency test where two overlapping rides claim one resource simultaneously; exactly one should succeed.

### 6. Assignment editing spans multiple requests — medium/high

Evidence: web `DispatchBoardPage.handleAssignmentSave()` can assign resources and then issue separate driver/vehicle unassignment requests. A later failure leaves part of the edit committed. Vehicle unassignment changes ASSIGNED to SCHEDULED even when a driver remains, while driver assignment alone can promote a ride to ASSIGNED.

Enhancement: offer one atomic replacement endpoint with explicit null semantics and an expected ride version. Define precisely whether driver-only assignment is valid and apply the same rule to assign/unassign flows. Return the resulting full assignment and status.

### 7. Dates do not consistently use the tenant timezone — medium/high

Evidence: dispatch summaries use `LocalDate.now()` and ride schedules use LocalDateTime. Tenant settings contain a timezone, but the reviewed dispatch calculations do not apply it. The web form slices date strings to create datetime inputs; mobile asks users to type local ISO datetime text.

Enhancement: define tenant-local scheduling semantics and use an explicit IANA zone when calculating operational days. Use date/time pickers, display the relevant zone, and define handling for ambiguous/nonexistent daylight-saving times. Test tenant, browser, and server in different zones.

### 8. Demo requests display success without being saved — medium

Evidence: `frontend/src/features/public/pages/ContactPage.tsx` only calls `setSubmitted(true)` on submit; the input fields are not collected or sent anywhere.

Enhancement: persist the inquiry or send it to the configured sales workflow, validate required fields, provide retry on failure, and show success only after acceptance. Measure lead submission success.

## Backend enhancements

1. **Reduce dispatch database work.** `DispatchService` loads all matching rides for exception filtering/summary computation, loads all tenant drivers and vehicles for summary mapping, and evaluates per-ride warnings through additional queries. The map fetches all snapshots for selected rides and reduces them in memory to the latest. Use database aggregation, bounded result sets, batch compliance/conflict checks, and latest-snapshot projections. Measure query count and latency on realistic tenant sizes.
2. **Bound reporting workloads.** `ReportService` materializes matching entities and report rows with findAll. Add mandatory or bounded date windows, database paging/aggregation, and asynchronous large exports with progress, expiry, authorization checks at download, and cancellation.
3. **Make push delivery durable.** `NotificationDispatchService` sends push notifications synchronously from transactional code; email already has a persisted pending/retry path. Extend durable delivery to push so network latency does not delay ride mutations and rollback cannot leave a notification about an uncommitted change. Record provider acceptance, receipts, retries, and invalid token cleanup separately.
4. **Standardize client contracts.** Generate shared API types from OpenAPI and publish status/action metadata to reduce drift between web/mobile lifecycle mappings. Preserve business error codes, field errors, retry guidance, and correlation IDs.
5. **Expand operational observability.** Existing correlation IDs and delivery health are useful. Add metrics for assignment conflicts, unsynced driver actions, stale tracking, booking failures, notification delay, slow queries, and export backlog. Establish alert thresholds from staging/production measurements.
6. **Add targeted release tests.** Prioritize recovery access, cross-tenant direct access and exports, shared-resource assignment races, duplicate booking submission, financial idempotency, and offline replay after uncertain responses. Existing unit tests should be retained and supplemented with actual MySQL execution.

## Web frontend and operations UX

- **Make dispatch exception-led.** Put late pickups, unassigned rides nearing departure, stale tracking, and failed trips above routine counts. Each exception should show severity, owner, next action, and time remaining. Keep the map secondary to urgent work.
- **Protect against stale search results.** Dispatch reloads on every filter change and every 30 seconds, with five coupled requests and no cancellation or latest-response guard. Debounce search, key requests by filters, cancel obsolete requests, and cache resource lookups. Let the board remain usable if the map request fails. Show last refresh time and refreshing/error states without discarding useful data.
- **Improve assignment decisions.** Replace long driver/vehicle select lists with searchable availability results showing compliance, wheelchair capacity, conflicts, and why a resource cannot be selected. Add bulk assignment preview with per-ride validation and explicit partial-failure results.
- **Shorten booking.** The current large RideUpsertDialog already applies some rider defaults. Build on this with saved locations, address lookup, a clear trip/time section, return-trip details, review before submit, and draft protection. Hide optional billing/internal fields until needed.
- **Keep context while working.** Persist filters in the URL, restore list position on back navigation, support saved operational views, and provide linked breadcrumbs between rider, ride, invoice, and incident records.
- **Improve narrow layouts.** Shared DataTableShell supports horizontal overflow, but dispatch uses a separate dense table inside overflow-hidden Paper. Provide compact dispatch cards or a proper scroll container with a persistent key action. Validate dialogs and action rows at phone/tablet widths.
- **Use truthful errors.** Surface business-specific validation/conflict messages, attach field errors, and offer retry. Distinguish no results, no permission, failed load, and stale data.
- **Guide tenant onboarding.** Present a checklist for company settings → compliance → staff → fleet → riders → first ride. Explain blocked dispatch and link directly to the remediation task.

## Mobile functionality and ease of use

- **Make the current trip the driver's primary workspace.** Show the next stop, departure/pickup window, assistance requirements, and one prominent next action near the bottom. Keep navigation and dispatch contact easy to reach. Trigger success feedback after confirmed success rather than immediately before the request resolves.
- **Complete booking choices.** Rider Schedule offers Round Trip but does not collect/send return times. It also omits wheelchair/escort controls despite the API accepting them. Collect required return details and assistance requirements, default from the rider profile, and review the full request before submission.
- **Support guardian booking explicitly.** The backend requires riderId for guardians with multiple linked riders. Provide a rider selector and a guardian-scoped booking flow; do not route them into a rider-only screen that the auth gate redirects away from.
- **Correct the guardian Live tab.** `(guardian)/riders.tsx` is a linked-rider roster, despite its Live Tracking heading. Either name it Riders or link each rider to an active trip with a map, current status, freshness, and support action.
- **Handle error states.** Driver detail renders LoadingState whenever ride data is absent, including after a failed fetch. Other screens default missing data to empty arrays. Add explicit unavailable/error/retry states and retain the last successful data with a stale indicator.
- **Paginate billing.** Mobile billing fetches only 20 invoices/payments without a load-more path and hardcodes a dollar symbol despite invoice currency being available. Add paging and currency-aware formatting, invoice details, receipts, and a clear billing-support path.
- **Improve accessibility.** AppButton has useful accessibility role/state props, but sizes range from 30–40 high for smaller/default variants. Increase practical touch areas; use minimum heights that accommodate text scaling. AppInput needs explicit accessible input labels and a labeled show/hide-password control. Test screen readers, larger text, focus, keyboard avoidance, and selected states on option pills.
- **Make maps useful and dependable.** TripTrackingCard uses a remote static image and exposes raw coordinates, speed, and accuracy prominently. Prefer a clear vehicle/stop view, address, last update, and ETA when supported by an ETA service. Hide technical telemetry behind details. Add image failure handling and review location data sent to external map providers.

## Suggested delivery sequence

| Phase | Scope | Completion evidence |
| --- | --- | --- |
| First: trust and recovery | Recovery endpoints/UI, cache isolation, durable offline queue, truthful success states, mobile test configuration and CI | Signed-out reset works; user B never sees user A data; offline actions survive failures/restart; web/mobile tests run in CI |
| Next: reliable trips | Background tracking, navigation target, atomic assignment, shared-resource concurrency, timezone semantics | Physical-device tracking trials; concurrent MySQL assignment test; tenant-zone/daylight-saving cases |
| Then: everyday speed | Booking pickers/defaults/return details, guardian selection, actionable dispatch exceptions, searchable resources, explicit error states | Representative users complete booking and assignment with fewer corrections; all interrupted tasks have a recovery path |
| Then: scale and expansion | Bounded reporting, batch dispatch queries, durable push, bulk workflows, billing improvements | Measured latency/query/memory budgets; large export trial; delivery failure/retry trial |

Treat this ordering as a proposed backlog, not an effort estimate. Track booking completion and abandonment, assignment time, missed/late pickups, stale-location rate, sync failure age, notification latency, and support requests by task. Establish baselines before setting numerical targets.
