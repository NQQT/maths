// Unit tests for the package-local theme core (src/theme/theme.ts).
//
// Deterministic pins (R5):
//   - the exact package-specific storage key;
//   - preference validation (only 'system' | 'light' | 'dark');
//   - persistence: valid round-trip, invalid/absent → 'system' default,
//     unavailable/throwing storage degrades gracefully (read → default,
//     write → swallowed);
//   - system derivation via matchMedia with the 'light' fallback when the
//     API is absent (jsdom default);
//   - pure resolution: manual choices beat the OS, only 'system' follows it;
//   - data-theme publication on <html>;
//   - the app.css @media print COLOUR SAFEGUARD (paper stays white/dark-ink
//     under every theme) — jsdom never loads app.css, so the rules are
//     pinned from the stylesheet source instead (same source-pin convention
//     as the print placement notes in MathsDashboard.test.tsx).

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
    THEME_STORAGE_KEY,
    THEME_PREFERENCES,
    THEME_LABELS,
    DEFAULT_THEME_PREFERENCE,
    isThemePreference,
    readThemePreference,
    writeThemePreference,
    getSystemTheme,
    resolveTheme,
    applyThemeAttribute
} from './theme';

// Save/restore window.localStorage between cases — some tests replace it with
// a throwing or absent implementation to exercise the graceful paths.
const originalLocalStorage = window.localStorage;

function replaceLocalStorage(value: PropertyDescriptor['value']) {
    Object.defineProperty(window, 'localStorage', { configurable: true, value });
}

beforeEach(() => {
    originalLocalStorage.removeItem(THEME_STORAGE_KEY);
});

afterEach(() => {
    Object.defineProperty(window, 'localStorage', { configurable: true, value: originalLocalStorage });
    document.documentElement.removeAttribute('data-theme');
});

describe('theme core — constants', () => {
    it('uses the exact package-specific storage key', () => {
        expect(THEME_STORAGE_KEY).toBe('@distribution/maths:theme');
    });

    it('offers exactly System, Light, Dark in that order (System default)', () => {
        expect(THEME_PREFERENCES).toEqual(['system', 'light', 'dark']);
        expect(THEME_LABELS).toEqual({ system: 'System', light: 'Light', dark: 'Dark' });
        expect(DEFAULT_THEME_PREFERENCE).toBe('system');
    });
});

describe('theme core — isThemePreference', () => {
    it('accepts only the three exact literals', () => {
        expect(isThemePreference('system')).toBe(true);
        expect(isThemePreference('light')).toBe(true);
        expect(isThemePreference('dark')).toBe(true);
        expect(isThemePreference('neon')).toBe(false);
        expect(isThemePreference('')).toBe(false);
        expect(isThemePreference('DARK')).toBe(false);
        expect(isThemePreference(null)).toBe(false);
        expect(isThemePreference(undefined)).toBe(false);
        expect(isThemePreference(0)).toBe(false);
    });
});

describe('theme core — persistence', () => {
    it('round-trips a valid preference under the package key', () => {
        writeThemePreference('dark');
        expect(originalLocalStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
        expect(readThemePreference()).toBe('dark');
        writeThemePreference('light');
        expect(originalLocalStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
        expect(readThemePreference()).toBe('light');
        writeThemePreference('system');
        expect(originalLocalStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
        expect(readThemePreference()).toBe('system');
    });

    it('falls back to the system default when nothing is stored', () => {
        expect(readThemePreference()).toBe('system');
    });

    it('falls back to the system default on an invalid stored value', () => {
        originalLocalStorage.setItem(THEME_STORAGE_KEY, 'neon');
        expect(readThemePreference()).toBe('system');
    });

    it('falls back to the system default when storage is unavailable', () => {
        replaceLocalStorage(undefined);
        expect(readThemePreference()).toBe('system');
        // Writes against unavailable storage must not throw.
        expect(() => writeThemePreference('dark')).not.toThrow();
    });

    it('survives storage that throws on access (private mode)', () => {
        replaceLocalStorage({
            getItem() {
                throw new Error('SecurityError');
            },
            setItem() {
                throw new Error('QuotaExceededError');
            }
        });
        expect(readThemePreference()).toBe('system');
        expect(() => writeThemePreference('dark')).not.toThrow();
    });
});

describe('theme core — system derivation + resolution', () => {
    // jsdom has NO matchMedia: the documented fallback is 'light'.
    it('falls back to light when matchMedia is absent', () => {
        expect(typeof window.matchMedia).not.toBe('function');
        expect(getSystemTheme()).toBe('light');
    });

    it('derives dark/light from prefers-color-scheme when matchMedia exists', () => {
        const originalMatchMedia = (window as any).matchMedia;
        (window as any).matchMedia = (query: string) => ({
            matches: query === '(prefers-color-scheme: dark)',
            media: query
        });
        expect(getSystemTheme()).toBe('dark');
        (window as any).matchMedia = (query: string) => ({
            matches: false,
            media: query
        });
        expect(getSystemTheme()).toBe('light');
        (window as any).matchMedia = originalMatchMedia;
    });

    it('resolves: manual choices win, only system follows the OS', () => {
        expect(resolveTheme('system', 'dark')).toBe('dark');
        expect(resolveTheme('system', 'light')).toBe('light');
        expect(resolveTheme('light', 'dark')).toBe('light');
        expect(resolveTheme('dark', 'light')).toBe('dark');
    });
});

describe('theme core — data-theme publication', () => {
    it('sets data-theme on the document element', () => {
        applyThemeAttribute('dark');
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
        applyThemeAttribute('light');
        expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
});

describe('app.css — theme tokens + print colour safeguard (source pins)', () => {
    // jsdom does not apply app.css, so the safeguard is pinned from source.
    // fileURLToPath (not `new URL(rel, import.meta.url)`): under vitest's
    // jsdom environment the global URL is jsdom's, which resolves relative
    // inputs against the document base (http://localhost:3000/) and node:fs
    // then rejects the http: URL — same reason as the package.json read in
    // src/App.test.tsx.
    const here = dirname(fileURLToPath(import.meta.url));
    const css = readFileSync(join(here, '../app.css'), 'utf-8');
    const printBlock = css.slice(css.indexOf('@media print'));

    it('defines the light token set on :root and the dark set on [data-theme=dark]', () => {
        expect(css).toContain(':root {\n    color-scheme: light;');
        expect(css).toContain('--app-bg: #f4f6fb;');
        expect(css).toContain("[data-theme='dark'] {\n    color-scheme: dark;");
        expect(css).toContain('--surface: #151f33;');
        expect(css).toContain('--text: #e8edf7;');
    });

    it('forces paper colours under @media print regardless of the theme', () => {
        // html/body forced white with dark ink...
        expect(printBlock).toContain('background: #ffffff !important;');
        expect(printBlock).toContain('color: #1a1a1a !important;');
        // ...every token re-forced to paper values for BOTH data-theme states...
        expect(printBlock).toContain("[data-theme='dark'] {");
        expect(printBlock).toContain('--text: #1a1a1a;');
        expect(printBlock).toContain('--app-bg: #ffffff;');
        // ...and the A4 blocks stay white.
        expect(printBlock).toContain('.print-page {\n        width: 210mm;\n        height: 297mm;\n        overflow: hidden;\n        background: #ffffff;');
    });
});
