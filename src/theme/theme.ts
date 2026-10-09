// ─────────────────────────────────────────────────────────────────────────────
// Package-local theme core — NO new dependencies, NO shared package.
//
// The theme is a PREFERENCE ('system' | 'light' | 'dark') that resolves to a
// CONCRETE palette ('light' | 'dark'). The resolved palette is published as a
// `data-theme` attribute on <html>; src/app.css carries the actual colour
// tokens as CSS custom properties keyed off that attribute, and every
// styledComponent in the shell references the vars (var(--...)) instead of
// hardcoded hex. PrintableSheet deliberately keeps hardcoded PAPER colours so
// no theme can ever bleed onto the printed page (see app.css @media print
// safeguard + PrintableSheet.tsx).
//
// Graceful degradation (R5):
//   - matchMedia absent (jsdom, old engines)  → system resolves to 'light';
//   - localStorage absent/throwing (private mode, quota) → reads fall back to
//     the 'system' default and writes are swallowed — the app never crashes
//     because persistence is unavailable.
// ─────────────────────────────────────────────────────────────────────────────

// Package-specific storage key — namespaced so it can never collide with a
// sibling distribution app sharing an origin (e.g. GitHub Pages subpaths).
export const THEME_STORAGE_KEY = '@distribution/maths:theme';

// What the user picks in the Theme select. 'system' means "follow the OS".
export type ThemePreference = 'system' | 'light' | 'dark';

// What the app actually paints once 'system' is resolved via matchMedia.
export type ResolvedTheme = 'light' | 'dark';

// Rail order of the Theme select options (System first — it is the default).
export const THEME_PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark'];

// Human-readable option labels for the native select.
export const THEME_LABELS: Record<ThemePreference, string> = {
    system: 'System',
    light: 'Light',
    dark: 'Dark'
};

// The preference every fresh (or corrupted-storage) session starts from.
export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system';

// Runtime guard for anything read out of storage — only the three exact
// literals are valid preferences; 'neon', '', null, numbers etc. are rejected.
export function isThemePreference(value: unknown): value is ThemePreference {
    return value === 'system' || value === 'light' || value === 'dark';
}

// Safe localStorage accessor — returns null when storage is unavailable
// (deleted window.localStorage, SecurityError in some privacy modes).
function getStorage(): Storage | null {
    try {
        return typeof window !== 'undefined' ? window.localStorage ?? null : null;
    } catch {
        // Accessing window.localStorage itself can throw (blocked storage).
        return null;
    }
}

// Read the persisted preference. Invalid/absent/unavailable storage all fall
// back to the 'system' default — a corrupt value never bricks the shell.
export function readThemePreference(): ThemePreference {
    const storage = getStorage();
    if (!storage) return DEFAULT_THEME_PREFERENCE;
    try {
        const raw = storage.getItem(THEME_STORAGE_KEY);
        return isThemePreference(raw) ? raw : DEFAULT_THEME_PREFERENCE;
    } catch {
        // getItem can throw even when the Storage object exists.
        return DEFAULT_THEME_PREFERENCE;
    }
}

// Persist the preference. Write failures (quota, private mode) are swallowed:
// the theme still applies for this session, it just does not survive reload.
export function writeThemePreference(preference: ThemePreference): void {
    const storage = getStorage();
    if (!storage) return;
    try {
        storage.setItem(THEME_STORAGE_KEY, preference);
    } catch {
        // Intentionally silent — persistence is best-effort (see above).
    }
}

// The OS colour scheme. jsdom / SSR have no matchMedia → 'light' fallback
// (same convention as distribution/ghost-story/src/App.tsx:37-42).
export function getSystemTheme(): ResolvedTheme {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
}

// Pure resolution: a manual 'light'/'dark' choice always beats the OS; only
// the 'system' preference follows the resolved OS scheme. This is what makes
// live OS updates effective ONLY while the select sits on System (R5).
export function resolveTheme(preference: ThemePreference, systemTheme: ResolvedTheme): ResolvedTheme {
    return preference === 'system' ? systemTheme : preference;
}

// Publish the resolved palette for app.css (data-theme attribute on <html>).
// Guarded for non-DOM environments; app.css defaults to the light token set
// when the attribute is absent, so this is additive, never load-bearing.
export function applyThemeAttribute(theme: ResolvedTheme): void {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', theme);
}
