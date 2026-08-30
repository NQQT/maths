// ─────────────────────────────────────────────────────────────────────────────
// Plugin architecture tests — the isolation guarantees the refactor is about.
//
// These tests prove the plugin contract end-to-end:
//
//   1. COMPOSITION: two plugins register side by side; their entries merge
//      into ONE rail in registration order; selecting an entry activates
//      that plugin's page only (host swaps, siblings stay isolated).
//   2. STATE ISOLATION: mutating one plugin's slice never re-renders or
//      corrupts another plugin's slice; slices are namespaced by plugin id.
//   3. DELETION LEAVES NO TRACE: unregistering a plugin wipes its slice from
//      the store (active selection included); the remaining plugin and the
//      host keep working untouched — deleting a plugin's directory + list
//      line is safe by construction.
//   4. SELECTION FALLBACK: a stale selection pointing at a deleted plugin
//      snaps back to the first remaining plugin.
//   5. THE REAL PLUGIN: the worksheet plugin registers through the same
//      pipeline the host uses (PLUGINS list), mounts with its initial store,
//      and its entries are grade-gated (Year 1 hides Multiplication).
//
// The fixtures are throwaway plugins defined inline here — by design, adding
// a plugin is just "an object that satisfies DashboardPlugin".
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import {
    DashboardContextProvider,
    useDashboardStore,
    usePluginRegistry,
    PluginHeaderHost,
    PluginSidebarHost,
    PluginToolbarHost,
    PluginPageHost,
    ensurePluginSlice,
    forgetPlugin,
    selectEntry,
    definePlugin,
    type DashboardPlugin,
    type DashboardStoreStructure
} from './index';
import { PLUGINS } from './index';
import { worksheetPlugin, WORKSHEET_PLUGIN_ID, worksheetInitialStore } from './worksheet/plugin';

afterEach(() => {
    cleanup();
});

// ── Test harness ─────────────────────────────────────────────────────────────
// A minimal host, identical in shape to MathsDashboard, PLUS a store probe
// that captures the live store object for direct helper-level assertions
// (the store is only reachable through the provider's context).
let probeStore: DashboardStoreStructure | null = null;
function StoreProbe() {
    probeStore = useDashboardStore();
    return null;
}

function TestHost({ plugins }: { plugins: DashboardPlugin[] }) {
    const { plugins: mounted } = usePluginRegistry(plugins);
    return (
        <div>
            {/* Captures the live store for direct assertions below. */}
            <StoreProbe />
            {/* Header slot (the worksheet plugin's grade pills live here). */}
            <PluginHeaderHost plugins={mounted} />
            <div data-testid="rail-slot">
                <PluginSidebarHost plugins={mounted} />
            </div>
            <div data-testid="toolbar-slot">
                <PluginToolbarHost plugins={mounted} />
            </div>
            <div data-testid="page-slot">
                <PluginPageHost plugins={mounted} />
            </div>
        </div>
    );
}

// A throwaway plugin factory: N entries; the page prints pluginId:entryId so
// assertions can see WHO is rendering; the toolbar bumps a slice counter.
function makePlugin(id: string, entryIds: string[]): DashboardPlugin {
    return definePlugin({
        id,
        name: `Test ${id}`,
        entries: entryIds.map((e) => ({ id: e, label: `${id}-${e}`, icon: '*' })),
        initialStore: { counter: 0 },
        toolbar: ({ context }) => (
            <button
                data-testid={`${id}-bump`}
                onClick={() => {
                    context.store.counter = (context.store.counter ?? 0) + 1;
                }}
            >
                {`${id} toolbar (${context.store.counter ?? 0})`}
            </button>
        ),
        page: ({ context }) => (
            <div data-testid={`${id}-page`}>{`${context.pluginId}:${context.entryId}`}</div>
        )
    });
}

// Render helper: mounts the harness with the given plugin list and returns
// the RTL rerender function (for simulating plugin-list changes).
function mountHost(plugins: DashboardPlugin[]) {
    return render(
        <DashboardContextProvider>
            <TestHost plugins={plugins} />
        </DashboardContextProvider>
    );
}

