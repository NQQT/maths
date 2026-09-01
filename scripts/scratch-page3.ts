// TEMPORARY scratch — page-3 continuation probe. DELETE AFTER USE.
import { seedFrom, getGradeConfig, generateDocument } from '../src/framework';
import { additionSpec } from '../src/plugins/pins';

const g = getGradeConfig(1);
const doc = generateDocument(additionSpec, g, seedFrom([1, 'addition', 0]), 3);
console.log('p3 first:', JSON.stringify(doc.pages[2][0]));
console.log('p2 first:', JSON.stringify(doc.pages[1][0]));
