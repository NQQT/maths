// ─────────────────────────────────────────────────────────────────────────────
// Dashboard plugin contract.
//
// ARCHITECTURE (see plugins/index.ts for the registration flow):
//
// The dashboard is a PLUGIN HOST. Every exercise/worksheet is a self-contained
// plugin that contributes a slice of the whole UI:
//
//   Dashboard (host, components/MathsDashboard.tsx)
//     ├── header slot   : plugins may render into the top bar (grade pills etc.)
//     ├── sidebar slot  : each plugin renders its own list entries (math types)
//     ├── page slot     : each plugin renders its own canvas (A4 page stacks)
//     └── toolbar slot  : each plugin renders its own toolbar card content
//
// A plugin is a plain object created by a `definePlugin` factory. It must be
// FULLY self-contained: its generators, configs, styled components and state
// all live inside its own module directory (src/plugins/<id>/), and it may
// only communicate with the dashboard through this contract. Deleting a
// plugin's directory (and removing it from the plugin list in
// plugins/index.ts) must leave every other plugin and the host untouched —
// no imports across plugin boundaries, no shared mutable state.
//
// The dashboard keeps a registry keyed by plugin id. Rendering order for the
// sidebar and page slots follows the order in which plugins register (the
// order of the plugin list), so reordering plugins reorders the UI.
// ─────────────────────────────────────────────────────────────────────────────

import type React from 'react';

// Unique plugin identifier. Used as registry key, React key and design-control
// namespace, so it must be stable and unique across all plugins.
export type PluginId = string;

// ── Sidebar ───────────────────────────────────────────────────────────────────
// One selectable entry that the dashboard merges into the left math-type rail
// (or the "list" the dashboard shows). Selecting an entry activates the owning
// plugin's page.
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

// ── Toolbar ───────────────────────────────────────────────────────────────────
// A toolbar control that the dashboard mounts into the shared toolbar card
// area while this plugin's entry is active. Controls receive the plugin's
// scoped store (see PluginContext below) as props, so state stays plugin-owned.
export type PluginToolbarComponent = React.ComponentType<{
    context: PluginRuntimeContext;
}>;

// ── Page ─────────────────────────────────────────────────────────────────────
// The canvas content the plugin contributes when active. Receives its own
// runtime context. Must render fully on its own (the host adds no chrome).
export type PluginPageComponent = React.ComponentType<{
    context: PluginRuntimeContext;
}>;

// ── Header slot ───────────────────────────────────────────────────────────────
// Optional component rendered into the dashboard's top bar (right side).
// Lets a plugin own e.g. a global grade selector that drives its generators.
export type PluginHeaderComponent = React.ComponentType<{
    context: PluginRuntimeContext;
}>;

// ── Runtime context ──────────────────────────────────────────────────────────
// What every plugin component receives: its OWN entry id, its scoped reactive
// store, and the entry list the dashboard knows about. This is the ONLY
// plugin → dashboard coupling: the store is shared state the plugin fully
// controls, and the dashboard only reads entry metadata from it.
export type PluginRuntimeContext = {
    // The plugin's unique id (registry key).
    pluginId: PluginId;
    // The id of the currently selected entry of this plugin.
    entryId: string;
    // Shared scoped state between all components of this plugin. Reactive:
    // every mutation triggers a re-render of subscribed components via the
    // dashboard store.
    store: PluginStore;
    // The plugin's declared sidebar entries (convenience mirror so toolbar /
    // page components can look up labels without imports).
    entries: PluginSidebarEntry[];
};

// Reactive scoped store: a plain object that triggers dashboard-wide
// re-renders when mutated (backed by propsSpy via the dashboard's context
// store — see plugins/store.ts).
export type PluginStore = {
    [key: string]: any;
};

// ── The plugin definition itself ─────────────────────────────────────────────
export type DashboardPlugin = {
    // Unique registry key + React key. Also namespaces its store slice.
    id: PluginId;
    // Human-readable name (shown in the plugin list / debug surfaces).
    name: string;
    // Entries the dashboard merges into its left list (sidebar). A plugin
    // with N entries contributes N selectable list items; each entry mounts
    // the same toolbar/page components with a different entryId.
    entries: PluginSidebarEntry[];
    // Initial value for the plugin's scoped store. The plugin mutates this
    // object freely; the dashboard re-renders on changes.
    initialStore: PluginStore;
    // Rendered into the dashboard top bar (right side). Optional — a plugin
    // may not need header presence.
    header?: PluginHeaderComponent;
    // Rendered into the left rail list. The host wraps each entry with the
    // shared list-button chrome, so the component only renders entry-        // specific EXTRA UI if any (unused by current plugins; kept for future
    // plugins that need per-entry chrome, e.g. a live preview thumb).
    sidebar?: React.ComponentType<{ context: PluginRuntimeContext }>;
    // Toolbar card content while this plugin is active. Optional.
    toolbar?: PluginToolbarComponent;
    // Canvas content while this plugin is active. Required — this IS the
    // dashboard's "rendering page" contribution.
    page: PluginPageComponent;
    // PRINT surface content, mounted by the host OUTSIDE the interactive
    // shell (.app-chrome is display:none under @media print — anything the
    // page component renders inside the canvas CANNOT be the print output).
    // A plugin's print component emits the hidden .print-doc tree that
    // window.print() paginates (see app.css). Optional — a plugin without
    // print output simply prints nothing.
    print?: React.ComponentType<{ context: PluginRuntimeContext }>;
    // Optional entry filter: given the plugin's scoped store, decide which
    // declared entries the rail should list RIGHT NOW. Lets a plugin hide
    // entries that are invalid for its current internal selection (e.g. the
    // worksheet plugin hides Multiplication for Year 1 because times tables
    // start at Year 2) WITHOUT the host knowing anything about grades.
    // Omitted => all entries are always listed.
    filterEntries?: (store: PluginStore) => PluginSidebarEntry[];
    // Optional label describing the scope for a selection (e.g. "within 20"),
    // shown in the toolbar subtitle.
    scopeLabel?: (entryId: string, store: PluginStore) => string;
};

// Factory helper with full type inference for the plugin contract. Every
// plugin module exports `export const myPlugin = definePlugin({...})` — the
// factory exists purely so future cross-cutting concerns (validation,
// dev-time warnings, telemetry) have a single injection point.
export function definePlugin(plugin: DashboardPlugin): DashboardPlugin {
    return plugin;
}
