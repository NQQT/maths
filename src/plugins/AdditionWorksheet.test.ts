// Unit tests for the ADDITION worksheet plugin.
//
// Strategy: the plugin's generator is DETERMINISTIC, so the ENTIRE sheet (all
// prompts + answers) is pinned to exact expected values produced from the real
// generator with the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). If the algorithm, ranges, or caps change,
// these exact assertions fail — which is what we want, so a silent change to
// the worksheet can't slip through.
//
// The DIFFICULTY LADDER is pinned here too: grades 0..6 each get their own
// sheet (operand cap scaling one digit per year — see framework/grades.ts,
// additionLadderGrade), multi-addend questions join from Year 4, and grade 7
// upwards offers no addition at all.

import { describe, it, expect } from 'vitest';
import { seedFrom, getGradeConfig, generateSheet, generateDocument } from '../framework';
import { additionSpec } from './AdditionWorksheet';

const g0 = getGradeConfig(0);
const g1 = getGradeConfig(1);
const g2 = getGradeConfig(2);
const g3 = getGradeConfig(3);
const g4 = getGradeConfig(4);
const g5 = getGradeConfig(5);
const g6 = getGradeConfig(6);

// Helper: regenerate a sheet using the same seed the framework computes.
function sheet(grade: ReturnType<typeof getGradeConfig>) {
    return generateSheet(additionSpec, grade, seedFrom([grade.id, additionSpec.id, 0]));
}

describe('addition plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(additionSpec.id).toBe('addition');
        expect(additionSpec.label).toBe('Addition');
        expect(additionSpec.icon).toBe('+');
        expect(additionSpec.perPage).toBe(24);
    });

    it('describes its numeric scope from the grade caps', () => {
        // Pair grades: plain "within N" (the multi-addend suffix is reserved
        // for grades whose addendCap exceeds 2 — see the ladder pins below).
        expect(additionSpec.scope(g0)).toBe('within 10');
        expect(additionSpec.scope(g1)).toBe('within 20');
        expect(additionSpec.scope(g2)).toBe('within 100');
        expect(additionSpec.scope(g3)).toBe('within 1000');
        // Multi-addend grades advertise the second difficulty axis.
        expect(additionSpec.scope(g4)).toBe('within 10000 (up to 3 addends)');
        expect(additionSpec.scope(g5)).toBe('within 100000 (up to 3 addends)');
        expect(additionSpec.scope(g6)).toBe('within 1000000 (up to 4 addends)');
    });

    it('is gated by the grade catalogue (offered 0..6, hidden from Year 7)', () => {
        expect(additionSpec.offered(g0)).toBe(true);
        expect(additionSpec.offered(g1)).toBe(true);
        expect(additionSpec.offered(g2)).toBe(true);
        expect(additionSpec.offered(g3)).toBe(true);
        expect(additionSpec.offered(g4)).toBe(true);
        expect(additionSpec.offered(g5)).toBe(true);
        expect(additionSpec.offered(g6)).toBe(true);
        // Grade 7+ leaves addition behind entirely.
        expect(additionSpec.offered(getGradeConfig(7))).toBe(false);
        expect(additionSpec.offered(getGradeConfig(12))).toBe(false);
    });
});

