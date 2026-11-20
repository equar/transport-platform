# Trip delivery evidence

## Operational workflow

This change applies to all rides, including NEMT and dialysis. No completed ride is assumed to be verified merely because of its status.

1. A tenant administrator or dispatcher opens the company ride detail page and verifies pickup and drop-off coordinates against its booked addresses. Coordinates are entered explicitly; there is no automatic geocoder and no inference from the driver location. Each linked outbound/return journey requires its own verification. Changing addresses or rider invalidates the stored verification. Stop coordinates cannot change after any milestone evidence is captured.
2. The assigned driver starts the trip. Arrival, pickup and drop-off capture current device GPS and submit it online. Each milestone requires a fix no older than 90 seconds, no more than 10 seconds in the future, with reported accuracy at most 50 meters. The reported position plus its accuracy allowance must fit within 200 meters of the independently configured stop. The GPS snapshot must belong to this ride, assigned driver and assigned vehicle. Reported mocked locations are rejected by the app and the evidence endpoint.
3. Pickup and drop-off require odometer readings in miles, with at most one decimal place. A drop-off reading cannot be less than the pickup reading. The milestone receipt is consumed once, transactionally with the status transition. Both dispatch and driver status endpoints enforce these checks; dispatch cannot bypass them.
4. After verified drop-off, the rider or an active linked guardian authorized for pickup opens this ride in their own app (mobile or web) and explicitly confirms the delivery. The confirmation is bound to the displayed drop-off evidence ID, authenticated account and rider/guardian scope. A driver account, including an account with both driver and passenger roles, cannot confirm. Confirmation is idempotent and cannot be replaced by another confirmer.
5. The driver refreshes delivery evidence and completes the trip. All three applied milestones and independent confirmation are required. Earnings creation, earnings approval, issuing ride-linked invoice items recheck delivery evidence. A company or driver status change alone cannot establish billability. Draft estimates can still be prepared before a trip; issuing their ride-linked charges requires completed, verified delivery.

Online verification is required for these milestones and completion. These actions are no longer added to the mobile offline queue. A previously queued action without fresh evidence fails safely and requires review; no location or delivery proof is invented during synchronization. Driver tracking continues until the server accepts the drop-off or another terminal trip action.

## Rollout and exceptions

Deploy backend migration V20, the admin/portal frontend and the mobile app together. Older clients cannot submit the new milestone evidence. Before activating the new workflow, verify coordinates for scheduled rides and ensure that the rider or an authorized guardian has working portal access. There is no dispatcher confirmation override and no unattended automatic confirmation. A rider who cannot use the app needs an authorized guardian who can independently confirm the delivery. Otherwise completion and ride-linked financial actions remain blocked pending an explicitly designed exception process.

Existing in-progress rides that lack earlier applied milestones cannot be retrospectively verified by fabricating history. Plan an operational transition before deployment. Previously completed rides without evidence are blocked from new ride-linked billing and earnings approvals. Previously issued invoices, approved earnings and receipts are preserved; they need a separate historical review rather than silent modification. This migration does not declare historical rides verified.

## Audit and limitations

Verified stops, milestone capture, and confirmation record server-side actors and timestamps. Milestone records retain the GPS snapshot reference, measured distance, reported accuracy, odometer, driver, vehicle and address fingerprint. Only authorized accounts can read scoped evidence; driver and recipient identities are resolved server-side. These records and the referenced GPS snapshots should be retained under the organization's approved retention policy.

Device GPS, mock-location flags and odometer readings remain client-reported data. These checks do not provide hardware-backed device attestation, establish an actual driven route, or prevent collusion/account sharing. The independent passenger/guardian confirmation is a separate control against driver-only fabrication. Stop coordinates depend on dispatch verification. No signature/photo is collected because the selected confirmation method is the rider/guardian app.

This implementation does not certify payer-specific Medicaid/DSS claim requirements, implement electronic claims submission, or turn unlinked manual/route invoices into verified ride claims. The deployment must be reviewed against the actual payer contract and operating policy.
