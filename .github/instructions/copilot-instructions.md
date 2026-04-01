Kirshi Transport Platform — GitHub Copilot Instructions

## Purpose

These instructions define the default expectations for code generated or modified in the Transport Platform repository.

The platform is:

- Multi-tenant SaaS
- Enterprise-grade
- Production-ready
- Modular and feature-oriented

Copilot must:

- Review the existing implementation before changing code
- Make the smallest safe change that solves the problem
- Preserve architecture consistency and naming patterns
- Prefer production-ready solutions over demo-style shortcuts

## Core Principles

### Always

- Keep business logic in the service layer
- Use DTOs at the API boundary
- Enforce tenant isolation in every applicable backend flow
- Preserve role-based access and scoped visibility
- Add loading, empty, and error states in frontend experiences
- Keep changes maintainable, scalable, and consistent with existing patterns

### Never

- Put business logic in controllers
- Return JPA entities directly from APIs
- Accept tenant identity from the frontend when it should come from authentication
- Return cross-tenant data
- Trust frontend validation alone
- Leave placeholder or demo-only code in production paths

## Backend Standards

### Architecture

- Use Spring Boot conventions already established in the repository
- Keep code organized by feature
- Maintain a clear separation between controller, service, repository, and domain layers
- Use global exception handling rather than ad hoc controller error responses

### Entities

All persistent entities must follow platform conventions. Include the following where applicable:

- `id`
- `tenantId`
- `status`
- `createdBy`
- `createdAt`
- `updatedBy`
- `updatedAt`

Use enum-based status values such as:

- `ACTIVE`
- `INACTIVE`
- `PENDING`
- `SUSPENDED`
- `CANCELLED`

Do not use raw status strings in domain logic.

### Multi-Tenant Rules

- Resolve tenant context from the authenticated user or security context
- Enforce tenant filtering in service and repository logic
- Validate tenant ownership before reading or mutating tenant-scoped data
- Prevent cross-tenant access in every endpoint and query path

### API Design

- Use RESTful endpoints and proper HTTP status codes
- Support pagination and filtering where the feature already follows those patterns
- Use request DTOs for input and response DTOs for output
- Handle empty `keyword` search input gracefully

Preferred API patterns:

- `/api/drivers`
- `/api/rides`
- `/api/invoices`

Preferred pagination parameters:

- `page`
- `size`
- `sort`

Preferred paginated response shape:

- `content`
- `totalElements`
- `totalPages`

### Validation

- Use Bean Validation for request models
- Add service-layer validation for business rules
- Validate tenant ownership, required fields, numeric ranges, dates, and status transitions

### Logging

- Log meaningful create, update, delete, and assignment events
- Do not log secrets, tokens, or sensitive personal data

## Frontend Standards

### Stack

- React
- TypeScript
- Material UI

### Implementation Rules

- Prefer reusable components over repeated page-specific markup
- Use controlled forms or the existing project form approach consistently
- Keep routing, layouts, and role-based UI behavior explicit and maintainable
- Preserve portal-specific boundaries for driver, rider, guardian, and organization experiences

### UX Requirements

Every meaningful frontend workflow should account for:

- Loading state
- Empty state
- Error state

Use Material UI patterns consistently for:

- Tables
- Dialogs
- Forms
- Chips
- Layout containers

## Security And Data Handling

- Validate all sensitive operations on the backend
- Avoid exposing internal identifiers unless required by an established API contract
- Keep authorization and tenant scoping aligned with the user session
- Ensure frontend role-based visibility does not replace backend access enforcement

## Quality Bar

Generated code must be:

- Clean
- Consistent
- Maintainable
- Scalable
- Production-ready

Avoid:

- Debug code left in production paths
- Unused imports and dead branches
- Placeholder comments instead of real behavior
- Architecture drift from established repository patterns
