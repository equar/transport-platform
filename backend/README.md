# Backend Foundation

Spring Boot backend foundation for the transportation management SaaS platform.

## Stack

- Java 21
- Spring Boot 3
- Spring Security with JWT skeleton
- Spring Data JPA
- Flyway
- MySQL

## Package Structure

```text
src/main/java/com/transportplatform/tms
|-- common/
|   |-- audit/
|   |-- config/
|   |-- exception/
|   |-- response/
|   |-- security/
|   `-- tenant/
`-- features/
    `-- auth/
```

## Local Run

```powershell
mvn spring-boot:run
```

The default profile is `local`. Database and JWT values can be overridden via environment variables.

## Initial Foundation Scope

- Shared audit entity and JPA auditing.
- Canonical API response and error contract.
- JWT parsing and token generation primitives.
- Request-scoped tenant context using `X-Tenant-Id`.
- Auth module skeleton for future implementation.
- Flyway baseline migration for tenants and users.

## Deferred Work

- Credential verification and password lifecycle.
- Refresh token persistence and revocation.
- Tenant provisioning and data isolation enforcement beyond request context.
- Business feature modules.
