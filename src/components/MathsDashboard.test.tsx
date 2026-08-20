// Integration tests for the maths dashboard.
//
// Verifies the reworked layout and its behaviour:
//   - grade selector (top-right) switches grade and, for unimplemented grades,
//     shows the "coming soon" placeholder + empty canvas state;
//   - math-type rail (left) switches the generated sheet;
//   - pages control (toolbar) generates multi-page worksheets whose pages are
//     numbered continuously (Year 1 addition: page 2 starts "10 + 7 =",
//     page 3 starts "12 + 4 =" — values pinned in src/lib/problems.test.ts);
//   - zoom control switches the preview between Fit / 50% / 75% / 100%;
//   - Print opens the fixed-viewport review overlay (identical page content,
//     never grows the document), its Print action calls window.print() (the
//     screen-hidden .print-doc tree is what the browser actually prints), and
//     Back / ESC dismiss it.
//
// All expected sheet contents match the deterministic generator outputs
// pinned in src/lib/problems.test.ts.

import React from 'react';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MathsDashboard } from './MathsDashboard';

// Each test renders a fresh dashboard (initially on Year 1 + Addition, 1 page).
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
        // Left rail offers the grade-1 catalogue of math types.
        expect(screen.getByRole('button', { name: 'Addition' })).toBeDefined();
        expect(screen.getByRole('button', { name: 'Subtraction' })).toBeDefined();
        // Right canvas shows the preview viewport of the (Year 1, Addition) sheet.
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
        // Left rail shows the "coming soon" notice.
        expect(screen.getByText(/coming soon/i)).toBeDefined();
        // Right canvas shows the empty state instead of a preview.
        expect(screen.getByTestId('empty-state')).toBeDefined();
        expect(screen.queryByTestId('sheet-preview')).toBeNull();
    });
});

describe('MathsDashboard — multi-page generation', () => {
    it('defaults to a single A4 page (segments 2..5 unselected)', () => {
        expect(screen.getByRole('button', { name: '1' }).getAttribute('aria-pressed')).toBe('true');
        expect(screen.getByRole('button', { name: '2' }).getAttribute('aria-pressed')).toBe('false');
        // Exactly one rendered page shell, and no "Page x of y" badge.
        expect(screen.getByTestId('sheet-preview-page1')).toBeDefined();
        expect(screen.queryByTestId('sheet-preview-page2')).toBeNull();
        expect(screen.getByTestId('sheet-preview').textContent).not.toContain('Page 1 of');
    });

    it('generates 3 A4 pages whose rows match the pinned generator stream', () => {
        // Request 3 pages from the toolbar segmented control.
        fireEvent.click(screen.getByRole('button', { name: '3' }));
        expect(screen.getByRole('button', { name: '3' }).getAttribute('aria-pressed')).toBe('true');

        // Three page shells, each independently addressable in tests.
        const preview = screen.getByTestId('sheet-preview');
        expect(screen.getByTestId('sheet-preview-page1')).toBeDefined();
        expect(screen.getByTestId('sheet-preview-page2')).toBeDefined();
        expect(screen.getByTestId('sheet-preview-page3')).toBeDefined();
        expect(screen.queryByTestId('sheet-preview-page4')).toBeNull();

        // Page 1 keeps the original first row; pages 2 and 3 continue the
        // exact deterministic stream pinned in problems.test.ts.
        expect((screen.getByTestId('sheet-preview-page1').textContent ?? '')).toContain('10 + 9 =');
        expect((screen.getByTestId('sheet-preview-page2').textContent ?? '')).toContain('10 + 7 =');
        expect((screen.getByTestId('sheet-preview-page3').textContent ?? '')).toContain('12 + 4 =');
        // Multi-page documents label every page (badge on screen, footer in print).
        expect(preview.textContent).toContain('Page 1 of 3');
        expect(preview.textContent).toContain('Page 3 of 3');
        // The toolbar title is unaffected by the page count.
        expect(screen.getByTestId('toolbar-title').textContent).toBe('Year 1 — Addition');
    });

    it('switches back to fewer pages without regenerating problems', () => {
        // 2 pages, then down to 1 again — first rows stay the same sheet data.
        fireEvent.click(screen.getByRole('button', { name: '2' }));
        expect(screen.getByTestId('sheet-preview-page2')).toBeDefined();
        fireEvent.click(screen.getByRole('button', { name: '1' }));
        expect(screen.queryByTestId('sheet-preview-page2')).toBeNull();
        expect((screen.getByTestId('sheet-preview').textContent ?? '')).toContain('10 + 9 =');
    });
});

