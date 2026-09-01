// Unit tests for the COINS & MONEY worksheet plugin.
//
// The plugin's generator is DETERMINISTIC: the entire sheet is pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). Australian coins are V8 Year 2 content —
// Prep and Year 1 must produce empty sheets.

import { describe, it, expect } from 'vitest';
import { seedFrom, getGradeConfig, generateSheet } from '../framework';
import { moneySpec } from './MoneyWorksheet';

const g0 = getGradeConfig(0);
const g1 = getGradeConfig(1);
const g2 = getGradeConfig(2);

function sheet(grade: ReturnType<typeof getGradeConfig>) {
    return generateSheet(moneySpec, grade, seedFrom([grade.id, moneySpec.id, 0]));
}

describe('money plugin — declarative spec', () => {
    it('declares its sidebar label, glyph, prose layout and page size', () => {
        expect(moneySpec.id).toBe('money');
        expect(moneySpec.label).toBe('Coins & Money');
        expect(moneySpec.icon).toBe('$');
        expect(moneySpec.singleColumn).toBe(true);
        expect(moneySpec.perPage).toBe(12);
    });

    it('describes its numeric scope from the grade caps', () => {
        expect(moneySpec.scope(g2)).toBe('coins up to $1');
    });
});

describe('money — availability gating', () => {
    it('Prep and Year 1 do not offer money (empty sheets); Year 2 does', () => {
        expect(sheet(g0)).toEqual([]);
        expect(sheet(g1)).toEqual([]);
        expect(sheet(g2)).toHaveLength(12);
    });
});

describe('money — Year 2 (AU 5/10/20/50c coins + $ notes, V8-aligned)', () => {
    it('matches the exact sheet', () => {
        const s = sheet(g2);
        expect(s).toEqual([
            {"prompt":"How many five-cent coins are the same as one ten-cent coin?","answer":"2","id":1,"type":"money"},
            {"prompt":"How many five-cent coins are the same as one fifty-cent coin?","answer":"10","id":2,"type":"money"},
            {"prompt":"What coins make 60c?","answer":"50c + 10c","id":3,"type":"money"},
            {"prompt":"How many five-cent coins are the same as one twenty-cent coin?","answer":"4","id":4,"type":"money"},
            {"prompt":"What coins make 25c?","answer":"20c + 5c","id":5,"type":"money"},
            {"prompt":"How many twenty-cent coins make 40c?","answer":"2","id":6,"type":"money"},
            {"prompt":"How many twenty-cent coins make 20c?","answer":"1","id":7,"type":"money"},
            {"prompt":"You have one $1 note and one ten-cent coin. How much money is there in all?","answer":"$1.10","id":8,"type":"money"},
            {"prompt":"How many ten-cent coins are the same as one twenty-cent coin?","answer":"2","id":9,"type":"money"},
            {"prompt":"You have one $5 note and one ten-cent coin. How much money is there in all?","answer":"$5.10","id":10,"type":"money"},
            {"prompt":"How many ten-cent coins make 10c?","answer":"1","id":11,"type":"money"},
            {"prompt":"How many ten-cent coins make 40c?","answer":"4","id":12,"type":"money"},
        ]);
        // Every "what coins make X?" answer sums back to X using AU denominations.
        for (const p of s) {
            const m = p.prompt.match(/^What coins make (\$[\d.]+|\d+c)?$/);
            if (!m) continue;
            const target = p.prompt.match(/make (\$[\d.]+|\d+c)/)![1];
            const cents = target.startsWith('$') ? Math.round(parseFloat(target.slice(1)) * 100) : Number(target.replace('c', ''));
            const used = p.answer.split(' + ').reduce((sum, c) => sum + Number(c.replace('c', '')), 0);
            expect(used).toBe(cents);
        }
    });
});
