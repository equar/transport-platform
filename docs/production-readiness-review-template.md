# Production Readiness Review Report

Copy this template for each release candidate and store the completed report with the release records.

## Release Summary

| Field | Value |
| --- | --- |
| Release version | |
| Commit SHA | |
| Target environment | |
| Release owner | |
| Review date | |
| Reviewers | |
| Decision | `APPROVED` / `APPROVED WITH P1 ACCEPTANCE` / `REJECTED` |

## Scope

Describe user-facing changes, API contract changes, database migrations, configuration changes, and infrastructure changes.

## Automated Evidence

| Check | Command or pipeline | Result | Evidence link |
| --- | --- | --- | --- |
| Backend unit tests | | | |
| Backend integration tests | | | |
| Frontend typecheck/build/tests | | | |
| Mobile typecheck/tests/build | | | |
| API contract validation | | | |
| Dependency/security scan | | | |

## Role Scenario Evidence

| Role | Critical scenario | Environment | Result | Evidence link |
| --- | --- | --- | --- | --- |
| Platform administrator | Tenant lifecycle and audit review | | | |
| Tenant administrator | User and operational setup | | | |
| Dispatcher | Assignment and exception resolution | | | |
| Billing or compliance staff | Financial or document workflow | | | |
| Driver | Trip execution including offline recovery | | | |
| Rider | Booking, status tracking, cancellation | | | |
| Guardian | Linked-rider access and exception visibility | | | |
| Organization user | Roster/bulk operation or billing access | | | |

## Operational Evidence

| Check | Result | Evidence link |
| --- | --- | --- |
| Staging readiness and health | | |
| Request/error/latency monitoring | | |
| Correlation ID through scripted ride flow | | |
| Audit records for sensitive mutations | | |
| Notification delivery and failure recovery | | |
| Rollback rehearsal | | |
| Internal iOS and Android build installation | | |

## Findings

| ID | Severity | Area | Finding | Owner | Target release | Status |
| --- | --- | --- | --- | --- | --- | --- |
| | P0/P1/P2 | Backend/Web/Mobile/Operations | | | | Open/Accepted/Closed |

## Risk Acceptance

For each accepted P1 risk, state the customer/operational impact, mitigation, monitoring signal, acceptance expiry, and approving owner.

## Rollback

State the exact application rollback command or procedure, data compatibility constraints, verification endpoint, and decision owner.

## Final Approval

- Decision:
- Release owner:
- Approver:
- Date: