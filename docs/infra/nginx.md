# Nginx

Purpose: reverse proxy for VPS traffic.

## Files

```text
infrastructure/nginx/
  nginx.conf
  mime.types
  templates/
    web.conf.template
    admin.conf.template
    api.conf.template
    default.conf.template
  snippets/
    proxy.conf
    ssl.conf
    security.conf
    health.conf
    cache.conf
```

Templates are part of the deploy artifact. The official nginx entrypoint renders them into `conf.d` when the container starts.

## Domains

Nginx reads hostnames from `/etc/cinema/env/nginx.env`:

```env
WEB_HOST=cine.io.vn
ADMIN_HOST=admin.cine.io.vn
API_HOST=api.cine.io.vn
```

Example source: `infrastructure/nginx/.env.example`.

Staging uses flat hostnames:

```env
WEB_HOST=staging.cine.io.vn
ADMIN_HOST=admin-staging.cine.io.vn
API_HOST=api-staging.cine.io.vn
```

Routing:

- `WEB_HOST` -> `web-user:80`
- `ADMIN_HOST` -> `web-admin:80`
- `API_HOST` -> `api:3000`

HTTP redirects to HTTPS except nginx health.

Cloudflare DNS should point each hostname to the matching VPS. Use flat staging names to avoid multi-level wildcard SSL requirements:

```text
staging.cine.io.vn
api-staging.cine.io.vn
admin-staging.cine.io.vn
```

The SSL files mounted at `/etc/cinema/ssl` must cover the hostnames configured for that VPS.

## Health

- Reverse nginx health: `/nginx-health`, returns plain `ok`.
- API health: proxied to Nest API health endpoint.
- Web apps are considered healthy by serving the SPA/static container.

Do not use web-domain `/health` as a public contract.

## DNS And Reload

Nginx uses Docker DNS (`127.0.0.11`) and variable `proxy_pass` to avoid stale container IPs after deploy. Shared deploy runtime reloads a running nginx container after public app deploys, starts it when missing, and updates it explicitly when `nginx` is a target.

Related: [Docker](docker.md), [Deploy](../workflow/deploy.md)
