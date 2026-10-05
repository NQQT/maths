// Unit tests for the MULTIPLICATION worksheet plugin.
//
// The plugin's generator is DETERMINISTIC: the entire sheet is pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). Years 2 and 3 both keep tables to 10;
// Prep, Year 1 and Years 4..12 must produce empty sheets (see
// framework/grades.test.ts for the complete later-grade configurations).

import { createElement, useEffect } from 'react';
import { cleanup, render } from '@testing-library/react';
import { arrayCreate, arrayEach } from '@presource/core';
import { describe, it, expect, afterEach } from 'vitest';
import {
    seedFrom, getGradeConfig, generateSheet, generateDocument,
    DASHBOARD_FRAMEWORK, DashboardContextProvider, useDashboardSession
} from '../framework';
import { multiplicationSpec, MultiplicationWorksheet } from './MultiplicationWorksheet';

const g0 = getGradeConfig(0);
const g1 = getGradeConfig(1);
const g2 = getGradeConfig(2);
const g3 = getGradeConfig(3);

afterEach(cleanup);

function sheet(grade: ReturnType<typeof getGradeConfig>) {
    return generateSheet(multiplicationSpec, grade, seedFrom([grade.id, multiplicationSpec.id, 0]));
}

describe('multiplication plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(multiplicationSpec.id).toBe('mult');
        expect(multiplicationSpec.label).toBe('Multiplication');
        expect(multiplicationSpec.icon).toBe('×');
        expect(multiplicationSpec.perPage).toBe(24);
    });

    it('describes its numeric scope from the grade caps', () => {
        expect(multiplicationSpec.scope(g2)).toBe('times tables to 10');
        expect(multiplicationSpec.scope(g3)).toBe('times tables to 10');
    });

    it('renders the exact Year 3 toolbar subtitle with enabled controls', () => {
        // Exercise worksheet-kit.tsx through this factory alone; registration
        // in plugins/index.ts and dashboard integration are separate concerns.
        const plugin = MultiplicationWorksheet(DASHBOARD_FRAMEWORK);
        function Year3Toolbar() {
            const session = useDashboardSession();
            useEffect(() => {
                session.gradeId = 3;
            }, [session]);
            return createElement(plugin.toolbar!, {
                context: { pluginId: plugin.id, entryId: plugin.id, store: {}, entries: plugin.entries }
            });
        }
        const view = render(createElement(DashboardContextProvider, null, createElement(Year3Toolbar)));
        expect(view.getByTestId('toolbar-title').textContent).toBe('Year 3 \u2014 Multiplication');
        expect(view.getByText('Multiplication \u2014 times tables to 10')).toBeDefined();
        expect(view.getByTestId('toolbar-randomize').getAttribute('aria-disabled')).toBeNull();
        expect(view.getByTestId('toolbar-print').getAttribute('aria-disabled')).toBeNull();
    });
});

describe('multiplication — availability gating', () => {
    it('Prep and Year 1 do not offer times tables (empty sheets)', () => {
        expect(sheet(g0)).toEqual([]);
        expect(sheet(g1)).toEqual([]);
    });

    it('offers Years 2 and 3 through the sidebar gate without enabling later grades', () => {
        const plugin = MultiplicationWorksheet(DASHBOARD_FRAMEWORK);
        const gates: [boolean, boolean | undefined][] = [];
        // Grade order 0..12: each pair pins the spec gate and factory sidebar
        // gate independently; empty output is tested separately below.
        arrayEach([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], ({ value: id }) => {
            const grade = getGradeConfig(id);
            gates.push([multiplicationSpec.offered(grade), plugin.isOffered?.(grade)]);
        });
        expect(gates).toEqual([
            [false, false],
            [false, false],
            [true, true],
            [true, true],
            [false, false],
            [false, false],
            [false, false],
            [false, false],
            [false, false],
            [false, false],
            [false, false],
            [false, false],
            [false, false]
        ]);
    });

    // Explicit unoffered grades avoid deriving expected emptiness from the
    // gate being tested; both single-sheet and multi-page outputs are exact.
    it.each([0, 1, 4, 5, 6, 7, 8, 9, 10, 11, 12])('grade %i produces no multiplication document', (id) => {
        const grade = getGradeConfig(id);
        expect(sheet(grade)).toEqual([]);
        expect(generateDocument(multiplicationSpec, grade, seedFrom([id, 'mult', 0]), 2))
            .toEqual({ pages: [], total: 0 });
    });
});

