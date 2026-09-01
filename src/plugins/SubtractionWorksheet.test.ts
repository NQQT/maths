// Unit tests for the SUBTRACTION worksheet plugin.
//
// The plugin's generator is DETERMINISTIC: the entire sheet is pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])).
//
// The DIFFICULTY LADDER is pinned here too: grades 0..6 each get their own
// sheet (operand cap scaling one digit per year — see framework/grades.ts,
// arithmeticLadderGrade, shared with the Addition plugin), multi-subtrahend
// questions join from Year 4, and grade 7 upwards offers no subtraction at
// all.

import { describe, it, expect } from 'vitest';
import { seedFrom, getGradeConfig, generateSheet, generateDocument } from '../framework';
import { subtractionSpec } from './SubtractionWorksheet';

const g0 = getGradeConfig(0);
const g1 = getGradeConfig(1);
const g2 = getGradeConfig(2);
const g3 = getGradeConfig(3);
const g4 = getGradeConfig(4);
const g5 = getGradeConfig(5);
const g6 = getGradeConfig(6);

function sheet(grade: ReturnType<typeof getGradeConfig>) {
    return generateSheet(subtractionSpec, grade, seedFrom([grade.id, subtractionSpec.id, 0]));
}

describe('subtraction plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(subtractionSpec.id).toBe('subtraction');
        expect(subtractionSpec.label).toBe('Subtraction');
        expect(subtractionSpec.icon).toBe('−');
        expect(subtractionSpec.perPage).toBe(24);
    });

    it('describes its numeric scope from the grade caps', () => {
        // Pair grades: plain "within N" (the multi-subtrahend suffix is
        // reserved for grades whose addendCap exceeds 2 — ladder pins below).
        expect(subtractionSpec.scope(g0)).toBe('within 10');
        expect(subtractionSpec.scope(g1)).toBe('within 20');
        expect(subtractionSpec.scope(g2)).toBe('within 100');
        expect(subtractionSpec.scope(g3)).toBe('within 1000');
        // Multi-subtrahend grades advertise the second difficulty axis (the
        // ladder's term cap minus the minuend = max subtrahends).
        expect(subtractionSpec.scope(g4)).toBe('within 10000 (up to 2 subtrahends)');
        expect(subtractionSpec.scope(g5)).toBe('within 100000 (up to 2 subtrahends)');
        expect(subtractionSpec.scope(g6)).toBe('within 1000000 (up to 3 subtrahends)');
    });

    it('is gated by the grade catalogue (offered 0..6, hidden from Year 7)', () => {
        expect(subtractionSpec.offered(g0)).toBe(true);
        expect(subtractionSpec.offered(g1)).toBe(true);
        expect(subtractionSpec.offered(g2)).toBe(true);
        expect(subtractionSpec.offered(g3)).toBe(true);
        expect(subtractionSpec.offered(g4)).toBe(true);
        expect(subtractionSpec.offered(g5)).toBe(true);
        expect(subtractionSpec.offered(g6)).toBe(true);
        // Grade 7+ leaves subtraction behind entirely.
        expect(subtractionSpec.offered(getGradeConfig(7))).toBe(false);
        expect(subtractionSpec.offered(getGradeConfig(12))).toBe(false);
    });
});

describe('subtraction — Prep (grade 0)', () => {
    it('never yields a negative answer (exact first row)', () => {
        const s = sheet(g0);
        expect(s).toHaveLength(24);
        for (const p of s) {
            const n = Number(p.answer);
            expect(n).toBeGreaterThanOrEqual(0);
        }
        expect(s[0]).toEqual({ id: 1, type: "subtraction", prompt: "7 - 1 = __", answer: "6" });
    });
});

