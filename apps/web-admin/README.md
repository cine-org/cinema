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
  (admin)/              shell: sidebar, header, phone bottom bar
    page.tsx            Dashboard
    showtimes/ bookings/ movies/ theaters/ users/ iam/
```

- Nav items are declared once in `(admin)/_components/nav-items.ts`; sidebar, bottom bar and
  header breadcrumb all read it. A new section is a page plus one entry there.
- Sidebar collapses to icons on desktop. On phones it becomes a bottom bar with a drawer.
- The root layout sets `robots: noindex`, and `robots.ts` disallows all.

## Rendering

The root layout reads `API_ORIGIN` and passes it down with `ConfigProvider`, so every route renders
per request. There is no public SEO to protect here; the reasoning and the public-site alternative
are in [Next Runtime Config](../../docs/apps/next-runtime-config.md).

## Data

A route reads its data through one hook (`useUsers()`) typed with the DTOs of `@repo/sdk-admin`,
and components never fetch on their own. The hook is the only place that knows where data comes
from, so moving from mock data to the api changes that hook and nothing else.

## Auth

Design the api calls follow:

- Access token: memory only, never `localStorage`.
- Refresh token: `httpOnly` cookie set by the api, sent by the browser on refresh.
- A request that gets `401` refreshes once and retries; a failed refresh goes to `/login`.
- Admin endpoints live under `/admin`, with their own auth path.
