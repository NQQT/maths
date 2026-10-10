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
const g3 = getGradeConfig(3);

describe('grade catalogue', () => {
    it('lists grades 0..12 with Prep / Year N labels', () => {
        const labels = getGradeConfig(0).label + '|' + getGradeConfig(12).label;
        expect(labels).toBe('Prep|Year 12');
        // Grades 0..6 have real content (0..2 full catalogue, Year 3's
        // extensions and the 3..6 arithmetic ladder); 7+ is not implemented.
        expect(g0.implemented).toBe(true);
        expect(g1.implemented).toBe(true);
        expect(g2.implemented).toBe(true);
        expect(getGradeConfig(3).implemented).toBe(true);
        expect(getGradeConfig(6).implemented).toBe(true);
        expect(getGradeConfig(7).implemented).toBe(false);
        expect(getGradeConfig(12).implemented).toBe(false);
    });

    it('grade 3 offers the exact ordered arithmetic, spatial and T4-strand catalogue', () => {
        // Reuse MultiplicationWorksheet and CompassWorksheet; 'transformations'
        // is the separate shape-flip / 90-degree rotation plugin, not 'shapes'.
        // CompassWorksheet.test.ts pins the existing clockwise N/E/S/W turns.
        // T4 expansion: five upper-primary strands append AFTER the original
        // five-entry rail (catalogue order is the rail order).
        expect(g3).toEqual({
            id: 3,
            short: '3',
            label: 'Year 3',
            implemented: true,
            available: ['addition', 'subtraction', 'mult', 'transformations', 'compass',
                'fractions', 'metricconv', 'statistics', 'probability', 'algebra'],
            caps: {
                opCap: 1000,
                addendCap: 2,
                numCap: 0,
                wordCap: 0,
                skipCap: 0,
                skipSet: [],
                multCap: 10,
                doubleCap: 0,
                bondCap: 0,
                patSet: [],
                shapeSet: [],
                clockCap: 0,
                metricCap: 0,
                pvCap: 0,
                dataCap: 0,
                coinCap: 0,
                tempCap: 0,
                // T4 upper-primary caps: Y3 gets unit fractions halves..tenths
                // and no decimals/area work yet (see plugins/FractionsWorksheet.ts).
                yearLevel: 3,
                denSet: [2, 3, 4, 5, 10],
                decPlaces: 0,
                areaSideCap: 0
            }
        });
    });

    it.each([
        // [id, opCap, addendCap, available, decPlaces, areaSideCap]
        [4, 10000, 3, ['addition', 'subtraction', 'fractions', 'decimals', 'multidiv',
            'perimeterarea', 'metricconv', 'statistics', 'probability', 'algebra'], 2, 20],
        [5, 100000, 3, ['addition', 'subtraction', 'fractions', 'decimals', 'percent',
            'multidiv', 'perimeterarea', 'metricconv', 'statistics', 'probability', 'algebra'], 3, 100],
        [6, 1000000, 4, ['addition', 'subtraction', 'fractions', 'decimals', 'percent',
            'multidiv', 'perimeterarea', 'metricconv', 'statistics', 'probability', 'algebra'], 3, 1000]
    ])('grade %i preserves its complete T4-expanded configuration', (id, opCap, addendCap, available, decPlaces, areaSideCap) => {
        // Year 3's extra ids (mult/transformations/compass) must not leak
        // through the shared arithmeticLadderGrade helper; percent joins at
        // Year 5 (AC9M5N04). multCap 100 is the MULTIDIV operand ceiling for
        // Years 4..6 (plugins/MultiplyDivideWorksheet.ts).
        expect(getGradeConfig(id)).toEqual({
            id,
            short: String(id),
            label: `Year ${id}`,
            implemented: true,
            available,
            caps: {
                opCap,
                addendCap,
                numCap: 0,
                wordCap: 0,
                skipCap: 0,
                skipSet: [],
                multCap: 100,
                doubleCap: 0,
                bondCap: 0,
                patSet: [],
                shapeSet: [],
                clockCap: 0,
                metricCap: 0,
                pvCap: 0,
                dataCap: 0,
                coinCap: 0,
                tempCap: 0,
                yearLevel: id,
                denSet: [2, 3, 4, 5, 6, 8, 10, 12],
                decPlaces,
                areaSideCap
            }
        });
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

    it('grade 1 offers the full original catalogue plus the eleven extension types', () => {
        expect([...g1.available].sort()).toEqual(
            [
                'addition',
                'bonds',
                'compass',
                'comparison',
                'counting',
                'data',
                'doubles',
                'measure',
                'missing',
                'patterns',
                'placevalue',
                'rowscolumns',
                'shapes',
                'skip',
                'subtraction',
                'temperature',
                'time',
                'word'
            ].sort()
        );
    });

    it('grade 2 adds times tables, division and Australian coins (22 types total)', () => {
        // Year 2 is the first grade with times tables AND the only grade with
        // division / coins & money (V8-aligned money: coins to about $1).
        // It is also the only grade with clock faces (reading + drawing hands)
        // and the only counting-bridge grade with the rows-columns multiplication
        // form (multCap 10 lets the r × c products through).
        expect([...g2.available].sort()).toEqual(
            [
                'addition',
                'bonds',
                'clock',
                'compass',
                'comparison',
                'counting',
                'data',
                'division',
                'doubles',
                'measure',
                'missing',
                'money',
                'mult',
                'patterns',
                'placevalue',
                'rowscolumns',
                'shapes',
                'skip',
                'subtraction',
                'temperature',
                'time',
                'word'
            ].sort()
        );
        expect(g2.available).toContain('mult');
        expect(g1.available).not.toContain('mult');
        expect(g0.available).not.toContain('mult');
        expect(g1.available).not.toContain('division');
        expect(g1.available).not.toContain('money');
        // Years 2 and 3 retain the same tables to 10; the other extension
        // caps are also grade-specific (Y2 doubles to 20, coins to 100c,
        // temperature to 40°C while Year 1 keeps its within-20 sheet).
        expect(g2.caps.multCap).toBe(10);
        expect(g3.caps.multCap).toBe(10);
        expect(g1.caps.multCap).toBe(0);
        expect(g2.caps.doubleCap).toBe(20);
        expect(g1.caps.doubleCap).toBe(10);
        expect(g2.caps.clockCap).toBe(12);
        expect(g1.caps.clockCap).toBe(0);
        expect(g2.caps.coinCap).toBe(100);
        expect(g1.caps.coinCap).toBe(0);
        expect(g2.caps.tempCap).toBe(40);
        expect(g1.caps.tempCap).toBe(20);
        expect(g0.caps.tempCap).toBe(0);
    });
});
