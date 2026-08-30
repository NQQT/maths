// ─────────────────────────────────────────────────────────────────────────────
// Worksheet plugin — PRINT surface component.
//
// Renders the screen-hidden .print-doc tree: one exact A4 block per worksheet
// page, which @media print (app.css) reveals and window.print() paginates —
// a 3-page document prints as 3 physical sheets, each page breaking via the
// .print-page rules.
//
// WHY A SEPARATE COMPONENT (not part of WorksheetPage): the host mounts the
// print surface OUTSIDE the interactive shell (.app-chrome), because print
// media hides that shell wholesale. The derivation logic below intentionally
// mirrors WorksheetPage (grade, active type fallback, deterministic seed,
// generateDocument) so the printed pages are byte-identical to the preview —
// both surfaces derive from the same store slice and the same generators.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useMemo } from 'react';
import { getGradeConfig } from './grades';
import { generateDocument, MATH_TYPES, scopeLabel, type MathTypeId } from './generators';
import { seedFrom } from './rng';
import { PrintableSheet } from './PrintableSheet';
import type { PluginRuntimeContext } from '../types';

export function WorksheetPrint({ context }: { context: PluginRuntimeContext }) {
    // Same derivation as WorksheetPage — the store slice is the single
    // source of truth, so preview and print can never disagree.
    const { store, entryId } = context;

    const grade = getGradeConfig(store.gradeId ?? 1);
    // Same per-grade fallback as the page/toolbar: the first offered type
    // when the active entry is not offered by this grade.
    const activeType: MathTypeId = grade.available.includes(entryId as MathTypeId)
        ? (entryId as MathTypeId)
        : (grade.available[0] ?? 'addition');

    // Same deterministic seed + document generation as the preview.
    const refresh: number = store.refresh ?? 0;
    const seed = seedFrom([grade.id, activeType, refresh]);
    const pageCount: number = store.pageCount ?? 1;
    const sheet = useMemo(
        () => generateDocument(grade, activeType, seed, pageCount),
        [grade, activeType, seed, pageCount]
    );

    const total = sheet.pages.length;
    const label = MATH_TYPES.find((t) => t.id === activeType)?.label ?? activeType;
    const title = `${grade.label} — ${label}`;
    const subtitle = `${label} — ${scopeLabel(grade, activeType)}`;

    // Empty selection => nothing to print (the preview shows the empty state;
    // the toolbar's Print button is dimmed and inert for the same reason).
    if (total === 0) return null;

    return (
        // Screen-hidden print tree: the ONLY thing window.print() emits
        // (@media print hides .app-chrome, reveals this — app.css).
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
    );
}
