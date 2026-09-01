// Unit tests for the DOUBLES & NEAR DOUBLES worksheet plugin.
//
// The plugin's generator is DETERMINISTIC: entire sheets pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). Prep does not offer the extension types.

import { describe, it, expect } from 'vitest';
import { seedFrom, getGradeConfig, generateSheet } from '../framework';
import { doublesSpec } from './DoublesWorksheet';

const g0 = getGradeConfig(0);
const g1 = getGradeConfig(1);
const g2 = getGradeConfig(2);

function sheet(grade: ReturnType<typeof getGradeConfig>) {
    return generateSheet(doublesSpec, grade, seedFrom([grade.id, doublesSpec.id, 0]));
}

describe('doubles plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(doublesSpec.id).toBe('doubles');
        expect(doublesSpec.label).toBe('Doubles & Near Doubles');
        expect(doublesSpec.icon).toBe('=');
        expect(doublesSpec.perPage).toBe(24);
    });

    it('describes its numeric scope from the grade caps', () => {
        expect(doublesSpec.scope(g1)).toBe('doubles to 10');
        expect(doublesSpec.scope(g2)).toBe('doubles to 20');
    });
});

describe('doubles — availability gating', () => {
    it('Prep does not offer the extension type (empty sheet); Year 1 does', () => {
        expect(sheet(g0)).toEqual([]);
        expect(sheet(g1)).toHaveLength(24);
    });
});

describe('doubles — Year 1 (bases to 10)', () => {
    it('matches the exact sheet', () => {
        const s = sheet(g1);
        expect(s).toEqual([
            {"prompt":"What is double 5?","answer":"10","id":1,"type":"doubles"},
            {"prompt":"5 + __ = 11","answer":"6","id":2,"type":"doubles"},
            {"prompt":"What is double 8?","answer":"16","id":3,"type":"doubles"},
            {"prompt":"What is half of 6?","answer":"3","id":4,"type":"doubles"},
            {"prompt":"5 + 6 = __","answer":"11","id":5,"type":"doubles"},
            {"prompt":"7 + __ = 15","answer":"8","id":6,"type":"doubles"},
            {"prompt":"4 + 4 = __","answer":"8","id":7,"type":"doubles"},
            {"prompt":"2 + 2 = __","answer":"4","id":8,"type":"doubles"},
            {"prompt":"4 + __ = 9","answer":"5","id":9,"type":"doubles"},
            {"prompt":"3 + 3 = __","answer":"6","id":10,"type":"doubles"},
            {"prompt":"8 + __ = 17","answer":"9","id":11,"type":"doubles"},
            {"prompt":"2 + 3 = __","answer":"5","id":12,"type":"doubles"},
            {"prompt":"9 + 10 = __","answer":"19","id":13,"type":"doubles"},
            {"prompt":"What is half of 16?","answer":"8","id":14,"type":"doubles"},
            {"prompt":"2 + __ = 5","answer":"3","id":15,"type":"doubles"},
            {"prompt":"10 + 10 = __","answer":"20","id":16,"type":"doubles"},
            {"prompt":"What is half of 14?","answer":"7","id":17,"type":"doubles"},
            {"prompt":"4 + 5 = __","answer":"9","id":18,"type":"doubles"},
            {"prompt":"What is double 2?","answer":"4","id":19,"type":"doubles"},
            {"prompt":"What is half of 18?","answer":"9","id":20,"type":"doubles"},
            {"prompt":"What is half of 8?","answer":"4","id":21,"type":"doubles"},
            {"prompt":"7 + 8 = __","answer":"15","id":22,"type":"doubles"},
            {"prompt":"6 + __ = 13","answer":"7","id":23,"type":"doubles"},
            {"prompt":"What is double 10?","answer":"20","id":24,"type":"doubles"},
        ]);
        // Every arithmetic line adds up.
        for (const p of s) {
            const m = p.prompt.match(/^(\d+) \+ (\d+) = __$/);
            if (m) expect(p.answer).toBe(`${Number(m[1]) + Number(m[2])}`);
        }
    });
});

