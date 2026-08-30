// Unit tests for the SUBTRACTION worksheet plugin.
//
// The plugin's generator is DETERMINISTIC: the entire sheet is pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])).

import { describe, it, expect } from 'vitest';
import { seedFrom, getGradeConfig, generateSheet } from '../framework';
import { subtractionSpec } from './SubtractionWorksheet';

const g0 = getGradeConfig(0);
const g1 = getGradeConfig(1);
const g2 = getGradeConfig(2);

function sheet(grade: ReturnType<typeof getGradeConfig>) {
    return generateSheet(subtractionSpec, grade, seedFrom([grade.id, subtractionSpec.id, 0]));
}

describe('subtraction plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(subtractionSpec.id).toBe('subtraction');
        expect(subtractionSpec.label).toBe('Subtraction');
        expect(subtractionSpec.icon).toBe('−');
        expect(subtractionSpec.perPage).toBe(24);
    });

    it('describes its numeric scope from the grade caps', () => {
        expect(subtractionSpec.scope(g1)).toBe('within 20');
        expect(subtractionSpec.scope(g2)).toBe('within 100');
    });
});

describe('subtraction — Prep (grade 0)', () => {
    it('never yields a negative answer (exact first row)', () => {
        const s = sheet(g0);
        expect(s).toHaveLength(24);
        for (const p of s) {
            const n = Number(p.answer);
            expect(n).toBeGreaterThanOrEqual(0);
        }
        expect(s[0]).toEqual({ id: 1, type: 'subtraction', prompt: '7 - 1 = __', answer: '6' });
    });
});

describe('subtraction — Year 1', () => {
    it('matches the exact sheet (no negative results)', () => {
        const s = sheet(g1);
        expect(s).toEqual([
            { id: 1, type: 'subtraction', prompt: '6 - 4 = __', answer: '2' },
            { id: 2, type: 'subtraction', prompt: '3 - 1 = __', answer: '2' },
            { id: 3, type: 'subtraction', prompt: '20 - 10 = __', answer: '10' },
            { id: 4, type: 'subtraction', prompt: '9 - 5 = __', answer: '4' },
            { id: 5, type: 'subtraction', prompt: '19 - 2 = __', answer: '17' },
            { id: 6, type: 'subtraction', prompt: '12 - 3 = __', answer: '9' },
            { id: 7, type: 'subtraction', prompt: '9 - 1 = __', answer: '8' },
            { id: 8, type: 'subtraction', prompt: '18 - 2 = __', answer: '16' },
            { id: 9, type: 'subtraction', prompt: '16 - 0 = __', answer: '16' },
            { id: 10, type: 'subtraction', prompt: '2 - 0 = __', answer: '2' },
            { id: 11, type: 'subtraction', prompt: '19 - 4 = __', answer: '15' },
            { id: 12, type: 'subtraction', prompt: '16 - 6 = __', answer: '10' },
            { id: 13, type: 'subtraction', prompt: '12 - 3 = __', answer: '9' },
            { id: 14, type: 'subtraction', prompt: '15 - 2 = __', answer: '13' },
            { id: 15, type: 'subtraction', prompt: '14 - 8 = __', answer: '6' },
            { id: 16, type: 'subtraction', prompt: '12 - 8 = __', answer: '4' },
            { id: 17, type: 'subtraction', prompt: '8 - 4 = __', answer: '4' },
            { id: 18, type: 'subtraction', prompt: '4 - 0 = __', answer: '4' },
            { id: 19, type: 'subtraction', prompt: '5 - 3 = __', answer: '2' },
            { id: 20, type: 'subtraction', prompt: '12 - 2 = __', answer: '10' },
            { id: 21, type: 'subtraction', prompt: '11 - 5 = __', answer: '6' },
            { id: 22, type: 'subtraction', prompt: '15 - 5 = __', answer: '10' },
            { id: 23, type: 'subtraction', prompt: '20 - 19 = __', answer: '1' },
            { id: 24, type: 'subtraction', prompt: '19 - 6 = __', answer: '13' }
        ]);
        for (const p of s) expect(Number(p.answer)).toBeGreaterThanOrEqual(0);
    });
});

describe('subtraction — Year 2', () => {
    it('has no negative results within 100', () => {
        const s = sheet(g2);
        for (const p of s) {
            expect(Number(p.answer)).toBeGreaterThanOrEqual(0);
            expect(Number(p.answer)).toBeLessThanOrEqual(100);
        }
    });
});
