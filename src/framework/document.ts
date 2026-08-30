// ─────────────────────────────────────────────────────────────────────────────
// FRAMEWORK — worksheet document assembly.
//
// The framework turns a plugin's DETERMINISTIC generator output into a
// multi-page A4 document. All a worksheet plugin supplies is its
// WorksheetSpec (generate + perPage + id); everything below — the single RNG
// stream, the page chunking, the continuous problem ids — is shared framework
// behaviour so every worksheet paginates identically.
//
// Multi-page behaviour: the ENTIRE document is generated from a single RNG
// stream (one call to the plugin's generator for `perPage * pageCount`
// problems) and then chunked into pages of `perPage`. Because it is one
// continuous stream, page 2 is the exact continuation of page 1 — the same
// seed always yields the same document, and page 1 of a 1-page document is
// byte-identical to a single-sheet output.
// ─────────────────────────────────────────────────────────────────────────────

import { createRng } from './rng';
import type { GradeConfig } from './grades';
import type { RawProblem, WorksheetSpec } from './types';

// A problem as printed: the plugin's prompt/answer plus the framework-assigned
// document position (1-based, continuous across pages) and the owning
// worksheet's id as the type tag.
export type Problem = {
    // 1-based position on the sheet (assigned by buildDocument).
    id: number;
    // The worksheet spec id this problem belongs to.
    type: string;
    prompt: string;
    answer: string;
};

// A multi-page worksheet: `pages[i]` holds the problems printed on page i+1.
export type WorksheetDocument = {
    pages: Problem[][];
    // Total number of problems in the document (pages.length * spec.perPage).
    total: number;
};

// Build the full, MULTI-PAGE problem document for a worksheet spec.
//
// Empty document signals "not implemented / not offered / bogus page count" to
// the UI, which then shows a friendly placeholder instead of a blank A4 page.
export function buildDocument(
    spec: WorksheetSpec,
    grade: GradeConfig,
    seed: number,
    pageCount: number
): WorksheetDocument {
    if (!grade.implemented || !spec.offered(grade) || pageCount < 1) {
        return { pages: [], total: 0 };
    }
    const perPage = spec.perPage;
    const total = perPage * pageCount;
    const rng = createRng(seed);
    const raw: RawProblem[] = spec.generate(rng, grade.caps, total);
    const pages: Problem[][] = [];
    for (let p = 0; p < pageCount; p++) {
        pages.push(
            raw.slice(p * perPage, (p + 1) * perPage).map((item, i) => ({
                ...item,
                id: p * perPage + i + 1,
                type: spec.id
            }))
        );
    }
    return { pages, total };
}

// Single-page helper: a 1-page document, flattened. Page-1 ids (1..perPage)
// and the RNG stream are identical to the multi-page run, so pinned sheet
// tests hold for both surfaces.
export function generateSheet(spec: WorksheetSpec, grade: GradeConfig, seed: number): Problem[] {
    const doc = buildDocument(spec, grade, seed, 1);
    return doc.pages[0] ?? [];
}

// Full document builder (the name the framework surfaces/tests use).
export function generateDocument(
    spec: WorksheetSpec,
    grade: GradeConfig,
    seed: number,
    pageCount: number
): WorksheetDocument {
    return buildDocument(spec, grade, seed, pageCount);
}
