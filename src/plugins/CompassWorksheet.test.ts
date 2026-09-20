// Unit tests for the COMPASS DIRECTIONS worksheet plugin.
//
// The plugin's generator is DETERMINISTIC: entire sheets pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). Prep does not offer the extension types.
//
// The question space is the curated N/S/E/W space (62 distinct prompts:
// 6 turn/side kinds x 4 facings + 3 map edges + 8 walk names x 4 facings + 3
// facts) — its exact capacity is pinned in unique-sampling.test.ts.

import { describe, it, expect } from 'vitest';
import { seedFrom, getGradeConfig, generateSheet } from '../framework';
import { compassSpec } from './CompassWorksheet';

const g0 = getGradeConfig(0);
const g1 = getGradeConfig(1);
const g2 = getGradeConfig(2);

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
        // The N/S/E/W vocabulary is grade-1 level at both offered grades —
        // the scope line does not vary by cap like the measure sheet's does.
        expect(compassSpec.scope(g1)).toBe('north, south, east & west');
        expect(compassSpec.scope(g2)).toBe('north, south, east & west');
    });
});

describe('compass — availability gating', () => {
    it('Prep does not offer the extension type (empty sheet); Year 1 does', () => {
        expect(sheet(g0)).toEqual([]);
        expect(sheet(g1)).toHaveLength(12);
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