describe('subtraction — Year 1', () => {
    it('matches the exact sheet (no negative results)', () => {
        const s = sheet(g1);
        expect(s).toEqual([
            {"prompt":"6 - 4 = __","answer":"2","id":1,"type":"subtraction"},
            {"prompt":"3 - 1 = __","answer":"2","id":2,"type":"subtraction"},
            {"prompt":"20 - 10 = __","answer":"10","id":3,"type":"subtraction"},
            {"prompt":"9 - 5 = __","answer":"4","id":4,"type":"subtraction"},
            {"prompt":"19 - 2 = __","answer":"17","id":5,"type":"subtraction"},
            {"prompt":"12 - 3 = __","answer":"9","id":6,"type":"subtraction"},
            {"prompt":"9 - 1 = __","answer":"8","id":7,"type":"subtraction"},
            {"prompt":"18 - 2 = __","answer":"16","id":8,"type":"subtraction"},
            {"prompt":"16 - 0 = __","answer":"16","id":9,"type":"subtraction"},
            {"prompt":"2 - 0 = __","answer":"2","id":10,"type":"subtraction"},
            {"prompt":"19 - 4 = __","answer":"15","id":11,"type":"subtraction"},
            {"prompt":"16 - 6 = __","answer":"10","id":12,"type":"subtraction"},
            {"prompt":"15 - 2 = __","answer":"13","id":13,"type":"subtraction"},
            {"prompt":"14 - 8 = __","answer":"6","id":14,"type":"subtraction"},
            {"prompt":"12 - 8 = __","answer":"4","id":15,"type":"subtraction"},
            {"prompt":"8 - 4 = __","answer":"4","id":16,"type":"subtraction"},
            {"prompt":"4 - 0 = __","answer":"4","id":17,"type":"subtraction"},
            {"prompt":"5 - 3 = __","answer":"2","id":18,"type":"subtraction"},
            {"prompt":"12 - 2 = __","answer":"10","id":19,"type":"subtraction"},
            {"prompt":"11 - 5 = __","answer":"6","id":20,"type":"subtraction"},
            {"prompt":"15 - 5 = __","answer":"10","id":21,"type":"subtraction"},
            {"prompt":"20 - 19 = __","answer":"1","id":22,"type":"subtraction"},
            {"prompt":"19 - 6 = __","answer":"13","id":23,"type":"subtraction"},
            {"prompt":"13 - 6 = __","answer":"7","id":24,"type":"subtraction"},
        ]);
        for (const p of s) expect(Number(p.answer)).toBeGreaterThanOrEqual(0);
    });
});

describe('subtraction — Year 2', () => {
    it('has no negative results within 100', () => {
        const s = sheet(g2);
        for (const p of s) {
            expect(Number(p.answer)).toBeGreaterThanOrEqual(0);
            expect(Number(p.answer)).toBeLessThanOrEqual(100);
        }
    });
});

// ── The arithmetic ladder (Years 3..6) ───────────────────────────────────────
// Each year below pins the exact refresh-0 sheet, so the difficulty scaling
// (one more digit per year, multi-subtrahend from Year 4) cannot drift.
describe('subtraction — Year 3 (three-digit pairs)', () => {
    it('matches the exact sheet (within 1000, still classic pairs)', () => {
        const s = sheet(g3);
        expect(s).toEqual([
            {"prompt":"990 - 175 = __","answer":"815","id":1,"type":"subtraction"},
            {"prompt":"608 - 89 = __","answer":"519","id":2,"type":"subtraction"},
            {"prompt":"952 - 528 = __","answer":"424","id":3,"type":"subtraction"},
            {"prompt":"235 - 23 = __","answer":"212","id":4,"type":"subtraction"},
            {"prompt":"605 - 286 = __","answer":"319","id":5,"type":"subtraction"},
            {"prompt":"530 - 478 = __","answer":"52","id":6,"type":"subtraction"},
            {"prompt":"26 - 16 = __","answer":"10","id":7,"type":"subtraction"},
            {"prompt":"306 - 173 = __","answer":"133","id":8,"type":"subtraction"},
            {"prompt":"939 - 195 = __","answer":"744","id":9,"type":"subtraction"},
            {"prompt":"557 - 336 = __","answer":"221","id":10,"type":"subtraction"},
            {"prompt":"789 - 178 = __","answer":"611","id":11,"type":"subtraction"},
            {"prompt":"257 - 98 = __","answer":"159","id":12,"type":"subtraction"},
            {"prompt":"373 - 107 = __","answer":"266","id":13,"type":"subtraction"},
            {"prompt":"480 - 311 = __","answer":"169","id":14,"type":"subtraction"},
            {"prompt":"174 - 145 = __","answer":"29","id":15,"type":"subtraction"},
            {"prompt":"682 - 190 = __","answer":"492","id":16,"type":"subtraction"},
            {"prompt":"325 - 57 = __","answer":"268","id":17,"type":"subtraction"},
            {"prompt":"264 - 88 = __","answer":"176","id":18,"type":"subtraction"},
            {"prompt":"839 - 291 = __","answer":"548","id":19,"type":"subtraction"},
            {"prompt":"80 - 35 = __","answer":"45","id":20,"type":"subtraction"},
            {"prompt":"156 - 111 = __","answer":"45","id":21,"type":"subtraction"},
            {"prompt":"356 - 176 = __","answer":"180","id":22,"type":"subtraction"},
            {"prompt":"746 - 366 = __","answer":"380","id":23,"type":"subtraction"},
            {"prompt":"72 - 57 = __","answer":"15","id":24,"type":"subtraction"},
        ]);
        // Sanity: within 1000 and every question is still a single subtraction.
        for (const p of s) {
            expect(Number(p.answer)).toBeGreaterThanOrEqual(1);
            expect(Number(p.answer)).toBeLessThanOrEqual(1000);
            expect(p.prompt.match(/-/g)).toHaveLength(1);
        }
    });
});

