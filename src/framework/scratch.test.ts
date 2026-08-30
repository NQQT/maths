import { describe, it, expect } from 'vitest';
import { writeFileSync } from 'node:fs';
import { seedFrom, getGradeConfig, generateSheet } from '../framework';
import { dataSpec } from '../plugins/DataWorksheet';

describe('scratch', () => {
    it('prints Y2 data sheet', () => {
        const g2 = getGradeConfig(2);
        const s = generateSheet(dataSpec, g2, seedFrom([2, 'data', 0]));
        writeFileSync(
            'scratch-out.txt',
            s.map((p) => `${p.id}|${p.answer}|${p.prompt}`).join('\n')
        );
        expect(true).toBe(true);
    });
});
