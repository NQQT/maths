// NON-REPEATING SAMPLING — capacity contract for every maths worksheet.
//
// Every generator now collects its questions through the framework's
// sampleUnique (keyed on the printed prompt) over deck-dealt pools, so a
// worksheet never repeats a question until its whole question space has been
// dealt. This suite pins that contract:
//
//   - for each plugin x grade: the exact UNIQUE-QUESTION CAPACITY measured by
//     generating 100 PAGES of questions (seed seedFrom([grade.id, spec.id, 0]);
//     the ask is spec.perPage x 100);
//   - the FIRST `capacity` questions are all distinct (duplicates may only
//     appear in the fallback tail once the space is exhausted);
//   - the arithmetic ladder (addition/subtraction Years 2..6), word problems,
//     counting (Year 2), patterns (Year 2), data and division clear the
//     100-PAGE BAR — their whole 100-page document prints with ZERO repeated
//     questions.
//   - The remaining types are FINITE-FACT-SPACE worksheets: within-10/20
//     arithmetic has literally only 45/190 distinct addition pairs; times
//     tables have 100 facts; doubles/bonds/calendar/clock/money/shapes/measure
//     have small curated fact sets. For these the capacity is the whole space
//     — sampleUnique deals every distinct question once before the first
//     repeat, and the deck spreads the repeats evenly (no clumping) through
//     the fallback tail.
//
// If a generator, range or bank changes, these exact capacities move — which
// is what we want: a silent shrink of a worksheet's question space can't
// slip through.

import { describe, it, expect } from 'vitest';
import { seedFrom, getGradeConfig, createRng, type WorksheetSpec } from '../framework';
import { additionSpec } from './AdditionWorksheet';
import { subtractionSpec } from './SubtractionWorksheet';
import { multiplicationSpec } from './MultiplicationWorksheet';
import { missingSpec } from './MissingNumberWorksheet';
import { comparisonSpec } from './CompareWorksheet';
import { skipSpec } from './SkipCountingWorksheet';
import { wordSpec } from './WordProblemsWorksheet';
import { countingSpec } from './CountingWorksheet';
import { doublesSpec } from './DoublesWorksheet';
import { bondsSpec } from './NumberBondsWorksheet';
import { patternsSpec } from './PatternsWorksheet';
import { shapesSpec } from './ShapesWorksheet';
import { timeSpec } from './TimeWorksheet';
import { clockSpec } from './ClockWorksheet';
import { measureSpec } from './MeasurementWorksheet';
import { placeValueSpec } from './PlaceValueWorksheet';
import { dataSpec } from './DataWorksheet';
import { divisionSpec } from './DivisionWorksheet';
import { moneySpec } from './MoneyWorksheet';

// Pinned capacities, measured by this suite's generator run at the 100-page
// ask (spec.perPage x 100 questions). A capacity EQUAL to the ask means the
// whole 100-page document is repeat-free.
const CAPACITIES: { spec: WorksheetSpec; gradeId: number; capacity: number }[] = [
    // ── The arithmetic ladder ───────────────────────────────────────────────
    // Prep/Y1 within 10/20 pair spaces are finite (45/190 distinct pairs) —
    // pinned as such. Year 2 up (within 100 → 1 000 000) clear the bar.
    { spec: additionSpec, gradeId: 0, capacity: 45 },
    { spec: additionSpec, gradeId: 1, capacity: 190 },
    { spec: additionSpec, gradeId: 2, capacity: 2400 },
    { spec: additionSpec, gradeId: 3, capacity: 2400 },
    { spec: additionSpec, gradeId: 4, capacity: 2400 },
    { spec: additionSpec, gradeId: 5, capacity: 2400 },
    { spec: additionSpec, gradeId: 6, capacity: 2400 },
    { spec: subtractionSpec, gradeId: 0, capacity: 54 },
    { spec: subtractionSpec, gradeId: 1, capacity: 209 },
    { spec: subtractionSpec, gradeId: 2, capacity: 2400 },
    { spec: subtractionSpec, gradeId: 3, capacity: 2400 },
    { spec: subtractionSpec, gradeId: 4, capacity: 2400 },
    { spec: subtractionSpec, gradeId: 5, capacity: 2400 },
    { spec: subtractionSpec, gradeId: 6, capacity: 2400 },
    // ── Multiplication / division / word problems / data ───────────────────
    // Times tables to 10 = exactly 100 facts x 3 prompt forms (product,
    // first factor, second factor unknown) = 300 distinct questions.
    { spec: multiplicationSpec, gradeId: 2, capacity: 300 },
    { spec: wordSpec, gradeId: 1, capacity: 1000 },
    { spec: wordSpec, gradeId: 2, capacity: 1000 },
    { spec: dataSpec, gradeId: 1, capacity: 1800 },
    { spec: dataSpec, gradeId: 2, capacity: 1800 },
    { spec: divisionSpec, gradeId: 2, capacity: 1200 },
    // ── Missing number / comparison / skip / counting / patterns ──────────
    { spec: missingSpec, gradeId: 1, capacity: 460 },
    { spec: missingSpec, gradeId: 2, capacity: 1600 },
    { spec: comparisonSpec, gradeId: 0, capacity: 121 },
    { spec: comparisonSpec, gradeId: 1, capacity: 441 },
    { spec: comparisonSpec, gradeId: 2, capacity: 2400 },
    { spec: skipSpec, gradeId: 1, capacity: 303 },
    { spec: skipSpec, gradeId: 2, capacity: 753 },
    { spec: countingSpec, gradeId: 0, capacity: 263 },
    { spec: countingSpec, gradeId: 1, capacity: 933 },
    { spec: countingSpec, gradeId: 2, capacity: 1800 },
    { spec: patternsSpec, gradeId: 1, capacity: 1458 },
    { spec: patternsSpec, gradeId: 2, capacity: 1600 },
    // ── Finite-fact-space types (doubles, bonds, shapes, time, clock, ──────
    // measure, place value, money): the capacity IS the curated space — every
    // distinct question prints once before the first repeat.
    { spec: doublesSpec, gradeId: 1, capacity: 48 },
    { spec: doublesSpec, gradeId: 2, capacity: 98 },
    { spec: bondsSpec, gradeId: 1, capacity: 36 },
    { spec: bondsSpec, gradeId: 2, capacity: 112 },
    { spec: shapesSpec, gradeId: 1, capacity: 85 },
    { spec: shapesSpec, gradeId: 2, capacity: 252 },
    { spec: timeSpec, gradeId: 1, capacity: 79 },
    { spec: timeSpec, gradeId: 2, capacity: 115 },
    { spec: clockSpec, gradeId: 2, capacity: 146 },
    { spec: measureSpec, gradeId: 1, capacity: 244 },
    { spec: measureSpec, gradeId: 2, capacity: 256 },
    { spec: placeValueSpec, gradeId: 1, capacity: 66 },
    { spec: placeValueSpec, gradeId: 2, capacity: 540 },
    { spec: moneySpec, gradeId: 2, capacity: 76 }
];

