// Integration tests for the worksheet PLUGINS, mounted in the framework host.
//
// This test file lives with the dashboard host: it exercises the whole
// worksheet family end-to-end through the real dashboard, exactly as a
// teacher uses it. (Each worksheet's generator has its own pinned unit tests
// next to the plugin file; this suite covers the composed behaviour.)
//
// Verifies the layout and its behaviour:
//   - grade selector (framework header component) switches grade and, for
//     unimplemented grades, shows the "coming soon" placeholder + empty
//     canvas state;
//   - the unified plugin rail (left) switches the generated sheet; it shows
//     icon + label only — NO per-type "questions per page" count badges;
//   - page-count STEPPER (toolbar, −/n/+) is an unbounded number: type or
//     increment to 3, 4, 12... pages — generated A4 sheets are numbered
//     continuously (Year 1 addition: page 2 starts "12 + 2 =", page 3 starts
//     "17 + 2 =" — values pinned in AdditionWorksheet.test.ts);
//   - "Randomize" re-rolls the seed in place: same page count, new problems
//     (pinned refresh=1/refresh=2 streams below);
//   - zoom control switches the preview between Fit / 50% / 75% / 100%;
//   - Print opens the browser-NATIVE print dialog IMMEDIATELY (plain
//     window.print(), no in-app review screen — the preview canvas IS the
//     print preview). The screen-hidden .print-doc tree is what the dialog
//     paginates: exactly one A4 block per worksheet page, so a 5-page
//     worksheet is 5 pages in the dialog.
//
// All expected sheet contents match the deterministic generator outputs
// pinned in the per-plugin test files.
//
// PLUGIN LOADING ORDER: the dashboard renders FIRST (shell + the first
// plugin, Addition, in the initial paint); the remaining plugins are then
// loaded ONE BY ONE after mount (framework/loader.ts). Tests that touch a
// non-default rail entry therefore AWAIT that entry (findByRole) before
// clicking it; `allVisiblePluginsLoaded()` below awaits the last Year-1
// entry when an assertion needs the FULL rail.

import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MathsDashboard } from './MathsDashboard';

// Each test renders a fresh dashboard (initially on Year 1 + Addition, 1 page).
beforeEach(() => {
    render(<MathsDashboard />);
});

// Tear down the DOM between tests so previews don't leak across cases.
afterEach(() => {
    cleanup();
});

// Find a grade pill by its accessible short label (grade 3 => "3", prep => "P").
function gradeRadio(name: string) {
    return screen.getByRole('radio', { name });
}

// The toolbar Print button — with no in-app review screen, this is the ONLY
// Print affordance; it fires window.print() immediately.
function toolbarPrint() {
    return screen.getByTestId('toolbar-print');
}

// The toolbar Randomize button (re-rolls the seed, preserving page count).
function randomizeButton() {
    return screen.getByTestId('toolbar-randomize');
}

// The problem index and prompt are rendered as adjacent <span>s with no
// whitespace between them (JSX strips newlines between elements), so a row's
// raw textContent is exactly "1.10 + 9 =" — the assertions below use that
// exact concatenated form, prefixed by the problem id, which makes each
// row uniquely addressable inside a page's text.
function text(el: Element | null | undefined) {
    return el?.textContent ?? '';
}

// Await the LAST Year-1 rail entry ("Data & Tally"). Plugins are loaded ONE
// BY ONE after the dashboard renders (framework/loader.ts) in registration
// order, so once this entry is in the rail every plugin that is visible on
// Year 1 has been loaded — rail/canvas assertions below are then
// deterministic. (Later factories — division, money — are Year-2-only and
// hidden on Year 1, so their load state never affects these assertions.)
function allVisiblePluginsLoaded() {
    // Generous timeout: the loads are chained macrotasks (one per plugin), so
    // a cold test run under load can take longer than waitFor's 1s default.
    return screen.findByRole('button', { name: 'Data & Tally' }, { timeout: 5000 });
}

