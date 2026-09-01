// One-off test-rewriting tool: patches the per-plugin .test.ts files so their
// pinned sheets match the CURRENT generators (from pins.json).
//
// Strategy: each maths test file pins FULL page-1 sheets, page-2 heads and
// occasional single-row pins inside per-grade describe/it blocks. This
// script:
//   1. scans for `toEqual([ ... ])` array blocks (bracket-depth counted) and
//      `toEqual({ ... })` single-object blocks whose text carries the spec's
//      type tag,
//   2. finds each block's GRADE by reading the nearest preceding "Year N" /
//      "Grade N" / "Prep" mention in the describe/it headers above it,
//   3. picks the pin kind: arrays whose first row id is 1 => page1; first id
//      > 1 => page2head; single objects => the page1 pin's FIRST row,
//   4. splices the replacement rows between the brackets.
//
// Run:  node scripts/rewrite-tests.cjs
// NOT part of the test suite — a dev tool, kept for future generator changes.

const fs = require('fs');
const path = require('path');

// strip BOM if present
const rawPins = fs.readFileSync(path.join(__dirname, '..', 'pins.json'), 'utf8');
const pins = JSON.parse(rawPins.charCodeAt(0) === 0xfeff ? rawPins.slice(1) : rawPins);

const pluginsDir = path.join(__dirname, '..', 'src', 'plugins');

const TARGETS = {
    addition: 'AdditionWorksheet.test.ts',
    subtraction: 'SubtractionWorksheet.test.ts',
    mult: 'MultiplicationWorksheet.test.ts',
    missing: 'MissingNumberWorksheet.test.ts',
    comparison: 'CompareWorksheet.test.ts',
    skip: 'SkipCountingWorksheet.test.ts',
    word: 'WordProblemsWorksheet.test.ts',
    counting: 'CountingWorksheet.test.ts',
    doubles: 'DoublesWorksheet.test.ts',
    bonds: 'NumberBondsWorksheet.test.ts',
    patterns: 'PatternsWorksheet.test.ts',
    shapes: 'ShapesWorksheet.test.ts',
    time: 'TimeWorksheet.test.ts',
    clock: 'ClockWorksheet.test.ts',
    measure: 'MeasurementWorksheet.test.ts',
    placevalue: 'PlaceValueWorksheet.test.ts',
    data: 'DataWorksheet.test.ts',
    division: 'DivisionWorksheet.test.ts',
    money: 'MoneyWorksheet.test.ts',
};

const row = (p) => JSON.stringify(p);

// TS object-literal form (for single-object `toEqual({ ... })` pins — the
// original tests write them as property lists, so match that style).
const objLiteral = (p) => {
    const fields = [`id: ${p.id}`, `type: ${JSON.stringify(p.type)}`, `prompt: ${JSON.stringify(p.prompt)}`, `answer: ${JSON.stringify(p.answer)}`];
    if (p.clock) {
        const c = p.clock.hands === false ? `, hands: ${p.clock.hands}` : '';
        fields.push(`clock: { hour: ${p.clock.hour}, minute: ${p.clock.minute}${c} }`);
    }
    if (p.wideBlanks) fields.push('wideBlanks: true');
    if (p.answerLine) fields.push('answerLine: true');
    return `{ ${fields.join(', ')} }`;
};

// Nearest "Year N" / "Grade N" / "Prep" mention above `pos` (grade id).
function gradeAbove(text, pos) {
    const head = text.slice(0, pos);
    const matches = [
        ...head.matchAll(/(?:Year|Grade)\s+(\d+)/g),
        ...head.matchAll(/\bPrep\b/g)
    ];
    if (matches.length === 0) return null;
    const last = matches.sort((a, b) => a.index - b.index)[matches.length - 1];
    return last[1] ? Number(last[1]) : 0;
}

