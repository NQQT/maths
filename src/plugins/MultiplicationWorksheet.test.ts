// Unit tests for the MULTIPLICATION worksheet plugin.
//
// The plugin's generator is DETERMINISTIC: the entire sheet is pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). Times tables start at Year 2, so Prep
// and Year 1 must produce empty sheets.

import { describe, it, expect } from 'vitest';
import { seedFrom, getGradeConfig, generateSheet, generateDocument } from '../framework';
import { multiplicationSpec } from './MultiplicationWorksheet';

const g0 = getGradeConfig(0);
const g1 = getGradeConfig(1);
const g2 = getGradeConfig(2);

function sheet(grade: ReturnType<typeof getGradeConfig>) {
    return generateSheet(multiplicationSpec, grade, seedFrom([grade.id, multiplicationSpec.id, 0]));
}

describe('multiplication plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(multiplicationSpec.id).toBe('mult');
        expect(multiplicationSpec.label).toBe('Multiplication');
        expect(multiplicationSpec.icon).toBe('×');
        expect(multiplicationSpec.perPage).toBe(24);
    });

    it('describes its numeric scope from the grade caps', () => {
        expect(multiplicationSpec.scope(g2)).toBe('times tables to 10');
    });
});

describe('multiplication — availability gating', () => {
    it('Prep and Year 1 do not offer times tables (empty sheets)', () => {
        expect(sheet(g0)).toEqual([]);
        expect(sheet(g1)).toEqual([]);
    });
});

describe('multiplication — Year 2 (times tables to 10)', () => {
    it('matches the exact Grade 2 times-tables sheet (operands <= 10)', () => {
        const s = sheet(g2);
        expect(s).toEqual([
            {"prompt":"5 × __ = 50","answer":"10","id":1,"type":"mult"},
            {"prompt":"7 × __ = 63","answer":"9","id":2,"type":"mult"},
            {"prompt":"__ × 7 = 42","answer":"6","id":3,"type":"mult"},
            {"prompt":"__ × 9 = 9","answer":"1","id":4,"type":"mult"},
            {"prompt":"__ × 4 = 12","answer":"3","id":5,"type":"mult"},
            {"prompt":"__ × 9 = 45","answer":"5","id":6,"type":"mult"},
            {"prompt":"10 × __ = 100","answer":"10","id":7,"type":"mult"},
            {"prompt":"__ × 2 = 6","answer":"3","id":8,"type":"mult"},
            {"prompt":"10 × 6 = __","answer":"60","id":9,"type":"mult"},
            {"prompt":"5 × 8 = __","answer":"40","id":10,"type":"mult"},
            {"prompt":"1 × __ = 3","answer":"3","id":11,"type":"mult"},
            {"prompt":"2 × __ = 6","answer":"3","id":12,"type":"mult"},
            {"prompt":"9 × __ = 18","answer":"2","id":13,"type":"mult"},
            {"prompt":"__ × 6 = 24","answer":"4","id":14,"type":"mult"},
            {"prompt":"3 × __ = 15","answer":"5","id":15,"type":"mult"},
            {"prompt":"2 × 9 = __","answer":"18","id":16,"type":"mult"},
            {"prompt":"10 × 7 = __","answer":"70","id":17,"type":"mult"},
            {"prompt":"3 × __ = 9","answer":"3","id":18,"type":"mult"},
            {"prompt":"9 × __ = 81","answer":"9","id":19,"type":"mult"},
            {"prompt":"__ × 3 = 18","answer":"6","id":20,"type":"mult"},
            {"prompt":"9 × __ = 27","answer":"3","id":21,"type":"mult"},
            {"prompt":"2 × 5 = __","answer":"10","id":22,"type":"mult"},
            {"prompt":"4 × 8 = __","answer":"32","id":23,"type":"mult"},
            {"prompt":"4 × __ = 20","answer":"5","id":24,"type":"mult"},
        ]);
        // Every operand is within the times-tables cap and every equation is a
        // correct fact, across all three forms: product, first factor or
        // second factor unknown.
        for (const p of s) {
            const product = p.prompt.match(/^(\d+) × (\d+) = __$/);
            const missFirst = p.prompt.match(/^__ × (\d+) = (\d+)$/);
            const missSecond = p.prompt.match(/^(\d+) × __ = (\d+)$/);
            if (product) {
                const a = Number(product[1]);
                const b = Number(product[2]);
                expect(a).toBeLessThanOrEqual(10);
                expect(b).toBeLessThanOrEqual(10);
                expect(p.answer).toBe(`${a * b}`);
            } else if (missFirst) {
                const b = Number(missFirst[1]);
                const c = Number(missFirst[2]);
                expect(b).toBeLessThanOrEqual(10);
                expect(c).toBeLessThanOrEqual(100);
                expect(p.answer).toBe(`${c / b}`);
            } else if (missSecond) {
                const a = Number(missSecond[1]);
                const c = Number(missSecond[2]);
                expect(a).toBeLessThanOrEqual(10);
                expect(c).toBeLessThanOrEqual(100);
                expect(p.answer).toBe(`${c / a}`);
            } else {
                throw new Error(`unrecognised mult prompt: ${p.prompt}`);
            }
        }
    });

    it('Grade 2 multiplication, 2 pages, continues the exact stream on page 2', () => {
        const doc = generateDocument(multiplicationSpec, g2, seedFrom([2, 'mult', 0]), 2);
        expect(doc.pages).toHaveLength(2);
        expect(doc.total).toBe(48);
        // Pinned head of the page-2 stream (ids 25, 26, 27).
        expect(doc.pages[1].slice(0, 3)).toEqual([
            {"prompt":"__ × 6 = 48","answer":"8","id":25,"type":"mult"},
            {"prompt":"__ × 5 = 45","answer":"9","id":26,"type":"mult"},
            {"prompt":"__ × 1 = 6","answer":"6","id":27,"type":"mult"},
        ]);
        // Page 1 still equals the single-page sheet (stream is one continuous run).
        expect(doc.pages[0]).toEqual(sheet(g2));
    });
});
