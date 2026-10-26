# Frontend Structure

Purpose: shared Next.js App Router conventions for every web app (`web-user`, `web-admin`, and any future one).

```text
src/
  app/                      routing only; files here apply to the whole site
    layout.tsx              root layout: the only <html>/<body>, metadata defaults
    global.css
    robots.ts
    healthz/route.ts
    (group)/                route group: own layout, no URL segment
      layout.tsx
      page.tsx
      <route>/
        page.tsx
        _components/        used only by this route
      _components/          used only by this group
  config/                   runtime and build-time configuration
```

Create these only when something needs them: `components/` (UI shared by two or more routes;
`components/ui/` for shadcn), `lib/` (utilities, API helpers), `hooks/` (shared hooks).

## Routing

- A folder is a URL segment. It is reachable only when it contains `page.tsx` or `route.ts`.
- A `layout.tsx` wraps every route below its folder. Next composes the tree; nothing calls layouts
  by hand. `app/layout.tsx` is required and is the only file that renders `<html>` and `<body>`.
- Files at the top of `app/` (`layout.tsx`, `not-found.tsx`, `robots.ts`) apply to the whole site;
  the same file inside a folder applies only to that subtree.
- `(group)` folders do not appear in the URL. Use them to give a set of routes its own layout, for
  example a group without the app shell for login pages and a group with it for everything else.
- `_folder` is private and never routed. Use it for code that belongs to one route or group.

## Colocation

- Code used by one route or group lives next to it in `_components`. Move it to `src/components`
  only when a second route needs it.
- Keep `page.tsx` thin: set `metadata`, compose components, no substantial behavior.
- Do not deep-import another route's `_components`; promote shared code instead.

## Components

- `page.tsx` and `layout.tsx` are Server Components by default. Add `'use client'` only to leaf
  components that need state, effects, or browser APIs.
- Server Components can be passed as `children` to Client Components.

## Data and mutations

- A route reads its data in `page.tsx` (server) and passes it down as props; components never
  fetch on their own. Until an endpoint exists, the data is mock code in the route's `_data/`,
  shaped like the api response, so the swap only touches `_data/`.
- Every write a feature makes goes through one `_data/mutations.ts`, one function per api call,
  each returning a `Result` (`lib/result.ts`). An unwired call returns `notWired(...)`; the caller
  shows the outcome with `toastResult` (`lib/toast-result.ts`).
- A Server Component cannot pass a function to a Client Component. A shared component takes its
  save function as a prop, and the feature adds a small `'use client'` wrapper that binds the
  mutation.

## List pages

- The list state (search, filters, sort, page, limit) lives in the URL, so a view can be shared and
  survives a refresh. Params equal to their default are left out.
- `page.tsx` parses `searchParams` into a typed query and asks for one page of rows; filtering,
  sorting and paging happen behind that call, because the api pages its results.
- Shared pieces: `lib/list-query.ts` (parsing helpers, paging) and `components/data-table/`
  (sort header, pagination, debounced search, URL navigation). A feature keeps only its own
  filters and columns.
- Narrow screens drop columns instead of scrolling a table sideways.

## Naming and imports

- File and folder names are kebab-case (`login-form.tsx`). Exports keep React naming
  (`LoginForm`). Case-only renames break on case-insensitive file systems.
- No barrel (`index.ts`) files; import the file directly.
- Use `@/*` for app-local source. Import workspace libraries through their public package names.

## SEO

- Every page exports `metadata` (at least `title`); the root layout sets `lang` and a
  `title.template`.
- Public pages that should rank: add `sitemap.ts`, an allowing `robots.ts`, canonical URLs and
  Open Graph metadata.
- Apps behind login must not be indexed: root `metadata` sets `robots: { index: false, follow: false }`
  and `robots.ts` disallows all crawlers.

## API Client

Feature API code uses the app's SDK: `@repo/sdk-user` in web-user, `@repo/sdk-admin` in web-admin.
Endpoint types are generated from that surface's OpenAPI schema;
do not duplicate response types inside a web app.

## Environment

- `src/config` is the only application-facing entrypoint for environment/runtime configuration. Import its files directly (no barrel), so server-only code stays out of client bundles.
- `getConfig()` (server) reads values supplied when the container starts. A server layout passes them to `ConfigProvider`, and client components read them with `useConfig()`. Reading env at request time makes the layout's routes render dynamically.
- `NEXT_PUBLIC_*` is only a build-time fallback for values safe to expose to browsers.
- Do not use `VITE_*` variables.

## Migration

An app created before this convention may still use `features/`, `layouts/` and `providers/`.
Move it to this layout when its structure is next touched; do not mix both layouts in one app.
