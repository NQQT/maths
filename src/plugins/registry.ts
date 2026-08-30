// ─────────────────────────────────────────────────────────────────────────────
// Dashboard plugin registry — host-side wiring.
//
// REGISTRATION FLOW (the heart of the plugin architecture):
//
//   1. `plugins/index.ts` exports the ordered plugin list (add a plugin there
//      to add it to the dashboard; delete the plugin's directory + its line
//      there to remove it — nothing else changes).
//   2. The host (MathsDashboard) calls `usePluginRegistry(plugins)`:
//        - mounts every plugin's scoped store slice (ensurePluginSlice);
//        - resolves the ACTIVE plugin with fallback: if the selection is
//          empty or stale (deleted plugin), the first registered plugin's
//          first entry is selected — the dashboard never crashes;
//        - on host teardown, forgetPlugin wipes every slice so the store
//          returns to pristine state (state does not survive unmount).
//   3. `usePluginRegistration(plugin)` is the per-plugin equivalent for
//      plugin mounts OUTSIDE the host's list (storybook stories, test
//      harnesses that mount a plugin directly).
//   4. `buildContext(store, plugin)` resolves a plugin's LIVE runtime
//      context: its scoped slice, its entries and the active entryId
//      (falling back to its first entry when the selection lives elsewhere).
//
// SELECTION RECONCILIATION runs inside a useLayoutEffect (not during render)
// so the first meaningful paint happens one frame later but without any
// render-phase mutation; the context builder ALSO falls back eagerly, so the
// page still renders the right thing on the very first frame.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useLayoutEffect, useMemo } from 'react';
import { useDashboardStore, ensurePluginSlice, forgetPlugin, selectEntry, type DashboardStoreStructure } from './store';
import type { DashboardPlugin, PluginRuntimeContext } from './types';

// ── Host registry hook ────────────────────────────────────────────────────────
// Mounts every plugin's store slice and returns the ordered list plus the
// active plugin. The host renders header/toolbar/page slots from this.
export function usePluginRegistry(plugins: DashboardPlugin[]) {
    const store = useDashboardStore();

    // Mount all slices (idempotent) and wipe them on teardown. The plugin
    // array is a module constant in production; in tests/stories the identity
    // may change per render — ensurePluginSlice tolerates re-runs.
    useEffect(() => {
        plugins.forEach((p) => ensurePluginSlice(store, p.id, p.initialStore));
        return () => {
            plugins.forEach((p) => forgetPlugin(store, p.id));
        };
    }, [plugins, store]);

    // Reconcile the selection: nothing selected yet, or the selected plugin
    // is no longer registered (deleted mid-session / stale test state) →
    // select the first plugin's first entry. useLayoutEffect so the
    // corrected selection is applied before the browser paints.
    const needsFallback =
        !store.active.pluginId || !plugins.some((p) => p.id === store.active.pluginId);
    useLayoutEffect(() => {
        if (needsFallback && plugins.length > 0) {
            selectEntry(store, plugins[0].id, plugins[0].entries[0]?.id ?? '');
        }
    }, [needsFallback, plugins, store]);

    // Stable ordered view for the host to render. The eager ?? fallback means
    // even on the very first frame (before the layout effect above fires)
    // the host shows the first plugin rather than an empty canvas.
    return useMemo(() => {
        const activePlugin =
            plugins.find((p) => p.id === store.active.pluginId) ?? plugins[0];
        return {
            plugins,
            activePlugin,
            activeContext: activePlugin ? buildContext(store, activePlugin) : undefined
        };
    }, [plugins, store.active.pluginId, store.active.entryId, store]);
}

// ── Single-plugin registration hook ──────────────────────────────────────────
// For plugin mounts OUTSIDE the host's registry list (stories/tests): mounts
// + tears down that plugin's slice around its own lifecycle.
export function usePluginRegistration(plugin: DashboardPlugin) {
    const store = useDashboardStore();
    useEffect(() => {
        ensurePluginSlice(store, plugin.id, plugin.initialStore);
        return () => forgetPlugin(store, plugin.id);
    }, [plugin, store]);
}

// ── Runtime context builder ──────────────────────────────────────────────────
// Resolves the live runtime context for a plugin: its scoped slice, its
// entries, and the entryId. Falls back to the plugin's FIRST entry when the
// store's selection points elsewhere (buildContext is also used to render
// inactive plugins' header slots, which must show sensible defaults).
export function buildContext(
    store: DashboardStoreStructure,
    plugin: DashboardPlugin
): PluginRuntimeContext {
    const slice = store.plugins[plugin.id] ?? plugin.initialStore;
    const fallbackEntry = plugin.entries[0]?.id ?? '';
    const entryId =
        store.active.pluginId === plugin.id
            ? store.active.entryId || fallbackEntry
            : fallbackEntry;
    return {
        pluginId: plugin.id,
        entryId,
        store: slice,
        entries: plugin.entries
    };
}

// Convenience hook for plugin components that need their own runtime context
// without receiving it via props (deep children that only know their plugin).
export function usePluginRuntime(plugin: DashboardPlugin): PluginRuntimeContext {
    const store = useDashboardStore();
    return useMemo(() => buildContext(store, plugin), [store, plugin]);
}
