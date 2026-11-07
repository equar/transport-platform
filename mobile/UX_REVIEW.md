# Mobile UX review and admin-theme alignment

Reviewed 6 November 2026. Scope: all 30 mobile route screens, shared controls, loading/error/empty states, navigation, booking, and billing sheets. Changes are confined to `mobile/`; the backend, admin frontend and public website were not modified.

## Design direction

The mobile app now follows the admin frontend’s default design language:

- Muted blue `#214e82`, slate text `#172b40`, secondary text `#667384`, canvas `#f4f6f9`, white surfaces and subtle `#e4e8ed` borders.
- Inter for body text and controls; Manrope for headings. Fonts are bundled for offline use.
- Small, consistent card/input/button radii, restrained shadows, readable spacing, and contextual status colors.
- Native touch targets of at least 48 points for primary controls, password visibility icons, segmented filters and back actions.
- Mobile-specific reflow: two-column summary cards, wrapping metadata, scrollable keyboard-aware authentication forms, and a maximum content width on tablets.

Mobile branding displays the tenant name/logo when available. The global mobile palette follows the default admin theme; arbitrary tenant-specific primary-color overrides are not implemented in this change.

## Screen-by-screen review

| Route screen | Findings and resulting changes |
| --- | --- |
| `(auth)/login` | Replaced the oversized/cropped logo with a compact branded lockup; introduced a clear welcome heading, inline credential errors, email autofill, a standard password-visibility icon and a prominent sign-in action. Failed sign-in preserves entered values. |
| `(auth)/forgot-password` | Uses the same branded form frame and keyboard behavior; validates inline; gives a clear inbox/junk-folder success state and explicit return-to-sign-in action. No reset request was sent during native visual QA. |
| `(auth)/reset-password` | Replaced an unstyled form with the shared frame, password autocomplete, pending/error/success states and an actionable missing/expired-link path. |
| `(auth)/change-password` | Applied the same form hierarchy, spacing, readable instructions and pending controls while preserving forced-password enforcement and sign-out behavior. |
| `(driver)/index` | Rebuilt the home screen around actual API statistics. Removed invented driven-mile and derived completion figures. Added upcoming assignment cards, explicit assignment-load errors, and direct routes/documents shortcuts. |
| `(driver)/rides/index` | Aligned cards/filters with the theme, increased filter targets, made addresses more readable, corrected API sort parameters, and added explicit load-more actions so client-filtered pages do not hide access to later records. |
| `(driver)/rides/[rideId]` | Restyled the trip header, tracking feedback, queued/conflict warnings and information sections. Back navigation is comfortably tappable; loading failures use the common retry state. Trip action/confirmation and tracking rules are preserved. |
| `(driver)/routes/index` | Route manifests now use white bordered cards and consistent gutters. Corrected “stops” wording where the API actually returns a linked-ride count. |
| `(driver)/routes/[routeId]` | Aligned typography/back navigation and count wording; added an explicit empty-manifest state instead of a blank Stops section. |
| `(driver)/compliance` | Aligned upload, issue and document panels, summary cards, headings and modal styling. Uses provider-facing language instead of exposing “tenant” terminology. Existing upload limits/review behavior remain. |
| `(driver)/profile` | Added consistent profile surfaces, explicit retry actions, larger tabs, provider contact and sign-out. Removed fabricated vehicle specifications from the vehicle tab. |
| `(driver)/vehicle` | Removed hardcoded van type, capacity, fuel type, readiness and the incorrect use of driver email as the company. Explains that vehicle assignment must be confirmed through the trip/provider rather than inventing data. |
| `(driver)/notifications` | Uses the shared Alerts screen: readable subjects, summaries, unread emphasis, pagination, individual read actions, mark-all state and failure handling. |
| `(rider)/index` | Rebuilt around real counts, a direct ride-request action and accurate next-trip details. Replaced “Check In” with “View trip details” because the action opens a detail screen. Billing is described as invoices/payments rather than a stored-value wallet. |
| `(rider)/rides/index` | Renamed “Post” to “History”; active and finished rides now belong to distinct views based on status, avoiding delayed active rides appearing in both. Added explicit pagination and accessible segmented controls. |
| `(rider)/rides/[rideId]` | Aligned sections/tracking/back actions; styled cancellation as destructive while retaining confirmation. Removed the “Call Driver” action that dialed invented fallback telephone numbers. Configured provider support remains available. |
| `(rider)/schedule` | Shared booking form: themed option controls, grouped address inputs, native date/time actions with context-specific accessibility names, company-timezone feedback, consistent assistance switches and an accurately named “Review ride request” action. |
| `(rider)/billing` | Added structured invoice/payment detail sheets with safe-area handling, readable line items and totals. Replaced overflowing long pagination buttons with short controls and page context. Preserved actual currency codes and payment-record sharing. |
| `(rider)/profile` | Aligned identity/contact/address/emergency sections, retry behavior, provider-contact guidance and sign-out. |
| `(rider)/notifications` | Shares the same paginated Alerts experience as driver/guardian; no separate visual vocabulary. |
| `(guardian)/index` | Rebuilt with the guardian’s own identity, actual family/trip counts, booking access and next-trip details. Removed misleading “Live Tracking” shortcuts that opened a rider list, and “Manage Profile” wording where editing was unavailable. |
| `(guardian)/riders` | Aligned linked-rider cards/tags and request-action gutters. Guardian relationship and pickup/assistance data remain visible. |
| `(guardian)/rides/index` | Replaced a misleading “Today” filter that also included future dates with “Upcoming”; finished rides are separate in History. Added pagination and consistent cards/filter semantics. |
| `(guardian)/rides/[rideId]` | Uses a restrained trip-details header, accurate rider/guardian wording, readable route/tracking panels and configured provider support. |
| `(guardian)/schedule` | Reuses the booking screen with explicit rider selection and an informative no-linked-riders state. Existing rider authorization and assistance defaults are preserved. |
| `(guardian)/billing` | Reuses the rider billing experience. Kept accessible from Home without adding an unintended sixth bottom tab. |
| `(guardian)/profile` | Aligned account panels, readable contact/default/emergency data, retry guidance and sign-out. |
| `(guardian)/notifications` | Reuses the shared paginated Alerts screen. |
| `+not-found` | Applied shared typography/canvas and a real home button that returns to the current role’s default route rather than blindly sending a signed-in user to login. |
| `unsupported` | Reviewed the administrator-only-role guidance; typography follows the shared theme. Mobile remains a driver/rider/guardian application. |

