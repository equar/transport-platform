# Bakaroo per-driver subscription billing

## Confirmed policy

Companies pay a platform-admin-configured USD price per active driver per month. Drivers are counted at the monthly renewal boundary. Mid-cycle additions, suspensions and terminations affect the next renewal; there is no proration. Billing uses UTC and an anniversary day, preserving month-end anchors (January 31 → February 28 → March 31).

Platform subscription invoices are separate from the existing transport-service billing module. Legacy subscription-plan monthly/annual flat prices are not used by this per-driver calculation. The authoritative per-driver price is the billing account configuration, with dated rate revisions.

## Activation

1. Provision a company with an existing active subscription plan. Provisioning creates its tenant subscription and a disabled billing account atomically. Existing companies with a matching active plan are backfilled by migration V19; unmatched plan codes need administrator correction and subscription creation.
2. Open **Platform administration → Subscription Billing → Configure billing**. Set the USD rate, first renewal date, payment due days and Manual collection mode. Enable scheduled monthly invoicing when the commercial terms are agreed. No default commercial rate is invented.
3. The first date cannot be backdated. For today, the initial metering instant is the configuration instant; future dates use midnight UTC. A paid trial must first renew the day after its trial end date. The anchor is fixed after configuration.
4. The worker issues due invoices automatically; **Generate due renewal** can issue one due cycle on demand. Companies can view their own account, invoices and receipts through **Finance → Platform Subscription**. Only platform admins can change billing or record received payments.
5. Record funds already received using a unique bank/receipt reference. Partial receipts are supported; overpayment is rejected. Repeating the same reference and amount for the same invoice is idempotent. This action never charges a card or bank account.

## History and safeguards

Invoices preserve company/plan names, billed driver IDs and count, USD rate, period, due date and total as issued. Driver status intervals retain the renewal-time count even when processing is delayed. Price changes apply to a future renewal boundary; overdue periods keep their historical rate. Migration establishes the initial status baseline and does not infer earlier driver history.

Row locks and a unique subscription/period constraint prevent duplicate renewal invoices across concurrent workers. Receipt references are unique per source. Company reads derive tenant scope from the authenticated identity. Configuration, invoices, payments and trial expiration are audited.

Disabling invoice generation pauses processing; it does not waive outstanding periods. Re-enabling can generate deferred invoices. Cancelling, suspending or expiring a subscription disables its billing account. Issued balances remain visible. Unconverted trials expire automatically. Overdue balances restrict new company operations. Tenant and billing administrators can review subscription invoices, and drivers can finish assigned trips already in progress. Settlement restores authorization without persisting a payment-related administrative suspension. Manual suspensions, cancellations and expired terms still require administrator action.

## Scheduler

`app.subscription-billing.enabled` defaults to true, `app.subscription-billing.interval-ms` to 3600000, and `app.subscription-billing.initial-delay-ms` to 60000. All accounts start disabled until explicitly configured. Each run processes at most twelve overdue cycles per account, continuing catch-up on later runs. No live migration, deployment or payment has been performed by this implementation.

## Automatic collection extension

Manual is the default. The AUTOMATIC mode and platform collection endpoint are implemented, but **no external payment-provider adapter is configured or bundled**. The UI disables automatic selection until an available `SubscriptionPaymentCollector` Spring bean exists. Add a provider integration before enabling this mode; no credentials are stored in invoice data.

The adapter must use the supplied stable invoice idempotency key, resume/reconcile the same operation after timeouts, and return authenticated settlement confirmation with a unique reference, exact remaining amount and USD currency. A durable PENDING state is committed before contacting the provider. An uncertain result remains pending and blocks manual receipts, preventing a timeout from allowing a duplicate manual payment. Mismatched confirmations require reconciliation and are not marked paid. Provider retries reuse the same key. A provider reconciliation/admin recovery workflow is required when introducing a concrete adapter.

## Verification

Financial integration tests use MySQL 8 with Flyway migrations and cover concurrent renewals, historical counts and rates, month-end dates, tenant isolation, partial receipts, duplicate references, trial conversion/expiration, cancellation, zero-driver invoices, and uncertain or verified automatic outcomes. Frontend tests cover configuration, tenant read-only access, receipts, pagination and error retention.


### Provider reconciliation contract

Adapters must expose a stable `providerId()` and implement read-only `reconcile(invoice, key)`. The first collection binds the invoice to that provider and commits PENDING before calling it. Retries and the platform administrator's **Reconcile payment** action perform lookups rather than issuing another charge. Provider changes cannot redirect an unresolved invoice to a different processor. Historical pending invoices without a known provider are marked `legacy-unresolved` and require operator identification of the original provider.

An adapter may return `verifiedNotCharged=true` only after authenticating a final provider result proving that no funds were collected. That releases the manual-receipt block. Confirmed settlement still requires exact amount, USD currency and a unique provider reference. Unknown outcomes remain pending; mismatched settlements require review. No card/ACH adapter or provider credentials are bundled. Provider-specific signed webhooks and durable event deduplication must be implemented with the selected provider before automatic collection is enabled.
