# Copilot Instructions

## Repository Standards

- Treat this repository as a production-grade monorepo, not a prototype.
- Preserve the package-by-feature backend structure and the feature-based frontend structure.
- Keep shared technical concerns in backend `common` and frontend `shared` or `app`; do not place business logic there.
- Maintain tenant-awareness in all future backend request handling, services, entities, and APIs.
- Use the shared API response envelope and error handling conventions consistently.

## Backend Conventions

- Place new business capabilities under `backend/src/main/java/com/transportplatform/tms/features/<feature-name>`.
- Keep controllers thin, application services cohesive, and persistence isolated within the feature.
- Extend the shared audit entity for persisted aggregates where audit metadata is required.
- Avoid introducing cross-feature coupling through direct field access or duplicated DTOs.

## Frontend Conventions

- Place new capabilities under `frontend/src/features/<feature-name>`.
- Reusable presentational components belong in `frontend/src/shared/components` only when they are not feature-specific.
- Route guards, auth state, and API concerns must remain centralized; do not duplicate authentication logic in feature modules.
- Build pages through layouts and shared theme tokens instead of one-off styling.

## Delivery Guardrails

- Implement business modules in vertical slices that include API, data, authorization, and UI when applicable.
- Avoid placeholder mock business flows unless the task explicitly requires them.
- Keep migrations forward-only and additive.
