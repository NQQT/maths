// ─────────────────────────────────────────────────────────────────────────────
// useTheme — the React binding of the package-local theme core (theme.ts).
//
// State: the persisted PREFERENCE (default 'system') + the live OS scheme.
// Effects:
//   1. matchMedia change listener — tracks the OS scheme continuously. The
//      resolved palette only FOLLOWS it while the preference is 'system'
//      (resolveTheme in theme.ts), so a manual Light/Dark choice is never
//      overridden by an OS flip (R5).
//   2. data-theme attribute — republished on every resolved change so the
//      CSS custom properties in app.css swap atomically.
//
// useStateHook (@presource/react) backs both state cells; the handles are
// stable across renders (same contract used across the sibling distributions).
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { useStateHook } from '@presource/react';
import {
    applyThemeAttribute,
    getSystemTheme,
    readThemePreference,
    resolveTheme,
    writeThemePreference,
    type ResolvedTheme,
    type ThemePreference
} from './theme';

export type ThemeController = {
    // What the Theme select shows (system | light | dark).
    preference: () => ThemePreference;
    // What the shell actually paints right now.
    resolved: () => ResolvedTheme;
    // Select handler — updates state AND persists the choice.
    setPreference: (preference: ThemePreference) => void;
};

export function useTheme(): ThemeController {
    // Initial preference comes from storage (invalid/absent → 'system').
    const preference = useStateHook<ThemePreference>(readThemePreference());
    // Live OS scheme; 'light' when matchMedia is unavailable.
    const systemTheme = useStateHook<ResolvedTheme>(getSystemTheme());

    // Track the OS colour scheme for the whole session. The listener stays
    // attached regardless of the current preference — resolveTheme() decides
    // whether an OS update actually changes the painted palette, so switching
    // back to System immediately re-follows the (current) OS value.
    React.useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
        const query = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (event: MediaQueryListEvent) => {
            systemTheme(event.matches ? 'dark' : 'light');
        };
        // addEventListener is the modern API; older Safari only exposes
        // addListener — both are optional-chained so absent APIs are no-ops.
        query.addEventListener?.('change', handleChange);
        return () => {
            query.removeEventListener?.('change', handleChange);
        };
        // systemTheme is a stable useStateHook handle — mount-once subscription.
    }, []);

    // Republish the resolved palette whenever preference or OS scheme moves.
    const resolved = resolveTheme(preference(), systemTheme());
    React.useEffect(() => {
        applyThemeAttribute(resolved);
    }, [resolved]);

    // Manual choice: update state + persist (write failures are swallowed in
    // theme.ts — the session still applies the theme without storage).
    const setPreference = (next: ThemePreference) => {
        preference(next);
        writeThemePreference(next);
    };

    return { preference, resolved: () => resolved, setPreference };
}
