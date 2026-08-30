// ─────────────────────────────────────────────────────────────────────────────
// WORKSHEET KIT — the framework's standard worksheet recipe.
//
// `createWorksheet(spec)` builds a COMPLETE DashboardPlugin from a
// WorksheetSpec — this is what a worksheet plugin's factory function calls
// with the DashboardFramework it receives from the dashboard:
//
//   toolbar : title/subtitle + Pages stepper + Randomize + Print
//   page    : the A4 preview stack + zoom dock + empty state
//   print   : the hidden .print-doc tree window.print() paginates
//
// Every worksheet plugin (AdditionWorksheet, SubtractionWorksheet, ...) is a
// factory function that receives the dashboard's configurations + layouts and
// returns dashboard.createWorksheet({ ...its own spec... }) — the plugin
// declares its sidebar label and its content; the framework renders it.
//
// STATE: worksheets keep NO state of their own. The dashboard SESSION
// (store.session: gradeId, pageCount, zoom, refresh) is the shared framework
// configuration — switching worksheets preserves it, exactly like a single
// dashboard-wide setting should.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useMemo } from 'react';
import { styledComponent } from '@presource/react';
import { definePlugin, type DashboardPlugin, type WorksheetSpec } from './types';
import { useDashboardStore } from './store';
import { getGradeConfig, type GradeConfig } from './grades';
import { seedFrom } from './rng';
import { buildDocument } from './document';
import { PageStack, type PageSpec } from './PageStack';
import { PrintableSheet } from './PrintableSheet';
import { ZoomControl } from './ZoomControl';
import type { ZoomMode } from './page-scale';

// Minimum page count; there is intentionally NO maximum — the stepper can be
// incremented as far as the user wants ("infinite" page generation).
const MIN_PAGES = 1;

// ── Shared derivation (page + print use the SAME document) ──────────────────
// Resolves grade + deterministic seed + document from the session. The seed is
// seedFrom([grade.id, spec.id, refresh]) — fully deterministic, so the same
// inputs always yield the same document and preview/print can never disagree.
function useWorksheetDocument(spec: WorksheetSpec) {
    const store = useDashboardStore();
    const session = store.session;
    const gradeId = session.gradeId ?? 1;
    const refresh: number = session.refresh ?? 0;
    const pageCount: number = session.pageCount ?? 1;

    return useMemo(() => {
        const grade = getGradeConfig(gradeId);
        const seed = seedFrom([grade.id, spec.id, refresh]);
        const doc = buildDocument(spec, grade, seed, pageCount);
        const title = `${grade.label} — ${spec.label}`;
        const subtitle = `${spec.label} — ${spec.scope(grade)}`;
        return {
            grade,
            offered: grade.implemented && spec.offered(grade),
            doc,
            title,
            subtitle
        };
    }, [spec, gradeId, refresh, pageCount]);
}

