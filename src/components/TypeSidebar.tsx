// Left-hand sidebar: the math-type picker. Shows only the sheet types offered
// for the currently selected grade; for grades without content it shows a
// "coming soon" placeholder instead.
import React from 'react';
import { styledComponent } from '@presource/react';
import { MATH_TYPES, type MathTypeId } from '../lib/problems';
import type { GradeConfig } from '../lib/grades';

export type TypeSidebarProps = {
    // The selected grade; its `available` list drives which types are shown.
    grade: GradeConfig;
    // Currently selected math type (must be in grade.available).
    value: MathTypeId;
    onChange: (id: MathTypeId) => void;
};

const Sidebar = styledComponent('div', {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '16px',
    height: '100%',
    boxSizing: 'border-box',
    background: '#f8fafc',
    borderRight: '1px solid #e2e8f0'
});

const SidebarHeading = styledComponent('h2', {
    fontSize: '13px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#64748b',
    margin: '0 0 4px 0'
});

const TypeButton = styledComponent<{ active: boolean }>('button', {
    textAlign: 'left',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '15px',
    background: ({ active }) => (active ? '#2563eb' : '#ffffff'),
    color: ({ active }) => (active ? '#ffffff' : '#334155'),
    fontWeight: ({ active }) => (active ? 600 : 400),
    transition: 'background 0.12s ease, color 0.12s ease'
});

// Shown when a grade has no content implemented yet.
const Notice = styledComponent('div', {
    padding: '12px',
    background: '#eef2ff',
    border: '1px solid #c7d2fe',
    borderRadius: '8px',
    color: '#3730a3',
    fontSize: '14px',
    lineHeight: 1.5
});

export function TypeSidebar({ grade, value, onChange }: TypeSidebarProps) {
    // No content for this grade yet (Year 3 and above) — show a placeholder.
    if (!grade.implemented || grade.available.length === 0) {
        return (
            <Sidebar>
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
        <Sidebar>
            <SidebarHeading>Math Type</SidebarHeading>
            {types.map((t) => (
                <TypeButton key={t.id} active={t.id === value} onClick={() => onChange(t.id)}>
                    {t.label}
                </TypeButton>
            ))}
        </Sidebar>
    );
}