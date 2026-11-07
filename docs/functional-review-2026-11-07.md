# Functional review — backend, web, mobile, and all roles

Implementation follow-up: [delivered fixes, validation, and remaining product work](functional-review-implementation-2026-11-07.md). Findings below describe the review baseline.

Review date: November 7, 2026. Scope: current repository; US passenger transport, including the declared general transport, school, NEMT, dialysis, commuter, ADA paratransit, and shuttle service types.

## Assessment

The platform has substantial administrative and trip-management coverage and a stronger technical foundation than a basic CRUD application: tenant-scoped access services, method authorization, audited changes, optimistic ride versions, atomic dispatch replacement, dispatch serialization, booking/action/payment idempotency, durable exports and push jobs, session isolation, and mobile offline recovery are present. However, broad module coverage does not establish dependable end-to-end transport operations.

The highest priorities are consistent route-to-ride assignment, pooled occupancy, safe lifecycle transitions, executable return trips, and consistent operational time. These affect actual passenger service. Specialized US service types also need explicit workflow policies; selecting a service-type enum does not implement the corresponding operating obligations.

This is a source-based functional review with local automated validation. No authenticated browser walkthrough, physical-device session, live payment, production notification, load test, or production configuration inspection was performed. Findings marked confirmed describe source behavior; inferred risks require scenario execution. Regulatory comparisons are conditional on operator type, jurisdiction, contracts, funding, and covered-entity/business-associate status. This is not a legal compliance certification.

The November 6 review and implementation log were used as context, then current code was checked. Previously repaired recovery, cache isolation, offline persistence, background tracking, atomic assignment, and lead capture issues are not repeated as unresolved defects.

## Validation performed

| Check | Current result | Practical limit |
| --- | --- | --- |
| Web `npm test -- --reporter=dot` | 8 files, 21 tests passed | Component/unit tests do not cover every role journey |
| Web `npm run build` | Passed, including public/admin isolation and indexing checks | Does not prove runtime authorization or accessibility |
| Mobile `npm run test:ci` | 8 suites, 25 tests passed | No device/OS permission or background-execution proof |
| Mobile `npm run typecheck` | Passed | Does not validate native binary behavior |
| Backend `mvn -o -B verify` | Failed: 184 tests reported, zero assertion failures, six errors | Docker environment unavailable for Testcontainers; MySQL migration, concurrency and isolation integration checks are unverified in this run |

No application source was changed. Test/build outputs were regenerated locally. A prior successful integration run documented elsewhere does not replace current verification.

## All-role functional coverage

| Role | Implemented experience | Main gap or required acceptance check |
| --- | --- | --- |
| Platform admin | Web tenant/application management, users, subscription plans, feature flags, roles, audit, transport verification | Prove approval-to-owner-activation and tenant suspension behavior; production delivery and privileged authentication need validation |
| Tenant admin | Web staff, fleet, riders/guardians, rides/routes/dispatch, finance, compliance, incidents, settings/reports | Resolve route assignment inconsistencies; prove setup through first completed and billed trip |
| Dispatcher | Web operational workspace, ride scheduling, resource selection/replacement, exceptions, map, bulk outcomes | Pooled occupancy, route replacement/removal, return legs, no-show and cancellation policies need strengthening |
| Billing admin | Web pricing, invoices, payments, receivables and financial previews | Tenant-local aging; differentiate recorded payment from processor settlement; define refunds/reconciliation if collecting money |
| Compliance admin | Web compliance issues/documents and transport-compliance submission | Revalidate fitness at departure and define service/state-specific evidence; assignment-time checks alone are insufficient operational assurance |
| Driver | Web portal plus mobile rides, actions, routes, vehicle/compliance, notifications/profile; offline queue and tracking | Safe no-show/cancellation, route resource consistency, return-leg execution, handoff evidence and physical-device resilience |
| Rider | Web portal plus mobile booking, trips/tracking, billing, notifications/profile | API cancellation rules exceed mobile restrictions; return trips and time interpretation need end-to-end proof |
| Guardian | Shared web passenger portal and dedicated mobile linked-rider, booking, tracking/billing experiences | Can book but cannot cancel through current API; define delegated permissions and guardian consent/revocation policy |
| Organization user | Web dashboard, contacts, roster, rides, contracts, invoices/payments and notifications | List truncation; mainly oversight rather than trip-request workflow; no mobile role support |
| Viewer | Backend role catalog advertises read-only oversight/reporting | No functional web scope/default workspace or mobile role; role is not a delivered oversight journey |

