# Subscription access and capacity

Commercial authorization is read from the database for login, refresh, every authenticated tenant API request, service-level current-user access and queued report-export partitions. It is not embedded in JWTs or dependent on scheduler timing. Platform accounts remain able to restore a company. Logout remains available. Tenant approval/security status is a separate control and must also be ACTIVE; commercial reactivation never overrides a security suspension.

The latest effective subscription (start date, then ID) is authoritative, across all statuses. Missing subscriptions, future-only subscriptions, suspended/cancelled/expired subscriptions and ACTIVE subscriptions without a renewal or term-end date fail closed. An older ACTIVE row cannot restore access after a later cancellation.

All dates use UTC, matching platform subscription billing:

- Effective end is exclusive: access stops at the start of that date.
- Trial end is inclusive: access stops on the following date unless renewal converts the trial.
- Renewal date is inclusive: access stops after that date until renewal is processed and advances the date.
- An unpaid ISSUED platform subscription invoice blocks access after its due date. Tenant transport invoices do not affect SaaS access.

A lifecycle worker runs every 15 minutes (`app.subscription-access.interval-ms`, initial delay two minutes). It persists term expiry, unmanaged trial/renewal expiry and suspension for overdue platform invoices, disables billing for terminal/suspended accounts, revokes tenant sessions and audits transitions. Managed renewal accounts remain recoverable by the renewal job: while delayed, request-time access is blocked, but the lifecycle worker does not expire the account merely because the next invoice job is late. The lifecycle worker is independent of `app.subscription-billing.enabled`.

After non-payment suspension, the platform admin records the payment, extends dates if necessary, and explicitly activates the subscription. Activation rejects overdue balances and invalid dates, and resumes previously configured billing when rate and next-renewal data exist. Payment does not automatically undo an administrator's suspension. Subscription update, suspend and cancel paths revoke sessions when removing access.

## Plan limits

`maxUsers`, `maxDrivers`, `maxVehicles`, `maxRiders` and `maxOrganizations` count **all retained records for the company**, including inactive, suspended and pending records. Zero allows none. Platform user creation for a tenant and owner provisioning consume user capacity; platform-only accounts do not. Owner provisioning can run while the company is PENDING, but still requires an effective, eligible subscription and available user capacity.

Every production creation path checks capacity while holding the company's database row lock through insertion. Current locking reads prevent two concurrent requests from taking the same final slot. Authorization inside write transactions takes the tenant lock before reading subscription state, so it cannot establish an old read snapshot ahead of financial locks. Failed creations roll back without consuming a slot. Updates/reactivation do not add records. Lowering a plan cap retains existing records and blocks new creation; it never deletes company history. Driver subscription invoices continue to meter ACTIVE drivers at renewal, independently of these record caps.

Only production service paths are covered; direct SQL/database operators must enforce the same commercial rules. There is no public bulk-import path bypassing these checks.

## Deployment

V23 adds nonnegative capacity constraints and access-query indexes. It does not invent subscription payments, dates or historical evidence. Companies with missing subscriptions or missing ACTIVE renewal/end configuration will be blocked until the platform admin configures them. Fresh company provisioning sets an initial renewal one month after its effective start; configuring per-driver billing synchronizes that date with its configured next renewal.

No compatibility fallback grants access to tenants lacking a valid subscription. No production database or deployment has been changed by this implementation.
