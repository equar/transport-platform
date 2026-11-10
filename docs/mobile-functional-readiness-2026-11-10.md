# Driver, rider, and guardian functional review

Date: November 10, 2026

The application was reviewed as a tenant-assigned transport service. Riders and guardians do not create bookings. Tenant business names and the fixed mobile palette remain in place.

## Findings fixed

| Area | Gap found | Result |
| --- | --- | --- |
| Assignment model | Hiding the mobile request page did not prevent direct calls to the legacy creation endpoint. | The rider/guardian creation endpoint denies requests, and its service refuses creation. Dispatch/tenant creation and assignment are unchanged. |
| Driver actions | Online transitions did not send the displayed status, and offline actions were queued without confirmation. | Online requests send the expected status; offline actions require confirmation and retain their scoped idempotency keys. Successful changes refresh dashboard, route, and trip queries. |
| Driver notes | The backend/web supported trip notes, but mobile had no entry point. | Drivers can save scoped trip notes. Failed saves preserve the draft, and offline notes are not falsely reported as saved. |
| Tracking stop | Drop-off did not immediately stop mobile sharing; viewing an old trip could stop another active trip's tracking. | Stops are scoped to the exact ride, tenant and user; drop-off stops sharing immediately. |
| Tracking races | A GPS callback could complete after tracking stopped or after ownership changed. | Native and foreground updates check tracking generation and owner before uploading. Revoked assignment access stops sharing. |
| Location visibility | Rider/guardian reads could return the previous driver's snapshot after reassignment, or a historical position outside an active journey. | Reads require scoped ride access, an active sharing status and the current assigned driver. |
| Rider/guardian status | Trip status could remain stale until manual refresh, while guardian location requests continued for finished trips. | Active trip details refresh automatically. Location requests are gated by scoped access and active sharing status; failures are surfaced explicitly. |
| Web history/pagination | Delayed active trips appeared in history; rider/guardian pages stopped after their first batch of records. | History uses finished statuses, and trip/history pages expose server pagination. |
| Web details | Invalid links could load indefinitely; cached details could remain after access failure. | Invalid IDs produce an actionable error; failed scoped refreshes clear the old record and expose retry. Driver actions guard stale statuses and duplicate submissions. |
| Document upload | Providers omitting image MIME metadata were treated as PDF uploads. | JPEG/PNG/PDF MIME types are inferred from the filename when provider metadata is absent or generic; server validation remains authoritative. |
| Native lifecycle | Browser defaults did not connect React Query to native app/network state. | Background/offline polling pauses and resumes through AppState and NetInfo. |
| Password recovery | Mobile/web validation differed, and DTO-valid passwords beyond bcrypt's byte capacity could cause encoder exceptions. | Clients enforce the same capacity and show usable validation. All password-creation paths guard encoder capacity; overlong login inputs fail authentication safely. Hash format and existing passwords are unchanged. |
| Web type checking | The typecheck script ran against an empty references-only root and did not actually check application files. | The script now checks both application and Vite configurations explicitly; production builds also validate both site bundles. |
| Regression suite | A header assertion no longer matched the committed page-title behavior. | The expectation now matches the existing title contract; no header redesign was introduced. |

## Role coverage

| Role | Reviewed workflows and evidence |
| --- | --- |
| Driver | Tenant-scoped sign-in, required password change, assigned trips and routes, status transitions, offline replay/conflicts, trip notes, tracking, vehicle ownership/assignment, profile visibility, compliance document metadata/uploads, alerts and sign-out. Existing and new tests cover assignment ownership, transitions, upload validation, idempotency and tracking cancellation. |
| Rider | Own trip list/details/history, live status/location boundaries, allowed cancellation, profile, invoice/payment records, notifications, recovery and sign-out. Server scope remains authoritative. |
| Guardian | Active linked-rider access, relationship revocation, linked trip visibility, active location sharing, scoped billing records and notifications. Guardian mutation restrictions remain in place. |
| Tenant/admin web | Existing assignment and document-review workflows remain intact. Shared portal status, pagination, recovery and action handling were checked against the same backend endpoints. |

Accounts must be provisioned with the matching tenant and operational portal profile. This review does not introduce combined portal identities or a new booking workflow.

## Automated verification

- Mobile: TypeScript passed; **60 tests across 22 suites passed**.
- Web: TypeScript passed; **45 tests across 18 suites passed**.
- Backend: **233 tests passed, zero failures/errors/skips**, including all existing isolated MySQL/Testcontainers integration tests and schema migrations.
- Changed mobile TypeScript files pass ESLint; `git diff --check` passes.
- Android release packaging passed. Emulator installation is a launch smoke check, not a substitute for physical-device field testing.

The initial sandboxed backend run could not access Docker. The final backend run used isolated Docker test databases and passed; production records were not used for mutation testing.

## Production completion gates

1. **Android push configuration:** this checkout has no `google-services.json` for `com.bakaroo.transport.app`. An Expo project is configured, but the Firebase Android client configuration is still required. The Firebase project was requested from the owner. In-app alerts remain available; physical Android push delivery is not certified.
2. **Physical devices:** verify notification delivery/taps and foreground/background location permissions on a physical Android phone and iPhone, including app backgrounding, navigation, permission revocation, drop-off and sign-out. Unit tests cover callback ownership and cancellation, but do not prove operating-system delivery behavior.
3. **Deployment:** backend and web corrections must be deployed before production users receive those server/web changes. Local tests and APK installation do not deploy them. No production deployment was performed by this review.
4. **Provider verification:** confirm production reset-email delivery, Expo push-provider credentials/settings and map availability with the intended operational accounts. No email/push-provider credentials were invented or replaced.

The code fixes and automated checks are complete. A claim of fully production-ready mobile delivery remains conditional on these environment and physical-device checks.
