// Unit tests for the TEMPERATURE worksheet plugin.
//
// The plugin's generator is DETERMINISTIC: entire sheets pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). Prep does not offer the extension types.
//
// The numeric range comes from the grade cap (caps.tempCap): Year 1 stays
// within 20°C (its within-20 number scope); Year 2 reaches 40°C.

import { describe, it, expect } from 'vitest';
import { seedFrom, getGradeConfig, generateSheet } from '../framework';
import { temperatureSpec } from './TemperatureWorksheet';

const g0 = getGradeConfig(0);
const g1 = getGradeConfig(1);
const g2 = getGradeConfig(2);

function sheet(grade: ReturnType<typeof getGradeConfig>) {
    return generateSheet(temperatureSpec, grade, seedFrom([grade.id, temperatureSpec.id, 0]));
}

// Parse the numeric °C values mentioned in a prompt ("12°C" -> 12) so the
// soundness pins below can bound the whole sheet by the grade cap.
function tempsIn(prompt: string): number[] {
    return [...prompt.matchAll(/(\d+)°C/g)].map((m) => Number(m[1]));
}

describe('temperature plugin — declarative spec', () => {
    it('declares its sidebar label, glyph, prose layout and page size', () => {
        expect(temperatureSpec.id).toBe('temperature');
        expect(temperatureSpec.label).toBe('Temperature');
        expect(temperatureSpec.icon).toBe('♨');
        expect(temperatureSpec.singleColumn).toBe(true);
        expect(temperatureSpec.perPage).toBe(12);
    });

    it('describes its numeric scope from the grade caps', () => {
        expect(temperatureSpec.scope(g1)).toBe('temperatures to 20°C');
        expect(temperatureSpec.scope(g2)).toBe('temperatures to 40°C');
    });
});

describe('temperature — availability gating', () => {
    it('Prep does not offer the extension type (empty sheet); Year 1 does', () => {
        expect(sheet(g0)).toEqual([]);
        expect(sheet(g1)).toHaveLength(12);
    });
});

describe('temperature — Year 1 (within 20°C)', () => {
    it('matches the exact sheet', () => {
        const s = sheet(g1);
        expect(s).toEqual([
            {"prompt":"Which is the warmest: 11°C, 5°C or 17°C?","answer":"17°C","id":1,"type":"temperature"},
            {"prompt":"Is a sunny Christmas picnic more likely to be 5°C or 14°C?","answer":"14°C","id":2,"type":"temperature"},
            {"prompt":"Put these temperatures in order from coldest to warmest: 12°C, 8°C, 18°C","answer":"8°C, 12°C, 18°C","answerLine":true,"id":3,"type":"temperature"},
            {"prompt":"Which season has the hottest days in Australia?","answer":"summer","id":4,"type":"temperature"},
            {"prompt":"Which is warmer: 2°C or 13°C?","answer":"13°C","id":5,"type":"temperature"},
            {"prompt":"What do we measure temperature with?","answer":"a thermometer","id":6,"type":"temperature"},
            {"prompt":"Which is colder: 18°C or 14°C?","answer":"14°C","id":7,"type":"temperature"},
            {"prompt":"Put these temperatures in order from coldest to warmest: 19°C, 15°C, 6°C","answer":"6°C, 15°C, 19°C","answerLine":true,"id":8,"type":"temperature"},
            {"prompt":"Put these temperatures in order from coldest to warmest: 8°C, 17°C, 3°C","answer":"3°C, 8°C, 17°C","answerLine":true,"id":9,"type":"temperature"},
            {"prompt":"Which is the warmest: 7°C, 16°C or 9°C?","answer":"16°C","id":10,"type":"temperature"},
            {"prompt":"Is a summer day at the pool more likely to be 20°C or 4°C?","answer":"20°C","id":11,"type":"temperature"},
            {"prompt":"Which is colder: 5°C or 15°C?","answer":"5°C","id":12,"type":"temperature"},
        ]);
        // Soundness pins: every numeric value on the Year 1 sheet stays
        // inside its within-20 cap, and only the ordering items carry the
        // write-on-the-line answerLine flag (ids 3, 8, 9 on this sheet).
        for (const p of s) {
            for (const t of tempsIn(p.prompt)) expect(t).toBeLessThanOrEqual(20);
        }
        expect(s.filter((p) => p.answerLine).map((p) => p.id)).toEqual([3, 8, 9]);
    });
});

describe('temperature — Year 2 (within 40°C)', () => {
    it('matches the exact sheet', () => {
        const s = sheet(g2);
        expect(s).toEqual([
            {"prompt":"Which is the coldest: 5°C, 2°C or 39°C?","answer":"2°C","id":1,"type":"temperature"},
            {"prompt":"Which is colder: 31°C or 6°C?","answer":"6°C","id":2,"type":"temperature"},
            {"prompt":"It is 10°C outside. The temperature goes down by 2 degrees. What is the temperature now?","answer":"8°C","id":3,"type":"temperature"},
            {"prompt":"It is 5°C outside. The temperature goes up by 4 degrees. What is the temperature now?","answer":"9°C","id":4,"type":"temperature"},
            {"prompt":"Which is colder: 3°C or 15°C?","answer":"3°C","id":5,"type":"temperature"},
            {"prompt":"It is 38°C outside. The temperature goes down by 5 degrees. What is the temperature now?","answer":"33°C","id":6,"type":"temperature"},
            {"prompt":"Which is the warmest: 28°C, 15°C or 1°C?","answer":"28°C","id":7,"type":"temperature"},
            {"prompt":"Which is the warmest: 20°C, 25°C or 29°C?","answer":"29°C","id":8,"type":"temperature"},
            {"prompt":"Which is the coldest: 33°C, 12°C or 18°C?","answer":"12°C","id":9,"type":"temperature"},
            {"prompt":"Is a snowy winter morning more likely to be 4°C or 28°C?","answer":"4°C","id":10,"type":"temperature"},
            {"prompt":"Which is the warmest: 31°C, 8°C or 36°C?","answer":"36°C","id":11,"type":"temperature"},
            {"prompt":"Which is the warmest: 10°C, 38°C or 5°C?","answer":"38°C","id":12,"type":"temperature"},
        ]);
        // Soundness pins: within-40 cap on every printed value, and the
        // rise/drop arithmetic stays inside the same range.
        for (const p of s) {
            for (const t of tempsIn(p.prompt)) expect(t).toBeLessThanOrEqual(40);
        }
    });
});
