# Web Admin

Back-office for staff: dashboard, showtimes, bookings, movies, theaters, users and IAM. It sits
behind login and is never indexed. Layout rules live in [Frontend Structure](../../docs/apps/frontend-structure.md),
UI components in [shadcn/ui](../../docs/apps/shadcn-ui.md).

## Run

```bash
pnpm dev:admin        # http://localhost:4001
```

| Env          | Default                 | Meaning                                        |
| ------------ | ----------------------- | ---------------------------------------------- |
| `API_ORIGIN` | `http://localhost:3000` | Origin of the api, read when the server starts |

`API_ORIGIN` is read per request, not at build, so one image serves every environment.

## Routes

```text
app/
  (auth)/login          centered card, no shell
  (admin)/              shell: sidebar, header, breadcrumb
    page.tsx            Dashboard
    theaters/           clusters, theaters, rooms and seat layouts, catalogs
    users/              customers/ and employees/
    iam/                roles and permissions
    movies/ showtimes/ bookings/ ...   stubs, not designed yet
```

- Nav items are declared once in `(admin)/_components/nav/nav-items.ts` (groups, and children for
  a submenu); the sidebar and the breadcrumb both read it. A new section is a page plus one entry
  there.
- The sidebar has three states by width: full (`xl` and up), icons only (`md`, expands over the
  content on hover) and hidden (phones, opened as a drawer from the header button). A pinned
  choice lasts until the width crosses a breakpoint.
- Light and dark theme come from `next-themes` (class based, follows the system by default).
  Colors are neutral tokens in `global.css`.
- Each route can have a `loading.tsx` built from `components/skeletons.tsx`.
- The root layout sets `robots: noindex`, and `robots.ts` disallows all.

## Rendering

The root layout reads `API_ORIGIN` and passes it down with `ConfigProvider`, so every route renders
per request. There is no public SEO to protect here; the reasoning and the public-site alternative
are in [Next Runtime Config](../../docs/apps/next-runtime-config.md).

## Data

Pages use mock data under each route's `_data/`, and every mutation returns "not wired": the
admin api has no list or update endpoints for these screens yet. Data, mutations and list pages
follow [Frontend Structure](../../docs/apps/frontend-structure.md).

Kept by hand in step with the api until the SDK can carry them:

- `GRID_LIMIT` in `theaters/_data/layout.ts` mirrors the grid limits in
  `modules/theaters/src/domain/entities/room-layout.entity.ts`.

## shadcn/ui

Components added: `avatar`, `alert-dialog`, `badge`, `button`, `card`, `dialog`, `dropdown-menu`,
`input`, `label`, `select`, `sheet`, `skeleton`, `sonner`, `table`, `tabs`, `tooltip`. The shadcn
`sidebar` is not used; the shell has its own.

Edited after generation; keep these when running `add` again:

- `input.tsx`: text stays `text-base` at every width so iOS does not zoom on focus; height `h-9`.
- `button.tsx`: the `outline` hover is softened (`hover:bg-muted/60`) and its dark background
  follows `bg-background`.
- `select.tsx`: `SelectContent` defaults to `position="popper"` and is at least as wide as its
  trigger.
- `card.tsx`: `shadow-sm` and a stronger ring (`ring-foreground/15`).
- `sonner.tsx`: border and icon color by toast type.

The palette is neutral gray (primary `#101828` light, `#f2f4f7` dark), modeled on TailAdmin.

## Auth

Design the api calls follow:

- Access token: memory only, never `localStorage`.
- Refresh token: `httpOnly` cookie set by the api, sent by the browser on refresh.
- A request that gets `401` refreshes once and retries; a failed refresh goes to `/login`.
- Admin endpoints live under `/admin`, with their own auth path.