describe('addition — Prep (grade 0)', () => {
    it('matches the exact sheet', () => {
        expect(sheet(g0)).toEqual([
            { id: 1, type: 'addition', prompt: '2 + 7 = __', answer: '9' },
            { id: 2, type: 'addition', prompt: '4 + 2 = __', answer: '6' },
            { id: 3, type: 'addition', prompt: '6 + 2 = __', answer: '8' },
            { id: 4, type: 'addition', prompt: '9 + 1 = __', answer: '10' },
            { id: 5, type: 'addition', prompt: '3 + 6 = __', answer: '9' },
            { id: 6, type: 'addition', prompt: '4 + 3 = __', answer: '7' },
            { id: 7, type: 'addition', prompt: '4 + 5 = __', answer: '9' },
            { id: 8, type: 'addition', prompt: '6 + 4 = __', answer: '10' },
            { id: 9, type: 'addition', prompt: '4 + 6 = __', answer: '10' },
            { id: 10, type: 'addition', prompt: '4 + 2 = __', answer: '6' },
            { id: 11, type: 'addition', prompt: '1 + 8 = __', answer: '9' },
            { id: 12, type: 'addition', prompt: '6 + 1 = __', answer: '7' },
            { id: 13, type: 'addition', prompt: '5 + 5 = __', answer: '10' },
            { id: 14, type: 'addition', prompt: '4 + 2 = __', answer: '6' },
            { id: 15, type: 'addition', prompt: '3 + 3 = __', answer: '6' },
            { id: 16, type: 'addition', prompt: '6 + 3 = __', answer: '9' },
            { id: 17, type: 'addition', prompt: '5 + 1 = __', answer: '6' },
            { id: 18, type: 'addition', prompt: '9 + 1 = __', answer: '10' },
            { id: 19, type: 'addition', prompt: '5 + 2 = __', answer: '7' },
            { id: 20, type: 'addition', prompt: '1 + 5 = __', answer: '6' },
            { id: 21, type: 'addition', prompt: '1 + 6 = __', answer: '7' },
            { id: 22, type: 'addition', prompt: '9 + 1 = __', answer: '10' },
            { id: 23, type: 'addition', prompt: '8 + 1 = __', answer: '9' },
            { id: 24, type: 'addition', prompt: '9 + 1 = __', answer: '10' }
        ]);
    });
});

describe('addition — Year 1', () => {
    it('matches the exact sheet (within 20, sum never exceeds 20)', () => {
        const s = sheet(g1);
        expect(s).toEqual([
            { id: 1, type: 'addition', prompt: '10 + 9 = __', answer: '19' },
            { id: 2, type: 'addition', prompt: '12 + 2 = __', answer: '14' },
            { id: 3, type: 'addition', prompt: '19 + 1 = __', answer: '20' },
            { id: 4, type: 'addition', prompt: '16 + 4 = __', answer: '20' },
            { id: 5, type: 'addition', prompt: '2 + 12 = __', answer: '14' },
            { id: 6, type: 'addition', prompt: '4 + 11 = __', answer: '15' },
            { id: 7, type: 'addition', prompt: '10 + 4 = __', answer: '14' },
            { id: 8, type: 'addition', prompt: '18 + 2 = __', answer: '20' },
            { id: 9, type: 'addition', prompt: '9 + 2 = __', answer: '11' },
            { id: 10, type: 'addition', prompt: '11 + 5 = __', answer: '16' },
            { id: 11, type: 'addition', prompt: '14 + 5 = __', answer: '19' },
            { id: 12, type: 'addition', prompt: '9 + 3 = __', answer: '12' },
            { id: 13, type: 'addition', prompt: '14 + 1 = __', answer: '15' },
            { id: 14, type: 'addition', prompt: '7 + 10 = __', answer: '17' },
            { id: 15, type: 'addition', prompt: '16 + 2 = __', answer: '18' },
            { id: 16, type: 'addition', prompt: '10 + 7 = __', answer: '17' },
            { id: 17, type: 'addition', prompt: '18 + 2 = __', answer: '20' },
            { id: 18, type: 'addition', prompt: '1 + 18 = __', answer: '19' },
            { id: 19, type: 'addition', prompt: '19 + 1 = __', answer: '20' },
            { id: 20, type: 'addition', prompt: '5 + 11 = __', answer: '16' },
            { id: 21, type: 'addition', prompt: '9 + 5 = __', answer: '14' },
            { id: 22, type: 'addition', prompt: '18 + 1 = __', answer: '19' },
            { id: 23, type: 'addition', prompt: '12 + 1 = __', answer: '13' },
            { id: 24, type: 'addition', prompt: '7 + 13 = __', answer: '20' }
        ]);
        // Sanity: no sum exceeds the within-20 cap.
        for (const p of s) expect(Number(p.answer)).toBeLessThanOrEqual(20);
    });
});

