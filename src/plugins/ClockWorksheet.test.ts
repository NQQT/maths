// Unit tests for the CLOCK FACES worksheet plugin.
//
// The plugin's generator is DETERMINISTIC: entire sheets pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). Only grades that list 'clock' in their
// catalogue AND have clockCap > 0 offer the sheet (currently Year 2).
//
// Every clock item carries a `clock` figure (framework/types.ts ClockFigure):
// hands drawn for reading items, `hands: false` (blank face) for drawing
// items, and NO figure for the pure-text conversion items.

import { describe, it, expect } from 'vitest';
import { seedFrom, getGradeConfig, generateSheet } from '../framework';
import { clockSpec } from './ClockWorksheet';

const g1 = getGradeConfig(1);
const g2 = getGradeConfig(2);

function sheet(grade: ReturnType<typeof getGradeConfig>) {
    return generateSheet(clockSpec, grade, seedFrom([grade.id, clockSpec.id, 0]));
}

describe('clock plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(clockSpec.id).toBe('clock');
        expect(clockSpec.label).toBe('Clock Faces');
        expect(clockSpec.icon).toBe('⏱');
        expect(clockSpec.perPage).toBe(10);
    });

    it('describes its numeric scope from the grade caps', () => {
        expect(clockSpec.scope(g1)).toBe("o'clock & half past");
        expect(clockSpec.scope(g2)).toBe("o'clock, half past, quarter past & to");
    });
});

describe('clock — availability gating', () => {
    it('Year 1 does not offer the sheet (empty); Year 2 does', () => {
        expect(sheet(g1)).toEqual([]);
        expect(sheet(g2)).toHaveLength(10);
    });
});

describe('clock — Year 2 (reading, drawing and conversions, quarter scale)', () => {
    it('matches the exact sheet', () => {
        const s = sheet(g2);
        expect(s).toEqual([
            {"prompt":"Quarter to 9 is the same time in digital:","answer":"8:45","answerLine":true,"id":1,"type":"clock"},
            {"prompt":"3:30 is the same time in words:","answer":"half past 3","answerLine":true,"id":2,"type":"clock"},
            {"prompt":"Write the digital time the clock shows:__","answer":"11:45","clock":{"hour":11,"minute":45},"wideBlanks":true,"id":3,"type":"clock"},
            {"prompt":"Quarter to 2 is the same time in digital:","answer":"1:45","answerLine":true,"id":4,"type":"clock"},
            {"prompt":"Quarter past 12 is the same time in digital:","answer":"12:15","answerLine":true,"id":5,"type":"clock"},
            {"prompt":"10:00 is the same time in words:","answer":"10 o'clock","answerLine":true,"id":6,"type":"clock"},
            {"prompt":"Draw the hands to show quarter to 1.","answer":"12:45 — hour hand on 12, minute hand on 9","clock":{"hour":12,"minute":45,"hands":false},"id":7,"type":"clock"},
            {"prompt":"What time is shown on the clock?__","answer":"quarter past 8","clock":{"hour":8,"minute":15},"wideBlanks":true,"id":8,"type":"clock"},
            {"prompt":"2:45 is the same time in words:","answer":"quarter to 3","answerLine":true,"id":9,"type":"clock"},
            {"prompt":"Draw the hands to show quarter to 8.","answer":"7:45 — hour hand on 7, minute hand on 9","clock":{"hour":7,"minute":45,"hands":false},"id":10,"type":"clock"},
        ]);
    });

    it('fill-in items use wide inline blanks; conversion items use the bottom answer line', () => {
        const s = sheet(g2);
        // Reading items keep an inline wide "__" blank after the question.
        const inline = s.filter((p) => p.prompt.includes('__'));
        expect(inline).toHaveLength(2);
        for (const p of inline) {
            expect(p.wideBlanks).toBe(true);
            expect(p.answerLine).toBeUndefined();
        }
        // Conversion items end with ":" and answer on a full-width line BELOW
        // the prompt — no inline blank at all.
        const conversions = s.filter((p) => p.prompt.includes('is the same time in'));
        expect(conversions).toHaveLength(6);
        for (const p of conversions) {
            expect(p.prompt.endsWith(':')).toBe(true);
            expect(p.answerLine).toBe(true);
            expect(p.wideBlanks).toBeUndefined();
        }
        // The draw items have neither (the student draws on the blank face).
        const draws = s.filter((p) => p.prompt.startsWith('Draw the hands'));
        for (const p of draws) {
            expect(p.wideBlanks).toBeUndefined();
            expect(p.answerLine).toBeUndefined();
        }
    });

    it('only draw items get a blank face; reading items get drawn hands; conversions get no figure', () => {
        const s = sheet(g2);
        // Draw items: blank face (hands: false).
        const draws = s.filter((p) => p.prompt.startsWith('Draw the hands'));
        expect(draws.length).toBe(2);
        for (const p of draws) {
            expect(p.clock).toBeDefined();
            expect(p.clock!.hands).toBe(false);
        }
        // Reading items: hands drawn (hands omitted = default true).
        const reads = s.filter((p) => p.prompt.includes('the clock shows') || p.prompt.includes('shown on the clock'));
        expect(reads.length).toBe(2);
        for (const p of reads) {
            expect(p.clock).toBeDefined();
            expect(p.clock!.hands).toBeUndefined();
        }
        // Conversion items: pure text, no figure.
        const conversions = s.filter((p) => p.prompt.includes('is the same'));
        expect(conversions.length).toBe(6);
        for (const p of conversions) {
            expect(p.clock).toBeUndefined();
        }
    });

    it('keeps every clock figure within the 1-12 hour / quarter-scale minutes', () => {
        // 3 pages (same generator, longer stream) to sample more of the pool.
        const s = generateSheet(clockSpec, g2, seedFrom([g2.id, clockSpec.id, 7]));
        for (const p of s) {
            if (!p.clock) continue;
            expect(p.clock.hour).toBeGreaterThanOrEqual(1);
            expect(p.clock.hour).toBeLessThanOrEqual(12);
            expect([0, 15, 30, 45]).toContain(p.clock.minute);
        }
    });
});
