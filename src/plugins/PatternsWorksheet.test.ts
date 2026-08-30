// Unit tests for the PATTERNS worksheet plugin.
//
// The plugin's generator is DETERMINISTIC: entire sheets pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). Prep does not offer the extension types.

import { describe, it, expect } from 'vitest';
import { seedFrom, getGradeConfig, generateSheet } from '../framework';
import { patternsSpec } from './PatternsWorksheet';

const g0 = getGradeConfig(0);
const g1 = getGradeConfig(1);
const g2 = getGradeConfig(2);

function sheet(grade: ReturnType<typeof getGradeConfig>) {
    return generateSheet(patternsSpec, grade, seedFrom([grade.id, patternsSpec.id, 0]));
}

describe('patterns plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(patternsSpec.id).toBe('patterns');
        expect(patternsSpec.label).toBe('Patterns');
        expect(patternsSpec.icon).toBe('↻');
        expect(patternsSpec.perPage).toBe(16);
    });

    it('describes its numeric scope from the grade caps', () => {
        expect(patternsSpec.scope(g1)).toBe('steps of 1, 2, 5, 10');
        expect(patternsSpec.scope(g2)).toBe('steps of 1, 2, 3, 4, 5, 10');
    });
});

describe('patterns — availability gating', () => {
    it('Prep does not offer the extension type (empty sheet); Year 1 does', () => {
        expect(sheet(g0)).toEqual([]);
        expect(sheet(g1)).toHaveLength(16);
    });
});

describe('patterns — Year 1 (steps 1/2/5/10)', () => {
    it('matches the exact sheet (count-on with gaps + repeating word cycles)', () => {
        const s = sheet(g1);
        expect(s).toEqual([
            { id: 1, type: 'patterns', prompt: 'frog, pig, bird, frog, pig, __', answer: 'bird' },
            { id: 2, type: 'patterns', prompt: 'fish, duck, fish, duck, fish, __', answer: 'duck' },
            { id: 3, type: 'patterns', prompt: '35, 37, __, 41, 43', answer: '39' },
            { id: 4, type: 'patterns', prompt: 'yellow, red, yellow, red, yellow, __', answer: 'red' },
            { id: 5, type: 'patterns', prompt: '20, 22, __, 26, 28', answer: '24' },
            { id: 6, type: 'patterns', prompt: '6, 16, 26, __', answer: '36' },
            { id: 7, type: 'patterns', prompt: '34, 35, 36, __', answer: '37' },
            { id: 8, type: 'patterns', prompt: '14, 24, 34, __', answer: '44' },
            { id: 9, type: 'patterns', prompt: '34, 35, __, 37, 38', answer: '36' },
            { id: 10, type: 'patterns', prompt: '16, 17, 18, __', answer: '19' },
            { id: 11, type: 'patterns', prompt: 'diamond, cross, diamond, cross, diamond, __', answer: 'cross' },
            { id: 12, type: 'patterns', prompt: 'red, green, red, green, red, __', answer: 'green' },
            { id: 13, type: 'patterns', prompt: '5, 15, __, 35, 45', answer: '25' },
            { id: 14, type: 'patterns', prompt: '10, 12, 14, __', answer: '16' },
            { id: 15, type: 'patterns', prompt: '40, 41, __, 43, 44', answer: '42' },
            { id: 16, type: 'patterns', prompt: '37, 39, 41, __', answer: '43' }
        ]);
        // Numeric pattern lines keep a constant step; the blank always resolves to the
        // term immediately before it advanced by that step, whether the gap sits in the
        // middle of the row or at its end ('__' maps to NaN so its index can be located).
        for (const p of s) {
            if (/^\d/.test(p.prompt)) {
                const terms = p.prompt.split(', ').map((t) => (t === '__' ? NaN : Number(t)));
                const gap = terms.findIndex(Number.isNaN);
                expect(gap).toBeGreaterThan(0);
                expect(Number(p.answer)).toBe(terms[gap - 1] + (terms[1] - terms[0]));
            }
        }
    });
});

describe('patterns — Year 2 (steps 1,2,3,4,5,10 up to 100)', () => {
    it('matches the exact sheet', () => {
        const s = sheet(g2);
        expect(s).toEqual([
            { id: 1, type: 'patterns', prompt: '73, 75, 77, __', answer: '79' },
            { id: 2, type: 'patterns', prompt: '71, 72, __, 74, 75', answer: '73' },
            { id: 3, type: 'patterns', prompt: '9, 14, __, 24, 29', answer: '19' },
            { id: 4, type: 'patterns', prompt: 'square, star, circle, square, star, __', answer: 'circle' },
            { id: 5, type: 'patterns', prompt: '25, 28, 31, __', answer: '34' },
            { id: 6, type: 'patterns', prompt: 'white, red, yellow, white, red, __', answer: 'yellow' },
            { id: 7, type: 'patterns', prompt: '12, 22, 32, __', answer: '42' },
            { id: 8, type: 'patterns', prompt: '59, 62, 65, __', answer: '68' },
            { id: 9, type: 'patterns', prompt: 'green, orange, red, green, orange, __', answer: 'red' },
            { id: 10, type: 'patterns', prompt: '77, 78, 79, __', answer: '80' },
            { id: 11, type: 'patterns', prompt: '60, 63, __, 69, 72', answer: '66' },
            { id: 12, type: 'patterns', prompt: '2, 6, __, 14, 18', answer: '10' },
            { id: 13, type: 'patterns', prompt: 'cross, diamond, cross, diamond, cross, __', answer: 'diamond' },
            { id: 14, type: 'patterns', prompt: '78, 79, __, 81, 82', answer: '80' },
            { id: 15, type: 'patterns', prompt: '1, 6, 11, __', answer: '16' },
            { id: 16, type: 'patterns', prompt: '80, 82, 84, __', answer: '86' }
        ]);
        // Numeric pattern lines keep a constant step; the blank resolves exactly to the
        // previous term plus the step (mirrors the Year 1 check within skipCap 100).
        for (const p of s) {
            if (/^\d/.test(p.prompt)) {
                const terms = p.prompt.split(', ').map((t) => (t === '__' ? NaN : Number(t)));
                const gap = terms.findIndex(Number.isNaN);
                expect(gap).toBeGreaterThan(0);
                expect(Number(p.answer)).toBe(terms[gap - 1] + (terms[1] - terms[0]));
            }
        }
    });
});