describe('addition — Year 2 (bigger numbers)', () => {
    it('stays within the within-100 cap', () => {
        const s = sheet(g2);
        expect(s).toHaveLength(24);
        for (const p of s) expect(Number(p.answer)).toBeLessThanOrEqual(100);
        expect(s[0]).toEqual({ id: 1, type: 'addition', prompt: '45 + 41 = __', answer: '86' });
    });

    it('returns an empty sheet for an unimplemented grade (Year 7+)', () => {
        expect(generateSheet(additionSpec, getGradeConfig(7), seedFrom([7, 'addition', 0]))).toEqual([]);
    });
});

// ── The addition ladder (Years 3..6) ─────────────────────────────────────────
// Each year below pins the exact refresh-0 sheet, so the difficulty scaling
// (one more digit per year, multi-addend from Year 4) cannot silently drift.
describe('addition — Year 3 (three-digit pairs)', () => {
    it('matches the exact sheet (within 1000, still classic pairs)', () => {
        const s = sheet(g3);
        expect(s).toEqual([
            { id: 1, type: 'addition', prompt: '53 + 942 = __', answer: '995' },
            { id: 2, type: 'addition', prompt: '412 + 90 = __', answer: '502' },
            { id: 3, type: 'addition', prompt: '250 + 648 = __', answer: '898' },
            { id: 4, type: 'addition', prompt: '836 + 10 = __', answer: '846' },
            { id: 5, type: 'addition', prompt: '5 + 7 = __', answer: '12' },
            { id: 6, type: 'addition', prompt: '707 + 28 = __', answer: '735' },
            { id: 7, type: 'addition', prompt: '713 + 41 = __', answer: '754' },
            { id: 8, type: 'addition', prompt: '950 + 37 = __', answer: '987' },
            { id: 9, type: 'addition', prompt: '591 + 352 = __', answer: '943' },
            { id: 10, type: 'addition', prompt: '486 + 215 = __', answer: '701' },
            { id: 11, type: 'addition', prompt: '951 + 12 = __', answer: '963' },
            { id: 12, type: 'addition', prompt: '256 + 530 = __', answer: '786' },
            { id: 13, type: 'addition', prompt: '717 + 4 = __', answer: '721' },
            { id: 14, type: 'addition', prompt: '619 + 367 = __', answer: '986' },
            { id: 15, type: 'addition', prompt: '548 + 4 = __', answer: '552' },
            { id: 16, type: 'addition', prompt: '855 + 89 = __', answer: '944' },
            { id: 17, type: 'addition', prompt: '927 + 62 = __', answer: '989' },
            { id: 18, type: 'addition', prompt: '903 + 29 = __', answer: '932' },
            { id: 19, type: 'addition', prompt: '792 + 177 = __', answer: '969' },
            { id: 20, type: 'addition', prompt: '482 + 492 = __', answer: '974' },
            { id: 21, type: 'addition', prompt: '91 + 785 = __', answer: '876' },
            { id: 22, type: 'addition', prompt: '997 + 1 = __', answer: '998' },
            { id: 23, type: 'addition', prompt: '402 + 120 = __', answer: '522' },
            { id: 24, type: 'addition', prompt: '948 + 36 = __', answer: '984' }
        ]);
        // Sanity: within 1000 and every question is still a pair.
        for (const p of s) {
            expect(Number(p.answer)).toBeLessThanOrEqual(1000);
            expect(p.prompt.match(/\+/g)).toHaveLength(1);
        }
    });
});

