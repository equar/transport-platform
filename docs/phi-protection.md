# Sensitive-data protection and retention

## Decision and limits

Rider accessibility, clinical free text, dates of birth, private addresses, emergency contacts and location coordinates are sensitive data. They are encrypted in the application before database persistence. Authentication, authorization and tenant scoping remain mandatory: encryption does not authorize a user to read a field.

This is a technical safeguard, not HIPAA certification or a determination of covered-entity/business-associate status. The operator must assess its actual payer contracts, disclosures, service providers and operating environment. See [HHS risk-analysis guidance](https://www.hhs.gov/hipaa/for-professionals/security/guidance/guidance-risk-analysis/index.html).

Database/storage encryption, encrypted backups, key custody, access reviews, incident response and approved record-disposal procedures require deployment verification. No live AWS resources, databases, keys, mailboxes or backups were inspected or changed by this implementation.

## Protected inventory

The authoritative migration inventory is `backend/src/main/resources/privacy-columns.csv`. It lists each table, column and encryption context. It includes:

- Rider DOB, phone numbers, private/home/default addresses, pickup/drop-off notes, accessibility flags, mobility needs, care instructions and emergency contacts.
- Ride and recurring-ride addresses, accessibility flags, instructions and internal/operational/cancellation notes; ride-event notes.
- Driver DOB, addresses, emergency contacts, availability/notes, guardian addresses/notes and rider/guardian relationship notes.
- Incident titles, narratives, reporter-name snapshots, resolution/root-cause/corrective-action summaries and notes.
- Free-text note fields across billing, earnings, contracts, routes, compliance, vehicle/driver documents, company applications and SaaS administration.
- Driver GPS latitude/longitude, dispatch-verified stop coordinates, report requests and cached CSV exports.
- Notification message, metadata and delivery-error text. Operational notifications contain minimized content before encryption; account-setup verification links remain private delivery content.

Names, login/email identities, operational classifications, record identifiers, relationships, statuses, scheduling timestamps and financial amounts are not all encrypted. The dataset is **not de-identified**. Clinical details must not be placed in business labels, plan descriptions, identity fields or other fields outside the protected inventory. Database permissions and full storage/backup encryption still matter. Location timestamps and relationships remain sensitive metadata.

## Encryption and searchable fields

AES-256-GCM uses a fresh random 96-bit nonce for each write, a 128-bit authentication tag, a versioned envelope and a key ID. Associated data binds the envelope version, key ID and field datatype context. Missing keys, invalid ciphertext or authentication failures fail closed without logging values. The converter context is datatype-level, not a row/tenant binding; database write integrity and tenant authorization remain separate controls.

Phone search uses tenant-bound HMAC-SHA-256 substring tokens for 3–30 digit queries. Accessibility filters use tenant-bound HMAC tokens. Phone punctuation is normalized; names, codes and email searches retain existing behavior. Database sorting by encrypted rider DOB/city and incident narratives is rejected rather than returning ciphertext order. Blind indexes leak equality/frequency patterns and index cardinality; they are not encryption of the entire database. Their separate lookup key must remain stable during ordinary data-key rotation.

Incident keyword search uses incident codes rather than encrypted titles/narratives. Structured incident filters remain available. Notification search uses the minimized title/code; private email bodies are not searchable in SQL.

### Required settings

- `APP_PRIVACY_ENCRYPTION_KEYS`: comma-separated `key-id:base64-key` entries; each key is 32 random bytes.
- `APP_PRIVACY_ACTIVE_KEY_ID`: an ID present in that ring.
- `APP_PRIVACY_LOOKUP_KEY`: an independent base64-encoded 32-byte HMAC key.

Generate independent keys with an approved secret manager or `openssl rand -base64 32`; store them outside the database and repository. Do not reuse the MFA key. Deployment validation rejects missing/malformed keys and MFA/lookup reuse. Test-only keys live exclusively on the test classpath and must never be copied into deployment configuration. A test-only environment postprocessor isolates fixtures from inherited deployment secrets. Automatic timers are disabled in tests; worker methods are exercised explicitly against their disposable databases.

No production default key is supplied. `APP_PRIVACY_ALLOW_LEGACY_READS` defaults false, does not disable encryption of writes, and is rejected when true in the production profile. Its non-production use is limited to disposable fixtures or a controlled migration exercise.

## Audit and notification minimization

Audit writes use an allowlist of identifiers, operational states and numeric financial/configuration facts. Known sensitive fields are marked `[REDACTED]`; unknown fields are omitted, including nested arbitrary payloads. Summaries are generated from event type/action rather than free text. An allowlisted `changedFields` list preserves which protected fields changed without retaining their old/new clinical values. Actor IDs are retained with pseudonymous labels. New persistence-audit creator/updater labels use user IDs instead of email addresses. Audit reads minimize historical snapshots as defense in depth; the offline tool also scrubs their stored copies.

Operational in-app/email notifications use a generic update notice and ID-only metadata. Rider/guardian names, health requirements, precise trip timing and addresses are not copied into notification metadata or operational delivery text. Operational templates cannot override this policy. Company-approval templates remain available for required verification-link delivery. Account-setup email bodies/metadata are encrypted at rest and are not returned verbatim by notification APIs. Push messages use generic notices and ID-only navigation data.

Logging email/push senders no longer log recipient addresses, subjects or token fragments. Do not enable HTTP body/SQL-parameter trace logging with real sensitive data. Encryption does not erase previously delivered emails/push messages, earlier logs, snapshots, replicas or backups; historical exposure requires a separate assessment and controlled cleanup under the approved policy.

## Offline migration and rollback

This is a coordinated data-format change. **Do not perform an ordinary rolling upgrade or restore an older application jar against an encrypted database.** Old binaries cannot interpret the converted columns.

1. Back up the database and all required old/new encryption keys. Rehearse this migration and restore procedure against a disposable database copy. Estimate the maintenance window; type changes can rebuild large tables.
2. Configure the same key ring, active key ID and lookup key in the maintenance environment and the new runtime. Keep the MFA key separate. Configure the three corresponding GitHub deployment secrets/variable before releasing.
3. Build the new jar. The standalone tool uses `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` and the privacy settings above. Use the production TLS URL/trust configuration. **Do not shell-source a systemd EnvironmentFile.** Supply environment securely using the established deployment/secret tooling.
4. Run `backend/scripts/privacy-maintenance.sh --dry-run` against the intended database. This does not change data or apply Flyway DDL. Missing new tables are reported as pending schema migration. Output contains only table names and counts.
5. Stop the old application and all database writers/delivery workers. Run `backend/scripts/privacy-maintenance.sh --apply`. The standalone entry point starts no Spring application, HTTP server, schedulers or delivery workers. It applies schema migrations, encrypts/rotates sensitive columns in bounded batches, builds private search indexes and minimizes existing audit/notification records. Keep traffic stopped until it completes.
6. Deploy/start the new application with the same secrets. Strict startup requires a completed inventory fingerprint; unmigrated plaintext reads fail closed. Verify authorized profile reads, phone/accessibility searches, maps, delivery evidence, notification delivery and financial workflows before restoring traffic.
7. If the migration fails, keep writers stopped. Committed batches can be resumed with the same complete key ring; they are authenticated before further processing. Do not mark the migration complete manually. Rollback to old application binaries requires restoring the matching pre-migration database backup and environment together. Audit/notification minimization is intentionally irreversible except through such a controlled backup restore.

For a **disposable development database only**, `--demo-data --apply` includes the synthetic demo-data migrations before protection. Re-run protection when a changed demo seed introduces plaintext. Never use this flag on a real tenant database.

### Data-key rotation

Add a new independently generated key under a new ID, retain old decrypt keys, and change the active ID. New writes use the new key; old envelopes remain readable while their keys remain in the ring. Use the maintenance tool to re-encrypt old values and verify all backups/readers before retiring any old key. Do not change the lookup key casually: doing so requires coordinated rebuilding of search indexes and a tested lookup-key migration plan. Losing encryption keys makes the protected data unreadable; copying keys beside database backups defeats separation of custody.

## Retention administration

Platform admins configure defaults under **Privacy & Retention**. Tenant admins can override durations and cleanup enablement for their own company. Blank tenant durations inherit platform values. A platform legal hold always wins; tenant legal holds protect their own company. No statutory/payer duration is invented and cleanup starts disabled.

- Audit and notification durations govern irreversible, bounded secondary-record cleanup when explicitly enabled. Pending/retrying email and push deliveries are retained. Tenant cleanup is scoped; platform audit records follow platform policy. Policy changes are audited.
- Rider/trip review intervals populate the company review queue for inactive rider and finished-trip records. Authorized admins record a fixed retention reason. The record becomes due again after the configured interval.
- **Primary rider/trip records, billing documents, delivery evidence and clinical histories are not automatically deleted or anonymized.** The implemented primary-record workflow is review and documented retention, not clinical-record disposal. A separately approved disposition process is needed for erasure, payer/legal holds, claims and backups; the UI labels this distinction explicitly.

The worker defaults to an hourly interval and a five-minute initial delay. Each pass deletes at most 100 eligible records per category/company. These limits prevent a newly enabled policy from issuing an unbounded deletion transaction. Record contents are omitted from worker error logs.
