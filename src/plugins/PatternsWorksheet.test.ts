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
            {"prompt":"20, 30, 40, __","answer":"50","id":1,"type":"patterns"},
            {"prompt":"triangle, diamond, square, triangle, diamond, __","answer":"square","id":2,"type":"patterns"},
            {"prompt":"0, 5, __, 15, 20","answer":"10","id":3,"type":"patterns"},
            {"prompt":"40, 42, 44, __","answer":"46","id":4,"type":"patterns"},
            {"prompt":"5, 6, __, 8, 9","answer":"7","id":5,"type":"patterns"},
            {"prompt":"bird, cat, bird, cat, bird, __","answer":"cat","id":6,"type":"patterns"},
            {"prompt":"14, 19, __, 29, 34","answer":"24","id":7,"type":"patterns"},
            {"prompt":"red, white, yellow, red, white, __","answer":"yellow","id":8,"type":"patterns"},
            {"prompt":"bird, cat, pig, bird, cat, __","answer":"pig","id":9,"type":"patterns"},
            {"prompt":"red, yellow, red, yellow, red, __","answer":"yellow","id":10,"type":"patterns"},
            {"prompt":"cross, diamond, cross, diamond, cross, __","answer":"diamond","id":11,"type":"patterns"},
            {"prompt":"green, yellow, green, yellow, green, __","answer":"yellow","id":12,"type":"patterns"},
            {"prompt":"9, 19, 29, __","answer":"39","id":13,"type":"patterns"},
            {"prompt":"12, 13, 14, __","answer":"15","id":14,"type":"patterns"},
            {"prompt":"0, 2, __, 6, 8","answer":"4","id":15,"type":"patterns"},
            {"prompt":"40, 41, 42, __","answer":"43","id":16,"type":"patterns"},
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
            {"prompt":"oval, circle, oval, circle, oval, __","answer":"circle","id":1,"type":"patterns"},
            {"prompt":"pink, blue, black, pink, blue, __","answer":"black","id":2,"type":"patterns"},
            {"prompt":"32, 36, 40, __","answer":"44","id":3,"type":"patterns"},
            {"prompt":"16, 26, __, 46, 56","answer":"36","id":4,"type":"patterns"},
            {"prompt":"cat, pig, cat, pig, cat, __","answer":"pig","id":5,"type":"patterns"},
            {"prompt":"71, 72, 73, __","answer":"74","id":6,"type":"patterns"},
            {"prompt":"orange, green, pink, orange, green, __","answer":"pink","id":7,"type":"patterns"},
            {"prompt":"30, 33, __, 39, 42","answer":"36","id":8,"type":"patterns"},
            {"prompt":"cat, duck, frog, cat, duck, __","answer":"frog","id":9,"type":"patterns"},
            {"prompt":"18, 23, 28, __","answer":"33","id":10,"type":"patterns"},
            {"prompt":"62, 64, __, 68, 70","answer":"66","id":11,"type":"patterns"},
            {"prompt":"72, 76, __, 84, 88","answer":"80","id":12,"type":"patterns"},
            {"prompt":"circle, square, circle, square, circle, __","answer":"square","id":13,"type":"patterns"},
            {"prompt":"white, red, yellow, white, red, __","answer":"yellow","id":14,"type":"patterns"},
            {"prompt":"87, 88, 89, __","answer":"90","id":15,"type":"patterns"},
            {"prompt":"12, 22, __, 42, 52","answer":"32","id":16,"type":"patterns"},
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
