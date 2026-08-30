// Unit tests for the COMPARE worksheet plugin.
//
// The plugin's generator is DETERMINISTIC: the first row is pinned exactly and
// every printed sign is verified against its operands.

import { describe, it, expect } from 'vitest';
import { seedFrom, getGradeConfig, generateSheet } from '../framework';
import { comparisonSpec } from './CompareWorksheet';

const g1 = getGradeConfig(1);

function sheet(grade: ReturnType<typeof getGradeConfig>) {
    return generateSheet(comparisonSpec, grade, seedFrom([grade.id, comparisonSpec.id, 0]));
}

describe('compare plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(comparisonSpec.id).toBe('comparison');
        expect(comparisonSpec.label).toBe('Compare (>, <, =)');
        expect(comparisonSpec.icon).toBe('≟');
        expect(comparisonSpec.perPage).toBe(24);
    });

    it('describes its numeric scope from the grade caps', () => {
        expect(comparisonSpec.scope(g1)).toBe('within 20');
    });
});

describe('compare — Year 1', () => {
    it('matches the exact sheet (sign is always correct)', () => {
        const s = sheet(g1);
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
});
