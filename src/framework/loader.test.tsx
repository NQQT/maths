// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Plugin LOADER tests â€” the "dashboard first, plugins one by one" contract.
//
// These pin the loading order fix: PLUGINS used to invoke every factory at
// MODULE LOAD time, constructing all 18 plugins before the dashboard ever
// rendered. Now the loader:
//
//   1. loads the FIRST plugin with the dashboard's first render (useState
//      initializer â€” the shell + default worksheet are in the first paint);
//   2. loads the remaining factories ONE BY ONE after mount, in factory
//      order, yielding to the browser between loads (macrotask);
//   3. reports `done` only once every factory has been loaded;
//   4. is IDEMPOTENT under StrictMode's simulated unmount/remount â€” no
//      factory is ever loaded twice into the loaded list;
//   5. handles the empty factory list (nothing to load, done immediately).
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import {
    DashboardContextProvider,
    usePluginLoader,
    definePlugin,
    DASHBOARD_FRAMEWORK,
    type DashboardPlugin,
    type DashboardFramework,
    type PluginFactory,
    type PluginLoaderResult
} from './index';

afterEach(() => {
    cleanup();
});

// A minimal plugin factory wrapper: records the invocation in `loadedOrder`
// (the LOADING order â€” what this suite is about) and returns a throwaway
// plugin satisfying the DashboardPlugin contract (page required).
function makeFactory(id: string, loadedOrder: string[]): PluginFactory {
    return (dashboard: DashboardFramework): DashboardPlugin => {
        loadedOrder.push(id);
        return definePlugin({
            id,
            name: `Test ${id}`,
            entries: [{ id: `${id}-entry`, label: id }],
            page: ({ context }) => <div data-testid={`${id}-page`}>{context.pluginId}</div>
        });
    };
}

// Test harness: runs the loader against the framework bundle and reports the
// latest loader result + the live loaded count in the DOM.
function LoaderProbe({
    factories,
    onResult
}: {
    factories: PluginFactory[];
    onResult: (result: PluginLoaderResult) => void;
}) {
    const result = usePluginLoader(factories, DASHBOARD_FRAMEWORK);
    onResult(result);
    return <div data-testid="loaded-count">{result.plugins.length}</div>;
}

function mountLoader(factories: PluginFactory[], onResult: (r: PluginLoaderResult) => void) {
    return render(
        <DashboardContextProvider>
            <LoaderProbe factories={factories} onResult={onResult} />
        </DashboardContextProvider>
    );
}

// Generous TEST timeout: the loader yields between plugins via macrotasks
// (scriptPause(0), see loader.ts), and under full-workspace parallel load
// (turbo run test) those macrotasks can be delayed well past vitest's 5s
// default â€” a scheduling flake, not a regression. 30s keeps it deterministic.
vi.setConfig({ testTimeout: 30_000, hookTimeout: 30_000 });

describe('usePluginLoader â€” dashboard first, plugins one by one', () => {
    it('loads the first plugin with the first render, the rest one by one in factory order', async () => {
        const loadedOrder: string[] = [];
        const results: PluginLoaderResult[] = [];
        const factories = ['alpha', 'beta', 'gamma'].map((id) => makeFactory(id, loadedOrder));

        mountLoader(factories, (r) => results.push(r));

        // The FIRST factory already ran during the first render (stage 1);
        // the mount effect flushed the SECOND one synchronously inside
        // render()'s act() â€” everything AFTER that waits on macrotasks, so
        // exactly two plugins are loaded at this instant.
        expect(loadedOrder).toEqual(['alpha', 'beta']);
        expect(screen.getByTestId('loaded-count').textContent).toBe('2');

        // The remaining plugins land one by one (macrotask yields), in
        // factory order, until every factory is loaded.
        await waitFor(
            () => {
                expect(screen.getByTestId('loaded-count').textContent).toBe('3');
            },
            { timeout: 20_000 }
        );
        expect(loadedOrder).toEqual(['alpha', 'beta', 'gamma']);
        // `done` flips only when the LAST factory has been loaded.
        expect(results[results.length - 1].done).toBe(true);
    });

    it('loads a long list completely, preserving factory order', async () => {
        const loadedOrder: string[] = [];
        const ids = Array.from({ length: 8 }, (_, i) => `p${i}`);
        const factories = ids.map((id) => makeFactory(id, loadedOrder));

        mountLoader(factories, () => {});

        await waitFor(
            () => {
                expect(screen.getByTestId('loaded-count').textContent).toBe('8');
            },
            { timeout: 20_000 }
        );
        expect(loadedOrder).toEqual(ids);
    });

    it('a single-factory list is done immediately (no background loads pending)', () => {
        const loadedOrder: string[] = [];
        let last: PluginLoaderResult | null = null;
        const factories = ['only'].map((id) => makeFactory(id, loadedOrder));

        mountLoader(factories, (r) => {
            last = r;
        });

        expect(loadedOrder).toEqual(['only']);
        expect(screen.getByTestId('loaded-count').textContent).toBe('1');
        // StrictMode/act note: the mount effect runs inside render()'s act
        // flush, but loadFrom(1) is out of range â€” nothing more to load, so
        // the loader is already done here.
        expect(last!.done).toBe(true);
    });

    it('an empty factory list loads nothing and is done immediately', () => {
        let last: PluginLoaderResult | null = null;
        mountLoader([], (r) => {
            last = r;
        });

        expect(screen.getByTestId('loaded-count').textContent).toBe('0');
        expect(last!.done).toBe(true);
    });

    it('StrictMode double mount never loads a factory twice into the list', async () => {
        const loadedOrder: string[] = [];
        const results: PluginLoaderResult[] = [];
        const factories = ['alpha', 'beta', 'gamma'].map((id) => makeFactory(id, loadedOrder));

        // StrictMode simulates unmount/remount of the effect chain; the
        // loader must survive it with no duplicates and no gaps.
        render(
            <React.StrictMode>
                <DashboardContextProvider>
                    <LoaderProbe factories={factories} onResult={(r) => results.push(r)} />
                </DashboardContextProvider>
            </React.StrictMode>
        );

        await waitFor(
            () => {
                expect(screen.getByTestId('loaded-count').textContent).toBe('3');
            },
            { timeout: 20_000 }
        );

        // The pure first-plugin initializer may be double-INVOKED by
        // StrictMode (dev-only, discarded duplicate), but 'beta' and 'gamma'
        // â€” the background loads â€” must each have run EXACTLY once.
        expect(loadedOrder.filter((id) => id === 'beta')).toEqual(['beta']);
        expect(loadedOrder.filter((id) => id === 'gamma')).toEqual(['gamma']);

        // The loaded list itself holds each plugin exactly once, in order.
        const result = results[results.length - 1];
        expect(result.plugins.map((p) => p.id)).toEqual(['alpha', 'beta', 'gamma']);
        expect(result.done).toBe(true);
    });
});
