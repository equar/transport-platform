# Transport tenant isolation and portal review

Review date: 6 November 2026. Scope: backend authorization and data access, super administrator and tenant administrator web portals, driver/rider/guardian mobile application, background delivery, and production runtime configuration.

## Assessment

The application has a sound starting pattern: most operational services derive the workspace from the authenticated principal, retrieve resources by both identifier and tenant, and separately check portal relationships. The review found meaningful gaps around session invalidation, client state, module enforcement, document storage, and operational configuration. These have been fixed in the accompanying changes.

No cross-tenant data disclosure was demonstrated against production. A read-only audit checked **27 foreign-key relationships** in selected operational tables and found **zero cross-tenant references**. This is a bounded integrity check, not proof that every possible authorization path or historical event is safe.

The review inventoried 47 controllers, 42 repositories, and approximately 22 tenant-aware query specifications. It traced authentication, administrative changes, operational resource access, portal subject links, files, reporting, queued notifications, device tokens, offline trip actions, and location collection. Production checks used health endpoints, privilege metadata, and aggregate integrity counts; customer records and credentials were not included in this report.

## Role and tenant boundaries

| Actor | Intended scope | Controls reviewed and resulting behavior |
| --- | --- | --- |
| Super administrator (`PLATFORM_ADMIN`) | Global tenant onboarding, workspace status, subscriptions, feature configuration, and account governance | Platform identity has no operational tenant and cannot acquire one by supplying a header. Platform API namespace requires the platform role. Global user administration remains explicitly privileged. |
| Tenant administrator (`TENANT_ADMIN`) | Users and transport operations within one assigned tenant | Tenant comes from the verified identity. Foreign user lookup returns the same not-found response as a missing user. Tenant administrators cannot create platform roles or administer another tenant. |
| Dispatcher | Authorized scheduling, dispatch, and related operations in its tenant | Company namespace permits the operational role; controller/service permissions still narrow individual actions. Tenant/module checks supplement those permissions. |
| Billing administrator | Authorized invoices, payments, and billing reports in its tenant | Tenant filtering and billing permissions remain required. Disabled billing modules now block direct API access as well as navigation. |
| Compliance administrator | Authorized compliance work in its tenant | Existing narrower role checks remain. Disabled compliance/report modules are enforced on the server. |
| Driver | Linked driver, assigned trips/routes, and permitted trip updates in its tenant | Portal linkage and assignment remain separate from tenant membership. Location collection is limited to active trip stages. |
| Rider | Linked rider and its permitted records in its tenant | Portal scope is resolved from the authenticated account rather than accepting a rider identifier as authority. |
| Guardian | Actively linked riders within its tenant | Guardian-rider relationship checks remain necessary in addition to tenant checks. |
| Organization user | Linked organization contact and authorized organization records | Organization portal namespace and subject relationship checks remain in place. Mobile does not offer an organization administration experience. |
| Anonymous visitor | Public information and application/demo submission | Public and admin static builds remain separated. Public pages do not gain access to protected APIs by sharing infrastructure. |

The account model is **one account, one tenant** with globally unique email. Changing an existing account's tenant is now prohibited, including for platform administrators. Create a separate account instead. A driver working for several providers would need explicit membership, workspace selection, and per-membership authorization; changing a tenant header or reparenting an account is not a safe implementation of that feature.

## Findings and implemented fixes

Severity below reflects the potential impact and prerequisites in this application, rather than a claim of a production exploit.

