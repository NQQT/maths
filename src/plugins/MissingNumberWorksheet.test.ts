// Unit tests for the MISSING NUMBER worksheet plugin.
//
// The plugin's generator is DETERMINISTIC: the entire sheet is pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). Missing numbers start at Year 1, so Prep
// must produce an empty sheet.

import { describe, it, expect } from 'vitest';
import { seedFrom, getGradeConfig, generateSheet } from '../framework';
import { missingSpec } from './MissingNumberWorksheet';

const g0 = getGradeConfig(0);
const g1 = getGradeConfig(1);

function sheet(grade: ReturnType<typeof getGradeConfig>) {
    return generateSheet(missingSpec, grade, seedFrom([grade.id, missingSpec.id, 0]));
}

describe('missing number plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(missingSpec.id).toBe('missing');
        expect(missingSpec.label).toBe('Missing Number');
        expect(missingSpec.icon).toBe('?');
        expect(missingSpec.perPage).toBe(16);
    });

    it('describes its numeric scope from the grade caps', () => {
        expect(missingSpec.scope(g1)).toBe('within 20');
    });
});

describe('missing number — availability gating', () => {
    it('Prep does not offer missing numbers (empty sheet)', () => {
        expect(sheet(g0)).toEqual([]);
    });
});

describe('missing number — Year 1', () => {
    it('matches the exact sheet (hidden addend always >= 0)', () => {
        const s = sheet(g1);
        expect(s).toEqual([
            {"prompt":"1 + __ = 5","answer":"4","id":1,"type":"missing"},
            {"prompt":"2 + __ = 3","answer":"1","id":2,"type":"missing"},
            {"prompt":"__ + 3 = 7","answer":"4","id":3,"type":"missing"},
            {"prompt":"10 + __ = 19","answer":"9","id":4,"type":"missing"},
            {"prompt":"__ + 16 = 19","answer":"3","id":5,"type":"missing"},
            {"prompt":"14 + __ = 18","answer":"4","id":6,"type":"missing"},
            {"prompt":"9 + __ = 18","answer":"9","id":7,"type":"missing"},
            {"prompt":"1 + __ = 12","answer":"11","id":8,"type":"missing"},
            {"prompt":"0 + __ = 6","answer":"6","id":9,"type":"missing"},
            {"prompt":"__ + 12 = 14","answer":"2","id":10,"type":"missing"},
            {"prompt":"12 + __ = 18","answer":"6","id":11,"type":"missing"},
            {"prompt":"7 + __ = 13","answer":"6","id":12,"type":"missing"},
            {"prompt":"9 + __ = 17","answer":"8","id":13,"type":"missing"},
            {"prompt":"8 + __ = 14","answer":"6","id":14,"type":"missing"},
            {"prompt":"1 + __ = 1","answer":"0","id":15,"type":"missing"},
            {"prompt":"__ + 11 = 15","answer":"4","id":16,"type":"missing"},
        ]);
        for (const p of s) expect(Number(p.answer)).toBeGreaterThanOrEqual(0);
    });
});
