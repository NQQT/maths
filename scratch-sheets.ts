// TEMPORARY review scratch (deleted after use): dumps the first deterministic
// sheet for every spec x offered grade so the reviewer can verify answer-key
// correctness independently of the test pins.
import { seedFrom, getGradeConfig, generateSheet } from './src/framework';
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
import { rowsColumnsSpec } from './src/plugins/RowsColumnsWorksheet';

const specs = [
    additionSpec, subtractionSpec, multiplicationSpec, missingSpec, comparisonSpec, skipSpec,
    wordSpec, countingSpec, doublesSpec, bondsSpec, patternsSpec, shapesSpec, shapeTransformationsSpec,
    compassSpec, timeSpec, clockSpec, measureSpec, temperatureSpec, placeValueSpec, dataSpec,
    divisionSpec, moneySpec, rowsColumnsSpec
];

for (const spec of specs) {
    for (let gradeId = 0; gradeId <= 6; gradeId++) {
        const grade = getGradeConfig(gradeId);
        if (!spec.offered(grade)) continue;
        const sheet = generateSheet(spec, grade, seedFrom([gradeId, spec.id, 0]));
        for (const p of sheet) {
            console.log(`[${spec.id} g${gradeId}] ${JSON.stringify(p.prompt)} => ${JSON.stringify(p.answer)}`);
        }
    }
}
