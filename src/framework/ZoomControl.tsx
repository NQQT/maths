// Segmented zoom switcher (Fit / 50% / 75% / 100%) — framework layout
// component. Pins to the preview canvas (the zoom preference a teacher sets is
// exactly what they'll see when the browser-native print dialog shows the same
// A4 pages).
import React from 'react';
import { styledComponent } from '@presource/react';
import { ZOOM_OPTIONS, type ZoomMode } from './page-scale';

export type ZoomControlProps = {
    // Accessible group label, e.g. "Preview zoom".
    label: string;
    value: ZoomMode;
    onChange: (mode: ZoomMode) => void;
};

// Pill container holding the zoom segments.
const ZoomGroup = styledComponent('div', {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    padding: '3px',
    borderRadius: '10px',
    border: '1px solid #e4e9f2',
    flexShrink: 0,
    background: '#eef1f7'
});

// One zoom segment; the selected one lifts to a solid chip.
const ZoomSegment = styledComponent<{ active: boolean }>('button', {
    padding: '5px 10px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    lineHeight: 1,
    cursor: 'pointer',
    flexShrink: 0,
    background: ({ active }) => (active ? '#ffffff' : 'transparent'),
    color: ({ active }) => (active ? '#0f172a' : '#64748b'),
    boxShadow: ({ active }) => (active ? '0 1px 2px rgba(15,23,42,0.16)' : 'none'),
    transition: 'background 0.12s ease, color 0.12s ease'
});

export function ZoomControl({ label, value, onChange }: ZoomControlProps) {
    return (
        // role/aria-label announce e.g. "Preview zoom: Fit" semantics per button.
        <ZoomGroup role="group" aria-label={label}>
            {ZOOM_OPTIONS.map((opt) => (
                <ZoomSegment
                    key={String(opt.id)}
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
