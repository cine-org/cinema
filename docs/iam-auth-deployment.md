# User, Authentication and IAM deployment contract

This document is the hand-off contract for Ops. It does not change the `cinema-ops` repository.

## Release order

1. Create the API and integration secrets listed below.
2. Run the database migration once with the new API image: `pnpm db:deploy`.
3. Run the idempotent IAM seed as a release job: `pnpm --filter @repo/database db:seed` (or the equivalent command from the repository build image).
4. Deploy the API and point probes at `/health/live` and `/health/ready`.
5. Deploy the integration worker. SMTP availability does not participate in API readiness.

The migration keeps the legacy `"User"` table for rollback, copies IDs/usernames/email state to the new tables, and deliberately does not migrate `dev-only-password-hash` as a credential.

## Shared runtime variables

| Variable                      | Consumer                             | Contract                                                                                                                    |
| ----------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                | API, integration, migration/seed job | PostgreSQL URL.                                                                                                             |
| `AUTH_OUTBOX_ENCRYPTION_KEY`  | API, integration                     | The same base64-encoded 32-byte AES key in both workloads. Rotate only with a drain/migration plan for pending outbox rows. |
| `WEB_ORIGIN`                  | API, integration                     | Exact trusted browser origin and base URL for email links.                                                                  |
| `BOOTSTRAP_SUPER_ADMIN_EMAIL` | seed job only                        | Optional normalized email of an already verified, active user that should receive `SUPER_ADMIN`.                            |

## API-only variables

| Variable                        | Required value                                                     |
| ------------------------------- | ------------------------------------------------------------------ |
| `AUTH_JWT_PRIVATE_KEY_BASE64`   | Base64-encoded RSA PKCS#8 PEM private key. Required in production. |
| `AUTH_JWT_PUBLIC_KEY_BASE64`    | Base64-encoded RSA SPKI PEM public key. Required in production.    |
| `AUTH_JWT_ISSUER`               | Stable issuer, default `cinema-api`.                               |
| `AUTH_JWT_AUDIENCE`             | Stable audience, default `cinema-web`.                             |
| `AUTH_ACCESS_TOKEN_TTL_SECONDS` | `900` (15 minutes).                                                |
| `AUTH_SESSION_TTL_SECONDS`      | `2592000` (30 days, absolute).                                     |
| `AUTH_VERIFICATION_TTL_SECONDS` | `86400` (24 hours).                                                |
| `AUTH_RESET_TTL_SECONDS`        | `1800` (30 minutes).                                               |
| `AUTH_REFRESH_COOKIE_NAME`      | Default `cinema_refresh`.                                          |

Keep the existing `PORT`, `API_ORIGIN`, `API_PREFIX`, `CORS_ORIGINS`, `ENABLE_SWAGGER`, and `LOG_LEVEL` variables. `CORS_ORIGINS` must include `WEB_ORIGIN`.

## Integration-only variables

`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, optional `SMTP_USER`/`SMTP_PASSWORD`, `MAIL_FROM`, and `OUTBOX_POLL_INTERVAL_MS` configure delivery. SMTP failures are retried from PostgreSQL with exponential backoff and do not make the API unready.

## Rollback and operational notes

- Do not drop the legacy `"User"` table in this release.
- PostgreSQL is the authorization source of truth; no Redis permission cache needs invalidation.
- JWTs contain identifiers only. Role and permission changes apply on the next request.
- Run the seed after every environment migration; it is idempotent and restores the system-role permission mappings.
- Do not log request cookies, passwords, email challenge tokens, JWTs, or `encrypted_payload`.
