# Transport production deployment

Transport now uses the deployment structure reviewed in `bingo-platform`: one
GitHub Actions SSH release workflow, selective application builds, validated
production configuration, protected runtime files, health checks and recovery.
Transport keeps its own database, domain, runtime paths, credentials and API
context. No Bingo credentials, domains, payment configuration, mobile release
workflows or database contents are reused.

## Release flow

`.github/workflows/deploy.yml` deploys after an in-repository PR is merged into
`main`. It checks out the merged release and reads the complete PR file list,
including deleted files and both names of renamed files. This covers merge,
squash and rebase strategies; selection does not depend on just the last rebase
commit. The standalone selector retains a first-parent Git fallback when no PR
metadata is supplied. Direct pushes do not deploy. Manual dispatch is
limited to `main` with `all`, `backend` or `frontend`. Runs serialize without
cancelling an in-flight release. Host activation also uses a shared lock to
serialize direct operator deployments.

| Change | Selected application |
| --- | --- |
| `backend/**`, backend activation/service/truststore | Backend |
| `frontend/**`, frontend activation/proxy template | Frontend |
| Workflow or shared production configuration | Both |
| Documentation, deployment tests, mobile-only changes | None |

Backend releases run Maven verification, including disposable MySQL tests, and
check generated client contracts. Frontend releases run tests and a production
build with `VITE_API_BASE_URL=/api`. All selected applications build before SSH
activation. PR CI remains the review gate; require it and deployment validation
in branch protection. The workflow does not modify branch protection.

## Runtime contract

| Component | Value |
| --- | --- |
| Public site and role portals | `https://transport.bakaroo.com` |
| API and mobile base URL | `https://transport.bakaroo.com/api` |
| Backend listener | `127.0.0.1:8087`, context `/api` |
| Service identity/unit | `transport`, `transport-platform-backend.service` |
| Backend JAR | `/opt/transport-platform/backend.jar` |
| Production environment | `/opt/transport-platform/.env`, root-owned mode 600 |
| Working directory | `/opt/transport-platform/runtime` |
| Writable application data | `/opt/transport-platform/documents`, `/opt/transport-platform/logs` |
| Static release root | `/var/www/transport-platform-releases/<release-id>` |
| Current/previous SPA | `/var/www/transport-platform`, `/var/www/transport-platform.previous` symlinks |
| MySQL schema | `transport_platform` |
| Isolated database CA roots | `/etc/transport-platform/database-truststore.jks` |

The backend is managed only through its systemd unit. Deployment no longer
kills arbitrary processes by port. Nginx serves ports 80/443; production does
not use Vite or expose port 3007. HTTPS serves the SPA and proxies `/api` on the
same origin. Only the exact public actuator health endpoint is proxied; other
actuator endpoints are available to authorized administrators on the private
backend listener. Camera/geolocation remain available to same-origin portals.

## Host and database prerequisites

1. Use an Ubuntu Lightsail/EC2 host with `/usr/bin/java` **25**, Python 3, Nginx,
   curl, tar, iproute2 (`ss`), util-linux (`flock`), OpenSSL, gettext-base (`envsubst`), Certbot and passwordless sudo
   for the deployment SSH account. Allow SSH from the runner and public 80/443;
   keep 8087, 3007 and the database private. The scripts do not provision AWS.
2. Provision `transport_platform` on private MySQL using a separate application
   identity scoped to that schema with the privileges needed by Flyway. Create
   the schema before the first release; Flyway creates application tables but
   cannot connect to a nonexistent database. An authorized database administrator
   can create it with `CREATE DATABASE IF NOT EXISTS transport_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`.
   Supply the database's DNS hostname: JDBC uses `sslMode=VERIFY_IDENTITY`. Backend deployment
   prepares an isolated Java truststore from standard public roots and the
   official AWS RDS root bundle, preserving outbound Graph/Expo HTTPS trust.
3. Point the transport domain to the host. Configure HTTPS/Nginx once, before
   application deployment. Copy the following relative layout to the host:

   ```text
   deployment/nginx-transport-platform.conf.template
   deployment/aws/setup-web-host.sh
   ```

   Run on the host:

   ```bash
   sudo env APP_DOMAIN=transport.bakaroo.com CERTBOT_EMAIL=ops@example.com \
     bash deployment/aws/setup-web-host.sh
   ```

   This changes only Transport's vhost and `transport-platform` certificate.
   It validates the proxy and restores the previous config/link on failure.
   Certificate renewal reuses system timers. Nginx/certificate changes stay
   separate from routine application releases. After changing the template,
   explicitly rerun this setup; uploading a SPA does not install proxy changes.
   `/health` verifies HTTPS routing only. After application deployment, also
   verify `/`, a JavaScript asset from `index.html`, `/login`, and
   `/api/actuator/health`. A working certificate alone does not confirm the
   frontend files or backend are available.

   The existing `deployment/setup-aws-host.sh` SSH wrapper supports the same
   operation when `LIGHTSAIL_HOST`, `LIGHTSAIL_USER`, `SSH_KEY`,
   `SSH_KNOWN_HOSTS_FILE`, `APP_DOMAIN` and `CERTBOT_EMAIL` are exported.
