# Production review — mobile, administration frontend, and backend

**Decision: DO NOT RELEASE this revision as production ready.**

Reviewed November 13, 2026. Source revision: `ea96b44e46ba71126476e88991dfaadccac12c55`. The pre-existing untracked `localReleaseInstall.sh` was left untouched. Application source was not patched during this review. This report and its reproduction artifacts are new files.

There is a reproducible financial integrity defect: four different payments can all be reported successfully applied while the invoice reflects only one. There are also broken organization pages, unreadable mobile notification content, ordinary browser behavior that revokes sessions, and incomplete round-trip/offline workflows. These are substantive delivery risks despite the green existing tests.

This is a detailed engineering review, not a certification that every screen, configuration, deployment, or possible input is safe. In particular, visual and physical-device sign-off remains **incomplete**. Browser discovery reported that the browser access host was unavailable; attempting the native Chrome connection timed out. No screenshots or visual walkthrough were obtained. Styling, interaction, and accessibility observations below are source-based unless explicitly described as runtime results. Production services, real customer data, provider delivery, and real trips were not used for mutation tests.

## Evidence and scope

Artifacts:

- [Executable local reproduction probes](review-2026-11-13/reproduce.py)
- [Sanitized runtime results](review-2026-11-13/runtime-evidence.jsonl)
- [Synthetic local compliance fixture](review-2026-11-13/fixture.sql)
- [Dependency audit summary](review-2026-11-13/dependency-audit-summary.json)
- [Automated check results](review-2026-11-13/check-results.json)

Verification performed:

| Check | Result | What it establishes |
| --- | --- | --- |
| Backend `mvn test -q` | 286 tests, zero failures/errors/skips | Existing tests, including isolated MySQL/Testcontainers integration tests, pass |
| Backend `mvn -q -DskipTests package` | Pass | Current source packages for runtime probes |
| Web `npm test -- --reporter=dot` | 67 tests / 22 suites pass | Existing component/unit checks pass |
| Web `npm run build` | Pass | TypeScript, public/admin production bundles, bundle separation/indexing checks pass |
| Generated client contract regeneration | No tracked diff | Generated files match the generator input; this does **not** establish handwritten client contract correctness |
| Mobile `npm run test:ci -- --silent` | 67 tests / 23 suites pass | Existing mocked/component/unit checks pass |
| Mobile `npm run typecheck` | Pass | Current application TypeScript checks pass |
| Mobile `npm run lint` | **Fail: 10 errors** | Full repository lint gate is not clean |
| Deployment Python tests | 23 pass | Existing deployment script/config tests pass |
| Web `npm audit --json` | 6 affected packages: 2 critical, 3 high, 1 moderate | Registry advisory results; exploitability still needs dependency-path triage |
| Mobile `npm audit --json` | 32 affected packages: 1 critical, 11 high, 14 moderate, 6 low | Includes build/development tooling; these are not 32 proven remotely exploitable mobile defects |
| Isolated API role smoke checks | Core reads exercised for tenant admin, platform admin, driver, rider, guardian, organization | Ordinary endpoint behavior plus concrete failures below |
| Isolated one-way ride journey | Creation, assignment, en route, arrival, pickup, drop-off, completion succeed | Basic server journey works with explicitly prepared synthetic compliance records |
| Physical Android/iOS, notification delivery/taps, background GPS | **Not performed** | No device reliability or store-release certification |
| Visual desktop/mobile browser/device inspection | **Blocked** | No visual approval or measured accessibility compliance |
| Production host, backup restore, provider credentials, staged upgrade | **Not verified** | Deployment/operational readiness remains open |

The API runtime used a newly created Docker MySQL database, `transport_review`, exposed only on `127.0.0.1:33319`, and a newly packaged backend bound to loopback. The `dev` profile supplied synthetic demo identities. Email and push delivery were disabled. Synthetic compliance metadata was inserted only into that disposable database so assignment behavior could be exercised. Initially the demo correctly refused assignment without compliance approval/documents; those refusals are not product defects. A malformed review-fixture enum was corrected before collecting final evidence and is not counted as a product defect. Repeated test logins also reached the real rate limiter, which returned 429 as expected.

Severity: **P0** means critical integrity/safety/security failure that blocks release. **P1** means significant workflow, privacy, security, or reliability risk that needs correction or explicit, scoped release acceptance. **P2** means important usability/maintainability/consistency work. “Runtime” means reproduced locally; “source” means a traced code path, not a demonstrated production incident. Configuration and verification gaps are identified as such.

## Findings

### F01 — P0 — Successful concurrent payment applications lose invoice balance updates

**Runtime reproduced.** `PaymentService.applyCompanyPayment()` reads the invoice, calculates a new amount paid in memory, and writes it without an invoice lock or version. `Invoice` and `Payment` have no `@Version`; `BillingAccessService` and the repository lookups do not acquire write locks.

Four distinct recorded $1 payments were applied concurrently. All four requests returned 200 and all four payment records became `PARTIALLY_APPLIED`, but the invoice's amount paid increased by only $1. See `concurrent_payment_application` in the evidence file. An earlier concurrent creation probe also produced database deadlocks and generic 500 responses for seven of eight requests. The final retained probe isolates the worse, silently successful lost-update case.

**Impact:** invoices, receivables, receipts, and account balances disagree with recorded payments. Operators can overcollect or have no trustworthy reconciliation basis.

**Location:** `backend/.../features/billing/application/PaymentService.java:189`, `InvoiceFinancialService.applyPayment()/reversePayment()`, `billing/domain/Invoice.java`, `Payment.java`, `InvoiceRepository.java`, `PaymentRepository.java`.