describe('subtraction — Year 4 (four digits + multi-subtrahend joins)', () => {
    it('matches the exact sheet (within 10000, 1-2 subtrahends)', () => {
        const s = sheet(g4);
        expect(s).toEqual([
            {"prompt":"5827 - 5236 = __","answer":"591","id":1,"type":"subtraction"},
            {"prompt":"8272 - 4054 = __","answer":"4218","id":2,"type":"subtraction"},
            {"prompt":"4362 - 542 = __","answer":"3820","id":3,"type":"subtraction"},
            {"prompt":"3225 - 1271 = __","answer":"1954","id":4,"type":"subtraction"},
            {"prompt":"5440 - 4467 - 772 = __","answer":"201","id":5,"type":"subtraction"},
            {"prompt":"4536 - 3565 - 711 = __","answer":"260","id":6,"type":"subtraction"},
            {"prompt":"9538 - 10 - 5201 = __","answer":"4327","id":7,"type":"subtraction"},
            {"prompt":"7342 - 1799 - 5445 = __","answer":"98","id":8,"type":"subtraction"},
            {"prompt":"176 - 7 = __","answer":"169","id":9,"type":"subtraction"},
            {"prompt":"9322 - 6879 = __","answer":"2443","id":10,"type":"subtraction"},
            {"prompt":"1658 - 747 = __","answer":"911","id":11,"type":"subtraction"},
            {"prompt":"1590 - 412 - 871 = __","answer":"307","id":12,"type":"subtraction"},
            {"prompt":"2900 - 2506 - 143 = __","answer":"251","id":13,"type":"subtraction"},
            {"prompt":"3085 - 3060 = __","answer":"25","id":14,"type":"subtraction"},
            {"prompt":"8907 - 1866 - 6165 = __","answer":"876","id":15,"type":"subtraction"},
            {"prompt":"6523 - 3690 = __","answer":"2833","id":16,"type":"subtraction"},
            {"prompt":"5539 - 148 = __","answer":"5391","id":17,"type":"subtraction"},
            {"prompt":"2718 - 390 - 1526 = __","answer":"802","id":18,"type":"subtraction"},
            {"prompt":"7671 - 599 = __","answer":"7072","id":19,"type":"subtraction"},
            {"prompt":"5006 - 2591 - 74 = __","answer":"2341","id":20,"type":"subtraction"},
            {"prompt":"6015 - 5669 - 267 = __","answer":"79","id":21,"type":"subtraction"},
            {"prompt":"9802 - 7351 = __","answer":"2451","id":22,"type":"subtraction"},
            {"prompt":"4159 - 3831 = __","answer":"328","id":23,"type":"subtraction"},
            {"prompt":"2574 - 2060 = __","answer":"514","id":24,"type":"subtraction"},
        ]);
        // Sanity: within 10000, answers stay positive, and subtrahend counts
        // stay inside [1, 2].
        for (const p of s) {
            expect(Number(p.answer)).toBeGreaterThanOrEqual(1);
            expect(Number(p.answer)).toBeLessThanOrEqual(10000);
            expect(p.prompt.match(/-/g)!.length).toBeGreaterThanOrEqual(1);
            expect(p.prompt.match(/-/g)!.length).toBeLessThanOrEqual(2);
        }
    });
});

