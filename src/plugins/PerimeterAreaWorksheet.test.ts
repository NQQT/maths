// Unit tests for the PERIMETER & AREA worksheet plugin (T4 expansion).
//
// Deterministic-generator strategy (see plugins/AdditionWorksheet.test.ts):
// the ENTIRE first page per offered grade is pinned exactly with the
// framework seed; tier counts are 2+4+2 on this 8-per-page sheet.
import { describe, it, expect } from 'vitest';
import { seedFrom, getGradeConfig, generateSheet } from '../framework';
import { perimeterAreaSpec } from './PerimeterAreaWorksheet';

const g3 = getGradeConfig(3);
const g4 = getGradeConfig(4);
const g5 = getGradeConfig(5);
const g6 = getGradeConfig(6);

function sheet(grade: ReturnType<typeof getGradeConfig>) {
    return generateSheet(perimeterAreaSpec, grade, seedFrom([grade.id, perimeterAreaSpec.id, 0]));
}

describe('perimeterarea plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(perimeterAreaSpec.id).toBe('perimeterarea');
        expect(perimeterAreaSpec.label).toBe('Perimeter & Area');
        expect(perimeterAreaSpec.icon).toBe('▭');
        expect(perimeterAreaSpec.perPage).toBe(8);
    });

    it('describes its year-tiered scope from the grade caps', () => {
        expect(perimeterAreaSpec.scope(g4)).toBe('perimeter & area by counting units (AC9M4M02)');
        expect(perimeterAreaSpec.scope(g5)).toBe('rectangle formulas & reverse problems (AC9M5M02)');
        expect(perimeterAreaSpec.scope(g6)).toBe('area formulas & metric links (AC9M6M01-02)');
    });

    it('is gated to Years 4..6 (areaSideCap join; hidden on Y3 and Y7)', () => {
        expect(perimeterAreaSpec.offered(g3)).toBe(false);
        expect(perimeterAreaSpec.offered(g4)).toBe(true);
        expect(perimeterAreaSpec.offered(g5)).toBe(true);
        expect(perimeterAreaSpec.offered(g6)).toBe(true);
        expect(perimeterAreaSpec.offered(getGradeConfig(7))).toBe(false);
    });
});

describe('perimeterarea — Year 4 (counting units, AC9M4M02)', () => {
    it('matches the exact first page', () => {
        expect(sheet(g4)).toEqual([
            { prompt: 'Starter: A rectangle is 10 cm long and 7 cm wide. Its perimeter is __ cm', answer: '34', id: 1, type: 'perimeterarea' },
            { prompt: 'Starter: A rectangle is 13 cm long and 4 cm wide. Its perimeter is __ cm', answer: '34', id: 2, type: 'perimeterarea' },
            { prompt: 'Practice: An 8 cm by 4 cm rectangle is covered with 1 cm² squares. It needs __ squares', answer: '32', id: 3, type: 'perimeterarea' },
            { prompt: 'Practice: A square has sides of 3 cm. Its perimeter is __ cm and its area is __ cm²', answer: '12, 9', id: 4, type: 'perimeterarea' },
            { prompt: 'Practice: A 12 cm by 4 cm rectangle is covered with 1 cm² squares. It needs __ squares', answer: '48', id: 5, type: 'perimeterarea' },
            { prompt: 'Practice: A square has sides of 7 cm. Its perimeter is __ cm and its area is __ cm²', answer: '28, 49', id: 6, type: 'perimeterarea' },
            { prompt: "Challenge: A rectangle's perimeter is 20 cm and its length is 8 cm. Its width is __ cm", answer: '2', id: 7, type: 'perimeterarea' },
            { prompt: "Challenge: A rectangle's area is 63 cm² and its width is 7 cm. Its length is __ cm", answer: '9', id: 8, type: 'perimeterarea' }
        ]);
    });
});