Layouts were reviewed separately: driver tabs now distinguish Trips from Routes; rider uses Billing rather than Wallet; all roles use Alerts consistently. Guardian Riders uses a people icon rather than implying live location. Sign-out lives in the account/profile screen rather than beside a prominent home-screen alert icon, reducing accidental logout while preserving the pending-trip-action warning.

## Shared controls and states

- Password visibility uses a consistent line icon rather than platform-dependent emoji. Email fields avoid autocorrect. Input errors are associated with accessibility hints and announced politely on Android.
- Buttons have explicit accessibility names, preventing decorative icon glyphs from becoming part of the spoken name. Date/time buttons retain short visible labels with context-specific spoken labels.
- Empty, loading and retry views share the same palette and typography. Retry copy does not always misdiagnose an access/provider issue as a connectivity failure.
- Trip statuses use readable labels such as “Driver on the way,” “On board,” and “Under review.”
- Offline feedback now correctly warns that explicit sign-out removes pending actions; it no longer falsely promises they survive logout.
- Tracking empty states explain when location becomes available. Existing privacy, ownership and status controls were preserved.
- Alerts load older pages and provide individual and bulk read actions; changes refresh dashboard unread counts.

## Verification and limits

- 23 tests across seven suites passed, including sign-in validation/value preservation, accessible password visibility, pagination bounds, genuine driver counters, guardian links, distinct upcoming/history views, loading older alerts and updating read state.
- Mobile TypeScript validation passed.
- Android standalone release APK built for `arm64-v8a` and `armeabi-v7a`, using the production HTTPS API. Final package verification is recorded below.
- iOS JavaScript/Hermes export was checked. This is not an iOS native-device test or App Store release.
- Native Android visual checks used an isolated Pixel 5 emulator: sign-in before/after, navigation through the actual recovery button, accessibility-tree labels, and a 320dp-equivalent viewport at 1.3 font scale. Forms remain scrollable when content exceeds the viewport. These checks do not certify every possible accessibility font size.
- Authenticated driver/rider/guardian screens were reviewed in source and through targeted component/data fixtures. They were not all exercised against real customer records on a physical device. No production ride, billing, document, or account data was changed for UX QA.

Local screenshots (ignored build artifacts): [old sign-in](build/ux-review/sign-in-before.png), [new sign-in](build/ux-review/sign-in-after.png), [recovery](build/ux-review/recovery-after.png), [small screen with larger text](build/ux-review/sign-in-small-large-text.png).

The shared-schema security work, backend permissions and admin/public deployments were outside this mobile-only change. Vehicle data that the current API does not expose is explained honestly rather than replaced with placeholders. Profile editing, in-app chat, additional payment actions and real-time socket tracking were not invented as part of a visual alignment request.

## Final package

[Installable Android APK](build/transport-platform-mobile-ux.apk) — 80.1 MiB, package `com.transportplatform.mobile`, Android 7+, ARM64/ARMv7. Its APK v2 signature, non-debuggable release flag, bundled Inter/Manrope font bytes, production HTTPS URL and latest screen content were verified. Installed and launched successfully on the isolated Android emulator; final button accessibility names exclude decorative icon glyphs.

The APK uses the existing local test signing identity for direct installation. It is not a Play Store submission. Source changes remain uncommitted. The build artifact and screenshots are excluded from Git.

SHA-256: `f761a4a3f5c8063204793e1d3f030b6e10b5e3a5a4fb84e76194c8c4fc47e508`.

7 November follow-up: centered the branded logo lockup in the shared authentication frame and rebuilt/verified the Android APK.

Vehicle ownership follow-up: the API now exposes tenant-scoped owned/assigned vehicles. The driver home shortcut, vehicle screen and profile vehicle tab use real records, ownership/assignment labels, capacity and document expiry dates. The updated package is [transport-platform-vehicle-ownership.apk](build/transport-platform-vehicle-ownership.apk); mobile tests (25), TypeScript checking, iOS JavaScript export and Android release packaging passed. This follow-up package was not tested on a physical device.
