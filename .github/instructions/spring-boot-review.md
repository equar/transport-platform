Spring Boot Review Guidelines

Copilot must review:

Architecture
Controller layer clean
Service layer logic
Repository clean

Avoid business logic in controllers

Entity Review

Check:

audit fields
status enum
tenantId
relationships
DTO Review

Ensure:

request DTO
response DTO

Never return entities directly

Service Layer

Ensure:

business logic centralized
validation included
tenant checks
Repository Review

Check:

tenant filters
pagination
performance
Security Review

Ensure:

role based access
tenant isolation
Exception Handling

Use:

GlobalExceptionHandler

Return:

message
timestamp
status
Logging Review

Add logs for:

create
update
delete
Validation Review

Use:

@NotNull
@NotBlank
@Valid
Performance Review

Check:

pagination
indexing
lazy loading
Test Review

Add tests for:

service logic
security rules

Production Readiness

Ensure:

no debug code
no unused imports
