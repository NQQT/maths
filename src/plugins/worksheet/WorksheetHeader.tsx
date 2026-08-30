// ─────────────────────────────────────────────────────────────────────────────
// Worksheet plugin — HEADER slot component (the grade selector).
//
// Rendered by the dashboard's PluginHeaderHost into the top bar (right side).
// This is the old GradeSelector, converted to read+write the PLUGIN's scoped
// store slice (context.store.gradeId) instead of owning local state — grade
// selection must survive the host unmounting/remounting this component and be
// visible to the plugin's other components (toolbar/page read the same grade).
//
// Responsive: below sm the pill rail wraps; from sm up it is a single
// scrollable row (scrollbar hidden) so the header never grows a second line.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { styledComponent } from '@presource/react';
import { GRADES } from './grades';
import type { PluginRuntimeContext } from '../types';

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

export function WorksheetHeader({ context }: { context: PluginRuntimeContext }) {
    // The plugin's scoped store: gradeId lives here (survives remounts of this
    // component because the slice is owned by the store, not this component).
    const { store } = context;

    return (
        <GradeRow role="radiogroup" aria-label="Grade level" className="scrollbar-hidden">
            {GRADES.map((g) => (
                <GradePill
                    key={g.id}
                    active={g.id === store.gradeId}
                    role="radio"
                    aria-checked={g.id === store.gradeId}
                    title={g.label}
                    onClick={() => {
                        // Direct mutation of the plugin's slice — the shared
                        // store's propsSpy triggers a re-render of every
                        // subscribed component (rail filter, toolbar, page).
                        store.gradeId = g.id;
                    }}
                >
                    {g.short}
                </GradePill>
            ))}
        </GradeRow>
    );
}