Mobile explicitly supports driver, guardian and rider in `mobile/src/auth/access.ts`. Other roles being web-only is a product boundary, not automatically a defect. Publish that support matrix. Multi-role users also need an explicit workspace choice: mobile selects driver before guardian before rider, whereas web prefers company administration and suppresses the driver portal for tenant admins.

## Prioritized current findings

### F01 — Route resource replacement does not replace existing ride assignments (high, confirmed)

Evidence: `backend/.../features/route/application/RouteService.java`, `assignCompanyRouteResources`, `syncLinkedRideResourcesFromRoute`, and `applyRouteResourcesToRide`. The helper copies a route driver/vehicle only when the ride field is null. The unassign methods change the route without syncing linked rides.

Scenario: a route and its rides use driver A and vehicle X. Change the route to B/Y. Linked rides retain A/X. Removing the route driver likewise leaves linked rides with the old driver. Drivers and dispatch can see inconsistent assignments, and a removed driver can retain ride access according to ride ownership.

Recommendation: decide whether route assignments are authoritative or explicit ride overrides are allowed. Implement that rule atomically with expected versions, linked-ride validation and clear override indicators. Reject incompatible in-progress changes or use an explicit controlled transfer. Acceptance: replace/remove either resource and verify route, all affected rides, driver manifests, notifications and access agree.

### F02 — Pooled routes bypass conflicts without checking combined occupancy (high, confirmed checks; operational consequence inferred)

Evidence: `DispatchAssignmentValidationService.requireAssignableVehicle` checks one rider plus companions/escort against seats and one wheelchair space. Conflict checks explicitly exclude rides with the same route ID. `RouteService` synchronizes individual rides; no combined per-segment seat/wheelchair calculation was found in these paths.

Scenario: two overlapping wheelchair rides share a route whose vehicle has one wheelchair position. Each ride passes its individual capacity test. Similar overbooking is possible for seats.

Recommendation: derive occupancy from pickup/drop-off stop events and enforce both seats and wheelchair positions at each segment, including companions and attendants. Validate resource changes and stop reorders too. Acceptance: allow sequential non-overlapping riders, reject simultaneous excess occupancy, and test concurrent additions against MySQL.

### F03 — Self-service cancellation can terminate a trip after boarding (high, confirmed)

Evidence: `RideStatusWorkflow.ensureCanCancel` rejects only CANCELLED and COMPLETED. `RiderGuardianPortalService.cancelRide` uses that shared rule. Mobile restricts the cancel button to REQUESTED/PENDING_REVIEW/SCHEDULED/ASSIGNED, but the API accepts later states including PICKED_UP and DROPPED_OFF. Other terminal exception states can also be changed into CANCELLED.

Impact: a direct API request can rewrite the operational meaning of a transported passenger's trip, with consequences for tracking, support, reporting and billing.

Recommendation: explicit transition matrix per actor; rider cancellation limited to allowed preboarding states and policy cutoff; operational abort/failed-trip workflow after boarding with disposition and reason. Preserve terminal outcomes and financial evidence. Acceptance: test every role × status × action directly against the API, including idempotent repeat requests.

### F04 — No-show can be declared before arrival (high, confirmed)

Evidence: `RideStatusWorkflow.ensureCanMarkNoShow` permits ASSIGNED as well as ARRIVED; the driver service uses it to record RIDER_NO_SHOW. No minimum dwell/contact proof is enforced by that transition.

Impact: an assigned trip can become a rider no-show without evidence the vehicle reached the pickup location. This can misattribute missed service and drive incorrect fees or sanctions.

Recommendation: tenant/service-specific arrival, waiting and contact policies; timestamped arrival, contact attempts, reason and authorized override. Location should support review without being the sole proof. Distinguish operator failure from rider no-show. Acceptance: prevent prearrival no-show except documented dispatcher override; retain evidence for disputes.

### F05 — Round-trip booking data does not provide a separate executable return lifecycle (high, design gap)

