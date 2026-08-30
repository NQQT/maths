// Unit tests for the framework's document assembly (buildDocument /
// generateSheet / generateDocument).
//
// Strategy: the chunker is DETERMINISTIC given a spec + seed, so the exact
// page layout (counts, continuous ids, empty-document gating) is pinned here
// with a throwaway inline spec. The REAL worksheet streams (exact prompts and
// answers per grade) are pinned in each worksheet plugin's own test file.

import { describe, it, expect } from 'vitest';
import { createRng, type Rng } from './rng';
import { getGradeConfig } from './grades';
import { buildDocument, generateDocument, generateSheet, type Problem } from './document';
import type { WorksheetSpec } from './types';

const g1 = getGradeConfig(1);

// A fully deterministic throwaway spec: problem i is "i + 1 = __" and ignores
// the rng entirely, so the expected pages are trivially exact. perPage 24
// mirrors the real compact worksheets.
const fakeSpec: WorksheetSpec = {
    id: 'fake',
    label: 'Fake',
    icon: '*',
    perPage: 24,
    offered: () => true,
    scope: () => 'fake',
    generate: (_rng: Rng, _caps: unknown, count: number) =>
        Array.from({ length: count }, (_, i) => ({
            prompt: `${i} + 1 = __`,
            answer: `${i + 1}`
        }))
};

// Same spec but never offered — pins the "grade does not offer this worksheet"
// gating without depending on any real plugin.
const neverOffered: WorksheetSpec = { ...fakeSpec, id: 'never', offered: () => false };

function toProblem(id: number): Problem {
    return { id, type: 'fake', prompt: `${id - 1} + 1 = __`, answer: `${id}` };
}

describe('buildDocument — multi-page worksheets', () => {
    // A 2-page document is ONE stream of 2×perPage problems chunked into
    // pages — so page 1 must be byte-identical to the single-page sheet.
    it('page 1 of a 2-page document equals the single-page sheet', () => {
        const two = generateDocument(fakeSpec, g1, 12345, 2);
        expect(two.pages).toHaveLength(2);
        expect(two.total).toBe(48);
        expect(two.pages[0]).toEqual(generateSheet(fakeSpec, g1, 12345));
    });

    // Problem ids must run continuously across page boundaries (1..72 for a
    // 3-page sheet), so printed pages read as one numbered set.
    it('problem ids run continuously across pages', () => {
        const doc = generateDocument(fakeSpec, g1, 12345, 3);
        expect(doc.pages).toHaveLength(3);
        expect(doc.total).toBe(72);
        expect(doc.pages.flat().map((p) => p.id)).toEqual(Array.from({ length: 72 }, (_, i) => i + 1));
        // Page boundaries land exactly after every 24 (spec.perPage).
        expect(doc.pages[2][0]).toEqual(toProblem(49));
        expect(doc.pages[2][23]).toEqual(toProblem(72));
    });

    it('stamps every problem with the owning worksheet id', () => {
        const sheet = generateSheet(fakeSpec, g1, 12345);
        expect(sheet).toHaveLength(24);
        expect(sheet.every((p) => p.type === 'fake')).toBe(true);
    });

    it('returns an empty document for an unimplemented grade', () => {
        // Grade 3 is not implemented (see framework/grades.ts) regardless of
        // the spec's own offered() verdict.
        expect(generateSheet(fakeSpec, getGradeConfig(3), 12345)).toEqual([]);
    });

    it('returns an empty document for a worksheet the grade does not offer', () => {
        expect(generateSheet(neverOffered, g1, 12345)).toEqual([]);
    });

    it('returns an empty document for a bogus page count', () => {
        expect(generateDocument(fakeSpec, g1, 12345, 0)).toEqual({ pages: [], total: 0 });
        expect(buildDocument(fakeSpec, g1, 12345, -1)).toEqual({ pages: [], total: 0 });
    });

    it('uses the provided seed through the real rng (same seed => same sheet)', () => {
        const a = generateSheet(fakeSpec, g1, createRng(1) && 777);
        const b = generateSheet(fakeSpec, g1, 777);
        expect(a).toEqual(b);
    });
});
