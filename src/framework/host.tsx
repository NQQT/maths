// ─────────────────────────────────────────────────────────────────────────────
// Dashboard plugin HOST components (framework-side mounting surfaces).
//
// Every worksheet plugin automatically gets access to these slots once
// registered (see plugins/index.ts and registry.ts):
//
//   <PluginHeaderHost>   — renders the ACTIVE plugin's optional header
//                          component into the dashboard top bar (the
//                          framework's own grade selector lives there too).
//   <PluginSidebarHost>  — renders the unified left list: every VISIBLE
//                          plugin's entries in registration order, wrapped in
//                          shared list-button chrome (icon + label + active
//                          state). Clicking an entry selects it (activates
//                          the owning plugin's page) via the shared store.
//   <PluginToolbarHost>  — renders the ACTIVE plugin's toolbar component.
//   <PluginPageHost>     — renders the ACTIVE plugin's page component.
//   <PluginPrintHost>    — mounts the ACTIVE plugin's print surface.
//
// All hosts subscribe to the shared store (useDashboardStore), so selection
// changes, session changes and plugin mutations re-render exactly the hosts
// that care. Plugins NEVER import these — the framework host (MathsDashboard)
// does. This keeps the dependency direction one-way:
// framework → plugin contract ← plugin.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useLayoutEffect } from 'react';
import { styledComponent } from '@presource/react';
import { useDashboardStore, selectEntry } from './store';
import { getGradeConfig } from './grades';
import { buildContext } from './registry';
import type { DashboardPlugin, PluginSidebarEntry } from './types';

// Shared props for all hosts: the ordered plugin list from the registry.
export type PluginHostProps = {
    plugins: DashboardPlugin[];
};

// ── Header host ────────────────────────────────────────────────────────────────
export function PluginHeaderHost({ plugins }: PluginHostProps) {
    const store = useDashboardStore();
    // The active plugin (selected, falling back to the first registered) —
    // mirrors usePluginRegistry's resolution so the header shows the same
    // plugin's controls as the toolbar/page.
    const active = plugins.find((p) => p.id === store.active.pluginId) ?? plugins[0];
    if (!active?.header) return null;
    const Header = active.header;
    return <Header context={buildContext(store, active)} />;
}

// ── Sidebar host ──────────────────────────────────────────────────────────────
// The unified left rail. Every VISIBLE plugin contributes its entries here;
// entries keep a stable key of `${pluginId}:${entryId}` so React can track
// them even when plugins come and go. "Coming soon" notices stay plugin-
// owned: a plugin whose grade gate is closed simply contributes nothing (the
// framework shows the shared empty state when NO plugin is visible at all).

// List button chrome shared by ALL plugins — the visual consistency layer.
// (Mirrors the original type-rail button: icon chip + label, indigo-tinted
// fill when active.)
const ListButton = styledComponent<{ active: boolean }>('button', {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 10px',
    flexShrink: 0,
    // xs: auto-width chip that can share a wrapped row; sm+ full-width row.
    width: () => ({ xs: 'auto', sm: '100%' }),
    border: ({ active }) => (active ? '1px solid #c7d2fe' : '1px solid transparent'),
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: ({ active }) => (active ? 600 : 500),
    textAlign: 'left',
    whiteSpace: 'nowrap',
    background: ({ active }) => (active ? '#eef2ff' : '#f8fafc'),
    color: ({ active }) => (active ? '#312e81' : '#334155'),
    transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease'
});

const ListIcon = styledComponent<{ active: boolean }>('span', {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30px',
    height: '30px',
    flexShrink: 0,
    borderRadius: '9px',
    fontSize: '15px',
    userSelect: 'none',
    background: ({ active }) => (active ? '#4f46e5' : '#e0e7ff'),
    color: ({ active }) => (active ? '#ffffff' : '#4f46e5')
});

const ListLabel = styledComponent('span', {
    flex: '1',
    minWidth: '32px',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
});

// Per-plugin optional extra sidebar chrome (currently unused by the worksheet
// plugins; mounted when a plugin declares one so future plugins can extend
// the rail without touching the framework).
function PluginExtraChrome({ plugin }: { plugin: DashboardPlugin }) {
    const store = useDashboardStore();
    if (!plugin.sidebar) return null;
    const Extra = plugin.sidebar;
    return <Extra context={buildContext(store, plugin)} />;
}