Evidence: `Ride` holds outbound and return times but one driver, vehicle and status. Driver actions follow a single ASSIGNED → en route → arrived → picked up → dropped off → completed progression. Mobile navigation selects the original drop-off after pickup. Dispatch reserves through return drop-off, but there is no separate leg assignment/status in the reviewed model.

Impact: collecting return times alone does not let dispatch assign a different return driver, represent a dialysis will-call pickup, or independently track and complete both directions. Treating the whole day as one reservation may also consume resources unnecessarily.

Recommendation: parent booking with independently executable outbound/return legs, each with stops, schedule/window, resources, events, fare allocation and tracking; model scheduled versus will-call return explicitly. Acceptance: complete outbound, retain return on the manifest, use another driver, activate will-call return, and verify independent notifications/billing. Until delivered, clearly explain the supported round-trip operating procedure.

### F06 — Viewer role has no usable application journey (medium, confirmed)

Evidence: `RoleName` and `RoleCatalogService` include and describe ROLE_VIEWER; web `auth/access.ts` excludes it from company workspace and falls back to `/login`. `AppRouter` excludes it from company allowed roles; mobile has no viewer mapping. Repository search found no backend role use beyond the catalog/enum.

Recommendation: implement a narrowly scoped read-only workspace with corresponding endpoint permissions and safe exports, or stop offering the role until supported. Acceptance: viewer can sign in and see approved reports, while all mutation endpoints remain forbidden.

### F07 — Organization oversight silently truncates ride results (medium, confirmed)

Evidence: `OrganizationPortalRidesPage.tsx` requests size 25, stores only `items`, and has no page/total control. Similar absence of pagination controls was found in organization roster/billing pages and should be checked against their response sizes.

Impact: users cannot reliably locate later rides in larger rosters; the page can appear complete despite omitted records. Its status filter also omits operational states such as en route, arrived, picked up and failed.

Recommendation: server pagination with totals, date/rider filters, all meaningful statuses and preserved list context. Acceptance: a tenant with 60 rides can reach all records and filter active/problem trips. Distinguish empty, failed and forbidden loads.

### F08 — Timezone handling remains inconsistent outside booking validation (medium/high, confirmed)

Evidence: `ClockConfig` supplies UTC. `InvoiceService` and `PaymentService` use `LocalDate.now(clock)` for effective invoice status/aging. Shared web `formatDateTime` and mobile `formatShortDateTime` parse schedule strings with `new Date` and use the device timezone; mobile `timeUntil` treats zone-less local schedules as device-local instants. `Ride` schedules remain LocalDateTime.

Scenario: a New York invoice can become overdue at UTC midnight before the company's local date changes. A dispatcher or guardian traveling across zones can misinterpret trip times or countdowns. Prior tenant-zone booking validation does not resolve these display/calculation paths.

Recommendation: distinguish instants, tenant-local schedule times and date-only financial fields; provide zone/offset in contracts and show the service timezone. Apply tenant-local accounting dates consistently. Acceptance: tenant New York, server UTC, device Los Angeles; test midnight, DST transitions and date-only invoice fields.

### F09 — Logging delivery providers report success without delivery (high deployment-dependent risk)

Evidence: `application.yml` defaults email/push providers to logging; production profile does not override them. `LoggingNotificationEmailSender` and `LoggingNotificationPushSender` return successful DeliveryResult after logging. Real delivery can be configured, so this is not proof production is misconfigured.

Impact: recovery and operational messages may appear successful while no email/push reaches a person.

Recommendation: fail production startup or readiness when a required channel uses a logging adapter; identify simulated delivery explicitly. Validate provider acceptance, downstream receipts, invalid-token removal, retry and fallback contact. Acceptance: actual signed-out recovery and trip-change delivery with configured production-like providers.

### F10 — Guardian can book but cannot cancel the booking (medium, confirmed policy asymmetry)

Evidence: rider portal controller permits RIDER/GUARDIAN creation but RIDER-only cancellation; service also rejects guardian cancellation. Guardian mobile detail provides tracking/support without cancellation.

This may be intentional, but the product must explain the policy. For a dependent who cannot operate the rider account, an accidental booking requires staff intervention.

Recommendation: relationship-level delegated booking/cancellation permissions with revocation and audit, or clearly expose a cancellation-request-to-dispatch path. Do not grant all linked guardians unrestricted rights. Acceptance: permitted guardian can cancel an eligible booking; unauthorized/revoked guardian cannot act or read stale private data.