**Required correction:** serialize financial changes on a consistent invoice lock; protect payment application/void transitions too; ensure all invoice/line-item/void paths use the same protocol. Add a financial invariant check comparing applied payments with invoice totals and a repair procedure for any deployed affected data. Return actionable conflict/retry responses for deadlocks.

**Acceptance:** concurrent different payments, duplicate apply, apply versus void, invoice void versus payment, and concurrent line-item changes preserve exact totals and give deterministic results in real MySQL integration tests.

### F02 — P1 — Web payment creation never uses the backend's idempotency mechanism

**Source confirmed; duplicate record behavior reproduced.** `frontend/src/features/billing/api/billingApi.ts:586` posts payment payloads without `Idempotency-Key`. Both payment-management and invoice-details screens call this method. The backend header is optional and the service skips its idempotency claim when absent. Two identical requests create two different records; see `identical_payment_without_key`.

**Impact:** after a server commit followed by a dropped response, the operator can retry and record the same real payment again. Button loading states do not resolve uncertain network outcomes.

**Required correction:** create a stable key per payment intent, retain it across retries/timeouts, and replace it only for a genuinely new intent or changed payload. Require or otherwise deduplicate externally retried financial creation at the server boundary.

**Acceptance:** simulate a committed payment with a lost response, retry from each web entry point, and prove exactly one payment exists and the balance changes once.

### F03 — P1 — Mobile alerts do not render the backend's title or message

**Runtime wire contract confirmed; source rendering defect.** `NotificationSummaryResponse` returns `title` and `message`. `mobile/src/api/notificationsApi.ts` declares `subject` and `summary`, and `NotificationsScreen.tsx:33` renders those nonexistent properties without mapping. The synthetic ride generated real notification responses; retained evidence lists `title`/`message` and shows the mobile expected keys absent. Tests mock the incorrect `subject`/`summary` shape and therefore pass.

**Impact:** drivers, riders, and guardians see alert cards without the actual operational message. Generic lock-screen push text makes the in-app message especially important.

**Required correction:** consume the real response type or explicitly map it; use backend-produced fixtures in client tests. Handle nullable `sentAt` using an appropriate created timestamp.

**Acceptance:** run a real trip-status event through the API and mobile rendering; verify readable title, full message, date, unread state, pagination, and related-trip navigation.

### F04 — P1 — Organization profile and ride pages crash on ordinary optional addresses

**Runtime reproduced.** `OrganizationPortalService.address()` at line 497 calls `List.of(trimToNull(...))` before filtering nulls. `List.of` rejects null elements. An absent or blank optional second address line produces `NullPointerException`. Both `/portal/organization/profile` and `/portal/organization/rides` returned 500 using the committed demo dataset.

**Impact:** valid organizations cannot open their profile or scheduled rides; profile updates that map the response can roll back too.

**Required correction:** build the address with a null-tolerant stream/list and filter before creating a null-rejecting collection.

**Acceptance:** API integration tests for absent, null, blank, and populated address line 2 on profile read, update, and ride list; include mixed records in a paginated result.

### F05 — P1 — Normal cross-tab refresh races revoke every session for a user

**Runtime reproduced.** Browser tabs share `tp_refresh` but have independent JavaScript `refreshPromise` variables. The initial `AuthProvider` restore also refreshes on each tab load. In `AuthSessionService.rotate():45`, a reused token invokes `revokeAllForUser`, including access security-version invalidation.

Two simultaneous requests with the same web refresh cookie produced `[200, 401]`. Both the old access token and the access token just returned by the successful refresh subsequently received 401. This can disrupt the user's mobile session too because revocation is user-wide.

**Required correction:** coordinate browser refresh across tabs and make legitimate overlapping rotations safe without weakening actual stolen-token replay protection. Scope compromise responses deliberately. Cover a lost refresh response as well as concurrent requests.

**Acceptance:** two tabs opening/reloading together and concurrent expired requests remain usable; stale/replayed credentials outside the allowed overlap still fail; real compromise still revokes the intended sessions.

### F06 — P1 — Valid iOS GPS fixes are discarded when course is unknown

**Runtime boundary reproduced; native source traced.** Expo's installed iOS `LocationUtils.swift` passes `CLLocation.course` as `coords.heading`. Mobile `tracking/activeTrip.ts` forwards it unmodified. The backend `DriverLocationSnapshotRequest` rejects negative headings. A fix with valid coordinates and heading `-1` returned 400; the same fix with heading null returned 200.