export function PluginSidebarHost({ plugins }: PluginHostProps) {
    const store = useDashboardStore();

    // The CURRENT grade configuration drives rail visibility: a plugin is
    // listed when it does not declare a grade gate, or when its isOffered
    // predicate accepts the grade. This is how a plugin "describes when its
    // label is on the sidebar" — the framework just renders the list.
    const grade = getGradeConfig(store.session.gradeId ?? 1);

    // Flat, ordered list of (plugin, entry) pairs across ALL plugins — this
    // IS the dashboard's list of exercises. Registration order = UI order.
    const items = plugins.flatMap((plugin) => {
        const visible = plugin.isOffered ? plugin.isOffered(grade) : true;
        return visible ? plugin.entries.map((entry) => ({ plugin, entry })) : [];
    });

    // Selection reconciliation: if the active entry is currently hidden (e.g.
    // the grade no longer offers that worksheet), snap the selection to the
    // SAME plugin's first visible entry, or — when the plugin has none — to
    // the first visible entry of ANY plugin, so the rail highlight and the
    // rendered page can never disagree. Runs in a LAYOUT effect (not during
    // render) — mutating the store mid-render would notify subscribers inside
    // another component's render pass.
    useLayoutEffect(() => {
        const activeVisible = items.some(
            (it) => it.plugin.id === store.active.pluginId && it.entry.id === store.active.entryId
        );
        if (activeVisible) return;
        const samePlugin = items.find((it) => it.plugin.id === store.active.pluginId);
        const fallback = samePlugin ?? items[0];
        if (fallback) {
            selectEntry(store, fallback.plugin.id, fallback.entry.id);
        }
    }, [items, plugins, store]);

    return (
        <>
            {items.map(({ plugin, entry }) => {
                const active =
                    store.active.pluginId === plugin.id && store.active.entryId === entry.id;
                return (
                    <React.Fragment key={`${plugin.id}:${entry.id}`}>
                        <ListButton
                            active={active}
                            aria-label={entry.ariaLabel ?? entry.label}
                            onClick={() => selectEntry(store, plugin.id, entry.id)}
                        >
                            <TypeIconShim active={active} entry={entry} />
                            <ListLabel>{entry.label}</ListLabel>
                        </ListButton>
                        {/* Mount plugin-owned per-entry chrome (when declared)
                            directly under its own entry — plugin isolated. */}
                        {active && <PluginExtraChrome plugin={plugin} />}
                    </React.Fragment>
                );
            })}
        </>
    );
}

// Icon chip content: plugin-declared glyph, or nothing when the plugin did not
// provide one for this entry (renders an empty chip to keep rail alignment).
function TypeIconShim({ active, entry }: { active: boolean; entry: PluginSidebarEntry }) {
    return (
        <ListIcon active={active} aria-hidden="true">
            {entry.icon ?? ''}
        </ListIcon>
    );
}

// ── Toolbar host ──────────────────────────────────────────────────────────────
export function PluginToolbarHost({ plugins }: PluginHostProps) {
    const store = useDashboardStore();
    // Same resolution as usePluginRegistry: the selected plugin, falling
    // back to the first registered one (e.g. first frame before the
    // reconcile layout-effect has fired).
    const active = plugins.find((p) => p.id === store.active.pluginId) ?? plugins[0];
    if (!active?.toolbar) return null;
    const Toolbar = active.toolbar;
    return <Toolbar context={buildContext(store, active)} />;
}

// ── Page host ─────────────────────────────────────────────────────────────────
export function PluginPageHost({ plugins }: PluginHostProps) {
    const store = useDashboardStore();
    const active = plugins.find((p) => p.id === store.active.pluginId) ?? plugins[0];
    if (!active) return null;
    const Page = active.page;
    return <Page context={buildContext(store, active)} />;
}

// ── Print host ────────────────────────────────────────────────────────────────
// Mounts the ACTIVE plugin's print surface. The framework renders this OUTSIDE
// .app-chrome: print media hides the interactive shell wholesale (app.css),
// so the .print-doc tree a plugin emits here is exactly what window.print()
// paginates — one A4 block per page.
export function PluginPrintHost({ plugins }: PluginHostProps) {
    const store = useDashboardStore();
    const active = plugins.find((p) => p.id === store.active.pluginId) ?? plugins[0];
    if (!active?.print) return null;
    const Print = active.print;
    return <Print context={buildContext(store, active)} />;
}
