// Unit tests for the framework's grade catalogue.
//
// The catalogue is the dashboard's maths configuration: labels, implemented
// flags, per-grade caps and which worksheet ids each grade offers. Every
// worksheet plugin's grade gating reads these lists, so they are pinned
// exactly here.

import { describe, it, expect } from 'vitest';
import { getGradeConfig } from './grades';

const g0 = getGradeConfig(0);
const g1 = getGradeConfig(1);
const g2 = getGradeConfig(2);

describe('grade catalogue', () => {
    it('lists grades 0..12 with Prep / Year N labels', () => {
        const labels = getGradeConfig(0).label + '|' + getGradeConfig(12).label;
        expect(labels).toBe('Prep|Year 12');
        // Grades 0..6 have real content (0..2 full catalogue, 3..6 the
        // addition ladder); grade 7 and above are not implemented yet.
        expect(g0.implemented).toBe(true);
        expect(g1.implemented).toBe(true);
        expect(g2.implemented).toBe(true);
        expect(getGradeConfig(3).implemented).toBe(true);
        expect(getGradeConfig(6).implemented).toBe(true);
        expect(getGradeConfig(7).implemented).toBe(false);
        expect(getGradeConfig(12).implemented).toBe(false);
    });

    it('grades 3..6 form the arithmetic ladder (only +/-, one digit per year)', () => {
        // Only Addition + Subtraction are offered from Year 3 to Year 6 —
        // every other type (and these two themselves from Year 7) is
        // finished/absent.
        for (const id of [3, 4, 5, 6]) {
            const grade = getGradeConfig(id);
            expect(grade.available).toEqual(['addition', 'subtraction']);
        }
        // The operand cap scales exactly one digit per year...
        expect(getGradeConfig(3).caps.opCap).toBe(1000);
        expect(getGradeConfig(4).caps.opCap).toBe(10000);
        expect(getGradeConfig(5).caps.opCap).toBe(100000);
        expect(getGradeConfig(6).caps.opCap).toBe(1000000);
        // ...while multi-addend questions phase in: pairs through Y3,
        // 3 addends from Y4, 4 addends in Y6.
        expect(getGradeConfig(3).caps.addendCap).toBe(2);
        expect(getGradeConfig(4).caps.addendCap).toBe(3);
        expect(getGradeConfig(5).caps.addendCap).toBe(3);
        expect(getGradeConfig(6).caps.addendCap).toBe(4);
        // All other generators are capped out for these grades.
        for (const id of [3, 4, 5, 6]) {
            const caps = getGradeConfig(id).caps;
            expect(caps.numCap).toBe(0);
            expect(caps.multCap).toBe(0);
            expect(caps.coinCap).toBe(0);
            expect(caps.shapeSet).toEqual([]);
        }
    });

    it('grade 7 and above offer nothing (addition ends at Year 6)', () => {
        for (const id of [7, 8, 9, 10, 11, 12]) {
            const grade = getGradeConfig(id);
            expect(grade.implemented).toBe(false);
            expect(grade.available).toEqual([]);
            expect(grade.caps.opCap).toBe(0);
        }
    });

    it('Prep offers the four foundation worksheets only', () => {
        expect([...g0.available].sort()).toEqual(
            ['addition', 'comparison', 'counting', 'subtraction'].sort()
        );
    });

    it('grade 1 offers the full original catalogue plus the eight extension types', () => {
        expect([...g1.available].sort()).toEqual(
            [
                'addition',
                'bonds',
                'comparison',
                'counting',
                'data',
                'doubles',
                'measure',
                'missing',
                'patterns',
                'placevalue',
                'shapes',
                'skip',
                'subtraction',
                'time',
                'word'
            ].sort()
        );
    });

    it('grade 2 adds times tables, division and Australian coins (19 types total)', () => {
        // Year 2 is the first grade with times tables AND the only grade with
        // division / coins & money (V8-aligned money: coins to about $1).
        // It is also the only grade with clock faces (reading + drawing hands).
        expect([...g2.available].sort()).toEqual(
            [
                'addition',
                'bonds',
                'clock',
                'comparison',
                'counting',
                'data',
                'doubles',
                'division',
                'measure',
                'missing',
                'money',
                'mult',
                'patterns',
                'placevalue',
                'shapes',
                'skip',
                'subtraction',
                'time',
                'word'
            ].sort()
        );
        expect(g2.available).toContain('mult');
        expect(g1.available).not.toContain('mult');
        expect(g0.available).not.toContain('mult');
        expect(g1.available).not.toContain('division');
        expect(g1.available).not.toContain('money');
        // The times-tables cap is set to 10 only for grade 2; the extension
        // caps are also grade-specific (Y2 doubles to 20, coins to 100c).
        expect(g2.caps.multCap).toBe(10);
        expect(g1.caps.multCap).toBe(0);
        expect(g2.caps.doubleCap).toBe(20);
        expect(g1.caps.doubleCap).toBe(10);
        expect(g2.caps.clockCap).toBe(12);
        expect(g1.caps.clockCap).toBe(0);
        expect(g2.caps.coinCap).toBe(100);
        expect(g1.caps.coinCap).toBe(0);
    });
});
