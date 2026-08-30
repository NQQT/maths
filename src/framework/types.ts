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
// A problem as a plugin's generator produces it (before the framework assigns
// ids and the type tag while chunking pages).
export type RawProblem = {
    // The question text as printed. Blanks are written as "__".
    prompt: string;
    // The model answer. May be several values separated by commas.
    answer: string;
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
