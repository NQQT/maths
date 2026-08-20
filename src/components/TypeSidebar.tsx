// Left-hand sidebar: the math-type picker. Shows only the sheet types offered
// for the currently selected grade; for grades without content it shows a
// "coming soon" placeholder instead.
//
// Design: a white rail of icon+label+count list buttons; the active type gets
// an indigo-tinted fill. On narrow screens (xs) the rail collapses to a
// horizontal chip strip above the canvas so nothing ever overflows the
// viewport vertically.
import React from 'react';
import { styledComponent } from '@presource/react';
import { MATH_TYPES, SHEET_COUNTS, type MathTypeId } from '../lib/problems';
import type { GradeConfig } from '../lib/grades';

export type TypeSidebarProps = {
    // The selected grade; its `available` list drives which types are shown.
    grade: GradeConfig;
    // Currently selected math type (must be in grade.available).
    value: MathTypeId;
    onChange: (id: MathTypeId) => void;
};

// One compact glyph per sheet type, shown in the button's icon chip.
const TYPE_ICONS: Record<MathTypeId, string> = {
    addition: '+',
    subtraction: '−',
    missing: '?',
    comparison: '≟',
    skip: '»',
    word: '¶',
    counting: '#'
};

const Sidebar = styledComponent('div', {
    display: 'flex',
    gap: '6px',
    padding: '16px',
    boxSizing: 'border-box',
    background: '#ffffff',
    overflowY: 'auto',
    // Responsive shape:
    //   xs — full-width strip above the canvas: row direction, wraps, fixed
    //        height auto, scrolls horizontally instead of overflowing.
    //   sm+ — vertical 264px rail for the full viewport height.
    flexDirection: () => ({ xs: 'row', sm: 'column' }),
    flexWrap: () => ({ xs: 'wrap', sm: 'nowrap' }),
    width: () => ({ xs: '100%', sm: '264px' }),
    height: () => ({ xs: 'auto', sm: '100%' }),
    flexShrink: 0,
    overflowX: () => ({ xs: 'auto', sm: 'hidden' }),
    borderRight: () => ({ xs: 'none', sm: '1px solid #e4e9f2' }),
    borderBottom: () => ({ xs: '1px solid #e4e9f2', sm: 'none' })
});

const SidebarHeading = styledComponent('h2', {
    // On xs the heading rides inline above the chip row (width 100% forces the
    // wrap); on sm+ it is the first column item.
    width: () => ({ xs: '100%', sm: 'auto' }),
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#94a3b8',
    margin: '0 0 6px 0',
    flexShrink: 0
});

const TypeButton = styledComponent<{ active: boolean }>('button', {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 10px',
    flexShrink: 0,
    // xs: auto-width chip that can share a wrapped row; sm+ full-width row.
    width: () => ({ xs: 'auto', sm: '100%' }),
    border: ({ active }) => (active ? '1px solid #c7d2fe' : '1px solid transparent'),
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: ({ active }) => (active ? 600 : 500),
    textAlign: 'left',
    whiteSpace: 'nowrap',
    background: ({ active }) => (active ? '#eef2ff' : '#f8fafc'),
    color: ({ active }) => (active ? '#312e81' : '#334155'),
    transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease'
});

const TypeIcon = styledComponent<{ active: boolean }>('span', {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30px',
    height: '30px',
    flexShrink: 0,
    borderRadius: '9px',
    fontSize: '15px',
    userSelect: 'none',
    background: ({ active }) => (active ? '#4f46e5' : '#e0e7ff'),
    color: ({ active }) => (active ? '#ffffff' : '#4f46e5')
});

const TypeLabel = styledComponent('span', {
    flex: '1',
    minWidth: '32px',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
});

// Problems-per-page badge (e.g. "15"); the label tells teachers how many
// questions a full page of this type will carry.
const TypeCount = styledComponent('span', {
    fontSize: '12px',
    color: '#94a3b8',
    background: '#f1f5f9',
    borderRadius: '999px',
    padding: '2px 8px',
    fontWeight: 600,
    flexShrink: 0,
    whiteSpace: 'nowrap'
});

// Shown when a grade has no content implemented yet.
const Notice = styledComponent('div', {
    padding: '14px',
    background: '#f8fafc',
    border: '1px solid #e4e9f2',
    borderRadius: '12px',
    color: '#475569',
    fontSize: '14px',
    lineHeight: 1.5,
    width: () => ({ xs: '100%', sm: 'auto' })
});

export function TypeSidebar({ grade, value, onChange }: TypeSidebarProps) {
    // No content for this grade yet (Year 3 and above) — show a placeholder.
    if (!grade.implemented || grade.available.length === 0) {
        return (
            <Sidebar className="scrollbar-hidden">
                <SidebarHeading>Math Type</SidebarHeading>
                <Notice>
                    <strong>{grade.label}</strong> worksheets are coming soon.
                    <br />
                    Pick Prep, Year 1 or Year 2 to start.
                </Notice>
            </Sidebar>
        );
    }

    // Only list the types this grade actually offers, in catalogue order.
    const types = MATH_TYPES.filter((t) => grade.available.includes(t.id));
    return (
        <Sidebar className="scrollbar-hidden">
            <SidebarHeading>Math Type</SidebarHeading>
            {types.map((t) => (
                // aria-label pins the accessible name to the type label so the
                // icon glyph and problem-count badge don't pollute it.
                <TypeButton
                    key={t.id}
                    active={t.id === value}
                    aria-label={t.label}
                    onClick={() => onChange(t.id)}
                >
                    <TypeIcon active={t.id === value} aria-hidden="true">
                        {TYPE_ICONS[t.id]}
                    </TypeIcon>
                    <TypeLabel>{t.label}</TypeLabel>
                    <TypeCount aria-hidden="true" title="questions per page">
                        {SHEET_COUNTS[t.id]}
                    </TypeCount>
                </TypeButton>
            ))}
        </Sidebar>
    );
}