---
applyTo: "frontend/src/**/*.{ts,tsx}"
description: "Review and generate React and Material UI code for layout, forms, tables, dialogs, navigation, portal UX, role-based UI, and production-ready frontend quality."
---

# React + Material UI Review Guide

## Review Goals

Review frontend changes for:

- Clear layout structure
- Consistent Material UI usage
- Good UX states
- Role-aware navigation and visibility
- Reusable, production-ready React code

## Layout Review

Prefer established Material UI building blocks such as:

- `Container`
- `Grid`
- `Box`
- `Card`

Ensure page structure is readable, responsive, and consistent with the rest of the product.

## Table Review

When tabular data is appropriate, use:

- Data tables
- Pagination
- Sorting

Avoid forcing table layouts when the existing portal experience is intentionally card-based or mobile-first.

## Form Review

Use:

- React Hook Form when already established for the feature
- Controlled inputs when that is the current feature pattern

Include:

- Validation
- Helper text
- Sensible disabled and loading behavior

## UX State Review

Every meaningful page or workflow should account for:

- Loading state
- Empty state
- Error state

These states should be explicit and user-friendly, not implied.

## Dialog Review

Use standard Material UI dialog primitives:

- `Dialog`
- `DialogTitle`
- `DialogContent`
- Buttons with clear actions

Use icons intentionally for actions such as:

- Add
- Edit
- Delete
- View

## Status Review

Use status chips or equivalent visual treatment consistently.

Preferred status colors:

- `ACTIVE` -> green
- `PENDING` -> orange
- `SUSPENDED` -> red

## Navigation Review

Use navigation patterns appropriate to the product shell, including:

- `Drawer`
- `AppBar`

Ensure role-based UI hides unavailable areas while staying aligned with backend authorization.

## Performance Review

Use performance-oriented patterns when they provide real value, including:

- `memo`
- Lazy loading

Do not add complexity without a clear benefit.

## Code Quality Review

Ensure:

- Components are reusable where duplication would otherwise grow
- Logic and presentation are reasonably separated
- The code avoids unnecessary duplication
- UI patterns stay consistent across related pages

## Production Readiness

Ensure:

- No debug logs remain
- No `console.log` statements remain
- Styling is maintainable and intentional
- The resulting UI fits the product’s established quality bar

Portal-specific requirements are defined in the dedicated portal instruction files.
description: "Review driver portal layouts and pages for scoped ride and route visibility, mobile-friendly UX, operational clarity, and professional portal behavior."

---

# Driver Portal Review

## Review Goals

Review driver portal changes for:

- Clear operational UX
- Driver-scoped data visibility
- Mobile-friendly composition
- Fast access to rides, routes, compliance, and notifications

## UX Expectations

The driver portal should feel:

- Focused
- Lightweight
- Professional
- Easy to use in the field

Prefer concise labels, clear status treatment, and direct actions over admin-heavy layouts.

## Data Scope Review

Ensure the UI only presents:

- Assigned rides
- Assigned routes
- Driver-owned compliance data
- Driver-visible notifications

Do not frame the driver portal like a company admin workspace.

## Layout Review

Prefer:

- Simple cards or compact lists when they improve mobile usability
- Clear route back-navigation on detail pages
- Primary actions that map to field workflows

## Content Review

Ensure copy emphasizes:

- Today’s work
- Readiness
- Compliance attention items
- Operational status

Avoid generic dashboard language when a more task-oriented label is available.

## Production Readiness

Ensure:

- No unrelated admin controls appear
- Error and empty states are clear
- Navigation remains scoped to driver features

## \*\*\* Add File: E:\transport-platform\.github\instructions\rider-guardian-portal-review.md

applyTo: "frontend/src/features/rider-guardian-portal/\*_/_.{ts,tsx}"
description: "Review rider and guardian portal pages for scoped ride and billing visibility, linked rider clarity, understandable copy, and clean self-service UX."

---

# Rider And Guardian Portal Review

## Review Goals

Review rider and guardian portal changes for:

- Clear self-service UX
- Correct rider and guardian scoping
- Understandable billing and ride visibility
- Calm, non-admin presentation

## UX Expectations

The portal should feel:

- Simple
- Reassuring
- Readable
- Professional

Prefer language that explains the current user’s scope clearly, especially when guardians can see linked riders.

## Scope Review

Ensure:

- Riders only see their own allowed records
- Guardians can see only linked rider records that the backend authorizes
- Ride details, billing, notifications, and history pages stay within current scope
- UI labels make it obvious which rider is being viewed when multiple linked riders exist

## Layout And Content Review

Prefer:

- Card-based summaries for ride and billing visibility when easier to read than dense tables
- Explicit status and timing information
- Clear distinction between upcoming activity and history
- Self-service profile editing that does not imply unsupported backend actions

## Billing Review

Ensure billing pages present:

- Open invoices
- Outstanding balance
- Payment history

The portal should remain informational and scoped unless backend mutations are explicitly supported.

## Production Readiness

Ensure:

- No company-admin behavior leaks into portal pages
- Empty and error states are understandable to non-technical users
- Copy remains precise and not overly technical

## \*\*\* Add File: E:\transport-platform\.github\instructions\organization-portal-review.md

applyTo: "frontend/src/features/organization-portal/\*_/_.{ts,tsx}"
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
