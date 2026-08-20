// The maths worksheet dashboard. Composition (top-to-bottom, left-to-right):
//
//   +------------------------------------------------------------------+
//   | (∑) Maths Sheets                       [P][1][2]…[12] (top-right)|
//   +----------------+-------------------------------------------------+
//   |  MATH TYPE     |  toolbar card: title/subtitle · Pages [− n +]   |
//   |  (left rail)   |               ...  [Randomize] [Print]        |
//   |  - Addition    |  dot-grid canvas: zoomable stack of A4 pages    |
//   |  - Subtraction |  (fit/50/75/100%, one page per A4 sheet)        |
//   |  - …           |  [+ Fit 50% 75% 100%] (floating, bottom-right)  |
//   +----------------+-------------------------------------------------+
//
// PRINTING: the normal content view (A4 page stack + toolbar with the Pages
// stepper) IS the print preview — there is no separate in-app review screen.
// The toolbar "Print" button fires the browser's NATIVE print dialog
// immediately via a plain window.print():
//   1. Under @media print (app.css) the app shell is un-clipped
//      (height:100% + overflow:hidden relaxed) and hidden, and the
//      screen-hidden .print-doc tree is revealed — one exact A4 block per
//      worksheet page, each breaking onto its own physical sheet. A 5-page
//      worksheet therefore shows as (and prints as) 5 pages in the native
//      dialog (the shell un-clipping is what makes the browser paginate all
//      of them instead of one).
//   2. While the dialog is open the document title is set to the worksheet
//      title (e.g. "Year 1 — Addition") so a PDF saved from it gets a
//      meaningful file name; the previous title is restored afterwards.
//
// Multi-page worksheets: the document (grade, type, seed, page count) is
// generated ONCE per selection via generateDocument and the same page list
// feeds both the preview stack and the hidden print tree — so the two always
// agree. The page count is an unbounded stepper (− n +): there is no fixed
// toggle limit, teachers can generate as many A4 sheets as they like.
// "Randomize" re-rolls the seed and regenerates every page in place.
import React, { useMemo } from 'react';
import { useStateHook, styledComponent } from '@presource/react';
import { getGradeConfig } from '../lib/grades';
import { generateDocument, MATH_TYPES, scopeLabel, type MathTypeId } from '../lib/problems';
import { seedFrom } from '../lib/rng';
import { GradeSelector } from './GradeSelector';
import { TypeSidebar } from './TypeSidebar';
import { PageStack, type PageSpec } from './PageStack';
import { ZoomControl } from './ZoomControl';
import { PrintableSheet } from './PrintableSheet';
import type { ZoomMode } from './page-scale';

// Minimum page count; there is intentionally NO maximum — the stepper can be
// incremented as far as the user wants ("infinite" page generation).
const MIN_PAGES = 1;

// ──────────────────────────────────────────────────────────────
// App shell
// ──────────────────────────────────────────────────────────────

// Full-viewport app root. 100% of body (body is the height:100% + dvh +
// overflow:hidden chain from app.css) — never 100vw/100vh, so the layout can
// not outgrow the viewport in either axis. The `app-root` class exists so the
// @media print rules in app.css can un-clip (height/overflow) exactly this
// box when printing multi-page documents.
const AppRoot = styledComponent('div', {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    background: '#f4f6fb',
    color: '#0f172a'
});

// White top bar: brand mark + title on the left, grade rail on the right.
// sm+: fixed 64px (flex-shrink:0) so the body below gets the exact remainder
// of the viewport. xs: auto height so the wrapping grade rail can never
// overflow the bar (the rail scrolls on sm+ instead of wrapping).
const HeaderBar = styledComponent('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    height: () => ({ xs: 'auto', sm: '64px' }),
    padding: () => ({ xs: '10px 20px', sm: '0 20px' }),
    flexShrink: 0,
    boxSizing: 'border-box',
    background: '#ffffff',
    borderBottom: '1px solid #e4e9f2'
});

