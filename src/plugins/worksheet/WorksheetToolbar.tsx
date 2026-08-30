// ─────────────────────────────────────────────────────────────────────────────
// Worksheet plugin — TOOLBAR slot component.
//
// Rendered by the dashboard's PluginToolbarHost inside the shared toolbar
// card. Reuses the host's ToolbarId / ToolbarControls wrappers? NO — by design
// this component is fully self-contained (isolation contract): it carries its
// own styled wrappers. Behaviour is moved verbatim from the old
// MathsDashboard toolbar:
//
//   - title/subtitle from the current grade + type + scope;
//   - unbounded −/n/+ Pages stepper (typed or incremented, min 1, no max);
//   - Randomize re-rolls the seed in place (page count preserved);
//   - Print opens the browser-NATIVE print dialog via window.print(), with
//     the tab retitled to the worksheet title while it is open.
//
// All state lives in the plugin's scoped store slice: gradeId, typeId (synced
// from the active entry by WorksheetPage), pageCount, refresh.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { styledComponent } from '@presource/react';
import { getGradeConfig } from './grades';
import { MATH_TYPES, scopeLabel, type MathTypeId } from './generators';
import type { PluginRuntimeContext } from '../types';

// Minimum page count; there is intentionally NO maximum — the stepper can be
// incremented as far as the user wants ("infinite" page generation).
const MIN_PAGES = 1;

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

// Resolve the human label for a math type id (falls back to the id itself).
function labelFor(type: MathTypeId): string {
    return MATH_TYPES.find((t) => t.id === type)?.label ?? type;
}

// Empty-page-count sentinel: when the current selection produces no document
// (unimplemented grade / unoffered type), the stepper is dimmed and inert.
const NO_PAGES = 0;

export function WorksheetToolbar({ context }: { context: PluginRuntimeContext }) {
    // Scoped plugin state — the toolbar reads AND writes the same slice the
    // page component reads, so the two views can never disagree.
    const { store, entryId } = context;

    const grade = getGradeConfig(store.gradeId ?? 1);
    // Which type this toolbar describes: the ACTIVE entry when it is offered
    // by the grade, else the first offered type (mirrors WorksheetPage's
    // fallback so toolbar and page always agree).
    const activeType: MathTypeId = grade.available.includes(entryId as MathTypeId)
        ? (entryId as MathTypeId)
        : (grade.available[0] ?? 'addition');

    const hasProblems = grade.implemented && grade.available.length > 0;
    const pageCount: number = store.pageCount ?? 1;

    const title = `${grade.label} — ${labelFor(activeType)}`;
    const subtitle = `${labelFor(activeType)} — ${scopeLabel(grade, activeType)}`;

    // "Randomize": re-roll the seed. The document is regenerated IN PLACE —
    // the page count is preserved, so it can randomly become as many pages
    // as the stepper currently says (1..n), not "one new sheet".
    const randomize = () => {
        if (!hasProblems) return;
        store.refresh = (store.refresh ?? 0) + 1;
    };

    // Print: open the browser-NATIVE print dialog immediately from the normal
    // content view. The hidden .print-doc tree (rendered by WorksheetPage) is
    // what the browser paginates: one A4 block per page. While the dialog is
    // open the tab is retitled to the worksheet title so a PDF saved from it
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
        if (hasProblems) store.pageCount = Math.max(MIN_PAGES, pageCount - 1);
    };
    const increasePages = () => {
        if (hasProblems) store.pageCount = pageCount + 1;
    };
    // Typing a new page count: empty input is tolerated (cleared while
    // editing) and invalid text snaps back to MIN_PAGES on the next change.
    const onPagesInput = (raw: string) => {
        if (!hasProblems) return;
        if (raw === '') return;
        const n = Number.parseInt(raw, 10);
        if (!Number.isNaN(n)) store.pageCount = Math.max(MIN_PAGES, n);
        else store.pageCount = MIN_PAGES;
    };
    // If the field was left empty / invalid on blur, normalise to MIN_PAGES.
    const onPagesBlur = () => {
        if (hasProblems && pageCount < MIN_PAGES) store.pageCount = MIN_PAGES;
    };

    return (
        <>
            {/* Identity block: title + subtitle. data-testid on the title lets
                tests target it specifically, since the same title string also
                appears on every A4 preview. */}
            <ToolbarId>
                <ToolbarTitle data-testid="toolbar-title">{title}</ToolbarTitle>
                {hasProblems && <ToolbarSub>{subtitle}</ToolbarSub>}
            </ToolbarId>
            {/* Controls block: the host card frames these two blocks with
                justify-content: space-between (title left, controls right). */}
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
