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

    it('page 2 continues the exact stream', () => {
        const doc = generateDocument(wordSpec, g1, seedFrom([1, 'word', 0]), 2);
        expect(doc.pages[1][0]).toEqual({
            id: 11,
            type: 'word',
            prompt: 'Max had 5 cars. Max gave 2 cars to a friend. How many cars does Max have left?',
            answer: '3'
        });
    });
});
