// Unit tests for the COMPASS DIRECTIONS worksheet plugin.
//
// The plugin's generator is DETERMINISTIC: entire sheets pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). Prep does not offer the extension types.
// Years 1..3 reuse the same cardinal vocabulary; Years 4..12 stay unavailable
// (see framework/grades.test.ts), with no duplicate NSWE plugin.
//
// The question space is the curated N/S/E/W space (62 distinct prompts:
// 6 turn/side kinds x 4 facings + 3 map edges + 8 walk names x 4 facings + 3
// facts) — its exact capacity is pinned in unique-sampling.test.ts.

import { createElement, useEffect } from 'react';
import { cleanup, render } from '@testing-library/react';
import { arrayCreate, arrayEach } from '@presource/core';
import { describe, it, expect, afterEach } from 'vitest';
import {
    seedFrom, getGradeConfig, generateSheet, generateDocument,
    DASHBOARD_FRAMEWORK, DashboardContextProvider, useDashboardSession
} from '../framework';
import { compassSpec, CompassWorksheet } from './CompassWorksheet';

const g0 = getGradeConfig(0);
const g1 = getGradeConfig(1);
const g2 = getGradeConfig(2);
const g3 = getGradeConfig(3);

afterEach(cleanup);

function sheet(grade: ReturnType<typeof getGradeConfig>) {
    return generateSheet(compassSpec, grade, seedFrom([grade.id, compassSpec.id, 0]));
}

describe('compass plugin — declarative spec', () => {
    it('declares its sidebar label, glyph, prose layout and page size', () => {
        expect(compassSpec.id).toBe('compass');
        expect(compassSpec.label).toBe('Compass Directions');
        expect(compassSpec.icon).toBe('✥');
        expect(compassSpec.singleColumn).toBe(true);
        expect(compassSpec.perPage).toBe(12);
    });

    it('describes its scope from the grade caps (identical at every offered grade)', () => {
        // The N/S/E/W vocabulary stays grade-1 level through Year 3;
        // the scope line does not vary by cap like the measure sheet's does.
        expect(compassSpec.scope(g1)).toBe('north, south, east & west');
        expect(compassSpec.scope(g2)).toBe('north, south, east & west');
        expect(compassSpec.scope(g3)).toBe('north, south, east & west');
    });

    it('renders the exact Year 3 toolbar subtitle with enabled controls', () => {
        // Mount only this plugin's toolbar, not the plugin registry; the
        // shared worksheet-kit.tsx supplies the grade title and scope subtitle.
        const plugin = CompassWorksheet(DASHBOARD_FRAMEWORK);
        function Year3Toolbar() {
            const session = useDashboardSession();
            useEffect(() => {
                session.gradeId = 3;
            }, [session]);
            return createElement(plugin.toolbar!, {
                context: { pluginId: plugin.id, entryId: plugin.id, store: {}, entries: plugin.entries }
            });
        }
        const view = render(createElement(DashboardContextProvider, null, createElement(Year3Toolbar)));
        expect(view.getByTestId('toolbar-title').textContent).toBe('Year 3 \u2014 Compass Directions');
        expect(view.getByText('Compass Directions \u2014 north, south, east & west')).toBeDefined();
        expect(view.getByTestId('toolbar-randomize').getAttribute('aria-disabled')).toBeNull();
        expect(view.getByTestId('toolbar-print').getAttribute('aria-disabled')).toBeNull();
    });
});

describe('compass — availability gating', () => {
    it('Prep does not offer the extension type (empty sheet); Year 1 does', () => {
        expect(sheet(g0)).toEqual([]);
        expect(sheet(g1)).toHaveLength(12);
    });

    it('offers Years 1..3 through the sidebar gate without enabling later grades', () => {
        const plugin = CompassWorksheet(DASHBOARD_FRAMEWORK);
        const gates: [boolean, boolean | undefined][] = [];
        // Grade order 0..12: each pair pins the spec gate and factory sidebar
        // gate independently; empty output is tested separately below.
        arrayEach([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], ({ value: id }) => {
            const grade = getGradeConfig(id);
            gates.push([compassSpec.offered(grade), plugin.isOffered?.(grade)]);
        });
        expect(gates).toEqual([
            [false, false],
            [true, true],
            [true, true],
            [true, true],
            [false, false],
            [false, false],
            [false, false],
            [false, false],
            [false, false],
            [false, false],
            [false, false],
            [false, false],
            [false, false]
        ]);
    });

    // Explicit unoffered grades avoid deriving expected emptiness from the
    // gate being tested; both single-sheet and multi-page outputs are exact.
    it.each([0, 4, 5, 6, 7, 8, 9, 10, 11, 12])('grade %i produces no compass document', (id) => {
        const grade = getGradeConfig(id);
        expect(sheet(grade)).toEqual([]);
        expect(generateDocument(compassSpec, grade, seedFrom([id, 'compass', 0]), 2))
            .toEqual({ pages: [], total: 0 });
    });
});