const BrandMark = styledComponent('div', {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '34px',
    height: '34px',
    flexShrink: 0,
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    color: '#ffffff',
    fontSize: '18px',
    fontWeight: 700,
    userSelect: 'none'
});

const AppTitle = styledComponent('h1', {
    fontSize: '17px',
    fontWeight: 800,
    margin: 0,
    color: '#0f172a',
    whiteSpace: 'nowrap',
    letterSpacing: '-0.01em'
});

const HeaderSpacer = styledComponent('div', {
    flex: 1,
    minWidth: 0
});

// Body: math-type rail (left) + main column (right). Stacks vertically on xs
// (rail becomes a chip strip above the canvas); row layout from sm up.
const Body = styledComponent('div', {
    display: 'flex',
    flexDirection: () => ({ xs: 'column', sm: 'row' }),
    flex: 1,
    minHeight: 0,
    minWidth: 0
});

// Right-hand column: toolbar card, then the canvas that fills the rest.
const Main = styledComponent('div', {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px',
    boxSizing: 'border-box',
    flex: 1,
    minHeight: 0,
    minWidth: 0
});

// ──────────────────────────────────────────────────────────────
// Toolbar
// ──────────────────────────────────────────────────────────────

const ToolbarCard = styledComponent('div', {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
    padding: '10px 14px',
    flexShrink: 0,
    boxSizing: 'border-box',
    background: '#ffffff',
    border: '1px solid #e4e9f2',
    borderRadius: '12px',
    boxShadow: '0 1px 2px rgba(15,23,42,0.04)'
});

const ToolbarId = styledComponent('div', {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0
});

const ToolbarTitle = styledComponent('div', {
    fontSize: '15px',
    fontWeight: 700,
    color: '#0f172a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
});

const ToolbarSub = styledComponent('div', {
    fontSize: '12px',
    color: '#64748b',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
});

const ToolbarControls = styledComponent('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap'
});

const PagesLabel = styledComponent('span', {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: '#94a3b8'
});

// − / + stepper: the page count is a NUMBER that increments (no fixed 1..N
// toggle set, no upper cap — see MIN_PAGES). Same visual language as
// ZoomControl: a pill holding the two arrows and the value between them.
const PageStepper = styledComponent('div', {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    padding: '3px',
    borderRadius: '10px',
    background: '#eef1f7',
    border: '1px solid #e4e9f2',
    flexShrink: 0
});

// `dimmed` is a styledComponent custom prop (HTMLAttributes has no `disabled`),
// mirrored onto aria-disabled + a guarded onClick below.
const PageStepButton = styledComponent<{ dimmed: boolean; atMin: boolean }>('button', {
    width: '28px',
    height: '28px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 700,
    lineHeight: 1,
    flexShrink: 0,
    cursor: ({ dimmed, atMin }) => (dimmed || atMin ? 'default' : 'pointer'),
    background: 'transparent',
    color: ({ dimmed }) => (dimmed ? '#cbd5e1' : '#334155'),
    opacity: ({ dimmed, atMin }) => (dimmed || atMin ? 0.5 : 1)
});

// The page count, editable by typing. `type="number"` gives native spinners +
// validation; the handler below parses the value back into state.
//
// styledComponent's typed surface is HTMLAttributes<HTMLElement>, which has no
// `type`/input-event props, so (per the TwoColumnDashboard pattern in
// @react/headless) we cast to the InputHTMLAttributes surface for this element.
const PageInput = styledComponent('input', {
    width: '48px',
    height: '28px',
    border: 'none',
    borderRadius: '8px',
    background: '#ffffff',
    color: '#0f172a',
    fontSize: '13px',
    fontWeight: 700,
    textAlign: 'center',
    boxSizing: 'border-box',
    padding: '0 4px',
    outline: 'none',
    boxShadow: '0 1px 2px rgba(15,23,42,0.12)'
}) as unknown as React.ForwardRefExoticComponent<
    React.InputHTMLAttributes<HTMLInputElement> & {
        theme?: any;
        [breakpoint: string]: any;
    }
