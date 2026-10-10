# @distribution/maths

Maths distribution — Vite + React app deployable to GitHub Pages.

## Curriculum — Australian Curriculum v9 (national), partial coverage

The worksheets are **informed by** the Australian Curriculum version 9
 Mathematics learning area — they are **not** an endorsed product and make
 **no claim of alignment** by ACARA. Coverage is deliberately **partial**:
 each worksheet drills one strand slice at one year level, not a whole
 content strand. Codes below are the exact content-descriptor codes cited in
 each plugin's source; where a plugin cites no code its content is mapped to
 the sub-strand only (no code is invented).

**Assumption:** the **national** curriculum is used with **no state or
 territory adjustments** (NSW/VIC/QLD annotations differ; none are applied
 here). Foundation–10 is a single learning progression: each year's content
 builds on the previous one, and this app mirrors that by **year-tiering
 every generator** on the grade caps (`src/framework/grades.ts`) — e.g.
 fractions run unit fractions (Y3) → equivalence & related denominators (Y4)
 → operating with fractions (Y5) → all four operations & mixed results (Y6).

Official sources (v9 site; download page for the authoritative F–10 docs):

- Learning area: <https://v9.australiancurriculum.edu.au/f-10-curriculum/mathematics/mathematics-year-1> (per-year pages `…-foundation` … `…-year-10`)
- Download & print: <https://v9.australiancurriculum.edu.au/download-and-print>

### Year × topic → resource → verified AC9 codes

| Year | Topic (worksheet) | Resource | AC9 code(s) cited in source |
|---|---|---|---|
| Prep | counting, comparison, +/− pairs | `CountingWorksheet`, `CompareWorksheet`, `Addition/SubtractionWorksheet` | — (app-defined Prep scope below Foundation band) |
| 1 | number & operations ladder, skip, word, missing, bonds, doubles, patterns, place value, rows & columns | `Addition/Subtraction/SkipCounting/WordProblems/MissingNumber/NumberBonds/Doubles/Patterns/PlaceValue/RowsColumns/Counting/CompareWorksheet` | AC9M1N02 (bonds); AC9M1A01 (patterns); others — Number & Algebra sub-strand, no code cited |
| 1 | shapes, compass, time, measurement, temperature, data | `Shapes/Compass/Time/Measurement/Temperature/DataWorksheet` | AC9M1SP02 (compass); AC9M1M01-02 (measurement); AC9M1M02 (temperature); AC9M1ST01 (data); others — no code cited |
| 2 | tables & division, clock, money, wider ladder | `Multiplication/Division/Clock/MoneyWorksheet` | AC9M2N05 (mult/div); AC9M2M04 (time/clock); AC9M2A01-02 (patterns/doubles); AC9M2ST01 (data); money — no code cited |
| 3 | arithmetic ladder (within 1 000), tables to 10, compass, transformations | `Addition/Subtraction/Multiplication/Compass/ShapeTransformationsWorksheet` | AC9M3N02 (fractions join), ladder — Number & Algebra, no code cited |
| 3 | fractions (unit), metric (units & equivalences), statistics (tallies), probability (chance words), algebra (unknowns) | `Fractions/MetricConversion/Statistics/Probability/AlgebraReasoningWorksheet` | AC9M3N02; AC9M3M01-02; AC9M3ST01-02; AC9M3SP01-02; AC9M3A01 |
| 4 | fractions (equivalence), decimals (tenths/hundredths), ×/÷ (multiples of ten), perimeter & area, metric, statistics, probability, algebra | `Fractions/Decimals/MultiplyDivide/PerimeterArea/MetricConversion/Statistics/Probability/AlgebraReasoningWorksheet` | AC9M4N01, N03-04; AC9M4N05; AC9M4M02; AC9M4M01; AC9M4ST01-03; AC9M4SP02-03; AC9M4A01-02 |
| 5 | fractions (operating), decimals (thousandths, rounding, estimation), percent, ×/÷ (2-digit, remainders), perimeter & area, metric (decimals), statistics, probability, algebra | `Fractions/Decimals/Percent/MultiplyDivide/PerimeterArea/MetricConversion/Statistics/Probability/AlgebraReasoningWorksheet` | AC9M5N03-05; AC9M5N01, N08 (N08 = estimation/reasonableness); AC9M5N04; AC9M5N06-07; AC9M5M02; AC9M5M01; AC9M5ST01-03; AC9M5SP01-03; AC9M5A01-02 |
| 6 | fractions (+/−/×/÷), decimals (powers of ten), percent (quantities), ×/÷ (algorithms), perimeter & area (unit links), metric (scales), statistics, probability, algebra | `Fractions/Decimals/Percent/MultiplyDivide/PerimeterArea/MetricConversion/Statistics/Probability/AlgebraReasoningWorksheet` | AC9M6N03-04; AC9M6N05-06; AC9M6N07; AC9M6N06; AC9M6M01-02; AC9M6M01; AC9M6ST01-03; AC9M6SP02; AC9M6A01-04 |

**Extension labelling (honest scope):** Statistics Year 4 range, Year 5
 mean/range and Year 6 mean/median items are **optional extensions** beyond
 what the cited ST codes require at those years (the on-screen scope line and
 the plugin header say so); Year 6 mode/range is the accepted core. Metric
 conversion Year 4 small→big is restricted to **at most two decimal places**
 (three-place conversions like 105 m = 0.105 km are Year 5 work, AC9M5M01).

### Scaffolded tiers (support / core / stretch)

Every sheet prints tier prefixes so one page is a mini learning sequence:

- **Starter:** scaffold — the year's most supported entry point.
- **Practice:** core — the cited content descriptor's main skill.
- **Challenge:** stretch/reasoning — transfer, comparison, true/false.

Tier counts per page are fixed per plugin (2+4+2 or 3+4+3) and pinned by
each plugin's test file and `src/plugins/layout-capacity.test.ts`.

## Teacher answer key (optional, default off)

The toolbar **Answers** toggle (`Answers: Off` ⇄ `Answers: On`) is
dashboard-wide session state. **Default is Off** — student sheets never
contain answer text in preview or print. Turning it On appends one or more
spacious **Answer key pages** (1 column × 25 fixed 30px rows,
`framework/AnswerKeySheet.tsx`) AFTER the worksheet pages of both the
preview and the print job; worksheet
pages themselves are unchanged, so print layout can never overflow because
of the key. To hand out student sheets only, print the worksheet pages and
skip the final key page(s); to keep a marked-copy set, print the whole job.

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

### Plugin loading order

`PLUGINS` (`src/plugins/index.ts`) stores the plugin factories **uninvoked**. The dashboard renders first (shell + the first plugin — the default worksheet — in the initial paint), then loads the remaining plugins **one by one** after mount (`usePluginLoader`, `src/framework/loader.ts`), yielding to the browser between loads so the rail grows a plugin per frame. Nothing is constructed at module load time.

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