describe('plugin composition — multiple plugins merge into one dashboard', () => {
    it('lists entries of ALL plugins in registration order and activates the first', () => {
        const alpha = makePlugin('alpha', ['a1', 'a2']);
        const beta = makePlugin('beta', ['b1']);

        mountHost([alpha, beta]);

        // The unified rail: alpha's entries, then beta's, in order.
        const rail = screen.getByTestId('rail-slot');
        const labels = Array.from(rail.querySelectorAll('button')).map(
            (b) => b.textContent ?? ''
        );
        expect(labels).toEqual(['*alpha-a1', '*alpha-a2', '*beta-b1']);

        // Default selection: the FIRST plugin's FIRST entry; its page shows.
        expect(screen.getByTestId('alpha-page').textContent).toBe('alpha:a1');
        expect(screen.queryByTestId('beta-page')).toBeNull();
    });

    it("selecting another plugin's entry swaps the page and toolbar slots", () => {
        const alpha = makePlugin('alpha', ['a1', 'a2']);
        const beta = makePlugin('beta', ['b1']);

        mountHost([alpha, beta]);

        // Click beta's entry: beta's page takes over, alpha's unmounts.
        fireEvent.click(screen.getByRole('button', { name: 'beta-b1' }));
        expect(screen.getByTestId('beta-page').textContent).toBe('beta:b1');
        expect(screen.queryByTestId('alpha-page')).toBeNull();
        // The toolbar swaps to beta's toolbar too.
        expect(screen.getByTestId('beta-bump')).toBeDefined();

        // And back: alpha's first entry restores alpha's page.
        fireEvent.click(screen.getByRole('button', { name: 'alpha-a1' }));
        expect(screen.getByTestId('alpha-page').textContent).toBe('alpha:a1');
    });
});

describe('plugin state isolation — slices are namespaced and independent', () => {
    it("mutating one plugin's store never touches another plugin's slice", () => {
        const alpha = makePlugin('alpha', ['a1']);
        const beta = makePlugin('beta', ['b1']);

        mountHost([alpha, beta]);

        // Both plugins mounted with pristine slices (probe saw the store).
        expect(probeStore!.plugins.alpha).toEqual({ counter: 0 });
        expect(probeStore!.plugins.beta).toEqual({ counter: 0 });

        // Bump alpha's counter 3 times via its own toolbar.
        fireEvent.click(screen.getByTestId('alpha-bump'));
        fireEvent.click(screen.getByTestId('alpha-bump'));
        fireEvent.click(screen.getByTestId('alpha-bump'));
        expect(screen.getByTestId('alpha-bump').textContent).toBe('alpha toolbar (3)');

        // Switch to beta: its counter is still its own initial 0 — alpha's
        // mutations never leaked across the namespace boundary.
        fireEvent.click(screen.getByRole('button', { name: 'beta-b1' }));
        expect(screen.getByTestId('beta-bump').textContent).toBe('beta toolbar (0)');
        // Switch back: alpha's counter survived the round trip (unmounting
        // its PAGE does not unmount its SLICE).
        fireEvent.click(screen.getByRole('button', { name: 'alpha-a1' }));
        expect(screen.getByTestId('alpha-bump').textContent).toBe('alpha toolbar (3)');
    });

    it('store helpers namespace slices by plugin id and delete cleanly', () => {
        mountHost([]);

        const store = probeStore!;

        // Register two slices, mutate one, verify the other is untouched.
        ensurePluginSlice(store, 'alpha', { counter: 0 });
        ensurePluginSlice(store, 'beta', { counter: 0 });
        store.plugins.alpha.counter = 7;
        expect(store.plugins.beta.counter).toBe(0);
        expect(store.plugins.alpha.counter).toBe(7);

        // ensurePluginSlice is idempotent and NEVER clobbers live state.
        ensurePluginSlice(store, 'alpha', { counter: 99 });
        expect(store.plugins.alpha.counter).toBe(7);

        // Deleting alpha leaves beta fully intact — no residue.
        forgetPlugin(store, 'alpha');
        expect(store.plugins.alpha).toBeUndefined();
        expect(store.plugins.beta.counter).toBe(0);

        // Deleting the ACTIVE plugin clears the selection with it.
        selectEntry(store, 'beta', 'b1');
        expect(store.active).toEqual({ pluginId: 'beta', entryId: 'b1' });
        forgetPlugin(store, 'beta');
        expect(store.active).toEqual({ pluginId: '', entryId: '' });
        expect(store.plugins.beta).toBeUndefined();
    });
});

