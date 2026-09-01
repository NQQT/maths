// Unit tests for the SKIP COUNTING worksheet plugin.
//
// The plugin's generator is DETERMINISTIC: the entire sheet is pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])), plus the exact page-2 continuation row.

import { describe, it, expect } from 'vitest';
import { seedFrom, getGradeConfig, generateSheet, generateDocument } from '../framework';
import { skipSpec } from './SkipCountingWorksheet';

const g1 = getGradeConfig(1);

function sheet(grade: ReturnType<typeof getGradeConfig>) {
    return generateSheet(skipSpec, grade, seedFrom([grade.id, skipSpec.id, 0]));
}

describe('skip counting plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(skipSpec.id).toBe('skip');
        expect(skipSpec.label).toBe('Skip Counting');
        expect(skipSpec.icon).toBe('»');
        expect(skipSpec.perPage).toBe(16);
    });

    it('describes its numeric scope from the grade caps', () => {
        expect(skipSpec.scope(g1)).toBe('count by 2, 5, 10');
    });
});

describe('skip counting — Year 1', () => {
    it('matches the exact sheet (every run is a consistent skip)', () => {
        const s = sheet(g1);
        expect(s).toEqual([
            {"prompt":"43, 33, 23, __","answer":"13","id":1,"type":"skip"},
            {"prompt":"24, 29, __, 39","answer":"34","id":2,"type":"skip"},
            {"prompt":"11, 13, 15, __","answer":"17","id":3,"type":"skip"},
            {"prompt":"13, 23, 33, __","answer":"43","id":4,"type":"skip"},
            {"prompt":"16, 21, 26, __","answer":"31","id":5,"type":"skip"},
            {"prompt":"8, 10, __, 14","answer":"12","id":6,"type":"skip"},
            {"prompt":"34, 39, __, 49","answer":"44","id":7,"type":"skip"},
            {"prompt":"34, 24, 14, __","answer":"4","id":8,"type":"skip"},
            {"prompt":"21, 23, __, 27","answer":"25","id":9,"type":"skip"},
            {"prompt":"3, 13, 23, __","answer":"33","id":10,"type":"skip"},
            {"prompt":"25, 30, 35, __","answer":"40","id":11,"type":"skip"},
            {"prompt":"36, 38, 40, __","answer":"42","id":12,"type":"skip"},
            {"prompt":"1, 11, __, 31","answer":"21","id":13,"type":"skip"},
            {"prompt":"23, 18, 13, __","answer":"8","id":14,"type":"skip"},
            {"prompt":"4, 6, __, 10","answer":"8","id":15,"type":"skip"},
            {"prompt":"16, 26, __, 46","answer":"36","id":16,"type":"skip"},
        ]);
        // Semantic check across ALL three procedural forms: the blank is the
        // missing term of a consistent skip run — end blank (form 0: the 4th
        // term = 3rd shown + interval), middle blank (form 1: the missing
        // term = the shown step continuing between its neighbours), or
        // backward run (form 2: a negative interval run ending at the blank).
        for (const p of s) {
            const parts = p.prompt.split(', ');
            const nums = parts.slice(0, 3).map((t) => Number(t.replace('__', '')));
            if (parts[3] === '__') {
                // End blank: forward or backward run — the answer continues
                // the SAME interval from the last shown term.
                const interval = nums[1] - nums[0];
                expect(nums[2] - nums[1]).toBe(interval);
                expect(Number(p.answer)).toBe(nums[2] + interval);
            } else {
                // Middle blank: "a, b, __, d" — the answer sits midway on the
                // consistent run a -> b -> ? -> d.
                const interval = nums[1] - nums[0];
                expect(Number(parts[3]) - nums[1]).toBe(2 * interval);
                expect(Number(p.answer)).toBe(nums[1] + interval);
            }
        }
    });

    it('page 2 continues the exact stream', () => {
        const doc = generateDocument(skipSpec, g1, seedFrom([1, 'skip', 0]), 2);
        expect(doc.pages[1][0]).toEqual({ id: 17, type: "skip", prompt: "18, 23, 28, __", answer: "33" });
    });
});