describe('MathsDashboard — layout', () => {
    it('renders the app title and year-1 addition preview by default', async () => {
        // Wait for the progressive plugin load to finish before judging the
        // full rail (the first plugin — Addition — is available immediately;
        // the rest stream in one by one).
        await allVisiblePluginsLoaded();
        // App title in the header.
        expect(screen.getByText('Maths Sheets')).toBeDefined();
        // Grade selector present (P + 1..12 = 13 radios; 1 is selected by default).
        expect(gradeRadio('1').getAttribute('aria-checked')).toBe('true');
        // Left rail offers the grade-1 catalogue of math types (no multiplication
        // for Year 1 — times tables start at Grade 2).
        expect(screen.getByRole('button', { name: 'Addition' })).toBeDefined();
        expect(screen.getByRole('button', { name: 'Subtraction' })).toBeDefined();
        expect(screen.queryByRole('button', { name: 'Multiplication' })).toBeNull();
        // Right canvas shows the preview viewport of the (Year 1, Addition) sheet.
        expect(screen.getByTestId('sheet-preview')).toBeDefined();
    });

    it('shows the exact first problem of the Year 1 addition sheet in the preview', () => {
        // Year 1 addition, problem 1 is "10 + 9 = __" (see AdditionWorksheet.test.ts).
        expect(text(screen.getByTestId('sheet-preview-page1'))).toContain('1.10 + 9 =');
    });

    it('the type rail lists icon + label only (no per-type count badges)', async () => {
        // Full rail first (progressive one-by-one plugin loading).
        await allVisiblePluginsLoaded();
        // The old rail showed a "questions per page" number per type
        // (SHEET_COUNTS). With the unbounded Pages stepper and Randomize, a
        // selection can regenerate any number of pages, so those badges were
        // removed from the UI. The rail now contains ONLY the heading and the
        // type buttons — none of the Year 1 type labels contain a digit, so
        // any digit in the rail text would mean a count badge leaked back in.
        const heading = screen.getByRole('heading', { name: 'Math Type' });
        const rail = heading.parentElement!; // <Sidebar> wraps heading + buttons
        expect(text(rail)).not.toMatch(/\d/);
        // Spot-check: the Addition button renders exactly icon glyph + label
        // (adjacent spans, no whitespace => "+Addition" raw), i.e. no count
        // badge text anywhere in the button.
        const addition = screen.getByRole('button', { name: 'Addition' });
        expect(text(addition)).toBe('+Addition');
    });
});

describe('MathsDashboard — math type selection (left)', () => {
    it('switches the sheet when a different math type is chosen', async () => {
        // Start on Addition.
        expect(text(screen.getByTestId('sheet-preview-page1'))).toContain('1.10 + 9 =');

        // Pick Subtraction (awaited — plugins load one by one after mount).
        fireEvent.click(
            await screen.findByRole('button', { name: 'Subtraction' }, { timeout: 5000 })
        );

        // Preview now reflects the (Year 1, Subtraction) sheet; first row "6 - 4 =".
        expect(text(screen.getByTestId('sheet-preview-page1'))).toContain('1.6 - 4 =');
        // Toolbar title updates to the new type.
        expect(screen.getByTestId('toolbar-title').textContent).toBe('Year 1 — Subtraction');
    });

    it('Word Problems switches the sheet to prose questions', async () => {
        // Awaited — plugins load one by one after the dashboard renders.
        fireEvent.click(
            await screen.findByRole('button', { name: 'Word Problems' }, { timeout: 5000 })
        );
        const pageText = text(screen.getByTestId('sheet-preview-page1'));
        // Year 1 word, problem 1 (see WordProblemsWorksheet.test.ts).
        expect(pageText).toContain('Sam had 11 cookies');
    });

    it('Grade 2 offers the Multiplication (times tables) worksheet', async () => {
        fireEvent.click(gradeRadio('2'));
        // Year 2 rail includes Multiplication (awaited — plugins load one by
        // one after the dashboard renders; the factory loads regardless of
        // grade, the gate only controls visibility).
        const multiplication = await screen.findByRole(
            'button',
            { name: 'Multiplication' },
            { timeout: 5000 }
        );

        // Pick it; the sheet matches the pinned Grade 2 times-tables stream
        // (first row "5 × 10 =").
        fireEvent.click(multiplication);
        expect(screen.getByTestId('toolbar-title').textContent).toBe('Year 2 — Multiplication');
        expect(text(screen.getByTestId('sheet-preview-page1'))).toContain('1.5 × 10 =');
    });
});

