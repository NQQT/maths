// Unit tests for the TIME & CALENDAR worksheet plugin.
//
// The plugin's generator is DETERMINISTIC: entire sheets pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). Prep does not offer the extension types.

import { describe, it, expect } from 'vitest';
import { seedFrom, getGradeConfig, generateSheet } from '../framework';
import { timeSpec } from './TimeWorksheet';

const g0 = getGradeConfig(0);
const g1 = getGradeConfig(1);
const g2 = getGradeConfig(2);

function sheet(grade: ReturnType<typeof getGradeConfig>) {
    return generateSheet(timeSpec, grade, seedFrom([grade.id, timeSpec.id, 0]));
}

describe('time plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(timeSpec.id).toBe('time');
        expect(timeSpec.label).toBe('Time & Calendar');
        expect(timeSpec.icon).toBe('◷');
        expect(timeSpec.perPage).toBe(16);
    });

    it('describes its numeric scope from the grade caps', () => {
        expect(timeSpec.scope(g1)).toBe('days & months');
        expect(timeSpec.scope(g2)).toBe('time to the half hour');
    });
});

describe('time — availability gating', () => {
    it('Prep does not offer the extension type (empty sheet); Year 1 does', () => {
        expect(sheet(g0)).toEqual([]);
        expect(sheet(g1)).toHaveLength(16);
    });
});

describe('time — Year 1 (days/months/seasons; no clocks)', () => {
    it('matches the exact sheet', () => {
        const s = sheet(g1);
        expect(s).toEqual([
            {"prompt":"What month comes after May?","answer":"June","id":1,"type":"time"},
            {"prompt":"If today is Wednesday, what day was yesterday?","answer":"Tuesday","id":2,"type":"time"},
            {"prompt":"How many months are in a year?","answer":"12","id":3,"type":"time"},
            {"prompt":"What day comes after Tuesday?","answer":"Wednesday","id":4,"type":"time"},
            {"prompt":"What month comes before November?","answer":"October","id":5,"type":"time"},
            {"prompt":"If today is Monday, what day was yesterday?","answer":"Sunday","id":6,"type":"time"},
            {"prompt":"If today is Sunday, what day was yesterday?","answer":"Saturday","id":7,"type":"time"},
            {"prompt":"If today is Saturday, what day is tomorrow?","answer":"Sunday","id":8,"type":"time"},
            {"prompt":"What month comes after June?","answer":"July","id":9,"type":"time"},
            {"prompt":"What day comes before Friday?","answer":"Thursday","id":10,"type":"time"},
            {"prompt":"What month comes before October?","answer":"September","id":11,"type":"time"},
            {"prompt":"If today is Tuesday, how many days is it until Saturday?","answer":"4","id":12,"type":"time"},
            {"prompt":"What month comes after December?","answer":"January","id":13,"type":"time"},
            {"prompt":"If today is Thursday, what day is tomorrow?","answer":"Friday","id":14,"type":"time"},
            {"prompt":"If today is Tuesday, what day is tomorrow?","answer":"Wednesday","id":15,"type":"time"},
            {"prompt":"What day comes after Sunday?","answer":"Monday","id":16,"type":"time"},
        ]);
        // Year 1 (clockCap 0) can never produce clock-time items.
        for (const p of s) {
            expect(p.prompt.includes("o'clock")).toBe(false);
            expect(p.prompt.includes('half past')).toBe(false);
        }
    });
});

describe('time — Year 2 (adds clock time to the hour & half-past)', () => {
    it('matches the exact sheet', () => {
        const s = sheet(g2);
        expect(s).toEqual([
            {"prompt":"What season comes after summer?","answer":"autumn","id":1,"type":"time"},
            {"prompt":"It is 5 o'clock now. What time is it 2 hours later?","answer":"7 o'clock","id":2,"type":"time"},
            {"prompt":"What day comes before Sunday?","answer":"Saturday","id":3,"type":"time"},
            {"prompt":"What day comes after Wednesday?","answer":"Thursday","id":4,"type":"time"},
            {"prompt":"What month comes after January?","answer":"February","id":5,"type":"time"},
            {"prompt":"If today is Monday, what day was yesterday?","answer":"Sunday","id":6,"type":"time"},
            {"prompt":"If today is Saturday, what day is tomorrow?","answer":"Sunday","id":7,"type":"time"},
            {"prompt":"It is half past 11 now. What time is it one hour later?","answer":"half past 12","id":8,"type":"time"},
            {"prompt":"What month comes after July?","answer":"August","id":9,"type":"time"},
            {"prompt":"If today is Friday, what day was yesterday?","answer":"Thursday","id":10,"type":"time"},
            {"prompt":"If today is Thursday, what day is tomorrow?","answer":"Friday","id":11,"type":"time"},
            {"prompt":"If today is Tuesday, what day was yesterday?","answer":"Monday","id":12,"type":"time"},
            {"prompt":"If today is Sunday, what day is tomorrow?","answer":"Monday","id":13,"type":"time"},
            {"prompt":"What month comes before August?","answer":"July","id":14,"type":"time"},
            {"prompt":"What season comes after spring?","answer":"summer","id":15,"type":"time"},
            {"prompt":"What day comes after Friday?","answer":"Saturday","id":16,"type":"time"},
        ]);
        // Year 2 (clockCap 12) DOES produce clock items on this seeded sheet.
        expect(s.some((p) => p.prompt.includes("o'clock"))).toBe(true);
    });
});
