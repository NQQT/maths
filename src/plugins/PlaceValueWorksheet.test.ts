// Unit tests for the PLACE VALUE worksheet plugin.
//
// The plugin's generator is DETERMINISTIC: entire sheets pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). Prep does not offer the extension types.

import { describe, it, expect } from 'vitest';
import { seedFrom, getGradeConfig, generateSheet } from '../framework';
import { placeValueSpec } from './PlaceValueWorksheet';

const g0 = getGradeConfig(0);
const g1 = getGradeConfig(1);
const g2 = getGradeConfig(2);

function sheet(grade: ReturnType<typeof getGradeConfig>) {
    return generateSheet(placeValueSpec, grade, seedFrom([grade.id, placeValueSpec.id, 0]));
}

describe('place value plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(placeValueSpec.id).toBe('placevalue');
        expect(placeValueSpec.label).toBe('Place Value');
        expect(placeValueSpec.icon).toBe('⊞');
        expect(placeValueSpec.perPage).toBe(16);
    });

    it('describes its numeric scope from the grade caps', () => {
        expect(placeValueSpec.scope(g1)).toBe('tens & ones to 20');
        expect(placeValueSpec.scope(g2)).toBe('tens & ones to 99');
    });
});

describe('place value — availability gating', () => {
    it('Prep does not offer the extension type (empty sheet); Year 1 does', () => {
        expect(sheet(g0)).toEqual([]);
        expect(sheet(g1)).toHaveLength(16);
    });
});

describe('place value — Year 1 (tens & ones to 20)', () => {
    it('matches the exact sheet', () => {
        const s = sheet(g1);
        expect(s).toEqual([
            {"prompt":"How many tens are in 14?","answer":"1","id":1,"type":"placevalue"},
            {"prompt":"20 is __ tens and __ ones","answer":"2 tens and 0 ones","id":2,"type":"placevalue"},
            {"prompt":"How many tens and ones make 18?","answer":"1 ten and 8 ones","id":3,"type":"placevalue"},
            {"prompt":"How many tens and ones make 19?","answer":"1 ten and 9 ones","id":4,"type":"placevalue"},
            {"prompt":"What is the tens digit of 19?","answer":"1","id":5,"type":"placevalue"},
            {"prompt":"How many tens are in 17?","answer":"1","id":6,"type":"placevalue"},
            {"prompt":"How many tens are in 16?","answer":"1","id":7,"type":"placevalue"},
            {"prompt":"16 is __ tens and __ ones","answer":"1 tens and 6 ones","id":8,"type":"placevalue"},
            {"prompt":"How many ones are in 16?","answer":"6","id":9,"type":"placevalue"},
            {"prompt":"How many ones are in 17?","answer":"7","id":10,"type":"placevalue"},
            {"prompt":"What number is 1 ten and 7 ones?","answer":"17","id":11,"type":"placevalue"},
            {"prompt":"How many tens and ones make 12?","answer":"1 ten and 2 ones","id":12,"type":"placevalue"},
            {"prompt":"What number is 1 ten and 5 ones?","answer":"15","id":13,"type":"placevalue"},
            {"prompt":"How many tens and ones make 13?","answer":"1 ten and 3 ones","id":14,"type":"placevalue"},
            {"prompt":"What number is 2 tens and 0 ones?","answer":"20","id":15,"type":"placevalue"},
            {"prompt":"What is the tens digit of 11?","answer":"1","id":16,"type":"placevalue"},
        ]);
    });
});

describe('place value — Year 2 (tens & ones to 99)', () => {
    it('matches the exact sheet', () => {
        const s = sheet(g2);
        expect(s).toEqual([
            {"prompt":"How many tens and ones make 45?","answer":"4 tens and 5 ones","id":1,"type":"placevalue"},
            {"prompt":"38 is __ tens and __ ones","answer":"3 tens and 8 ones","id":2,"type":"placevalue"},
            {"prompt":"What number is 6 tens and 3 ones?","answer":"63","id":3,"type":"placevalue"},
            {"prompt":"What is the tens digit of 51?","answer":"5","id":4,"type":"placevalue"},
            {"prompt":"85 is __ tens and __ ones","answer":"8 tens and 5 ones","id":5,"type":"placevalue"},
            {"prompt":"What is the tens digit of 61?","answer":"6","id":6,"type":"placevalue"},
            {"prompt":"How many tens and ones make 96?","answer":"9 tens and 6 ones","id":7,"type":"placevalue"},
            {"prompt":"How many ones are in 10?","answer":"0","id":8,"type":"placevalue"},
            {"prompt":"How many ones are in 43?","answer":"3","id":9,"type":"placevalue"},
            {"prompt":"What is the tens digit of 67?","answer":"6","id":10,"type":"placevalue"},
            {"prompt":"What is the tens digit of 16?","answer":"1","id":11,"type":"placevalue"},
            {"prompt":"What is the tens digit of 92?","answer":"9","id":12,"type":"placevalue"},
            {"prompt":"How many tens are in 22?","answer":"2","id":13,"type":"placevalue"},
            {"prompt":"How many tens and ones make 35?","answer":"3 tens and 5 ones","id":14,"type":"placevalue"},
            {"prompt":"How many tens are in 49?","answer":"4","id":15,"type":"placevalue"},
            {"prompt":"How many tens and ones make 27?","answer":"2 tens and 7 ones","id":16,"type":"placevalue"},
        ]);
    });
});
