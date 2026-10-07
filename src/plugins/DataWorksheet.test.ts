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
        // Ten per page now carries an inline diagram per item
        // (framework/DataDiagram.tsx) and fits a fixed A4 sheet on the worst
        // deal (the 4-line column-graph prose + ~80px bars, T3 audit).
        expect(dataSpec.perPage).toBe(10);
    });

    it('describes its numeric scope', () => {
        expect(dataSpec.scope(g1)).toBe('tallies & simple graphs');
    });
});

describe('data — availability gating', () => {
    it('Prep does not offer the extension type (empty sheet); Year 1 does', () => {
        expect(sheet(g0)).toEqual([]);
        expect(sheet(g1)).toHaveLength(10);
    });
});

describe('data — Year 1 (tallies, picture & column graphs)', () => {
    it('matches the exact sheet', () => {
        const s = sheet(g1);
        // Every problem now carries its figure data (framework/DataDiagram.tsx
        // draws the same marks the prompt prints as ASCII).
        expect(s).toEqual([
            {"prompt":"Count the tallies: ||||/ ||||/ ||||/ ||||/ — how many in all?","answer":"20","data":{"kind":"tally","total":20},"id":1,"type":"data"},
            {"prompt":"In a column graph, each square is 1 vote. Kai's bar is 9 squares tall and Mia's bar is 8 squares tall. How many more votes did Kai get?","answer":"1","data":{"kind":"column","leftName":"Kai","rightName":"Mia","left":9,"right":8},"id":2,"type":"data"},
            {"prompt":"In a picture graph, 1 star = 2 cookies. How many cookies do ★★★★★★ show?","answer":"12","data":{"kind":"picture","stars":6},"id":3,"type":"data"},
            {"prompt":"In a picture graph, 1 star = 1 crayon. How many crayons do ★★★★★★ show?","answer":"6","data":{"kind":"picture","stars":6},"id":4,"type":"data"},
            {"prompt":"In a column graph, each square is 1 vote. Tom's bar is 7 squares tall and Sam's bar is 2 squares tall. How many more votes did Tom get?","answer":"5","data":{"kind":"column","leftName":"Tom","rightName":"Sam","left":7,"right":2},"id":5,"type":"data"},
            {"prompt":"Count the tallies: ||||/ ||||/ | | | — how many in all?","answer":"13","data":{"kind":"tally","total":13},"id":6,"type":"data"},
            {"prompt":"In a column graph, each square is 1 vote. Zoe's bar is 9 squares tall and Max's bar is 8 squares tall. How many more votes did Zoe get?","answer":"1","data":{"kind":"column","leftName":"Zoe","rightName":"Max","left":9,"right":8},"id":7,"type":"data"},
            {"prompt":"Count the tallies: ||||/ ||||/ ||||/ — how many in all?","answer":"15","data":{"kind":"tally","total":15},"id":8,"type":"data"},
            {"prompt":"Count the tallies: | | | — how many in all?","answer":"3","data":{"kind":"tally","total":3},"id":9,"type":"data"},
            {"prompt":"In a picture graph, 1 star = 1 balloon. How many balloons do ★★★★★★ show?","answer":"6","data":{"kind":"picture","stars":6},"id":10,"type":"data"},
        ]);
    });
});

describe('data — Year 2 (bigger counts to 40)', () => {
    it('matches the exact sheet', () => {
        const s = sheet(g2);
        expect(s).toEqual([
            {"prompt":"In a picture graph, 1 star = 1 car. How many cars do ★★★★ show?","answer":"4","data":{"kind":"picture","stars":4},"id":1,"type":"data"},
            {"prompt":"Count the tallies: ||||/ | | — how many in all?","answer":"7","data":{"kind":"tally","total":7},"id":2,"type":"data"},
            {"prompt":"In a column graph, each square is 1 vote. Mia's bar is 6 squares tall and Leo's bar is 5 squares tall. How many more votes did Mia get?","answer":"1","data":{"kind":"column","leftName":"Mia","rightName":"Leo","left":6,"right":5},"id":3,"type":"data"},
            {"prompt":"Count the tallies: ||||/ ||||/ ||||/ ||||/ ||||/ ||||/ ||||/ | | | | — how many in all?","answer":"39","data":{"kind":"tally","total":39},"id":4,"type":"data"},
            {"prompt":"Count the tallies: ||||/ ||||/ ||||/ ||||/ ||||/ ||||/ ||||/ — how many in all?","answer":"35","data":{"kind":"tally","total":35},"id":5,"type":"data"},
            {"prompt":"Count the tallies: ||||/ ||||/ ||||/ ||||/ ||||/ ||||/ | | | | — how many in all?","answer":"34","data":{"kind":"tally","total":34},"id":6,"type":"data"},
            {"prompt":"In a picture graph, 1 star = 1 crayon. How many crayons do ★★★ show?","answer":"3","data":{"kind":"picture","stars":3},"id":7,"type":"data"},
            {"prompt":"Count the tallies: ||||/ ||||/ ||||/ ||||/ — how many in all?","answer":"20","data":{"kind":"tally","total":20},"id":8,"type":"data"},
            {"prompt":"Count the tallies: ||||/ ||||/ ||||/ | | | | — how many in all?","answer":"19","data":{"kind":"tally","total":19},"id":9,"type":"data"},
            {"prompt":"In a picture graph, 1 star = 2 flowers. How many flowers do ★★★★ show?","answer":"8","data":{"kind":"picture","stars":4},"id":10,"type":"data"},
        ]);
    });
});
