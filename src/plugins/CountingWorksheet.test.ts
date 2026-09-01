// Unit tests for the COUNTING & NUMBERS worksheet plugin.
//
// The plugin's generator is DETERMINISTIC: the entire sheet is pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])).

import { describe, it, expect } from 'vitest';
import { seedFrom, getGradeConfig, generateSheet } from '../framework';
import { countingSpec } from './CountingWorksheet';

const g1 = getGradeConfig(1);

function sheet(grade: ReturnType<typeof getGradeConfig>) {
    return generateSheet(countingSpec, grade, seedFrom([grade.id, countingSpec.id, 0]));
}

describe('counting plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(countingSpec.id).toBe('counting');
        expect(countingSpec.label).toBe('Counting & Numbers');
        expect(countingSpec.icon).toBe('#');
        expect(countingSpec.perPage).toBe(18);
    });

    it('describes its numeric scope from the grade caps', () => {
        expect(countingSpec.scope(g1)).toBe('to 20');
    });
});

describe('counting — Year 1', () => {
    it('matches the exact sheet', () => {
        const s = sheet(g1);
        expect(s).toEqual([
            {"prompt":"14, 15, 16, __","answer":"17","id":1,"type":"counting"},
            {"prompt":"0, 1, __","answer":"2","id":2,"type":"counting"},
            {"prompt":"15, 16, __","answer":"17","id":3,"type":"counting"},
            {"prompt":"11, 10, 9, __","answer":"8","id":4,"type":"counting"},
            {"prompt":"__, 15, 16","answer":"14","id":5,"type":"counting"},
            {"prompt":"20, 19, 18, __","answer":"17","id":6,"type":"counting"},
            {"prompt":"14, 15, __","answer":"16","id":7,"type":"counting"},
            {"prompt":"16, 17, __","answer":"18","id":8,"type":"counting"},
            {"prompt":"8, 9, 10, __","answer":"11","id":9,"type":"counting"},
            {"prompt":"0, 1, 2, __","answer":"3","id":10,"type":"counting"},
            {"prompt":"2, 3, 4, __","answer":"5","id":11,"type":"counting"},
            {"prompt":"5, 6, __","answer":"7","id":12,"type":"counting"},
            {"prompt":"19, 18, 17, __","answer":"16","id":13,"type":"counting"},
            {"prompt":"3, 2, 1, __","answer":"0","id":14,"type":"counting"},
            {"prompt":"__, 16, 17","answer":"15","id":15,"type":"counting"},
            {"prompt":"15, 14, 13, __","answer":"12","id":16,"type":"counting"},
            {"prompt":"5, 4, 3, __","answer":"2","id":17,"type":"counting"},
            {"prompt":"17, 16, 15, __","answer":"14","id":18,"type":"counting"},
        ]);
    });
});
