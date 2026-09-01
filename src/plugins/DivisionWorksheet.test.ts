// Unit tests for the DIVISION worksheet plugin.
//
// The plugin's generator is DETERMINISTIC: the entire sheet is pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). Division by equal sharing starts at
// Year 2 — Prep and Year 1 must produce empty sheets.

import { describe, it, expect } from 'vitest';
import { seedFrom, getGradeConfig, generateSheet } from '../framework';
import { divisionSpec } from './DivisionWorksheet';

const g0 = getGradeConfig(0);
const g1 = getGradeConfig(1);
const g2 = getGradeConfig(2);

function sheet(grade: ReturnType<typeof getGradeConfig>) {
    return generateSheet(divisionSpec, grade, seedFrom([grade.id, divisionSpec.id, 0]));
}

describe('division plugin — declarative spec', () => {
    it('declares its sidebar label, glyph, prose layout and page size', () => {
        expect(divisionSpec.id).toBe('division');
        expect(divisionSpec.label).toBe('Division');
        expect(divisionSpec.icon).toBe('÷');
        expect(divisionSpec.singleColumn).toBe(true);
        expect(divisionSpec.perPage).toBe(12);
    });

    it('describes its numeric scope from the grade caps', () => {
        expect(divisionSpec.scope(g2)).toBe('equal sharing within 100');
    });
});

describe('division — availability gating', () => {
    it('Prep and Year 1 do not offer division (empty sheets); Year 2 does', () => {
        expect(sheet(g0)).toEqual([]);
        expect(sheet(g1)).toEqual([]);
        expect(sheet(g2)).toHaveLength(12);
    });
});

describe('division — Year 2 (equal sharing within 100)', () => {
    it('matches the exact sheet (divisor >= 2)', () => {
        const s = sheet(g2);
        expect(s).toEqual([
            {"prompt":"There are 21 balloons. They are put into groups of 7. How many groups are there?","answer":"3","id":1,"type":"division"},
            {"prompt":"There are 30 flowers. They are put into groups of 10. How many groups are there?","answer":"3","id":2,"type":"division"},
            {"prompt":"Kai had 36 cars. Kai shared them equally between 4 friends. How many cars does each friend get?","answer":"9","id":3,"type":"division"},
            {"prompt":"14 ÷ 2 = __","answer":"7","id":4,"type":"division"},
            {"prompt":"There are 45 stickers. They are put into groups of 5. How many groups are there?","answer":"9","id":5,"type":"division"},
            {"prompt":"Max had 12 crayons. Max shared them equally between 2 friends. How many crayons does each friend get?","answer":"6","id":6,"type":"division"},
            {"prompt":"28 ÷ 7 = __","answer":"4","id":7,"type":"division"},
            {"prompt":"24 ÷ 4 = __","answer":"6","id":8,"type":"division"},
            {"prompt":"Sam had 30 balloons. Sam shared them equally between 5 friends. How many balloons does each friend get?","answer":"6","id":9,"type":"division"},
            {"prompt":"There are 21 cars. They are put into groups of 3. How many groups are there?","answer":"7","id":10,"type":"division"},
            {"prompt":"50 ÷ 5 = __","answer":"10","id":11,"type":"division"},
            {"prompt":"2 ÷ 2 = __","answer":"1","id":12,"type":"division"},
        ]);
        // ÷-form lines: quotient × divisor = dividend, never a x ÷ 1.
        for (const p of s) {
            const m = p.prompt.match(/^(\d+) ÷ (\d+) = __$/);
            if (m) {
                expect(Number(m[2])).toBeGreaterThanOrEqual(2);
                expect(Number(m[2])).toBeLessThanOrEqual(10);
                expect(p.answer).toBe(`${Number(m[1]) / Number(m[2])}`);
            }
        }
    });
});
