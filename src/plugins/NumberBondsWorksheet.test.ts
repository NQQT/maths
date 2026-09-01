// Unit tests for the NUMBER BONDS worksheet plugin.
//
// The plugin's generator is DETERMINISTIC: entire sheets pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). Prep does not offer the extension types.

import { describe, it, expect } from 'vitest';
import { seedFrom, getGradeConfig, generateSheet } from '../framework';
import { bondsSpec } from './NumberBondsWorksheet';

const g0 = getGradeConfig(0);
const g1 = getGradeConfig(1);
const g2 = getGradeConfig(2);

function sheet(grade: ReturnType<typeof getGradeConfig>) {
    return generateSheet(bondsSpec, grade, seedFrom([grade.id, bondsSpec.id, 0]));
}

describe('number bonds plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(bondsSpec.id).toBe('bonds');
        expect(bondsSpec.label).toBe('Number Bonds');
        expect(bondsSpec.icon).toBe('∨');
        expect(bondsSpec.perPage).toBe(24);
    });

    it('describes its numeric scope from the grade caps', () => {
        expect(bondsSpec.scope(g1)).toBe('bonds to 10');
        expect(bondsSpec.scope(g2)).toBe('bonds to 10 & 20');
    });
});

describe('number bonds — availability gating', () => {
    it('Prep does not offer the extension type (empty sheet); Year 1 does', () => {
        expect(sheet(g0)).toEqual([]);
        expect(sheet(g1)).toHaveLength(24);
    });
});

describe('number bonds — Year 1 (part-part-whole to 10)', () => {
    it('matches the exact sheet (no zero parts)', () => {
        const s = sheet(g1);
        expect(s).toEqual([
            {"prompt":"4 + __ = 10","answer":"6","id":1,"type":"bonds"},
            {"prompt":"10 - 1 = __","answer":"9","id":2,"type":"bonds"},
            {"prompt":"__ and 2 make 10","answer":"8","id":3,"type":"bonds"},
            {"prompt":"9 + __ = 10","answer":"1","id":4,"type":"bonds"},
            {"prompt":"__ and 5 make 10","answer":"5","id":5,"type":"bonds"},
            {"prompt":"__ + 1 = 10","answer":"9","id":6,"type":"bonds"},
            {"prompt":"__ and 7 make 10","answer":"3","id":7,"type":"bonds"},
            {"prompt":"6 + __ = 10","answer":"4","id":8,"type":"bonds"},
            {"prompt":"__ + 4 = 10","answer":"6","id":9,"type":"bonds"},
            {"prompt":"__ + 3 = 10","answer":"7","id":10,"type":"bonds"},
            {"prompt":"10 - 7 = __","answer":"3","id":11,"type":"bonds"},
            {"prompt":"__ + 2 = 10","answer":"8","id":12,"type":"bonds"},
            {"prompt":"__ and 8 make 10","answer":"2","id":13,"type":"bonds"},
            {"prompt":"__ + 5 = 10","answer":"5","id":14,"type":"bonds"},
            {"prompt":"3 + __ = 10","answer":"7","id":15,"type":"bonds"},
            {"prompt":"1 + __ = 10","answer":"9","id":16,"type":"bonds"},
            {"prompt":"__ and 3 make 10","answer":"7","id":17,"type":"bonds"},
            {"prompt":"__ + 8 = 10","answer":"2","id":18,"type":"bonds"},
            {"prompt":"__ + 7 = 10","answer":"3","id":19,"type":"bonds"},
            {"prompt":"10 - 8 = __","answer":"2","id":20,"type":"bonds"},
            {"prompt":"7 + __ = 10","answer":"3","id":21,"type":"bonds"},
            {"prompt":"__ + 6 = 10","answer":"4","id":22,"type":"bonds"},
            {"prompt":"10 - 2 = __","answer":"8","id":23,"type":"bonds"},
            {"prompt":"5 + __ = 10","answer":"5","id":24,"type":"bonds"},
        ]);
        // Every bond total is exactly 10 in Year 1 and both parts are non-zero.
        // The four forms: "a + __ = 10", "__ + a = 10", "__ and a make 10",
        // "10 - a = __" (the subtraction counterpart).
        for (const p of s) {
            const addForm = /(?:make 10)|(?:[+=] 10)/.test(p.prompt);
            const subForm = p.prompt.startsWith('10 - ');
            expect(addForm || subForm).toBe(true);
            expect(Number(p.answer)).toBeGreaterThanOrEqual(1);
            expect(Number(p.answer)).toBeLessThanOrEqual(9);
        }
    });
});

describe('number bonds — Year 2 (10 & 20)', () => {
    it('matches the exact sheet', () => {
        const s = sheet(g2);
        expect(s).toEqual([
            {"prompt":"20 - 4 = __","answer":"16","id":1,"type":"bonds"},
            {"prompt":"13 + __ = 20","answer":"7","id":2,"type":"bonds"},
            {"prompt":"20 - 2 = __","answer":"18","id":3,"type":"bonds"},
            {"prompt":"__ and 13 make 20","answer":"7","id":4,"type":"bonds"},
            {"prompt":"19 + __ = 20","answer":"1","id":5,"type":"bonds"},
            {"prompt":"__ and 3 make 10","answer":"7","id":6,"type":"bonds"},
            {"prompt":"__ + 8 = 10","answer":"2","id":7,"type":"bonds"},
            {"prompt":"__ and 7 make 10","answer":"3","id":8,"type":"bonds"},
            {"prompt":"__ and 1 make 20","answer":"19","id":9,"type":"bonds"},
            {"prompt":"__ + 9 = 10","answer":"1","id":10,"type":"bonds"},
            {"prompt":"6 + __ = 10","answer":"4","id":11,"type":"bonds"},
            {"prompt":"__ and 4 make 10","answer":"6","id":12,"type":"bonds"},
            {"prompt":"3 + __ = 20","answer":"17","id":13,"type":"bonds"},
            {"prompt":"20 - 8 = __","answer":"12","id":14,"type":"bonds"},
            {"prompt":"__ and 1 make 10","answer":"9","id":15,"type":"bonds"},
            {"prompt":"__ and 5 make 10","answer":"5","id":16,"type":"bonds"},
            {"prompt":"__ and 18 make 20","answer":"2","id":17,"type":"bonds"},
            {"prompt":"__ + 14 = 20","answer":"6","id":18,"type":"bonds"},
            {"prompt":"1 + __ = 10","answer":"9","id":19,"type":"bonds"},
            {"prompt":"__ + 3 = 10","answer":"7","id":20,"type":"bonds"},
            {"prompt":"__ + 11 = 20","answer":"9","id":21,"type":"bonds"},
            {"prompt":"20 - 7 = __","answer":"13","id":22,"type":"bonds"},
            {"prompt":"__ and 17 make 20","answer":"3","id":23,"type":"bonds"},
            {"prompt":"16 + __ = 20","answer":"4","id":24,"type":"bonds"},
        ]);
        // Year 2 bonds target 10 or 20 (both parts non-zero). The totals
        // appear after 'make ', after '= ' (addition forms) or as the
        // MINUEND of the subtraction counterpart ("20 - a = __").
        for (const p of s) {
            const addForm = /(?:make|=\s)\s*(?:10|20)\b/.test(p.prompt);
            const subForm = /^(?:10|20) - \d+ = __$/.test(p.prompt);
            expect(addForm || subForm).toBe(true);
            expect(Number(p.answer)).toBeGreaterThanOrEqual(1);
            expect(Number(p.answer)).toBeLessThanOrEqual(19);
        }
    });
});