4. Configure monitoring, data backups/restores, certificate expiry and disk/log
   retention. Release directories and the preceding backend files are retained;
   clean older static releases according to an agreed retention policy, keeping
   targets of both active symlinks. Do not introduce extra backend replicas
   until scheduler/queue ownership and related process state have been reviewed.

## GitHub configuration

Copy `deployment/aws/github-actions.env.example` to the ignored
`deployment/aws/github-actions.env`. Enter literal `KEY=VALUE` values; do not
source that file as shell code. Verify SSH fingerprints out of band and supply
`LIGHTSAIL_KNOWN_HOSTS` with the correct OpenSSH host entry. `ssh-keyscan` output
alone is not trusted. Multiple known-host lines can be represented with literal
`\n` separators in the importer file.

Import explicitly with authenticated `gh`:

```bash
GH_REPO=owner/transport-platform \
  bash deployment/aws/bootstrap-github-actions-config.sh deployment/aws/github-actions.env
```

The importer validates the whole file before writing any repository settings,
never executes values, and sends values over stdin. It does not deploy or
create cloud resources. Empty optional values are skipped: delete obsolete
stored secrets explicitly when disabling a feature.

Required **secrets**:

- `LIGHTSAIL_HOST`, `LIGHTSAIL_USER`: host/account. Existing repository variables
  with those names remain a fallback during migration.
- `LIGHTSAIL_SSH_KEY_B64` (preferred) or `LIGHTSAIL_SSH_KEY`: complete unencrypted
  deployment key. `LIGHTSAIL_KNOWN_HOSTS`: independently verified host entries.
- `MYSQL_PASSWORD`, `APP_SECURITY_JWT_SECRET`: transport database password and
  signing secret containing at least 32 random bytes.

Required **variables**: `MYSQL_HOST`, `MYSQL_USER`; `MYSQL_PORT` defaults to 3306.
`APP_PUBLIC_URL` and `APP_SECURITY_ALLOWED_ORIGINS` default to the transport HTTPS
origin. CORS must contain that origin. API build URL is fixed to `/api`.

Optional settings:

- `APP_AUTH_PASSWORD_RESET_BASE_URL` defaults to the public `/reset-password` URL.
- `VITE_GOOGLE_MAPS_API_KEY` is a browser-visible Maps key. Restrict its referrers
  and enabled APIs; it is not treated as a backend credential.
- Bootstrap is **off by default**, in both configuration generation and the prod
  profile. For deliberate first-admin creation, set
  `APP_BOOTSTRAP_PLATFORM_ADMIN_ENABLED=true`, the email variable, and a bootstrap
  password secret of at least 20 characters. Deploy backend, change the initial
  password, disable bootstrap, remove the secret and redeploy backend.
- Graph email requires `APP_EMAIL_ENABLED=true`,
  `APP_EMAIL_PROVIDER=microsoft-graph`, `APP_EMAIL_FROM`, Graph client/tenant ID
  variables and `MICROSOFT_GRAPH_CLIENT_SECRET`. Transport implements Graph and
  logging, so Bingo's SMTP/`graph` provider names are not copied.
- Push requires `APP_PUSH_ENABLED=true`, `APP_PUSH_PROVIDER=expo`, configured
  native push credentials, and optionally the `EXPO_ACCESS_TOKEN` secret.
  Deployment includes push settings; the former workflow omitted them.
- Disabled delivery defaults to logging; logging does not deliver recovery
  email or push messages. Configure real delivery before offering those flows.
- Production logging levels accept INFO/WARN/ERROR/OFF, and reject DEBUG/TRACE
  to avoid exposing bind parameters, reset links or rider records.

Schema, backend port, listener, production profile, migration location,
Hibernate validation, secure refresh cookies and document paths are fixed by
runtime configuration. Old `SERVER_PORT`/`FRONTEND_PORT` repository variables
are no longer used. Update old importer files from the new example rather than
reusing obsolete keys. No AWS access keys or OIDC role are required for SSH
application deployment.

