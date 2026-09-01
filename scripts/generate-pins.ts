// One-off pin generator: regenerates the exact deterministic sheets the
// per-plugin test files pin. Run with:
//   npx vite-node scripts/generate-pins.ts > pins.json
// (Output is JSON keyed by "<specId>:<gradeId>" -> { page1: Problem[],
//   page2head: Problem[3] }.)
//
// NOTE: this script is a development tool, NOT part of the test suite. It
// exists so a future agent can regenerate pins after changing a generator or
// word bank without hand-copying values.

import { seedFrom, getGradeConfig, generateSheet, generateDocument } from '../src/framework';
import {
    additionSpec, subtractionSpec, multiplicationSpec, missingSpec,
    comparisonSpec, skipSpec, wordSpec, countingSpec, doublesSpec,
    bondsSpec, patternsSpec, shapesSpec, timeSpec, clockSpec,
    measureSpec, placeValueSpec, dataSpec, divisionSpec, moneySpec
} from '../src/plugins/pins';

const SPECS = [
    additionSpec, subtractionSpec, multiplicationSpec, missingSpec,
    comparisonSpec, skipSpec, wordSpec, countingSpec, doublesSpec,
    bondsSpec, patternsSpec, shapesSpec, timeSpec, clockSpec,
    measureSpec, placeValueSpec, dataSpec, divisionSpec, moneySpec
];

// Grades that list each spec id (its offered grades).
const out: Record<string, unknown> = {};
for (const spec of SPECS) {
    for (const gradeId of [0, 1, 2, 3, 4, 5, 6]) {
        const grade = getGradeConfig(gradeId);
        if (!spec.offered(grade)) continue;
        const seed = seedFrom([grade.id, spec.id, 0]);
        const page1 = generateSheet(spec, grade, seed);
        const doc = generateDocument(spec, grade, seed, 2);
        out[`${spec.id}:${gradeId}`] = {
            page1,
            page2head: doc.pages[1].slice(0, 3),
            page2: doc.pages[1]
        };
    }
}
console.log(JSON.stringify(out, null, 1));