describe('compass - Year 3 (existing cardinal NSWE space)', () => {
    it('matches the exact Year 3 sheet without reordering clockwise directions', () => {
        // NSWE names the vocabulary, not its indexing: CompassWorksheet.ts
        // relies on North/East/South/West for quarter turns and left/right sides.
        // Complete prompt/answer pins also fix the cardinal vocabulary exactly.
        const s = sheet(g3);
        expect(s).toEqual([
            {"prompt":"You are facing West. What direction is on your left?","answer":"South","id":1,"type":"compass"},
            {"prompt":"You are facing South. What direction is on your left?","answer":"East","id":2,"type":"compass"},
            {"prompt":"Leo walks to school towards the East. On the way home, what direction is Leo walking?","answer":"West","id":3,"type":"compass"},
            {"prompt":"You are facing North. What direction is on your left?","answer":"West","id":4,"type":"compass"},
            {"prompt":"You are facing East. You make a half turn. What direction are you facing now?","answer":"West","id":5,"type":"compass"},
            {"prompt":"You are facing North. You make a quarter turn to the left. What direction are you facing now?","answer":"West","id":6,"type":"compass"},
            {"prompt":"On a map, North is at the top. What direction is at the right of the map?","answer":"East","id":7,"type":"compass"},
            {"prompt":"You are facing West. You make a quarter turn to the left. What direction are you facing now?","answer":"South","id":8,"type":"compass"},
            {"prompt":"On a map, North is at the top. What direction is at the bottom of the map?","answer":"South","id":9,"type":"compass"},
            {"prompt":"What direction is the opposite of South?","answer":"North","id":10,"type":"compass"},
            {"prompt":"You are facing North. You make a quarter turn to the right. What direction are you facing now?","answer":"East","id":11,"type":"compass"},
            {"prompt":"You are facing East. What direction is on your left?","answer":"North","id":12,"type":"compass"},
        ]);
    });

    it('continues the exact stream on page 2 with unique prompts and continuous ids', () => {
        const seed = seedFrom([3, 'compass', 0]);
        const doc = generateDocument(compassSpec, g3, seed, 2);
        expect(doc.total).toBe(24);
        expect(doc.pages.map((page) => page.length)).toEqual([12, 12]);
        expect(doc.pages[0]).toEqual(sheet(g3));
        expect(doc.pages[1]).toEqual([
            {"prompt":"You are facing East. You make a quarter turn to the right. What direction are you facing now?","answer":"South","id":13,"type":"compass"},
            {"prompt":"On a map, North is at the top. What direction is at the left of the map?","answer":"West","id":14,"type":"compass"},
            {"prompt":"In which direction does the sun set?","answer":"West","id":15,"type":"compass"},
            {"prompt":"You are facing West. You make a half turn. What direction are you facing now?","answer":"East","id":16,"type":"compass"},
            {"prompt":"You are facing North. What direction is on your right?","answer":"East","id":17,"type":"compass"},
            {"prompt":"You are facing South. What direction is on your right?","answer":"West","id":18,"type":"compass"},
            {"prompt":"In which direction does the sun rise?","answer":"East","id":19,"type":"compass"},
            {"prompt":"Rae walks to school towards the South. On the way home, what direction is Rae walking?","answer":"North","id":20,"type":"compass"},
            {"prompt":"Which direction does a compass needle always point?","answer":"North","id":21,"type":"compass"},
            {"prompt":"You are facing West. You make a quarter turn to the right. What direction are you facing now?","answer":"North","id":22,"type":"compass"},
            {"prompt":"Tom walks to school towards the North. On the way home, what direction is Tom walking?","answer":"South","id":23,"type":"compass"},
            {"prompt":"Zoe walks to school towards the West. On the way home, what direction is Zoe walking?","answer":"East","id":24,"type":"compass"},
        ]);
        // The arrayCreate factory stops at undefined, yielding exactly ids 1..24.
        expect(doc.pages.flat().map((p) => p.id)).toEqual(arrayCreate(({ index }) => index < 24 ? index + 1 : undefined));
        expect(new Set(doc.pages.flat().map((p) => p.prompt)).size).toBe(24);
        expect(generateDocument(compassSpec, g3, seed, 3).pages.slice(0, 2)).toEqual(doc.pages);
    });

    it('repeats identical seeds and pins a fresh deterministic refresh stream', () => {
        const seed = seedFrom([3, 'compass', 0]);
        const refreshedSeed = seedFrom([3, 'compass', 1]);
        const doc = generateDocument(compassSpec, g3, seed, 2);
        const refreshed = generateDocument(compassSpec, g3, refreshedSeed, 2);
        expect(generateDocument(compassSpec, g3, seed, 2)).toEqual(doc);
        expect(refreshed.pages[0].slice(0, 3)).toEqual([
            {"prompt":"Max walks to school towards the North. On the way home, what direction is Max walking?","answer":"South","id":1,"type":"compass"},
            {"prompt":"Leo walks to school towards the South. On the way home, what direction is Leo walking?","answer":"North","id":2,"type":"compass"},
            {"prompt":"Which direction does a compass needle always point?","answer":"North","id":3,"type":"compass"},
        ]);
        expect(refreshed.total).toBe(24);
        expect(refreshed).not.toEqual(doc);
        expect(generateDocument(compassSpec, g3, refreshedSeed, 2)).toEqual(refreshed);
        // The existing generator ignores numeric caps. Reusing Year 2 with
        // this seed must yield exactly the same NSWE document in Year 3.
        expect(generateDocument(compassSpec, g2, seed, 2)).toEqual(doc);
    });
});