## Backend functional and engineering priorities

- Revalidate driver/vehicle operational eligibility at departure. Existing assignment checks and warning computation are useful, but expiry or out-of-service changes after assignment require a clear dispatch block/escalation policy.
- Keep payment recording distinct from processing. `PaymentService` records/applies ledger entries; no processor integration or complete refund/dispute lifecycle was found in the reviewed billing paths. This is adequate for manual receivables if labeled accurately. For in-app collection, add tokenized processor checkout, verified idempotent webhooks, settlement/reconciliation, refund/chargeback states and receipt semantics.
- Make service eligibility explicit: contract validity, service-area coverage, operating hours, booking cutoff, required assistance, payer authorization and appointment arrival deadlines. Do not rely only on a service-type label or free-text instructions.
- Preserve domain outcomes. Driver route-stop synchronization maps COMPLETED, NO_SHOW, MISSED, FAILED and CANCELLED rides to RouteStopStatus.COMPLETED. If this means processing finished, expose the distinct ride outcome alongside it and prevent reporting from counting all as successful transports.
- Retain current tenant isolation, authorization, durable jobs and idempotency controls. Expand negative tests for direct object IDs, linked guardians, organization roster/billing, exports and assignment transfer. OWASP specifically identifies object-level authorization as a core API risk: [OWASP API1](https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/).
- Add privileged MFA/SSO as a security improvement; no MFA/TOTP flow was found in reviewed auth sources. Verify invite activation, recovery revocation, account suspension, session expiry and feature-entitlement downgrade end to end.
- Establish realistic dispatch/export latency and load budgets. Current tenant-wide dispatch serialization protects assignment races but can become a contention point; measure before changing it.

## Web functional priorities

- Keep the exception-led dispatch work already implemented, and attach resolution ownership, passenger impact and an explicit next action to late/unassigned/stale-location cases.
- Render server-authorized next actions consistently across web/mobile, especially cancellation, no-show and return legs. Generated schemas and driver action metadata are useful foundations, but do not cover every workflow.
- Complete organization navigation through all paged data and provide actionable trip detail. If organizations should request trips, add an authorized request/approval flow; current organization controller is primarily read endpoints plus profile update.
- Make onboarding a proven business journey: company application → approval → owner activation → compliance → staff/fleet/rider → dispatch → completion → invoice/payment.
- Test keyboard focus, dialog errors, zoom, narrow dispatch layout and screen readers. Use WCAG 2.2 AA as an engineering target; passing a build is not accessibility verification. [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/).

## Mobile functional priorities

- Physical iOS/Android validation is mandatory evidence for background location, device lock, external navigation, foreground service, permission denial/revocation, battery restrictions, force-stop/relaunch and expired sessions. The tracking implementation is present; its existence does not guarantee OS delivery.
- Test offline trip completion after server commit but lost response, restart, concurrent enqueue/replay, terminal failure/manual retry, and account change. Current queue improvements should be preserved.
- Ensure route transfers remove old assignments and tracking access; reflect changed trip status while backgrounded and when push arrives.
- Show service-zone time, current destination, assistance needs and one clear next action. Separate future return legs from completed outbound legs.
- Verify VoiceOver/TalkBack, text enlargement, touch targets, contrast, password controls and date pickers with actual users. W3C minimum web target size has exceptions and is not the same as a recommended native touch size; use generous native targets. [W3C target-size explanation](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum).
- Provide explicit workspace selection for users with multiple supported roles, or document role precedence. Keep web-only roles accurately described on mobile's unsupported-role screen.

## US transport-service benchmark and conditional gaps

