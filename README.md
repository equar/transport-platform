# Transportation Management Platform Monorepo

Production-ready starter monorepo for a multi-tenant transportation management SaaS platform. This repository establishes the platform foundation only: shared architecture, security and tenant primitives, delivery assets, and documentation. Business modules are intentionally deferred for batch-by-batch implementation.

## Repository Layout

```text
.
|-- backend/   Spring Boot API, security, tenancy, audit, Flyway
|-- frontend/  React + TypeScript + Material UI application shell
|-- infra/     Docker, Nginx, local scripts
|-- docs/      Architecture and requirements documents
`-- .github/   CI workflow and Copilot instructions
```

## Foundation Scope

- Backend package-by-feature foundation with common modules for audit, security, exception handling, tenant context, response envelopes, and configuration.
- Frontend feature-based module structure with routing, protected routes, layout shell, shared UI primitives, theme, and API client setup.
- Flyway-backed database migration baseline.
- Dockerfiles for backend and frontend plus local `docker-compose.yml` for MySQL, API, and UI.
- CI workflow that validates backend and frontend builds independently.

## Stack

- Backend: Java 25, Spring Boot, Spring Security, Spring Data JPA, Flyway, MySQL
- Frontend: React, TypeScript, Vite, Material UI, Axios, React Router
- Infra: Docker Compose, Nginx, GitHub Actions

## Local Development

### Prerequisites

- Java 25
- Maven 3.9+
- Node.js 22+
- Docker Desktop

### Start with Docker Compose

```powershell
docker compose up --build
```

Services:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080/api`
- MySQL: `localhost:3306`

### Start Individually

Backend:

```powershell
Set-Location backend
mvn spring-boot:run
```

If test-compilation failures unrelated to runtime startup block local execution, use:

```powershell
mvn -Dmaven.test.skip=true spring-boot:run
```

Backend API docs:

- Swagger UI: `http://localhost:8080/api/swagger-ui/index.html`
- OpenAPI JSON: `http://localhost:8080/api/v3/api-docs`

Frontend:

```powershell
Set-Location frontend
npm install
npm run dev
```

## Environment Variables

Use a local `.env` file or shell environment variables for sensitive settings.

Backend:

- `APP_SECURITY_JWT_SECRET`
- `APP_BOOTSTRAP_PLATFORM_ADMIN_EMAIL`
- `APP_BOOTSTRAP_PLATFORM_ADMIN_PASSWORD`
- `APP_SECURITY_ALLOWED_ORIGINS`
- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`

Frontend:

- `VITE_API_BASE_URL`

Docker Compose:

- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_ROOT_PASSWORD`
- `SPRING_PROFILES_ACTIVE`

## Troubleshooting

- Swagger UI is available only in `local` and `dev` profiles at `http://localhost:8080/api/swagger-ui/index.html`.
- Production profile disables Swagger/OpenAPI endpoints by default.

## Delivery Standards

- Keep backend code feature-oriented. Shared technical concerns stay in `common`, domain capabilities live under `features`.
- Keep frontend code feature-oriented. Shared runtime infrastructure belongs under `src/app` and `src/shared`; business-facing modules belong under `src/features`.
- Add business modules incrementally with migrations, tests, and API contracts in the same batch.
- Preserve tenant awareness and response contracts in all future modules.

## Next Implementation Batches

1. Identity and user management.
2. Tenant administration and onboarding.
3. Transport order lifecycle.
4. Fleet and driver operations.
5. Billing, reporting, and integration modules.
