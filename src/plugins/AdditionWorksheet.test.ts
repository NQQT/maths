// Unit tests for the ADDITION worksheet plugin.
//
// Strategy: the plugin's generator is DETERMINISTIC, so the ENTIRE sheet (all
// prompts + answers) is pinned to exact expected values produced from the real
// generator with the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). If the algorithm, ranges, or caps change,
// these exact assertions fail — which is what we want, so a silent change to
// the worksheet can't slip through.

import { describe, it, expect } from 'vitest';
import { seedFrom, getGradeConfig, generateSheet, generateDocument } from '../framework';
import { additionSpec } from './AdditionWorksheet';

const g0 = getGradeConfig(0);
const g1 = getGradeConfig(1);
const g2 = getGradeConfig(2);

// Helper: regenerate a sheet using the same seed the framework computes.
function sheet(grade: ReturnType<typeof getGradeConfig>) {
    return generateSheet(additionSpec, grade, seedFrom([grade.id, additionSpec.id, 0]));
}

describe('addition plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(additionSpec.id).toBe('addition');
        expect(additionSpec.label).toBe('Addition');
        expect(additionSpec.icon).toBe('+');
        expect(additionSpec.perPage).toBe(24);
    });

    it('describes its numeric scope from the grade caps', () => {
        expect(additionSpec.scope(g1)).toBe('within 20');
        expect(additionSpec.scope(g0)).toBe('within 10');
        expect(additionSpec.scope(g2)).toBe('within 100');
    });

    it('is gated by the grade catalogue (hidden above Year 2)', () => {
        expect(additionSpec.offered(g0)).toBe(true);
        expect(additionSpec.offered(g1)).toBe(true);
        expect(additionSpec.offered(g2)).toBe(true);
        expect(additionSpec.offered(getGradeConfig(3))).toBe(false);
    });
});

describe('addition — Prep (grade 0)', () => {
    it('matches the exact sheet', () => {
        expect(sheet(g0)).toEqual([
            { id: 1, type: 'addition', prompt: '2 + 7 = __', answer: '9' },
            { id: 2, type: 'addition', prompt: '4 + 2 = __', answer: '6' },
            { id: 3, type: 'addition', prompt: '6 + 2 = __', answer: '8' },
            { id: 4, type: 'addition', prompt: '9 + 1 = __', answer: '10' },
            { id: 5, type: 'addition', prompt: '3 + 6 = __', answer: '9' },
            { id: 6, type: 'addition', prompt: '4 + 3 = __', answer: '7' },
            { id: 7, type: 'addition', prompt: '4 + 5 = __', answer: '9' },
            { id: 8, type: 'addition', prompt: '6 + 4 = __', answer: '10' },
            { id: 9, type: 'addition', prompt: '4 + 6 = __', answer: '10' },
            { id: 10, type: 'addition', prompt: '4 + 2 = __', answer: '6' },
            { id: 11, type: 'addition', prompt: '1 + 8 = __', answer: '9' },
            { id: 12, type: 'addition', prompt: '6 + 1 = __', answer: '7' },
            { id: 13, type: 'addition', prompt: '5 + 5 = __', answer: '10' },
            { id: 14, type: 'addition', prompt: '4 + 2 = __', answer: '6' },
            { id: 15, type: 'addition', prompt: '3 + 3 = __', answer: '6' },
            { id: 16, type: 'addition', prompt: '6 + 3 = __', answer: '9' },
            { id: 17, type: 'addition', prompt: '5 + 1 = __', answer: '6' },
            { id: 18, type: 'addition', prompt: '9 + 1 = __', answer: '10' },
            { id: 19, type: 'addition', prompt: '5 + 2 = __', answer: '7' },
            { id: 20, type: 'addition', prompt: '1 + 5 = __', answer: '6' },
            { id: 21, type: 'addition', prompt: '1 + 6 = __', answer: '7' },
            { id: 22, type: 'addition', prompt: '9 + 1 = __', answer: '10' },
            { id: 23, type: 'addition', prompt: '8 + 1 = __', answer: '9' },
            { id: 24, type: 'addition', prompt: '9 + 1 = __', answer: '10' }
        ]);
    });
});

