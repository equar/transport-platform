# Back-office UI review

Reviewed the tenant dashboard, populated driver/rider/guardian/ride lists, and their detail screens as an administrative workspace.

Changes:

- Light appearance is the default even if the operating system uses dark mode. Explicitly saved dark/system choices remain available.
- Sidebar, workspace identity, navigation selection, logo treatment and content surfaces follow the selected theme instead of forcing dark navigation.
- Compact page headings and command areas replace oversized hero treatment. The dashboard uses “Operations overview” instead of a promotional headline.
- Operational metrics and alerts appear before the optional setup checklist. The checklist is collapsed until opened.
- Metric cards, empty states, desktop inputs, buttons and table spacing use a tighter administrative density. Coarse-pointer button targets remain larger.
- Core record tables keep fields on single lines for scanning, scroll internally for additional columns, and retain the action column on desktop. Pagination can wrap on narrow screens.
- Quick actions use a compact grid; labels describe the destination rather than implying that a creation form opens immediately.
- Persistent workspace navigation, current-section indication, keyboard page search, nearby record actions and paginated histories remain the main interaction model.

Verification uses the real local frontend with **synthetic records and mocked API responses**, not production accounts. The browser is configured to prefer dark mode with no saved appearance preference. `visual-verification.json` records 18 page/viewport checks (1440px and 390px), palette values, overflow and browser errors. Screenshots contain synthetic data only.

This review covers visual treatment and representative administrative screens; it is not a complete live workflow or usability study with operators.