>;

const GhostButton = styledComponent<{ dimmed: boolean }>('button', {
    padding: '7px 14px',
    borderRadius: '9px',
    border: '1px solid #e4e9f2',
    background: '#ffffff',
    color: '#334155',
    fontSize: '13px',
    fontWeight: 600,
    cursor: ({ dimmed }) => (dimmed ? 'default' : 'pointer'),
    flexShrink: 0,
    opacity: ({ dimmed }) => (dimmed ? 0.55 : 1),
    transition: 'background 0.12s ease, border-color 0.12s ease'
});

const PrimaryButton = styledComponent<{ dimmed: boolean }>('button', {
    padding: '7px 18px',
    borderRadius: '9px',
    border: 'none',
    background: '#4f46e5',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 700,
    cursor: ({ dimmed }) => (dimmed ? 'default' : 'pointer'),
    flexShrink: 0,
    boxShadow: ({ dimmed }) => (dimmed ? 'none' : '0 2px 8px rgba(79,70,229,0.35)'),
    opacity: ({ dimmed }) => (dimmed ? 0.55 : 1)
});

// ──────────────────────────────────────────────────────────────
// Canvas (preview) 
// ──────────────────────────────────────────────────────────────

// Position-relative wrapper so the floating zoom dock pins to the canvas even
// while the page stack scrolls. The stack itself (PageStack) fills it.
const Canvas = styledComponent('div', {
    position: 'relative',
    display: 'flex',
    flex: 1,
    minHeight: 0,
    borderRadius: '12px',
    border: '1px solid #e4e9f2',
    overflow: 'hidden',
    background: '#eef1f7'
});

const ZoomDock = styledComponent('div', {
    position: 'absolute',
    right: '14px',
    bottom: '14px',
    zIndex: 5
});

const EmptyState = styledComponent('div', {
    position: 'relative',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    boxSizing: 'border-box'
});

const EmptyCard = styledComponent('div', {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '32px 40px',
    background: '#ffffff',
    border: '1px solid #e4e9f2',
    borderRadius: '16px',
    boxShadow: '0 4px 16px rgba(15,23,42,0.06)',
    textAlign: 'center'
});

const EmptyIcon = styledComponent('div', {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    background: '#eef2ff',
    color: '#4f46e5',
    fontSize: '24px',
    marginBottom: '6px'
});

const EmptyTitle = styledComponent('div', {
    fontSize: '16px',
    fontWeight: 700,
    color: '#0f172a'
});

const EmptyHint = styledComponent('div', {
    fontSize: '13px',
    color: '#64748b'
});

// Resolve the human label for a math type id (falls back to the id itself).
function labelFor(type: MathTypeId): string {
    return MATH_TYPES.find((t) => t.id === type)?.label ?? type;
}

