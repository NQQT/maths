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
            { id: 1, type: 'division', prompt: 'There are 8 flowers. They are put into groups of 8. How many groups are there?', answer: '1' },
            { id: 2, type: 'division', prompt: '35 ÷ 7 = __', answer: '5' },
            { id: 3, type: 'division', prompt: '60 ÷ 10 = __', answer: '6' },
            { id: 4, type: 'division', prompt: '70 ÷ 7 = __', answer: '10' },
            { id: 5, type: 'division', prompt: 'Rae had 63 stickers. Rae shared them equally between 9 friends. How many stickers does each friend get?', answer: '7' },
            { id: 6, type: 'division', prompt: 'There are 28 toys. They are put into groups of 4. How many groups are there?', answer: '7' },
            { id: 7, type: 'division', prompt: 'There are 4 crayons. They are put into groups of 4. How many groups are there?', answer: '1' },
            { id: 8, type: 'division', prompt: 'There are 45 balloons. They are put into groups of 5. How many groups are there?', answer: '9' },
            { id: 9, type: 'division', prompt: '6 ÷ 6 = __', answer: '1' },
            { id: 10, type: 'division', prompt: 'Tom had 16 stickers. Tom shared them equally between 4 friends. How many stickers does each friend get?', answer: '4' },
            { id: 11, type: 'division', prompt: 'Zoe had 30 balloons. Zoe shared them equally between 5 friends. How many balloons does each friend get?', answer: '6' },
            { id: 12, type: 'division', prompt: 'Leo had 54 apples. Leo shared them equally between 9 friends. How many apples does each friend get?', answer: '6' }
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
