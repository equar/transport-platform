# Functional review implementation — November 7, 2026

This patch addresses confirmed defects from [the functional review](functional-review-2026-11-07.md). It does not deploy, send customer communications, change existing bookings/prices, or claim regulatory certification.

## Delivered behavior

| Review finding | Implementation and boundary |
| --- | --- |
| F01: route/ride consistency | Route resources are authoritative for linked rides. Replacing/removing a driver or vehicle updates linked ride assignments transactionally under the existing tenant dispatch lock. Removing a ride clears inherited resources and returns it to scheduled. Changed assignments are recorded in ride events; new assignment/status notifications are published. Started or terminal rides cannot have resources silently replaced. Direct per-ride dispatch edits are rejected while linked to a route. |
| F02: shared capacity | Shared-route checks include concurrent rider, companion, escort and wheelchair occupancy. Capacity is reusable at drop-off/pickup boundaries. Cancelled/failed/missed/no-show/completed trips do not consume planned capacity. Missing drop-off times reserve capacity conservatively. Planned stop extensions reserve the union of booked/planned windows until times agree. Checks cover vehicle assignment, route start, ride edits, stop-time edits and stop reordering. |
| F03: cancellation | Only DRAFT, REQUESTED, PENDING_REVIEW, SCHEDULED and ASSIGNED trips can be cancelled. Departed and terminal outcomes cannot be rewritten as cancellations. Editing is likewise restricted to pre-departure trips. Web actions match those rules. Mobile cancellation now collects and sends the required reason and refreshes related account data. |
| F04: no-show | Both company and driver paths require ARRIVED before a no-show. Web/mobile no longer offer no-show from ASSIGNED. All lifecycle states are covered by transition regression tests. A configurable dwell/contact/override policy remains a separate operating-policy feature. |
| F05: round-trip operating limits | Existing booking/pricing data is preserved. Web/mobile round-trip booking explicitly explains the shared assignment/status and recommends two one-way rides when return assignment/tracking must be independent. This is disclosure and an existing supported workaround, not a two-leg data-model implementation. |
| F06: viewer | Role catalogs mark VIEWER non-assignable; account creation/update rejects it. Existing unsupported web identities reach an access explanation instead of returning to login. Mobile unsupported roles reach the existing web-portal/sign-out screen instead of looping through login. No administrative permissions were added. |
| F07: organization lists | Rides and roster use server totals and page controls. Invoices and payments have separate page controls and filter resets. Ride status filters include operational/exception states; payment filters use actual server enum values. Load errors do not also claim that the result set is empty. Date-only organization billing fields retain their calendar day. |
| F08: operational time | Tenant-local financial dates are used in invoice/payment/receivables and passenger/organization portal calculations. Driver operational days and document display decisions also use the tenant date. Shared web/mobile formatting preserves zone-less schedule wall times, labels the service zone and avoids treating them as device-local instants. Mobile countdowns resolve against the tenant zone; when that zone is unavailable they show an explicit service-local label instead of inventing a countdown. |
| F09: simulated delivery | Production startup rejects logging/default email or push providers. Local/dev logging remains available. Configure real providers before deploying this patch to production. |
| F10: guardian cancellation | The existing rider-only cancellation authorization is retained. Guardian mobile trip details explicitly direct users to the configured provider support action for changes/cancellation. Delegated cancellation rights were not added without a corresponding permission model. |

Additional defects found while implementing:

- Portal booking's event writer incorrectly required staff privileges. Event creation now records the already-authorized workflow actor and enforces matching actor/ride tenants; company event-reading authorization is unchanged. Rider and guardian audit writes and cross-tenant rejection are regression tested.
- Guardian ride detail, location and search now require an active rider relationship. A historical guardian assignment no longer bypasses relationship revocation. New trip notifications likewise select active linked guardians rather than automatically including the historical assignment. Existing legitimately delivered notification history is not erased.
- Departure through driver/company workflows requires both assigned resources and rechecks current activity, compliance, dispatch approval, conflicts and vehicle capacity. Assignment alone no longer establishes fitness to depart indefinitely.

## Verification

Final validation:

- Backend `mvn -f backend/pom.xml -o -B verify`: passed **213 tests**, zero failures/errors, and packaged the runnable JAR. Includes isolated MySQL migrations, tenant/session boundaries and assignment concurrency.
- Additional final `RideRepositoryMySqlIntegrationTest` run: **4 tests passed**, including the newly added persisted pooled-capacity/reuse case (the other three also ran in the full suite).
- Web: production public/admin builds and isolation/indexing checks passed; **28 tests passed** across 11 files.
- Mobile: TypeScript checking passed; **30 tests passed** across 9 suites.
- Regenerated OpenAPI client contracts: no changes to the checked-in schemas.
- `git diff --check`: passed.

Tests exercise lifecycle-state matrices, route resource replacement/removal, departed-passenger protections, pooled wheelchairs/seats/companions/escorts, conservative unknown/planned durations, tenant midnight/DST, unsupported roles, organization pagination, portal event authorization and guardian revocation.

The full backend suite uses isolated MySQL Testcontainers. Initial sandbox-only runs could not reach the Docker socket; granting the required test execution access made Docker available. One integration fixture was updated to include a vehicle and the new validation dependency because departure now explicitly requires both resources. That fixture's purpose remains real persistence, idempotency and auditable lifecycle transitions; compliance/availability decisions are a separate service boundary.

## Release and operating notes

- No database migration or new native permission/module is introduced.
- Production must configure `APP_EMAIL_PROVIDER=microsoft-graph` and `APP_PUSH_PROVIDER=expo`, together with their existing credentials/settings. Missing real delivery configuration now fails startup intentionally. Test actual reset email and trip delivery before release.
- Route-linked rides must be reassigned through their route. Remove a pre-departure ride first to give it an independent assignment. Removal clears inherited resources, so dispatch must assign new ones explicitly.
- Drivers cannot depart without a vehicle, or mark no-show without recording arrival. Active-trip disruption uses the existing failed-trip/dispatch support workflow.
- Shared-capacity validation is intentionally conservative for unknown duration and mismatched planned/booked times. Supply accurate pickup/drop-off times rather than assuming capacity is available.
- Tenant timezone changes continue to reinterpret existing zone-less stored schedules. Historical schedule-zone snapshotting and a coordinated migration to richer time contracts remain separate work.

## Explicitly remaining

1. **Independent round-trip legs and will-call return.** Existing pricing rules distinguish ROUND_TRIP, so converting stored rides into separate chargeable records would change billing and recurrence semantics. Implement a booking/leg relationship, fare allocation, cancellation propagation and legacy-data migration together, with migration tests and operator acceptance. This patch does not silently double fares or rewrite customer bookings.
2. **Delegated guardian permissions.** Define booking ownership, relationship-level cancellation authority, consent and revocation before exposing direct guardian cancellation. Provider support is the available path in this patch.
3. **Viewer product and multi-role workspace selection.** Viewer remains reserved, rather than inheriting sensitive reports. Existing role precedence is retained for supported multi-role accounts.
4. **Service-specific product expansion.** ADA eligibility/service policies, NEMT broker/claim integration, school handoff evidence, applicable HOS, privileged MFA/SSO, processor settlement/refunds and configurable no-show dwell/contact evidence require additional workflows and operator-specific policy choices. The review's conditional US applicability guidance still applies.
5. **External verification.** Physical iOS/Android background/offline/accessibility testing, authenticated operator/rider walkthroughs, real provider delivery, representative load and production configuration verification remain necessary. Automated success does not substitute for these.