| Priority | Finding | Fix and verification |
| --- | --- | --- |
| High | Administrative changes could revoke refresh sessions while an issued access token remained usable. Roles, password-reset requirements, or portal relationships could therefore remain stale. | Added per-user security versions to users, refresh sessions, and signed tokens. Authentication checks current account state, role equality, tenant scope, and version. Administrative identity changes invalidate access and refresh sessions. Migration V9 adds the version columns. |
| High | Refresh rotation could race, allowing two requests to attempt replacement of the same credential. | Refresh lookup uses a database write lock. Reuse invalidates all sessions and access versions for that user. MySQL integration tests cover concurrent refresh and replay. |
| High | Tenant reassignment of an existing user could make historical references point at an identity subsequently edited in another tenant. | Existing account tenant is immutable; the admin edit form explains the restriction. A negative service test covers platform-admin reassignment. |
| High | Runtime used a database account with privileges beyond the Transport schema, increasing the impact of a runtime compromise. | Deployment provisions a dedicated Transport database identity with verified TLS and grants restricted to `transport_platform.*`. Schema DDL remains available for Flyway; there are no global database privileges or privileges on Bingo schemas. |
| High | Module availability was largely represented in portal navigation and could be bypassed with direct API calls. | A server filter resolves tenant module policy for portal, dispatch, routes, recurring rides, compliance, incidents, notifications, reports, and billing APIs. Report services also check their source module, including background exports. Encoded-path and per-tenant policy tests cover bypass cases. |
| Medium | A request header could populate tenant context independently of authenticated identity. Existing service scoping limited exposure, but this was an unsafe foundation for future code. | Tenant context is derived from the verified stored identity. Conflicting tenant headers are rejected, including platform attempts to select an operational tenant. Context is cleared at request boundaries. |
| Medium | Temporary-password requirements were insufficiently enforced across API and client flows. | Backend restricts temporary-password sessions to recovery/session endpoints and branding. Web and mobile route to password change before normal use. New tenant owners/bootstrap administrators require a password change. Password change ends the client session. |
| Medium | An administrator could remove the final active administrator or its own administrative access. | Tenant-scoped/platform-scoped administrator locks guard continuity. Removing the last active administrator and self-removal are rejected. Integration tests verify scope-specific lock queries. |
| Medium | File loading relied on stored paths without independently binding the path to tenant and driver. | Document loads require the expected tenant/driver prefix, normalized containment, and real-path containment. Traversal, foreign-tenant paths, and symbolic-link escapes are tested. |
| Medium | Account switches could accept late responses, late refresh failures, cached capability results, or delayed secure-storage writes from the previous identity. | Both clients reject responses from an old session generation. Old failures cannot sign out a newer session. Web page/runtime state is keyed by identity and permissions; capabilities ignore stale requests. Mobile secure-store mutations are serialized. |
| Medium | Queued deliveries could use stale recipient eligibility, and push messages could expose transport details on a lock screen. | Email and push retry check current tenant/user status and notification-module access. Push text is generic, data keys are restricted, and recipient/tenant metadata is attached and verified by the mobile client before navigation. |
| Medium | Driver GPS collection extended beyond the minimum active trip window. | Tracking accepts only `DRIVER_EN_ROUTE`, `ARRIVED`, and `PICKED_UP`. It stops after drop-off, logout, or authorization loss. Backend rejects capture before departure and after drop-off/completion/cancellation. |
| Medium | Mobile login contained test-account shortcuts and a default test password. | Removed test credentials, picker, and environment exports. Mobile starts with blank login fields and rejects administrator-only accounts with guidance to the web portal. |
| Medium | An explicit mobile sign-out could silently discard pending driver updates. | Driver/rider/guardian sign-out warns when unsent trip actions will be removed. Queue ownership remains bound to tenant and user; a new identity cannot replay the previous identity's work. |
| Low | Native camera configuration requested microphone capability despite no microphone workflow. | Disabled audio recording/microphone permissions and clarified active-trip location explanations. This requires a new native application build. |

Primary implementation references:

- Backend security: `common/security/JwtAuthenticationFilter.java`, `SecurityConfig.java`, `TenantModuleAccessFilter.java`, and `common/tenant/TenantContextFilter.java`.
- Session lifecycle: `features/auth/application/AuthSessionService.java`, `features/auth/domain/AuthRefreshSessionRepository.java`, and `V9__tenant_session_security_versions.sql`.
- Administration: `features/user/application/UserManagementService.java` and `features/auth/domain/AppUserRepository.java`.
- Documents and location: `features/driver/application/DriverDocumentStorageService.java` and `features/location/application/DriverLocationSnapshotService.java`.
- Delivery/reporting: `NotificationDeliveryAccess.java`, `PushDeliveryWorker.java`, `NotificationEmailRetryService.java`, `ReportAccessService.java`, and `TenantModulePolicy.java`.
- Web: `frontend/src/shared/api/client.ts`, authentication routing, identity-keyed providers, runtime capabilities, and user editing.
- Mobile: `mobile/src/auth`, `src/api/client.ts`, `src/tracking/activeTrip.ts`, `src/hooks/usePushNotifications.ts`, and `src/stores/offlineQueueStore.ts`.