describe('addition — Year 4 (four digits + multi-addend joins)', () => {
    it('matches the exact sheet (within 10000, 2-3 addends)', () => {
        const s = sheet(g4);
        expect(s).toEqual([
            { id: 1, type: 'addition', prompt: '790 + 1541 + 2805 = __', answer: '5136' },
            { id: 2, type: 'addition', prompt: '580 + 4264 + 3866 = __', answer: '8710' },
            { id: 3, type: 'addition', prompt: '3118 + 6737 = __', answer: '9855' },
            { id: 4, type: 'addition', prompt: '948 + 1571 + 3313 = __', answer: '5832' },
            { id: 5, type: 'addition', prompt: '7786 + 610 + 67 = __', answer: '8463' },
            { id: 6, type: 'addition', prompt: '4281 + 2215 = __', answer: '6496' },
            { id: 7, type: 'addition', prompt: '2232 + 141 + 130 = __', answer: '2503' },
            { id: 8, type: 'addition', prompt: '3628 + 499 + 894 = __', answer: '5021' },
            { id: 9, type: 'addition', prompt: '7830 + 68 = __', answer: '7898' },
            { id: 10, type: 'addition', prompt: '8357 + 421 = __', answer: '8778' },
            { id: 11, type: 'addition', prompt: '6369 + 1238 = __', answer: '7607' },
            { id: 12, type: 'addition', prompt: '6662 + 1109 = __', answer: '7771' },
            { id: 13, type: 'addition', prompt: '543 + 5476 = __', answer: '6019' },
            { id: 14, type: 'addition', prompt: '473 + 536 + 7339 = __', answer: '8348' },
            { id: 15, type: 'addition', prompt: '1325 + 7513 = __', answer: '8838' },
            { id: 16, type: 'addition', prompt: '164 + 1652 + 6946 = __', answer: '8762' },
            { id: 17, type: 'addition', prompt: '735 + 3 + 31 = __', answer: '769' },
            { id: 18, type: 'addition', prompt: '3465 + 502 + 2534 = __', answer: '6501' },
            { id: 19, type: 'addition', prompt: '6012 + 14 + 6 = __', answer: '6032' },
            { id: 20, type: 'addition', prompt: '3288 + 6267 = __', answer: '9555' },
            { id: 21, type: 'addition', prompt: '3724 + 5223 + 562 = __', answer: '9509' },
            { id: 22, type: 'addition', prompt: '6436 + 1843 = __', answer: '8279' },
            { id: 23, type: 'addition', prompt: '1768 + 2053 + 1519 = __', answer: '5340' },
            { id: 24, type: 'addition', prompt: '8514 + 490 + 111 = __', answer: '9115' }
        ]);
        // Sanity: within 10000 and addend counts stay inside [2, 3].
        for (const p of s) {
            expect(Number(p.answer)).toBeLessThanOrEqual(10000);
            expect(p.prompt.match(/\+/g)!.length + 1).toBeGreaterThanOrEqual(2);
            expect(p.prompt.match(/\+/g)!.length + 1).toBeLessThanOrEqual(3);
        }
    });
});

