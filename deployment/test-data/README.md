# Transport functional QA dataset

The 7 November 2026 fixture set creates ten isolated test providers (`QA-T01`–`QA-T10`), each with ten driver identities. Display/legal names and audit records identify the dataset as synthetic. It does not modify existing tenants or system administrators.

## Contents

- 10 tenants with settings and active sandbox subscriptions; one zero-price QA plan.
- 100 drivers with individual logins, 100 vehicles, 100 riders.
- 10 guardians linked to the first three riders of each tenant.
- 10 organizations, primary organization contacts, and active test contracts.
- 300 rides: per driver, one assigned today, one unassigned/scheduled tomorrow, and one completed yesterday.
- 100 route manifests with one assigned stop each.
- 30 invoices (issued, paid, partially paid), 30 lines, 20 manual cash payment records. These represent no real funds or payment-provider transactions.
- 170 active accounts with one role each; 130 driver/rider/guardian/organization portal links.
- 170 in-app sample alerts. Seeding queues no email/SMS/push delivery.

Each tenant has ten drivers plus a tenant administrator, dispatcher, billing administrator, compliance administrator, rider, guardian and organization user. Existing system administrators are retained. The legacy Viewer role has no supported operational workspace, so it is not included.

## Email conventions

Tags have **no hyphens**. With the requested base address, these examples belong to tenant 01:

| Role | Tag | Login |
| --- | --- | --- |
| Tenant administrator | `tat01` | `samuelweld2018+tat01@gmail.com` |
| Dispatcher | `dit01` | `samuelweld2018+dit01@gmail.com` |
| Billing administrator | `bt01` | `samuelweld2018+bt01@gmail.com` |
| Compliance administrator | `ct01` | `samuelweld2018+ct01@gmail.com` |
| Driver 01 | `dt0101` | `samuelweld2018+dt0101@gmail.com` |
| Rider | `rt01` | `samuelweld2018+rt01@gmail.com` |
| Guardian | `gt01` | `samuelweld2018+gt01@gmail.com` |
| Organization user | `ot01` | `samuelweld2018+ot01@gmail.com` |

`dt0101` means **d**river, **t**enant **01**, driver **01**. `dt1007` is tenant 10, driver 07. Replace the two-digit tenant number for the other tenants. Driver numbers are 01–10.

The password supplied for this test set is shared by the test accounts, stored as BCrypt hashes, and does not require a first-login change. The generator accepts a hash file rather than storing the plaintext password in seed SQL/source. The complete local login inventory is [output/accounts.csv](output/accounts.csv), excluded from Git.

Use https://admin.transport.bakaroo.com/login for all supported web roles. The mobile app supports driver, rider and guardian accounts. A guardian sees three linked riders; a rider sees its own data; an organization contact sees its organization's records.

## Testing guide

1. Tenant admin: manage ten drivers, vehicles, riders, users, assignments and tenant settings.
2. Dispatcher: assign tomorrow's unassigned rides and progress today's assigned rides.
3. Driver: inspect assigned trips/manifests, progress trip states, test offline updates, and explicitly permit location sharing when testing active-trip tracking.
4. Rider/guardian: inspect scoped rides and billing; create a request; test cancellation/linked-rider behavior.
5. Billing: inspect unpaid/partial/paid examples and test manual invoicing/payment workflows.
6. Compliance: upload clearly synthetic documents and review/acknowledge issues. No fabricated document files or broken download paths were seeded. Initial missing-document issues are expected; opening compliance screens may generate normal application notifications to your test aliases.
7. Organization: inspect linked contacts, riders, contracts, rides and organization billing.
8. Isolation: log in to a second tenant and confirm the first tenant's identifiers are inaccessible.

Vehicle/driver qualifications have future dates; strict dispatch compliance is disabled in these test settings so assignments are usable while document workflows are exercised. No GPS coordinates, recurring schedules, external payment requests or real personal records are seeded. Recurrence, incident submission, document upload and new payment actions should be tested through their normal UI workflows.

## Reproducibility and safeguards

`generate_transport_test_data.py` only generates SQL and a manifest; it never connects to AWS. It validates required/unknown columns using current schema metadata, uses deterministic tenant IDs and scoped SQL variables for relationships, and produces a single transaction. Generated SQL, manifests and account inventories belong in ignored `output/` or a private temporary directory.

Example generation (hash is supplied privately):

```sh
python3 deployment/test-data/generate_transport_test_data.py \
  --schema-json /private/tmp/transport-testdata-schema.json \
  --hash-file /private/tmp/transport-testdata-password.hash \
  --email-base samuelweld2018@gmail.com \
  --date 2026-11-07 \
  --output-dir deployment/test-data/output
```

Production execution used a protected SSH/database session, verified database TLS, a transport-schema check, a deployment lock, and conflict checks for tenant IDs/codes, email identities and the QA plan. Existing identities were never promoted, reset or overwritten. A complete rerun skips the dataset; conflicting/incomplete namespaces are rejected. Do not manually replay generated SQL against an existing dataset or disable foreign-key checks. There is no automatic production startup seeder or deletion/reset command.

Audit marker: `transport-qa-20261107-v1`.

Vehicle ownership follow-up: each tenant now has five company-owned vehicles (`QA-V01`–`QA-V05`) and five driver-owned vehicles (`QA-V06`–`QA-V10`). Driver-owned vehicles explicitly reference their matching driver as owner; operating assignment remains a separate field. The live update preserved user-edited records. See [vehicle ownership](../../docs/vehicle-ownership.md) for test accounts and validation.

Dispatch compliance follow-up: the original dataset omitted tenant transport-compliance profiles, which correctly prevented assignment despite the drivers/vehicles being active. The generator now includes one explicitly synthetic, verified profile per QA tenant with one-year validity. The AWS repair inserted only the ten missing profiles for marked `[TEST]` QA tenants and preserved every existing profile. Authority identifiers and verification notes clearly state these are synthetic fixtures; they do not represent real regulatory approval. Production dispatch approval checks remain enforced. Expired fixtures require deliberate renewal; no automatic compliance bypass was added.

## Verified AWS result

The dataset is live in the Transport AWS schema. All eight supported tenant-role login types were checked with the supplied test password; driver access to another tenant’s ride was denied. The aggregate integrity audit checked 27 relationships and found zero cross-tenant references. A repeated seed invocation skipped the complete dataset without duplicate inserts or password resets.

Role testing exposed an internal compliance-access check that contradicted its controller permissions. The narrow fix permits tenant-scoped compliance administrators while continuing to reject unrelated roles and foreign-tenant issue lookups. All 178 backend tests passed, and release `compliance-role-1794053241` is healthy. The live compliance check used an intentionally missing issue to verify authorization without creating issues or email notifications.

The seeder created no outbound messages or external payments. Existing production tenants and system administrators were not overwritten. Source changes are available for review/commit.
