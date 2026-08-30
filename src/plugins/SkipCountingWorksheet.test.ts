// Unit tests for the SKIP COUNTING worksheet plugin.
//
// The plugin's generator is DETERMINISTIC: the entire sheet is pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])), plus the exact page-2 continuation row.

import { describe, it, expect } from 'vitest';
import { seedFrom, getGradeConfig, generateSheet, generateDocument } from '../framework';
import { skipSpec } from './SkipCountingWorksheet';

const g1 = getGradeConfig(1);

function sheet(grade: ReturnType<typeof getGradeConfig>) {
    return generateSheet(skipSpec, grade, seedFrom([grade.id, skipSpec.id, 0]));
}

describe('skip counting plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(skipSpec.id).toBe('skip');
        expect(skipSpec.label).toBe('Skip Counting');
        expect(skipSpec.icon).toBe('»');
        expect(skipSpec.perPage).toBe(16);
    });

    it('describes its numeric scope from the grade caps', () => {
        expect(skipSpec.scope(g1)).toBe('count by 2, 5, 10');
    });
});

describe('skip counting — Year 1', () => {
    it('matches the exact sheet (4th term is a valid count-on)', () => {
        const s = sheet(g1);
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

    it('page 2 continues the exact stream', () => {
        const doc = generateDocument(skipSpec, g1, seedFrom([1, 'skip', 0]), 2);
        expect(doc.pages[1][0]).toEqual({ id: 17, type: 'skip', prompt: '5, 10, 15, __', answer: '20' });
    });
});