describe('subtraction — Year 5 (five digits)', () => {
    it('matches the exact sheet (within 100000, 1-2 subtrahends)', () => {
        const s = sheet(g5);
        expect(s).toEqual([
            {"prompt":"92734 - 54774 = __","answer":"37960","id":1,"type":"subtraction"},
            {"prompt":"87304 - 54556 = __","answer":"32748","id":2,"type":"subtraction"},
            {"prompt":"87043 - 3781 - 52097 = __","answer":"31165","id":3,"type":"subtraction"},
            {"prompt":"13985 - 12421 = __","answer":"1564","id":4,"type":"subtraction"},
            {"prompt":"51875 - 48819 - 1987 = __","answer":"1069","id":5,"type":"subtraction"},
            {"prompt":"2638 - 2157 - 332 = __","answer":"149","id":6,"type":"subtraction"},
            {"prompt":"21991 - 20254 - 235 = __","answer":"1502","id":7,"type":"subtraction"},
            {"prompt":"39454 - 25521 - 3410 = __","answer":"10523","id":8,"type":"subtraction"},
            {"prompt":"20114 - 3178 - 2253 = __","answer":"14683","id":9,"type":"subtraction"},
            {"prompt":"62744 - 59007 - 1315 = __","answer":"2422","id":10,"type":"subtraction"},
            {"prompt":"22479 - 3213 - 3587 = __","answer":"15679","id":11,"type":"subtraction"},
            {"prompt":"60997 - 12161 - 13341 = __","answer":"35495","id":12,"type":"subtraction"},
            {"prompt":"30147 - 23642 = __","answer":"6505","id":13,"type":"subtraction"},
            {"prompt":"44985 - 42680 - 1639 = __","answer":"666","id":14,"type":"subtraction"},
            {"prompt":"93570 - 58402 = __","answer":"35168","id":15,"type":"subtraction"},
            {"prompt":"39521 - 30404 - 8585 = __","answer":"532","id":16,"type":"subtraction"},
            {"prompt":"78801 - 1689 = __","answer":"77112","id":17,"type":"subtraction"},
            {"prompt":"25100 - 11315 = __","answer":"13785","id":18,"type":"subtraction"},
            {"prompt":"4079 - 2949 = __","answer":"1130","id":19,"type":"subtraction"},
            {"prompt":"38774 - 19396 - 5092 = __","answer":"14286","id":20,"type":"subtraction"},
            {"prompt":"53608 - 31264 = __","answer":"22344","id":21,"type":"subtraction"},
            {"prompt":"89780 - 81950 = __","answer":"7830","id":22,"type":"subtraction"},
            {"prompt":"22446 - 11156 - 10413 = __","answer":"877","id":23,"type":"subtraction"},
            {"prompt":"29564 - 15399 = __","answer":"14165","id":24,"type":"subtraction"},
        ]);
        for (const p of s) {
            expect(Number(p.answer)).toBeGreaterThanOrEqual(1);
            expect(Number(p.answer)).toBeLessThanOrEqual(100000);
        }
    });
});

describe('subtraction — Year 6 (six digits, up to 3 subtrahends)', () => {
    it('matches the exact sheet (within 1000000, 1-3 subtrahends)', () => {
        const s = sheet(g6);
        expect(s).toEqual([
            {"prompt":"216632 - 62224 = __","answer":"154408","id":1,"type":"subtraction"},
            {"prompt":"655011 - 153558 - 51032 = __","answer":"450421","id":2,"type":"subtraction"},
            {"prompt":"397156 - 151454 - 32625 = __","answer":"213077","id":3,"type":"subtraction"},
            {"prompt":"748423 - 199477 = __","answer":"548946","id":4,"type":"subtraction"},
            {"prompt":"532770 - 269128 = __","answer":"263642","id":5,"type":"subtraction"},
            {"prompt":"370879 - 104897 = __","answer":"265982","id":6,"type":"subtraction"},
            {"prompt":"95730 - 47466 - 43920 - 1722 = __","answer":"2622","id":7,"type":"subtraction"},
            {"prompt":"364791 - 43746 - 267798 = __","answer":"53247","id":8,"type":"subtraction"},
            {"prompt":"643871 - 375695 = __","answer":"268176","id":9,"type":"subtraction"},
            {"prompt":"817394 - 346129 - 214637 - 102569 = __","answer":"154059","id":10,"type":"subtraction"},
            {"prompt":"370837 - 83607 - 89257 - 154629 = __","answer":"43344","id":11,"type":"subtraction"},
            {"prompt":"36363 - 29724 - 1669 - 2249 = __","answer":"2721","id":12,"type":"subtraction"},
            {"prompt":"769852 - 440047 = __","answer":"329805","id":13,"type":"subtraction"},
            {"prompt":"863268 - 814034 = __","answer":"49234","id":14,"type":"subtraction"},
            {"prompt":"731171 - 168977 - 132915 = __","answer":"429279","id":15,"type":"subtraction"},
            {"prompt":"658156 - 127369 - 298579 = __","answer":"232208","id":16,"type":"subtraction"},
            {"prompt":"120681 - 101843 - 2826 = __","answer":"16012","id":17,"type":"subtraction"},
            {"prompt":"495219 - 236885 - 61959 = __","answer":"196375","id":18,"type":"subtraction"},
            {"prompt":"395123 - 395058 = __","answer":"65","id":19,"type":"subtraction"},
            {"prompt":"295853 - 92195 - 69734 - 21506 = __","answer":"112418","id":20,"type":"subtraction"},
            {"prompt":"235665 - 214918 - 20094 - 17 = __","answer":"636","id":21,"type":"subtraction"},
            {"prompt":"722992 - 231328 - 466744 - 12523 = __","answer":"12397","id":22,"type":"subtraction"},
            {"prompt":"977133 - 215652 = __","answer":"761481","id":23,"type":"subtraction"},
            {"prompt":"494440 - 103577 - 349732 = __","answer":"41131","id":24,"type":"subtraction"},
        ]);
        // Sanity: within one million, answers stay positive, and subtrahend
        // counts stay inside [1, 3].
        for (const p of s) {
            expect(Number(p.answer)).toBeGreaterThanOrEqual(1);
            expect(Number(p.answer)).toBeLessThanOrEqual(1000000);
            expect(p.prompt.match(/-/g)!.length).toBeGreaterThanOrEqual(1);
            expect(p.prompt.match(/-/g)!.length).toBeLessThanOrEqual(3);
        }
    });
});

