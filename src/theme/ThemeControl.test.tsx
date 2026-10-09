// Tests for the Theme select + useTheme wiring (R5).
//
// Pins:
//   - accessible native select: real <label> "Theme" paired by htmlFor/id,
//     options exactly System / Light / Dark, default System;
//   - persisted preference drives the initial paint (valid, invalid, absent);
//   - System mode follows the OS: matchMedia('(prefers-color-scheme: dark)')
//     decides the initial data-theme AND live changes update it;
//   - a manual Light/Dark choice overrides the OS AND stops OS updates from
//     taking effect (the listener only matters in System mode);
//   - persistence under the exact package key; storage failures never break
//     the applied theme.
//
// jsdom has no matchMedia, so the OS is stubbed (same stub pattern as
// distribution/ghost-story/src/App.test.tsx:204-232) with captured change
// listeners the tests can fire.

import React from 'react';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ThemeControl, THEME_SELECT_ID } from './ThemeControl';
import { THEME_STORAGE_KEY } from './theme';

type StubEntry = {
    matches: boolean;
    listeners: ((event: { matches: boolean; media: string }) => void)[];
};

// Live stub registry for the current test — key: media query.
let stubs: Record<string, StubEntry>;
let originalLocalStorage: Storage;

// Install a matchMedia stub whose dark query starts at `dark`.
function stubMatchMedia(dark: boolean) {
    stubs = {
        '(prefers-color-scheme: dark)': { matches: dark, listeners: [] }
    };
    (window as any).matchMedia = (query: string) => {
        const entry = (stubs[query] ??= { matches: false, listeners: [] });
        return {
            matches: entry.matches,
            media: query,
            addEventListener: (_type: string, listener: StubEntry['listeners'][number]) => {
                entry.listeners.push(listener);
            },
            removeEventListener: (_type: string, listener: StubEntry['listeners'][number]) => {
                entry.listeners = entry.listeners.filter((l) => l !== listener);
            }
        };
    };
}

// Flip the stubbed OS scheme and fire the captured change listeners —
// exactly what a real OS theme switch does to a live MediaQueryList. The
// fire is wrapped in act(): the listener drives a React state update
// (useTheme's systemTheme cell), and without act the update/effect flush
// stays pending so the data-theme assertion below would read the stale value.
function setSystemDark(dark: boolean) {
    const entry = stubs['(prefers-color-scheme: dark)'];
    entry.matches = dark;
    act(() => {
        entry.listeners.forEach((listener) =>
            listener({ matches: dark, media: '(prefers-color-scheme: dark)' })
        );
    });
}

function themeAttribute(): string | null {
    return document.documentElement.getAttribute('data-theme');
}

function select(): HTMLSelectElement {
    return screen.getByLabelText('Theme') as HTMLSelectElement;
}

beforeEach(() => {
    originalLocalStorage = window.localStorage;
    originalLocalStorage.removeItem(THEME_STORAGE_KEY);
    stubs = {};
});

afterEach(() => {
    cleanup();
    delete (window as any).matchMedia;
    Object.defineProperty(window, 'localStorage', { configurable: true, value: originalLocalStorage });
    document.documentElement.removeAttribute('data-theme');
});

describe('ThemeControl — accessibility + options', () => {
    it('renders a native select labelled Theme with exactly System/Light/Dark', () => {
        render(<ThemeControl />);
        const control = select();
        expect(control.tagName).toBe('SELECT');
        expect(control.id).toBe(THEME_SELECT_ID);
        // The label is a real <label> element paired via htmlFor.
        expect(document.querySelector(`label[for="${THEME_SELECT_ID}"]`)?.textContent).toBe('Theme');
        expect(Array.from(control.options).map((o) => ({ value: o.value, text: o.text }))).toEqual([
            { value: 'system', text: 'System' },
            { value: 'light', text: 'Light' },
            { value: 'dark', text: 'Dark' }
        ]);
    });

    it('defaults to System and paints light when matchMedia is absent (jsdom)', () => {
        render(<ThemeControl />);
        expect(select().value).toBe('system');
        // No matchMedia → system resolves to the documented 'light' fallback.
        expect(themeAttribute()).toBe('light');
    });
});

describe('ThemeControl — persisted preference drives the first paint', () => {
    it('restores a stored Dark preference (select value + data-theme)', () => {
        originalLocalStorage.setItem(THEME_STORAGE_KEY, 'dark');
        render(<ThemeControl />);
        expect(select().value).toBe('dark');
        expect(themeAttribute()).toBe('dark');
    });

    it('ignores an invalid stored value and falls back to System', () => {
        originalLocalStorage.setItem(THEME_STORAGE_KEY, 'neon');
        stubMatchMedia(false);
        render(<ThemeControl />);
        expect(select().value).toBe('system');
        expect(themeAttribute()).toBe('light');
    });
});

describe('ThemeControl — System follows the OS live', () => {
    it('starts dark when the OS is dark, and live OS flips repaint', () => {
        stubMatchMedia(true);
        render(<ThemeControl />);
        expect(select().value).toBe('system');
        expect(themeAttribute()).toBe('dark');

        // OS switches to light while the preference is System → follows.
        setSystemDark(false);
        expect(themeAttribute()).toBe('light');

        // And back to dark.
        setSystemDark(true);
        expect(themeAttribute()).toBe('dark');
    });
});

describe('ThemeControl — manual override wins over the OS', () => {
    it('choosing Light under a dark OS repaints immediately and ignores later OS flips', () => {
        stubMatchMedia(true);
        render(<ThemeControl />);
        expect(themeAttribute()).toBe('dark');

        fireEvent.change(select(), { target: { value: 'light' } });
        expect(themeAttribute()).toBe('light');
        // Persisted under the exact package key.
        expect(originalLocalStorage.getItem(THEME_STORAGE_KEY)).toBe('light');

        // OS flips to light→dark→light: a manual choice is NOT overridden.
        setSystemDark(false);
        setSystemDark(true);
        expect(themeAttribute()).toBe('light');

        // Switching back to System re-follows the CURRENT OS scheme (dark).
        fireEvent.change(select(), { target: { value: 'system' } });
        expect(themeAttribute()).toBe('dark');
        expect(originalLocalStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
    });

    it('choosing Dark persists and paints regardless of a light OS', () => {
        stubMatchMedia(false);
        render(<ThemeControl />);
        fireEvent.change(select(), { target: { value: 'dark' } });
        expect(themeAttribute()).toBe('dark');
        expect(originalLocalStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    });
});

describe('ThemeControl — unavailable storage degrades gracefully', () => {
    it('still applies the theme when storage throws on read and write', () => {
        stubMatchMedia(false);
        Object.defineProperty(window, 'localStorage', {
            configurable: true,
            value: {
                getItem() {
                    throw new Error('SecurityError');
                },
                setItem() {
                    throw new Error('QuotaExceededError');
                }
            }
        });
        render(<ThemeControl />);
        expect(select().value).toBe('system');
        expect(themeAttribute()).toBe('light');

        // The manual change applies for the session even though persistence
        // is broken — no throw, theme painted.
        fireEvent.change(select(), { target: { value: 'dark' } });
        expect(themeAttribute()).toBe('dark');
        expect(select().value).toBe('dark');
    });
});
