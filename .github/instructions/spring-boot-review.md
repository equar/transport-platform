---
applyTo: "backend/src/main/java/**/*.java,backend/src/test/java/**/*.java"
description: "Review and generate Spring Boot backend code for architecture, DTOs, services, repositories, tenant isolation, validation, security, performance, and tests."
---

# Spring Boot Review Guidelines

## Review Goals

Review backend changes for:

- Clean architecture boundaries
- Correct controller, service, and repository responsibilities
- DTO-based API design
- Tenant isolation and role-aware security
- Validation, performance, and production readiness

## Architecture Review

Ensure:

- Controllers stay thin and delegate business logic to services
- Services contain business rules, validation, and tenant checks
- Repositories remain focused on persistence and query logic
- Code stays aligned with the repository's package-by-feature structure

Never place business logic in controllers.

## Entity Review

Check entities for:

- Audit fields
- Status enum usage
- `tenantId` where applicable
- Correct relationship mapping and ownership

Confirm entity design does not weaken tenant isolation or introduce unnecessary eager loading.

## DTO Review

Ensure:

- Request DTOs are used for API input
- Response DTOs are used for API output
- Validation annotations are applied where appropriate

Never return entities directly from controllers.

## Service Layer Review

Ensure services include:

- Centralized business logic
- Service-level validation
- Tenant ownership validation
- Proper status transition checks
- Clear, consistent orchestration of repositories and mappers

## Repository Review

Check repositories for:

- Tenant filters on tenant-scoped data
- Pagination support where expected
- Query efficiency and readability
- Avoidance of unnecessary full-table scans or N+1 query patterns

## Security Review

Ensure:

- Role-based access is enforced appropriately
- Tenant isolation is preserved at every layer
- Sensitive operations validate access beyond frontend assumptions

## Exception Handling Review

Prefer:

- `GlobalExceptionHandler`

Error responses should consistently include:

- `message`
- `timestamp`
- `status`

## Validation Review

Use and verify as appropriate:

- `@NotNull`
- `@NotBlank`
- `@Valid`

Also confirm validation covers:

- Required fields
- Numeric ranges
- Dates
- Tenant ownership
- Status transitions

## Logging Review

Add or verify logs for:

- Create operations
- Update operations
- Delete operations

Do not log sensitive data.

## Performance Review

Check for:

- Pagination on list endpoints
- Index-aware query behavior where relevant
- Sensible lazy loading behavior
- Avoidable mapping or query overhead

## Test Review

Add or update tests for:

- Service logic
- Security rules
- Tenant isolation when relevant
- Validation and failure paths when behavior changes

## Production Readiness

Ensure:

- No debug code remains
- No unused imports remain
- Naming is consistent
- Error handling is intentional
- The final code matches the established backend architecture
