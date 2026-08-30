// ─────────────────────────────────────────────────────────────────────────────
// Worksheet plugin — PAGE slot component (the canvas).
//
// Rendered by the dashboard's PluginPageHost into the right-hand canvas. This
// is the old MathsDashboard content area, converted to the plugin contract:
//
//   - resolves the grade + type from the plugin's scoped store (gradeId) and
//     the ACTIVE entry (entryId), with per-grade fallback when the entry is
//     not offered by the grade;
//   - keeps store.typeId in sync with the resolved type so the toolbar (and
//     any other component of this plugin) always sees the same selection;
//   - generates the multi-page document (generateDocument) from the
//     deterministic seed, once per selection (useMemo);
//   - renders the continuous A4 preview stack (PageStack) + zoom dock, or
//     the shared empty state when the selection has no content;
//   - renders the screen-hidden .print-doc tree (one PrintableSheet per page)
//     that window.print() emits under @media print (app.css).
// ─────────────────────────────────────────────────────────────────────────────

import React, { useMemo } from 'react';
import { styledComponent } from '@presource/react';
import { getGradeConfig, type GradeConfig } from './grades';
import { generateDocument, MATH_TYPES, scopeLabel, type MathTypeId, type Problem } from './generators';
import { seedFrom } from './rng';
import { PageStack, type PageSpec } from './PageStack';
import { ZoomControl } from './ZoomControl';
import { PrintableSheet } from './PrintableSheet';
import type { ZoomMode } from './page-scale';
import type { PluginRuntimeContext } from '../types';

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

export function WorksheetPage({ context }: { context: PluginRuntimeContext }) {
    // Scoped plugin state: gradeId, pageCount, zoom, refresh. entryId is the
    // active rail entry of this plugin; the resolved type is DERIVED from it
    // every render (no separate typeId sync needed — derivation cannot drift).
    const { store, entryId } = context;

    const grade = getGradeConfig(store.gradeId ?? 1);
    // If the active entry isn't offered by this grade, fall back to the first
    // offered type so no invalid selection can linger (mirrors the toolbar's
    // fallback — the two must agree).
    const activeType: MathTypeId = grade.available.includes(entryId as MathTypeId)
        ? (entryId as MathTypeId)
        : (grade.available[0] ?? 'addition');

    // Stable seed from the current selection + refresh counter.
    // Deterministic, so the same inputs always yield the same document.
    const refresh: number = store.refresh ?? 0;
    const seed = seedFrom([grade.id, activeType, refresh]);

    // Generate the document (ALL pages) exactly once per selection and reuse
    // the same page list for the preview stack and the hidden print tree.
    // Empty document => "not implemented / not offered", rendered as a
    // placeholder in the canvas.
    const pageCount: number = store.pageCount ?? 1;
    const sheet = useMemo(
        () => generateDocument(grade, activeType, seed, pageCount),
        [grade, activeType, seed, pageCount]
    );

    // Page list annotated with "Page i of n" labels (multi-page only). One
    // PageSpec object is consumed by every rendering surface.
    const total = sheet.pages.length;
    const pageSpecs: PageSpec[] = sheet.pages.map((problems, i) => ({
        problems,
        pageLabel: total > 1 ? `Page ${i + 1} of ${total}` : undefined
    }));

    const hasProblems = total > 0;
    const zoom: ZoomMode = store.zoom ?? 'fit';

    // The "coming soon" notice for unimplemented grades (3..12) vs the generic
    // empty state — both are plugin-owned concerns.
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
                    title={`${grade.label} — ${typeLabel(activeType)}`}
                    subtitle={`${typeLabel(activeType)} — ${scopeText(grade, activeType)}`}
                    pages={pageSpecs}
                    zoom={zoom}
                    testId="sheet-preview"
                    pageTestId="sheet-preview-page"
                />
            )}
            {/* The floating zoom dock belongs to the preview canvas (its pages
                are what the native print dialog will show), so it stays up
                whenever a sheet exists. */}
            {hasProblems && (
                <ZoomDock>
                    <ZoomControl
                        label="Preview zoom"
                        value={zoom}
                        onChange={(m) => {
                            store.zoom = m;
                        }}
                    />
                </ZoomDock>
            )}

            {/* NOTE: the PRINT tree is deliberately NOT rendered here. The
                canvas lives inside .app-chrome, which @media print hides
                wholesale (app.css) — the host therefore mounts the plugin's
                print component OUTSIDE that shell (see WorksheetPrint). */}
        </>
    );
}

// Local helpers keeping the JSX tidy (same data the toolbar derives).
function typeLabel(type: MathTypeId): string {
    return MATH_TYPES.find((t) => t.id === type)?.label ?? type;
}
function scopeText(grade: GradeConfig, type: MathTypeId): string {
    return scopeLabel(grade, type);
}
