# Tenant admin information and history review

Reviewed the tenant dashboard and driver, rider, guardian and ride detail pages against their API response records, persisted profile fields, relationship workflows, document records, ride events and audit records.

## Findings fixed

| Area | Finding | Result |
| --- | --- | --- |
| Dashboard | Only the first 12 configured metrics rendered; most operational and billing metrics were silently discarded. | All summary metrics are reachable in labelled groups. The primary cards show rides, rides in progress, active drivers and active riders. |
| Guardians | No guardian metrics in the dashboard response. | Tenant-scoped total, active and suspended guardian counts added. |
| Drivers | Birth, hire and start dates, availability, qualification expiry dates, training completion and creation metadata omitted. | Saved fields shown on the driver record; full names include middle names. |
| Riders | Gender, organization reference, guardian count and middle name omitted; date-only birth dates could shift a day. | Fields shown and date-only rendering corrected. |
| Guardians | Middle name and linked-rider count omitted from record summary. | Both shown. Existing links, permissions and relationship controls retained. |
| Rides | Quote and contract code omitted; no direct rider/guardian navigation from the service context. | Quote and contract code shown, with links to rider/guardian records. |
| Historical assignments | Assigned drivers/vehicles were resolved only from the first page of active, eligible dispatch options. Inactive historical assignments appeared blank. | Assigned records fetched by ID independently of dispatch eligibility, with direct driver, vehicle and route links. Failed detail lookups show the stored reference rather than an empty assignment. |
| Record history | No record-level activity trail or paginated trip history. | Driver, rider and guardian details have paginated ride history; all four detail pages have administrator-only activity history and before/after audit values. |
| Related activity | Exact-record history could otherwise miss document, relationship and previous-assignment events. | Tenant-scoped matching includes direct entity references and owner IDs in old/new audit snapshots. Removed links and previous assignments remain discoverable when recorded. |
| Guardian trips | Filtering only by an explicitly named ride guardian misses linked riders' trips. | History includes currently linked riders' trips and rides explicitly naming the guardian. |
| Audit filters | Filter options covered mainly onboarding, not the operational/financial modules. | Operational modules/actions added; searchable free-entry filters allow other recorded modules/actions. UTC date-filter labels, request-race protection and retry added. |
| Audit retention of detail | Several saved profile and ride edits were absent from change snapshots. | Future snapshots retain additional saved profile, accessibility, contact, qualification, document, address, quote, assignment and operational fields. Mobility-needs collections are copied before edits. |
| Partial failures | A document, event, location or lookup failure could hide an otherwise valid driver/ride record. | Main records remain visible; supporting failures have explicit retryable errors. |
| Narrow screens | Wide history tables and pagination clipped important controls. | History uses cards on narrow screens, with wrapping pagination. Desktop tables retain horizontal scrolling where necessary. |

## Verification

- Frontend regression coverage includes previously hidden dashboard metrics, exact history filters, pagination, before/after audit values, role restrictions, retry, partial-service failures and inactive historical assignments.
- MySQL integration tests cover tenant isolation, exact numeric IDs, direct and related old/new audit owners, malformed legacy JSON, removed guardian links, stable pagination, and guardian-linked rider trip history.
- Backend unit/integration suite and frontend tests/build checks were run; final results are recorded in the task response.
- Playwright rendered the dashboard and all four detail pages at 1440px and 390px using **synthetic fixtures and mocked APIs**. `visual-verification.json` records page-overflow and browser-error checks. Screenshots in this folder contain synthetic data only.

## Historical data limits

Existing audit records are displayed as recorded. Details never captured in an old audit event cannot be reconstructed retroactively. Current trip associations and historical assignment changes are labelled separately: previous assignments remain in Activity History when their audit event exists. Current relationship lists show current links; link/unlink history is available in Activity History.

This was a source, database-test and synthetic-browser review, not a reconciliation against live production records. Deploy the backend and admin frontend together for the new counts and history APIs.