describe('multiplication - Year 3 (times tables to 10)', () => {
    it('matches the exact Year 3 sheet using the unchanged Year 2 fact space', () => {
        // grades.ts changes only availability and multCap; the generator's
        // three unknown-factor/product forms and Year 2's pinned sheet stay intact.
        const s = sheet(g3);
        expect(s).toEqual([
            {"prompt":"7 × __ = 35","answer":"5","id":1,"type":"mult"},
            {"prompt":"__ × 1 = 9","answer":"9","id":2,"type":"mult"},
            {"prompt":"__ × 1 = 3","answer":"3","id":3,"type":"mult"},
            {"prompt":"9 × __ = 54","answer":"6","id":4,"type":"mult"},
            {"prompt":"6 × 1 = __","answer":"6","id":5,"type":"mult"},
            {"prompt":"4 × 6 = __","answer":"24","id":6,"type":"mult"},
            {"prompt":"__ × 1 = 4","answer":"4","id":7,"type":"mult"},
            {"prompt":"__ × 8 = 8","answer":"1","id":8,"type":"mult"},
            {"prompt":"__ × 8 = 72","answer":"9","id":9,"type":"mult"},
            {"prompt":"__ × 3 = 18","answer":"6","id":10,"type":"mult"},
            {"prompt":"10 × __ = 50","answer":"5","id":11,"type":"mult"},
            {"prompt":"__ × 5 = 45","answer":"9","id":12,"type":"mult"},
            {"prompt":"__ × 5 = 35","answer":"7","id":13,"type":"mult"},
            {"prompt":"4 × 8 = __","answer":"32","id":14,"type":"mult"},
            {"prompt":"__ × 2 = 12","answer":"6","id":15,"type":"mult"},
            {"prompt":"__ × 3 = 3","answer":"1","id":16,"type":"mult"},
            {"prompt":"7 × __ = 63","answer":"9","id":17,"type":"mult"},
            {"prompt":"8 × __ = 48","answer":"6","id":18,"type":"mult"},
            {"prompt":"__ × 5 = 20","answer":"4","id":19,"type":"mult"},
            {"prompt":"5 × __ = 50","answer":"10","id":20,"type":"mult"},
            {"prompt":"1 × 7 = __","answer":"7","id":21,"type":"mult"},
            {"prompt":"8 × 2 = __","answer":"16","id":22,"type":"mult"},
            {"prompt":"2 × 2 = __","answer":"4","id":23,"type":"mult"},
            {"prompt":"4 × 1 = __","answer":"4","id":24,"type":"mult"},
        ]);
        // Fill each unknown and pin every solved [a, b, product] tuple in
        // sheet order; exact facts replace broad operand-range checks.
        expect(s.map((p) => p.prompt.replace('__', p.answer).split(/ × | = /).map(Number))).toEqual([
            [7, 5, 35],
            [9, 1, 9],
            [3, 1, 3],
            [9, 6, 54],
            [6, 1, 6],
            [4, 6, 24],
            [4, 1, 4],
            [1, 8, 8],
            [9, 8, 72],
            [6, 3, 18],
            [10, 5, 50],
            [9, 5, 45],
            [7, 5, 35],
            [4, 8, 32],
            [6, 2, 12],
            [1, 3, 3],
            [7, 9, 63],
            [8, 6, 48],
            [4, 5, 20],
            [5, 10, 50],
            [1, 7, 7],
            [8, 2, 16],
            [2, 2, 4],
            [4, 1, 4]
        ]);
    });

    it('continues the exact stream on page 2 with unique prompts and continuous ids', () => {
        const seed = seedFrom([3, 'mult', 0]);
        const doc = generateDocument(multiplicationSpec, g3, seed, 2);
        expect(doc.total).toBe(48);
        expect(doc.pages.map((page) => page.length)).toEqual([24, 24]);
        expect(doc.pages[0]).toEqual(sheet(g3));
        expect(doc.pages[1]).toEqual([
            {"prompt":"1 × 10 = __","answer":"10","id":25,"type":"mult"},
            {"prompt":"8 × 4 = __","answer":"32","id":26,"type":"mult"},
            {"prompt":"__ × 3 = 15","answer":"5","id":27,"type":"mult"},
            {"prompt":"1 × __ = 10","answer":"10","id":28,"type":"mult"},
            {"prompt":"6 × 4 = __","answer":"24","id":29,"type":"mult"},
            {"prompt":"4 × __ = 32","answer":"8","id":30,"type":"mult"},
            {"prompt":"__ × 4 = 12","answer":"3","id":31,"type":"mult"},
            {"prompt":"__ × 10 = 90","answer":"9","id":32,"type":"mult"},
            {"prompt":"__ × 9 = 45","answer":"5","id":33,"type":"mult"},
            {"prompt":"__ × 2 = 4","answer":"2","id":34,"type":"mult"},
            {"prompt":"10 × 8 = __","answer":"80","id":35,"type":"mult"},
            {"prompt":"4 × 5 = __","answer":"20","id":36,"type":"mult"},
            {"prompt":"4 × __ = 16","answer":"4","id":37,"type":"mult"},
            {"prompt":"4 × __ = 28","answer":"7","id":38,"type":"mult"},
            {"prompt":"__ × 6 = 60","answer":"10","id":39,"type":"mult"},
            {"prompt":"1 × __ = 2","answer":"2","id":40,"type":"mult"},
            {"prompt":"9 × 6 = __","answer":"54","id":41,"type":"mult"},
            {"prompt":"__ × 7 = 14","answer":"2","id":42,"type":"mult"},
            {"prompt":"5 × __ = 30","answer":"6","id":43,"type":"mult"},
            {"prompt":"8 × 10 = __","answer":"80","id":44,"type":"mult"},
            {"prompt":"__ × 2 = 6","answer":"3","id":45,"type":"mult"},
            {"prompt":"2 × __ = 20","answer":"10","id":46,"type":"mult"},
            {"prompt":"9 × 3 = __","answer":"27","id":47,"type":"mult"},
            {"prompt":"7 × 9 = __","answer":"63","id":48,"type":"mult"},
        ]);
        // The arrayCreate factory stops at undefined, yielding exactly ids 1..48.
        expect(doc.pages.flat().map((p) => p.id)).toEqual(arrayCreate(({ index }) => index < 48 ? index + 1 : undefined));
        expect(new Set(doc.pages.flat().map((p) => p.prompt)).size).toBe(48);
        expect(generateDocument(multiplicationSpec, g3, seed, 3).pages.slice(0, 2)).toEqual(doc.pages);
    });

    it('repeats identical seeds and pins a fresh deterministic refresh stream', () => {
        const seed = seedFrom([3, 'mult', 0]);
        const refreshedSeed = seedFrom([3, 'mult', 1]);
        const doc = generateDocument(multiplicationSpec, g3, seed, 2);
        const refreshed = generateDocument(multiplicationSpec, g3, refreshedSeed, 2);
        expect(generateDocument(multiplicationSpec, g3, seed, 2)).toEqual(doc);
        expect(refreshed.pages[0].slice(0, 3)).toEqual([
            {"prompt":"6 × __ = 18","answer":"3","id":1,"type":"mult"},
            {"prompt":"4 × __ = 20","answer":"5","id":2,"type":"mult"},
            {"prompt":"4 × __ = 32","answer":"8","id":3,"type":"mult"},
        ]);
        expect(refreshed.total).toBe(48);
        expect(refreshed).not.toEqual(doc);
        expect(generateDocument(multiplicationSpec, g3, refreshedSeed, 2)).toEqual(refreshed);
        // The same cap and seed yield the same fact stream in Years 2 and 3;
        // the usual grade-specific seeds produce their different pinned sheets.
        expect(generateDocument(multiplicationSpec, g2, seed, 2)).toEqual(doc);
    });
});

