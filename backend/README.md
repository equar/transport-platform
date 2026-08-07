# Backend

Spring Boot backend for the transportation management platform. The backend is organized by feature and supports the public site, authenticated administration experience, and the driver, rider or guardian, and organization portals.

## Stack

- Java 25
- Spring Boot 3.5.13
- Spring Security with JWT-based authentication
- Spring Data JPA
- Flyway
- MySQL
- springdoc OpenAPI

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
    |-- audit/
    |-- auth/
    |-- billing/
    |-- companyapplication/
    |-- compliance/
    |-- dispatch/
    |-- driver/
    |-- driverportal/
    |-- incident/
    |-- notification/
    |-- organization/
    |-- organizationportal/
    |-- platform/
    |-- portalaccess/
    |-- report/
    |-- ride/
    |-- rider/
    |-- riderguardianportal/
    |-- role/
    |-- route/
    |-- runtime/
    |-- saas/
    |-- settings/
    |-- tenant/
    |-- user/
    `-- vehicle/
```

## Local Run

```powershell
mvn spring-boot:run
```

The default profile is `local`. Database and JWT values can be overridden via environment variables.
The default datasource points to a locally running MySQL instance on `localhost:3306`, defaulting to the `transport_platform` database with `transport` and `transport` credentials unless you override them.

If unrelated test-compilation failures block startup during local development, run:

```powershell
mvn -Dmaven.test.skip=true spring-boot:run
```

## Important Environment Variables

- `APP_SECURITY_JWT_SECRET`
- `APP_BOOTSTRAP_PLATFORM_ADMIN_EMAIL`
- `APP_BOOTSTRAP_PLATFORM_ADMIN_PASSWORD`
- `APP_SECURITY_ALLOWED_ORIGINS`
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`

Swagger/OpenAPI is enabled only for the `local` and `dev` profiles.

Useful local endpoints:

- API base: `http://localhost:8087/api`
- Swagger UI: `http://localhost:8087/api/swagger-ui/index.html`
- OpenAPI JSON: `http://localhost:8087/api/v3/api-docs`
- Actuator health: `http://localhost:8087/api/actuator/health`

## Non-Docker Deployment

Build a standard Spring Boot jar:

```powershell
mvn -B -DskipTests package
```

Run it on the target server:

```powershell
java -jar target/transport-platform-backend-0.1.0-SNAPSHOT.jar
```

Provide production values for:

- `APP_SECURITY_JWT_SECRET`
- `APP_SECURITY_ALLOWED_ORIGINS`
- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`

## Current Backend Scope

- JWT-backed authentication and tenant-aware request handling.
- Shared audit, response, exception, security, configuration, and tenant infrastructure.
- Feature-oriented APIs and services for platform administration, onboarding, operations, billing, compliance, reporting, notifications, and portal-scoped experiences.
- Portal access and runtime capability support for role-aware frontend behavior.
- Flyway-managed schema evolution across the implemented platform domains.
- Swagger/OpenAPI exposure for local and dev environments.

## Deferred Work

- External integrations and downstream workflow wiring beyond the current platform implementation.
- Additional operational hardening, scaling, and observability work as deployment requirements evolve.
- Future domain expansion beyond the currently implemented transportation, billing, compliance, and portal capabilities.
