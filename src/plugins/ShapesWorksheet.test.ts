// Unit tests for the SHAPES & ATTRIBUTES worksheet plugin.
//
// The plugin's generator is DETERMINISTIC: entire sheets pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). Prep does not offer the extension types.

import { describe, it, expect } from 'vitest';
import { seedFrom, getGradeConfig, generateSheet } from '../framework';
import { shapesSpec } from './ShapesWorksheet';

const g0 = getGradeConfig(0);
const g1 = getGradeConfig(1);
const g2 = getGradeConfig(2);

function sheet(grade: ReturnType<typeof getGradeConfig>) {
    return generateSheet(shapesSpec, grade, seedFrom([grade.id, shapesSpec.id, 0]));
}

describe('shapes plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(shapesSpec.id).toBe('shapes');
        expect(shapesSpec.label).toBe('Shapes & Attributes');
        expect(shapesSpec.icon).toBe('△');
        expect(shapesSpec.perPage).toBe(16);
    });

    it('describes its numeric scope', () => {
        expect(shapesSpec.scope(g1)).toBe('2-D & 3-D shapes');
    });
});

describe('shapes — availability gating', () => {
    it('Prep does not offer the extension type (empty sheet); Year 1 does', () => {
        expect(sheet(g0)).toEqual([]);
        expect(sheet(g1)).toHaveLength(16);
    });
});

describe('shapes — Year 1 (everyday 2-D + 3-D set)', () => {
    it('matches the exact sheet (2-D sides/corners + 3-D flat faces)', () => {
        const s = sheet(g1);
        expect(s).toEqual([
            {"prompt":"Which of these 3-D objects has only flat faces? (cube, cylinder, sphere)","answer":"cube","id":1,"type":"shapes"},
            {"prompt":"Which of these 3-D objects has only flat faces? (cube, sphere, cylinder)","answer":"cube","id":2,"type":"shapes"},
            {"prompt":"How many sides does a triangle have?","answer":"3","id":3,"type":"shapes"},
            {"prompt":"How many corners does a rectangle have?","answer":"4","id":4,"type":"shapes"},
            {"prompt":"How many corners does a square have?","answer":"4","id":5,"type":"shapes"},
            {"prompt":"How many corners does a triangle have?","answer":"3","id":6,"type":"shapes"},
            {"prompt":"How many corners does an oval have?","answer":"0","id":7,"type":"shapes"},
            {"prompt":"How many sides does a rectangle have?","answer":"4","id":8,"type":"shapes"},
            {"prompt":"Which 2-D shape has 0 corners? (triangle, circle, square)","answer":"circle","id":9,"type":"shapes"},
            {"prompt":"Which 2-D shape has 4 corners? (oval, square, circle)","answer":"square","id":10,"type":"shapes"},
            {"prompt":"How many flat faces does a sphere have?","answer":"0","id":11,"type":"shapes"},
            {"prompt":"How many flat faces does a cube have?","answer":"6","id":12,"type":"shapes"},
            {"prompt":"How many flat faces does a cylinder have?","answer":"2","id":13,"type":"shapes"},
            {"prompt":"Which 2-D shape has 4 corners? (triangle, square, circle)","answer":"square","id":14,"type":"shapes"},
            {"prompt":"Which 2-D shape has 3 corners? (rectangle, triangle, oval)","answer":"triangle","id":15,"type":"shapes"},
            {"prompt":"How many sides does a square have?","answer":"4","id":16,"type":"shapes"},
        ]);
        // Year 1's shape set has exactly one all-flat 3-D object (the cube), so
        // every "only flat faces" answer in a Y1 sheet must be the cube.
        for (const p of s) {
            if (p.prompt.startsWith('Which of these 3-D')) expect(p.answer).toBe('cube');
        }
    });
});

describe('shapes — Year 2 (adds hexagon, prism, pyramid, cone)', () => {
    it('matches the exact sheet', () => {
        const s = sheet(g2);
        expect(s).toEqual([
            {"prompt":"How many sides does a rectangle have?","answer":"4","id":1,"type":"shapes"},
            {"prompt":"Which of these 3-D objects has only flat faces? (pyramid, prism, cube)","answer":"pyramid","id":2,"type":"shapes"},
            {"prompt":"How many flat faces does a sphere have?","answer":"0","id":3,"type":"shapes"},
            {"prompt":"How many sides does a hexagon have?","answer":"6","id":4,"type":"shapes"},
            {"prompt":"Which 2-D shape has 0 corners? (square, oval, rectangle)","answer":"oval","id":5,"type":"shapes"},
            {"prompt":"How many sides does a triangle have?","answer":"3","id":6,"type":"shapes"},
            {"prompt":"How many corners does a triangle have?","answer":"3","id":7,"type":"shapes"},
            {"prompt":"Which of these 3-D objects has only flat faces? (cube, pyramid, prism)","answer":"cube","id":8,"type":"shapes"},
            {"prompt":"Which 2-D shape has 3 corners? (hexagon, triangle, square)","answer":"triangle","id":9,"type":"shapes"},
            {"prompt":"Which of these 3-D objects has only flat faces? (prism, pyramid, sphere)","answer":"prism","id":10,"type":"shapes"},
            {"prompt":"Which 2-D shape has 0 corners? (rectangle, oval, triangle)","answer":"oval","id":11,"type":"shapes"},
            {"prompt":"How many corners does a rectangle have?","answer":"4","id":12,"type":"shapes"},
            {"prompt":"How many corners does an oval have?","answer":"0","id":13,"type":"shapes"},
            {"prompt":"Which 2-D shape has 4 corners? (triangle, square, circle)","answer":"square","id":14,"type":"shapes"},
            {"prompt":"How many flat faces does a cylinder have?","answer":"2","id":15,"type":"shapes"},
            {"prompt":"Which of these 3-D objects has only flat faces? (cube, cylinder, prism)","answer":"cube","id":16,"type":"shapes"},
        ]);
        // "Only flat faces" answers are exactly the non-curved 3-D solids.
        for (const p of s) {
            if (p.prompt.startsWith('Which of these 3-D')) {
                expect(['cube', 'prism', 'pyramid']).toContain(p.answer);
            }
        }
    });
});