describe('perimeterarea — Year 5 (formulas & reverse work, AC9M5M02)', () => {
    it('matches the exact first page', () => {
        expect(sheet(g5)).toEqual([
            { prompt: 'Starter: A 92 m by 60 m rectangle has perimeter __ m', answer: '304', id: 1, type: 'perimeterarea' },
            { prompt: 'Starter: An 89 m by 63 m rectangle has area __ m²', answer: '5607', id: 2, type: 'perimeterarea' },
            { prompt: "Practice: A rectangle's area is 198 m² and its width is 6 m. Its length is __ m", answer: '33', id: 3, type: 'perimeterarea' },
            { prompt: "Practice: A rectangle's perimeter is 256 m and its length is 79 m. Its width is __ m", answer: '49', id: 4, type: 'perimeterarea' },
            { prompt: "Practice: A rectangle's area is 1071 m² and its width is 21 m. Its length is __ m", answer: '51', id: 5, type: 'perimeterarea' },
            { prompt: "Practice: A rectangle's perimeter is 378 m and its length is 95 m. Its width is __ m", answer: '94', id: 6, type: 'perimeterarea' },
            { prompt: 'Challenge: An L-shape is made from two rectangles: one 6 cm by 5 cm and one 4 cm by 2 cm. Its total area is __ cm²', answer: '38', id: 7, type: 'perimeterarea' },
            { prompt: 'Challenge: An L-shape is made from two rectangles: one 5 cm by 3 cm and one 5 cm by 4 cm. Its total area is __ cm²', answer: '35', id: 8, type: 'perimeterarea' }
        ]);
    });

    it('reverse items are exact: perimeter = 2(l+w) and area = l×w by construction', () => {
        for (const p of sheet(g5)) {
            const pm = p.prompt.match(/perimeter is (\d+) m and its length is (\d+) m\. Its width is __ m/);
            if (pm) {
                const w = Number(p.answer);
                expect(2 * (Number(pm[2]) + w)).toBe(Number(pm[1]));
            }
            const am = p.prompt.match(/area is (\d+) m² and its width is (\d+) m\. Its length is __ m/);
            if (am) expect(Number(p.answer) * Number(am[2])).toBe(Number(am[1]));
        }
    });
});

describe('perimeterarea — Year 6 (larger measurements & unit links, AC9M6M01-02)', () => {
    it('matches the exact first page', () => {
        expect(sheet(g6)).toEqual([
            { prompt: 'Starter: A field is 219 m by 188 m. Its area is __ m²', answer: '41172', id: 1, type: 'perimeterarea' },
            { prompt: 'Starter: A field is 367 m by 184 m. Its area is __ m²', answer: '67528', id: 2, type: 'perimeterarea' },
            { prompt: 'Practice: A paddock is 4 km by 2 km. Its area is __ km²', answer: '8', id: 3, type: 'perimeterarea' },
            { prompt: 'Practice: A paddock is 3 km by 1 km. Its area is __ km²', answer: '3', id: 4, type: 'perimeterarea' },
            { prompt: 'Practice: A table top is 300 cm by 200 cm. Its area is __ m²', answer: '6', id: 5, type: 'perimeterarea' },
            { prompt: 'Practice: A table top is 700 cm by 700 cm. Its area is __ m²', answer: '49', id: 6, type: 'perimeterarea' },
            { prompt: "Challenge: An 18 m by 17 m garden has a 1 m wide path all around it. The path's OUTER perimeter is __ m", answer: '78', id: 7, type: 'perimeterarea' },
            { prompt: "Challenge: A rectangle's area is 580338 m² and its width is 594 m. Its length is __ m", answer: '977', id: 8, type: 'perimeterarea' }
        ]);
    });
});

describe('perimeterarea — scaffolded learning sequence', () => {
    it('every Year 4..6 page prints 2 scaffold + 4 core + 2 stretch rows', () => {
        for (const grade of [g4, g5, g6]) {
            const s = sheet(grade);
            expect(s.filter((p) => p.prompt.startsWith('Starter:'))).toHaveLength(2);
            expect(s.filter((p) => p.prompt.startsWith('Practice:'))).toHaveLength(4);
            expect(s.filter((p) => p.prompt.startsWith('Challenge:'))).toHaveLength(2);
        }
    });
});