describe('doubles — Year 2 (bases to 20)', () => {
    it('matches the exact sheet', () => {
        const s = sheet(g2);
        expect(s).toEqual([
            {"prompt":"13 + 14 = __","answer":"27","id":1,"type":"doubles"},
            {"prompt":"11 + 11 = __","answer":"22","id":2,"type":"doubles"},
            {"prompt":"15 + __ = 31","answer":"16","id":3,"type":"doubles"},
            {"prompt":"What is double 4?","answer":"8","id":4,"type":"doubles"},
            {"prompt":"What is double 8?","answer":"16","id":5,"type":"doubles"},
            {"prompt":"What is half of 22?","answer":"11","id":6,"type":"doubles"},
            {"prompt":"What is half of 38?","answer":"19","id":7,"type":"doubles"},
            {"prompt":"2 + __ = 5","answer":"3","id":8,"type":"doubles"},
            {"prompt":"5 + 5 = __","answer":"10","id":9,"type":"doubles"},
            {"prompt":"What is half of 32?","answer":"16","id":10,"type":"doubles"},
            {"prompt":"17 + __ = 35","answer":"18","id":11,"type":"doubles"},
            {"prompt":"8 + 8 = __","answer":"16","id":12,"type":"doubles"},
            {"prompt":"What is double 17?","answer":"34","id":13,"type":"doubles"},
            {"prompt":"13 + 13 = __","answer":"26","id":14,"type":"doubles"},
            {"prompt":"9 + __ = 19","answer":"10","id":15,"type":"doubles"},
            {"prompt":"What is double 1?","answer":"2","id":16,"type":"doubles"},
            {"prompt":"What is double 5?","answer":"10","id":17,"type":"doubles"},
            {"prompt":"3 + 3 = __","answer":"6","id":18,"type":"doubles"},
            {"prompt":"11 + __ = 23","answer":"12","id":19,"type":"doubles"},
            {"prompt":"6 + 7 = __","answer":"13","id":20,"type":"doubles"},
            {"prompt":"What is double 2?","answer":"4","id":21,"type":"doubles"},
            {"prompt":"16 + 16 = __","answer":"32","id":22,"type":"doubles"},
            {"prompt":"3 + __ = 7","answer":"4","id":23,"type":"doubles"},
            {"prompt":"What is half of 28?","answer":"14","id":24,"type":"doubles"},
        ]);
        // Every base stays within doubleCap (20 for Year 2) across all five
        // forms: exact double, near double, worded double, worded half and
        // near-double missing addend.
        for (const p of s) {
            const dbl = p.prompt.match(/^What is double (\d+)\?$/);
            const half = p.prompt.match(/^What is half of (\d+)\?$/);
            const pair = p.prompt.match(/^(\d+) \+ (\d+) = __$/);
            const missing = p.prompt.match(/^(\d+) \+ __ = (\d+)$/);
            if (dbl) {
                expect(Number(dbl[1])).toBeLessThanOrEqual(20);
            } else if (half) {
                // Half of 2a: 2a <= 2 * cap.
                expect(Number(half[1])).toBeLessThanOrEqual(40);
            } else if (pair) {
                expect(Number(pair[1])).toBeLessThanOrEqual(20);
                expect(Number(pair[2])).toBeLessThanOrEqual(20);
            } else if (missing) {
                // Near-double missing addend: a + __ = 2a+1, so a <= cap-1
                // and the total <= 2 * cap - 1.
                expect(Number(missing[1])).toBeLessThanOrEqual(19);
                expect(Number(missing[2])).toBeLessThanOrEqual(39);
            } else {
                throw new Error(`unrecognised doubles prompt: ${p.prompt}`);
            }
        }
    });
});
