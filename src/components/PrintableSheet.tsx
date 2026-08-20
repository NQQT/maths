// Printable A4 worksheet. This is the canonical "what gets printed" content.
//
// It is rendered in TWO places with identical props so they always agree:
//   1. Inline, scaled-down preview in the right-hand content window.
//   2. Inside @react/headless `DocumentPrint` (full A4, for printing).
// Because it receives an explicit `testId`, the two renderings can be told apart
// in tests (preview vs print) even though they share markup.
//
// All CSS uses explicit px/mm string values (NOT numbers) on purpose: when a
// value is static or a function in @presource/react's styledComponent, numbers
// are converted to rem, which we do not want for print-accurate spacing.
import React, { Fragment } from 'react';
import { styledComponent } from '@presource/react';
import type { Problem } from '../lib/problems';

export type PrintableSheetProps = {
    // Large heading, e.g. "Year 1 — Addition".
    title: string;
    // Small line under the title, e.g. "Addition within 20".
    subtitle: string;
    // The problems to lay out (single sheet, single math type).
    problems: Problem[];
    // Stable test id for the root element (used to target preview vs print).
    testId?: string;
};

// Page root: white A4 sheet that fills the FullA4Page / preview box.
const SheetRoot = styledComponent('div', {
    width: '100%',
    minHeight: '100%',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box',
    padding: '12mm 12mm 12mm 12mm',
    fontFamily: 'system-ui, "Segoe UI", Arial, sans-serif',
    color: '#1a1a1a',
    display: 'flex',
    flexDirection: 'column'
});

const SheetTitle = styledComponent('h1', {
    fontSize: '30px',
    fontWeight: 700,
    margin: '0 0 4px 0',
    lineHeight: 1.1
});

const SheetSubtitle = styledComponent('p', {
    fontSize: '15px',
    margin: '0 0 14px 0',
    color: '#4b5563'
});

// Name / Date line a teacher's class would fill in.
const MetaLine = styledComponent('p', {
    fontSize: '16px',
    margin: '0 0 12px 0',
    color: '#374151'
});

const Rule = styledComponent('hr', {
    border: 'none',
    borderTop: '2px solid #1a1a1a',
    margin: '0 0 16px 0'
});

// Two-column grid for compact sheets; single column for long word problems.
// `single` is a custom prop read by the function value for gridTemplateColumns.
const ProblemGrid = styledComponent<{ single: boolean }>('div', {
    display: 'grid',
    gridTemplateColumns: ({ single }) => (single ? '1fr' : '1fr 1fr'),
    columnGap: '28px',
    rowGap: '16px',
    alignItems: 'start'
});

const ProblemRow = styledComponent('div', {
    display: 'flex',
    gap: '10px',
    fontSize: '22px',
    lineHeight: 1.5
});

// Question number, right-aligned in a narrow column.
const ProblemIndex = styledComponent('span', {
    color: '#9ca3af',
    minWidth: '26px',
    textAlign: 'right',
    fontSize: '15px',
    paddingTop: '3px'
});

const ProblemText = styledComponent('span', {
    whiteSpace: 'pre-wrap'
});

// A fill-in blank. Big blanks (name/date) are wider; question blanks are short.
const Blank = styledComponent<{ big?: boolean }>('span', {
    display: 'inline-block',
    minWidth: ({ big }) => (big ? '140px' : '38px'),
    borderBottom: '2px solid #1a1a1a',
    height: '0.8em',
    verticalAlign: 'baseline',
    margin: '0 5px'
});

// Splits a prompt on "__" and renders each blank as a styled fill-in line, so
// the printed sheet shows real blanks instead of literal underscores.
function PromptText({ prompt }: { prompt: string }) {
    const parts = prompt.split('__');
    return (
        <>
            {parts.map((part, i) => (
                <Fragment key={i}>
                    {part}
                    {i < parts.length - 1 && <Blank />}
                </Fragment>
            ))}
        </>
    );
}

export function PrintableSheet({ title, subtitle, problems, testId }: PrintableSheetProps) {
    // Word problems are single-line prose and read better in one column; every
    // other type fits neatly in two columns. All problems in a sheet share one
    // type, so the first problem tells us which layout to use.
    const single = problems.length > 0 && problems[0].type === 'word';

    return (
        <SheetRoot data-testid={testId}>
            <SheetTitle>{title}</SheetTitle>
            <SheetSubtitle>{subtitle}</SheetSubtitle>
            <MetaLine>
                Name: <Blank big />
                Date: <Blank big />
            </MetaLine>
            <Rule />
            <ProblemGrid single={single}>
                {problems.map((p) => (
                    <ProblemRow key={p.id}>
                        <ProblemIndex>{p.id}.</ProblemIndex>
                        <ProblemText>
                            <PromptText prompt={p.prompt} />
                        </ProblemText>
                    </ProblemRow>
                ))}
            </ProblemGrid>
        </SheetRoot>
    );
}