## Super administrator portal review

Global governance remains a privileged control plane: platform users can inspect and govern tenant accounts through explicitly platform-authorized operations. A platform account cannot impersonate an operational tenant by choosing a tenant header. A platform identity must have the exclusive platform role and no tenant; tenant identities require a tenant. The API checks these invariants rather than relying on which menu the user sees.

Account edits now invalidate existing sessions. This deliberately includes apparently minor identity edits because identity and portal-link edits share the same operation. The form warns about the sign-out consequence. Tenant changes on existing accounts are disabled, and the last active platform administrator cannot be removed.

Tenant suspension is an access decision: current tenant status is checked during authentication and queued delivery. Subscription grace periods, overdue invoices, and service termination require a separate business policy. Automatically halting an active passenger trip merely because a payment becomes overdue would be an unsafe default, so this review did not invent such behavior.

Recommended next product improvements: administrator MFA/SSO, a visible active-session inventory with per-device revocation, explicit high-impact governance confirmations with audit reasons, and alerts for unusual cross-tenant administrative activity. No support impersonation feature was introduced.

## Tenant administrator portal review

User administration is restricted to the current tenant and cannot grant platform privileges. Foreign-resource existence is no longer disclosed by a distinct forbidden response in company-user retrieval. Related driver/rider/guardian/organization subject selection remains tenant-scoped. Disabled module navigation now corresponds to server enforcement, so copying a URL or crafting an API request cannot restore the disabled feature.

Temporary-password users have a standalone password-change route that does not depend on loading a protected portal profile first. Session-keyed pages and runtime capabilities avoid showing a previous tenant's state during account changes. A missing custom tenant icon resets to the default instead of retaining the previous workspace's branding.

Recommended next product improvements: prominently display workspace identity on high-impact forms and exports, provide a permissions summary before saving role changes, show pending invites/password-reset state, and explain disabled modules with a consistent upgrade/contact workflow. These usability improvements should preserve the server controls rather than replace them.

## Mobile review

The mobile app is intended for drivers, riders, and guardians. Super administrators and tenant administrators should use the web portal; admin-only identities are not retained as mobile operational sessions. Deep links and navigation are checked against the authenticated role before rendering the protected screen. Forced password change is available on mobile.

Secure storage, query-cache ownership, offline-queue ownership, refresh generation, push recipient binding, and active-trip location handling were reviewed together. A late request or token write from a signed-out account must not overwrite the next user's session. Unsent trip updates can survive same-owner reauthentication but are not replayed as another tenant/user. Explicit logout clears the queue after a warning when needed.

Push notifications now carry generic lock-screen content. Opening one requires the current recipient and tenant to match. External push-provider timing still creates a small delivery race; generic content and recipient checks limit its consequences. Notifications are not a replacement for fetching the current authorized resource from the API.

Native Android/iOS device testing, app-store submission, background-location behavior under OS termination, and biometric/device-backup policy are outside the automated checks performed here. The changed native permission configuration requires rebuilding and reinstalling/releasing the app. Existing installed builds do not acquire these changes from a backend deployment.

An attempted export of every Expo platform also tried the optional web target, which currently lacks `react-native-web`. Android and iOS were exported separately as the intended mobile targets. This is not a native release-build or mobile-web certification.

## Validation

| Check | Result |
| --- | --- |
| Backend Maven verification, including MySQL/Testcontainers | 164 tests passed; zero failures/errors/skips |
| Frontend unit/component tests | 16 passed |
| Frontend production build | Public/admin graph separation and indexing checks passed |
| Mobile unit tests | 13 passed across four suites |
| Mobile TypeScript | Passed |
| Mobile production JavaScript/Hermes exports | Android and iOS checked separately |
| Deployment/Nginx tests | 22 passed |
| API contract generation | Regenerated from backend output |
| Live aggregate relationship audit | 27 relationships checked; zero cross-tenant references |

