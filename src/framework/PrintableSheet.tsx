// Printable A4 worksheet page (framework layout component). This is the
// canonical "what gets printed" content.
//
// It is rendered in TWO on-screen-identical places plus the hidden print
// tree:
//   1. Inline, scaled-down preview in the right-hand canvas (PageStack) —
//      this view doubles as the print preview (toolbar Print goes straight
//      to the browser-native dialog).
//   2. Inside the screen-hidden `.print-doc` tree that window.print()
//      actually prints (one <PrintableSheet> per A4 page, see worksheet-kit),
//      which is what makes the native dialog list every page (a 5-page
//      document => 5 pages in the dialog).
//
// The component receives one page's `problems` (problem ids are numbered
// across the whole document, so a 2-page sheet continues 1..30). When the
// document has more than one page, `pageLabel` (e.g. "Page 2 of 3") is shown
// in a small footer — both on screen (as the page badge) and in print.
//
// All CSS uses explicit px/mm STRING values (not numbers) on purpose: when a
// value is static or a function in @presource/react's styledComponent, numbers
// are converted to rem, which we do not want for print-accurate spacing.
import React, { Fragment } from 'react';
import { styledComponent } from '@presource/react';
import type { Problem } from './document';
import type { ClockFigure } from './types';
import { RowsColumnsDiagram } from './RowsColumnsDiagram';
import { ShapeTransformationDiagram } from './ShapeTransformationDiagram';
// Family figure renderers (framework/*.tsx): each draws ONLY the problem's
// attached figure data — private answers never enter any SVG.
import { BondDiagram } from './BondDiagram';
import { ColumnDiagram } from './ColumnDiagram';
import { CompassDiagram } from './CompassDiagram';
import { DataDiagram } from './DataDiagram';
import { DivisionDiagram } from './DivisionDiagram';
import { MoneyDiagram } from './MoneyDiagram';
import { ShapeFigures } from './ShapeFigure';

export type PrintableSheetProps = {
    // Large heading, e.g. "Year 1 — Addition".
    title: string;
    // Small line under the title, e.g. "Addition — within 20".
    subtitle: string;
    // The problems to lay out on THIS page (one page of one worksheet).
    problems: Problem[];
    // Optional footer label — set to "Page i of n" for multi-page documents so
    // printed pages can be ordered physically. Omitted for single-page sheets.
    pageLabel?: string;
    // Prose-style sheets (word problems etc.) render in a SINGLE column so
    // every sentence has the full page width. Default: two-column grid.
    single?: boolean;
    // Stable test id for the root element.
    testId?: string;
};

// Page root: white sheet that fills its A4 frame (794×1123px on screen,
// 210×297mm in the print tree). Flex column so the footer pins to the page
// bottom regardless of how much problem content is above it.
const SheetRoot = styledComponent('div', {
    width: '100%',
    height: '100%',
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
    lineHeight: 1.1,
    letterSpacing: '-0.01em'
});

const SheetSubtitle = styledComponent('p', {
    fontSize: '15px',
    margin: '0',
    color: '#4b5563'
});

// Header row: title + subtitle on the LEFT, the Name/Date fill-ins pinned to
// the TOP RIGHT (moved off their own left-aligned line under the subtitle).
const HeaderRow = styledComponent('div', {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '24px',
    margin: '0 0 14px 0'
});

// Left half of the header row: the sheet heading stack.
const HeaderId = styledComponent('div', {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: 0
});

// Right half of the header row: Name / Date stacked and right-aligned so a
// teacher's class can fill them in at the top corner of the sheet.
const MetaStack = styledComponent('div', {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '10px',
    flexShrink: 0,
    fontSize: '16px',
    color: '#374151',
    paddingTop: '2px'
});

const Rule = styledComponent('hr', {
    border: 'none',
    borderTop: '2px solid #1a1a1a',
    margin: '0 0 16px 0'
});