describe('addition — Year 5 (five digits)', () => {
    it('matches the exact sheet (within 100000, 2-3 addends)', () => {
        const s = sheet(g5);
        expect(s).toEqual([
            { id: 1, type: 'addition', prompt: '32798 + 52862 + 1006 = __', answer: '86666' },
            { id: 2, type: 'addition', prompt: '21825 + 8026 = __', answer: '29851' },
            { id: 3, type: 'addition', prompt: '4623 + 66698 = __', answer: '71321' },
            { id: 4, type: 'addition', prompt: '627 + 68762 = __', answer: '69389' },
            { id: 5, type: 'addition', prompt: '92464 + 4408 = __', answer: '96872' },
            { id: 6, type: 'addition', prompt: '23429 + 4547 + 48517 = __', answer: '76493' },
            { id: 7, type: 'addition', prompt: '63082 + 13562 = __', answer: '76644' },
            { id: 8, type: 'addition', prompt: '8317 + 78798 = __', answer: '87115' },
            { id: 9, type: 'addition', prompt: '90927 + 8266 = __', answer: '99193' },
            { id: 10, type: 'addition', prompt: '14279 + 47229 + 33011 = __', answer: '94519' },
            { id: 11, type: 'addition', prompt: '87106 + 116 = __', answer: '87222' },
            { id: 12, type: 'addition', prompt: '2260 + 26602 + 16501 = __', answer: '45363' },
            { id: 13, type: 'addition', prompt: '49698 + 12630 = __', answer: '62328' },
            { id: 14, type: 'addition', prompt: '52769 + 46326 = __', answer: '99095' },
            { id: 15, type: 'addition', prompt: '13781 + 23496 + 42545 = __', answer: '79822' },
            { id: 16, type: 'addition', prompt: '73463 + 6914 + 13060 = __', answer: '93437' },
            { id: 17, type: 'addition', prompt: '86129 + 11210 = __', answer: '97339' },
            { id: 18, type: 'addition', prompt: '1422 + 166 + 27 = __', answer: '1615' },
            { id: 19, type: 'addition', prompt: '9803 + 15852 + 8125 = __', answer: '33780' },
            { id: 20, type: 'addition', prompt: '7805 + 5043 + 9498 = __', answer: '22346' },
            { id: 21, type: 'addition', prompt: '8004 + 32744 + 1910 = __', answer: '42658' },
            { id: 22, type: 'addition', prompt: '53532 + 794 + 33095 = __', answer: '87421' },
            { id: 23, type: 'addition', prompt: '95895 + 696 = __', answer: '96591' },
            { id: 24, type: 'addition', prompt: '53129 + 507 + 11777 = __', answer: '65413' }
        ]);
        for (const p of s) expect(Number(p.answer)).toBeLessThanOrEqual(100000);
    });
});

describe('addition — Year 6 (six digits, up to 4 addends)', () => {
    it('matches the exact sheet (within 1000000, 2-4 addends)', () => {
        const s = sheet(g6);
        expect(s).toEqual([
            { id: 1, type: 'addition', prompt: '536401 + 83342 = __', answer: '619743' },
            { id: 2, type: 'addition', prompt: '127460 + 91908 + 2370 = __', answer: '221738' },
            { id: 3, type: 'addition', prompt: '132831 + 699137 = __', answer: '831968' },
            { id: 4, type: 'addition', prompt: '127584 + 20908 = __', answer: '148492' },
            { id: 5, type: 'addition', prompt: '11781 + 321932 = __', answer: '333713' },
            { id: 6, type: 'addition', prompt: '805837 + 9185 = __', answer: '815022' },
            { id: 7, type: 'addition', prompt: '128668 + 145047 = __', answer: '273715' },
            { id: 8, type: 'addition', prompt: '71449 + 731154 = __', answer: '802603' },
            { id: 9, type: 'addition', prompt: '1171 + 116 + 50 + 155 = __', answer: '1492' },
            { id: 10, type: 'addition', prompt: '155601 + 99205 = __', answer: '254806' },
            { id: 11, type: 'addition', prompt: '689479 + 54065 = __', answer: '743544' },
            { id: 12, type: 'addition', prompt: '644387 + 165202 = __', answer: '809589' },
            { id: 13, type: 'addition', prompt: '145524 + 6348 + 322758 = __', answer: '474630' },
            { id: 14, type: 'addition', prompt: '235570 + 26704 + 11312 + 45390 = __', answer: '318976' },
            { id: 15, type: 'addition', prompt: '268542 + 181950 = __', answer: '450492' },
            { id: 16, type: 'addition', prompt: '40777 + 240996 + 302960 = __', answer: '584733' },
            { id: 17, type: 'addition', prompt: '180623 + 95849 + 515591 = __', answer: '792063' },
            { id: 18, type: 'addition', prompt: '854212 + 46573 = __', answer: '900785' },
            { id: 19, type: 'addition', prompt: '238701 + 231950 + 14450 + 112982 = __', answer: '598083' },
            { id: 20, type: 'addition', prompt: '220800 + 33212 + 15257 + 9194 = __', answer: '278463' },
            { id: 21, type: 'addition', prompt: '879490 + 26626 = __', answer: '906116' },
            { id: 22, type: 'addition', prompt: '207556 + 160277 = __', answer: '367833' },
            { id: 23, type: 'addition', prompt: '49635 + 147634 + 17571 = __', answer: '214840' },
            { id: 24, type: 'addition', prompt: '627243 + 8416 + 339146 = __', answer: '974805' }
        ]);
        // Sanity: within one million and addend counts stay inside [2, 4].
        for (const p of s) {
            expect(Number(p.answer)).toBeLessThanOrEqual(1000000);
            expect(p.prompt.match(/\+/g)!.length + 1).toBeGreaterThanOrEqual(2);
            expect(p.prompt.match(/\+/g)!.length + 1).toBeLessThanOrEqual(4);
        }
    });
});

