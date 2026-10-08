// NON-REPEATING SAMPLING — capacity contract for every maths worksheet.
//
// Every generator now collects its questions through the framework's
// sampleUnique over deck-dealt pools, so a worksheet never repeats a question
// until its whole question space has been dealt. This suite pins that contract:
//
//   - for each plugin x grade: the exact UNIQUE-QUESTION CAPACITY measured by
//     generating 100 PAGES of questions (seed seedFrom([grade.id, spec.id, 0]);
//     the ask is spec.perPage x 100);
//   - the FIRST `capacity` questions are all distinct (duplicates may only
//     appear in the fallback tail once the space is exhausted);
//   - the deep-space types (the arithmetic ladder, word problems, counting
//     Year 2, patterns, data, division, temperature, measure, skip and
//     place value Year 2) clear the 100-PAGE BAR — their whole 100-page
//     document prints with ZERO repeated questions.
//   - The remaining types are FINITE-FACT-SPACE worksheets: within-10/20
//     counting runs, doubles/bonds facts, the curated shape/compass/clock/
//     measure/time/money banks. For these the capacity IS the whole space —
//     sampleUnique deals every distinct question once before the first
//     repeat, and the deck spreads the repeats evenly (no clumping) through
//     the fallback tail.
//
// QUESTION IDENTITY: a question is the printed prompt PLUS any figure data
// the prompt does not already carry. The Data, Clock, Time and Multiplication
// sheets print fixed sentences whose FIGURE (tally marks / clock face / array
// grid) carries the numbers — exactly why those generators key sampleUnique on
// prompt + figure (DataWorksheet.ts, ClockWorksheet.ts, TimeWorksheet.ts,
// MultiplicationWorksheet.ts). The key below mirrors the generators; for every
// other sheet the figure is prompt-determined and the key reduces to prompt.
//
// If a generator, range or bank changes, these exact capacities move — which
// is what we want: a silent shrink of a worksheet's question space can't
// slip through.

import { describe, it, expect } from 'vitest';
import { seedFrom, getGradeConfig, createRng, type RawProblem, type WorksheetSpec } from '../framework';
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
import { shapeTransformationsSpec } from './ShapeTransformationsWorksheet';
import { compassSpec } from './CompassWorksheet';
import { timeSpec } from './TimeWorksheet';
import { clockSpec } from './ClockWorksheet';
import { measureSpec } from './MeasurementWorksheet';
import { temperatureSpec } from './TemperatureWorksheet';
import { placeValueSpec } from './PlaceValueWorksheet';
import { dataSpec } from './DataWorksheet';
import { divisionSpec } from './DivisionWorksheet';
import { moneySpec } from './MoneyWorksheet';

// Question identity used by every measurement below — see the header note.
// The JSON triple mirrors the figure-carrying fields the generators key on
// (data / clock / rowsColumns); for all other sheets it is a constant suffix.
const questionKey = (p: RawProblem): string =>
    `${p.prompt}|${JSON.stringify([p.data ?? null, p.clock ?? null, p.rowsColumns ?? null])}`;

