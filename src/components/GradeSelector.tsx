// Grade-level selector. Lives in the TOP-RIGHT of the header.
// Renders one pill per grade (0..12 = Prep..Year 12); the selected grade is
// highlighted. Switching grade may change which math types are available,
// which the dashboard handles by falling back to a valid type.
//
// Responsive: below the sm breakpoint the pill rail wraps; from sm up it is a
// single scrollable row (scrollbar hidden) so the header never grows a
// second line — which is what previously pushed the app past 100vh.
import React from 'react';
import { styledComponent } from '@presource/react';
import { GRADES } from '../lib/grades';

export type GradeSelectorProps = {
    value: number;
    onChange: (id: number) => void;
};

const GradeRow = styledComponent('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    minWidth: 0,
    // xs: wrap to extra rows on narrow screens; sm+: one row that scrolls.
    flexWrap: () => ({ xs: 'wrap', sm: 'nowrap' }),
    overflowX: () => ({ xs: 'visible', sm: 'auto' })
});

const GradePill = styledComponent<{ active: boolean }>('button', {
    padding: '0 12px',
    height: '32px',
    flexShrink: 0,
    border: ({ active }) => (active ? '1px solid #c7d2fe' : '1px solid #e4e9f2'),
    borderRadius: '999px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: ({ active }) => (active ? 700 : 600),
    lineHeight: 1,
    background: ({ active }) => (active ? '#eef2ff' : '#ffffff'),
    color: ({ active }) => (active ? '#4338ca' : '#475569'),
    boxShadow: ({ active }) => (active ? '0 1px 3px rgba(79,70,229,0.2)' : 'none'),
    transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease'
});

export function GradeSelector({ value, onChange }: GradeSelectorProps) {
    return (
        <GradeRow
            role="radiogroup"
            aria-label="Grade level"
            className="scrollbar-hidden"
        >
            {GRADES.map((g) => (
                <GradePill
                    key={g.id}
                    active={g.id === value}
                    role="radio"
                    aria-checked={g.id === value}
                    title={g.label}
                    onClick={() => onChange(g.id)}
                >
                    {g.short}
                </GradePill>
            ))}
        </GradeRow>
    );
}