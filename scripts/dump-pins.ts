// Dev tool: dumps the pinned sheets as ready-to-paste TypeScript array
// literals (the exact style the per-plugin tests use), so a human/agent can
// assemble test files without hand-formatting.
//
// Run:  npx vite-node scripts/dump-pins.ts
// NOT part of the test suite.

import { seedFrom, getGradeConfig, generateSheet, generateDocument, type Problem } from '../src/framework';
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

const obj = (p: Problem) => {
    const fields: string[] = [];
    fields.push(`id: ${p.id}`);
    fields.push(`type: '${p.type}'`);
    fields.push(`prompt: ${JSON.stringify(p.prompt)}`);
    fields.push(`answer: ${JSON.stringify(p.answer)}`);
    if (p.clock) {
        const c = p.clock.hands === false ? `, hands: ${p.clock.hands}` : '';
        fields.push(`clock: { hour: ${p.clock.hour}, minute: ${p.clock.minute}${c} }`);
    }
    if (p.wideBlanks) fields.push(`wideBlanks: true`);
    if (p.answerLine) fields.push(`answerLine: true`);
    return `                { ${fields.join(', ')} }`;
};

const arr = (rows: Problem[]) => `[\n${rows.map(obj).join(',\n')}\n            ]`;

for (const spec of SPECS) {
    for (const gradeId of [0, 1, 2, 3, 4, 5, 6]) {
        const grade = getGradeConfig(gradeId);
        if (!spec.offered(grade)) continue;
        const seed = seedFrom([grade.id, spec.id, 0]);
        const page1 = generateSheet(spec, grade, seed);
        const page2head = generateDocument(spec, grade, seed, 2).pages[1].slice(0, 3);
        console.log(`\n===== ${spec.id} grade ${gradeId} page1 =====`);
        console.log(arr(page1));
        console.log(`===== ${spec.id} grade ${gradeId} page2head =====`);
        console.log(arr(page2head));
    }
}