describe('compass — Year 1 (quarter/half turns, opposites, sides, walks)', () => {
    it('matches the exact sheet', () => {
        const s = sheet(g1);
        expect(s).toEqual([
            {"prompt":"In which direction does the sun set?","answer":"West","id":1,"type":"compass"},
            {"prompt":"You are facing East. You make a half turn. What direction are you facing now?","answer":"West","id":2,"type":"compass"},
            {"prompt":"What direction is the opposite of North?","answer":"South","id":3,"type":"compass"},
            {"prompt":"You are facing South. You make a quarter turn to the left. What direction are you facing now?","answer":"East","id":4,"type":"compass"},
            {"prompt":"You are facing West. What direction is on your left?","answer":"South","id":5,"type":"compass"},
            {"prompt":"You are facing North. What direction is on your right?","answer":"East","id":6,"type":"compass"},
            {"prompt":"Max walks to school towards the South. On the way home, what direction is Max walking?","answer":"North","id":7,"type":"compass"},
            {"prompt":"You are facing East. What direction is on your right?","answer":"South","id":8,"type":"compass"},
            {"prompt":"You are facing West. You make a quarter turn to the left. What direction are you facing now?","answer":"South","id":9,"type":"compass"},
            {"prompt":"Which direction does a compass needle always point?","answer":"North","id":10,"type":"compass"},
            {"prompt":"You are facing South. What direction is on your right?","answer":"West","id":11,"type":"compass"},
            {"prompt":"In which direction does the sun rise?","answer":"East","id":12,"type":"compass"},
        ]);
        // Soundness pin: every answer is one of the four cardinal points
        // (never an intercardinal like "North-East" on the grade-1 sheet).
        for (const p of s) {
            expect(['North', 'East', 'South', 'West']).toContain(p.answer);
        }
    });
});

describe('compass — Year 2 (same N/S/E/W space, freshly dealt sheet)', () => {
    it('matches the exact sheet', () => {
        const s = sheet(g2);
        expect(s).toEqual([
            {"prompt":"You are facing South. You make a quarter turn to the right. What direction are you facing now?","answer":"West","id":1,"type":"compass"},
            {"prompt":"In which direction does the sun set?","answer":"West","id":2,"type":"compass"},
            {"prompt":"What direction is the opposite of North?","answer":"South","id":3,"type":"compass"},
            {"prompt":"On a map, North is at the top. What direction is at the bottom of the map?","answer":"South","id":4,"type":"compass"},
            {"prompt":"On a map, North is at the top. What direction is at the left of the map?","answer":"West","id":5,"type":"compass"},
            {"prompt":"You are facing East. You make a quarter turn to the right. What direction are you facing now?","answer":"South","id":6,"type":"compass"},
            {"prompt":"You are facing West. You make a quarter turn to the left. What direction are you facing now?","answer":"South","id":7,"type":"compass"},
            {"prompt":"Max walks to school towards the East. On the way home, what direction is Max walking?","answer":"West","id":8,"type":"compass"},
            {"prompt":"What direction is the opposite of South?","answer":"North","id":9,"type":"compass"},
            {"prompt":"You are facing North. You make a quarter turn to the left. What direction are you facing now?","answer":"West","id":10,"type":"compass"},
            {"prompt":"Mia walks to school towards the East. On the way home, what direction is Mia walking?","answer":"West","id":11,"type":"compass"},
            {"prompt":"You are facing North. What direction is on your right?","answer":"East","id":12,"type":"compass"},
        ]);
        for (const p of s) {
            expect(['North', 'East', 'South', 'West']).toContain(p.answer);
        }
    });
});
