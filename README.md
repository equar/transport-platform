# Transportation Management Platform Monorepo

Multi-tenant transportation management platform with a public SaaS website, an authenticated operations application, and dedicated driver, rider or guardian, and organization portal experiences. The repository is structured as a monorepo with a Spring Boot backend, a React frontend, shared delivery assets, and platform documentation.

## Repository Layout

```text
.
|-- backend/   Spring Boot API, multi-tenant domain services, security, audit, Flyway
|-- frontend/  React + TypeScript + Material UI public site, app shell, and portals
|-- infra/     Local run scripts
|-- docs/      Architecture and requirements documents
`-- .github/   CI workflow and Copilot instructions
```

## Current Platform Surface

- Public-facing website with marketing, pricing, FAQ, contact, and application entry points.
- Role-aware authentication and recovery flows that lead into tenant-scoped application experiences.
- Internal operations application for platform and company users, including domains such as tenants, users, roles, riders, drivers, vehicles, routes, rides, dispatch, compliance, billing, reports, incidents, notifications, and settings.
- Dedicated portals for drivers, riders or guardians, and organizations, each with scoped navigation and feature visibility.
- Multi-tenant backend with feature-oriented modules, JWT-based security, audit logging, tenant context propagation, and Flyway-managed schema evolution.
- Direct local runtime for Spring Boot and the Vite frontend, with MySQL running on the host machine.

## Stack

- Backend: Java 25, Spring Boot 3.5.13, Spring Security, Spring Data JPA, Flyway, MySQL, springdoc OpenAPI
- Frontend: React 18, TypeScript 5, Vite 6, Material UI 6, Axios, React Router 6
- Infra: PowerShell local run scripts, GitHub Actions

## Local Development

### Prerequisites

- Java 25
- Maven 3.9+
- Node.js 22+
- Local MySQL 8+

If your machine does not have JDK 25 installed, local backend compile and test commands will fail because the Maven build targets Java release 25.

### Local Database

```powershell
mysql -u transport -p
```

Make sure your local MySQL instance is running and that the backend database credentials match the configured environment variables.

Defaults expected by the backend if you do not override them:

- Database URL: `jdbc:mysql://localhost:3306/transport_platform?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC`
- Username: `transport`
- Password: `transport`

Create the `transport_platform` database if needed, or let MySQL create it automatically with `createDatabaseIfNotExist=true`. Adjust `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, or `MYSQL_PASSWORD` if your local MySQL setup differs.

### Start Both Apps

From the repository root:

```powershell
./infra/scripts/start-local.ps1
```

Services:

- Frontend: `http://localhost:3007`
- Backend: `http://localhost:8087/api`
- MySQL: `localhost:3306`
- Backend health: `http://localhost:8087/api/actuator/health`
- Swagger UI in local or dev profiles: `http://localhost:8087/api/swagger-ui/index.html`

Stop both local processes with:

```powershell
./infra/scripts/stop-local.ps1
```

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

- Swagger UI: `http://localhost:8087/api/swagger-ui/index.html`
- OpenAPI JSON: `http://localhost:8087/api/v3/api-docs`

Frontend:

```powershell
Set-Location frontend
npm ci
npm run dev
```

The Vite dev server runs on port `3007` and proxies `/api` requests to `http://localhost:8087`, matching the AWS port layout while preserving same-origin browser requests.

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

Frontend:

- `VITE_API_BASE_URL` defaulting to `/api`

For non-Docker AWS deployment, keep `VITE_API_BASE_URL=/api` when the frontend and backend are served behind the same host, or set it to the full backend URL such as `https://api.example.com/api` when they are deployed separately.

## Non-Docker AWS Deployment

Backend jar deployment:

```powershell
Set-Location backend
mvn -B -DskipTests package
java -jar target/transport-platform-backend-0.1.0-SNAPSHOT.jar
```

Provide production values for `APP_SECURITY_JWT_SECRET`, `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, and `APP_SECURITY_ALLOWED_ORIGINS` before starting the jar on the AWS server or VM.

Frontend static deployment:

```powershell
Set-Location frontend
npm ci
npm run build
```

Deploy the generated `frontend/dist/` assets to your AWS web server or static host. If the backend is reverse-proxied under `/api` on the same host, the default API base URL is sufficient.

## Troubleshooting

- Swagger UI is available only in `local` and `dev` profiles at `http://localhost:8087/api/swagger-ui/index.html`.
- Production profile disables Swagger/OpenAPI endpoints by default.
- Backend health checks are exposed at `http://localhost:8087/api/actuator/health`.
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
