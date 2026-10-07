// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD FRAMEWORK — the plugin contract.
//
// ARCHITECTURE (see framework/framework.ts + plugins/index.ts):
//
//   The dashboard is a FRAMEWORK. It owns the app shell (header bar, sidebar
//   rail, toolbar card, canvas — components/MathsDashboard.tsx), the shared
//   reactive store (framework/store.tsx), the grade catalogue
//   (framework/grades.ts) and the A4 layout components (PageStack /
//   PrintableSheet / ZoomControl).
//
//   Every WORKSHEET is a PLUGIN: a function like AdditionWorksheet(dashboard)
//   that takes in the dashboard's configurations + layouts when the dashboard
//   loads it (plugins/index.ts calls each factory with DASHBOARD_FRAMEWORK)
//   and returns a DashboardPlugin describing:
//
//     - its SIDEBAR LABEL  (entries — what the left rail shows),
//     - what happens when that label is CLICKED (its page renders in the
//       content area; the framework activates its toolbar + print surfaces
//       alongside),
//     - which grades offer it (isOffered — the framework hides the rail
//       entry for grades that don't).
//
//   A plugin module is FULLY self-contained: its generator, its spec and its
//   factory live in one file under src/plugins/, and it may only import from
//   the framework — never from another plugin. Deleting a plugin's file and
//   its line in plugins/index.ts removes the whole worksheet without
//   affecting the framework or any other plugin.
// ─────────────────────────────────────────────────────────────────────────────

import type React from 'react';
import type { Caps, GradeConfig } from './grades';
import type { Rng } from './rng';
import type { ZoomMode } from './page-scale';

// Unique plugin identifier. Used as registry key, React key and design-control
// namespace, so it must be stable and unique across all plugins.
export type PluginId = string;

// ── Sidebar ───────────────────────────────────────────────────────────────────
// One selectable entry that the dashboard merges into the left rail. Selecting
// an entry activates the owning plugin's page.
export type PluginSidebarEntry = {
    // Stable key for this entry (must be unique within the plugin).
    id: string;
    // Human label rendered in the rail.
    label: string;
    // Decorative glyph shown in the entry's icon chip.
    icon?: string;
    // Screen-reader text when the label alone is ambiguous (defaults to label).
    ariaLabel?: string;
};

// ── Slots ─────────────────────────────────────────────────────────────────────
// Components a plugin can mount into the framework's slots. All receive the
// plugin's runtime context (see below).
export type PluginToolbarComponent = React.ComponentType<{
    context: PluginRuntimeContext;
}>;

export type PluginPageComponent = React.ComponentType<{
    context: PluginRuntimeContext;
}>;

export type PluginHeaderComponent = React.ComponentType<{
    context: PluginRuntimeContext;
}>;

// ── Runtime context ──────────────────────────────────────────────────────────
// What every plugin component receives: its OWN entry id, its scoped reactive
// store, and the entry list the framework knows about.
export type PluginRuntimeContext = {
    // The plugin's unique id (registry key).
    pluginId: PluginId;
    // The id of the currently selected entry of this plugin.
    entryId: string;
    // Shared scoped state between all components of this plugin. Reactive:
    // every mutation triggers a re-render of subscribed components.
    store: PluginStore;
    // The plugin's declared sidebar entries.
    entries: PluginSidebarEntry[];
};

// Reactive scoped store: a plain object that triggers dashboard-wide
// re-renders when mutated (backed by the framework store in store.tsx).
export type PluginStore = {
    [key: string]: any;
};

// ── Dashboard session state ──────────────────────────────────────────────────
// Framework-level shared configuration: ONE grade/pages/zoom/refresh for the
// whole dashboard, shared by every worksheet plugin (switching worksheets
// preserves the session — the framework owns this state, not any plugin).
export type DashboardSession = {
    // Grade (0 = Prep, 1..12 = Year 1..12).
    gradeId: number;
    // A4 sheets to generate (>= 1, unbounded).
    pageCount: number;
    // Preview zoom ('fit' | 50 | 75 | 100).
    zoom: ZoomMode;
    // Bump = "Randomize" → new seed, same page count.
    refresh: number;
};