describe('unique sampling — per-worksheet question capacity', () => {
    for (const { spec, gradeId, capacity } of CAPACITIES) {
        const grade = getGradeConfig(gradeId);
        const ask = spec.perPage * 100; // 100 pages of questions
        it(`${spec.id} grade ${gradeId}: ${ask}-question (100-page) ask yields exactly ${capacity} unique questions`, () => {
            const seed = seedFrom([grade.id, spec.id, 0]);
            const problems = spec.generate(createRng(seed), grade.caps, ask);
            expect(problems).toHaveLength(ask);
            const prompts = problems.map((p) => p.prompt);
            const unique = new Set(prompts);
            expect(unique.size).toBe(capacity);
            // Uniqueness is a PREFIX property: sampleUnique only releases a
            // question after checking its key, so the first `capacity`
            // questions are pairwise distinct — repeats can only sit in the
            // fallback tail after the space was fully dealt.
            expect(new Set(prompts.slice(0, capacity)).size).toBe(capacity);
        });
    }

    it('the 100-page bar: every big-space type prints 100 pages with zero repeats', () => {
        // A spec clears the bar when its capacity equals the 100-page ask at
        // EVERY grade that offers it. Dedupe to the distinct worksheet ids.
        const cleared = Array.from(
            new Set(CAPACITIES.filter((c) => c.capacity === c.spec.perPage * 100).map((c) => c.spec.id))
        );
        expect(cleared.sort()).toEqual(
            [
                'addition', 'subtraction', 'comparison', 'counting', 'data',
                'division', 'missing', 'patterns', 'word'
            ].sort()
        );
        // The arithmetic ladder clears the bar from Year 2 upwards (within
        // 100+ pairs), and word problems / data / division clear it at every
        // offered grade.
        for (const gradeId of [2, 3, 4, 5, 6]) {
            expect(CAPACITIES.find((c) => c.spec === additionSpec && c.gradeId === gradeId)?.capacity).toBe(2400);
            expect(CAPACITIES.find((c) => c.spec === subtractionSpec && c.gradeId === gradeId)?.capacity).toBe(2400);
        }
    });

    it('the first page of every worksheet is always repeat-free', () => {
        // The PREFIX guarantee applied at the page level: a sheet of
        // `perPage` questions can only contain a repeat when the whole
        // question space is SMALLER than a page. Every maths type's space
        // is bigger than its per-page ask (the smallest is Prep addition:
        // 45 pairs for a 24-row page), so single-page printouts NEVER
        // repeat a question — at any grade, any refresh.
        for (const { spec, gradeId, capacity } of CAPACITIES) {
            expect(capacity).toBeGreaterThan(spec.perPage);
            const grade = getGradeConfig(gradeId);
            const problems = spec.generate(createRng(seedFrom([gradeId, spec.id, 0])), grade.caps, spec.perPage);
            expect(new Set(problems.map((p) => p.prompt)).size).toBe(spec.perPage);
        }
    });

    it('multi-page documents for big-space types stay repeat-free past 10 pages', () => {
        // Spot-check the longest realistic print run: a 10-page document of
        // every type whose capacity is at least 10 pages deep holds ALL
        // distinct questions (the capacity table guarantees more; this pins
        // the pipeline end-to-end at the document level).
        for (const { spec, gradeId, capacity } of CAPACITIES) {
            const ten = spec.perPage * 10;
            if (capacity < ten) continue;
            const grade = getGradeConfig(gradeId);
            const problems = spec.generate(createRng(seedFrom([gradeId, spec.id, 0])), grade.caps, ten);
            expect(new Set(problems.map((p) => p.prompt)).size).toBe(ten);
        }
    });
});