describe('MathsDashboard — grade selection (top-right)', () => {
    it('switches to Year 2 and reflects the bigger-number sheet', () => {
        fireEvent.click(gradeRadio('2'));
        // Year 2 addition first row is "45 + 41 =" (within 100).
        expect(text(screen.getByTestId('sheet-preview-page1'))).toContain('1.45 + 41 =');
        expect(screen.getByTestId('toolbar-title').textContent).toBe('Year 2 — Addition');
    });

    it('switches to Prep (grade 0)', () => {
        fireEvent.click(gradeRadio('P'));
        // Prep addition first row is "2 + 7 =".
        expect(text(screen.getByTestId('sheet-preview-page1'))).toContain('1.2 + 7 =');
    });

    it('shows a coming-soon placeholder for an unimplemented grade (Year 3)', () => {
        fireEvent.click(gradeRadio('3'));
        // The canvas empty state announces the grade is not implemented yet.
        expect(screen.getByText(/coming soon/i)).toBeDefined();
        // Right canvas shows the empty state instead of a preview.
        expect(screen.getByTestId('empty-state')).toBeDefined();
        expect(screen.queryByTestId('sheet-preview')).toBeNull();
    });
});

describe('MathsDashboard — page count (unbounded −/n/+ stepper)', () => {
    it('defaults to a single page; decrement is blocked at the minimum', () => {
        // The stepper's number field starts at 1.
        const input = screen.getByTestId('page-count') as HTMLInputElement;
        expect(input.value).toBe('1');
        expect(input.min).toBe('1');
        // Decrement is disabled at the minimum of 1 page.
        expect(screen.getByRole('button', { name: 'Decrease pages' }).getAttribute('aria-disabled')).toBe(
            'true'
        );
        // Exactly one rendered page shell, and no "Page x of y" badge.
        expect(screen.getByTestId('sheet-preview-page1')).toBeDefined();
        expect(screen.queryByTestId('sheet-preview-page2')).toBeNull();
        expect(screen.getByTestId('sheet-preview').textContent).not.toContain('Page 1 of');
    });

    it('increments the page count with the + button (no upper limit)', () => {
        // 1 -> 2 -> 3 via two increments.
        fireEvent.click(screen.getByRole('button', { name: 'Increase pages' }));
        fireEvent.click(screen.getByRole('button', { name: 'Increase pages' }));
        expect((screen.getByTestId('page-count') as HTMLInputElement).value).toBe('3');
        // Decrement is now enabled.
        expect(screen.getByRole('button', { name: 'Decrease pages' }).getAttribute('aria-disabled')).toBeNull();

        // Three page shells, each independently addressable in tests.
        const preview = screen.getByTestId('sheet-preview');
        expect(screen.getByTestId('sheet-preview-page1')).toBeDefined();
        expect(screen.getByTestId('sheet-preview-page2')).toBeDefined();
        expect(screen.getByTestId('sheet-preview-page3')).toBeDefined();
        expect(screen.queryByTestId('sheet-preview-page4')).toBeNull();

        // Page 1 keeps the original first rows; pages 2 and 3 continue the
        // exact deterministic stream pinned in AdditionWorksheet.test.ts (the
        // page is now 24 rows, so page 2 starts at id 25 and page 3 at id 49).
        expect(text(screen.getByTestId('sheet-preview-page1'))).toContain('1.10 + 9 =');
        expect(text(screen.getByTestId('sheet-preview-page2'))).toContain('25.12 + 2 =');
        expect(text(screen.getByTestId('sheet-preview-page3'))).toContain('49.17 + 2 =');
        // Multi-page documents label every page (badge on screen, footer in print).
        expect(preview.textContent).toContain('Page 1 of 3');
        expect(preview.textContent).toContain('Page 3 of 3');
        // The toolbar title is unaffected by the page count.
        expect(screen.getByTestId('toolbar-title').textContent).toBe('Year 1 — Addition');
    });

    it('types a large page count — generation is unbounded, not a fixed toggle set', () => {
        // Type 12 pages straight into the number field.
        fireEvent.change(screen.getByTestId('page-count'), { target: { value: '12' } });
        expect((screen.getByTestId('page-count') as HTMLInputElement).value).toBe('12');
        // All 12 A4 shells exist; page 12 is the last one.
        expect(screen.getByTestId('sheet-preview-page12')).toBeDefined();
        expect(screen.queryByTestId('sheet-preview-page13')).toBeNull();
        const preview = screen.getByTestId('sheet-preview');
        expect(preview.textContent).toContain('Page 12 of 12');
    });

    it('switches back to fewer pages via the field; the stream is unchanged', () => {
        // Up to 3, then back down to 1 — same sheet, same first rows.
        fireEvent.change(screen.getByTestId('page-count'), { target: { value: '3' } });
        expect(screen.getByTestId('sheet-preview-page3')).toBeDefined();
        fireEvent.change(screen.getByTestId('page-count'), { target: { value: '1' } });
        expect(screen.queryByTestId('sheet-preview-page2')).toBeNull();
        expect(text(screen.getByTestId('sheet-preview-page1'))).toContain('1.10 + 9 =');
    });
});

