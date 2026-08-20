// Segmented zoom switcher (Fit / 50% / 75% / 100%). Used on the preview
// canvas AND in the print modal's top bar, so a teacher's zoom preference
// carries between the two. `tone` swaps the palette to match the backdrop
// (light dot-grid canvas vs dark modal bar).
import React from 'react';
import { styledComponent } from '@presource/react';
import { ZOOM_OPTIONS, type ZoomMode } from './page-scale';

export type ZoomControlProps = {
    // Accessible group label, e.g. "Preview zoom" or "Print zoom".
    label: string;
    value: ZoomMode;
    onChange: (mode: ZoomMode) => void;
    // 'dark' for the print modal's dark bar; 'light' for the preview canvas.
    tone?: 'light' | 'dark';
};

// Pill container holding the zoom segments.
const ZoomGroup = styledComponent<{ dark: boolean }>('div', {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    padding: '3px',
    borderRadius: '10px',
    border: '1px solid #e4e9f2',
    flexShrink: 0,
    background: ({ dark }) => (dark ? 'rgba(148,163,184,0.14)' : '#eef1f7')
});

// One zoom segment; the selected one lifts to a solid chip.
const ZoomSegment = styledComponent<{ dark: boolean; active: boolean }>('button', {
    padding: '5px 10px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    lineHeight: 1,
    cursor: 'pointer',
    flexShrink: 0,
    background: ({ active, dark }) => (active ? (dark ? '#f8fafc' : '#ffffff') : 'transparent'),
    color: ({ active, dark }) => (active ? '#0f172a' : dark ? '#cbd5e1' : '#64748b'),
    boxShadow: ({ active }) => (active ? '0 1px 2px rgba(15,23,42,0.16)' : 'none'),
    transition: 'background 0.12s ease, color 0.12s ease'
});

export function ZoomControl({ label, value, onChange, tone = 'light' }: ZoomControlProps) {
    const dark = tone === 'dark';
    return (
        // role/aria-label announce e.g. "Preview zoom: Fit" semantics per button.
        <ZoomGroup dark={dark} role="group" aria-label={label}>
            {ZOOM_OPTIONS.map((opt) => (
                <ZoomSegment
                    key={String(opt.id)}
                    dark={dark}
                    active={value === opt.id}
                    aria-pressed={value === opt.id}
                    aria-label={`${label}: ${opt.label}`}
                    onClick={() => onChange(opt.id)}
                >
                    {opt.label}
                </ZoomSegment>
            ))}
        </ZoomGroup>
    );
}