| Service profile | Capabilities to establish before claiming readiness | Current assessment |
| --- | --- | --- |
| General/shuttle/commuter | Reliable manifests, capacity per segment, assistance, dispatch communications, incident handling, driver/vehicle suitability, clear cancellation and fare rules | Broad foundation; route consistency and pooled capacity are immediate blockers for dependable pooled service |
| ADA complementary paratransit | Eligibility and accessible reservation/support, origin-to-destination assistance, service area/hours, next-day reservation policy, pickup negotiation/windows, applicable fare rules and capacity-constraint monitoring | Enum, wheelchair and escort fields are not a complete paratransit policy engine; eligibility, denial/missed-service and policy evidence need separate design/verification |
| NEMT/dialysis | Payer/broker/state-specific eligibility/authorization, appointment deadline, mobility level, will-call return, service evidence and claim/reconciliation workflow where required | Basic booking and finance exist; no complete broker/claims lifecycle established by this review |
| School/minor transport | Authorized adult relationships, pickup/drop-off handoff, exception escalation, school calendars, recurring schedule exceptions, confidentiality and applicable vehicle/operator rules | Minor guardian authorization is checked at booking; no structured recipient verification/handoff workflow was found in reviewed driver action/event paths |
| Interstate passenger operations | Applicable carrier authority, driver qualification, duty/drive limits, inspection/maintenance and record controls | Transport compliance/documents help; duty-history and HOS enforcement were not found in reviewed dispatch/driver workflows |

These are conditional product requirements, not assertions that every operator is governed by every rule:

- FTA Part 37 describes complementary paratransit criteria and related obligations; determine which provisions apply to the actual service. [FTA Part 37](https://www.transit.dot.gov/regulations-and-guidance/civil-rights-ada/part-37-transportation-services-individuals-disabilities) and [origin-to-destination guidance](https://www.transit.dot.gov/regulations-and-guidance/civil-rights-ada/origin-destination-service).
- Medicaid NEMT arrangements vary by state and delivery model. Configure payer/state requirements rather than claiming one universal US claims workflow. [CMS transportation coverage guide](https://www.medicaid.gov/federal-policy-guidance/downloads/smd23006.pdf).
- FMCSA applicability depends on interstate operations, compensation, vehicle characteristics and exemptions. Where passenger HOS applies, include duty history rather than checking trip overlap alone. [FMCSA applicability](https://www.fmcsa.dot.gov/safety/passenger-safety/guidelines-and-driver-qualifications-motor-carriers-passengers-parts-390-391) and [passenger HOS](https://www.fmcsa.dot.gov/safety/carrier-safety/hours-service-motor-carriers-passengers).
- HIPAA applicability must be assessed for the actual entity/relationship and data flow. When applicable, establish minimum-necessary access, agreements, retention and incident response; tenant filtering alone is insufficient. Even outside HIPAA, protect sensitive trip destinations and assistance notes. [HHS minimum necessary](https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/minimum-necessary-requirement/index.html).

## Recommended delivery and acceptance sequence

| Priority | Work | Completion evidence |
| --- | --- | --- |
| P1: dependable trips | F01–F05; departure eligibility; distinguish transport failure from no-show | MySQL tests for route transfer and pooled occupancy; API role/status matrix; demonstrated outbound and return execution |
| P1: trustworthy production operation | Validate F09, provider setup and recovery; run unavailable integration checks | Actual email/push receipt scenarios; full backend verification with Docker/MySQL; physical-device tracking/offline trial |
| P2: role completeness | Viewer decision, organization pagination, guardian delegation, multi-role workspace | All ten roles have either a tested supported journey or a documented unavailable boundary; 60+ record navigation |
| P2: financial/time correctness | F08; manual-ledger versus online-payment scope; reconciliation/refund requirements | Cross-zone midnight/DST tests; ledger reconciliation; no misleading payment/delivery status |
| P2: service specialization | Per-tenant ADA/NEMT/school/interstate operating profile | Representative operator signs off on configured policies and complete exception journeys |
| P3: measured usability/scale | Accessibility, representative data, operational metrics and load | Screen-reader/device QA; booking completion and assignment task measurements; latency/error/backlog baselines |

Minimum release scenario set: application approval/activation; each role login and forbidden actions; cross-tenant IDs/exports; full one-way and two-leg trips; route replacement/unassignment; pooled wheelchair/seat capacity; late/no-show/cancel/failed-trip handling; guardian revocation; offline uncertain-response replay; expired credentials; unavailable tracking/provider; recurring holiday exceptions; invoice aging/payment correction; accessible non-map trip/support journey.

Track on-time pickup and appointment arrival, operator-missed versus rider-no-show rates, stranded return trips, stale location age, unsynced-action age, assignment conflicts, recovery completion, notification failure, invoice disputes and support demand. Establish baselines before setting numerical service-level targets.
