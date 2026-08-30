// ─────────────────────────────────────────────────────────────────────────────
// Grade selector — a FRAMEWORK header component (like the app title).
//
// The grade is DASHBOARD configuration, shared by every worksheet plugin:
// switching the grade re-gates every plugin's rail entry and re-caps every
// plugin's generator. The selector reads/writes the shared session state
// (store.session.gradeId), so all subscribed framework components and plugin
// surfaces update synchronously.
//
// Responsive: below sm the pill rail wraps; from sm up it is a single
// scrollable row (scrollbar hidden) so the header never grows a second line.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { styledComponent } from '@presource/react';
import { GRADES } from './grades';
import { useDashboardStore } from './store';

// Pill rail: xs wraps to extra rows; sm+ one row that scrolls.
const GradeRow = styledComponent('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    minWidth: 0,
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

export function GradeSelector() {
    // The framework's shared session state — gradeId lives here (survives
    // remounts of this component because the session is owned by the store).
    const store = useDashboardStore();

    return (
        <GradeRow role="radiogroup" aria-label="Grade level" className="scrollbar-hidden">
            {GRADES.map((g) => (
                <GradePill
                    key={g.id}
                    active={g.id === store.session.gradeId}
                    role="radio"
                    aria-checked={g.id === store.session.gradeId}
                    title={g.label}
                    onClick={() => {
                        // Direct mutation of the framework's session — the
                        // reactive store triggers a re-render of every
                        // subscribed component (rail gating, toolbar, page).
                        store.session.gradeId = g.id;
                    }}
                >
                    {g.short}
                </GradePill>
            ))}
        </GradeRow>
    );
}
