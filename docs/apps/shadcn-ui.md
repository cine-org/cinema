# shadcn/ui

Purpose: how shadcn/ui is set up and used in the Next.js web apps (`web-admin`, and `web-user` when it adopts it).

shadcn/ui is not a package to import. A CLI copies component source into the app, so the files are ours to edit. It installs the small libraries those components need.

## Setup (once per app)

Run inside the app folder, for example `apps/web-admin`:

```bash
pnpm dlx shadcn@latest init --base radix --no-monorepo
pnpm dlx shadcn@latest add button input label card
```

- `--base radix`: components are built on Radix UI. `base` (Base UI) and `aria` (React Aria) also exist.
- `--no-monorepo`: the app owns its UI files; there is no shared UI package.
- Preset chosen at the prompt: **Nova - Lucide / Geist** (style `radix-nova`).
- `pnpm dlx` runs the CLI once from the pnpm cache. Nothing is installed globally.

Prerequisites already met by the apps: Tailwind CSS v4 (`@tailwindcss/postcss`) and the `@/*` alias to `./src/*`.

### What `init` creates or changes

| File                 | Change                                                                                                                                                                                                                            |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components.json`    | New. CLI config: `style`, `baseColor: neutral`, `cssVariables: true`, `iconLibrary: lucide`, `tailwind.css` path, aliases                                                                                                         |
| `src/lib/utils.ts`   | New. `export { cn } from 'cn'`; the single place `cn` is imported from                                                                                                                                                            |
| `src/app/global.css` | Adds `tw-animate-css` and `shadcn/tailwind.css` imports, `@custom-variant dark`, an `@theme inline` block mapping color names to CSS variables, light values in `:root`, dark values in `.dark`, and base styles in `@layer base` |
| `src/app/layout.tsx` | Loads the Geist font with `next/font/google` and sets `font-sans` on `<html>`                                                                                                                                                     |
| `package.json`       | Adds the dependencies below                                                                                                                                                                                                       |

These match the official manual installation page, which describes the same files: <https://ui.shadcn.com/docs/installation/manual>. `components.json` fields are documented at <https://ui.shadcn.com/docs/components-json>.

### Dependencies added (all in `dependencies`)

| Package                    | Role                                                       |
| -------------------------- | ---------------------------------------------------------- |
| `shadcn`                   | Provides `shadcn/tailwind.css`, imported by `global.css`   |
| `class-variance-authority` | `cva` variants (`variant`, `size`)                         |
| `cn`                       | Class-name merging; replaces `clsx` + `tailwind-merge`     |
| `tw-animate-css`           | Animation utilities for menus, dialogs, and similar        |
| `radix-ui`                 | Behavior and accessibility primitives (Button uses `Slot`) |
| `lucide-react`             | Icons (already used by the apps)                           |

### What `add` creates

`add button input label card` copies `src/components/ui/button.tsx`, `input.tsx`, `label.tsx`, `card.tsx`. It adds no packages.

Some components add packages (`sonner` adds `sonner` and `next-themes`). Each app lists the components it has added in its README.

## Adding components

```bash
pnpm dlx shadcn@latest add <component>
```

The CLI reads `components.json` and writes to `src/components/ui/`. Import with `@/components/ui/<component>`. Available components: <https://ui.shadcn.com/docs/components>.

## Theming

Components use semantic color names (`bg-background`, `text-primary`, `border-border`) instead of fixed Tailwind colors. Their values are CSS variables in `global.css`:

- Change the brand color by editing `--primary` (and `--primary-foreground`) under `:root`.
- Dark mode values live under `.dark`; it applies when an ancestor has the `dark` class. `next-themes` sets that class through `ThemeProvider` (`components/theme-provider.tsx`), and the root `<html>` carries `suppressHydrationWarning`.
- `--radius` controls corner roundness for all components.

## Rules

- `style` and `baseColor` in `components.json` cannot be changed after `init`. Changing them means re-running `init` and re-adding components.
- Generated files use double quotes and no semicolons. Run `pnpm exec prettier --write` on the generated files so they match repo formatting.
- Edit files in `components/ui/` directly when needed; there is no package update. `add` can overwrite files you edited, including dependencies of the component you add (adding `command` replaced `input.tsx`). Commit or back up first, and diff afterwards.
- Keep feature-specific UI out of `components/ui/`. It holds only shadcn primitives; see [Frontend Structure](frontend-structure.md).
- Record every edit to a generated file in the app README, so it is kept when `add` runs again.
- `global.css` gives `[data-slot='table-container']` a thin scrollbar; a wide table scrolls sideways inside that container.
- `sonner` toasts need one `<Toaster />`, mounted once in the app shell. Call `toast.success(...)` / `toast.error(...)` from client components for the result of an action.
- The Geist font is fetched from Google Fonts at build time, so the build needs network access.
