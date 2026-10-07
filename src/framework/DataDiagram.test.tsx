// Rendering contract for types.ts's DataFigure (framework/DataDiagram.tsx).
// The generator's tally/graph math belongs in plugins/DataWorksheet.test.ts;
// these fixtures pin the supplied SVG marks only: totals, differences and
// unit scales are PRIVATE answers and must never enter the DOM.
import React from 'react';
import { arrayCreate } from '@presource/core';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DataDiagram } from './DataDiagram';
import type { DataFigure } from './types';

afterEach(cleanup);

describe('DataDiagram — tally figures', () => {
    it('prints the exact five-groups + remainder strokes with a neutral name', () => {
        // total 13 = two five-groups (4 strokes + slash each) + 3 remainder
        // strokes: 13 <line> elements, 91px wide (2×34 + 3×6 + 3 + 2).
        render(<DataDiagram figure={Object.freeze({ kind: 'tally', total: 13 })} />);
        const image = screen.getByRole('img');
        expect(image.getAttribute('aria-label')).toBe('tally marks');
        expect(image.getAttribute('viewBox')).toBe('0 0 91 24');
        expect(image.getAttribute('width')).toBe('91px');
        expect(image.getAttribute('height')).toBe('24px');
        // No <text> anywhere: the total is the private answer, never spoken.
        expect(image.querySelectorAll('text')).toHaveLength(0);
        // Two five-groups: 4 vertical strokes + 1 slash per group, then the
        // 3 remainder strokes after the 68px group run.
        const lines = image.querySelectorAll('line');
        expect(lines).toHaveLength(13);
        expect(arrayCreate(({ index }) => lines[index]?.outerHTML)).toEqual([
            '<line x1="0" y1="4" x2="0" y2="20" stroke="#1a1a1a" stroke-width="2"></line>',
            '<line x1="6" y1="4" x2="6" y2="20" stroke="#1a1a1a" stroke-width="2"></line>',
            '<line x1="12" y1="4" x2="12" y2="20" stroke="#1a1a1a" stroke-width="2"></line>',
            '<line x1="18" y1="4" x2="18" y2="20" stroke="#1a1a1a" stroke-width="2"></line>',
            '<line x1="2" y1="21" x2="27" y2="3" stroke="#1a1a1a" stroke-width="2"></line>',
            '<line x1="34" y1="4" x2="34" y2="20" stroke="#1a1a1a" stroke-width="2"></line>',
            '<line x1="40" y1="4" x2="40" y2="20" stroke="#1a1a1a" stroke-width="2"></line>',
            '<line x1="46" y1="4" x2="46" y2="20" stroke="#1a1a1a" stroke-width="2"></line>',
            '<line x1="52" y1="4" x2="52" y2="20" stroke="#1a1a1a" stroke-width="2"></line>',
            '<line x1="36" y1="21" x2="61" y2="3" stroke="#1a1a1a" stroke-width="2"></line>',
            '<line x1="68" y1="4" x2="68" y2="20" stroke="#1a1a1a" stroke-width="2"></line>',
            '<line x1="74" y1="4" x2="74" y2="20" stroke="#1a1a1a" stroke-width="2"></line>',
            '<line x1="80" y1="4" x2="80" y2="20" stroke="#1a1a1a" stroke-width="2"></line>'
        ]);
    });

    it('degrades a whole-multiple total to groups only (no remainder strokes)', () => {
        // total 15 = three five-groups exactly: 12 vertical strokes (3×4) + 3
        // slashes inside 3×34 + 2 = 104px.
        const { container } = render(<DataDiagram figure={Object.freeze({ kind: 'tally', total: 15 })} />);
        const image = container.querySelector('svg')!;
        expect(image.getAttribute('viewBox')).toBe('0 0 104 24');
        expect(image.querySelectorAll('line[y1="4"]')).toHaveLength(12); // vertical strokes
        expect(image.querySelectorAll('line[y1="21"]')).toHaveLength(3); // group slashes
        expect(image.querySelectorAll('line')).toHaveLength(15);
    });
});