export function MathsDashboard() {
    // Accessor-state per the @presource/react state-hook contract:
    // read with `x()`, write with `x(value)`.
    const gradeId = useStateHook(1); // start on the target grade (Year 1)
    const typeId = useStateHook<MathTypeId>('addition');
    const pageCount = useStateHook(1); // A4 sheets to generate (>= MIN_PAGES, unbounded)
    const zoom = useStateHook<ZoomMode>('fit'); // preview zoom (preview IS the print preview)
    const refresh = useStateHook(0); // bump = "Randomize" => new seed

    const grade = getGradeConfig(gradeId());
    // If the previously selected type isn't offered by the new grade, fall back
    // to the first offered type so no invalid selection can linger.
    const activeType: MathTypeId = grade.available.includes(typeId())
        ? typeId()
        : (grade.available[0] ?? 'addition');

    // Stable seed from the current selection + refresh counter. Deterministic,
    // so the same inputs always yield the same document.
    const seed = seedFrom([grade.id, activeType, refresh()]);

    // Generate the document (ALL pages) exactly once per selection and reuse
    // the same page list for the preview stack and the hidden print tree.
    // Empty document => "not implemented", rendered as a
    // placeholder in the canvas.
    const sheet = useMemo(
        () => generateDocument(grade, activeType, seed, pageCount()),
        [grade, activeType, seed, pageCount()]
    );

    // Page list annotated with "Page i of n" labels (multi-page only). One
    // PageSpec object is consumed by every rendering surface.
    const total = sheet.pages.length;
    const pageSpecs: PageSpec[] = sheet.pages.map((problems, i) => ({
        problems,
        pageLabel: total > 1 ? `Page ${i + 1} of ${total}` : undefined
    }));

    const hasProblems = total > 0;

    const title = `${grade.label} — ${labelFor(activeType)}`;
    const subtitle = `${labelFor(activeType)} — ${scopeLabel(grade, activeType)}`;

    // "Randomize": re-roll the seed. The document is regenerated IN PLACE —
    // the page count is preserved, so it can randomly become as many pages as
    // the stepper currently says (1..n), not "one new sheet".
    const randomize = () => refresh(refresh() + 1);

    // Print: open the browser-NATIVE print dialog immediately from the normal
    // content view (the preview stack is the print preview — no in-app review
    // screen in between). The hidden .print-doc tree is what the browser
    // paginates: one A4 block per page, so a 5-page document is 5 pages in
    // the dialog (see the @media print rules in app.css). While the dialog is
    // open the tab is retitled to the worksheet title, so a PDF saved from it
    // is named after the sheet; window.print() blocks until the dialog
    // closes, which is when the previous title is restored.
    const doPrint = () => {
        if (!hasProblems) return;
        const previous = document.title;
        document.title = title;
        window.print(); // native print dialog
        document.title = previous;
    };

    // Stepper handlers: decrement never drops below MIN_PAGES; increment has
    // no upper bound, so the page count can keep growing.
    const decreasePages = () => {
        if (hasProblems) pageCount(Math.max(MIN_PAGES, pageCount() - 1));
    };
    const increasePages = () => {
        if (hasProblems) pageCount(pageCount() + 1);
    };
    // Typing a new page count: empty input is tolerated (cleared while
    // editing) and invalid text snaps back to MIN_PAGES on the next change.
    const onPagesInput = (raw: string) => {
        if (!hasProblems) return;
        if (raw === '') return;
        const n = Number.parseInt(raw, 10);
        if (!Number.isNaN(n)) pageCount(Math.max(MIN_PAGES, n));
        else pageCount(MIN_PAGES);
    };
    // If the field was left empty / invalid on blur, normalise to MIN_PAGES.
    const onPagesBlur = () => {
        if (hasProblems && pageCount() < MIN_PAGES) pageCount(MIN_PAGES);
    };

    return (
        <AppRoot className="app-root">
            {/* Everything inside .app-chrome is hidden when printing — the
                @media print rules in app.css swap it for .print-doc. */}
            <div className="app-chrome">
                <HeaderBar>
                    <BrandMark aria-hidden="true">∑</BrandMark>
                    <AppTitle>Maths Sheets</AppTitle>
                    <HeaderSpacer />
                    <GradeSelector
                        value={gradeId()}
                        onChange={(id) => {
                            gradeId(id);
                        }}
                    />
                </HeaderBar>

                <Body>
                    <TypeSidebar grade={grade} value={activeType} onChange={(id) => typeId(id)} />

                    <Main>
                        {/* Toolbar: title + page-count picker + actions. */}
                        <ToolbarCard>
                            <ToolbarId>
                                {/* data-testid lets tests target the toolbar title specifically, since the
                                    same title string also appears on every A4 preview. */}
                                <ToolbarTitle data-testid="toolbar-title">{title}</ToolbarTitle>
                                {hasProblems && <ToolbarSub>{subtitle}</ToolbarSub>}
                            </ToolbarId>
                            <ToolbarControls>
                                <PagesLabel>Pages</PagesLabel>
                                {/* Unbounded −/n/+ stepper: page count is a number that
                                    increments, not a fixed set of toggle options. */}
                                <PageStepper role="group" aria-label="Number of pages" data-testid="page-stepper">
                                    <PageStepButton
                                        aria-label="Decrease pages"
                                        dimmed={!hasProblems}
                                        atMin={pageCount() <= MIN_PAGES}
                                        aria-disabled={!hasProblems || pageCount() <= MIN_PAGES || undefined}
                                        onClick={decreasePages}
                                    >
                                        &minus;
                                    </PageStepButton>
                                    <PageInput
                                        type="number"
                                        min={MIN_PAGES}
                                        value={pageCount()}
                                        aria-label="Page count"
                                        data-testid="page-count"
                                        onChange={(e) => onPagesInput(e.target.value)}
                                        onBlur={onPagesBlur}
                                    />
                                    <PageStepButton
                                        aria-label="Increase pages"
                                        dimmed={!hasProblems}
                                        atMin={false}
                                        aria-disabled={!hasProblems || undefined}
                                        onClick={increasePages}
                                    >
                                        +
                                    </PageStepButton>
                                </PageStepper>
                                <GhostButton
                                    dimmed={!hasProblems}
                                    aria-disabled={!hasProblems || undefined}
                                    data-testid="toolbar-randomize"
                                    onClick={() => {
                                        if (hasProblems) randomize();
                                    }}
                                >
                                    Randomize
                                </GhostButton>
                                <PrimaryButton
                                    dimmed={!hasProblems}
                                    aria-disabled={!hasProblems || undefined}
                                    data-testid="toolbar-print"
                                    onClick={doPrint}
                                >
                                    Print
                                </PrimaryButton>
                            </ToolbarControls>
                        </ToolbarCard>

                        {/* Canvas / content area: the preview canvas. This view
                            doubles as the print preview — toolbar Print opens the
                            browser-native print dialog over it (window.print), it
                            never swaps to a separate in-app review screen. */}
                        <Canvas>
                            {!hasProblems ? (
                                <EmptyState data-testid="empty-state">
                                    <EmptyCard>
                                        <EmptyIcon aria-hidden="true">∑</EmptyIcon>
                                        <EmptyTitle>No worksheets for this selection yet</EmptyTitle>
                                        <EmptyHint>Choose Prep, Year 1 or Year 2 to generate a printable sheet.</EmptyHint>
                                    </EmptyCard>
                                </EmptyState>
                            ) : (
                                <PageStack
                                    title={title}
                                    subtitle={subtitle}
                                    pages={pageSpecs}
                                    zoom={zoom()}
                                    testId="sheet-preview"
                                    pageTestId="sheet-preview-page"
                                />
                            )}
                            {/* The floating zoom dock belongs to the preview canvas
                                (its pages are what the native print dialog will
                                show), so it stays up whenever a sheet exists. */}
                            {hasProblems && (
                                <ZoomDock>
                                    <ZoomControl
                                        label="Preview zoom"
                                        value={zoom()}
                                        onChange={(m) => zoom(m)}
                                    />
                                </ZoomDock>
                            )}
                        </Canvas>
                    </Main>
                </Body>

                </div>

            {/* Screen-hidden print tree: the ONLY thing window.print() emits
                (@media print hides .app-chrome, reveals this). One exact A4
                block per worksheet page — a 3-page document prints as 3
                physical sheets, each page breaking via app.css .print-page. */}
            <div className="print-doc" aria-hidden="true">
                {sheet.pages.map((problems, i) => (
                    <div className="print-page" key={i}>
                        <PrintableSheet
                            title={title}
                            subtitle={subtitle}
                            problems={problems}
                            pageLabel={total > 1 ? `Page ${i + 1} of ${total}` : undefined}
                        />
                    </div>
                ))}
            </div>
        </AppRoot>
    );
}