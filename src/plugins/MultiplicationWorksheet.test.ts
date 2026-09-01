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
            {"prompt":"5 × 10 = __","answer":"50","id":1,"type":"mult"},
            {"prompt":"9 × 7 = __","answer":"63","id":2,"type":"mult"},
            {"prompt":"9 × 9 = __","answer":"81","id":3,"type":"mult"},
            {"prompt":"6 × 7 = __","answer":"42","id":4,"type":"mult"},
            {"prompt":"6 × 1 = __","answer":"6","id":5,"type":"mult"},
            {"prompt":"9 × 5 = __","answer":"45","id":6,"type":"mult"},
            {"prompt":"3 × 4 = __","answer":"12","id":7,"type":"mult"},
            {"prompt":"5 × 5 = __","answer":"25","id":8,"type":"mult"},
            {"prompt":"10 × 10 = __","answer":"100","id":9,"type":"mult"},
            {"prompt":"10 × 3 = __","answer":"30","id":10,"type":"mult"},
            {"prompt":"2 × 4 = __","answer":"8","id":11,"type":"mult"},
            {"prompt":"10 × 6 = __","answer":"60","id":12,"type":"mult"},
            {"prompt":"2 × 5 = __","answer":"10","id":13,"type":"mult"},
            {"prompt":"8 × 2 = __","answer":"16","id":14,"type":"mult"},
            {"prompt":"1 × 3 = __","answer":"3","id":15,"type":"mult"},
            {"prompt":"9 × 2 = __","answer":"18","id":16,"type":"mult"},
            {"prompt":"3 × 9 = __","answer":"27","id":17,"type":"mult"},
            {"prompt":"7 × 4 = __","answer":"28","id":18,"type":"mult"},
            {"prompt":"6 × 6 = __","answer":"36","id":19,"type":"mult"},
            {"prompt":"5 × 9 = __","answer":"45","id":20,"type":"mult"},
            {"prompt":"5 × 3 = __","answer":"15","id":21,"type":"mult"},
            {"prompt":"5 × 8 = __","answer":"40","id":22,"type":"mult"},
            {"prompt":"2 × 9 = __","answer":"18","id":23,"type":"mult"},
            {"prompt":"2 × 10 = __","answer":"20","id":24,"type":"mult"},
        ]);
        // Every operand is within the times-tables cap and every product is correct.
        for (const p of s) {
            const m = p.prompt.match(/^(\d+) × (\d+) = __$/);
            expect(m).not.toBeNull();
            const a = Number(m![1]);
            const b = Number(m![2]);
            expect(a).toBeLessThanOrEqual(10);
            expect(b).toBeLessThanOrEqual(10);
            expect(p.answer).toBe(`${a * b}`);
        }
    });

    it('Grade 2 multiplication, 2 pages, continues the exact stream on page 2', () => {
        const doc = generateDocument(multiplicationSpec, g2, seedFrom([2, 'mult', 0]), 2);
        expect(doc.pages).toHaveLength(2);
        expect(doc.total).toBe(48);
        // Pinned head of the page-2 stream (ids 25, 26, 27).
        expect(doc.pages[1].slice(0, 3)).toEqual([
            {"prompt":"7 × 2 = __","answer":"14","id":25,"type":"mult"},
            {"prompt":"3 × 3 = __","answer":"9","id":26,"type":"mult"},
            {"prompt":"8 × 9 = __","answer":"72","id":27,"type":"mult"},
        ]);
        // Page 1 still equals the single-page sheet (stream is one continuous run).
        expect(doc.pages[0]).toEqual(sheet(g2));
    });
});