describe('addition — multi-page documents', () => {
    // The EXACT continuation rows of page 2 for (Year 1, addition, refresh 0),
    // captured from the deterministic generator — any change to the generator,
    // caps, or chunking fails these pins.
    it('Year 1 addition, 2 pages, matches the exact page-2 sheet', () => {
        const doc = generateDocument(additionSpec, g1, seedFrom([1, 'addition', 0]), 2);
        expect(doc.pages[0][0]).toEqual({ id: 1, type: 'addition', prompt: '10 + 9 = __', answer: '19' });
        expect(doc.pages[1]).toEqual([
            { id: 25, type: 'addition', prompt: '12 + 2 = __', answer: '14' },
            { id: 26, type: 'addition', prompt: '7 + 11 = __', answer: '18' },
            { id: 27, type: 'addition', prompt: '10 + 4 = __', answer: '14' },
            { id: 28, type: 'addition', prompt: '11 + 3 = __', answer: '14' },
            { id: 29, type: 'addition', prompt: '17 + 2 = __', answer: '19' },
            { id: 30, type: 'addition', prompt: '2 + 1 = __', answer: '3' },
            { id: 31, type: 'addition', prompt: '12 + 4 = __', answer: '16' },
            { id: 32, type: 'addition', prompt: '12 + 2 = __', answer: '14' },
            { id: 33, type: 'addition', prompt: '2 + 15 = __', answer: '17' },
            { id: 34, type: 'addition', prompt: '3 + 6 = __', answer: '9' },
            { id: 35, type: 'addition', prompt: '3 + 7 = __', answer: '10' },
            { id: 36, type: 'addition', prompt: '3 + 15 = __', answer: '18' },
            { id: 37, type: 'addition', prompt: '13 + 4 = __', answer: '17' },
            { id: 38, type: 'addition', prompt: '1 + 8 = __', answer: '9' },
            { id: 39, type: 'addition', prompt: '15 + 4 = __', answer: '19' },
            { id: 40, type: 'addition', prompt: '11 + 2 = __', answer: '13' },
            { id: 41, type: 'addition', prompt: '2 + 8 = __', answer: '10' },
            { id: 42, type: 'addition', prompt: '7 + 12 = __', answer: '19' },
            { id: 43, type: 'addition', prompt: '7 + 3 = __', answer: '10' },
            { id: 44, type: 'addition', prompt: '15 + 1 = __', answer: '16' },
            { id: 45, type: 'addition', prompt: '6 + 3 = __', answer: '9' },
            { id: 46, type: 'addition', prompt: '19 + 1 = __', answer: '20' },
            { id: 47, type: 'addition', prompt: '19 + 1 = __', answer: '20' },
            { id: 48, type: 'addition', prompt: '9 + 7 = __', answer: '16' }
        ]);
    });

    it('Year 2 addition page 2 stays within the within-100 cap', () => {
        const doc = generateDocument(additionSpec, g2, seedFrom([2, 'addition', 0]), 2);
        // Pinned head of the page-2 stream.
        expect(doc.pages[1].slice(0, 3)).toEqual([
            { id: 25, type: 'addition', prompt: '96 + 2 = __', answer: '98' },
            { id: 26, type: 'addition', prompt: '28 + 6 = __', answer: '34' },
            { id: 27, type: 'addition', prompt: '2 + 14 = __', answer: '16' }
        ]);
        for (const p of doc.pages.flat()) expect(Number(p.answer)).toBeLessThanOrEqual(100);
    });

    // The ladder's top grade also paginates: page 2 continues the SAME stream
    // (multi-addend included) with continuous ids — pinned head of 24 rows.
    it('Year 6 addition page 2 continues the exact stream', () => {
        const doc = generateDocument(additionSpec, g6, seedFrom([6, 'addition', 0]), 2);
        expect(doc.pages[1]).toEqual([
            { id: 25, type: 'addition', prompt: '251956 + 24139 + 1822 = __', answer: '277917' },
            { id: 26, type: 'addition', prompt: '18918 + 166508 + 67081 + 196843 = __', answer: '449350' },
            { id: 27, type: 'addition', prompt: '265374 + 33600 + 20701 = __', answer: '319675' },
            { id: 28, type: 'addition', prompt: '223295 + 146831 + 173621 = __', answer: '543747' },
            { id: 29, type: 'addition', prompt: '19608 + 656 + 6564 = __', answer: '26828' },
            { id: 30, type: 'addition', prompt: '68623 + 946 + 3072 = __', answer: '72641' },
            { id: 31, type: 'addition', prompt: '36416 + 370336 + 2423 + 76622 = __', answer: '485797' },
            { id: 32, type: 'addition', prompt: '21902 + 357315 = __', answer: '379217' },
            { id: 33, type: 'addition', prompt: '95040 + 621074 = __', answer: '716114' },
            { id: 34, type: 'addition', prompt: '48503 + 663071 = __', answer: '711574' },
            { id: 35, type: 'addition', prompt: '9210 + 1252 + 42853 + 12937 = __', answer: '66252' },
            { id: 36, type: 'addition', prompt: '352002 + 78551 = __', answer: '430553' },
            { id: 37, type: 'addition', prompt: '169727 + 74160 + 216297 = __', answer: '460184' },
            { id: 38, type: 'addition', prompt: '350056 + 22463 + 123844 + 117985 = __', answer: '614348' },
            { id: 39, type: 'addition', prompt: '602520 + 30374 + 165948 = __', answer: '798842' },
            { id: 40, type: 'addition', prompt: '314451 + 192651 + 2489 + 1613 = __', answer: '511204' },
            { id: 41, type: 'addition', prompt: '363686 + 422785 + 203825 = __', answer: '990296' },
            { id: 42, type: 'addition', prompt: '110984 + 20795 = __', answer: '131779' },
            { id: 43, type: 'addition', prompt: '310946 + 359307 = __', answer: '670253' },
            { id: 44, type: 'addition', prompt: '15347 + 74851 + 104310 + 101136 = __', answer: '295644' },
            { id: 45, type: 'addition', prompt: '48484 + 12476 + 17449 = __', answer: '78409' },
            { id: 46, type: 'addition', prompt: '5554 + 5484 + 6618 = __', answer: '17656' },
            { id: 47, type: 'addition', prompt: '304781 + 115329 + 14301 + 10992 = __', answer: '445403' },
            { id: 48, type: 'addition', prompt: '14972 + 2037 + 122 + 384 = __', answer: '17515' }
        ]);
    });
});
