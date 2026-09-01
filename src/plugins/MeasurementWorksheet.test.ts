// Unit tests for the MEASUREMENT worksheet plugin.
//
// The plugin's generator is DETERMINISTIC: entire sheets pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). Prep does not offer the extension types.

import { describe, it, expect } from 'vitest';
import { seedFrom, getGradeConfig, generateSheet } from '../framework';
import { measureSpec } from './MeasurementWorksheet';

const g0 = getGradeConfig(0);
const g1 = getGradeConfig(1);
const g2 = getGradeConfig(2);

function sheet(grade: ReturnType<typeof getGradeConfig>) {
    return generateSheet(measureSpec, grade, seedFrom([grade.id, measureSpec.id, 0]));
}

describe('measurement plugin — declarative spec', () => {
    it('declares its sidebar label, glyph, prose layout and page size', () => {
        expect(measureSpec.id).toBe('measure');
        expect(measureSpec.label).toBe('Measurement');
        expect(measureSpec.icon).toBe('↔');
        expect(measureSpec.singleColumn).toBe(true);
        expect(measureSpec.perPage).toBe(12);
    });

    it('describes its numeric scope from the grade caps', () => {
        expect(measureSpec.scope(g1)).toBe('informal units');
        expect(measureSpec.scope(g2)).toBe('informal & metric units');
    });
});

describe('measurement — availability gating', () => {
    it('Prep does not offer the extension type (empty sheet); Year 1 does', () => {
        expect(sheet(g0)).toEqual([]);
        expect(sheet(g1)).toHaveLength(12);
    });
});

describe('measurement — Year 1 (informal comparisons only)', () => {
    it('matches the exact sheet', () => {
        const s = sheet(g1);
        expect(s).toEqual([
            {"prompt":"Which is longer: the notebook or the door?","answer":"door","id":1,"type":"measure"},
            {"prompt":"Which holds more: the water bottle or the cup?","answer":"water bottle","id":2,"type":"measure"},
            {"prompt":"Which is heavier: the pencil or the cat?","answer":"cat","id":3,"type":"measure"},
            {"prompt":"Which is heavier: the bucket or the cup?","answer":"bucket","id":4,"type":"measure"},
            {"prompt":"Which is heavier: the ruler or the pencil?","answer":"ruler","id":5,"type":"measure"},
            {"prompt":"Which holds more: the tank or the spoon?","answer":"tank","id":6,"type":"measure"},
            {"prompt":"Which is heavier: the pencil or the spoon?","answer":"pencil","id":7,"type":"measure"},
            {"prompt":"Which is heavier: the crayon or the apple?","answer":"apple","id":8,"type":"measure"},
            {"prompt":"Which holds more: the spoon or the cup?","answer":"cup","id":9,"type":"measure"},
            {"prompt":"Which holds more: the cup or the bucket?","answer":"bucket","id":10,"type":"measure"},
            {"prompt":"Which is longer: the ruler or the crayon?","answer":"ruler","id":11,"type":"measure"},
            {"prompt":"Which is heavier: the pencil or the door?","answer":"door","id":12,"type":"measure"},
        ]);
        // Year 1 (metricCap 0) never sees cm/metre items.
        for (const p of s) expect(p.prompt.includes(' cm')).toBe(false);
    });
});

describe('measurement — Year 2 (adds cm + metre comparisons)', () => {
    it('matches the exact sheet', () => {
        const s = sheet(g2);
        expect(s).toEqual([
            {"prompt":"Which is heavier: the door or the crayon?","answer":"door","id":1,"type":"measure"},
            {"prompt":"Which is longer: the finger or the door?","answer":"door","id":2,"type":"measure"},
            {"prompt":"A notebook is about 22 cm long. Is it longer or shorter than a metre?","answer":"shorter","id":3,"type":"measure"},
            {"prompt":"Which is longer: the pencil or the notebook?","answer":"notebook","id":4,"type":"measure"},
            {"prompt":"Which is heavier: the cup or the bucket?","answer":"bucket","id":5,"type":"measure"},
            {"prompt":"Which holds more: the bucket or the water bottle?","answer":"bucket","id":6,"type":"measure"},
            {"prompt":"Which holds more: the water bottle or the bucket?","answer":"bucket","id":7,"type":"measure"},
            {"prompt":"A table is about 75 cm long. A pencil is about 15 cm long. About how many pencils long is a table?","answer":"5","id":8,"type":"measure"},
            {"prompt":"A finger is about 5 cm long. Is it longer or shorter than a metre?","answer":"shorter","id":9,"type":"measure"},
            {"prompt":"Which is longer: the crayon or the pencil?","answer":"pencil","id":10,"type":"measure"},
            {"prompt":"Which is heavier: the ruler or the door?","answer":"door","id":11,"type":"measure"},
            {"prompt":"Which is longer: the ruler or the finger?","answer":"ruler","id":12,"type":"measure"},
        ]);
    });
});
