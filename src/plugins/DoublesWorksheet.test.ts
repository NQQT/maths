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
            {"prompt":"4 + 5 = __","answer":"9","id":1,"type":"doubles"},
            {"prompt":"What is double 6?","answer":"12","id":2,"type":"doubles"},
            {"prompt":"7 + 8 = __","answer":"15","id":3,"type":"doubles"},
            {"prompt":"What is double 3?","answer":"6","id":4,"type":"doubles"},
            {"prompt":"6 + 6 = __","answer":"12","id":5,"type":"doubles"},
            {"prompt":"What is double 8?","answer":"16","id":6,"type":"doubles"},
            {"prompt":"4 + 4 = __","answer":"8","id":7,"type":"doubles"},
            {"prompt":"2 + 2 = __","answer":"4","id":8,"type":"doubles"},
            {"prompt":"What is double 4?","answer":"8","id":9,"type":"doubles"},
            {"prompt":"What is double 5?","answer":"10","id":10,"type":"doubles"},
            {"prompt":"3 + 3 = __","answer":"6","id":11,"type":"doubles"},
            {"prompt":"What is double 9?","answer":"18","id":12,"type":"doubles"},
            {"prompt":"10 + 10 = __","answer":"20","id":13,"type":"doubles"},
            {"prompt":"What is double 2?","answer":"4","id":14,"type":"doubles"},
            {"prompt":"What is double 7?","answer":"14","id":15,"type":"doubles"},
            {"prompt":"5 + 5 = __","answer":"10","id":16,"type":"doubles"},
            {"prompt":"2 + 3 = __","answer":"5","id":17,"type":"doubles"},
            {"prompt":"3 + 4 = __","answer":"7","id":18,"type":"doubles"},
            {"prompt":"7 + 7 = __","answer":"14","id":19,"type":"doubles"},
            {"prompt":"9 + 10 = __","answer":"19","id":20,"type":"doubles"},
            {"prompt":"1 + 2 = __","answer":"3","id":21,"type":"doubles"},
            {"prompt":"9 + 9 = __","answer":"18","id":22,"type":"doubles"},
            {"prompt":"8 + 8 = __","answer":"16","id":23,"type":"doubles"},
            {"prompt":"What is double 1?","answer":"2","id":24,"type":"doubles"},
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
            {"prompt":"13 + 13 = __","answer":"26","id":1,"type":"doubles"},
            {"prompt":"11 + 11 = __","answer":"22","id":2,"type":"doubles"},
            {"prompt":"What is double 16?","answer":"32","id":3,"type":"doubles"},
            {"prompt":"4 + 5 = __","answer":"9","id":4,"type":"doubles"},
            {"prompt":"8 + 9 = __","answer":"17","id":5,"type":"doubles"},
            {"prompt":"What is double 11?","answer":"22","id":6,"type":"doubles"},
            {"prompt":"18 + 19 = __","answer":"37","id":7,"type":"doubles"},
            {"prompt":"What is double 2?","answer":"4","id":8,"type":"doubles"},
            {"prompt":"5 + 5 = __","answer":"10","id":9,"type":"doubles"},
            {"prompt":"What is double 18?","answer":"36","id":10,"type":"doubles"},
            {"prompt":"8 + 8 = __","answer":"16","id":11,"type":"doubles"},
            {"prompt":"16 + 17 = __","answer":"33","id":12,"type":"doubles"},
            {"prompt":"What is double 10?","answer":"20","id":13,"type":"doubles"},
            {"prompt":"1 + 2 = __","answer":"3","id":14,"type":"doubles"},
            {"prompt":"5 + 6 = __","answer":"11","id":15,"type":"doubles"},
            {"prompt":"3 + 3 = __","answer":"6","id":16,"type":"doubles"},
            {"prompt":"6 + 6 = __","answer":"12","id":17,"type":"doubles"},
            {"prompt":"2 + 3 = __","answer":"5","id":18,"type":"doubles"},
            {"prompt":"16 + 16 = __","answer":"32","id":19,"type":"doubles"},
            {"prompt":"What is double 3?","answer":"6","id":20,"type":"doubles"},
            {"prompt":"What is double 14?","answer":"28","id":21,"type":"doubles"},
            {"prompt":"4 + 4 = __","answer":"8","id":22,"type":"doubles"},
            {"prompt":"11 + 12 = __","answer":"23","id":23,"type":"doubles"},
            {"prompt":"17 + 17 = __","answer":"34","id":24,"type":"doubles"},
        ]);
        // Every base stays within doubleCap (20 for Year 2).
        for (const p of s) {
            if (p.prompt.startsWith('What is double')) {
                expect(Number(p.prompt.replace('What is double', '').replace('?', ''))).toBeLessThanOrEqual(20);
            } else {
                const m = p.prompt.match(/^(\d+) \+ (\d+) = __$/);
                expect(Number(m![1])).toBeLessThanOrEqual(20);
                expect(Number(m![2])).toBeLessThanOrEqual(20);
            }
        }
    });
});