// ── Toolbar surface ──────────────────────────────────────────────────────────
// Behaviour moved verbatim from the original dashboard toolbar:
//   - title/subtitle from the current grade + the plugin's label + scope;
//   - unbounded −/n/+ Pages stepper (typed or incremented, min 1, no max);
//   - Randomize re-rolls the seed in place (page count preserved);
//   - Print opens the browser-NATIVE print dialog via window.print(), with
//     the tab retitled to the worksheet title while it is open.
function createToolbar(spec: WorksheetSpec) {
    function WorksheetToolbar() {
        const store = useDashboardStore();
        const { session } = store;

        const grade = getGradeConfig(session.gradeId ?? 1);
        // Empty-page-count sentinel: when the current selection produces no
        // document (unimplemented grade / unoffered worksheet), the controls
        // are dimmed and inert.
        const hasProblems = grade.implemented && spec.offered(grade);
        const pageCount: number = session.pageCount ?? 1;

        const title = `${grade.label} — ${spec.label}`;
        const subtitle = `${spec.label} — ${spec.scope(grade)}`;

        // "Randomize": re-roll the seed. The document is regenerated IN PLACE —
        // the page count is preserved, so it can randomly become as many pages
        // as the stepper currently says (1..n), not "one new sheet".
        const randomize = () => {
            if (!hasProblems) return;
            session.refresh = (session.refresh ?? 0) + 1;
        };

        // Print: open the browser-NATIVE print dialog immediately from the
        // normal content view. The hidden .print-doc tree (rendered by the
        // print surface) is what the browser paginates: one A4 block per page.
        // While the dialog is open the tab is retitled to the worksheet title
        // so a PDF saved from it is named after the sheet; window.print()
        // blocks until the dialog closes, which is when the previous title is
        // restored.
        const doPrint = () => {
            if (!hasProblems) return;
            const previous = document.title;
            document.title = title;
            window.print(); // native print dialog
            document.title = previous;
        };

        // Stepper handlers: decrement never drops below MIN_PAGES; increment
        // has no upper bound, so the page count can keep growing.
        const decreasePages = () => {
            if (hasProblems) session.pageCount = Math.max(MIN_PAGES, pageCount - 1);
        };
        const increasePages = () => {
            if (hasProblems) session.pageCount = pageCount + 1;
        };
        // Typing a new page count: empty input is tolerated (cleared while
        // editing) and invalid text snaps back to MIN_PAGES on the next change.
        const onPagesInput = (raw: string) => {
            if (!hasProblems) return;
            if (raw === '') return;
            const n = Number.parseInt(raw, 10);
            if (!Number.isNaN(n)) session.pageCount = Math.max(MIN_PAGES, n);
            else session.pageCount = MIN_PAGES;
        };
        // If the field was left empty / invalid on blur, normalise to MIN_PAGES.
        const onPagesBlur = () => {
            if (hasProblems && pageCount < MIN_PAGES) session.pageCount = MIN_PAGES;
        };

        return (
            <>
                {/* Identity block: title + subtitle. data-testid on the title
                    lets tests target it specifically, since the same title
                    string also appears on every A4 preview. */}
                <ToolbarId>
                    <ToolbarTitle data-testid="toolbar-title">{title}</ToolbarTitle>
                    {hasProblems && <ToolbarSub>{subtitle}</ToolbarSub>}
                </ToolbarId>
                {/* Controls block: the framework card frames these two blocks
                    with justify-content: space-between (title left, controls
                    right). */}
                <ToolbarControls>
                    <PagesLabel>Pages</PagesLabel>
                    {/* Unbounded −/n/+ stepper: page count is a number that
                        increments, not a fixed set of toggle options. */}
                    <PageStepper role="group" aria-label="Number of pages" data-testid="page-stepper">
                        <PageStepButton
                            aria-label="Decrease pages"
                            dimmed={!hasProblems}
                            atMin={pageCount <= MIN_PAGES}
                            aria-disabled={!hasProblems || pageCount <= MIN_PAGES || undefined}
                            onClick={decreasePages}
                        >
                            &minus;
                        </PageStepButton>
                        <PageInput
                            type="number"
                            min={MIN_PAGES}
                            value={pageCount}
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
                        onClick={randomize}
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
            </>
        );
    }
    return WorksheetToolbar;
}

// ── Page surface (the canvas) ────────────────────────────────────────────────
// Resolves the grade + type from the shared session, generates the multi-page
// document from the deterministic seed, renders the continuous A4 preview
// stack (PageStack) + zoom dock, or the empty state when the selection has no
// content.
//
// NOTE: the PRINT tree is deliberately NOT rendered here. The canvas lives
// inside .app-chrome, which @media print hides wholesale (app.css) — the
// framework mounts the plugin's print surface OUTSIDE that shell instead.
function createPage(spec: WorksheetSpec) {
    function WorksheetPage() {
        const { grade, offered, doc, title, subtitle } = useWorksheetDocument(spec);
        const session = useDashboardStore().session;

        // Page list annotated with "Page i of n" labels (multi-page only). One
        // PageSpec object is consumed by every rendering surface.
        const total = doc.pages.length;
        const pageSpecs: PageSpec[] = doc.pages.map((problems, i) => ({
            problems,
            pageLabel: total > 1 ? `Page ${i + 1} of ${total}` : undefined
        }));

        const hasProblems = total > 0;
        const zoom: ZoomMode = session.zoom ?? 'fit';

        // The "coming soon" notice for unimplemented grades (3..12) vs the
        // generic empty state — both are framework-level concerns.
        const unimplemented = !grade.implemented;

        return (
            <>
                {!hasProblems ? (
                    <EmptyState data-testid="empty-state">
                        <EmptyCard>
                            <EmptyIcon aria-hidden="true">∑</EmptyIcon>
                            <EmptyTitle>
                                {unimplemented
                                    ? `${grade.label} worksheets are coming soon`
                                    : 'No worksheets for this selection yet'}
                            </EmptyTitle>
                            <EmptyHint>Choose Prep, Year 1 or Year 2 to generate a printable sheet.</EmptyHint>
                        </EmptyCard>
                    </EmptyState>
                ) : (
                    <PageStack
                        title={title}
                        subtitle={subtitle}
                        pages={pageSpecs}
                        zoom={zoom}
                        single={spec.singleColumn}
                        testId="sheet-preview"
                        pageTestId="sheet-preview-page"
                    />
                )}
                {/* The floating zoom dock belongs to the preview canvas (its
                    pages are what the native print dialog will show), so it
                    stays up whenever a sheet exists. */}
                {hasProblems && (
                    <ZoomDock>
                        <ZoomControl
                            label="Preview zoom"
                            value={zoom}
                            onChange={(m) => {
                                session.zoom = m;
                            }}
                        />
                    </ZoomDock>
                )}
            </>
        );
    }
    return WorksheetPage;
}

