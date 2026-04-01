---
applyTo: "frontend/src/features/rider-guardian-portal/**/*.{ts,tsx}"
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