New regression coverage includes forged tenant headers, stale roles/security versions, suspended tenants, required password changes, context cleanup, refresh concurrency/replay, last-administrator scope locks, account-reparent rejection, document path escapes, per-tenant module flags, encoded paths, notification eligibility, GPS privacy boundaries, old client responses, secure-store ordering, and offline queue ownership.

This combines source review, negative tests, real database transaction tests, build checks, and bounded production checks. It is not an independent penetration test, exhaustive fuzzing of every resource/action combination, or a compliance certification.

## Deployment record

The fixes were deployed and verified on both production hostnames:

- Backend release: `tenant-security-1794023674`, healthy on loopback port **8082**.
- Frontend release: `tenant-security-ui-1794023801`, verified on `transport.bakaroo.com` and `admin.transport.bakaroo.com`.
- Latest successful Flyway migration: **9**; both security-version columns are present.
- Live database privilege check: **no global privileges beyond USAGE**, **cannot create database users**, and grants limited to the Transport schema.
- Transport GitHub Actions database configuration and signing-key secrets were synchronized after backend health verification. The workflow reads the updated `MYSQL_USER` variable and `MYSQL_PASSWORD` / `APP_SECURITY_JWT_SECRET` secrets.
- Both homepages, entry assets, API health endpoints, indexing headers, and matching frontend release markers passed HTTPS checks. Public/admin route bundles return not-found from the opposite hostname. Protected administration APIs return 401 without authentication. Legacy public login/recovery/workspace links redirect to the admin hostname while preserving path/query.

The independent signing-key rotation invalidates old access tokens, so users must sign in again. Mobile source changes and Android/iOS exports are complete; a native app release was **not** installed or published as part of this rollout.

No credential values are recorded in source or this report. Bingo's database identity and signing key were not changed. The source changes remain in the local working tree for review/commit; production verification refers to the built artifacts described above.

## Remaining architectural decisions

1. **Shared-schema isolation:** current tenant isolation is application-enforced. Most database foreign keys do not encode tenant equality as a composite constraint, and MySQL does not provide PostgreSQL-style row-level security. The read-only audit found no inconsistent references in its selected relationships. Add tenant-aware composite constraints through a separately rehearsed migration, and consider schema/database-per-tenant for tenants requiring a stronger infrastructure boundary. This review did not perform a risky blanket constraint migration on live transport data.
2. **Runtime and migration privileges:** the new runtime account is schema-limited but can perform schema DDL for startup Flyway. Separate migration and DML-only runtime accounts would reduce privilege further and require changing the release workflow.
3. **Administrator authentication:** MFA, SSO, recovery controls, and privileged-session policy remain identity-product decisions. Password controls alone do not provide phishing-resistant administration.
4. **Logout semantics:** ordinary logout revokes its refresh family; an already-issued stateless access token can remain valid until its configured expiration. Administrative revocation, password/security changes, tenant invalidation, and refresh replay now invalidate access versions. Add a per-session access-token check if immediate per-device logout is required.
5. **Shared infrastructure:** a Transport-only database account and independent signing key reduce application compromise impact. Host root, shared deployment SSH access, and CI operators remain trusted across applications on the shared server. Stronger separation requires distinct deployment identities/hosts and narrower CI privileges.
6. **Resource fairness and retention:** define per-tenant storage/export/notification/request quotas, location/document/audit retention, and deletion/export policies. No universal retention period is appropriate without the provider's operational requirements. Background workers still need continued load and fairness testing as tenant volume grows.
7. **Device protection:** decide requirements for shared driver devices, local backup exclusion, screen capture, device lock/biometrics, and offline data retention. The current changes do not attest to device-management compliance.
8. **Ongoing assurance:** expand a reusable two-tenant end-to-end authorization suite for every resource verb, add alerting for denied tenant-boundary attempts without recording sensitive payloads, and commission an independent penetration test before making contractual isolation guarantees.

## Reference basis

The review follows the principles of deriving tenant context from authenticated identity, authorizing each object/action, separating tenant-owned caches/files/jobs, and minimizing mobile exposure described in the [OWASP Multi-Tenant Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html), [OWASP API Security: Broken Object Level Authorization](https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/), and [OWASP MASVS storage control](https://mas.owasp.org/MASVS/controls/MASVS-STORAGE-1/). These sources inform the assessment; they do not certify this implementation.