Apple documents negative course as unavailable/invalid direction information, which does not mean the coordinate itself must be discarded. [Apple CLLocation.course documentation](https://developer.apple.com/documentation/corelocation/cllocation/course).

**Impact:** stationary/startup fixes can fail silently into a generic sync-unavailable state, leaving riders and dispatch without fresh tracking.

**Required correction:** normalize unavailable optional course/speed metadata to null, validate each optional measurement independently, and keep valid coordinates. Do not turn unknown direction into a false direction of zero.

**Acceptance:** native-like samples with course -1/null, speed -1/null, valid zero heading, and normal movement upload appropriately; invalid coordinates are still rejected.

### F07 — P1 — Round trips have no executable return-leg lifecycle in the driver app

**Source confirmed.** The admin permits `ROUND_TRIP`, stores return pickup/drop-off times, and reserves capacity for them. The driver response contains those times, but the mobile trip detail does not display them and has only one `ASSIGNED → … → DROPPED_OFF → COMPLETED` sequence. The shared workflow cannot transition back to a return pickup; tracking stops at the first drop-off. Rider detail contracts also omit return-leg times.

**Impact:** an outward drop-off can look like the whole booking is finished while the return pickup remains outstanding. The driver has no clear action or schedule for that return journey.

**Locations:** `mobile/app/(driver)/rides/[rideId].tsx`, `RideStatusWorkflow.java`, `DriverPortalRideDetailResponse.java`, `mobile/src/api/riderPortalApi.ts`.

**Required correction:** model separate linked legs or an explicit leg-aware lifecycle, with complete return schedules, navigation, notifications, billing semantics, and tracking. If unsupported for the initial release, reject round-trip creation at every server entry point and remove it from the UI.

**Acceptance:** demonstrate a full round trip through driver, rider/guardian, dispatcher, notification, location, and billing views; no premature completion.

### F08 — P1 — Offline queueing cannot support a complete disconnected journey

**Source confirmed.** Offline `handleAction()` enqueues the action but does not advance a separate local pending state or query data. `PRIMARY_STATUS_ACTIONS` continues to use the old server status. A driver who queues arrival while offline still sees arrival, not pickup; duplicate queueing returns the existing entry. A failed queued action also cannot be cancelled through the provided controls, only retried; conflicts can be dismissed.

**Impact:** “will sync when reconnected” suggests usable offline trip operation, but the driver cannot record subsequent milestones through the normal UI. Operational timestamps and dispatch state can diverge from what actually occurred.

**Locations:** mobile trip detail `handleAction`, `PRIMARY_STATUS_ACTIONS`, `offlineQueueStore.enqueue()/drain()`, `OfflineSyncStatus.tsx`.

**Required correction:** define supported offline behavior explicitly. Implement an ordered local pending journey with clear server-confirmed versus unsynced state and dependency/conflict handling, or present an explicit connection-required operational fallback. Give dispatch a reconciliation path rather than silently discarding evidence.

**Acceptance:** disconnect before arrival, record arrival/pickup/drop-off, restart the app, reconnect, and verify ordered, single application with the original event times and clear conflict recovery.

### F09 — P1 — Queuing offline drop-off does not immediately stop location sharing

**Source confirmed.** Tracking stops in the online mutation's `onSuccess` or when a server query observes a terminal/nontrackable state. The offline confirmation branch only calls `enqueue`. The backend remains `PICKED_UP`, and native location callbacks continue to treat that as trackable.

**Impact:** sharing can continue after the real passenger drop-off while its status is queued. This conflicts with the app's permission explanation that tracking stops after drop-off. Native location connectivity and the offline-queue timer can recover at different times.

**Required correction:** stop sharing locally when a confirmed offline drop-off/failure ends the real trip, scoped to the exact trip owner. Make restarting sharing after rejection an explicit, understandable decision.

**Acceptance:** offline drop-off immediately cancels both native and foreground updates; delayed callbacks and reconnect do not restart them inadvertently; another active trip is unaffected.

### F10 — P1 — Saved operational settings do not enforce the restrictions they advertise

**Runtime reproduced for ride flags; source traced for other controls.** Setting `allowManualRideCreation=false` and `allowRoundTripRides=false` returned 200; manual round-trip creation still returned 201. These settings are persisted and exposed but not consulted by ride creation.

Driver/vehicle compliance summaries also use fixed document sets rather than the saved requirement switches. Number generators use hardcoded `INV-`/`PAY-` prefixes. Several tax/default/override settings are similarly disconnected from the corresponding write paths; each should be inventoried, rather than assuming every persisted field is enforced.

**Locations:** `CompanySettingsService`, `RideService.createCompanyRide`, `RideScheduleValidator`, `DriverComplianceSummaryService`, `VehicleComplianceSummaryService`, `InvoiceNumberGenerator`, `PaymentNumberGenerator`.

**Impact:** operators may believe a policy or safety restriction is active when it is only a saved preference. Some current behavior is stricter than the setting, but the UI still misrepresents control.

**Required correction:** enforce applicable settings server-side on all entry points, or remove/disable the setting with accurate explanatory copy. Do not permit tenants to weaken mandatory platform compliance requirements.

**Acceptance:** a table-driven integration test toggles each setting and demonstrates its actual effect, including recurring generation and alternate endpoints.

### F11 — P1 — Stale ride edits silently overwrite another operator's changes

**Runtime reproduced.** `Ride` has a JPA version, but `RideUpsertRequest` does not accept the version the operator viewed. Each update loads a fresh version and applies the entire stale form. First update set internal notes to `operator A`; a second stale form changed a different field while carrying `original` internal notes. Both returned 200, and the final notes reverted to `original`.

**Impact:** safety instructions, addresses, assistance needs, and schedule corrections can be lost without a conflict message. A database lock alone serializes the overwrite; it does not detect a stale screen.

**Locations:** `RideService.updateCompanyRide():136`, `RideUpsertRequest`, web `RidePayload` and edit dialogs. Other full-form updates without client preconditions require the same audit.

**Required correction:** require a client-visible version/ETag precondition for edits; preserve drafts on 409 and show changed fields. Extend consistently to riders, drivers, routes, settings, and financial drafts as appropriate.

**Acceptance:** two operators edit the same original record; the stale save returns a clear conflict and cannot erase the first save.

### F12 — P1 — Recurring generation bypasses current reference and DST validation

**Source confirmed.** `RecurringRideScheduleService.generateCompanyRecurringRideInstances()` copies stored profile relationships and constructs `LocalDateTime` values directly. Its `validateGeneratedRide()` checks only presence of return times. It does not run the `RideReferenceValidationService` used by ordinary creation or `RideScheduleValidator`'s DST validation.

**Impact:** a schedule can continue generating after the rider becomes inactive, a minor's guardian authorization changes, or a linked contract becomes ineligible. Recurring schedules can also create nonexistent/ambiguous service-local times that manual entry rejects.

**Required correction:** revalidate current rider/guardian/contract eligibility and every generated instant under the same domain rules as manual creation; report skipped occurrences with reasons. Define what happens when those relationships change after rides already exist.

**Acceptance:** revoke guardian pickup authorization or deactivate the rider/contract after schedule creation, then generate; invalid occurrences must not be created. Include spring-forward and fall-back dates.

### F13 — P1 — Recurring generation is unbounded and does not serialize occurrence limits

**Source confirmed.** The generation request accepts arbitrary dates and the service loops day by day in one transaction. An occurrence limit merely increments `skippedCount` and continues the loop. There is no maximum date range/job budget. Concurrent callers read the same `existingCount`; a unique recurrence/pickup index prevents exact duplicate dates but does not protect occurrence limits for disjoint requested ranges.

**Impact:** a permitted user or accidental extreme date can monopolize backend/database resources; concurrent generation can exceed contractual occurrence limits. Colliding generations can produce generic integrity errors instead of stable replay results.

**Required correction:** bound ranges/occurrence counts, stop scanning once the limit is reached, lock the schedule or otherwise atomically reserve occurrences, and use a bounded background job for larger ranges.

**Acceptance:** disjoint concurrent generation cannot exceed the limit; identical concurrent requests return stable counts; extreme dates fail quickly without bulk writes or excessive CPU.

### F14 — P1 — Dispatch invents a two-hour duration for rides with unknown drop-off

**Source confirmed.** `DispatchAssignmentValidationService.resolveRideWindowEnd():252` returns pickup plus two hours when no drop-off exists. In contrast, pooled capacity reserves an unknown duration indefinitely. There is no recorded explicit two-hour commitment associated with an unknown end.

**Impact:** dispatch can assign a later ride to the same driver/vehicle while the first, duration-unknown service may still be underway. Safety depends on an undocumented estimate.

**Required correction:** require an explicit conservative end/availability commitment, or reserve unknown-duration resources until released. Make turnaround and uncertainty visible and consistent between route and individual assignment checks.

**Acceptance:** assign an open-ended journey and attempt a later allocation; it must be refused or require a deliberate, audited resolution of the unknown window.

### F15 — P1 — Compliance expiry dates use UTC instead of the tenant's operating date

**Source confirmed.** `ClockConfig` supplies UTC. Driver/vehicle compliance summaries and `TenantTransportComplianceService.isDispatchApproved()` use `LocalDate.now(clock)`, while schedules and billing have tenant-time services.

**Impact:** around midnight, dispatch can accept locally expired documents in an eastern timezone or reject still-valid documents in a western timezone. The displayed operating date and actual gate need not agree.

**Required correction:** adopt and document a single compliance-date rule, normally the relevant operating/legal timezone, and apply it consistently to verification, expiry badges, notifications, and dispatch.

**Acceptance:** fixed-clock tests around UTC/local midnight and DST boundaries for both sides of UTC; the gate and UI agree exactly on expiry.

### F16 — P1 — Administrative “MFA” is a shared static code and cannot be entered in the web login

**Source confirmed; deployment setting not inspected.** `AuthFacade.ensureMfaComplete():269` optionally compares input with one `APP_AUTH_ADMIN_MFA_CODE` environment value. It has no per-user enrollment, time-based challenge, recovery, or independent factor verification. `LoginPage.handleSubmit()` sends only email and password and provides no MFA input/challenge.

**Impact:** enabling the advertised control blocks ordinary admin login; leaving it off yields password-only access to privileged operations. A shared environment password should not be presented as proper MFA.

**Required correction:** implement an established per-user factor/challenge flow or integrate a suitable identity provider, including enrollment/recovery/auditing and corresponding UI. Remove misleading claims until complete.

**Acceptance:** enroll two different admins, prove factors are not interchangeable, test replay/rate limiting/recovery, and complete sign-in through the shipped frontend.

### F17 — P1 — Tracking automatically sends precise journey coordinates to an external static-map host

**Source confirmed; privacy/operational decision unresolved.** `mobile/src/components/TripTrackingCard.tsx:35` constructs an image request to `staticmap.openstreetmap.de` with exact coordinates in its query string. The image loads automatically when a snapshot is displayed. The dispatch UI also sends exact coordinates to Google Static Maps when its map key is configured; that is a separate external destination to include in the inventory.

**Impact:** a third-party service receives precise journey location and request metadata; its availability/rate limits can also affect tracking presentation. This data flow needs explicit approval and accurate disclosure rather than being an incidental image URL.

**Required correction:** choose an approved map architecture/provider, document the location data flow and terms, minimize precision/metadata as appropriate, and provide a usable unavailable-map state. Consider controlled/self-hosted rendering if required by the product's privacy commitments.

**Acceptance:** verify network requests from actual clients and production CSP, document destinations and retention/contract decisions, and confirm a map outage does not remove the underlying trip/support controls. No legal-compliance conclusion is made here.

### F18 — P1 — Disabled/logging delivery is reported as successful delivery

**Source/configuration gap confirmed.** `LoggingNotificationEmailSender` and `LoggingNotificationPushSender` return success without sending. The Expo sender also returns success when disabled. Production configuration defaults allow disabled/logging providers; deployment validation permits that combination. `AuthFacade.preparePasswordReset()` calls the sender without verifying a failure result.

**Impact:** operational records can show success despite no delivery. Password recovery or application verification can appear successful but produce no usable email. This is acceptable only as explicit development behavior, not silent production readiness.

**Required correction:** distinguish disabled, simulated, provider-accepted, confirmed, failed, and skipped delivery. Make required production channels a startup/release readiness condition. Persist/retry reset delivery appropriately without exposing tokens or account existence.

**Acceptance:** disabled channels never report actual delivery; staging verifies real reset/application email and push receipts; provider outage produces operational alerts and a usable user recovery path.

### F19 — P1 — Dependency vulnerability triage is outstanding

**Scanner results retained; exploitability unproven.** The web audit reports affected Vitest/tinypool, Vite, source-map-js, and follow-redirects paths. Mobile includes shell-quote, Expo tooling, node-forge, glob/minimatch and other transitive paths. The detailed names, severities, ranges, available-fix metadata, and advisory URLs are in the audit artifact.

**Impact:** critical/high advisories remain in the installation/build environment. Browser bundles, native runtime code, and Node build tools have different exposure; a raw severity count cannot establish product exploitability.

**Required correction:** classify each path by where it executes and attacker-controlled input, upgrade compatible supported versions, and rerun native/build/regression checks. Do not blindly use force upgrades. Add dependency/SBOM scanning with a reviewed exception policy. A Java dependency vulnerability scan was not completed; the backend dependency tree still needs that independent check.

**Acceptance:** an up-to-date vulnerability report covers npm, Maven, native dependencies, and release images/artifacts; every unresolved high/critical result has a documented exploitability assessment and owner.

### F20 — P2 — “Search” selectors cannot find eligible records beyond the first 100

**Source confirmed.** `dispatchApi.listDriverOptions()/listVehicleOptions()` fetch page 0, size 100, with empty keyword; the UI Autocomplete filters that local subset. `ridesApi.listRiderOptions()` and contract selectors follow the same pattern.

**Impact:** a growing tenant cannot select older drivers, vehicles, riders, or contracts even when typing an exact known name. “No options” can be mistaken for absence or noncompliance.

**Required correction:** use debounced server search with pagination and preserve selected records by ID. Distinguish empty, unavailable, inactive, and noncompliant results.

**Acceptance:** seed over 200 records and successfully find/assign a record outside the initial page, including an existing selection not in the current result set.

### F21 — P2 — Several admin lists can display an older search response under newer filters

**Source confirmed.** `DriverManagementPage.loadDrivers()` and `RiderManagementPage.loadRiders()` update state unconditionally. Their effects fire on every filter/keyword change without cancellation, request generation checks, or debounce. A slow first request can finish after a newer one and replace its results.

**Impact:** visible filters, total counts, and actionable records can disagree. Dispatch has cancellation/generation protection, demonstrating inconsistent shared behavior.

**Required correction:** use a consistent scoped query layer or cancellation/generation protocol; debounce text search; keep loading/error/stale state tied to the active parameters.

**Acceptance:** deliberately reorder responses for two searches and two pages; only the latest request may determine results/loading state.

### F22 — P2 — Reference-data failures and mutation errors are not consistently actionable

**Source confirmed.** `RideUpsertDialog` reference loading uses `Promise.all(...).then(...).finally(...)` without a rejection handler; guardian option loading also has no catch and can race a changed rider. Some save/action handlers replace specific business errors with generic toasts, including `RideManagementPage` and `PaymentManagementPage`.

**Impact:** selectors can be empty without explaining an outage, previous options can remain after a parent change, and operators cannot tell compliance denial from conflict or validation failure. Forms risk repeated unsuccessful submissions.

**Required correction:** handle and display reference failures with retry, clear dependent selections safely, ignore stale results, and retain drafts plus field-level/domain-specific errors. Use the existing shared business-error infrastructure consistently.

**Acceptance:** fail each lookup and mutation independently; users receive a specific recovery action and cannot save against stale dependent options.

### F23 — P2 — Portal dashboard balances silently truncate at 1,000 invoices

**Source confirmed.** Rider/guardian and organization dashboard services load page 0 of 1,000 invoices, then calculate open-invoice count and outstanding balance in memory.

**Impact:** older unpaid invoices disappear from dashboard totals for established accounts. Financial summary figures can disagree with the paginated ledger even after F01 is corrected.

**Required correction:** compute tenant/subject-scoped totals in aggregate database queries with the same status, currency, and access semantics as the ledger; avoid summing mixed currencies into an unlabeled number.

**Acceptance:** create over 1,000 invoices with an unpaid oldest invoice and compare dashboard totals to the full ledger and per-currency aggregates.

### F24 — P2 — Client failures lack durable production telemetry and recovery evidence

**Source confirmed; production monitoring not inspected.** Web/mobile `clientTelemetry.ts` only writes to the console. The web error boundary has no `componentDidCatch` reporting, and its generic message claims saved data was not changed even though a render failure can follow a successful mutation. No application-specific mobile boundary/recovery implementation was found in app/source paths; Expo's own defaults are not a demonstrated operational recovery plan.

**Impact:** support may learn of production crashes only from user reports, without a useful incident reference; the UI can make an unsupported claim about whether a mutation committed.

**Required correction:** add privacy-reviewed durable crash/error reporting with release/correlation context, source-map/symbol handling and alert ownership. Say when an action's result is unknown and provide refresh/reconciliation rather than asserting no changes.

**Acceptance:** trigger a post-commit render error and native JS error in staging; support can locate the incident without logging tokens, rider instructions, or precise locations.

### F25 — P2 — Full mobile lint is broken and omitted from CI

**Observed.** Ten ESLint errors include unused imports/variables in role screens/shared UI, a generated `{}` type, and errors in the nested `mobile/btransport` starter. `.github/workflows/ci.yml` runs mobile typecheck and tests but not lint or native release compilation.

**Impact:** a “green CI” claim does not mean the documented checks pass, and the shipped native build is not continuously validated. The nested starter also creates ambiguity about maintained scope.

**Required correction:** establish the maintained app paths, remove/archive or explicitly exclude unused starter code, fix lint/generator output, and run meaningful lint plus native release checks in the release pipeline.

**Acceptance:** a clean checkout passes the declared gates; intentionally introducing a relevant lint or native build error causes the intended CI job to fail.

### F26 — P2 — Some ordinary protocol errors are converted to server failures

**Runtime reproduced for nonexistent routes.** Authenticated requests to unknown paths returned generic 500 instead of 404. `GlobalExceptionHandler` has a catch-all but lacks explicit handling for `NoResourceFoundException`, unsupported HTTP methods, and database lock/integrity conflicts. The concurrent creation probe demonstrated lock failures surfacing as generic 500.

**Impact:** clients may retry permanent errors, operators get no useful corrective action, and monitoring overcounts actual application faults.

**Required correction:** map expected framework/business exceptions to appropriate stable 4xx/conflict/retryable responses; keep actual unexpected faults as sanitized 500 with a support correlation reference.

**Acceptance:** exercise nonexistent routes, wrong methods, duplicate keys, optimistic conflicts, deadlocks, and lock timeouts against the packaged app; response code and client retry policy agree.

### F27 — P2 — Editing a recorded payment can offer “apply immediately” without applying it

**Source confirmed.** `PaymentUpsertDialog` renders the `applyImmediately` checkbox for editing too. A recorded payment initializes it false and can be changed true. `PaymentService.updateCompanyPayment()` updates fields but never reads `request.applyImmediately()` or invokes application.

**Impact:** the operator can believe a saved payment was applied while its invoice balance remains unchanged.

**Required correction:** either hide/disable that option during edit and provide a clear separate Apply action, or implement the requested behavior atomically under the financial locking protocol.

**Acceptance:** edit a recorded payment with the checkbox true; UI outcome, saved payment status, audit trail, and invoice balance must all agree.

### F28 — P2 — Portal invoice detail and list can disagree about overdue status

**Source confirmed.** Normal invoice lists use `InvoiceStatusWorkflow.resolveEffectiveStatus()` for the tenant date. `PortalBillingDetailsController.invoice()` returns raw `invoice.getStatus()`, so an overdue issued invoice can display as overdue in a list and issued in its detail.

**Impact:** inconsistent urgency and account information in rider/guardian billing.

**Required correction:** reuse the same effective-status/date mapping in every billing response, including receipts where relevant.

**Acceptance:** an unpaid invoice just before/after its due-date boundary has the same effective status in admin, mobile list, detail, dashboard, and reports.

## Security controls that were present

The review did not find a blanket absence of security. Existing controls include server-side role annotations, tenant-scoped domain lookups, JWT user/role/security-version rechecks, active-tenant enforcement, required-password-change restrictions, hashed rotating refresh tokens with database locking, secure native credential storage in release builds, upload size/type/path checks, CSV formula escaping, module checks, and private production backend binding. The provided Nginx config overwrites forwarded IP information and supplies security headers; the systemd unit limits privileges and writable paths.

The runtime driver boundary probes returned 403 for company rider access, another driver's ride, and the rider portal, and 404 for a nonexistent ride. Existing integration tests cover additional tenant isolation and session invalidation scenarios. These positive checks do not certify every endpoint against every cross-tenant object combination. In particular, this session's fresh runtime demo had one tenant; it did not exhaustively recreate every two-tenant role/relationship permutation.

Other risks requiring explicit design/operational assessment include bounded authentication rate-limit storage (the in-memory map does not evict expired keys), retention/purge for location/session/audit/document records, document storage recovery and malware/content handling, and notification token changes during logout/registration races. These are follow-up assessments, not additional proven exploit claims in the 28 findings.

## UI/UX assessment and completion criteria

There is a useful shared component foundation: role-specific shells, labeled controls, 48-point minimum shared mobile buttons, confirmation flows, error/empty components, scoped query caches, service-time labels, and responsive table containers. That foundation does not compensate for empty alerts, broken organization pages, unsupported return workflows, or misleading settings.

The most important UX work is functional clarity:

1. **Driver trip screen:** show the current leg, next action, return pickup, server-confirmed status, offline pending milestones, last GPS sync, location permission state, and a persistent dispatch support path. An offline action must never look already confirmed by dispatch. Present critical assistance/instructions before optional tracking details.
2. **Dispatcher:** make resource eligibility, duration uncertainty, stale data, and save conflicts specific and actionable. Search the whole tenant dataset. Keep route-owned assignment restrictions visible before users submit an action the server will reject.
3. **Billing:** make preview/record/apply/void distinct, ensure uncertain submissions can be reconciled safely, and maintain consistent currency/status/totals across views. Preserve drafts and stable payment intent keys on failure.
4. **Rider/guardian:** show complete trip and return information, fresh versus stale tracking, readable alert content, and clear support/cancellation boundaries. Automatically requested external maps must match the approved privacy design.
5. **Administration settings:** show only working controls, explain platform-mandated requirements, and verify that saved policy changes actually take effect.

A professional visual/accessibility approval still requires an observed walkthrough, not assumptions from JSX. Test these concrete combinations:

| Surface | Required observed checks |
| --- | --- |
| Admin desktop | 1280×720 and 1440×900; login, dashboard, dispatch, ride edit/details, rider/guardian linking, driver/vehicle document review, billing, incidents, settings, tenant/application administration |
| Narrow admin | 360–390 px and 768 px; sidebar/drawer, all dialogs, tables/action overflow, long names, long addresses, validation errors, keyboard-only operation |
| Mobile Android/iOS | Small and large phones, light/dark modes, largest supported font scaling, keyboard open, safe areas, long localized content, slow network, denied permissions, screen reader reading/focus order |
| State variations | First loading, empty account, expired/revoked access, disabled feature, retry failure, stale cache, offline queue, conflicting mutation, unavailable map/provider |
| High-attention interactions | Pickup/drop-off/no-show/failure confirmation wording; guardian selection; resource reassignment; payment apply/void; upload rejected/expired states |

Measure contrast and focus visibility rather than judging from color tokens. Verify TalkBack/VoiceOver announces input labels/errors, pending actions, status changes, and dialogs correctly. Confirm the largest text setting does not truncate safety instructions or hide the primary action. Inspect actual signed release binaries as well as development builds.

No claim that the current interface is visually polished, accessible, or appealing is justified by this review's unavailable visual access.

## Remaining production and safety gates

These gates have no completion evidence from this session. They are not automatically satisfied by passing unit tests or by prior review documents.

- **Physical-device field testing:** Android and iOS foreground/background location, unknown course, permission denial/revocation, navigation in another app, OS suspension/termination, app upgrade/relaunch, battery restrictions, sign-out, and offline drop-off. Check the persisted tracking owner against displayed tracking state after process restart.
- **Push/email:** real provider configuration, delivery and receipt reconciliation, notification permission prompt/channel setup on modern Android, cold/warm notification taps, shared-device logout, reset links, and onboarding verification. The prior November 10 report identified missing Android Firebase configuration; actual current release-secret provisioning was not verified here. Source supports external config file paths, so absence from Git alone is not proof of absence from a release environment.
- **Two-tenant adversarial matrix:** direct IDs, relationships, list/search/export/download/mutations for every role; guardian revocation; suspended/deleted subjects; feature changes; role removal; password changes and session replay. Include stale tabs and queued work created before access changed.
- **Representative load/chaos:** busy dispatch periods, many tenants, GPS ingestion volume and retention, large reports, queue fairness, slow database/provider, disk-full, process interruption, duplicate/reordered requests, and lease recovery. Existing test counts do not measure capacity or service-level targets.
- **Deployment evidence:** staged release using the actual production profile/configuration, migration from a copy of the real prior schema, compatible application rollback, health/readiness checks and release identity. An empty-database migration pass does not establish upgrade compatibility for every previously deployed migration history.
- **Recovery evidence:** restore a database backup and uploaded driver/vehicle files together into an isolated environment; measure recovery time and acceptable data loss. Document on-call ownership, certificate expiry, storage alarms, database saturation, failed email/push jobs, and reconciliation procedures. The repository deployment README asks for backup/monitoring setup but does not prove it exists.
- **Privacy/data lifecycle:** inventory rider/guardian contact data, assistance notes, trip destinations, precise location, exports, uploads, and logs; document access, retention, deletion, external recipients, incident response, and required agreements for the actual operating service. Legal obligations require a qualified assessment of the actual business and data flows; this report does not certify them.
- **Supply chain:** complete Maven/native/SBOM scanning, audit signing-key access and CI secret handling, verify release signing and store installation, and review every unresolved high/critical advisory.

## Remediation and release order

1. **Stop financial integrity failure first:** F01 and F02, then F27/F28; add real database concurrency and uncertain-response regression tests before changing adjacent financial workflows.
2. **Restore reliable core journeys:** F03–F12, F14–F15. Resolve round-trip and offline product semantics explicitly; do not patch screens while leaving the underlying workflow ambiguous.
3. **Close privileged-access/privacy/production-delivery decisions:** F16–F19, plus actual provider and deployment evidence.
4. **Finish scalable operator UX:** F20–F26 and F23's correct aggregation; then perform the visual/device matrix above and fix observed issues.
5. **Re-review the release candidate:** record new commit/build IDs, rerun the retained probes expecting corrected behavior, run the two-tenant matrix, and sign off each remaining gate with evidence and owner. Do not treat this document as release approval.

## Reproducing the local evidence

Only use a disposable database. The probes create synthetic rides/payments, change and restore demo settings, rotate/revoke demo sessions, and write synthetic GPS fixes. Repeated runs consume demo invoice balance and may trip the 10-logins/minute limit; recreate the disposable database or allow the normal rate window to elapse. No production URL option is provided by the script. Review the fixture before running it; its metadata is deliberately synthetic and must never be represented as actual compliance verification.

Start MySQL using image `mysql:8.0.45`, database `transport_review`, the synthetic password `review-local-only`, port mapping `127.0.0.1:33319:3306`, and container name `transport-review-20261113`. Package the backend, then launch with:

```sh
SPRING_PROFILES_ACTIVE=dev \
SPRING_DATASOURCE_URL='jdbc:mysql://127.0.0.1:33319/transport_review?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC' \
SPRING_DATASOURCE_USERNAME=root \
SPRING_DATASOURCE_PASSWORD=review-local-only \
APP_BOOTSTRAP_PLATFORM_ADMIN_ENABLED=false \
APP_EMAIL_ENABLED=false APP_PUSH_ENABLED=false SERVER_ADDRESS=127.0.0.1 \
java -jar backend/target/transport-platform-backend-0.1.0-SNAPSHOT.jar
```

After health is up and the development seed completes:

```sh
docker exec -i -e MYSQL_PWD=review-local-only transport-review-20261113 \
  mysql -uroot transport_review < docs/review-2026-11-13/fixture.sql
TRANSPORT_REVIEW_DISPOSABLE=YES python3 docs/review-2026-11-13/reproduce.py
```

Expected current defects include successful payment requests with an incorrect resulting total, invalidated tokens after a legitimate refresh race, two organization 500 responses, rejected unknown course, creation despite disabled settings, overwritten stale notes, and duplicate payments without a key. Concurrency probes are scheduling-sensitive: repeat against a fresh fixture if a particular run happens to serialize. Corrected software should change these outcomes while keeping authorization boundaries intact.

## Source navigation index

Links point to the reviewed source; line anchors are for revision `ea96b44`.

| Finding | Primary source |
| --- | --- |
| F01 | [backend/src/main/java/com/transportplatform/tms/features/billing/application/PaymentService.java](../backend/src/main/java/com/transportplatform/tms/features/billing/application/PaymentService.java#L189) |
| F02 | [frontend/src/features/billing/api/billingApi.ts](../frontend/src/features/billing/api/billingApi.ts#L586) |
| F03 | [mobile/src/screens/NotificationsScreen.tsx](../mobile/src/screens/NotificationsScreen.tsx#L33) |
| F04 | [backend/src/main/java/com/transportplatform/tms/features/organizationportal/application/OrganizationPortalService.java](../backend/src/main/java/com/transportplatform/tms/features/organizationportal/application/OrganizationPortalService.java#L495) |
| F05 | [backend/src/main/java/com/transportplatform/tms/features/auth/application/AuthSessionService.java](../backend/src/main/java/com/transportplatform/tms/features/auth/application/AuthSessionService.java#L40) |
| F06 | [mobile/src/tracking/activeTrip.ts](../mobile/src/tracking/activeTrip.ts#L47) |
| F07 | [backend/src/main/java/com/transportplatform/tms/features/ride/application/RideStatusWorkflow.java](../backend/src/main/java/com/transportplatform/tms/features/ride/application/RideStatusWorkflow.java#L91) |
| F08–F09 | [mobile/app/(driver)/rides/[rideId].tsx](../mobile/app/(driver)/rides/[rideId].tsx#L125) |
| F10 | [backend/src/main/java/com/transportplatform/tms/features/settings/application/CompanySettingsService.java](../backend/src/main/java/com/transportplatform/tms/features/settings/application/CompanySettingsService.java#L75) |
| F11 | [backend/src/main/java/com/transportplatform/tms/features/ride/application/RideService.java](../backend/src/main/java/com/transportplatform/tms/features/ride/application/RideService.java#L136) |
| F12–F13 | [backend/src/main/java/com/transportplatform/tms/features/ride/application/RecurringRideScheduleService.java](../backend/src/main/java/com/transportplatform/tms/features/ride/application/RecurringRideScheduleService.java#L185) |
| F14 | [backend/src/main/java/com/transportplatform/tms/features/dispatch/application/DispatchAssignmentValidationService.java](../backend/src/main/java/com/transportplatform/tms/features/dispatch/application/DispatchAssignmentValidationService.java#L252) |
| F15 | [backend/src/main/java/com/transportplatform/tms/features/driver/application/DriverComplianceSummaryService.java](../backend/src/main/java/com/transportplatform/tms/features/driver/application/DriverComplianceSummaryService.java#L79) |
| F16 | [backend/src/main/java/com/transportplatform/tms/features/auth/application/AuthFacade.java](../backend/src/main/java/com/transportplatform/tms/features/auth/application/AuthFacade.java#L269) |
| F17 | [mobile/src/components/TripTrackingCard.tsx](../mobile/src/components/TripTrackingCard.tsx#L35) |
| F18 | [backend/src/main/java/com/transportplatform/tms/features/notification/application/LoggingNotificationEmailSender.java](../backend/src/main/java/com/transportplatform/tms/features/notification/application/LoggingNotificationEmailSender.java#L16) |
| F19 | [frontend/package-lock.json](../frontend/package-lock.json#L1) |
| F19 | [mobile/package-lock.json](../mobile/package-lock.json#L1) |
| F20 | [frontend/src/features/dispatch/api/dispatchApi.ts](../frontend/src/features/dispatch/api/dispatchApi.ts#L175) |
| F21 | [frontend/src/features/drivers/pages/DriverManagementPage.tsx](../frontend/src/features/drivers/pages/DriverManagementPage.tsx#L92) |
| F22 | [frontend/src/features/rides/components/RideUpsertDialog.tsx](../frontend/src/features/rides/components/RideUpsertDialog.tsx#L184) |
| F23 | [backend/src/main/java/com/transportplatform/tms/features/organizationportal/application/OrganizationPortalService.java](../backend/src/main/java/com/transportplatform/tms/features/organizationportal/application/OrganizationPortalService.java#L141) |
| F24 | [frontend/src/shared/observability/clientTelemetry.ts](../frontend/src/shared/observability/clientTelemetry.ts#L28) |
| F25 | [.github/workflows/ci.yml](../.github/workflows/ci.yml#L46) |
| F26 | [backend/src/main/java/com/transportplatform/tms/common/exception/GlobalExceptionHandler.java](../backend/src/main/java/com/transportplatform/tms/common/exception/GlobalExceptionHandler.java#L126) |
| F27 | [backend/src/main/java/com/transportplatform/tms/features/billing/application/PaymentService.java](../backend/src/main/java/com/transportplatform/tms/features/billing/application/PaymentService.java#L173) |
| F28 | [backend/src/main/java/com/transportplatform/tms/features/riderguardianportal/api/PortalBillingDetailsController.java](../backend/src/main/java/com/transportplatform/tms/features/riderguardianportal/api/PortalBillingDetailsController.java#L33) |