// ── Print surface ────────────────────────────────────────────────────────────
// Renders the screen-hidden .print-doc tree: one exact A4 block per worksheet
// page, which @media print (app.css) reveals and window.print() paginates —
// a 3-page document prints as 3 physical sheets, each page breaking via the
// .print-page rules.
//
// WHY A SEPARATE SURFACE (not part of the page): the framework mounts the
// print surface OUTSIDE the interactive shell (.app-chrome), because print
// media hides that shell wholesale. It intentionally derives from the SAME
// session + seed + buildDocument as the page, so the printed pages are
// byte-identical to the preview.
function createPrint(spec: WorksheetSpec) {
    function WorksheetPrint() {
        const { doc, title, subtitle } = useWorksheetDocument(spec);

        const total = doc.pages.length;

        // Empty selection => nothing to print (the preview shows the empty
        // state; the toolbar's Print button is dimmed and inert for the same
        // reason).
        if (total === 0) return null;

        return (
            // Screen-hidden print tree: the ONLY thing window.print() emits
            // (@media print hides .app-chrome, reveals this — app.css).
            <div className="print-doc" aria-hidden="true">
                {doc.pages.map((problems, i) => (
                    <div className="print-page" key={i}>
                        <PrintableSheet
                            title={title}
                            subtitle={subtitle}
                            problems={problems}
                            pageLabel={total > 1 ? `Page ${i + 1} of ${total}` : undefined}
                            single={spec.singleColumn}
                        />
                    </div>
                ))}
            </div>
        );
    }
    return WorksheetPrint;
}

// ── The recipe ───────────────────────────────────────────────────────────────
// Assemble the full plugin from a worksheet spec: one rail entry (the
// plugin's own sidebar label), grade gating, and the three surfaces.
export function createWorksheet(spec: WorksheetSpec): DashboardPlugin {
    return definePlugin({
        id: spec.id,
        name: `${spec.label} Worksheet`,
        // THE SIDEBAR LABEL: one entry, the plugin's own.
        entries: [{ id: spec.id, label: spec.label, icon: spec.icon, ariaLabel: spec.label }],
        // Grade gating straight from the spec — the framework hides the rail
        // entry (and snaps the selection) for grades that don't offer it.
        isOffered: spec.offered,
        toolbar: createToolbar(spec),
        page: createPage(spec),
        print: createPrint(spec)
    });
}

// ── Styled components (framework chrome, shared by all worksheets) ──────────

// Toolbar identity block (title + subtitle).
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

// Right-hand controls cluster.
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

// − / + stepper pill holding the two arrows and the value between them.
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

// `dimmed` is a styledComponent custom prop (HTMLAttributes has no
// `disabled`), mirrored onto aria-disabled + a guarded onClick.
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

// The page count, editable by typing. styledComponent's typed surface is
// HTMLAttributes<HTMLElement> (no `type`/input-event props), so cast to the
// InputHTMLAttributes surface (TwoColumnDashboard pattern in @react/headless).
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

// Empty state reserves real space with min-height so the placeholder is
// comfortably visible inside the canvas.
const EmptyState = styledComponent('div', {
    width: '100%',
    minHeight: '50vh',
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

// The zoom dock is pinned to the WINDOW (position:fixed), not to the canvas:
// with continuous document scrolling a canvas-anchored dock would scroll away
// off-screen after a few pages, but a fixed dock stays reachable at any
// scroll position.
const ZoomDock = styledComponent('div', {
    position: 'fixed',
    right: '14px',
    bottom: '14px',
    zIndex: 50
});
