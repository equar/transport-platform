# Mobile Expo SDK Upgrade Plan (Controlled Path)

## Objective
Upgrade from Expo SDK 52 to a currently supported SDK line in controlled increments while preserving app stability and release quality.

## Current Baseline
- Expo: `~52.0.0`
- React Native: `0.76.5`
- Router: `~4.0.0`
- Critical CVEs currently mostly transitive through Expo toolchain packages.

## Upgrade Strategy
1. Run baseline checks and capture results.
2. Upgrade one SDK major at a time (52 -> 53 -> 54 -> ... target).
3. Validate each step with compile + native dependency checks.
4. Only proceed to next SDK step after all checks pass.

## Baseline Commands
Run from `mobile/`:

```bash
npm ci
npm run typecheck
npm run doctor
npm run upgrade:check
npm run security:audit
```

## Per-Step Workflow
For each SDK step (example: `52 -> 53`):

```bash
npx expo upgrade <target-sdk-version>
npm install
npx expo install --fix
npm run typecheck
npm run doctor
npm run upgrade:check
npm run security:audit
```

If iOS native dependencies are present:

```bash
cd ios && pod install && cd ..
```

## Validation Gates (Must Pass)
- TypeScript: no errors.
- Expo Doctor: no blocking configuration issues.
- Expo Install Check: dependencies aligned with target SDK.
- Security Audit: no newly introduced direct high/critical vulnerabilities.
- Smoke run:
  - `npm run expo:ios`
  - `npm run expo:android`

## Rollback Rule
If any gate fails and cannot be resolved quickly:
1. Revert only the SDK-step commits.
2. Keep prior stable step.
3. Document blocker and proceed with dependency pin or targeted patch.

## Expected Breaking Areas
- Navigation packages and route helpers.
- Push notification APIs and permissions.
- Native module versions (`react-native-reanimated`, `react-native-screens`).
- Build tooling around Metro and Babel.

## Recommendation
Execute as a dedicated upgrade branch with one commit per SDK step and mandatory CI validation before merge.