describe('addition — Year 1 (the target grade)', () => {
    it('matches the exact sheet (within 20, sum never exceeds 20)', () => {
        const s = sheet(g1);
        expect(s).toEqual([
            { id: 1, type: 'addition', prompt: '10 + 9 = __', answer: '19' },
            { id: 2, type: 'addition', prompt: '12 + 2 = __', answer: '14' },
            { id: 3, type: 'addition', prompt: '19 + 1 = __', answer: '20' },
            { id: 4, type: 'addition', prompt: '16 + 4 = __', answer: '20' },
            { id: 5, type: 'addition', prompt: '2 + 12 = __', answer: '14' },
            { id: 6, type: 'addition', prompt: '4 + 11 = __', answer: '15' },
            { id: 7, type: 'addition', prompt: '10 + 4 = __', answer: '14' },
            { id: 8, type: 'addition', prompt: '18 + 2 = __', answer: '20' },
            { id: 9, type: 'addition', prompt: '9 + 2 = __', answer: '11' },
            { id: 10, type: 'addition', prompt: '11 + 5 = __', answer: '16' },
            { id: 11, type: 'addition', prompt: '14 + 5 = __', answer: '19' },
            { id: 12, type: 'addition', prompt: '9 + 3 = __', answer: '12' },
            { id: 13, type: 'addition', prompt: '14 + 1 = __', answer: '15' },
            { id: 14, type: 'addition', prompt: '7 + 10 = __', answer: '17' },
            { id: 15, type: 'addition', prompt: '16 + 2 = __', answer: '18' },
            { id: 16, type: 'addition', prompt: '10 + 7 = __', answer: '17' },
            { id: 17, type: 'addition', prompt: '18 + 2 = __', answer: '20' },
            { id: 18, type: 'addition', prompt: '1 + 18 = __', answer: '19' },
            { id: 19, type: 'addition', prompt: '19 + 1 = __', answer: '20' },
            { id: 20, type: 'addition', prompt: '5 + 11 = __', answer: '16' },
            { id: 21, type: 'addition', prompt: '9 + 5 = __', answer: '14' },
            { id: 22, type: 'addition', prompt: '18 + 1 = __', answer: '19' },
            { id: 23, type: 'addition', prompt: '12 + 1 = __', answer: '13' },
            { id: 24, type: 'addition', prompt: '7 + 13 = __', answer: '20' }
        ]);
        // Sanity: no sum exceeds the within-20 cap.
        for (const p of s) expect(Number(p.answer)).toBeLessThanOrEqual(20);
    });
});

describe('addition — Year 2 (bigger numbers)', () => {
    it('stays within the within-100 cap', () => {
        const s = sheet(g2);
        expect(s).toHaveLength(24);
        for (const p of s) expect(Number(p.answer)).toBeLessThanOrEqual(100);
        expect(s[0]).toEqual({ id: 1, type: 'addition', prompt: '45 + 41 = __', answer: '86' });
    });

    it('returns an empty sheet for an unimplemented grade', () => {
        expect(generateSheet(additionSpec, getGradeConfig(3), seedFrom([3, 'addition', 0]))).toEqual([]);
    });
});

describe('addition — multi-page documents', () => {
    // The EXACT continuation rows of page 2 for (Year 1, addition, refresh 0),
    // captured from the deterministic generator — any change to the generator,
    // caps, or chunking fails these pins.
    it('Year 1 addition, 2 pages, matches the exact page-2 sheet', () => {
        const doc = generateDocument(additionSpec, g1, seedFrom([1, 'addition', 0]), 2);
        expect(doc.pages[0][0]).toEqual({ id: 1, type: 'addition', prompt: '10 + 9 = __', answer: '19' });
        expect(doc.pages[1]).toEqual([
            { id: 25, type: 'addition', prompt: '12 + 2 = __', answer: '14' },
            { id: 26, type: 'addition', prompt: '7 + 11 = __', answer: '18' },
            { id: 27, type: 'addition', prompt: '10 + 4 = __', answer: '14' },
            { id: 28, type: 'addition', prompt: '11 + 3 = __', answer: '14' },
            { id: 29, type: 'addition', prompt: '17 + 2 = __', answer: '19' },
            { id: 30, type: 'addition', prompt: '2 + 1 = __', answer: '3' },
            { id: 31, type: 'addition', prompt: '12 + 4 = __', answer: '16' },
            { id: 32, type: 'addition', prompt: '12 + 2 = __', answer: '14' },
            { id: 33, type: 'addition', prompt: '2 + 15 = __', answer: '17' },
            { id: 34, type: 'addition', prompt: '3 + 6 = __', answer: '9' },
            { id: 35, type: 'addition', prompt: '3 + 7 = __', answer: '10' },
            { id: 36, type: 'addition', prompt: '3 + 15 = __', answer: '18' },
            { id: 37, type: 'addition', prompt: '13 + 4 = __', answer: '17' },
            { id: 38, type: 'addition', prompt: '1 + 8 = __', answer: '9' },
            { id: 39, type: 'addition', prompt: '15 + 4 = __', answer: '19' },
            { id: 40, type: 'addition', prompt: '11 + 2 = __', answer: '13' },
            { id: 41, type: 'addition', prompt: '2 + 8 = __', answer: '10' },
            { id: 42, type: 'addition', prompt: '7 + 12 = __', answer: '19' },
            { id: 43, type: 'addition', prompt: '7 + 3 = __', answer: '10' },
            { id: 44, type: 'addition', prompt: '15 + 1 = __', answer: '16' },
            { id: 45, type: 'addition', prompt: '6 + 3 = __', answer: '9' },
            { id: 46, type: 'addition', prompt: '19 + 1 = __', answer: '20' },
            { id: 47, type: 'addition', prompt: '19 + 1 = __', answer: '20' },
            { id: 48, type: 'addition', prompt: '9 + 7 = __', answer: '16' }
        ]);
    });

    it('Year 2 addition page 2 stays within the within-100 cap', () => {
        const doc = generateDocument(additionSpec, g2, seedFrom([2, 'addition', 0]), 2);
        // Pinned head of the page-2 stream.
        expect(doc.pages[1].slice(0, 3)).toEqual([
            { id: 25, type: 'addition', prompt: '96 + 2 = __', answer: '98' },
            { id: 26, type: 'addition', prompt: '28 + 6 = __', answer: '34' },
            { id: 27, type: 'addition', prompt: '2 + 14 = __', answer: '16' }
        ]);
        for (const p of doc.pages.flat()) expect(Number(p.answer)).toBeLessThanOrEqual(100);
    });
});
