// Unit tests for the worksheet problem generators.
//
// Strategy: every sheet generator is DETERMINISTIC, so we pin the ENTIRE sheet
// (all prompts + answers) to exact expected snapshots produced from the real
// generator with the same seed the dashboard uses (seedFrom([grade, type, 0])).
// If the algorithm, ranges, or caps change, these exact assertions fail — which
// is what we want, so a silent change to a worksheet can't slip through.

import { describe, it, expect } from 'vitest';
import { seedFrom } from './rng';
import { getGradeConfig } from './grades';
import { generateDocument, generateSheet, scopeLabel, SHEET_COUNTS, type MathTypeId } from './generators';

const g0 = getGradeConfig(0);
const g1 = getGradeConfig(1);
const g2 = getGradeConfig(2);

// Helper: regenerate a sheet using the same seed the dashboard computes.
function sheet(grade: ReturnType<typeof getGradeConfig>, type: MathTypeId) {
    return generateSheet(grade, type, seedFrom([grade.id, type, 0]));
}

describe('grade catalogue', () => {
    it('lists grades 0..12 with Prep / Year N labels', () => {
        const labels = getGradeConfig(0).label + '|' + getGradeConfig(12).label;
        expect(labels).toBe('Prep|Year 12');
        expect(g0.implemented).toBe(true);
        expect(g1.implemented).toBe(true);
        expect(g2.implemented).toBe(true);
        // Grade 3 and above are not implemented yet.
        expect(getGradeConfig(3).implemented).toBe(false);
        expect(getGradeConfig(12).implemented).toBe(false);
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

    it('grade 2 adds times tables, division and Australian coins (18 types total)', () => {
        // Year 2 is the first grade with times tables AND the only grade with
        // division / coins & money (V8-aligned money: coins to about $1).
        expect([...g2.available].sort()).toEqual(
            [
                'addition',
                'bonds',
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

describe('generateSheet — unimplemented / empty', () => {
    it('returns an empty sheet for an unimplemented grade', () => {
        expect(generateSheet(getGradeConfig(3), 'addition', seedFrom([3, 'addition', 0]))).toEqual([]);
    });

    it('returns an empty sheet for a type the grade does not offer', () => {
        // Grade 0 only offers counting/comparison/addition/subtraction.
        expect(generateSheet(g0, 'word', seedFrom([0, 'word', 0]))).toEqual([]);
    });
});

describe('generateSheet — Prep (grade 0)', () => {
    it('addition matches the exact sheet', () => {
        expect(sheet(g0, 'addition')).toEqual([
            { id: 1, type: 'addition', prompt: '2 + 7 = __', answer: '9' },
            { id: 2, type: 'addition', prompt: '4 + 2 = __', answer: '6' },
            { id: 3, type: 'addition', prompt: '6 + 2 = __', answer: '8' },
            { id: 4, type: 'addition', prompt: '9 + 1 = __', answer: '10' },
            { id: 5, type: 'addition', prompt: '3 + 6 = __', answer: '9' },
            { id: 6, type: 'addition', prompt: '4 + 3 = __', answer: '7' },
            { id: 7, type: 'addition', prompt: '4 + 5 = __', answer: '9' },
            { id: 8, type: 'addition', prompt: '6 + 4 = __', answer: '10' },
            { id: 9, type: 'addition', prompt: '4 + 6 = __', answer: '10' },
            { id: 10, type: 'addition', prompt: '4 + 2 = __', answer: '6' },
            { id: 11, type: 'addition', prompt: '1 + 8 = __', answer: '9' },
            { id: 12, type: 'addition', prompt: '6 + 1 = __', answer: '7' },
            { id: 13, type: 'addition', prompt: '5 + 5 = __', answer: '10' },
            { id: 14, type: 'addition', prompt: '4 + 2 = __', answer: '6' },
            { id: 15, type: 'addition', prompt: '3 + 3 = __', answer: '6' },
            { id: 16, type: 'addition', prompt: '6 + 3 = __', answer: '9' },
            { id: 17, type: 'addition', prompt: '5 + 1 = __', answer: '6' },
            { id: 18, type: 'addition', prompt: '9 + 1 = __', answer: '10' },
            { id: 19, type: 'addition', prompt: '5 + 2 = __', answer: '7' },
            { id: 20, type: 'addition', prompt: '1 + 5 = __', answer: '6' },
            { id: 21, type: 'addition', prompt: '1 + 6 = __', answer: '7' },
            { id: 22, type: 'addition', prompt: '9 + 1 = __', answer: '10' },
            { id: 23, type: 'addition', prompt: '8 + 1 = __', answer: '9' },
            { id: 24, type: 'addition', prompt: '9 + 1 = __', answer: '10' }
        ]);
    });

    it('subtraction never yields a negative answer (exact sheet)', () => {
        const s = sheet(g0, 'subtraction');
        expect(s).toHaveLength(24);
        for (const p of s) {
            const n = Number(p.answer);
            expect(n).toBeGreaterThanOrEqual(0);
        }
        expect(s[0]).toEqual({ id: 1, type: 'subtraction', prompt: '7 - 1 = __', answer: '6' });
    });
});

describe('generateSheet — Year 1 (the target grade)', () => {
    it('addition matches the exact sheet (within 20, sum never exceeds 20)', () => {
        const s = sheet(g1, 'addition');
        expect(s).toEqual([
            { id: 1, type: 'addition', prompt: '10 + 9 = __', answer: '19' },
            { id: 2, type: 'addition', prompt: '12 + 2 = __', answer: '14' },
            { id: 3, type: 'addition', prompt: '19 + 1 = __', answer: '20' },
            { id: 4, type: 'addition', prompt: '16 + 4 = __', answer: '20' },
            { id: 5, type: 'addition', prompt: '2 + 12 = __', answer: '14' },
            { id: 6, type: 'addition', prompt: '4 + 11 = __', answer: '15' },
            { id: 7, type: 'addition', prompt: '10 + 4 = __', answer: '14' },
            { id: 8, type: 'addition', prompt: '18 + 2 = __', answer: '20' },
            { id: 9, type: 'addition', prompt: '9 + 2 = __', answer: '11' },
            { id: 10, type: 'addition', prompt: '11 + 5 = __', answer: '16' },
            { id: 11, type: 'addition', prompt: '14 + 5 = __', answer: '19' },
            { id: 12, type: 'addition', prompt: '9 + 3 = __', answer: '12' },
            { id: 13, type: 'addition', prompt: '14 + 1 = __', answer: '15' },
            { id: 14, type: 'addition', prompt: '7 + 10 = __', answer: '17' },
            { id: 15, type: 'addition', prompt: '16 + 2 = __', answer: '18' },
            { id: 16, type: 'addition', prompt: '10 + 7 = __', answer: '17' },
            { id: 17, type: 'addition', prompt: '18 + 2 = __', answer: '20' },
            { id: 18, type: 'addition', prompt: '1 + 18 = __', answer: '19' },
            { id: 19, type: 'addition', prompt: '19 + 1 = __', answer: '20' },
            { id: 20, type: 'addition', prompt: '5 + 11 = __', answer: '16' },
            { id: 21, type: 'addition', prompt: '9 + 5 = __', answer: '14' },
            { id: 22, type: 'addition', prompt: '18 + 1 = __', answer: '19' },
            { id: 23, type: 'addition', prompt: '12 + 1 = __', answer: '13' },
            { id: 24, type: 'addition', prompt: '7 + 13 = __', answer: '20' }
        ]);
        // Sanity: no sum exceeds the within-20 cap.
        for (const p of s) expect(Number(p.answer)).toBeLessThanOrEqual(20);
    });

    it('subtraction matches the exact sheet (no negative results)', () => {
        const s = sheet(g1, 'subtraction');
        expect(s).toEqual([
            { id: 1, type: 'subtraction', prompt: '6 - 4 = __', answer: '2' },
            { id: 2, type: 'subtraction', prompt: '3 - 1 = __', answer: '2' },
            { id: 3, type: 'subtraction', prompt: '20 - 10 = __', answer: '10' },
            { id: 4, type: 'subtraction', prompt: '9 - 5 = __', answer: '4' },
            { id: 5, type: 'subtraction', prompt: '19 - 2 = __', answer: '17' },
            { id: 6, type: 'subtraction', prompt: '12 - 3 = __', answer: '9' },
            { id: 7, type: 'subtraction', prompt: '9 - 1 = __', answer: '8' },
            { id: 8, type: 'subtraction', prompt: '18 - 2 = __', answer: '16' },
            { id: 9, type: 'subtraction', prompt: '16 - 0 = __', answer: '16' },
            { id: 10, type: 'subtraction', prompt: '2 - 0 = __', answer: '2' },
            { id: 11, type: 'subtraction', prompt: '19 - 4 = __', answer: '15' },
            { id: 12, type: 'subtraction', prompt: '16 - 6 = __', answer: '10' },
            { id: 13, type: 'subtraction', prompt: '12 - 3 = __', answer: '9' },
            { id: 14, type: 'subtraction', prompt: '15 - 2 = __', answer: '13' },
            { id: 15, type: 'subtraction', prompt: '14 - 8 = __', answer: '6' },
            { id: 16, type: 'subtraction', prompt: '12 - 8 = __', answer: '4' },
            { id: 17, type: 'subtraction', prompt: '8 - 4 = __', answer: '4' },
            { id: 18, type: 'subtraction', prompt: '4 - 0 = __', answer: '4' },
            { id: 19, type: 'subtraction', prompt: '5 - 3 = __', answer: '2' },
            { id: 20, type: 'subtraction', prompt: '12 - 2 = __', answer: '10' },
            { id: 21, type: 'subtraction', prompt: '11 - 5 = __', answer: '6' },
            { id: 22, type: 'subtraction', prompt: '15 - 5 = __', answer: '10' },
            { id: 23, type: 'subtraction', prompt: '20 - 19 = __', answer: '1' },
            { id: 24, type: 'subtraction', prompt: '19 - 6 = __', answer: '13' }
        ]);
        for (const p of s) expect(Number(p.answer)).toBeGreaterThanOrEqual(0);
    });

    it('missing number matches the exact sheet (hidden addend always >= 0)', () => {
        const s = sheet(g1, 'missing');
        expect(s).toEqual([
            { id: 1, type: 'missing', prompt: '1 + __ = 5', answer: '4' },
            { id: 2, type: 'missing', prompt: '2 + __ = 3', answer: '1' },
            { id: 3, type: 'missing', prompt: '__ + 3 = 7', answer: '4' },
            { id: 4, type: 'missing', prompt: '10 + __ = 19', answer: '9' },
            { id: 5, type: 'missing', prompt: '__ + 16 = 19', answer: '3' },
            { id: 6, type: 'missing', prompt: '14 + __ = 18', answer: '4' },
            { id: 7, type: 'missing', prompt: '9 + __ = 18', answer: '9' },
            { id: 8, type: 'missing', prompt: '1 + __ = 12', answer: '11' },
            { id: 9, type: 'missing', prompt: '0 + __ = 6', answer: '6' },
            { id: 10, type: 'missing', prompt: '__ + 12 = 14', answer: '2' },
            { id: 11, type: 'missing', prompt: '12 + __ = 18', answer: '6' },
            { id: 12, type: 'missing', prompt: '7 + __ = 13', answer: '6' },
            { id: 13, type: 'missing', prompt: '9 + __ = 17', answer: '8' },
            { id: 14, type: 'missing', prompt: '8 + __ = 14', answer: '6' },
            { id: 15, type: 'missing', prompt: '1 + __ = 1', answer: '0' },
            { id: 16, type: 'missing', prompt: '__ + 11 = 15', answer: '4' }
        ]);
        for (const p of s) expect(Number(p.answer)).toBeGreaterThanOrEqual(0);
    });

    it('comparison matches the exact sheet (sign is always correct)', () => {
        const s = sheet(g1, 'comparison');
        expect(s).toHaveLength(24);
        // Verify each printed sign is the correct comparison of the two operands.
        for (const p of s) {
            const m = p.prompt.match(/^(\d+) __ (\d+)$/);
            expect(m).not.toBeNull();
            const a = Number(m![1]);
            const b = Number(m![2]);
            const expected = a > b ? '>' : a < b ? '<' : '=';
            expect(p.answer).toBe(expected);
        }
        expect(s[0]).toEqual({ id: 1, type: 'comparison', prompt: '2 __ 11', answer: '<' });
    });

    it('skip counting matches the exact sheet (4th term is a valid count-on)', () => {
        const s = sheet(g1, 'skip');
        expect(s).toEqual([
            { id: 1, type: 'skip', prompt: '10, 20, 30, __', answer: '40' },
            { id: 2, type: 'skip', prompt: '10, 20, 30, __', answer: '40' },
            { id: 3, type: 'skip', prompt: '10, 20, 30, __', answer: '40' },
            { id: 4, type: 'skip', prompt: '5, 10, 15, __', answer: '20' },
            { id: 5, type: 'skip', prompt: '5, 10, 15, __', answer: '20' },
            { id: 6, type: 'skip', prompt: '5, 10, 15, __', answer: '20' },
            { id: 7, type: 'skip', prompt: '2, 4, 6, __', answer: '8' },
            { id: 8, type: 'skip', prompt: '2, 4, 6, __', answer: '8' },
            { id: 9, type: 'skip', prompt: '10, 20, 30, __', answer: '40' },
            { id: 10, type: 'skip', prompt: '5, 10, 15, __', answer: '20' },
            { id: 11, type: 'skip', prompt: '2, 4, 6, __', answer: '8' },
            { id: 12, type: 'skip', prompt: '5, 10, 15, __', answer: '20' },
            { id: 13, type: 'skip', prompt: '2, 4, 6, __', answer: '8' },
            { id: 14, type: 'skip', prompt: '5, 10, 15, __', answer: '20' },
            { id: 15, type: 'skip', prompt: '5, 10, 15, __', answer: '20' },
            { id: 16, type: 'skip', prompt: '2, 4, 6, __', answer: '8' }
        ]);
        // The answer must be the 4th term (3rd shown term + interval).
        for (const p of s) {
            const terms = p.prompt.split(', ').map((t) => Number(t.replace('__', '')));
            const interval = terms[1] - terms[0];
            const expected = terms[2] + interval;
            expect(Number(p.answer)).toBe(expected);
        }
    });

    it('word problems match the exact sheet (single-step, non-negative answer)', () => {
        const s = sheet(g1, 'word');
        expect(s).toEqual([
            {
                id: 1,
                type: 'word',
                prompt: 'Sam had 11 cookies. Sam gave 1 cookies to a friend. How many cookies does Sam have left?',
                answer: '10'
            },
            {
                id: 2,
                type: 'word',
                prompt: 'Mia had 5 stickers. Mia gave 3 stickers to a friend. How many stickers does Mia have left?',
                answer: '2'
            },
            {
                id: 3,
                type: 'word',
                prompt: 'Sam had 19 flowers. Sam gave 18 flowers to a friend. How many flowers does Sam have left?',
                answer: '1'
            },
            {
                id: 4,
                type: 'word',
                prompt: 'Sam had 7 toys. Sam gave 6 toys to a friend. How many toys does Sam have left?',
                answer: '1'
            },
            {
                id: 5,
                type: 'word',
                prompt: 'Zoe has 7 crayons. Kai has 1 crayons. How many crayons are there in total?',
                answer: '8'
            },
            {
                id: 6,
                type: 'word',
                prompt: 'Rae had 13 balloons. Rae gave 8 balloons to a friend. How many balloons does Rae have left?',
                answer: '5'
            },
            {
                id: 7,
                type: 'word',
                prompt: 'Leo has 16 flowers. Tom has 2 flowers. How many flowers are there in total?',
                answer: '18'
            },
            {
                id: 8,
                type: 'word',
                prompt: 'Zoe has 13 balloons. Sam has 4 balloons. How many balloons are there in total?',
                answer: '17'
            },
            {
                id: 9,
                type: 'word',
                prompt: 'Tom had 4 cars. Tom gave 2 cars to a friend. How many cars does Tom have left?',
                answer: '2'
            },
            {
                id: 10,
                type: 'word',
                prompt: 'Leo had 20 crayons. Leo gave 10 crayons to a friend. How many crayons does Leo have left?',
                answer: '10'
            }
        ]);
    });

    it('counting matches the exact sheet', () => {
        const s = sheet(g1, 'counting');
        expect(s).toEqual([
            { id: 1, type: 'counting', prompt: '__, 16, 17', answer: '15' },
            { id: 2, type: 'counting', prompt: '0, 1, __', answer: '2' },
            { id: 3, type: 'counting', prompt: '15, 16, __', answer: '17' },
            { id: 4, type: 'counting', prompt: '__, 10, 11', answer: '9' },
            { id: 5, type: 'counting', prompt: '14, 15, __', answer: '16' },
            { id: 6, type: 'counting', prompt: '__, 19, 20', answer: '18' },
            { id: 7, type: 'counting', prompt: '14, 15, __', answer: '16' },
            { id: 8, type: 'counting', prompt: '14, 15, __', answer: '16' },
            { id: 9, type: 'counting', prompt: '16, 17, __', answer: '18' },
            { id: 10, type: 'counting', prompt: '__, 16, 17', answer: '15' },
            { id: 11, type: 'counting', prompt: '0, 1, __', answer: '2' },
            { id: 12, type: 'counting', prompt: '__, 9, 10', answer: '8' },
            { id: 13, type: 'counting', prompt: '__, 19, 20', answer: '18' },
            { id: 14, type: 'counting', prompt: '__, 1, 2', answer: '0' },
            { id: 15, type: 'counting', prompt: '__, 3, 4', answer: '2' },
            { id: 16, type: 'counting', prompt: '5, 6, __', answer: '7' },
            { id: 17, type: 'counting', prompt: '__, 18, 19', answer: '17' },
            { id: 18, type: 'counting', prompt: '__, 1, 2', answer: '0' }
        ]);
    });
});

describe('generateSheet — Year 2 (bigger numbers)', () => {
    it('addition stays within the within-100 cap', () => {
        const s = sheet(g2, 'addition');
        expect(s).toHaveLength(24);
        for (const p of s) expect(Number(p.answer)).toBeLessThanOrEqual(100);
        expect(s[0]).toEqual({ id: 1, type: 'addition', prompt: '45 + 41 = __', answer: '86' });
    });

    it('subtraction has no negative results within 100', () => {
        const s = sheet(g2, 'subtraction');
        for (const p of s) {
            expect(Number(p.answer)).toBeGreaterThanOrEqual(0);
            expect(Number(p.answer)).toBeLessThanOrEqual(100);
        }
    });

    it('multiplication matches the exact Grade 2 times-tables sheet (operands <= 10)', () => {
        const s = sheet(g2, 'mult');
        expect(s).toEqual([
            { id: 1, type: 'mult', prompt: '5 × 10 = __', answer: '50' },
            { id: 2, type: 'mult', prompt: '9 × 7 = __', answer: '63' },
            { id: 3, type: 'mult', prompt: '9 × 9 = __', answer: '81' },
            { id: 4, type: 'mult', prompt: '6 × 7 = __', answer: '42' },
            { id: 5, type: 'mult', prompt: '6 × 1 = __', answer: '6' },
            { id: 6, type: 'mult', prompt: '9 × 5 = __', answer: '45' },
            { id: 7, type: 'mult', prompt: '3 × 4 = __', answer: '12' },
            { id: 8, type: 'mult', prompt: '5 × 5 = __', answer: '25' },
            { id: 9, type: 'mult', prompt: '9 × 7 = __', answer: '63' },
            { id: 10, type: 'mult', prompt: '10 × 10 = __', answer: '100' },
            { id: 11, type: 'mult', prompt: '10 × 3 = __', answer: '30' },
            { id: 12, type: 'mult', prompt: '2 × 4 = __', answer: '8' },
            { id: 13, type: 'mult', prompt: '10 × 6 = __', answer: '60' },
            { id: 14, type: 'mult', prompt: '2 × 5 = __', answer: '10' },
            { id: 15, type: 'mult', prompt: '8 × 2 = __', answer: '16' },
            { id: 16, type: 'mult', prompt: '1 × 3 = __', answer: '3' },
            { id: 17, type: 'mult', prompt: '9 × 2 = __', answer: '18' },
            { id: 18, type: 'mult', prompt: '3 × 9 = __', answer: '27' },
            { id: 19, type: 'mult', prompt: '9 × 2 = __', answer: '18' },
            { id: 20, type: 'mult', prompt: '7 × 4 = __', answer: '28' },
            { id: 21, type: 'mult', prompt: '6 × 6 = __', answer: '36' },
            { id: 22, type: 'mult', prompt: '5 × 9 = __', answer: '45' },
            { id: 23, type: 'mult', prompt: '5 × 3 = __', answer: '15' },
            { id: 24, type: 'mult', prompt: '5 × 8 = __', answer: '40' }
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
        const doc = generateDocument(g2, 'mult', seedFrom([2, 'mult', 0]), 2);
        expect(doc.pages).toHaveLength(2);
        expect(doc.total).toBe(48);
        // Pinned head of the page-2 stream (ids 25, 26).
        expect(doc.pages[1].slice(0, 2)).toEqual([
            { id: 25, type: 'mult', prompt: '2 × 9 = __', answer: '18' },
            { id: 26, type: 'mult', prompt: '2 × 10 = __', answer: '20' }
        ]);
        // Page 1 still equals the single-page sheet (stream is one continuous run).
        expect(doc.pages[0]).toEqual(sheet(g2, 'mult'));
    });

    it('returns an empty sheet for mult on a grade that does not offer it', () => {
        // Grade 1 has multCap 0 and no 'mult' in available.
        expect(generateDocument(g1, 'mult', seedFrom([1, 'mult', 0]), 1)).toEqual({ pages: [], total: 0 });
    });
});

describe('generateSheet — availability gating (extension types)', () => {
    it('Prep does not offer any extension type (empty sheets)', () => {
        const ext: MathTypeId[] = ['doubles', 'bonds', 'patterns', 'shapes', 'time', 'measure', 'placevalue', 'data', 'mult', 'division', 'money'];
        for (const t of ext) {
            expect(generateSheet(g0, t, seedFrom([0, t, 0]))).toEqual([]);
        }
    });

    it('Year 1 offers the 8 core extensions but NOT division or money', () => {
        for (const t of ['doubles', 'bonds', 'patterns', 'shapes', 'time', 'measure', 'placevalue', 'data'] as MathTypeId[]) {
            expect(generateSheet(g1, t, seedFrom([1, t, 0]))).toHaveLength(SHEET_COUNTS[t]);
        }
        // Division (equal sharing) and coins & money (V8 Y2) are Year 2-only.
        expect(generateSheet(g1, 'division', seedFrom([1, 'division', 0]))).toEqual([]);
        expect(generateSheet(g1, 'money', seedFrom([1, 'money', 0]))).toEqual([]);
    });
});

describe('generateSheet — Year 1 extension types (researched ACARA scope)', () => {
    // Same pinning strategy as the original types: the whole sheet is pinned
    // to exact prompts/answers from the deterministic generator (seed 0).
    it('doubles & near doubles matches the exact sheet (bases to 10)', () => {
        const s = sheet(g1, 'doubles');
        expect(s).toEqual([
            { id: 1, type: 'doubles', prompt: '4 + 5 = __', answer: '9' },
            { id: 2, type: 'doubles', prompt: 'What is double 6?', answer: '12' },
            { id: 3, type: 'doubles', prompt: '7 + 8 = __', answer: '15' },
            { id: 4, type: 'doubles', prompt: 'What is double 3?', answer: '6' },
            { id: 5, type: 'doubles', prompt: '6 + 6 = __', answer: '12' },
            { id: 6, type: 'doubles', prompt: 'What is double 8?', answer: '16' },
            { id: 7, type: 'doubles', prompt: '4 + 4 = __', answer: '8' },
            { id: 8, type: 'doubles', prompt: '2 + 2 = __', answer: '4' },
            { id: 9, type: 'doubles', prompt: 'What is double 4?', answer: '8' },
            { id: 10, type: 'doubles', prompt: 'What is double 5?', answer: '10' },
            { id: 11, type: 'doubles', prompt: '4 + 4 = __', answer: '8' },
            { id: 12, type: 'doubles', prompt: '3 + 3 = __', answer: '6' },
            { id: 13, type: 'doubles', prompt: 'What is double 5?', answer: '10' },
            { id: 14, type: 'doubles', prompt: 'What is double 9?', answer: '18' },
            { id: 15, type: 'doubles', prompt: '2 + 2 = __', answer: '4' },
            { id: 16, type: 'doubles', prompt: '10 + 10 = __', answer: '20' },
            { id: 17, type: 'doubles', prompt: '7 + 8 = __', answer: '15' },
            { id: 18, type: 'doubles', prompt: 'What is double 2?', answer: '4' },
            { id: 19, type: 'doubles', prompt: 'What is double 9?', answer: '18' },
            { id: 20, type: 'doubles', prompt: '10 + 10 = __', answer: '20' },
            { id: 21, type: 'doubles', prompt: 'What is double 7?', answer: '14' },
            { id: 22, type: 'doubles', prompt: 'What is double 7?', answer: '14' },
            { id: 23, type: 'doubles', prompt: '10 + 10 = __', answer: '20' },
            { id: 24, type: 'doubles', prompt: '5 + 5 = __', answer: '10' }
        ]);
        // Every arithmetic line adds up.
        for (const p of s) {
            const m = p.prompt.match(/^(\d+) \+ (\d+) = __$/);
            if (m) expect(p.answer).toBe(`${Number(m[1]) + Number(m[2])}`);
        }
    });

    it('number bonds match the exact sheet (part-part-whole to 10, no zero parts)', () => {
        const s = sheet(g1, 'bonds');
        expect(s).toEqual([
            { id: 1, type: 'bonds', prompt: '4 + __ = 10', answer: '6' },
            { id: 2, type: 'bonds', prompt: '4 + __ = 10', answer: '6' },
            { id: 3, type: 'bonds', prompt: '__ and 1 make 10', answer: '9' },
            { id: 4, type: 'bonds', prompt: '__ + 2 = 10', answer: '8' },
            { id: 5, type: 'bonds', prompt: '9 + __ = 10', answer: '1' },
            { id: 6, type: 'bonds', prompt: '__ and 5 make 10', answer: '5' },
            { id: 7, type: 'bonds', prompt: '__ + 1 = 10', answer: '9' },
            { id: 8, type: 'bonds', prompt: '__ + 7 = 10', answer: '3' },
            { id: 9, type: 'bonds', prompt: '6 + __ = 10', answer: '4' },
            { id: 10, type: 'bonds', prompt: '__ + 4 = 10', answer: '6' },
            { id: 11, type: 'bonds', prompt: '1 + __ = 10', answer: '9' },
            { id: 12, type: 'bonds', prompt: '__ + 3 = 10', answer: '7' },
            { id: 13, type: 'bonds', prompt: '4 + __ = 10', answer: '6' },
            { id: 14, type: 'bonds', prompt: '9 + __ = 10', answer: '1' },
            { id: 15, type: 'bonds', prompt: '__ + 2 = 10', answer: '8' },
            { id: 16, type: 'bonds', prompt: '3 + __ = 10', answer: '7' },
            { id: 17, type: 'bonds', prompt: '__ and 7 make 10', answer: '3' },
            { id: 18, type: 'bonds', prompt: '2 + __ = 10', answer: '8' },
            { id: 19, type: 'bonds', prompt: '__ + 8 = 10', answer: '2' },
            { id: 20, type: 'bonds', prompt: '5 + __ = 10', answer: '5' },
            { id: 21, type: 'bonds', prompt: '3 + __ = 10', answer: '7' },
            { id: 22, type: 'bonds', prompt: '1 + __ = 10', answer: '9' },
            { id: 23, type: 'bonds', prompt: '__ + 3 = 10', answer: '7' },
            { id: 24, type: 'bonds', prompt: '__ + 8 = 10', answer: '2' }
        ]);
        // Every bond total is exactly 10 in Year 1 and both parts are non-zero.
        for (const p of s) {
            expect(p.prompt.includes('make 10') || p.prompt.includes('= 10')).toBe(true);
            expect(Number(p.answer)).toBeGreaterThanOrEqual(1);
            expect(Number(p.answer)).toBeLessThanOrEqual(9);
        }
    });

    it('patterns match the exact sheet (count-on with gaps + repeating word cycles)', () => {
        const s = sheet(g1, 'patterns');
        expect(s).toEqual([
            { id: 1, type: 'patterns', prompt: 'frog, pig, bird, frog, pig, __', answer: 'bird' },
            { id: 2, type: 'patterns', prompt: 'fish, duck, fish, duck, fish, __', answer: 'duck' },
            { id: 3, type: 'patterns', prompt: '35, 37, __, 41, 43', answer: '39' },
            { id: 4, type: 'patterns', prompt: 'yellow, red, yellow, red, yellow, __', answer: 'red' },
            { id: 5, type: 'patterns', prompt: '20, 22, __, 26, 28', answer: '24' },
            { id: 6, type: 'patterns', prompt: '6, 16, 26, __', answer: '36' },
            { id: 7, type: 'patterns', prompt: '34, 35, 36, __', answer: '37' },
            { id: 8, type: 'patterns', prompt: '14, 24, 34, __', answer: '44' },
            { id: 9, type: 'patterns', prompt: '34, 35, __, 37, 38', answer: '36' },
            { id: 10, type: 'patterns', prompt: '16, 17, 18, __', answer: '19' },
            { id: 11, type: 'patterns', prompt: 'diamond, cross, diamond, cross, diamond, __', answer: 'cross' },
            { id: 12, type: 'patterns', prompt: 'red, green, red, green, red, __', answer: 'green' },
            { id: 13, type: 'patterns', prompt: '5, 15, __, 35, 45', answer: '25' },
            { id: 14, type: 'patterns', prompt: '10, 12, 14, __', answer: '16' },
            { id: 15, type: 'patterns', prompt: '40, 41, __, 43, 44', answer: '42' },
            { id: 16, type: 'patterns', prompt: '37, 39, 41, __', answer: '43' }
        ]);
        // Numeric pattern lines keep a constant step; the blank always resolves to the
        // term immediately before it advanced by that step, whether the gap sits in the
        // middle of the row or at its end ('__' maps to NaN so its index can be located).
        for (const p of s) {
            if (/^\d/.test(p.prompt)) {
                const terms = p.prompt.split(', ').map((t) => (t === '__' ? NaN : Number(t)));
                const gap = terms.findIndex(Number.isNaN);
                expect(gap).toBeGreaterThan(0);
                expect(Number(p.answer)).toBe(terms[gap - 1] + (terms[1] - terms[0]));
            }
        }
    });

    it('shapes match the exact sheet (2-D sides/corners + 3-D flat faces)', () => {
        const s = sheet(g1, 'shapes');
        expect(s).toEqual([
            { id: 1, type: 'shapes', prompt: 'Which of these 3-D objects has only flat faces? (cube, cylinder, sphere)', answer: 'cube' },
            { id: 2, type: 'shapes', prompt: 'Which of these 3-D objects has only flat faces? (cube, sphere, cylinder)', answer: 'cube' },
            { id: 3, type: 'shapes', prompt: 'How many sides does a triangle have?', answer: '3' },
            { id: 4, type: 'shapes', prompt: 'Which of these 3-D objects has only flat faces? (cube, sphere, cylinder)', answer: 'cube' },
            { id: 5, type: 'shapes', prompt: 'How many corners does a rectangle have?', answer: '4' },
            { id: 6, type: 'shapes', prompt: 'How many corners does a square have?', answer: '4' },
            { id: 7, type: 'shapes', prompt: 'How many corners does a triangle have?', answer: '3' },
            { id: 8, type: 'shapes', prompt: 'How many sides does a triangle have?', answer: '3' },
            { id: 9, type: 'shapes', prompt: 'How many corners does an oval have?', answer: '0' },
            { id: 10, type: 'shapes', prompt: 'How many sides does a rectangle have?', answer: '4' },
            { id: 11, type: 'shapes', prompt: 'How many corners does a triangle have?', answer: '3' },
            { id: 12, type: 'shapes', prompt: 'Which of these 3-D objects has only flat faces? (cube, cylinder, sphere)', answer: 'cube' },
            { id: 13, type: 'shapes', prompt: 'How many corners does a triangle have?', answer: '3' },
            { id: 14, type: 'shapes', prompt: 'Which of these 3-D objects has only flat faces? (cube, cylinder, sphere)', answer: 'cube' },
            { id: 15, type: 'shapes', prompt: 'Which 2-D shape has 0 corners? (triangle, circle, square)', answer: 'circle' },
            { id: 16, type: 'shapes', prompt: 'How many corners does a triangle have?', answer: '3' }
        ]);
        // Year 1's shape set has exactly one all-flat 3-D object (the cube), so
        // every "only flat faces" answer in a Y1 sheet must be the cube.
        for (const p of s) {
            if (p.prompt.startsWith('Which of these 3-D')) expect(p.answer).toBe('cube');
        }
    });

    it('time matches the exact sheet (days/months/seasons; no clocks in Year 1)', () => {
        const s = sheet(g1, 'time');
        expect(s).toEqual([
            { id: 1, type: 'time', prompt: 'If today is Tuesday, what day is tomorrow?', answer: 'Wednesday' },
            { id: 2, type: 'time', prompt: 'What day comes after Friday?', answer: 'Saturday' },
            { id: 3, type: 'time', prompt: 'If today is Wednesday, how many days is it until Friday?', answer: '2' },
            { id: 4, type: 'time', prompt: 'How many months are in a year?', answer: '12' },
            { id: 5, type: 'time', prompt: 'If today is Thursday, how many days is it until Friday?', answer: '1' },
            { id: 6, type: 'time', prompt: 'What season comes after winter?', answer: 'spring' },
            { id: 7, type: 'time', prompt: 'What month comes after April?', answer: 'May' },
            { id: 8, type: 'time', prompt: 'What day comes before Thursday?', answer: 'Wednesday' },
            { id: 9, type: 'time', prompt: 'What day comes after Saturday?', answer: 'Sunday' },
            { id: 10, type: 'time', prompt: 'What month comes after June?', answer: 'July' },
            { id: 11, type: 'time', prompt: 'If today is Tuesday, how many days is it until Sunday?', answer: '5' },
            { id: 12, type: 'time', prompt: 'What day comes after Saturday?', answer: 'Sunday' },
            { id: 13, type: 'time', prompt: 'What day comes before Tuesday?', answer: 'Monday' },
            { id: 14, type: 'time', prompt: 'If today is Thursday, what day was yesterday?', answer: 'Wednesday' },
            { id: 15, type: 'time', prompt: 'What day comes before Saturday?', answer: 'Friday' },
            { id: 16, type: 'time', prompt: 'If today is Tuesday, how many days is it until Saturday?', answer: '4' }
        ]);
        // Year 1 (clockCap 0) can never produce clock-time items.
        for (const p of s) {
            expect(p.prompt.includes("o'clock")).toBe(false);
            expect(p.prompt.includes('half past')).toBe(false);
        }
    });

    it('measure matches the exact sheet (informal comparisons only in Year 1)', () => {
        const s = sheet(g1, 'measure');
        expect(s).toEqual([
            { id: 1, type: 'measure', prompt: 'Which is longer: the notebook or the door?', answer: 'door' },
            { id: 2, type: 'measure', prompt: 'Which holds more: the water bottle or the cup?', answer: 'water bottle' },
            { id: 3, type: 'measure', prompt: 'Which is heavier: the pencil or the cat?', answer: 'cat' },
            { id: 4, type: 'measure', prompt: 'Which is heavier: the bucket or the cup?', answer: 'bucket' },
            { id: 5, type: 'measure', prompt: 'Which is heavier: the ruler or the pencil?', answer: 'ruler' },
            { id: 6, type: 'measure', prompt: 'Which holds more: the tank or the spoon?', answer: 'tank' },
            { id: 7, type: 'measure', prompt: 'Which is heavier: the pencil or the spoon?', answer: 'pencil' },
            { id: 8, type: 'measure', prompt: 'Which is heavier: the crayon or the apple?', answer: 'apple' },
            { id: 9, type: 'measure', prompt: 'Which holds more: the spoon or the cup?', answer: 'cup' },
            { id: 10, type: 'measure', prompt: 'Which holds more: the cup or the bucket?', answer: 'bucket' },
            { id: 11, type: 'measure', prompt: 'Which is longer: the ruler or the crayon?', answer: 'ruler' },
            { id: 12, type: 'measure', prompt: 'Which is heavier: the pencil or the door?', answer: 'door' }
        ]);
        // Year 1 (metricCap 0) never sees cm/metre items.
        for (const p of s) expect(p.prompt.includes(' cm')).toBe(false);
    });

    it('place value matches the exact sheet (tens & ones to 20 in Year 1)', () => {
        const s = sheet(g1, 'placevalue');
        expect(s).toEqual([
            { id: 1, type: 'placevalue', prompt: 'What number is 1 ten and 9 ones?', answer: '19' },
            { id: 2, type: 'placevalue', prompt: 'How many ones are in 10?', answer: '0' },
            { id: 3, type: 'placevalue', prompt: 'How many tens are in 10?', answer: '1' },
            { id: 4, type: 'placevalue', prompt: 'How many ones are in 18?', answer: '8' },
            { id: 5, type: 'placevalue', prompt: 'How many ones are in 14?', answer: '4' },
            { id: 6, type: 'placevalue', prompt: 'How many tens are in 14?', answer: '1' },
            { id: 7, type: 'placevalue', prompt: 'How many tens are in 15?', answer: '1' },
            { id: 8, type: 'placevalue', prompt: 'What number is 2 tens and 0 ones?', answer: '20' },
            { id: 9, type: 'placevalue', prompt: 'How many ones are in 16?', answer: '6' },
            { id: 10, type: 'placevalue', prompt: 'What number is 2 tens and 0 ones?', answer: '20' },
            { id: 11, type: 'placevalue', prompt: 'How many tens are in 12?', answer: '1' },
            { id: 12, type: 'placevalue', prompt: 'How many tens and ones make 18?', answer: '1 ten and 8 ones' },
            { id: 13, type: 'placevalue', prompt: 'How many tens and ones make 12?', answer: '1 ten and 2 ones' },
            { id: 14, type: 'placevalue', prompt: 'How many tens and ones make 14?', answer: '1 ten and 4 ones' },
            { id: 15, type: 'placevalue', prompt: 'How many tens are in 12?', answer: '1' },
            { id: 16, type: 'placevalue', prompt: 'How many tens and ones make 15?', answer: '1 ten and 5 ones' }
        ]);
    });

    it('data & tally match the exact sheet (tallies, picture & column graphs)', () => {
        const s = sheet(g1, 'data');
        expect(s).toEqual([
            { id: 1, type: 'data', prompt: `In a column graph, each square is 1 vote. Mia's bar is 3 squares tall and Rae's bar is 2 squares tall. How many more votes did Mia get?`, answer: '1' },
            { id: 2, type: 'data', prompt: 'Count the tallies: ||||/ | | | — how many in all?', answer: '8' },
            { id: 3, type: 'data', prompt: 'In a picture graph, 1 star = 3 stickers. How many stickers do ★★★★ show?', answer: '12' },
            { id: 4, type: 'data', prompt: 'Count the tallies: ||||/ ||||/ | — how many in all?', answer: '11' },
            { id: 5, type: 'data', prompt: 'In a picture graph, 1 star = 1 flower. How many flowers do ★★★★★★ show?', answer: '6' },
            { id: 6, type: 'data', prompt: `In a column graph, each square is 1 vote. Zoe's bar is 10 squares tall and Kai's bar is 5 squares tall. How many more votes did Zoe get?`, answer: '5' },
            { id: 7, type: 'data', prompt: 'In a picture graph, 1 star = 1 car. How many cars do ★★★★★★ show?', answer: '6' },
            { id: 8, type: 'data', prompt: 'In a picture graph, 1 star = 1 cookie. How many cookies do ★★ show?', answer: '2' },
            { id: 9, type: 'data', prompt: `In a column graph, each square is 1 vote. Leo's bar is 9 squares tall and Max's bar is 8 squares tall. How many more votes did Leo get?`, answer: '1' },
            { id: 10, type: 'data', prompt: 'Count the tallies: ||||/ ||||/ ||||/ ||||/ — how many in all?', answer: '20' },
            { id: 11, type: 'data', prompt: 'Count the tallies: | | | — how many in all?', answer: '3' },
            { id: 12, type: 'data', prompt: 'In a picture graph, 1 star = 1 toy. How many toys do ★★★★★★ show?', answer: '6' },
            { id: 13, type: 'data', prompt: 'Count the tallies: ||||/ ||||/ ||||/ | — how many in all?', answer: '16' },
            { id: 14, type: 'data', prompt: 'In a picture graph, 1 star = 1 crayon. How many crayons do ★★ show?', answer: '2' },
            { id: 15, type: 'data', prompt: 'In a picture graph, 1 star = 1 car. How many cars do ★★ show?', answer: '2' },
            { id: 16, type: 'data', prompt: 'In a picture graph, 1 star = 3 crayons. How many crayons do ★★★★ show?', answer: '12' },
            { id: 17, type: 'data', prompt: 'In a picture graph, 1 star = 2 cookies. How many cookies do ★★★★ show?', answer: '8' },
            { id: 18, type: 'data', prompt: 'Count the tallies: ||||/ ||||/ | — how many in all?', answer: '11' }
        ]);
    });
});

describe('generateSheet — Year 2 extension types (bigger scope, clocks, cm, coins)', () => {
    it('doubles & near doubles match the exact sheet (bases to 20)', () => {
        const s = sheet(g2, 'doubles');
        expect(s).toEqual([
            { id: 1, type: 'doubles', prompt: '13 + 13 = __', answer: '26' },
            { id: 2, type: 'doubles', prompt: '11 + 11 = __', answer: '22' },
            { id: 3, type: 'doubles', prompt: 'What is double 16?', answer: '32' },
            { id: 4, type: 'doubles', prompt: '4 + 5 = __', answer: '9' },
            { id: 5, type: 'doubles', prompt: '8 + 9 = __', answer: '17' },
            { id: 6, type: 'doubles', prompt: 'What is double 11?', answer: '22' },
            { id: 7, type: 'doubles', prompt: '18 + 19 = __', answer: '37' },
            { id: 8, type: 'doubles', prompt: 'What is double 2?', answer: '4' },
            { id: 9, type: 'doubles', prompt: '5 + 5 = __', answer: '10' },
            { id: 10, type: 'doubles', prompt: 'What is double 16?', answer: '32' },
            { id: 11, type: 'doubles', prompt: 'What is double 18?', answer: '36' },
            { id: 12, type: 'doubles', prompt: '8 + 8 = __', answer: '16' },
            { id: 13, type: 'doubles', prompt: '16 + 17 = __', answer: '33' },
            { id: 14, type: 'doubles', prompt: '13 + 13 = __', answer: '26' },
            { id: 15, type: 'doubles', prompt: '13 + 13 = __', answer: '26' },
            { id: 16, type: 'doubles', prompt: 'What is double 10?', answer: '20' },
            { id: 17, type: 'doubles', prompt: '1 + 2 = __', answer: '3' },
            { id: 18, type: 'doubles', prompt: '5 + 6 = __', answer: '11' },
            { id: 19, type: 'doubles', prompt: '3 + 3 = __', answer: '6' },
            { id: 20, type: 'doubles', prompt: 'What is double 11?', answer: '22' },
            { id: 21, type: 'doubles', prompt: 'What is double 2?', answer: '4' },
            { id: 22, type: 'doubles', prompt: '6 + 6 = __', answer: '12' },
            { id: 23, type: 'doubles', prompt: '2 + 3 = __', answer: '5' },
            { id: 24, type: 'doubles', prompt: '5 + 5 = __', answer: '10' }
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

    it('number bonds match the exact sheet (part-part-whole to 10 & 20)', () => {
        const s = sheet(g2, 'bonds');
        expect(s).toEqual([
            { id: 1, type: 'bonds', prompt: '__ and 4 make 20', answer: '16' },
            { id: 2, type: 'bonds', prompt: '13 + __ = 20', answer: '7' },
            { id: 3, type: 'bonds', prompt: '__ and 4 make 20', answer: '16' },
            { id: 4, type: 'bonds', prompt: '__ and 2 make 20', answer: '18' },
            { id: 5, type: 'bonds', prompt: '__ + 13 = 20', answer: '7' },
            { id: 6, type: 'bonds', prompt: '19 + __ = 20', answer: '1' },
            { id: 7, type: 'bonds', prompt: '__ and 13 make 20', answer: '7' },
            { id: 8, type: 'bonds', prompt: '__ and 3 make 10', answer: '7' },
            { id: 9, type: 'bonds', prompt: '__ + 8 = 10', answer: '2' },
            { id: 10, type: 'bonds', prompt: '__ + 7 = 10', answer: '3' },
            { id: 11, type: 'bonds', prompt: '__ + 1 = 20', answer: '19' },
            { id: 12, type: 'bonds', prompt: '__ and 2 make 20', answer: '18' },
            { id: 13, type: 'bonds', prompt: '__ + 9 = 10', answer: '1' },
            { id: 14, type: 'bonds', prompt: '__ + 8 = 10', answer: '2' },
            { id: 15, type: 'bonds', prompt: '6 + __ = 10', answer: '4' },
            { id: 16, type: 'bonds', prompt: '__ + 4 = 10', answer: '6' },
            { id: 17, type: 'bonds', prompt: '3 + __ = 20', answer: '17' },
            { id: 18, type: 'bonds', prompt: '__ and 8 make 20', answer: '12' },
            { id: 19, type: 'bonds', prompt: '19 + __ = 20', answer: '1' },
            { id: 20, type: 'bonds', prompt: '__ + 1 = 10', answer: '9' },
            { id: 21, type: 'bonds', prompt: '__ + 5 = 10', answer: '5' },
            { id: 22, type: 'bonds', prompt: '__ + 18 = 20', answer: '2' },
            { id: 23, type: 'bonds', prompt: '__ + 14 = 20', answer: '6' },
            { id: 24, type: 'bonds', prompt: '1 + __ = 10', answer: '9' }
        ]);
        // Year 2 bonds target 10 or 20 (both parts non-zero). The totals appear either after
        // 'make ' or after '= ', so a space must be allowed between the two markers.
        for (const p of s) {
            const m = p.prompt.match(/(make|=\s)\s*(10|20)\b/);
            expect(m).not.toBeNull();
        }
    });

    it('patterns match the exact sheet (steps 1,2,3,4,5,10 up to 100)', () => {
        const s = sheet(g2, 'patterns');
        expect(s).toEqual([
            { id: 1, type: 'patterns', prompt: '73, 75, 77, __', answer: '79' },
            { id: 2, type: 'patterns', prompt: '71, 72, __, 74, 75', answer: '73' },
            { id: 3, type: 'patterns', prompt: '9, 14, __, 24, 29', answer: '19' },
            { id: 4, type: 'patterns', prompt: 'square, star, circle, square, star, __', answer: 'circle' },
            { id: 5, type: 'patterns', prompt: '25, 28, 31, __', answer: '34' },
            { id: 6, type: 'patterns', prompt: 'white, red, yellow, white, red, __', answer: 'yellow' },
            { id: 7, type: 'patterns', prompt: '12, 22, 32, __', answer: '42' },
            { id: 8, type: 'patterns', prompt: '59, 62, 65, __', answer: '68' },
            { id: 9, type: 'patterns', prompt: 'green, orange, red, green, orange, __', answer: 'red' },
            { id: 10, type: 'patterns', prompt: '77, 78, 79, __', answer: '80' },
            { id: 11, type: 'patterns', prompt: '60, 63, __, 69, 72', answer: '66' },
            { id: 12, type: 'patterns', prompt: '2, 6, __, 14, 18', answer: '10' },
            { id: 13, type: 'patterns', prompt: 'cross, diamond, cross, diamond, cross, __', answer: 'diamond' },
            { id: 14, type: 'patterns', prompt: '78, 79, __, 81, 82', answer: '80' },
            { id: 15, type: 'patterns', prompt: '1, 6, 11, __', answer: '16' },
            { id: 16, type: 'patterns', prompt: '80, 82, 84, __', answer: '86' }
        ]);
        // Numeric pattern lines keep a constant step; the blank resolves exactly to the
        // previous term plus the step (mirrors the Year 1 check within skipCap 100).
        for (const p of s) {
            if (/^\d/.test(p.prompt)) {
                const terms = p.prompt.split(', ').map((t) => (t === '__' ? NaN : Number(t)));
                const gap = terms.findIndex(Number.isNaN);
                expect(gap).toBeGreaterThan(0);
                expect(Number(p.answer)).toBe(terms[gap - 1] + (terms[1] - terms[0]));
            }
        }
    });

    it('shapes match the exact sheet (Y2 adds hexagon, prism, pyramid, cone)', () => {
        const s = sheet(g2, 'shapes');
        expect(s).toEqual([
            { id: 1, type: 'shapes', prompt: 'How many sides does a rectangle have?', answer: '4' },
            { id: 2, type: 'shapes', prompt: 'Which of these 3-D objects has only flat faces? (pyramid, prism, cube)', answer: 'pyramid' },
            { id: 3, type: 'shapes', prompt: 'How many flat faces does a sphere have?', answer: '0' },
            { id: 4, type: 'shapes', prompt: 'How many sides does a hexagon have?', answer: '6' },
            { id: 5, type: 'shapes', prompt: 'Which 2-D shape has 0 corners? (square, oval, rectangle)', answer: 'oval' },
            { id: 6, type: 'shapes', prompt: 'How many sides does a triangle have?', answer: '3' },
            { id: 7, type: 'shapes', prompt: 'How many corners does a triangle have?', answer: '3' },
            { id: 8, type: 'shapes', prompt: 'How many sides does a triangle have?', answer: '3' },
            { id: 9, type: 'shapes', prompt: 'Which of these 3-D objects has only flat faces? (cube, pyramid, prism)', answer: 'cube' },
            { id: 10, type: 'shapes', prompt: 'Which 2-D shape has 3 corners? (hexagon, triangle, square)', answer: 'triangle' },
            { id: 11, type: 'shapes', prompt: 'Which of these 3-D objects has only flat faces? (prism, pyramid, sphere)', answer: 'prism' },
            { id: 12, type: 'shapes', prompt: 'Which 2-D shape has 0 corners? (rectangle, oval, triangle)', answer: 'oval' },
            { id: 13, type: 'shapes', prompt: 'How many sides does a triangle have?', answer: '3' },
            { id: 14, type: 'shapes', prompt: 'How many corners does a rectangle have?', answer: '4' },
            { id: 15, type: 'shapes', prompt: 'How many sides does a hexagon have?', answer: '6' },
            { id: 16, type: 'shapes', prompt: 'How many corners does an oval have?', answer: '0' }
        ]);
        // "Only flat faces" answers are exactly the non-curved 3-D solids.
        for (const p of s) {
            if (p.prompt.startsWith('Which of these 3-D')) {
                expect(['cube', 'prism', 'pyramid']).toContain(p.answer);
            }
        }
    });

    it('time matches the exact sheet (Y2 adds clock time to the hour & half-paste)', () => {
        const s = sheet(g2, 'time');
        expect(s).toEqual([
            { id: 1, type: 'time', prompt: `It is 5 o'clock now. What time is it 1 hour later?`, answer: `6 o'clock` },
            { id: 2, type: 'time', prompt: 'What month comes after February?', answer: 'March' },
            { id: 3, type: 'time', prompt: 'If today is Monday, how many days is it until Friday?', answer: '4' },
            { id: 4, type: 'time', prompt: 'How many days are in a year?', answer: '365' },
            { id: 5, type: 'time', prompt: 'If today is Friday, what day was yesterday?', answer: 'Thursday' },
            { id: 6, type: 'time', prompt: 'If today is Saturday, what day is tomorrow?', answer: 'Sunday' },
            { id: 7, type: 'time', prompt: 'It is half past 1 now. What time is it one hour later?', answer: 'half past 2' },
            { id: 8, type: 'time', prompt: 'What month comes after June?', answer: 'July' },
            { id: 9, type: 'time', prompt: 'If today is Wednesday, what day was yesterday?', answer: 'Tuesday' },
            { id: 10, type: 'time', prompt: 'How many days are in a year?', answer: '365' },
            { id: 11, type: 'time', prompt: 'How many days are in a year?', answer: '365' },
            { id: 12, type: 'time', prompt: 'If today is Thursday, how many days is it until Friday?', answer: '1' },
            { id: 13, type: 'time', prompt: 'What day comes after Thursday?', answer: 'Friday' },
            { id: 14, type: 'time', prompt: 'What day comes before Wednesday?', answer: 'Tuesday' },
            { id: 15, type: 'time', prompt: 'It is half past 11 now. What time is it one hour later?', answer: 'half past 12' },
            { id: 16, type: 'time', prompt: 'What month comes after March?', answer: 'April' }
        ]);
        // Year 2 (clockCap 12) DOES produce clock items on this seeded sheet.
        expect(s.some((p) => p.prompt.includes("o'clock"))).toBe(true);
    });

    it('measure matches the exact sheet (Y2 adds cm + metre comparisons)', () => {
        const s = sheet(g2, 'measure');
        expect(s).toEqual([
            { id: 1, type: 'measure', prompt: 'Which is heavier: the door or the crayon?', answer: 'door' },
            { id: 2, type: 'measure', prompt: 'Which is longer: the finger or the door?', answer: 'door' },
            { id: 3, type: 'measure', prompt: 'A notebook is about 22 cm long. Is it longer or shorter than a metre?', answer: 'shorter' },
            { id: 4, type: 'measure', prompt: 'Which is longer: the pencil or the notebook?', answer: 'notebook' },
            { id: 5, type: 'measure', prompt: 'Which is heavier: the cup or the bucket?', answer: 'bucket' },
            { id: 6, type: 'measure', prompt: 'Which holds more: the bucket or the water bottle?', answer: 'bucket' },
            { id: 7, type: 'measure', prompt: 'Which holds more: the water bottle or the bucket?', answer: 'bucket' },
            { id: 8, type: 'measure', prompt: 'A table is about 75 cm long. A pencil is about 15 cm long. About how many pencils long is a table?', answer: '5' },
            { id: 9, type: 'measure', prompt: 'A finger is about 5 cm long. Is it longer or shorter than a metre?', answer: 'shorter' },
            { id: 10, type: 'measure', prompt: 'Which is longer: the crayon or the pencil?', answer: 'pencil' },
            { id: 11, type: 'measure', prompt: 'Which is heavier: the ruler or the door?', answer: 'door' },
            { id: 12, type: 'measure', prompt: 'Which is longer: the ruler or the finger?', answer: 'ruler' }
        ]);
    });

    it('place value matches the exact sheet (tens & ones to 99 in Year 2)', () => {
        const s = sheet(g2, 'placevalue');
        expect(s).toEqual([
            { id: 1, type: 'placevalue', prompt: 'How many tens and ones make 45?', answer: '4 tens and 5 ones' },
            { id: 2, type: 'placevalue', prompt: 'How many ones are in 38?', answer: '8' },
            { id: 3, type: 'placevalue', prompt: 'How many tens and ones make 69?', answer: '6 tens and 9 ones' },
            { id: 4, type: 'placevalue', prompt: 'How many tens and ones make 73?', answer: '7 tens and 3 ones' },
            { id: 5, type: 'placevalue', prompt: 'What number is 9 tens and 8 ones?', answer: '98' },
            { id: 6, type: 'placevalue', prompt: 'How many tens are in 61?', answer: '6' },
            { id: 7, type: 'placevalue', prompt: 'How many tens and ones make 96?', answer: '9 tens and 6 ones' },
            { id: 8, type: 'placevalue', prompt: 'What number is 1 ten and 6 ones?', answer: '16' },
            { id: 9, type: 'placevalue', prompt: 'What number is 7 tens and 6 ones?', answer: '76' },
            { id: 10, type: 'placevalue', prompt: 'How many tens are in 16?', answer: '1' },
            { id: 11, type: 'placevalue', prompt: 'How many tens are in 92?', answer: '9' },
            { id: 12, type: 'placevalue', prompt: 'What number is 2 tens and 0 ones?', answer: '20' },
            { id: 13, type: 'placevalue', prompt: 'How many tens and ones make 42?', answer: '4 tens and 2 ones' },
            { id: 14, type: 'placevalue', prompt: 'What number is 1 ten and 1 one?', answer: '11' },
            { id: 15, type: 'placevalue', prompt: 'How many ones are in 48?', answer: '8' },
            { id: 16, type: 'placevalue', prompt: 'How many tens and ones make 76?', answer: '7 tens and 6 ones' }
        ]);
    });

    it('data & tally match the exact sheet (bigger counts to 40)', () => {
        const s = sheet(g2, 'data');
        expect(s).toEqual([
            { id: 1, type: 'data', prompt: 'Count the tallies: ||||/ ||||/ | | | — how many in all?', answer: '13' },
            { id: 2, type: 'data', prompt: `In a column graph, each square is 1 vote. Mia's bar is 12 squares tall and Tom's bar is 9 squares tall. How many more votes did Mia get?`, answer: '3' },
            { id: 3, type: 'data', prompt: `In a column graph, each square is 1 vote. Leo's bar is 17 squares tall and Max's bar is 14 squares tall. How many more votes did Leo get?`, answer: '3' },
            { id: 4, type: 'data', prompt: 'In a picture graph, 1 star = 2 apples. How many apples do ★★★★ show?', answer: '8' },
            { id: 5, type: 'data', prompt: 'In a picture graph, 1 star = 1 flower. How many flowers do ★ show?', answer: '1' },
            { id: 6, type: 'data', prompt: 'Count the tallies: ||||/ ||||/ ||||/ ||||/ ||||/ ||||/ ||||/ — how many in all?', answer: '35' },
            { id: 7, type: 'data', prompt: 'Count the tallies: ||||/ ||||/ ||||/ ||||/ ||||/ ||||/ ||||/ | | | | — how many in all?', answer: '39' },
            { id: 8, type: 'data', prompt: 'Count the tallies: ||||/ ||||/ ||||/ ||||/ ||||/ ||||/ ||||/ — how many in all?', answer: '35' },
            { id: 9, type: 'data', prompt: 'Count the tallies: ||||/ ||||/ ||||/ ||||/ ||||/ ||||/ | | | | — how many in all?', answer: '34' },
            { id: 10, type: 'data', prompt: 'In a picture graph, 1 star = 1 toy. How many toys do ★★★ show?', answer: '3' },
            { id: 11, type: 'data', prompt: 'In a picture graph, 1 star = 1 cookie. How many cookies do ★★★ show?', answer: '3' },
            { id: 12, type: 'data', prompt: 'Count the tallies: ||||/ ||||/ ||||/ ||||/ ||||/ | | — how many in all?', answer: '27' },
            { id: 13, type: 'data', prompt: 'In a picture graph, 1 star = 3 balloons. How many balloons do ★★★★ show?', answer: '12' },
            { id: 14, type: 'data', prompt: `In a column graph, each square is 1 vote. Rae's bar is 2 squares tall and Max's bar is 1 square tall. How many more votes did Rae get?`, answer: '1' },
            { id: 15, type: 'data', prompt: `In a column graph, each square is 1 vote. Tom's bar is 8 squares tall and Sam's bar is 2 squares tall. How many more votes did Tom get?`, answer: '6' },
            { id: 16, type: 'data', prompt: 'Count the tallies: ||||/ ||||/ ||||/ ||||/ | | | — how many in all?', answer: '23' },
            { id: 17, type: 'data', prompt: 'Count the tallies: ||||/ | | — how many in all?', answer: '7' },
            { id: 18, type: 'data', prompt: `In a column graph, each square is 1 vote. Leo's bar is 17 squares tall and Zoe's bar is 10 squares tall. How many more votes did Leo get?`, answer: '7' }
        ]);
    });

    it('division matches the exact sheet (equal sharing within 100, divisor >= 2)', () => {
        const s = sheet(g2, 'division');
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

    it('coins & money match the exact sheet (AU 5/10/20/50c coins + $ notes, V8-aligned)', () => {
        const s = sheet(g2, 'money');
        expect(s).toEqual([
            { id: 1, type: 'money', prompt: 'You have one $1 note and one fifty-cent coin. How much money is there in all?', answer: '$1.50' },
            { id: 2, type: 'money', prompt: 'How many five-cent coins make 15c?', answer: '3' },
            { id: 3, type: 'money', prompt: 'You have one $1 note and one five-cent coin. How much money is there in all?', answer: '$1.05' },
            { id: 4, type: 'money', prompt: 'What coins make 60c?', answer: '50c + 10c' },
            { id: 5, type: 'money', prompt: 'How many ten-cent coins make 20c?', answer: '2' },
            { id: 6, type: 'money', prompt: 'A jar holds 8 five-cent coins. How much money is in the jar?', answer: '40c' },
            { id: 7, type: 'money', prompt: 'What coins make 45c?', answer: '20c + 20c + 5c' },
            { id: 8, type: 'money', prompt: 'You have one $2 note and one twenty-cent coin. How much money is there in all?', answer: '$2.20' },
            { id: 9, type: 'money', prompt: 'How many ten-cent coins make 30c?', answer: '3' },
            { id: 10, type: 'money', prompt: 'What coins make 15c?', answer: '10c + 5c' },
            { id: 11, type: 'money', prompt: 'A jar holds 8 ten-cent coins. How much money is in the jar?', answer: '80c' },
            { id: 12, type: 'money', prompt: 'What coins make 35c?', answer: '20c + 10c + 5c' }
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

describe('generateDocument — multi-page worksheets', () => {
    // A 2-page document is ONE rng stream of 2×perPage problems chunked into
    // pages — so page 1 must be byte-identical to the old single-page sheet
    // (this is what keeps every pinned single-page assertion above valid).
    it('page 1 of a 2-page document equals the single-page sheet', () => {
        const seed = seedFrom([1, 'addition', 0]);
        const two = generateDocument(g1, 'addition', seed, 2);
        expect(two.pages).toHaveLength(2);
        expect(two.total).toBe(48);
        expect(two.pages[0]).toEqual(generateSheet(g1, 'addition', seed));
    });

    // The EXACT continuation rows of page 2 for (Year 1, addition, refresh 0),
    // captured from the deterministic generator — any change to the generator,
    // caps, or chunking fails these pins.
    it('Year 1 addition, 2 pages, matches the exact page-2 sheet', () => {
        const doc = generateDocument(g1, 'addition', seedFrom([1, 'addition', 0]), 2);
        expect(doc.pages[0][0]).toEqual({ id: 1, type: 'addition', prompt: '10 + 9 = __', answer: '19' });
        expect(doc.pages[1]).toEqual([
            { id: 25, type: 'addition', prompt: '12 + 2 = __', answer: '14' },
            { id: 26, type: 'addition', prompt: '7 + 11 = __', answer: '18' },
            { id: 27, type: 'addition', prompt: '10 + 4 = __', answer: '14' },
            { id: 28, type: 'addition', prompt: '11 + 3 = __', answer: '14' },
            { id: 29, type: 'addition', prompt: '17 + 2 = __', answer: '19' },
            { id: 30, type: 'addition', prompt: '2 + 1 = __', answer: '3' },
            { id: 31, type: 'addition', prompt: '12 + 4 = __', answer: '16' },
            { id: 32, type: 'addition', prompt: '12 + 2 = __', answer: '14' },
            { id: 33, type: 'addition', prompt: '2 + 15 = __', answer: '17' },
            { id: 34, type: 'addition', prompt: '3 + 6 = __', answer: '9' },
            { id: 35, type: 'addition', prompt: '3 + 7 = __', answer: '10' },
            { id: 36, type: 'addition', prompt: '3 + 15 = __', answer: '18' },
            { id: 37, type: 'addition', prompt: '13 + 4 = __', answer: '17' },
            { id: 38, type: 'addition', prompt: '1 + 8 = __', answer: '9' },
            { id: 39, type: 'addition', prompt: '15 + 4 = __', answer: '19' },
            { id: 40, type: 'addition', prompt: '11 + 2 = __', answer: '13' },
            { id: 41, type: 'addition', prompt: '2 + 8 = __', answer: '10' },
            { id: 42, type: 'addition', prompt: '7 + 12 = __', answer: '19' },
            { id: 43, type: 'addition', prompt: '7 + 3 = __', answer: '10' },
            { id: 44, type: 'addition', prompt: '15 + 1 = __', answer: '16' },
            { id: 45, type: 'addition', prompt: '6 + 3 = __', answer: '9' },
            { id: 46, type: 'addition', prompt: '19 + 1 = __', answer: '20' },
            { id: 47, type: 'addition', prompt: '19 + 1 = __', answer: '20' },
            { id: 48, type: 'addition', prompt: '9 + 7 = __', answer: '16' }
        ]);
    });

    // Problem ids must run continuously across page boundaries (1..72 for a
    // 3-page addition sheet), so printed pages read as one numbered set.
    it('problem ids run continuously across pages', () => {
        const doc = generateDocument(g1, 'addition', seedFrom([1, 'addition', 0]), 3);
        expect(doc.pages).toHaveLength(3);
        expect(doc.total).toBe(72);
        expect(doc.pages.flat().map((p) => p.id)).toEqual(Array.from({ length: 72 }, (_, i) => i + 1));
        // Page boundaries land exactly after every 24 (SHEET_COUNTS.addition).
        expect(doc.pages[2][0]).toEqual({ id: 49, type: 'addition', prompt: '17 + 2 = __', answer: '19' });
        expect(doc.pages[2][23]).toEqual({ id: 72, type: 'addition', prompt: '1 + 2 = __', answer: '3' });
    });

    // Every type shares the same chunking: page 2 begins mid-stream at id
    // SHEET_COUNTS[type] + 1. Pinned per-type first rows of page 2.
    it('skip & word page-2 continuations match exactly', () => {
        const skip = generateDocument(g1, 'skip', seedFrom([1, 'skip', 0]), 2);
        expect(skip.pages[1][0]).toEqual({ id: 17, type: 'skip', prompt: '5, 10, 15, __', answer: '20' });
        const word = generateDocument(g1, 'word', seedFrom([1, 'word', 0]), 2);
        expect(word.pages[1][0]).toEqual({
            id: 11,
            type: 'word',
            prompt: 'Max had 5 cars. Max gave 2 cars to a friend. How many cars does Max have left?',
            answer: '3'
        });
    });

    it('Year 2 addition page 2 stays within the within-100 cap', () => {
        const doc = generateDocument(g2, 'addition', seedFrom([2, 'addition', 0]), 2);
        // Pinned head of the page-2 stream.
        expect(doc.pages[1].slice(0, 3)).toEqual([
            { id: 25, type: 'addition', prompt: '96 + 2 = __', answer: '98' },
            { id: 26, type: 'addition', prompt: '28 + 6 = __', answer: '34' },
            { id: 27, type: 'addition', prompt: '2 + 14 = __', answer: '16' }
        ]);
        for (const p of doc.pages.flat()) expect(Number(p.answer)).toBeLessThanOrEqual(100);
    });

    it('returns an empty document for unimplemented grade, unoffered type, or bad page count', () => {
        expect(generateDocument(getGradeConfig(3), 'addition', seedFrom([3, 'addition', 0]), 2)).toEqual({
            pages: [],
            total: 0
        });
        // Grade 0 does not offer word problems.
        expect(generateDocument(g0, 'word', seedFrom([0, 'word', 0]), 1)).toEqual({ pages: [], total: 0 });
        expect(generateDocument(g1, 'addition', seedFrom([1, 'addition', 0]), 0)).toEqual({
            pages: [],
            total: 0
        });
    });
});

describe('scopeLabel — sheet subtitles', () => {
    it('describes each sheet type from the grade caps', () => {
        expect(scopeLabel(g1, 'addition')).toBe('within 20');
        expect(scopeLabel(g1, 'subtraction')).toBe('within 20');
        expect(scopeLabel(g1, 'skip')).toBe('count by 2, 5, 10');
        expect(scopeLabel(g1, 'word')).toBe('one-step');
        expect(scopeLabel(g1, 'counting')).toBe('to 20');
        // Times-tables range: only meaningfully set for grade 2.
        expect(scopeLabel(g2, 'mult')).toBe('times tables to 10');
        // Per-grade caps flow straight through.
        expect(scopeLabel(g0, 'addition')).toBe('within 10');
        expect(scopeLabel(g2, 'addition')).toBe('within 100');
    });
});
