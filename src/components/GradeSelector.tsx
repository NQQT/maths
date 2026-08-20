// Grade-level selector. Lives in the TOP-RIGHT corner of the header.
// Renders one pill per grade (0..12 = Prep..Year 12); the selected grade is
// highlighted. Switching grade may change which math types are available, which
// the dashboard handles by falling back to a valid type.
import React from 'react';
import { styledComponent } from '@presource/react';
import { GRADES } from '../lib/grades';

export type GradeSelectorProps = {
    value: number;
    onChange: (id: number) => void;
};

const GradeRow = styledComponent('div', {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    justifyContent: 'flex-end',
    maxWidth: '60vw'
});

const GradePill = styledComponent<{ active: boolean }>('button', {
    padding: '5px 11px',
    border: '1px solid #cbd5e1',
    borderRadius: '999px',
    cursor: 'pointer',
    fontSize: '14px',
    lineHeight: 1,
    background: ({ active }) => (active ? '#2563eb' : '#ffffff'),
    color: ({ active }) => (active ? '#ffffff' : '#334155'),
    fontWeight: ({ active }) => (active ? 700 : 500),
    transition: 'background 0.12s ease, color 0.12s ease'
});

export function GradeSelector({ value, onChange }: GradeSelectorProps) {
    return (
        <GradeRow role="radiogroup" aria-label="Grade level">
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