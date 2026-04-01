# Transportation Management Platform Monorepo

Multi-tenant transportation management platform with a public SaaS website, an authenticated operations application, and dedicated driver, rider or guardian, and organization portal experiences. The repository is structured as a monorepo with a Spring Boot backend, a React frontend, shared delivery assets, and platform documentation.

## Repository Layout

```text
.
|-- backend/   Spring Boot API, multi-tenant domain services, security, audit, Flyway
|-- frontend/  React + TypeScript + Material UI public site, app shell, and portals
|-- infra/     Docker, Nginx, local scripts
|-- docs/      Architecture and requirements documents
`-- .github/   CI workflow and Copilot instructions
```

## Current Platform Surface

- Public-facing website with marketing, pricing, FAQ, contact, and application entry points.
- Role-aware authentication and recovery flows that lead into tenant-scoped application experiences.
- Internal operations application for platform and company users, including domains such as tenants, users, roles, riders, drivers, vehicles, routes, rides, dispatch, compliance, billing, reports, incidents, notifications, and settings.
- Dedicated portals for drivers, riders or guardians, and organizations, each with scoped navigation and feature visibility.
- Multi-tenant backend with feature-oriented modules, JWT-based security, audit logging, tenant context propagation, and Flyway-managed schema evolution.
- Docker-based local runtime and separate backend or frontend local run workflows.

## Stack

- Backend: Java 25, Spring Boot 3.5.13, Spring Security, Spring Data JPA, Flyway, MySQL, springdoc OpenAPI
- Frontend: React 18, TypeScript 5, Vite 6, Material UI 6, Axios, React Router 6
- Infra: Docker Compose, Nginx, GitHub Actions

## Local Development

### Prerequisites

- Java 25
- Maven 3.9+
- Node.js 22+
- Docker Desktop

If your machine does not have JDK 25 installed, local backend compile and test commands will fail because the Maven build targets Java release 25.

### Start with Docker Compose

```powershell
docker compose up --build
```

Services:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080/api`
- MySQL: `localhost:3306`
- Backend health: `http://localhost:8080/api/actuator/health`
- Swagger UI in local or dev profiles: `http://localhost:8080/api/swagger-ui/index.html`

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
npm ci
npm run dev
```

Frontend validation build:

```powershell
Set-Location frontend
npm run build
```

## Application Areas

- Public site: `/`, `/solutions`, `/features`, `/pricing`, `/faq`, `/contact`, `/apply`
- Auth flows: `/login`, `/forgot-password`, `/reset-password`, `/unauthorized`
- Internal app shell: authenticated platform and company administration areas such as `/dashboard`, `/dispatch`, `/rides`, `/drivers`, `/vehicles`, `/billing`, and related management views
- Driver portal: `/portal/driver/...`
- Rider or guardian portal: `/portal/rider/...`
- Organization portal: `/portal/organization/...`

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

- `VITE_API_BASE_URL` defaulting to `/api`

Docker Compose:

- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_ROOT_PASSWORD`
- `SPRING_PROFILES_ACTIVE`

## Troubleshooting

- Swagger UI is available only in `local` and `dev` profiles at `http://localhost:8080/api/swagger-ui/index.html`.
- Production profile disables Swagger/OpenAPI endpoints by default.
- Backend health checks are exposed at `http://localhost:8080/api/actuator/health`.
- If local backend startup is blocked by unrelated stale test compilation, use `mvn -Dmaven.test.skip=true spring-boot:run` only as a temporary local workaround.
- Frontend production validation should be run from `frontend/` with `npm run build`.

## Delivery Standards

- Keep backend code feature-oriented. Shared technical concerns stay in `common`, domain capabilities live under `features`.
- Keep frontend code feature-oriented. Shared runtime infrastructure belongs under `src/app` and `src/shared`; business-facing modules belong under `src/features`.
- Preserve tenant awareness and response contracts in all future modules.
- Keep public site, admin application, and portal experiences aligned in terminology and UX behavior.

## Documentation Map

- [docs/architecture.md](docs/architecture.md) for the current platform architecture and application layers.
- [docs/requirements.md](docs/requirements.md) for the delivered platform surface and deferred areas.
- [backend/README.md](backend/README.md) for backend-focused development notes.
- [frontend/README.md](frontend/README.md) for frontend-focused development notes.
