// Unit tests for the WORD PROBLEMS worksheet plugin.
//
// The plugin's generator is DETERMINISTIC: the entire sheet is pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])), plus the exact page-2 continuation row.
// Word problems are single-step stories; Prep does not offer them.

import { describe, it, expect } from 'vitest';
import { seedFrom, getGradeConfig, generateSheet, generateDocument } from '../framework';
import { wordSpec } from './WordProblemsWorksheet';

const g0 = getGradeConfig(0);
const g1 = getGradeConfig(1);

function sheet(grade: ReturnType<typeof getGradeConfig>) {
    return generateSheet(wordSpec, grade, seedFrom([grade.id, wordSpec.id, 0]));
}

describe('word problems plugin — declarative spec', () => {
    it('declares its sidebar label, glyph, prose layout and page size', () => {
        expect(wordSpec.id).toBe('word');
        expect(wordSpec.label).toBe('Word Problems');
        expect(wordSpec.icon).toBe('¶');
        expect(wordSpec.singleColumn).toBe(true);
        expect(wordSpec.perPage).toBe(10);
    });

    it('describes its numeric scope', () => {
        expect(wordSpec.scope(g1)).toBe('one-step');
    });
});

describe('word problems — availability gating', () => {
    it('Prep does not offer word problems (empty sheet)', () => {
        expect(sheet(g0)).toEqual([]);
    });
});

describe('word problems — Year 1', () => {
    it('matches the exact sheet (single-step, non-negative answer)', () => {
        const s = sheet(g1);
        expect(s).toEqual([
            {"prompt":"Tom has 4 toys. Kai has 16 toys. How many toys are there in total?","answer":"20","id":1,"type":"word"},
            {"prompt":"Leo has 18 cookies. Sam has 1 cookie. How many cookies are there in total?","answer":"19","id":2,"type":"word"},
            {"prompt":"Rae had 7 apples. Rae gave 3 apples to a friend. How many apples does Rae have left?","answer":"4","id":3,"type":"word"},
            {"prompt":"Zoe has 8 flowers. Mia has 6 flowers. How many flowers are there in total?","answer":"14","id":4,"type":"word"},
            {"prompt":"Max had 9 balloons. Max gave 8 balloons to a friend. How many balloons does Max have left?","answer":"1","id":5,"type":"word"},
            {"prompt":"Rae had 14 stickers. Rae gave 11 stickers to a friend. How many stickers does Rae have left?","answer":"3","id":6,"type":"word"},
            {"prompt":"Zoe has 13 cars. Max has 4 cars. How many cars are there in total?","answer":"17","id":7,"type":"word"},
            {"prompt":"Leo has 1 crayon. Mia has 19 crayons. How many crayons are there in total?","answer":"20","id":8,"type":"word"},
            {"prompt":"Kai had 7 cars. Kai gave 6 cars to a friend. How many cars does Kai have left?","answer":"1","id":9,"type":"word"},
            {"prompt":"Sam had 5 apples. Sam gave 2 apples to a friend. How many apples does Sam have left?","answer":"3","id":10,"type":"word"},
        ]);
    });

    it('page 2 continues the exact stream', () => {
        const doc = generateDocument(wordSpec, g1, seedFrom([1, 'word', 0]), 2);
        expect(doc.pages[1][0]).toEqual({ id: 11, type: "word", prompt: "Tom had 11 balloons. Tom gave 4 balloons to a friend. How many balloons does Tom have left?", answer: "7" });
    });
});
