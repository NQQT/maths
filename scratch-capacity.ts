// TEMPORARY review scratch (deleted after use): independently measures the
// unique-question capacity of every CAPACITIES entry in unique-sampling.test.ts
// at the 100-page ask (spec.perPage x 100, seed seedFrom([grade.id, spec.id, 0])),
// plus the prefix-distinctness and 10-page properties the suite pins.
import { seedFrom, getGradeConfig, createRng, type WorksheetSpec } from './src/framework';
import { additionSpec } from './src/plugins/AdditionWorksheet';
import { subtractionSpec } from './src/plugins/SubtractionWorksheet';
import { multiplicationSpec } from './src/plugins/MultiplicationWorksheet';
import { missingSpec } from './src/plugins/MissingNumberWorksheet';
import { comparisonSpec } from './src/plugins/CompareWorksheet';
import { skipSpec } from './src/plugins/SkipCountingWorksheet';
import { wordSpec } from './src/plugins/WordProblemsWorksheet';
import { countingSpec } from './src/plugins/CountingWorksheet';
import { doublesSpec } from './src/plugins/DoublesWorksheet';
import { bondsSpec } from './src/plugins/NumberBondsWorksheet';
import { patternsSpec } from './src/plugins/PatternsWorksheet';
import { shapesSpec } from './src/plugins/ShapesWorksheet';
import { shapeTransformationsSpec } from './src/plugins/ShapeTransformationsWorksheet';
import { compassSpec } from './src/plugins/CompassWorksheet';
import { timeSpec } from './src/plugins/TimeWorksheet';
import { clockSpec } from './src/plugins/ClockWorksheet';
import { measureSpec } from './src/plugins/MeasurementWorksheet';
import { temperatureSpec } from './src/plugins/TemperatureWorksheet';
import { placeValueSpec } from './src/plugins/PlaceValueWorksheet';
import { dataSpec } from './src/plugins/DataWorksheet';
import { divisionSpec } from './src/plugins/DivisionWorksheet';
import { moneySpec } from './src/plugins/MoneyWorksheet';

// Exact pairs pinned by unique-sampling.test.ts CAPACITIES.
const PAIRS: [WorksheetSpec, number][] = [
    [additionSpec, 0], [additionSpec, 1], [additionSpec, 2], [additionSpec, 3], [additionSpec, 4], [additionSpec, 5], [additionSpec, 6],
    [subtractionSpec, 0], [subtractionSpec, 1], [subtractionSpec, 2], [subtractionSpec, 3], [subtractionSpec, 4], [subtractionSpec, 5], [subtractionSpec, 6],
    [multiplicationSpec, 2], [multiplicationSpec, 3],
    [wordSpec, 1], [wordSpec, 2],
    [dataSpec, 1], [dataSpec, 2],
    [divisionSpec, 2],
    [missingSpec, 1], [missingSpec, 2],
    [comparisonSpec, 0], [comparisonSpec, 1], [comparisonSpec, 2],
    [skipSpec, 1], [skipSpec, 2],
    [countingSpec, 0], [countingSpec, 1], [countingSpec, 2],
    [patternsSpec, 1], [patternsSpec, 2],
    [temperatureSpec, 1], [temperatureSpec, 2],
    [doublesSpec, 1], [doublesSpec, 2],
    [bondsSpec, 1], [bondsSpec, 2],
    [shapesSpec, 1], [shapesSpec, 2],
    [shapeTransformationsSpec, 3],
    [compassSpec, 1], [compassSpec, 2], [compassSpec, 3],
    [timeSpec, 1], [timeSpec, 2],
    [clockSpec, 2],
    [measureSpec, 1], [measureSpec, 2],
    [placeValueSpec, 1], [placeValueSpec, 2],
    [moneySpec, 2]
];

// Data's printed question is prompt + figure (the figure carries the data),
// matching the generator's own sampleUnique key — prompt alone collapses
// distinct tallies/graphs into one sentence.
const keyOf = (p: { prompt: string; data?: unknown }): string =>
    p.data === undefined ? p.prompt : `${p.prompt}|${JSON.stringify(p.data)}`;

for (const [spec, gradeId] of PAIRS) {
    const grade = getGradeConfig(gradeId);
    const ask = spec.perPage * 100;
    const problems = spec.generate(createRng(seedFrom([grade.id, spec.id, 0])), grade.caps, ask);
    const prompts = problems.map(keyOf);
    const promptsOnly = problems.map((p) => p.prompt);
    const uniquePromptOnly = new Set(promptsOnly).size;
    const unique = new Set(prompts).size;
    // Prefix property: first `unique` prompts pairwise distinct?
    const prefixOk = new Set(prompts.slice(0, unique)).size === unique;
    // 10-page check (suite skips when capacity < perPage*10).
    const ten = spec.perPage * 10;
    let tenOk = 'skip';
    if (unique >= ten) {
        const tenProblems = spec.generate(createRng(seedFrom([gradeId, spec.id, 0])), grade.caps, ten);
        tenOk = String(new Set(tenProblems.map(keyOf)).size === ten);
    }
    // First-page check (suite requires capacity > perPage AND page distinct).
    const pageProblems = spec.generate(createRng(seedFrom([gradeId, spec.id, 0])), grade.caps, spec.perPage);
    const pageOk = new Set(pageProblems.map(keyOf)).size === spec.perPage;
    console.log(`CAP ${spec.id} g${gradeId} perPage=${spec.perPage} ask=${ask} unique=${unique} prefixOk=${prefixOk} tenOk=${tenOk} pageOk=${pageOk} capGtPerPage=${unique > spec.perPage}`);
}
