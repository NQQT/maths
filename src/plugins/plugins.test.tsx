// ─────────────────────────────────────────────────────────────────────────────
// Plugin architecture tests — the isolation guarantees the framework is about.
//
// These tests prove the plugin contract end-to-end:
//
//   1. COMPOSITION: two plugins register side by side; their entries merge
//      into ONE rail in registration order; selecting an entry activates
//      that plugin's page only (framework swaps, siblings stay isolated).
//   2. STATE ISOLATION: mutating one plugin's slice never re-renders or
//      corrupts another plugin's slice; slices are namespaced by plugin id.
//      The framework SESSION (grade/pages/zoom/refresh) is separate shared
//      state that belongs to the framework, not to any plugin.
//   3. DELETION LEAVES NO TRACE: unregistering a plugin wipes its slice from
//      the store (active selection included); the remaining plugin and the
//      framework keep working untouched — deleting a plugin's file + list
//      line is safe by construction.
//   4. SELECTION FALLBACK: a stale selection pointing at a deleted plugin
//      snaps back to the first remaining plugin.
//   5. THE REAL WORKSHEETS: the 18 per-type plugins (AdditionWorksheet,
//      SubtractionWorksheet, ...) load through the same pipeline the
//      framework uses (the PLUGINS factory list, loaded one by one by
//      usePluginLoader after the dashboard renders), share the dashboard
//      session, and their rail entries are grade-gated (Year 1 hides
//      Multiplication).
//
// The fixtures are throwaway plugins defined inline here — by design, adding
// a plugin is just "a function that satisfies DashboardPlugin".
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
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
    DASHBOARD_FRAMEWORK,
    type DashboardPlugin,
    type DashboardStoreStructure
} from '../framework';
import { PLUGINS } from './index';
import { AdditionWorksheet } from './AdditionWorksheet';

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
            {/* Header slot (worksheet plugins declare none; the framework's
                own grade selector lives in the real host). */}
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

    it('the dashboard session is framework-level state, separate from plugin slices', () => {
        mountHost([]);

        const store = probeStore!;

        // The framework session starts with the maths configuration defaults.
        expect(store.session).toEqual({ gradeId: 1, pageCount: 1, zoom: 'fit', refresh: 0 });

        // Session mutations never touch plugin slices...
        store.session.gradeId = 2;
        store.session.pageCount = 3;
        expect(store.plugins).toEqual({});

        // ...and plugin slices never touch the session.
        ensurePluginSlice(store, 'alpha', { counter: 0 });
        store.plugins.alpha.counter = 7;
        expect(store.session).toEqual({ gradeId: 2, pageCount: 3, zoom: 'fit', refresh: 0 });
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

// ── The real worksheet plugins ───────────────────────────────────────────────
// One plugin per worksheet type. PLUGINS stores UNINVOKED factories (the
// dashboard loads them one by one AFTER it has rendered — framework/
// loader.ts), so this suite builds the list the same way the loader does: by
// calling each factory with DASHBOARD_FRAMEWORK.

const EXPECTED_WORKSHEET_IDS = [
    'addition',
    'subtraction',
    'mult',
    'missing',
    'comparison',
    'skip',
    'word',
    'counting',
    'doubles',
    'bonds',
    'patterns',
    'shapes',
    'time',
    'measure',
    'placevalue',
    'data',
    'division',
    'money'
];

// The plugin list, built through the same pipeline usePluginLoader uses.
const WORKSHEETS: DashboardPlugin[] = PLUGINS.map((load) => load(DASHBOARD_FRAMEWORK));

describe('the real worksheet plugins — register through the same pipeline', () => {
    it('is the installed plugin list: one plugin per worksheet type, in catalogue order', () => {
        // PLUGINS is the ordered list of UNINVOKED factories...
        expect(PLUGINS).toHaveLength(EXPECTED_WORKSHEET_IDS.length);
        for (const load of PLUGINS) {
            expect(typeof load).toBe('function');
        }
        // ...which produce the plugins in catalogue order when loaded.
        expect(WORKSHEETS.map((p) => p.id)).toEqual(EXPECTED_WORKSHEET_IDS);
        // Every worksheet declares exactly ONE rail entry — its own label.
        for (const plugin of WORKSHEETS) {
            expect(plugin.entries).toHaveLength(1);
            expect(plugin.entries[0].id).toBe(plugin.id);
        }
    });

    it('mounts with the shared dashboard session and previews Addition by default', () => {
        mountHost(WORKSHEETS);

        // The framework session starts on Year 1, 1 page, fit zoom.
        expect(probeStore!.session).toEqual({ gradeId: 1, pageCount: 1, zoom: 'fit', refresh: 0 });

        // Default selection: the first plugin (Addition) — its page renders
        // the Year 1 addition preview (pinned first row "10 + 9 =").
        expect(screen.getByTestId('sheet-preview-page1').textContent).toContain('1.10 + 9 =');
    });

    it('grade-gates the rail: Year 1 hides Multiplication, Year 2 shows it', () => {
        mountHost(WORKSHEETS);

        // Year 1: Multiplication is NOT listed (times tables start at Y2).
        expect(screen.queryByRole('button', { name: 'Multiplication' })).toBeNull();
        expect(screen.getByRole('button', { name: 'Addition' })).toBeDefined();

        // The framework's grade selector writes store.session.gradeId; the
        // same write path re-runs every plugin's isOffered gate. (The store
        // mutation is wrapped in act() so React flushes the re-render before
        // the assertion — exactly what the real GradeSelector's click does.)
        act(() => {
            probeStore!.session.gradeId = 2;
        });
        expect(screen.getByRole('button', { name: 'Multiplication' })).toBeDefined();

        // Select Multiplication, then drop back to Year 1: its entry hides
        // and the rail selection snaps to a visible worksheet (Addition), so
        // the reconciled selection still renders a valid page.
        fireEvent.click(screen.getByRole('button', { name: 'Multiplication' }));
        act(() => {
            probeStore!.session.gradeId = 1;
        });
        expect(screen.queryByRole('button', { name: 'Multiplication' })).toBeNull();
        expect(screen.getByTestId('sheet-preview-page1')).toBeDefined();
    });

    it('worksheet plugins share the dashboard session (page count persists across worksheets)', () => {
        mountHost(WORKSHEETS);

        // Set 3 pages while Addition is active, then switch to Subtraction:
        // the page count lives in the framework session, not in either plugin.
        fireEvent.change(screen.getByTestId('page-count'), { target: { value: '3' } });
        fireEvent.click(screen.getByRole('button', { name: 'Subtraction' }));
        expect((screen.getByTestId('page-count') as HTMLInputElement).value).toBe('3');
        expect(screen.getByTestId('sheet-preview-page3')).toBeDefined();
    });
});

// The AdditionWorksheet factory itself satisfies the full contract shape (the
// framework pipeline above exercises it; this pins the declarative surface).
describe('worksheet plugin factory — declarative contract', () => {
    it('AdditionWorksheet takes the framework and describes its own rail entry', () => {
        const plugin = AdditionWorksheet(DASHBOARD_FRAMEWORK);
        expect(plugin.id).toBe('addition');
        expect(plugin.name).toBe('Addition Worksheet');
        expect(plugin.entries).toEqual([
            { id: 'addition', label: 'Addition', icon: '+', ariaLabel: 'Addition' }
        ]);
        // Its content surfaces are wired (toolbar/page/print) and it is
        // offered on Year 1 (the framework's default grade).
        expect(plugin.toolbar).toBeDefined();
        expect(plugin.page).toBeDefined();
        expect(plugin.print).toBeDefined();
        expect(plugin.isOffered).toBeDefined();
    });
});
