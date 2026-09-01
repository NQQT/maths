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
            {"prompt":"17, 16, 15, __","answer":"14","id":1,"type":"counting"},
            {"prompt":"0, 1, __","answer":"2","id":2,"type":"counting"},
            {"prompt":"15, 16, __","answer":"17","id":3,"type":"counting"},
            {"prompt":"Which is smaller: 10 or 8?","answer":"8","id":4,"type":"counting"},
            {"prompt":"Which is smaller: 20 or 4?","answer":"4","id":5,"type":"counting"},
            {"prompt":"14, 15, __","answer":"16","id":6,"type":"counting"},
            {"prompt":"__, 17, 18","answer":"16","id":7,"type":"counting"},
            {"prompt":"15, __, 17","answer":"16","id":8,"type":"counting"},
            {"prompt":"8, __, 10","answer":"9","id":9,"type":"counting"},
            {"prompt":"18, __, 20","answer":"19","id":10,"type":"counting"},
            {"prompt":"0, __, 2","answer":"1","id":11,"type":"counting"},
            {"prompt":"5, 4, 3, __","answer":"2","id":12,"type":"counting"},
            {"prompt":"5, 6, __","answer":"7","id":13,"type":"counting"},
            {"prompt":"Which is bigger: 19 or 20?","answer":"20","id":14,"type":"counting"},
            {"prompt":"14, 15, 16, __","answer":"17","id":15,"type":"counting"},
            {"prompt":"13, __, 15","answer":"14","id":16,"type":"counting"},
            {"prompt":"2, __, 4","answer":"3","id":17,"type":"counting"},
            {"prompt":"Which is smaller: 17 or 6?","answer":"6","id":18,"type":"counting"},
        ]);
    });
});
