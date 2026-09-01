// Unit tests for the DATA & TALLY worksheet plugin.
//
// The plugin's generator is DETERMINISTIC: entire sheets pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). Prep does not offer the extension types.

import { describe, it, expect } from 'vitest';
import { seedFrom, getGradeConfig, generateSheet } from '../framework';
import { dataSpec } from './DataWorksheet';

const g0 = getGradeConfig(0);
const g1 = getGradeConfig(1);
const g2 = getGradeConfig(2);

function sheet(grade: ReturnType<typeof getGradeConfig>) {
    return generateSheet(dataSpec, grade, seedFrom([grade.id, dataSpec.id, 0]));
}

describe('data plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(dataSpec.id).toBe('data');
        expect(dataSpec.label).toBe('Data & Tally');
        expect(dataSpec.icon).toBe('▥');
        expect(dataSpec.perPage).toBe(18);
    });

    it('describes its numeric scope', () => {
        expect(dataSpec.scope(g1)).toBe('tallies & simple graphs');
    });
});

describe('data — availability gating', () => {
    it('Prep does not offer the extension type (empty sheet); Year 1 does', () => {
        expect(sheet(g0)).toEqual([]);
        expect(sheet(g1)).toHaveLength(18);
    });
});

describe('data — Year 1 (tallies, picture & column graphs)', () => {
    it('matches the exact sheet', () => {
        const s = sheet(g1);
        expect(s).toEqual([
            {"prompt":"Count the tallies: ||||/ ||||/ ||||/ ||||/ — how many in all?","answer":"20","id":1,"type":"data"},
            {"prompt":"In a column graph, each square is 1 vote. Kai's bar is 9 squares tall and Mia's bar is 8 squares tall. How many more votes did Kai get?","answer":"1","id":2,"type":"data"},
            {"prompt":"In a picture graph, 1 star = 2 cookies. How many cookies do ★★★★★★ show?","answer":"12","id":3,"type":"data"},
            {"prompt":"In a picture graph, 1 star = 1 crayon. How many crayons do ★★★★★★ show?","answer":"6","id":4,"type":"data"},
            {"prompt":"In a column graph, each square is 1 vote. Tom's bar is 7 squares tall and Sam's bar is 2 squares tall. How many more votes did Tom get?","answer":"5","id":5,"type":"data"},
            {"prompt":"Count the tallies: ||||/ ||||/ | | | — how many in all?","answer":"13","id":6,"type":"data"},
            {"prompt":"In a column graph, each square is 1 vote. Zoe's bar is 9 squares tall and Max's bar is 8 squares tall. How many more votes did Zoe get?","answer":"1","id":7,"type":"data"},
            {"prompt":"Count the tallies: ||||/ ||||/ ||||/ — how many in all?","answer":"15","id":8,"type":"data"},
            {"prompt":"Count the tallies: | | | — how many in all?","answer":"3","id":9,"type":"data"},
            {"prompt":"In a picture graph, 1 star = 1 balloon. How many balloons do ★★★★★★ show?","answer":"6","id":10,"type":"data"},
            {"prompt":"Count the tallies: ||||/ — how many in all?","answer":"5","id":11,"type":"data"},
            {"prompt":"In a column graph, each square is 1 vote. Leo's bar is 6 squares tall and Rae's bar is 1 square tall. How many more votes did Leo get?","answer":"5","id":12,"type":"data"},
            {"prompt":"Count the tallies: ||||/ ||||/ | | | | — how many in all?","answer":"14","id":13,"type":"data"},
            {"prompt":"In a picture graph, 1 star = 1 toy. How many toys do ★★ show?","answer":"2","id":14,"type":"data"},
            {"prompt":"In a column graph, each square is 1 vote. Tom's bar is 7 squares tall and Max's bar is 6 squares tall. How many more votes did Tom get?","answer":"1","id":15,"type":"data"},
            {"prompt":"In a picture graph, 1 star = 3 cars. How many cars do ★★★★★ show?","answer":"15","id":16,"type":"data"},
            {"prompt":"Count the tallies: ||||/ ||||/ ||||/ | — how many in all?","answer":"16","id":17,"type":"data"},
            {"prompt":"In a column graph, each square is 1 vote. Zoe's bar is 5 squares tall and Rae's bar is 4 squares tall. How many more votes did Zoe get?","answer":"1","id":18,"type":"data"},
        ]);
    });
});

describe('data — Year 2 (bigger counts to 40)', () => {
    it('matches the exact sheet', () => {
        const s = sheet(g2);
        expect(s).toEqual([
            {"prompt":"In a picture graph, 1 star = 1 car. How many cars do ★★★★ show?","answer":"4","id":1,"type":"data"},
            {"prompt":"Count the tallies: ||||/ | | — how many in all?","answer":"7","id":2,"type":"data"},
            {"prompt":"In a column graph, each square is 1 vote. Mia's bar is 6 squares tall and Leo's bar is 5 squares tall. How many more votes did Mia get?","answer":"1","id":3,"type":"data"},
            {"prompt":"Count the tallies: ||||/ ||||/ ||||/ ||||/ ||||/ ||||/ ||||/ | | | | — how many in all?","answer":"39","id":4,"type":"data"},
            {"prompt":"Count the tallies: ||||/ ||||/ ||||/ ||||/ ||||/ ||||/ ||||/ — how many in all?","answer":"35","id":5,"type":"data"},
            {"prompt":"Count the tallies: ||||/ ||||/ ||||/ ||||/ ||||/ ||||/ | | | | — how many in all?","answer":"34","id":6,"type":"data"},
            {"prompt":"In a picture graph, 1 star = 1 crayon. How many crayons do ★★★ show?","answer":"3","id":7,"type":"data"},
            {"prompt":"Count the tallies: ||||/ ||||/ ||||/ ||||/ — how many in all?","answer":"20","id":8,"type":"data"},
            {"prompt":"Count the tallies: ||||/ ||||/ ||||/ | | | | — how many in all?","answer":"19","id":9,"type":"data"},
            {"prompt":"In a picture graph, 1 star = 2 flowers. How many flowers do ★★★★ show?","answer":"8","id":10,"type":"data"},
            {"prompt":"In a picture graph, 1 star = 3 toys. How many toys do ★★★★ show?","answer":"12","id":11,"type":"data"},
            {"prompt":"Count the tallies: ||||/ ||||/ ||||/ ||||/ ||||/ ||||/ ||||/ | | | — how many in all?","answer":"38","id":12,"type":"data"},
            {"prompt":"Count the tallies: ||||/ ||||/ ||||/ ||||/ ||||/ ||||/ ||||/ | | — how many in all?","answer":"37","id":13,"type":"data"},
            {"prompt":"In a column graph, each square is 1 vote. Max's bar is 14 squares tall and Rae's bar is 12 squares tall. How many more votes did Max get?","answer":"2","id":14,"type":"data"},
            {"prompt":"Count the tallies: ||||/ | | | | — how many in all?","answer":"9","id":15,"type":"data"},
            {"prompt":"In a picture graph, 1 star = 1 sticker. How many stickers do ★★★ show?","answer":"3","id":16,"type":"data"},
            {"prompt":"In a picture graph, 1 star = 1 cookie. How many cookies do ★ show?","answer":"1","id":17,"type":"data"},
            {"prompt":"In a column graph, each square is 1 vote. Tom's bar is 17 squares tall and Sam's bar is 10 squares tall. How many more votes did Tom get?","answer":"7","id":18,"type":"data"},
        ]);
    });
});
