# @distribution/maths

Maths distribution — Vite + React app deployable to GitHub Pages.

## Architecture — plugin dashboard

The dashboard (`src/components/MathsDashboard.tsx`) is a **thin plugin host**: it renders only the shell chrome (header bar, left rail, toolbar card frame, canvas frame) plus four mount points. Every exercise/worksheet is a **self-contained plugin** that fills those slots:

```
MathsDashboard (host)
  └── DashboardContextProvider (plugins/store.tsx — per-host reactive store)
      ├── header slot   ← active plugin's header (e.g. grade pills)
      ├── sidebar slot  ← ALL plugins' entries merged into one rail (list)
      ├── toolbar slot  ← active plugin's toolbar (stepper / randomize / print)
      ├── page slot     ← active plugin's canvas (A4 preview stack)
      └── print slot    ← active plugin's .print-doc tree (outside .app-chrome)
```

### Adding a plugin

1. Create `src/plugins/<id>/` containing a `DashboardPlugin` object (see `src/plugins/worksheet/` for the reference implementation and `src/plugins/types.ts` for the contract).
2. Add one line to `PLUGINS` in `src/plugins/index.ts`.

### Deleting a plugin

Delete its directory and remove its line from `PLUGINS`. Nothing else references it: plugins own their generators, configs, styled components and store slice (namespaced under their id). The host falls back to the remaining plugins automatically — a deleted plugin leaves **no trace** in the store or the UI.

### Plugin contract (`src/plugins/types.ts`)

| Field | Purpose |
|---|---|
| `id` | Unique registry key; also the store namespace. |
| `entries` | List entries merged into the left rail. |
| `filterEntries(store)` | Optional visibility filter (e.g. grade-gating). |
| `initialStore` | The plugin's scoped state template. |
| `header` / `toolbar` / `page` / `print` | Components receiving `{ context }` — the plugin's runtime context (id, active entry, scoped store). |

State is a per-provider reactive store (React 18 `useSyncExternalStore` + deep proxy) — mutations are synchronous and namespaced per plugin.

## Scripts

- `dev` — start Vite dev server
- `build` — production build to `dist/`
- `preview` — preview the production build
- `test` — run Vitest test suite
- `typecheck` — TypeScript type checking
- `deploy` — build and publish to GitHub Pages via `gh-pages`