describe('DataDiagram — picture graphs', () => {
    it('prints one 5-point star per counted unit (stars only, no scale)', () => {
        const { container } = render(<DataDiagram figure={Object.freeze({ kind: 'picture', stars: 6 })} />);
        const image = container.querySelector('svg')!;
        expect(image.getAttribute('aria-label')).toBe('picture graph');
        expect(image.getAttribute('viewBox')).toBe('0 0 100 14');
        expect(image.getAttribute('width')).toBe('100px');
        const polygons = image.querySelectorAll('polygon');
        expect(polygons).toHaveLength(6);
        // Star 1 is centred at (9, 7): the exact 10-vertex pentagram pin.
        expect(polygons[0].getAttribute('points')).toBe(
            '9.00,1.00 10.47,4.98 14.71,5.15 11.38,7.77 14.71,11.85 9.00,9.50 3.29,11.85 6.62,7.77 3.29,5.15 7.53,4.98'
        );
        // Stars follow the 18-unit pitch (centres 9, 27, 45, ...).
        expect(polygons[1].getAttribute('points')).toBe(
            '27.00,1.00 28.47,4.98 32.71,5.15 29.38,7.77 32.71,11.85 27.00,9.50 21.29,11.85 24.62,7.77 21.29,5.15 25.53,4.98'
        );
        // The star → thing scale and the total stay in the prompt/data only.
        expect(image.querySelectorAll('text')).toHaveLength(0);
    });

    it('sizes the SVG width from the star count', () => {
        // 4 stars: 4×18 − 8 = 64px; 1 star: 10px.
        const { container } = render(<DataDiagram figure={Object.freeze({ kind: 'picture', stars: 4 })} />);
        expect(container.querySelector('svg')!.getAttribute('viewBox')).toBe('0 0 64 14');
        expect(container.querySelectorAll('polygon')).toHaveLength(4);
    });
});

describe('DataDiagram — column graphs', () => {
    it('prints the two named bars at 2px per vote with names only', () => {
        const { container } = render(<DataDiagram figure={Object.freeze({
            kind: 'column', leftName: 'Kai', rightName: 'Mia', left: 9, right: 8
        })} />);
        const image = container.querySelector('svg')!;
        expect(image.getAttribute('aria-label')).toBe('column graph');
        expect(image.getAttribute('viewBox')).toBe('0 0 76 80');
        // The only text is the names — vote counts and the "how many more"
        // difference (the answer) are never printed.
        const texts = arrayCreate(({ index }) => image.querySelectorAll('text')[index]?.textContent);
        expect(texts).toEqual(['Kai', 'Mia']);
        const rects = image.querySelectorAll('rect');
        expect(arrayCreate(({ index }) => rects[index]?.outerHTML)).toEqual([
            '<rect x="12" y="50" width="22" height="18" fill="#f2f2f2" stroke="#1a1a1a" stroke-width="1"></rect>',
            '<rect x="42" y="52" width="22" height="16" fill="#f2f2f2" stroke="#1a1a1a" stroke-width="1"></rect>'
        ]);
        // Baseline at y=68 spans both bars.
        const baseline = image.querySelectorAll('line');
        expect(baseline).toHaveLength(1);
        expect(baseline[0].outerHTML).toBe('<line x1="6" y1="68" x2="70" y2="68" stroke="#1a1a1a" stroke-width="1.5"></line>');
    });

    it('renders repeatedly without changing geometry (determinism)', () => {
        const figure: DataFigure = Object.freeze({ kind: 'column', leftName: 'Tom', rightName: 'Sam', left: 7, right: 2 });
        const { container, rerender } = render(<DataDiagram figure={figure} />);
        const originalMarkup = container.innerHTML;
        rerender(<DataDiagram figure={figure} />);
        expect(container.innerHTML).toBe(originalMarkup);
    });
});