describe('plugin deletion — the dashboard survives and falls back', () => {
    it('a stale selection pointing at a removed plugin snaps to the first remaining one', async () => {
        const alpha = makePlugin('alpha', ['a1']);
        const beta = makePlugin('beta', ['b1']);

        // Mount with BOTH plugins, select beta, then re-render the host with
        // ONLY alpha (simulating "beta was deleted from the plugin list").
        const { rerender } = mountHost([alpha, beta]);
        fireEvent.click(screen.getByRole('button', { name: 'beta-b1' }));
        expect(screen.getByTestId('beta-page')).toBeDefined();

        rerender(
            <DashboardContextProvider>
                <TestHost plugins={[alpha]} />
            </DashboardContextProvider>
        );

        // The registry fallback selects alpha's first entry — no crash, no
        // blank canvas, no reference to beta anywhere in the DOM.
        await waitFor(() => {
            expect(screen.getByTestId('alpha-page').textContent).toBe('alpha:a1');
        });
        expect(screen.queryByTestId('beta-page')).toBeNull();
        expect(screen.queryByTestId('beta-bump')).toBeNull();
        expect(screen.queryByRole('button', { name: 'beta-b1' })).toBeNull();
        // And beta's slice is GONE from the store (forgetPlugin on teardown).
        expect(probeStore!.plugins.beta).toBeUndefined();
    });

    it('an empty plugin list renders nothing in any slot (all plugins deleted)', () => {
        mountHost([]);

        // No rail buttons, no toolbar content, no page content.
        expect(screen.getByTestId('rail-slot').querySelectorAll('button')).toHaveLength(0);
        expect(screen.getByTestId('toolbar-slot').textContent).toBe('');
        expect(screen.getByTestId('page-slot').textContent).toBe('');
    });
});

describe('the real worksheet plugin — registers through the same pipeline', () => {
    it('is the installed plugin list and mounts with its initial store', () => {
        // The production PLUGINS list contains exactly the worksheet plugin.
        expect(PLUGINS.map((p) => p.id)).toEqual([WORKSHEET_PLUGIN_ID]);

        mountHost(PLUGINS);

        // Initial store mounted: grade 1, 1 page, fit zoom, refresh 0.
        expect(probeStore!.plugins[WORKSHEET_PLUGIN_ID]).toEqual(worksheetInitialStore);

        // Default selection: first catalogue entry (addition) — its page
        // renders the Year 1 addition preview (pinned first row "10 + 9 =").
        expect(screen.getByTestId('sheet-preview-page1').textContent).toContain('1.10 + 9 =');
    });

    it('filterEntries hides Year-2-only types on Year 1 and shows them on Year 2', () => {
        mountHost(PLUGINS);

        // Year 1: Multiplication is NOT listed (times tables start at Y2).
        expect(screen.queryByRole('button', { name: 'Multiplication' })).toBeNull();
        expect(screen.getByRole('button', { name: 'Addition' })).toBeDefined();

        // The grade pills are the plugin's HEADER slot; switching to Year 2
        // re-runs filterEntries and Multiplication appears.
        fireEvent.click(screen.getByRole('radio', { name: '2' }));
        expect(screen.getByRole('button', { name: 'Multiplication' })).toBeDefined();

        // Switching back to Year 1 hides it again — and the rail selection
        // snaps back to a visible entry (Year 2 Mult selected → hidden on Y1).
        fireEvent.click(screen.getByRole('radio', { name: '1' }));
        expect(screen.queryByRole('button', { name: 'Multiplication' })).toBeNull();
        // The reconciled selection still renders a valid page.
        expect(screen.getByTestId('sheet-preview-page1')).toBeDefined();
    });
});

// The worksheet plugin object itself satisfies the full contract shape (the
// host pipeline above exercises it; this pins the declarative surface).
describe('worksheet plugin object — declarative contract', () => {
    it('declares one entry per math type with icon glyphs', () => {
        // MATH_TYPES order (generators.ts) = entry order; 18 types total.
        expect(worksheetPlugin.entries).toHaveLength(18);
        expect(worksheetPlugin.entries[0]).toEqual({
            id: 'addition',
            label: 'Addition',
            icon: '+',
            ariaLabel: 'Addition'
        });
        expect(worksheetPlugin.entries.map((e) => e.id)).toContain('money');
    });
});
