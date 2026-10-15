# Next Runtime Config

Purpose: how a Next.js app receives values that differ per environment (api origin, public keys)
when the same image runs everywhere. Applies to every web app.

## Problem

`NEXT_PUBLIC_*` values are inlined into the JavaScript at `next build`. An image built once and
promoted from staging to production keeps the staging value. Values the browser needs must
therefore be read when the server starts, not when the image is built.

## Mechanism

```text
container start (API_ORIGIN=...)
  └─ layout.tsx (server)   const config = await getConfig()      reads process.env per request
        └─ <ConfigProvider value={config}>                        client context
              └─ any client component: const { apiOrigin } = useConfig()
```

- `config/get-config.ts` runs on the server. `await connection()` makes the route render per
  request; without it Next evaluates `process.env` once at build and freezes the value.
- `config/config-provider.tsx` is a client component holding the value in React context.
- Import both files directly. A barrel would pull `next/server` into client bundles.
- Server components and route handlers do not need the provider: they read `process.env` themselves.
- Only values safe for browsers belong in `AppConfig`. Secrets stay on the server.

## Where the provider mounts

Reading env in a layout makes every route under that layout render per request. The two kinds of
app choose differently.

|          | Public site (SEO matters)                                              | App behind login (no SEO) |
| -------- | ---------------------------------------------------------------------- | ------------------------- |
| Data     | Fetched in server components, cached (`revalidate`, tags)              | Fetched in the browser    |
| Pages    | Catalog pages static or ISR                                            | All dynamic               |
| Provider | Only in the layout of the group that needs the browser to call the api | Root layout               |
| Indexing | Metadata API, sitemap, canonical, structured data                      | `noindex`                 |

A public site keeps its root layout free of env reads and splits routes into groups:

```text
app/
  layout.tsx            html and body only: no env read, catalog pages stay static
  (catalog)/            static or ISR, server-side data
  (account)/layout.tsx  await getConfig() + <ConfigProvider>: dynamic only here
```

An app behind login mounts the provider in the root layout: there is nothing to cache for
crawlers, and every page needs the api origin.

## Api clients

- Browser client: built from `useConfig()`, sends cookies (`credentials: 'include'`), carries the
  auth middleware. Each app owns its own, typed with its own SDK `paths`.
- Server client (public site): reads `process.env` directly and uses `fetch` so Next can cache it.
  Libraries that do not use `fetch` (axios) bypass that cache.
- Endpoints excluded from the OpenAPI spec (`/health`) are not in `paths`: call them with plain `fetch`.

## Rules

- Never read `process.env.NEXT_PUBLIC_*` for values that change per environment.
- Never put `getConfig()` in a client component or a barrel file.
- Do not add a layout-level env read to a route group that should stay static.