for (const [specId, file] of Object.entries(TARGETS)) {
    const fp = path.join(pluginsDir, file);
    if (!fs.existsSync(fp)) {
        console.warn(`  missing test file ${file}`);
        continue;
    }
    const text = fs.readFileSync(fp, 'utf8');
    const specPins = Object.fromEntries(
        Object.entries(pins)
            .filter(([k]) => k.startsWith(`${specId}:`))
            .map(([k, v]) => [Number(k.split(':')[1]), v])
    );

    // ── collect array blocks ──────────────────────────────────────────────
    const edits = [];
    let i = 0;
    while (true) {
        const at = text.indexOf('.toEqual(', i);
        if (at === -1) break;
        const open = text.indexOf('[', at);
        const openObj = text.indexOf('{', at);
        if (open !== -1 && (openObj === -1 || open < openObj) && open - at <= 20) {
            // Array block: depth-count to the matching close bracket.
            let depth = 0;
            let j = open;
            for (; j < text.length; j++) {
                const ch = text[j];
                if (ch === '[') depth++;
                else if (ch === ']') {
                    depth--;
                    if (depth === 0) break;
                }
            }
            const body = text.slice(open + 1, j);
            const typeRe = new RegExp(`"?type"?:\\s*['"]${specId}['"]`);
            if (typeRe.test(body)) {
                // Row ids appear as `id: 1` (object-literal style) or
                // `"id":1` (JSON style) — accept both.
                const idm = body.match(/"?id"?:\s*(\d+)/);
                const gradeId = gradeAbove(text, at);
                if (idm && gradeId !== null && specPins[gradeId]) {
                    const firstId = Number(idm[1]);
                    // Count the block's pinned rows to pick full-page vs head.
                    const rowCount = (body.match(/"?id"?:\s*\d+/g) || []).length;
                    if (firstId === 1) {
                        edits.push({ open, close: j, rows: specPins[gradeId].page1, gradeId, kind: 'page1' });
                    } else if (rowCount >= 20) {
                        edits.push({ open, close: j, rows: specPins[gradeId].page2, gradeId, kind: 'page2' });
                    } else {
                        edits.push({ open, close: j, rows: specPins[gradeId].page2head, gradeId, kind: 'page2head' });
                    }
                }
            }
            i = j;
        } else if (openObj !== -1 && openObj - at <= 20) {
            // Single-object block: replace with the page1 pin's first row.
            let depth = 0;
            let j = openObj;
            for (; j < text.length; j++) {
                const ch = text[j];
                if (ch === '{') depth++;
                else if (ch === '}') {
                    depth--;
                    if (depth === 0) break;
                }
            }
            const body = text.slice(openObj + 1, j);
            if (body.includes(`type: '${specId}'`)) {
                const gradeId = gradeAbove(text, at);
                const idm = body.match(/"?id"?:\s*(\d+)/);
                if (gradeId !== null && specPins[gradeId] && idm) {
                    const id = Number(idm[1]);
                    // Find the pin row with THIS id (page1 or page2head).
                    const pool = [...specPins[gradeId].page1, ...specPins[gradeId].page2head];
                    const match = pool.find((r) => r.id === id);
                    if (match) {
                        edits.push({ open: openObj, close: j, rows: [match], gradeId, kind: 'first-row', literal: true });
                    }
                }
            }
            i = j;
        } else {
            i = at + 8;
        }
    }

    // Splice back-to-front.
    let out = text;
    for (const e of edits.slice().sort((a, b) => b.open - a.open)) {
        if (e.literal) {
            // Single-object pin: the block span already sits INSIDE the
            // object's braces, so splice the literal's INNER text (strip the
            // outer braces we added for display).
            const inner = ` ${e.rows.map(objLiteral).join(', ')} `.replace(/^\s\{/, '').replace(/\}\s$/, '');
            out = out.slice(0, e.open + 1) + inner + out.slice(e.close);
            continue;
        }
        const firstRowStart = out.indexOf('\n', e.open);
        const lineEnd = out.indexOf('\n', firstRowStart + 1);
        const line = out.slice(firstRowStart + 1, lineEnd);
        const indent = line.match(/^\s*/)[0] || '            ';
        const body = `\n${indent}${e.rows.map(row).join(`,\n${indent}`)},\n        `;
        out = out.slice(0, e.open + 1) + body + out.slice(e.close);
    }

    fs.writeFileSync(fp, out);
    console.log(`rewrote ${file}: ${edits.map((e) => `g${e.gradeId}${e.kind === 'page1' ? 'p1' : e.kind === 'page2head' ? 'p2' : 'r1'}`).join(' ') || 'none'}`);
}