// ── The plugin definition itself ─────────────────────────────────────────────
export type DashboardPlugin = {
    // Unique registry key + React key. Also namespaces its store slice.
    id: PluginId;
    // Human-readable name (shown in the plugin list / debug surfaces).
    name: string;
    // Entries the framework merges into its left rail. A worksheet plugin
    // declares exactly ONE entry — its own sidebar label.
    entries: PluginSidebarEntry[];
    // Initial value for the plugin's scoped store. Optional — worksheet
    // plugins keep no state of their own (the session is framework state).
    initialStore?: PluginStore;
    // Rendered into the dashboard top bar (right side). Optional — the
    // framework renders its own grade selector there; a plugin may add more.
    header?: PluginHeaderComponent;
    // Optional extra per-plugin sidebar chrome (unused by worksheet plugins).
    sidebar?: React.ComponentType<{ context: PluginRuntimeContext }>;
    // Toolbar card content while this plugin is active. Optional.
    toolbar?: PluginToolbarComponent;
    // Canvas content while this plugin is active. Required — this IS the
    // dashboard's "rendering page" contribution.
    page: PluginPageComponent;
    // PRINT surface content, mounted by the framework OUTSIDE the interactive
    // shell (.app-chrome is display:none under @media print — anything the
    // page component renders inside the canvas CANNOT be the print output).
    // Optional — a plugin without print output simply prints nothing.
    print?: React.ComponentType<{ context: PluginRuntimeContext }>;
    // Grade gating: given the framework's CURRENT grade configuration, is this
    // plugin's rail entry offered right now? The framework hides the entry
    // (and snaps the selection away) for grades that don't offer it, WITHOUT
    // knowing anything about the plugin's internals.
    isOffered?: (grade: GradeConfig) => boolean;
};

// ── Worksheet problem data ───────────────────────────────────────────────────
// An optional analog-clock FIGURE a problem can carry: the framework's sheet
// renderer (PrintableSheet) prints a small SVG clock face before the prompt
// text when it is present. It powers both reading items ("what time does the
// clock show?" — hands drawn) and drawing items ("draw the hands to show half
// past 10" — `hands: false` prints a BLANK face the student draws on).
export type ClockFigure = {
    // Hour the SHORT hand points at (1-12).
    hour: number;
    // Minute the LONG hand points at (0-59).
    minute: number;
    // false = print the face WITHOUT hands (draw-them-yourself items).
    // Omitted / true = hands drawn at the hour:minute position (default).
    hands?: boolean;
};

// Shape coordinates are local to the printed diagram's centre (0, 0), with
// positive y DOWN as in SVG. The transformation plugin owns the maths;
// ShapeTransformationDiagram.tsx only draws these exact integer vertices.
export type ShapePoint = readonly [x: number, y: number];

// A labelled candidate outline, not a transform instruction: preview and print
// must not calculate their own answers or disagree about option placement.
export type ShapeOption = {
    label: string;
    points: readonly ShapePoint[];
};

// Optional shape question figure alongside ClockFigure. The dashed mirror line
// or centre dot appears on the ORIGINAL only; answers remain private problem
// data, just as clock answers do (plugins/ShapeTransformationsWorksheet.ts).
export type ShapeTransformationFigure = {
    name: string;
    original: readonly ShapePoint[];
    options: readonly ShapeOption[];
    guide: 'vertical' | 'horizontal' | 'centre';
};

// Optional row/column grid figure alongside ClockFigure (types.ts). The
// generator owns the row/column math (totals, missing columns, products);
// RowsColumnsDiagram.tsx only draws this exact r × c lattice of squares in
// preview AND print. Answers stay private problem data, like the clock's.
export type RowsColumnsFigure = {
    // Number of horizontal grid rows (the "how many rows?" answer).
    rows: number;
    // Number of vertical grid columns (the "how many columns?" answer).
    cols: number;
};

