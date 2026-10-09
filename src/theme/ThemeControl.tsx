// ─────────────────────────────────────────────────────────────────────────────
// ThemeControl — the accessible Theme select in the dashboard header.
//
// A NATIVE <select> (keyboard/screen-reader accessible for free, matches the
// framework's no-MUI chrome style) with a real <label htmlFor> pairing. The
// three options are rendered from THEME_PREFERENCES/THEME_LABELS in theme.ts,
// so the option set and order are defined exactly once.
//
// Placement: HeaderBar right cluster in MathsDashboard.tsx — between the
// grade selector and the plugin header slot (the header's right area is the
// framework configuration zone; the theme is dashboard-wide configuration,
// exactly like the grade).
//
// styledComponent's typed surface is HTMLAttributes<HTMLElement> (no
// `htmlFor`/select-change props), so both the label and the select are cast
// to their native attribute surfaces — the same pattern as PageInput in
// framework/worksheet-kit.tsx:411-430.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { styledComponent } from '@presource/react';
import { THEME_LABELS, THEME_PREFERENCES, isThemePreference, type ThemePreference } from './theme';
import { useTheme } from './useTheme';

// Stable DOM id for the label/control pairing.
export const THEME_SELECT_ID = 'maths-theme-select';

// Inline field: label + select sit as one compact header control.
const ThemeField = styledComponent('div', {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    flexShrink: 0
});

const ThemeLabel = styledComponent('label', {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: 'var(--text-faint)'
}) as unknown as React.FC<React.LabelHTMLAttributes<HTMLLabelElement>>;

// Themed to sit beside the grade pills: same border radius family, colours
// entirely from the CSS custom properties so the control reads correctly in
// both palettes (color-scheme on <html> also flips the native dropdown UI).
const ThemeSelect = styledComponent('select', {
    height: '32px',
    padding: '0 10px',
    borderRadius: '999px',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer'
}) as unknown as React.FC<React.SelectHTMLAttributes<HTMLSelectElement>>;

export function ThemeControl() {
    const theme = useTheme();

    return (
        <ThemeField>
            <ThemeLabel htmlFor={THEME_SELECT_ID}>Theme</ThemeLabel>
            <ThemeSelect
                id={THEME_SELECT_ID}
                data-testid="theme-select"
                // The controlled value is the persisted preference; the
                // browser paints the OS-native dropdown.
                value={theme.preference()}
                onChange={(event) => {
                    // Guard the DOM string against anything that is not one
                    // of the three known preferences (defensive — the option
                    // list below is the only source of values).
                    const next = event.target.value;
                    if (isThemePreference(next)) theme.setPreference(next as ThemePreference);
                }}
            >
                {THEME_PREFERENCES.map((preference) => (
                    <option key={preference} value={preference}>
                        {THEME_LABELS[preference]}
                    </option>
                ))}
            </ThemeSelect>
        </ThemeField>
    );
}
