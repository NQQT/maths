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
//
// FILLING THE WHOLE PAGE: SheetRoot is a flex column on a fixed A4 height, so
// `flex: 1` grows this grid to exactly the space left below the title/metaline
// (and above the footer). `gridAutoRows: 1fr` divides that space into EVEN
// rows and `alignItems: center` vertically centres each question in its row —
// so no matter how many problems a worksheet generates, the LAST question row
// always lands at the bottom of the page: there is never a blank band between
// the questions and the page foot (screen preview and print share this layout).
const ProblemGrid = styledComponent<{ single: boolean }>('div', {
    display: 'grid',
    gridTemplateColumns: ({ single }) => (single ? '1fr' : '1fr 1fr'),
    columnGap: '28px',
    rowGap: '16px',
    alignItems: 'center',
    flex: 1,
    minHeight: '0',
    gridAutoRows: '1fr'
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

export function PrintableSheet({ title, subtitle, problems, pageLabel, single, testId }: PrintableSheetProps) {
    return (
        <SheetRoot data-testid={testId}>
            <SheetTitle>{title}</SheetTitle>
            <SheetSubtitle>{subtitle}</SheetSubtitle>
            <MetaLine>
                Name: <Blank big />
                Date: <Blank big />
            </MetaLine>
            <Rule />
            <ProblemGrid single={single ?? false}>
                {problems.map((p) => (
                    <ProblemRow key={p.id}>
                        <ProblemIndex>{p.id}.</ProblemIndex>
                        <ProblemText>
                            <PromptText prompt={p.prompt} />
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