describe('MathsDashboard — randomize (re-roll the seed in place)', () => {
    it('regenerates the sheet with a new seed, preserving the page count', () => {
        // Initial (refresh 0) deterministic sheet pinned in AdditionWorksheet.test.ts.
        const page1 = () => text(screen.getByTestId('sheet-preview-page1'));
        expect(page1()).toContain('1.10 + 9 =');
        expect(page1()).toContain('2.12 + 2 =');
        const before = page1();

        // Pin 4 pages first so we can prove Randomize preserves the count.
        fireEvent.change(screen.getByTestId('page-count'), { target: { value: '4' } });
        expect(screen.getByTestId('sheet-preview-page4')).toBeDefined();

        fireEvent.click(randomizeButton());

        // refresh=1 stream, pinned via the deterministic generator: page 1 now
        // opens "19 + 1 =" and continues "1 + 10 =" (neither is the row-1/row-2
        // of the refresh=0 sheet).
        expect(page1()).toContain('1.19 + 1 =');
        expect(page1()).toContain('2.1 + 10 =');
        // The document was actually regenerated, not re-rendered unchanged.
        expect(page1()).not.toBe(before);

        // A second roll lands on yet another stream (refresh=2, row 2 pinned).
        fireEvent.click(randomizeButton());
        expect(page1()).toContain('2.5 + 15 =');

        // The page count chosen on the stepper survives both re-rolls.
        expect((screen.getByTestId('page-count') as HTMLInputElement).value).toBe('4');
        expect(screen.getByTestId('sheet-preview-page4')).toBeDefined();
        expect(screen.getByTestId('sheet-preview').textContent).toContain('Page 4 of 4');
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

describe('MathsDashboard — print flow (native dialog, preview IS the preview)', () => {
    it('Print fires window.print immediately and leaves the content view in place', () => {
        // window.print is a jsdom no-op — replace it with a spy we can assert on.
        const printSpy = vi.fn();
        window.print = printSpy;

        // No in-app review screen exists any more: the preview canvas (with
        // toolbar, stepper and zoom dock) is the print preview.
        expect(screen.getByTestId('sheet-preview')).toBeDefined();

        // The toolbar Print opens the browser-native dialog IMMEDIATELY —
        // exactly one window.print() call, with nothing rendered in between.
        fireEvent.click(toolbarPrint());
        expect(printSpy).toHaveBeenCalledTimes(1);

        // The content view is untouched: same canvas, same pages, same
        // stepper, and the zoom dock is still pinned to it.
        expect(screen.getByTestId('sheet-preview')).toBeDefined();
        expect(screen.getByTestId('sheet-preview-page1')).toBeDefined();
        expect(screen.getByTestId('page-stepper')).toBeDefined();
        expect(screen.getByRole('button', { name: 'Preview zoom: Fit' })).toBeDefined();
    });

    it('retitles the tab to the worksheet title while the dialog is open, then restores it', () => {
        // Capture the document title at the moment window.print() runs — that
        // is the title a PDF saved from the native dialog is named after.
        let titleDuringPrint = '';
        window.print = vi.fn(() => {
            titleDuringPrint = document.title;
        });
        const titleBefore = document.title;

        fireEvent.click(toolbarPrint());

        // The saved-PDF file name should be the worksheet title, not the app
        // tab title.
        expect(titleDuringPrint).toBe('Year 1 — Addition');
        // In real browsers window.print() blocks until the dialog closes, so
        // the previous tab title is restored as soon as it returns.
        expect(document.title).toBe(titleBefore);
    });

    it('a 5-page worksheet is exactly 5 A4 blocks in the print job (one page each)', () => {
        const printSpy = vi.fn();
        window.print = printSpy;

        // Bump the document to 5 sheets via the toolbar stepper, then Print.
        fireEvent.change(screen.getByTestId('page-count'), { target: { value: '5' } });
        fireEvent.click(toolbarPrint());
        expect(printSpy).toHaveBeenCalledTimes(1);

        // The hidden .print-doc tree is the ONLY thing the browser paginates
        // (app.css: .app-chrome hidden, shell un-clipped, .print-doc shown).
        // It holds exactly ONE 210×297mm A4 block per worksheet page with a
        // page break after each — so the native dialog reports 5 pages, never
        // 1. This is the regression pin for "5 pages in => 5 pages out".
        const printPages = document.querySelectorAll('.print-page');
        expect(printPages.length).toBe(5);
        // Each block carries its worksheet page; page 2 is the pinned
        // continuation row ("12 + 2 =" first, id 25 at the 24-per-page count).
        expect(printPages[1].textContent).toContain('12 + 2 =');
        expect(printPages[1].textContent).toContain('Page 2 of 5');
        // The on-screen preview (the print preview) shows the same 5 pages.
        expect(screen.getByTestId('sheet-preview-page5')).toBeDefined();
        expect(screen.queryByTestId('sheet-preview-page6')).toBeNull();
    });

    it('the print tree lives OUTSIDE .app-chrome (print media hides the shell)', () => {
        // CRITICAL placement pin: @media print hides .app-chrome WHOLESALE, so
        // the .print-doc tree MUST be a sibling/descendant-outside of that
        // shell — if a refactor ever moves it back inside the interactive
        // chrome, printing would emit NOTHING (blank pages). The framework
        // mounts the active plugin's print surface exactly there.
        const printDoc = document.querySelector('.print-doc');
        expect(printDoc).not.toBeNull();
        let cursor: Element | null = printDoc;
        let insideChrome = false;
        while (cursor) {
            if (cursor.classList?.contains('app-chrome')) {
                insideChrome = true;
                break;
            }
            cursor = cursor.parentElement;
        }
        expect(insideChrome).toBe(false);
        // (Screen invisibility (.print-doc { display: none }) comes from
        // app.css, which the jsdom test environment does not load — the
        // placement pin above is what guards the print flow end-to-end.)
    });

    it('the print tree follows the page stepper (1 page => 1 A4 block)', () => {
        // Default 1-page document: a single A4 block in the print tree.
        expect(document.querySelectorAll('.print-page').length).toBe(1);

        // Grow to 5: five blocks, one per page.
        fireEvent.change(screen.getByTestId('page-count'), { target: { value: '5' } });
        expect(document.querySelectorAll('.print-page').length).toBe(5);

        // Shrink back to 2: exactly two blocks — the dialog would show 2 pages.
        fireEvent.change(screen.getByTestId('page-count'), { target: { value: '2' } });
        expect(document.querySelectorAll('.print-page').length).toBe(2);
    });

    it('printing is blocked (button disabled) when no sheet is available', () => {
        // Year 3 is unimplemented => empty document => dimmed toolbar actions.
        fireEvent.click(gradeRadio('3'));
        const printSpy = vi.fn();
        window.print = printSpy;

        expect(toolbarPrint().getAttribute('aria-disabled')).toBe('true');
        expect(randomizeButton().getAttribute('aria-disabled')).toBe('true');

        // Even a forced click cannot start a print job for an empty document.
        fireEvent.click(toolbarPrint());
        expect(printSpy).not.toHaveBeenCalled();
    });
});
