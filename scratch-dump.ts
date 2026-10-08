// TEMPORARY scratch dump (deleted after use): captures the exact deterministic
// sheets for every owned plugin spec/grade so the owned tests can pin them.
import { seedFrom, getGradeConfig, generateSheet, generateDocument, createRng } from './src/framework';
import { additionSpec } from './src/plugins/AdditionWorksheet';
import { subtractionSpec } from './src/plugins/SubtractionWorksheet';
import { multiplicationSpec } from './src/plugins/MultiplicationWorksheet';
import { missingSpec } from './src/plugins/MissingNumberWorksheet';
import { comparisonSpec } from './src/plugins/CompareWorksheet';
import { skipSpec } from './src/plugins/SkipCountingWorksheet';
import { doublesSpec } from './src/plugins/DoublesWorksheet';
import { bondsSpec } from './src/plugins/NumberBondsWorksheet';
import { patternsSpec } from './src/plugins/PatternsWorksheet';

const specs = [additionSpec, subtractionSpec, multiplicationSpec, missingSpec, comparisonSpec, skipSpec, doublesSpec, bondsSpec, patternsSpec];

const PIN: Record<string, number[]> = {
    addition: [0, 1, 2, 3, 4, 5, 6],
    subtraction: [0, 1, 2, 3, 4, 5, 6],
    mult: [2, 3],
    missing: [1, 2],
    comparison: [0, 1, 2],
    skip: [1, 2],
    doubles: [1, 2],
    bonds: [1, 2],
    patterns: [1, 2]
};

for (const spec of specs) {
    for (const gradeId of PIN[spec.id]) {
        const grade = getGradeConfig(gradeId);
        const sheet = generateSheet(spec, grade, seedFrom([gradeId, spec.id, 0]));
        console.log(`SHEET ${spec.id} g${gradeId} ${JSON.stringify(sheet)}`);
    }
}

// Page-2 continuations (documents).
const docs: [typeof specs[number], number][] = [
    [additionSpec, 1], [additionSpec, 6], [subtractionSpec, 6], [multiplicationSpec, 3], [skipSpec, 1]
];
for (const [spec, gradeId] of docs) {
    const grade = getGradeConfig(gradeId);
    const doc = generateDocument(spec, grade, seedFrom([gradeId, spec.id, 0]), 2);
    console.log(`PAGE2 ${spec.id} g${gradeId} ${JSON.stringify(doc.pages[1])}`);
}

// New capacities at the 100-page ask (for the shared unique-sampling.test.ts flag).
for (const spec of specs) {
    for (const gradeId of PIN[spec.id]) {
        const grade = getGradeConfig(gradeId);
        const ask = spec.perPage * 100;
        const problems = spec.generate(createRng(seedFrom([gradeId, spec.id, 0])), grade.caps, ask);
        const unique = new Set(problems.map((p) => p.prompt)).size;
        console.log(`CAPACITY ${spec.id} g${gradeId} ask=${ask} unique=${unique}`);
    }
}

// First-row strings (for the shared MathsDashboard.test.tsx flag).
const firsts: [typeof specs[number], number][] = [
    [additionSpec, 0], [additionSpec, 1], [additionSpec, 2], [additionSpec, 3], [additionSpec, 4],
    [subtractionSpec, 1], [subtractionSpec, 3], [multiplicationSpec, 3], [multiplicationSpec, 2]
];
for (const [spec, gradeId] of firsts) {
    const grade = getGradeConfig(gradeId);
    const sheet = generateSheet(spec, grade, seedFrom([gradeId, spec.id, 0]));
    console.log(`FIRST ${spec.id} g${gradeId} ${JSON.stringify(sheet[0])}`);
}
