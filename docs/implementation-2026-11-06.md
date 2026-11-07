# Review implementation — November 6, 2026

This records the implementation of the [application review](app-review-2026-11-06.md). No deployment, customer email, production data migration, or application-store submission was performed.

## Delivered

| Review area | Implementation |
| --- | --- |
| Recovery | Anonymous reset/request endpoints with rate limits, real mobile recovery requests, native reset screen, web failure/retry UI, anonymous-access regression tests. |
| Session privacy | A separate mobile query cache for each account/role; cache cancellation and disposal; account-generation checks prevent old requests refreshing/replaying under a new account; refresh updates UI identity; login waits for logout cleanup. |
| Offline operations | Single-flight draining, per-entry changes, retained terminal failures, timed/reconnect/resume retries, expected-status checks after idempotency resolution, manual retry, account ownership, global sync status. Pending actions survive sign-out. |
| Tracking | An app-level location task with native background permissions and Android foreground service; foreground fallback; permission/sync status; terminal-trip/logout cleanup; correct navigation destination. |
| Assignment | Atomic full resource replacement with expected version, tenant dispatch lock, overlap/compliance/capacity checks, consistent driver-only status, shared lock for route assignment and assigned-ride edits. Same-route rides may share a route resource. |
| Dispatch performance | Latest-snapshot query, related-resource ID batches, cached compliance per resource and batch overlap evaluation, bounded aggregate/exception windows. |
| Timezones | Tenant-local dispatch/report days, IANA zone and currency validation, native booking pickers using the company zone, explicit rejection of ambiguous/missing daylight-saving times. |
| Lead capture | Validated, persisted demo inquiries and honest success/failure UI. |
| Reporting | Bounded synchronous queries and tenant/user-scoped durable CSV exports with progress, date partitions, cancellation, reauthorization, expiry and safe CSV cells. Related resources load by ID. |
| Push | Transactional per-device jobs, leased delivery/retry, ownership checks before send, Expo ticket/receipt reconciliation, invalid-token cleanup, foreground refresh and cold-start navigation. |
| Contracts | Generated OpenAPI schema types checked into both clients; booking and ride enum types consume them; server-published driver action metadata; CI detects contract drift. |
| Observability | Protected operational metrics for booking outcomes, assignment conflicts, stale tracking, push backlog/failure and export backlog; separate scheduler capacity for background workers. |
| Web workflow | Debounced/cancelled dispatch reads, stale-response protection, map failure isolation, last refresh, searchable resources, bulk preview/per-ride outcomes, exception panel, saved dispatch view, URL-backed list filters, narrow table scrolling. |
| Booking UX | Review before commit, hidden optional internal notes, unsaved-form confirmation; native return times and assistance requirements; guardian rider selection; recent address reuse; portal booking idempotency. |
| Onboarding | Tenant-specific setup checklist linking settings, approval, staff, fleet, riders and first dispatch. Completion is explicitly marked by the operator. |
| Mobile usability | Driver actions moved ahead of long details; truthful connectivity and sync feedback; success haptics after acceptance; linked-rider tab accurately named; error/retry states; larger adaptable buttons and accessible input/password controls. |
| Mobile billing | Pagination, currency formatting, scoped invoice line details, payment records that can be shared, and configured support contact actions. Portal DTOs exclude staff/collection notes. |
| Map clarity | Address and freshness display, image failure fallback, technical coordinates/speed/accuracy behind a details toggle. |
| Delivery checks | Web tests and mobile typecheck/tests in CI, repaired native Jest preset, pinned compatible React DOM, generated-schema drift check. |

## Validation

- Backend: `mvn -o -B verify` passed **143 tests**, including MySQL/Testcontainers migrations, tenant isolation, financial/session idempotency and the concurrent assignment regression. The runnable JAR was packaged successfully.
- Web: production build passed; **9 tests** passed, including public forms, recovery failure/retry, retained list context and account-switch request isolation.
- Mobile: type checking and **7 tests** passed; production JavaScript/Hermes bundles exported successfully for both **Android and iOS**.
- Mobile `npm ci --dry-run --ignore-scripts --offline` validated the lockfile after pinning React DOM to React 19.2.3.
- `git diff --check` passed.

MySQL tests ran against isolated containers; production data was not used. Native bundle export is not a signed APK/IPA build or a physical-device test. Physical devices and user research remain separate from this automated coverage.

## Running and configuration

- Flyway migrations **V6–V8** introduce demo inquiries, push delivery jobs, report export jobs, and booking idempotency. Normal backend startup applies them when Flyway is enabled.
- Rebuild native apps after installing dependencies so `expo-task-manager`, the date/time picker and background location configuration enter the native binary. JavaScript updates alone cannot add native permissions/modules.
- Production email and Expo credentials still use the existing deployment configuration. Logging providers do not deliver real messages.
- Password reset email URLs still follow `APP_AUTH_PASSWORD_RESET_BASE_URL`; the native reset route also supports the app's configured scheme.
- `app.dispatch.turnaround-minutes` controls the additional resource buffer. Default **0** preserves existing scheduling policy; choose the operational buffer for each deployment.
- Synchronous reports/dispatch aggregate windows are limited to **5,000** matching records. Export requests support up to **366 days**, partition by day, cap output at **100,000 rows / 4 million characters**, and expire after **24 hours**. Narrower filters are required if a single partition exceeds the synchronous limit.
- Push delivery uses at-least-once attempts; an interruption after provider acceptance can cause a duplicate. Ticket acceptance and downstream provider confirmation are separate states. Confirmation is not proof that a person saw a notification. The receipt implementation follows [Expo's delivery documentation](https://docs.expo.dev/push-notifications/sending-notifications/).
- `GET /actuator/metrics` and the other non-health actuator endpoints require a platform administrator. Existing monitoring can consume the new `transport.*` meters; deployment alert thresholds require operational baselines.
- Regenerate contracts with `mvn -f backend/pom.xml -Dtest=ApiContractGenerationTest test` followed by `node scripts/generate-api-types.mjs backend/target/api-contracts.json`. The generator can also read a running OpenAPI URL.

## Remaining external validation and product limits

- Physical iOS/Android checks are still needed for screen lock, force-stop/relaunch, background permissions, battery behavior, screen readers, large text and notification delivery. OS restrictions still govern background execution.
- No traffic/ETA or external geocoding service was added. Address reuse uses authorized recent trips; maps show reported positions and freshness. The product does not invent arrival estimates.
- Production query latency, load targets, alert thresholds and improvements in task completion require representative staging data and operator/rider sessions. The checklist and metrics support those measurements but do not substitute for them.