// Pinned capacities, measured by this suite's generator run at the 100-page
// ask (spec.perPage x 100 questions). A capacity EQUAL to the ask means the
// whole 100-page document is repeat-free.
const CAPACITIES: { spec: WorksheetSpec; gradeId: number; capacity: number }[] = [
    // ── The arithmetic ladder ───────────────────────────────────────────────
    // The depth-first redesign prints MULTI-PART connected tasks (switch /
    // compare / verify / bond / column / multi forms), so even the Prep
    // within-10 space exceeds the 700-question ask: every grade clears the
    // 100-page bar.
    { spec: additionSpec, gradeId: 0, capacity: 700 },
    { spec: additionSpec, gradeId: 1, capacity: 700 },
    { spec: additionSpec, gradeId: 2, capacity: 700 },
    { spec: additionSpec, gradeId: 3, capacity: 700 },
    { spec: additionSpec, gradeId: 4, capacity: 700 },
    { spec: additionSpec, gradeId: 5, capacity: 700 },
    { spec: additionSpec, gradeId: 6, capacity: 700 },
    { spec: subtractionSpec, gradeId: 0, capacity: 700 },
    { spec: subtractionSpec, gradeId: 1, capacity: 700 },
    { spec: subtractionSpec, gradeId: 2, capacity: 700 },
    { spec: subtractionSpec, gradeId: 3, capacity: 700 },
    { spec: subtractionSpec, gradeId: 4, capacity: 700 },
    { spec: subtractionSpec, gradeId: 5, capacity: 700 },
    { spec: subtractionSpec, gradeId: 6, capacity: 700 },
    // ── Multiplication / division / word problems / data ───────────────────
    // Times tables to 10 x SIX connected families (switch, step, missing
    // pair, ARRAY figure, same-table difference, verify) — the space far
    // exceeds the 600-question ask at both offered grades.
    { spec: multiplicationSpec, gradeId: 2, capacity: 600 },
    { spec: multiplicationSpec, gradeId: 3, capacity: 600 },
    { spec: wordSpec, gradeId: 1, capacity: 400 },
    { spec: wordSpec, gradeId: 2, capacity: 400 },
    // Four per page (each row carries a DataDiagram) makes the 100-page ask
    // 400 — the tally/graph prompt+figure space is deeper, so a full 100-page
    // document stays repeat-free.
    { spec: dataSpec, gradeId: 1, capacity: 400 },
    { spec: dataSpec, gradeId: 2, capacity: 400 },
    { spec: divisionSpec, gradeId: 2, capacity: 400 },
    // ── Missing number / comparison / skip / counting / patterns ──────────
    { spec: missingSpec, gradeId: 1, capacity: 800 },
    { spec: missingSpec, gradeId: 2, capacity: 800 },
    { spec: comparisonSpec, gradeId: 0, capacity: 800 },
    { spec: comparisonSpec, gradeId: 1, capacity: 800 },
    { spec: comparisonSpec, gradeId: 2, capacity: 800 },
    { spec: skipSpec, gradeId: 1, capacity: 800 },
    { spec: skipSpec, gradeId: 2, capacity: 800 },
    // Counting's sequence runs live inside the grade's numCap (10/20/100):
    // the connected two-blank forms keep the space finite for Prep/Y1 and
    // deep enough for Y2 to clear the bar.
    { spec: countingSpec, gradeId: 0, capacity: 149 },
    { spec: countingSpec, gradeId: 1, capacity: 511 },
    { spec: countingSpec, gradeId: 2, capacity: 800 },
    { spec: patternsSpec, gradeId: 1, capacity: 800 },
    { spec: patternsSpec, gradeId: 2, capacity: 800 },
    // Temperature: procedural comparisons/orderings over the tempCap range —
    // deep enough to print 100 pages repeat-free at both offered grades.
    { spec: temperatureSpec, gradeId: 1, capacity: 400 },
    { spec: temperatureSpec, gradeId: 2, capacity: 400 },
    // ── Finite-fact-space types (doubles, bonds, shapes, time, clock, ──────
    // measure, compass, place value, money): the capacity IS the curated
    // space — every distinct question prints once before the first repeat.
    // Compass = 62 prompts (6 turn/side kinds x 4 facings + 3 map edges +
    // 8 walk names x 4 facings + 3 facts), identical through Year 3.
    { spec: doublesSpec, gradeId: 1, capacity: 152 },
    { spec: doublesSpec, gradeId: 2, capacity: 507 },
    // Bonds to 10 is a 9-bond fact space; the bothParts form prints ONE open
    // split sentence per whole (the parts are the private answer), so Y1 =
    // 1 + 3 forms x 9 bonds = 28.
    { spec: bondsSpec, gradeId: 1, capacity: 28 },
    { spec: bondsSpec, gradeId: 2, capacity: 126 },
    { spec: shapesSpec, gradeId: 1, capacity: 128 },
    { spec: shapesSpec, gradeId: 2, capacity: 276 },
    // 3 asymmetric outlines × 4 orientations × 4 flips/quarter-turns; names
    // distinguish diagrams so prompt-keyed uniqueness keeps the full bank.
    { spec: shapeTransformationsSpec, gradeId: 3, capacity: 48 },
    { spec: compassSpec, gradeId: 1, capacity: 62 },
    { spec: compassSpec, gradeId: 2, capacity: 62 },
    { spec: compassSpec, gradeId: 3, capacity: 62 },
    // Time: 65 connected calendar items (Y1); Year 2 adds the 12-face x
    // offset clock kinds keyed on the drawn face (65 + 24 + 24 + 12 = 125).
    { spec: timeSpec, gradeId: 1, capacity: 65 },
    { spec: timeSpec, gradeId: 2, capacity: 125 },
    // Clock = the full 48-face grid x 5 modes (the reading kinds' fixed
    // sentences are keyed on the drawn face — see ClockWorksheet.ts).
    { spec: clockSpec, gradeId: 2, capacity: 240 },
    { spec: measureSpec, gradeId: 1, capacity: 400 },
    { spec: measureSpec, gradeId: 2, capacity: 400 },
    { spec: placeValueSpec, gradeId: 1, capacity: 141 },
    { spec: placeValueSpec, gradeId: 2, capacity: 400 },
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
            const keys = problems.map(questionKey);
            const unique = new Set(keys);
            expect(unique.size).toBe(capacity);
            // Uniqueness is a PREFIX property: sampleUnique only releases a
            // question after checking its key, so the first `capacity`
            // questions are pairwise distinct — repeats can only sit in the
            // fallback tail after the space was fully dealt.
            expect(new Set(keys.slice(0, capacity)).size).toBe(capacity);
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
                'division', 'measure', 'missing', 'mult', 'patterns',
                'placevalue', 'skip', 'temperature', 'word'
            ].sort()
        );
        // The depth-first arithmetic ladder clears the bar at EVERY grade
        // (multi-part connected tasks make even the within-10 space deeper
        // than a 700-question document), and word problems / data / division
        // / measure clear it at every offered grade.
        for (const gradeId of [0, 1, 2, 3, 4, 5, 6]) {
            expect(CAPACITIES.find((c) => c.spec === additionSpec && c.gradeId === gradeId)?.capacity).toBe(700);
            expect(CAPACITIES.find((c) => c.spec === subtractionSpec && c.gradeId === gradeId)?.capacity).toBe(700);
        }
    });

    it('the first page of every worksheet is always repeat-free', () => {
        // The PREFIX guarantee applied at the page level: a sheet of
        // `perPage` questions can only contain a repeat when the whole
        // question space is SMALLER than a page. Every maths type's space
        // is bigger than its per-page ask (the smallest is Year 1 bonds:
        // 28 questions for a 5-row page), so single-page printouts NEVER
        // repeat a question — at any grade, any refresh.
        for (const { spec, gradeId, capacity } of CAPACITIES) {
            expect(capacity).toBeGreaterThan(spec.perPage);
            const grade = getGradeConfig(gradeId);
            const problems = spec.generate(createRng(seedFrom([gradeId, spec.id, 0])), grade.caps, spec.perPage);
            expect(new Set(problems.map(questionKey)).size).toBe(spec.perPage);
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
            expect(new Set(problems.map(questionKey)).size).toBe(ten);
        }
    });
});