// ── Data & Tally figure (DataWorksheet) ───────────────────────────────────────
// The three printed data forms, drawn by framework/DataDiagram.tsx. The
// generator owns every count; the renderer NEVER prints a total, difference
// or unit scale — answers stay private problem data.
export type DataFigure =
    // Classic grouped tallies: floor(total/5) five-groups + (total % 5) strokes.
    | { kind: 'tally'; total: number }
    // Picture graph: one star per counted unit (the star → thing scale lives in
    // the prompt text, "1 star = u things"; the figure is the stars only).
    | { kind: 'picture'; stars: number }
    // Column graph: two named bars, value = number of squares (1 square = 1
    // vote). The "how many more" difference is the PRIVATE answer.
    | { kind: 'column'; leftName: string; rightName: string; left: number; right: number };

// ── Shapes figure (ShapesWorksheet) ────────────────────────────────────────────
// One labelled 2-D/3-D shape the question shows (framework/ShapeFigure.tsx
// draws the geometrically accurate outline + its label). Multiple entries
// are the printed multiple-choice candidates, in the prompt's option order.
export type ShapeFigure = {
    // Shape name from the plugin's catalogue (also the printed card label).
    name: string;
    // '2d' outlines vs '3d' solids — the renderer picks the shape library.
    kind: '2d' | '3d';
};

// ── Number bond figure (NumberBondsWorksheet) ─────────────────────────────────
// Part-part-whole diagram (framework/BondDiagram.tsx): the whole circle and
// the GIVEN part circle print their values; the REQUESTED part prints as a
// blank circle (null) — the missing answer is never written into the figure.
export type BondFigure = {
    // The part-part-whole total (10, or 10/20 in Year 2).
    whole: number;
    // Given left part, or null = the requested (blank) part.
    left: number | null;
    // Given right part, or null = the requested (blank) part.
    right: number | null;
};

// ── Compass figure (CompassWorksheet) ─────────────────────────────────────────
// Reference rose/map (framework/CompassDiagram.tsx): a compass rose with the
// four cardinals, or a N-at-top map square. `facing` marks the direction the
// student IS facing (given by the prompt) and `turn` draws the instructed
// quarter/half-turn arrow — the direction LANDING on (the answer) is never
// labelled.
export type CompassCardinal = 'North' | 'East' | 'South' | 'West';
export type CompassFigure = {
    // true = print the N-at-top map square (map-orientation items) instead of
    // the rose.
    map: boolean;
    // The GIVEN facing only (turn/side/opposite/walk items).
    facing?: CompassCardinal;
    // The instructed turn for turn items: the arrow shows the instruction
    // (the prompt's words, visually), never the result.
    turn?: 'right' | 'left' | 'half';
};

// ── Money figure (MoneyWorksheet) ─────────────────────────────────────────────
// GIVEN coins/notes only (framework/MoneyDiagram.tsx): each entry is a cents
// value, < 100 prints as a coin ("5c"), >= 100 as a note ("$1"/"$2"/"$5").
// Form 0 ("what coins make X?") attaches NO figure — drawing the coin set
// would print the answer; equivalence/jar/note items draw their GIVEN money.
export type MoneyFigure = {
    // The GIVEN values only, in printed order.
    given: number[];
};

// ── Division figure (DivisionWorksheet) ───────────────────────────────────────
// Visible equal-group models for the story forms (framework/DivisionDiagram.tsx):
// the items and buckets are drawn, the quotient / "how many" result is NEVER
// labelled. The ÷-sign fact form carries no figure.
export type DivisionFigure =
    // "Share among friends": `friends` buckets, each holding total/friends dots.
    | { kind: 'share'; friends: number; total: number }
    // "Put into groups of size": total/size buckets, each with `size` dots.
    | { kind: 'groupsOf'; size: number; total: number };

// ── Vertical column figure (Addition/Subtraction, Year 3 multi-digit) ─────────
// Right-aligned vertical layout (framework/ColumnDiagram.tsx): the terms print
// as rows with the operator before the last row and a result rule below — the
// SUM/RESULT IS NEVER PRINTED. Year 3 only (the spec gates on caps.opCap ===
// 1000) so lower-grade fact recall keeps its plain inline prompts.
export type ColumnFigure = {
    // Printed top to bottom; the operator goes before the LAST row.
    terms: number[];
    // '+' = addition sheet, '-' = subtraction sheet.
    op: '+' | '-';
};

