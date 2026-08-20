// Integration tests for the maths dashboard.
//
// Verifies the three-part layout and its behaviour:
//   - grade selector (top-right) switches grade and, for unimplemented grades,
//     shows the "coming soon" placeholder;
//   - math-type sidebar (left) switches the generated sheet;
//   - content window (right) previews the exact generated sheet and the Print
//     action opens the DocumentPrint A4 overlay (same content) + a Back button.
//
// All expected sheet contents match the deterministic generator outputs pinned
// in src/lib/problems.test.ts (addition for Year 1 => "10 + 9 = 19" first row,
// subtraction => "6 - 4 = 2", etc.).

import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MathsDashboard } from './MathsDashboard';

// Each test renders a fresh dashboard (initially on Year 1 + Addition).
beforeEach(() => {
    render(<MathsDashboard />);
});

// Tear down the DOM between tests so overlays/previews don't leak across cases.
afterEach(() => {
    cleanup();
});

// Find a grade pill by its accessible short label (grade 3 => "3", prep => "P").
function gradeRadio(name: string) {
    return screen.getByRole('radio', { name });
}

describe('MathsDashboard — layout', () => {
    it('renders the app title and year-1 addition preview by default', () => {
        // App title in the header.
        expect(screen.getByText('Maths Sheets')).toBeDefined();
        // Grade selector present (P + 1..12 = 13 radios; 1 is selected by default).
        expect(gradeRadio('1').getAttribute('aria-checked')).toBe('true');
        // Left sidebar offers the grade-1 catalogue of math types.
        expect(screen.getByRole('button', { name: 'Addition' })).toBeDefined();
        expect(screen.getByRole('button', { name: 'Subtraction' })).toBeDefined();
        // Right window shows the scaled preview of the (Year 1, Addition) sheet.
        expect(screen.getByTestId('sheet-preview')).toBeDefined();
    });

    it('shows the exact first problem of the Year 1 addition sheet in the preview', () => {
        // Year 1 addition, problem 1 is "10 + 9 = __" (see problems.test.ts).
        const previewText = screen.getByTestId('sheet-preview').textContent ?? '';
        expect(previewText).toContain('10 + 9 =');
    });
});

describe('MathsDashboard — math type selection (left)', () => {
    it('switches the sheet when a different math type is chosen', () => {
        // Start on Addition.
        expect((screen.getByTestId('sheet-preview').textContent ?? '')).toContain('10 + 9 =');

        // Pick Subtraction.
        fireEvent.click(screen.getByRole('button', { name: 'Subtraction' }));

        // Preview now reflects the (Year 1, Subtraction) sheet; first row "6 - 4 =".
        expect((screen.getByTestId('sheet-preview').textContent ?? '')).toContain('6 - 4 =');
        // Toolbar title updates to the new type.
        expect(screen.getByTestId('toolbar-title').textContent).toBe('Year 1 — Subtraction');
    });

    it('Word Problems switches the sheet to prose questions', () => {
        fireEvent.click(screen.getByRole('button', { name: 'Word Problems' }));
        const text = screen.getByTestId('sheet-preview').textContent ?? '';
        // Year 1 word, problem 1 (see problems.test.ts).
        expect(text).toContain('Sam had 11 cookies');
    });
});

describe('MathsDashboard — grade selection (top-right)', () => {
    it('switches to Year 2 and reflects the bigger-number sheet', () => {
        fireEvent.click(gradeRadio('2'));
        // Year 2 addition first row is "45 + 41 =" (within 100).
        expect((screen.getByTestId('sheet-preview').textContent ?? '')).toContain('45 + 41 =');
        expect(screen.getByTestId('toolbar-title').textContent).toBe('Year 2 — Addition');
    });

    it('switches to Prep (grade 0)', () => {
        fireEvent.click(gradeRadio('P'));
        // Prep addition first row is "2 + 7 =".
        expect((screen.getByTestId('sheet-preview').textContent ?? '')).toContain('2 + 7 =');
    });

    it('shows a coming-soon placeholder for an unimplemented grade (Year 3)', () => {
        fireEvent.click(gradeRadio('3'));
        // Left sidebar shows the "coming soon" notice.
        expect(screen.getByText(/coming soon/i)).toBeDefined();
        // Right window shows the empty state instead of a preview.
        expect(screen.getByTestId('empty-state')).toBeDefined();
        expect(screen.queryByTestId('sheet-preview')).toBeNull();
    });
});

describe('MathsDashboard — print flow (DocumentPrint)', () => {
    it('opens the printable A4 overlay on Print and closes it on Back', () => {
        // Initially no print overlay.
        expect(screen.queryByTestId('sheet-print')).toBeNull();

        // Open the printable document.
        fireEvent.click(screen.getByRole('button', { name: 'Print' }));

        // The DocumentPrint overlay now renders the identical sheet, plus Back.
        expect(screen.getByTestId('sheet-print')).toBeDefined();
        expect(screen.getByTestId('sheet-print').textContent).toContain('10 + 9 =');
        const back = screen.getByRole('button', { name: /back/i });
        expect(back).toBeDefined();

        // Back dismisses the overlay (returns to the dashboard).
        fireEvent.click(back);
        expect(screen.queryByTestId('sheet-print')).toBeNull();
        // The dashboard preview is still there.
        expect(screen.getByTestId('sheet-preview')).toBeDefined();
    });
});