describe('subtraction — multi-page documents', () => {
    // The ladder's top grade also paginates: page 2 continues the SAME stream
    // (multi-subtrahend included) with continuous ids — the full 24 rows are
    // pinned, so any generator/cap/chunking change fails here too.
    it('Year 6 subtraction, 2 pages, matches the exact page-2 sheet', () => {
        const doc = generateDocument(subtractionSpec, g6, seedFrom([6, subtractionSpec.id, 0]), 2);
        expect(doc.pages[0][0]).toEqual({ id: 1, type: "subtraction", prompt: "216632 - 62224 = __", answer: "154408" });
        expect(doc.pages[1]).toEqual([
            {"prompt":"343107 - 152961 = __","answer":"190146","id":25,"type":"subtraction"},
            {"prompt":"239608 - 134770 - 52359 = __","answer":"52479","id":26,"type":"subtraction"},
            {"prompt":"163985 - 28467 - 133051 - 706 = __","answer":"1761","id":27,"type":"subtraction"},
            {"prompt":"788902 - 487202 - 179572 = __","answer":"122128","id":28,"type":"subtraction"},
            {"prompt":"155394 - 45303 = __","answer":"110091","id":29,"type":"subtraction"},
            {"prompt":"326837 - 315925 - 10157 = __","answer":"755","id":30,"type":"subtraction"},
            {"prompt":"818547 - 619250 = __","answer":"199297","id":31,"type":"subtraction"},
            {"prompt":"102028 - 1590 - 28726 - 64235 = __","answer":"7477","id":32,"type":"subtraction"},
            {"prompt":"243027 - 146530 = __","answer":"96497","id":33,"type":"subtraction"},
            {"prompt":"198202 - 179881 = __","answer":"18321","id":34,"type":"subtraction"},
            {"prompt":"834739 - 72086 - 749704 = __","answer":"12949","id":35,"type":"subtraction"},
            {"prompt":"730466 - 622337 = __","answer":"108129","id":36,"type":"subtraction"},
            {"prompt":"105920 - 54370 - 4010 = __","answer":"47540","id":37,"type":"subtraction"},
            {"prompt":"689660 - 581966 = __","answer":"107694","id":38,"type":"subtraction"},
            {"prompt":"488340 - 482127 - 2126 = __","answer":"4087","id":39,"type":"subtraction"},
            {"prompt":"813481 - 205646 = __","answer":"607835","id":40,"type":"subtraction"},
            {"prompt":"472591 - 4938 = __","answer":"467653","id":41,"type":"subtraction"},
            {"prompt":"481015 - 28412 - 417074 - 26147 = __","answer":"9382","id":42,"type":"subtraction"},
            {"prompt":"998102 - 484193 = __","answer":"513909","id":43,"type":"subtraction"},
            {"prompt":"666666 - 239087 = __","answer":"427579","id":44,"type":"subtraction"},
            {"prompt":"985451 - 514567 - 206038 = __","answer":"264846","id":45,"type":"subtraction"},
            {"prompt":"540250 - 184581 - 41582 - 184318 = __","answer":"129769","id":46,"type":"subtraction"},
            {"prompt":"43340 - 16685 - 12368 - 5341 = __","answer":"8946","id":47,"type":"subtraction"},
            {"prompt":"467044 - 396158 = __","answer":"70886","id":48,"type":"subtraction"},
        ]);
    });

    it('returns an empty sheet for an unimplemented grade (Year 7+)', () => {
        expect(generateSheet(subtractionSpec, getGradeConfig(7), seedFrom([7, 'subtraction', 0]))).toEqual([]);
    });
});