// Two-column grid for compact sheets; single column for long word problems.
// `single` is a custom prop read by the function value for gridTemplateColumns.
//
// FILLING THE WHOLE PAGE: SheetRoot is a flex column on a fixed A4 height, so
// `flex: 1` grows this grid to exactly the space left below the title/metaline
// (and above the footer). `gridAutoRows: 1fr` divides that space into EVEN
// rows and `alignItems: center` vertically centres each question in its row —
// so no matter how many problems a worksheet generates, the LAST question row
// always lands at the bottom of the page: there is never a blank band between
// the questions and the page foot (screen preview and print share this layout).
//
// DEEPER-TASK SPACING (R3, retuned T3M3): the gaps are sized for the roomy
// 4..8-per-page densities the illustrated sheets target — at the tightest
// single-column 4/page each row is 210.5px, and the 32/24px gutters keep
// figures (max ~114px tall) and their prompts visually separated without
// pushing the last row off the sheet. plugins/layout-capacity.test.ts pins
// the worst-row-vs-row-height contract for every spec.
const ProblemGrid = styledComponent<{ single: boolean }>('div', {
    display: 'grid',
    gridTemplateColumns: ({ single }) => (single ? '1fr' : '1fr 1fr'),
    columnGap: '32px',
    rowGap: '24px',
    alignItems: 'center',
    flex: 1,
    minHeight: '0',
    gridAutoRows: '1fr'
});

