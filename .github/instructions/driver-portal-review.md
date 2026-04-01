---
applyTo: "frontend/src/features/driver-portal/**/*.{ts,tsx}"
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
