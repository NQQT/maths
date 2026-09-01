// TEMPORARY scratch — measure real unique-question capacities at the
// 100-page ask. DELETE AFTER USE (results are copied into
// unique-sampling.test.ts as pinned values).
import { seedFrom, getGradeConfig, createRng } from '../src/framework';
import {
    additionSpec, subtractionSpec, multiplicationSpec, missingSpec,
    comparisonSpec, skipSpec, wordSpec, countingSpec, doublesSpec,
    bondsSpec, patternsSpec, shapesSpec, timeSpec, clockSpec,
    measureSpec, placevalueSpec, dataSpec, divisionSpec, moneySpec
} from '../src/plugins/pins';

const SPECS = [
    additionSpec, subtractionSpec, multiplicationSpec, missingSpec,
    comparisonSpec, skipSpec, wordSpec, countingSpec, doublesSpec,
    bondsSpec, patternsSpec, shapesSpec, timeSpec, clockSpec,
    measureSpec, placevalueSpec, dataSpec, divisionSpec, moneySpec
];

for (const spec of SPECS) {
    for (const gradeId of [0, 1, 2, 3, 4, 5, 6]) {
        const grade = getGradeConfig(gradeId);
        if (!spec.offered(grade)) continue;
        const ask = spec.perPage * 100;
        const problems = spec.generate(createRng(seedFrom([gradeId, spec.id, 0])), grade.caps, ask);
        const unique = new Set(problems.map((p) => p.prompt));
        const bar = unique.size === ask ? ' CLEARS' : '';
        console.log(`${spec.id} g${gradeId}: ${unique.size} unique of ${ask}${bar}`);
    }
}