describe('MathsDashboard — zoom control', () => {
    it('defaults to Fit and switches to a fixed percentage zoom', () => {
        const fit = screen.getByRole('button', { name: 'Preview zoom: Fit' });
        const hundred = screen.getByRole('button', { name: 'Preview zoom: 100%' });
        expect(fit.getAttribute('aria-pressed')).toBe('true');
        expect(hundred.getAttribute('aria-pressed')).toBe('false');

        fireEvent.click(hundred);
        expect(hundred.getAttribute('aria-pressed')).toBe('true');
        // Selecting a fixed zoom deselects Fit (single selection).
        expect(screen.getByRole('button', { name: 'Preview zoom: Fit' }).getAttribute('aria-pressed')).toBe(
            'false'
        );
    });
});

describe('MathsDashboard — print flow (overlay + window.print)', () => {
    it('opens the review overlay on Print, prints via window.print, closes on Back', () => {
        // window.print is a jsdom no-op — replace it with a spy we can assert on.
        const printSpy = vi.fn();
        window.print = printSpy;

        // Initially no print overlay in the DOM.
        expect(screen.queryByTestId('sheet-print')).toBeNull();

        // Open the printable document review (toolbar button — unique while the
        // overlay is closed).
        fireEvent.click(screen.getByRole('button', { name: 'Print' }));

        // The fixed overlay now renders the identical page content, plus a Back
        // button and its own Print action.
        const overlay = screen.getByTestId('sheet-print');
        expect(overlay.textContent).toContain('10 + 9 =');
        expect(screen.getByTestId('sheet-print-page1')).toBeDefined();
        const overlayPrint = within(overlay).getByRole('button', { name: 'Print' });
        expect(overlayPrint).toBeDefined();
        // The zoom preference carried over from the preview (dark bar variant).
        expect(within(overlay).getByRole('button', { name: 'Print zoom: Fit' })).toBeDefined();

        // The modal's Print action fires the real print job (the hidden
        // .print-doc tree is what the browser prints; see app.css).
        fireEvent.click(overlayPrint);
        expect(printSpy).toHaveBeenCalledTimes(1);

        // Back dismisses the overlay (returns to the dashboard).
        fireEvent.click(screen.getByRole('button', { name: /back/i }));
        expect(screen.queryByTestId('sheet-print')).toBeNull();
        // The dashboard preview is still there.
        expect(screen.getByTestId('sheet-preview')).toBeDefined();
    });

    it('closes the print overlay on Escape', () => {
        const printSpy = vi.fn();
        window.print = printSpy;

        fireEvent.click(screen.getByRole('button', { name: 'Print' }));
        expect(screen.getByTestId('sheet-print')).toBeDefined();

        // Escape is the standard modal dismissal.
        fireEvent.keyDown(window, { key: 'Escape' });
        expect(screen.queryByTestId('sheet-print')).toBeNull();
        // The print job must NOT have fired from dismissing the review.
        expect(printSpy).not.toHaveBeenCalled();
    });

    it('shows the multi-page document in the print overlay', () => {
        // 2-page worksheet, then open the print review.
        fireEvent.click(screen.getByRole('button', { name: '2' }));
        fireEvent.click(screen.getByRole('button', { name: 'Print' }));

        const overlay = screen.getByTestId('sheet-print');
        // Both A4 pages are present in the review and carry page badges.
        expect(screen.getByTestId('sheet-print-page1')).toBeDefined();
        expect(screen.getByTestId('sheet-print-page2')).toBeDefined();
        expect(overlay.textContent).toContain('Page 2 of 2');
        // Page 2 content matches the pinned continuation row.
        expect((screen.getByTestId('sheet-print-page2').textContent ?? '')).toContain('10 + 7 =');
    });
});