# Mobile styling reference

The supplied composite image is a visual reference only. Its sample services, providers, booking flow, confirmation flow and profile menu are not product requirements.

## Retained application content

Trips are assigned to drivers within the tenant. The original driver dashboard metrics, upcoming assignments, workspace actions, trip statuses, detail fields, route manifests, vehicles, compliance documents, profile fields and role-specific navigation remain in place. Rider and guardian views show their existing trip and account information. No service catalog, service-selection booking flow, booking review or booking confirmation has been introduced.

Legacy mobile ride-request links are removed. Old rider/guardian schedule URLs redirect to their trip list. Existing backend APIs and tenant assignment rules are unchanged.

## Visual treatment

The reference informs navy headers, orange action and selection colors, pale backgrounds, rounded cards, icon treatment, form fields, typography and bottom-navigation styling. The existing Bakaroo logo and tenant branding remain supported.

The sign-out transition fix prevents the previous account from being restored while credentials are being cleared; it does not change permissions or trip workflows.

## Validation

Run `npm run typecheck` and `npm run test:ci` in `mobile`. Android verification uses synthetic data in an isolated emulator. The release APK targets the production HTTPS backend and excludes local fixture credentials and certificate resources.