const ProblemRow = styledComponent('div', {
    display: 'flex',
    gap: '12px',
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

// Illustrated worksheets (ShapeTransformationsWorksheet's six shape rows,
// RowsColumnsWorksheet's six grid rows, and the family figures below — data /
// shapes / bonds / compass / money / division / column) need compact prose and
// the full remaining row width (types.ts figure types). A problem carrying ANY
// figure switches the text column to that compact layout. Undefined overrides
// preserve the inherited font/layout of existing text and clocks; strings also
// avoid styledComponent converting unitless values into rem.
const ProblemText = styledComponent<{ illustrated: boolean }>('span', {
    whiteSpace: 'pre-wrap',
    fontSize: ({ illustrated }) => (illustrated ? '16px' : undefined),
    lineHeight: ({ illustrated }) => (illustrated ? '1.35' : undefined),
    display: ({ illustrated }) => (illustrated ? 'block' : undefined),
    minWidth: ({ illustrated }) => (illustrated ? '0px' : undefined),
    flex: ({ illustrated }) => (illustrated ? '1' : undefined)
});

// Full-width fill-in line printed BELOW a prompt flagged `answerLine` — the
// student writes the answer on its own line (e.g. "7:45 is the same time in
// words:" with the writing space underneath), not squeezed inline. Extra
// height above the rule leaves real pen-on-paper room: 1.5em of clear space
// under the baseline is a full handwritten word/phrase for a young learner.
const AnswerLine = styledComponent('span', {
    display: 'block',
    height: '1.5em',
    marginTop: '14px',
    borderBottom: '2.5px solid #1a1a1a'
});

// A fill-in blank. Big blanks (name/date lines, and problems flagged
// `wideBlanks` — e.g. handwritten "quarter past 11" answers) are wide;
// default question blanks fit a written digit/word, and the heavier rule
// keeps the line visible once a pencil has been dragged across it.
const Blank = styledComponent<{ big?: boolean }>('span', {
    display: 'inline-block',
    minWidth: ({ big }) => (big ? '160px' : '56px'),
    borderBottom: '2.5px solid #1a1a1a',
    height: '0.9em',
    verticalAlign: 'baseline',
    margin: '0 5px'
});

// Footer shown only for multi-page documents: brand line on the left,
// "Page i of n" on the right, pinned to the page bottom.
const SheetFooter = styledComponent('div', {
    marginTop: 'auto',
    paddingTop: '14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: '16px'
});

const FooterText = styledComponent('span', {
    fontSize: '11px',
    color: '#9ca3af'
});

// ── Analog clock figure (optional problem.clock) ─────────────────────────────
// When a problem carries a `clock` figure (types.ts ClockFigure) an SVG analog
// clock is printed before the prompt text: hands drawn for reading items, a
// BLANK face for "draw the hands" items. Pure geometry — hand angles are
// measured clockwise from 12 o'clock, so a hand tip sits at
// (cx + r·sin θ, cy − r·cos θ) with θ = (fraction of the dial) × 360°.
//
// SIZE (R2): 120px — a draw-the-hands face must be big enough for a child to
// rule two hands and still read the numerals; the 64-unit viewBox keeps every
// stroke/numeral resolution-independent (the rim stroke renders ~3.8px here).
// The hour hand's 3.5-unit stroke is a pinned contract (plugins.test.tsx
// distinguishes drawn vs blank faces by it) — do not renumber it.
const ClockBox = styledComponent('span', {
    display: 'inline-block',
    width: '120px',
    height: '120px',
    flexShrink: 0,
    alignSelf: 'center'
});

function ClockFace({ clock }: { clock: ClockFigure }) {
    // 64-unit viewBox scaled up to a 120px box: all geometry below is defined
    // in the 64-unit space (centre 32) and scales with the svg size, keeping
    // the numbers, ticks and hands crisp at any print size.
    const c = 32;
    const SIZE = 120;
    const showHands = clock.hands !== false;
    // Hour hand moves 30° per hour PLUS 0.5° per minute (so a half-past hand
    // points halfway between two numbers); minute hand moves 6° per minute.
    const hourDeg = (clock.hour % 12) * 30 + clock.minute * 0.5;
    const minuteDeg = clock.minute * 6;
    // Endpoint of a hand/tick `len` px from the centre at `deg` from 12.
    const point = (deg: number, len: number) => {
        const rad = (deg * Math.PI) / 180;
        return { x: c + len * Math.sin(rad), y: c - len * Math.cos(rad) };
    };
    return (
        <ClockBox>
            <svg
                width={SIZE}
                height={SIZE}
                viewBox="0 0 64 64"
                role="img"
                aria-label={
                    showHands
                        ? `clock showing ${clock.hour}:${String(clock.minute).padStart(2, '0')}`
                        : 'blank clock face'
                }
            >
                {/* Rim */}
                <circle cx={c} cy={c} r="30" fill="#ffffff" stroke="#1a1a1a" strokeWidth="2" />
                {/* Hour ticks: 12 short marks on the rim */}
                {[...Array(12)].map((_, i) => {
                    const a = point(i * 30, 28);
                    const b = point(i * 30, 25);
                    return (
                        <line
                            key={`tick-${i}`}
                            x1={a.x}
                            y1={a.y}
                            x2={b.x}
                            y2={b.y}
                            stroke="#1a1a1a"
                            strokeWidth="1.5"
                        />
                    );
                })}
                {/* Hour numbers 1-12 on an inner ring */}
                {[...Array(12)].map((_, i) => {
                    const n = i + 1;
                    const p = point(n * 30, 20);
                    return (
                        <text
                            key={`num-${n}`}
                            x={p.x}
                            y={p.y}
                            fontSize="9"
                            fontWeight="700"
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#1a1a1a"
                        >
                            {n}
                        </text>
                    );
                })}
                {/* Hands + centre pin — omitted entirely on blank (draw-it)
                    faces so the student draws both hands themselves. */}
                {showHands && (
                    <>
                        <line
                            x1={c}
                            y1={c}
                            x2={point(hourDeg, 13).x}
                            y2={point(hourDeg, 13).y}
                            stroke="#1a1a1a"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                        />
                        <line
                            x1={c}
                            y1={c}
                            x2={point(minuteDeg, 22).x}
                            y2={point(minuteDeg, 22).y}
                            stroke="#1a1a1a"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        />
                        <circle cx={c} cy={c} r="2" fill="#1a1a1a" />
                    </>
                )}
            </svg>
        </ClockBox>
    );
}

// Splits a prompt on "__" and renders each blank as a styled fill-in line, so
// the printed sheet shows real blanks instead of literal underscores. Problems
// flagged `wideBlanks` (handwritten answers too long for the short line — e.g.
// the clock sheets' "quarter past 11") get the wide name/date-sized blanks.
function PromptText({ prompt, wide }: { prompt: string; wide: boolean }) {
    const parts = prompt.split('__');
    return (
        <>
            {parts.map((part, i) => (
                <Fragment key={i}>
                    {part}
                    {i < parts.length - 1 && <Blank big={wide} />}
                </Fragment>
            ))}
        </>
    );
}

// A problem is "illustrated" when it carries ANY figure (the compact block
// typography + full row width in ProblemText). All figure fields are
// renderer-owned data — their presence, not their content, drives layout.
function hasFigure(problem: Problem): boolean {
    return (
        problem.shapeTransformation !== undefined ||
        problem.rowsColumns !== undefined ||
        problem.data !== undefined ||
        problem.shapes !== undefined ||
        problem.bond !== undefined ||
        problem.compass !== undefined ||
        problem.money !== undefined ||
        problem.division !== undefined ||
        problem.column !== undefined
    );
}

export function PrintableSheet({ title, subtitle, problems, pageLabel, single, testId }: PrintableSheetProps) {
    return (
        <SheetRoot data-testid={testId}>
            {/* Header: title/subtitle left, Name/Date top right. */}
            <HeaderRow>
                <HeaderId>
                    <SheetTitle>{title}</SheetTitle>
                    <SheetSubtitle>{subtitle}</SheetSubtitle>
                </HeaderId>
                <MetaStack>
                    <div>
                        Name: <Blank big />
                    </div>
                    <div>
                        Date: <Blank big />
                    </div>
                </MetaStack>
            </HeaderRow>
            <Rule />
            <ProblemGrid single={single ?? false}>
                {problems.map((p) => (
                    <ProblemRow key={p.id}>
                        <ProblemIndex>{p.id}.</ProblemIndex>
                        {/* Optional analog-clock figure printed before the
                            question text (reading / draw-the-hands items). */}
                        {p.clock && <ClockFace clock={p.clock} />}
                        <ProblemText illustrated={hasFigure(p)}>
                            <PromptText prompt={p.prompt} wide={p.wideBlanks ?? false} />
                            {/* Shape figures follow the prompt and its inline
                                letter blank; answers stay in problem data. */}
                            {p.shapeTransformation && <ShapeTransformationDiagram figure={p.shapeTransformation} />}
                            {/* Rows/columns grids follow the prompt text the
                                same way; the renderer draws dimensions only
                                and never prints an answer. */}
                            {p.rowsColumns && <RowsColumnsDiagram figure={p.rowsColumns} />}
                            {/* The family figures follow the prompt in a fixed
                                order; each renderer draws ONLY the attached
                                figure data (private answers stay out of DOM). */}
                            {p.data && <DataDiagram figure={p.data} />}
                            {p.shapes && <ShapeFigures shapes={p.shapes} />}
                            {p.bond && <BondDiagram figure={p.bond} />}
                            {p.compass && <CompassDiagram figure={p.compass} />}
                            {p.money && <MoneyDiagram figure={p.money} />}
                            {p.division && <DivisionDiagram figure={p.division} />}
                            {p.column && <ColumnDiagram figure={p.column} />}
                            {/* Bottom writing space for answerLine prompts
                                (their prompts carry no inline "__" blanks). */}
                            {p.answerLine && <AnswerLine />}
                        </ProblemText>
                    </ProblemRow>
                ))}
            </ProblemGrid>
            {/* Multi-page documents get a page-position footer in print so a
                class set of copies can be reordered physically. */}
            {pageLabel && (
                <SheetFooter>
                    <FooterText>Maths Sheets</FooterText>
                    <FooterText>{pageLabel}</FooterText>
                </SheetFooter>
            )}
        </SheetRoot>
    );
}