describe('multiplication — Year 2 (times tables to 10)', () => {
    it('matches the exact Grade 2 times-tables sheet (operands <= 10)', () => {
        const s = sheet(g2);
        expect(s).toEqual([
            {"prompt":"5 × __ = 50","answer":"10","id":1,"type":"mult"},
            {"prompt":"7 × __ = 63","answer":"9","id":2,"type":"mult"},
            {"prompt":"__ × 7 = 42","answer":"6","id":3,"type":"mult"},
            {"prompt":"__ × 9 = 9","answer":"1","id":4,"type":"mult"},
            {"prompt":"__ × 4 = 12","answer":"3","id":5,"type":"mult"},
            {"prompt":"__ × 9 = 45","answer":"5","id":6,"type":"mult"},
            {"prompt":"10 × __ = 100","answer":"10","id":7,"type":"mult"},
            {"prompt":"__ × 2 = 6","answer":"3","id":8,"type":"mult"},
            {"prompt":"10 × 6 = __","answer":"60","id":9,"type":"mult"},
            {"prompt":"5 × 8 = __","answer":"40","id":10,"type":"mult"},
            {"prompt":"1 × __ = 3","answer":"3","id":11,"type":"mult"},
            {"prompt":"2 × __ = 6","answer":"3","id":12,"type":"mult"},
            {"prompt":"9 × __ = 18","answer":"2","id":13,"type":"mult"},
            {"prompt":"__ × 6 = 24","answer":"4","id":14,"type":"mult"},
            {"prompt":"3 × __ = 15","answer":"5","id":15,"type":"mult"},
            {"prompt":"2 × 9 = __","answer":"18","id":16,"type":"mult"},
            {"prompt":"10 × 7 = __","answer":"70","id":17,"type":"mult"},
            {"prompt":"3 × __ = 9","answer":"3","id":18,"type":"mult"},
            {"prompt":"9 × __ = 81","answer":"9","id":19,"type":"mult"},
            {"prompt":"__ × 3 = 18","answer":"6","id":20,"type":"mult"},
            {"prompt":"9 × __ = 27","answer":"3","id":21,"type":"mult"},
            {"prompt":"2 × 5 = __","answer":"10","id":22,"type":"mult"},
            {"prompt":"4 × 8 = __","answer":"32","id":23,"type":"mult"},
            {"prompt":"4 × __ = 20","answer":"5","id":24,"type":"mult"},
        ]);
        // Every operand is within the times-tables cap and every equation is a
        // correct fact, across all three forms: product, first factor or
        // second factor unknown.
        for (const p of s) {
            const product = p.prompt.match(/^(\d+) × (\d+) = __$/);
            const missFirst = p.prompt.match(/^__ × (\d+) = (\d+)$/);
            const missSecond = p.prompt.match(/^(\d+) × __ = (\d+)$/);
            if (product) {
                const a = Number(product[1]);
                const b = Number(product[2]);
                expect(a).toBeLessThanOrEqual(10);
                expect(b).toBeLessThanOrEqual(10);
                expect(p.answer).toBe(`${a * b}`);
            } else if (missFirst) {
                const b = Number(missFirst[1]);
                const c = Number(missFirst[2]);
                expect(b).toBeLessThanOrEqual(10);
                expect(c).toBeLessThanOrEqual(100);
                expect(p.answer).toBe(`${c / b}`);
            } else if (missSecond) {
                const a = Number(missSecond[1]);
                const c = Number(missSecond[2]);
                expect(a).toBeLessThanOrEqual(10);
                expect(c).toBeLessThanOrEqual(100);
                expect(p.answer).toBe(`${c / a}`);
            } else {
                throw new Error(`unrecognised mult prompt: ${p.prompt}`);
            }
        }
    });

    it('Grade 2 multiplication, 2 pages, continues the exact stream on page 2', () => {
        const doc = generateDocument(multiplicationSpec, g2, seedFrom([2, 'mult', 0]), 2);
        expect(doc.pages).toHaveLength(2);
        expect(doc.total).toBe(48);
        // Pinned head of the page-2 stream (ids 25, 26, 27).
        expect(doc.pages[1].slice(0, 3)).toEqual([
            {"prompt":"__ × 6 = 48","answer":"8","id":25,"type":"mult"},
            {"prompt":"__ × 5 = 45","answer":"9","id":26,"type":"mult"},
            {"prompt":"__ × 1 = 6","answer":"6","id":27,"type":"mult"},
        ]);
        // Page 1 still equals the single-page sheet (stream is one continuous run).
        expect(doc.pages[0]).toEqual(sheet(g2));
    });
});
