---
applyTo: "frontend/src/features/organization-portal/**/*.{ts,tsx}"
description: "Review organization portal pages for organization-scoped visibility, client-facing UX, contracts and billing clarity, and clean portal-specific navigation and layout."
---

# Organization Portal Review

## Review Goals

Review organization portal changes for:

- Organization-scoped data visibility
- Client-facing business UX
- Readable contracts, roster, rides, billing, and notifications flows
- Separation from internal admin experiences

## UX Expectations

The organization portal should feel:

- Clean
- Business-facing
- Professional
- Focused on visibility rather than administration

Do not make organization pages feel like reused internal admin tables unless the data truly requires a table.

## Scope Review

Ensure the portal shows only:

- Organization-visible contacts
- Organization-linked riders
- Organization-scoped rides
- Organization-visible contracts
- Organization billing and notification data

No cross-organization visibility should be implied anywhere in the UI.

## Page Review

For dashboard, profile, contacts, roster, rides, contracts, billing, and notifications pages:

- Keep actions aligned with supported backend capabilities
- Prefer read-only presentation when backend edits are not supported
- Make current scope and business context clear
- Use summaries and cards where they improve readability

## Navigation Review

Ensure:

- Navigation is portal-specific
- Labels are business-facing and understandable
- Notifications and profile access are easy to reach
- Mobile behavior remains usable

## Production Readiness

Ensure:

- The portal does not expose tenant-admin workflows
- Billing and contracts are presented clearly and conservatively
- Empty states explain absence of data without implying system failure