## First cutover from the previous Ubuntu-user service

The new backend deliberately refuses to replace an existing service running as
`ubuntu` or another shared identity. Perform a planned, backed-up cutover once:

1. Save the existing JAR, environment, unit, proxy config and database snapshot.
2. On the host, create the dedicated user and truststore, then stop Transport:

   ```bash
   sudo useradd --system --home /opt/transport-platform --shell /usr/sbin/nologin transport
   sudo bash deployment/aws/setup-rds-truststore.sh
   sudo systemctl stop transport-platform-backend.service
   sudo install -d -o root -g root -m 755 /opt/transport-platform/runtime
   sudo mkdir -p /opt/transport-platform/documents/driver-documents /opt/transport-platform/logs
   sudo chown -R transport:transport /opt/transport-platform/documents /opt/transport-platform/logs
   sudo chmod 750 /opt/transport-platform/documents /opt/transport-platform/logs
   sudo chown root:root /opt/transport-platform/.env
   sudo chmod 600 /opt/transport-platform/.env
   sudo install -m 644 deployment/transport-platform-backend.service \
     /etc/systemd/system/transport-platform-backend.service
   sudo systemctl daemon-reload
   sudo systemctl start transport-platform-backend.service
   curl -fsS http://127.0.0.1:8087/api/actuator/health
   ```

   Skip `useradd` if the account already exists. Ensure any preexisting document
   files/subdirectories are readable and writable by this account. Starting the
   old JAR with the dedicated unit first establishes a healthy rollback point.
3. Configure the new verified-host secret and runtime variables, update the
   Transport vhost/certificate if needed, then run a manual `all` deployment
   from the latest `main`. Check API, login/refresh, scoped dispatch, uploads,
   password reset, Graph/Expo delivery and the published `/release.json`.

The legacy cross-application credential-copy, environment sync and local-password
bootstrap helpers now fail with a migration message. They no longer read another
application's `.env`, rotate secrets implicitly, or copy credentials from local
files to a remote host.

## Failure handling and recovery

Backend activation retains the previous **healthy** JAR/environment/unit pair,
checks startup health and attempts restoration if the new release fails. It
reports failed rollback health rather than claiming recovery. Its environment
is root-owned and parsed by systemd, not a shell. Startup diagnostics redact
known runtime secret values. MySQL/Flyway changes are **not** rolled back;
snapshot before a migration that may be incompatible with the previous binary.

Frontend activation extracts a validated archive into a new release directory,
then changes the current symlink atomically. It verifies the exact public
release ID, SPA response and API health. Failed verification restores the
previous root when available. The proxy can serve the preceding release's
hashed assets for already-open tabs. The first legacy directory-to-symlink
conversion is a one-time cutover; subsequent changes are atomic.

Deployments of both applications are ordered backend then frontend. A partial
failure is a failed workflow, not a cross-application transaction: resolve it
and manually deploy `all` from latest `main` to reconcile. Change detection is
based on the current merge, not the last successful release. Do not redeploy an
old workflow run as an accidental code downgrade.

For direct CLI deployment, export the validated production settings and
`LIGHTSAIL_HOST`/`LIGHTSAIL_USER`, plus `SSH_KEY` and `SSH_KNOWN_HOSTS_FILE` paths.
Existing private key/verified-host files can be used without duplicating their
contents into Base64/known-host environment variables. Then use the entrypoints:

```bash
bash deployment/deploy-backend-aws.sh
bash deployment/deploy-frontend-aws.sh
bash deployment/deploy-aws.sh
```

These wrappers build/test before calling the same activation scripts as Actions;
there is no independent deployment implementation. Combined deployment builds
both artifacts before changing the host. Mobile app store publishing is separate
and is not copied from Bingo's Flutter/Dart workflows.

## Validation

Run `python3 -m unittest discover -s deployment/aws/tests -v` for change detection,
configuration validation, environment serialization, mocked SSH activation and
frontend rollback, whole-file importer validation, shell parsing and rendered
Nginx syntax (when Nginx/OpenSSL are installed). The deployment validation
workflow runs these checks on Ubuntu. These tests do not perform a production
release or provision infrastructure.

Local adaptation verification: the backend's full Maven verification passed
143 tests, including MySQL integration tests. Deployment validation covers
19 cases; the two deployment workflows also pass pinned actionlint 1.7.7.
Production SSH activation, certificate issuance and GitHub execution still
require the target host/configuration; no live release was performed during
this adaptation.