// A problem as a plugin's generator produces it (before the framework assigns
// ids and the type tag while chunking pages).
export type RawProblem = {
    // The question text as printed. Blanks are written as "__".
    prompt: string;
    // The model answer. May be several values separated by commas.
    answer: string;
    // Optional analog-clock figure rendered before the prompt (see above).
    clock?: ClockFigure;
    // Optional original outline and lettered transformation choices; the same
    // figure is preserved by document.ts and drawn by PrintableSheet.tsx.
    shapeTransformation?: ShapeTransformationFigure;
    // Optional rows × columns grid figure (rows/cols counts only); the same
    // figure is preserved by document.ts and drawn by PrintableSheet.tsx.
    rowsColumns?: RowsColumnsFigure;
    // Optional grouped tally / picture graph / column graph figure
    // (DataWorksheet); drawn by DataDiagram.tsx after the prompt.
    data?: DataFigure;
    // Optional labelled shape outlines — a single recognised shape (sides,
    // corners, flat faces, curved-side items) or the printed multiple-choice
    // candidates in option order; drawn by ShapeFigure.tsx.
    shapes?: ShapeFigure[];
    // Optional part-part-whole diagram with the requested part blank
    // (NumberBondsWorksheet); drawn by BondDiagram.tsx.
    bond?: BondFigure;
    // Optional compass rose / map with the given facing (CompassWorksheet);
    // drawn by CompassDiagram.tsx.
    compass?: CompassFigure;
    // Optional given coins/notes (MoneyWorksheet); drawn by MoneyDiagram.tsx.
    money?: MoneyFigure;
    // Optional equal-group model for division stories (DivisionWorksheet);
    // drawn by DivisionDiagram.tsx.
    division?: DivisionFigure;
    // Optional right-aligned vertical layout for multi-digit pairs
    // (Addition/Subtraction Year 3); drawn by ColumnDiagram.tsx.
    column?: ColumnFigure;
    // true = the prompt's "__" blanks print as WIDE fill-in lines (the
    // name/date size), for handwritten answers that do not fit the default
    // short blank — e.g. the clock sheets' "quarter past 11" word answers.
    wideBlanks?: boolean;
    // true = the prompt prints with a FULL-WIDTH fill-in line BELOW it (the
    // answer is written on its own line at the bottom) instead of inline "__"
    // blanks — for prompts like "7:45 is the same time in words:".
    answerLine?: boolean;
};

// ── Worksheet spec ───────────────────────────────────────────────────────────
// The declarative description a worksheet plugin hands to
// dashboard.createWorksheet: everything the framework needs to render the
// worksheet's rail entry, toolbar, page and print surfaces.
export type WorksheetSpec = {
    // Registry key, React key, seed part AND the `type` tag stamped on every
    // generated problem. Must equal the grade catalogue's available ids.
    id: string;
    // Sidebar label + toolbar/sheet titles ("Year 1 — Addition").
    label: string;
    // Sidebar glyph.
    icon: string;
    // Problems per printed A4 page.
    perPage: number;
    // Prose-style sheets (word problems etc.) print one question per row.
    singleColumn?: boolean;
    // Which grades offer this worksheet (grade gating).
    offered: (grade: GradeConfig) => boolean;
    // Human description of the numeric scope for subtitles ("within 20").
    scope: (grade: GradeConfig) => string;
    // The plugin's own DETERMINISTIC problem generator: same rng stream
    // (same seed) => same problems. The framework calls it ONCE for the
    // whole multi-page document and chunks the output into pages.
    generate: (rng: Rng, caps: Caps, count: number) => RawProblem[];
};

// Factory helper with full type inference for the plugin contract. Every
// plugin module exports `export function MyWorksheet(dashboard)` — the factory
// exists purely so future cross-cutting concerns (validation, dev-time
// warnings, telemetry) have a single injection point.
export function definePlugin(plugin: DashboardPlugin): DashboardPlugin {
    return plugin;
}
