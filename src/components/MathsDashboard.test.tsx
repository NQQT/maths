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
//   - page-count STEPPER (toolbar, −/n/+ is an unbounded number: type or
//     increment to 3, 4, 12... pages — generated A4 sheets are numbered
//     continuously (Year 1 addition: page 2 starts "18 + 2 =", page 3 starts
//     "2 + 15 =" — values pinned in AdditionWorksheet.test.ts);
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
import { arrayCreate, arrayEach } from '@presource/core';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MathsDashboard } from './MathsDashboard';

// Generous TEST timeout for this file: the plugin loads are chained
// macrotasks (one per plugin, see framework/loader.ts), and when the whole
// workspace test suite runs in parallel (turbo run test) the event loop can
// be starved long enough to blow past vitest's 5s default — a flake, not a
// regression. 30s per test keeps the suite deterministic under load.
vi.setConfig({ testTimeout: 30_000, hookTimeout: 30_000 });

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
    // a cold test run under full-workspace parallel load can take far longer
    // than waitFor's 1s default. 20s keeps this deterministic under load
    // (the per-test timeout is 30s — see vi.setConfig above).
    return screen.findByRole('button', { name: 'Data & Tally' }, { timeout: 20_000 });
}

describe('MathsDashboard — layout', () => {
    it('renders the app title and year-1 addition preview by default', async () => {
        // Wait for the progressive plugin load to finish before judging the
        // full rail (the first plugin — Addition — is available immediately;
        // the rest stream in one by one).
        await allVisiblePluginsLoaded();
        // App title in the header — "Math Worksheets v{package.version}"
        // (R4; __APP_VERSION__ is the vitest define read from package.json).
        expect(screen.getByText(`Math Worksheets v${__APP_VERSION__}`)).toBeDefined();
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
        // Year 1 addition, problem 1 is the switch family "4 + 16 = __ and
        // 16 + 4 = __; the sums differ by __" (see AdditionWorksheet.test.ts).
        expect(text(screen.getByTestId('sheet-preview-page1'))).toContain('1.4 + 16 =');
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
        expect(text(screen.getByTestId('sheet-preview-page1'))).toContain('1.4 + 16 =');

        // Pick Subtraction (awaited — plugins load one by one after mount).
        fireEvent.click(
            await screen.findByRole('button', { name: 'Subtraction' }, { timeout: 20_000 })
        );

        // Preview now reflects the (Year 1, Subtraction) sheet; first row is
        // the partner family "3 - 1 = __ and __ + 1 = 3".
        expect(text(screen.getByTestId('sheet-preview-page1'))).toContain('1.3 - 1 =');
        // Toolbar title updates to the new type.
        expect(screen.getByTestId('toolbar-title').textContent).toBe('Year 1 — Subtraction');
    });

    it('Word Problems switches the sheet to prose questions', async () => {
        // Awaited — plugins load one by one after the dashboard renders.
        fireEvent.click(
            await screen.findByRole('button', { name: 'Word Problems' }, { timeout: 20_000 })
        );
        const pageText = text(screen.getByTestId('sheet-preview-page1'));
        // Year 1 word, problem 1 (see WordProblemsWorksheet.test.ts).
        expect(pageText).toContain('Tom has 2 toys. Kai has 16 more toys than Tom.');
    });

    it('Grade 2 offers the Multiplication (times tables) worksheet', async () => {
        fireEvent.click(gradeRadio('2'));
        // Year 2 rail includes Multiplication (awaited — plugins load one by
        // one after the dashboard renders; the factory loads regardless of
        // grade, the gate only controls visibility).
        const multiplication = await screen.findByRole(
            'button',
            { name: 'Multiplication' },
            { timeout: 20_000 }
        );

        // Pick it; the sheet matches the pinned Grade 2 times-tables stream
        // (first row "__ × 6 = 54 and 7 × __ = 42" — the leading blank renders
        // empty, so the row text opens "× 6 = 54").
        fireEvent.click(multiplication);
        expect(screen.getByTestId('toolbar-title').textContent).toBe('Year 2 — Multiplication');
        expect(text(screen.getByTestId('sheet-preview-page1'))).toContain('1. × 6 = 54');
    });

    // Year 3 reuses the tables-to-10 plugin. plugins/MultiplicationWorksheet.test.ts
    // pins the diff-family first row "6 × 3 = __ and 6 × 1 = __; the products
    // differ by __"; PrintableSheet's empty blank must retain both spaces
    // around each removed "__", keeping the multi-part line readable.
    it('Year 3 activates Multiplication with the exact missing-factor first row', async () => {
        fireEvent.click(gradeRadio('3'));
        fireEvent.click(
            await screen.findByRole('button', { name: 'Multiplication' }, { timeout: 20_000 })
        );

        const page = screen.getByTestId('sheet-preview-page1');
        expect(screen.getByTestId('toolbar-title').textContent).toBe('Year 3 \u2014 Multiplication');
        expect(text(within(page).getByText('1.').parentElement)).toBe('1.6 × 3 =  and 6 × 1 = ; the products differ by ');
    });

    // NSWE uses the existing Compass plugin, not a second directions entry.
    // plugins/CompassWorksheet.test.ts pins this Year 3 prompt; it is currently
    // prose only, so an answer line or an inline blank would change the row DOM.
    it('Year 3 activates Compass Directions with the exact prose first row', async () => {
        fireEvent.click(gradeRadio('3'));
        fireEvent.click(
            await screen.findByRole('button', { name: 'Compass Directions' }, { timeout: 20_000 })
        );

        const page = screen.getByTestId('sheet-preview-page1');
        const row = within(page).getByText('1.').parentElement!;
        expect(screen.getByTestId('toolbar-title').textContent).toBe('Year 3 \u2014 Compass Directions');
        // The compass rose figure now prints with the row: its N/E/S/W
        // reference letters are the only figure text (the answer direction is
        // never labelled — pinned in CompassDiagram.test.tsx).
        expect(text(row)).toBe('1.You are facing West. What direction is on your left?NESW');
        // The prompt has no fill-in blank; the row's text container now
        // carries TWO element children: the compass figure root span and the
        // full-width handwritten answer line (CompassWorksheet T2V pass).
        expect(row.lastElementChild!.children.length).toBe(2);
    });
});

describe('MathsDashboard — grade selection (top-right)', () => {
    it('switches to Year 2 and reflects the bigger-number sheet', () => {
        fireEvent.click(gradeRadio('2'));
        // Year 2 addition first row is the diff family "99 + 1 = __ and
        // 97 + 2 = __; the sums differ by __" (within 100).
        expect(text(screen.getByTestId('sheet-preview-page1'))).toContain('1.99 + 1 =');
        expect(screen.getByTestId('toolbar-title').textContent).toBe('Year 2 — Addition');
    });

    it('switches to Prep (grade 0)', () => {
        fireEvent.click(gradeRadio('P'));
        // Prep addition first row is the switch family "3 + 5 = __ and 5 + 3 = __".
        expect(text(screen.getByTestId('sheet-preview-page1'))).toContain('1.3 + 5 =');
    });

    it('shows a coming-soon placeholder for an unimplemented grade (Year 7)', () => {
        // Grades 0..6 are implemented (0..2 full catalogue, 3..6 arithmetic
        // ladder plus Year 3 extensions); Year 7 has no content at all.
        fireEvent.click(gradeRadio('7'));
        // The canvas empty state announces the grade is not implemented yet.
        expect(screen.getByText(/coming soon/i)).toBeDefined();
        // Right canvas shows the empty state instead of a preview.
        expect(screen.getByTestId('empty-state')).toBeDefined();
        expect(screen.queryByTestId('sheet-preview')).toBeNull();
    });

    it('Year 3 offers its exact ten-entry rail without changing the arithmetic streams', async () => {
        // Algebra & Reasoning is the LAST Year 3 entry in plugins/index.ts
        // (the T4 cluster appends after Money). Await it before pinning the
        // whole rail: framework/loader.test.tsx covers the chained loading,
        // while plugin tests pin each entry's own grade gate.
        fireEvent.click(gradeRadio('3'));
        const rail = screen.getByRole('heading', { name: 'Math Type' }).parentElement!;
        await within(rail).findByRole('button', { name: 'Algebra & Reasoning' }, { timeout: 20_000 });
        const buttons = within(rail).getAllByRole('button');
        expect(arrayCreate(({ index }) => buttons[index]?.lastElementChild?.textContent)).toEqual([
            'Addition', 'Subtraction', 'Multiplication', 'Shape Transformations', 'Compass Directions',
            'Fractions', 'Metric Measurement', 'Statistics', 'Probability', 'Algebra & Reasoning'
        ]);

        // New spatial entries must not alter the arithmetic seeds. The exact
        // first rows remain pinned in plugins/AdditionWorksheet.test.ts and
        // plugins/SubtractionWorksheet.test.ts, including the rendered blank.
        // Year 3 is the vertical-column grade: the COLUMN-family subtraction
        // row prints a column figure whose right-aligned terms repeat the
        // operands (ColumnDiagram.tsx) — never the answer.
        const page = screen.getByTestId('sheet-preview-page1');
        expect(text(within(page).getByText('1.').parentElement)).toBe('1.152 + 212 =  and 212 + 152 = ');
        expect(screen.getByTestId('toolbar-title').textContent).toBe('Year 3 \u2014 Addition');
        fireEvent.click(
            await within(rail).findByRole('button', { name: 'Subtraction' }, { timeout: 20_000 })
        );
        expect(text(within(screen.getByTestId('sheet-preview-page1')).getByText('1.').parentElement))
            .toBe('1.Subtract, then check: 149 - 141 = ; check: 8 + 141 = 149−141');
        expect(screen.getByTestId('toolbar-title').textContent).toBe('Year 3 \u2014 Subtraction');
    });

    // Await the Year 1 catalogue BEFORE switching: every Year 3 extension is
    // then loaded, so missing later-grade buttons prove gating, not a race.
    // See plugins/index.ts and the unchanged pins in AdditionWorksheet.test.ts.
    it.each([
        { grade: '4', firstRow: '1.7123 + 1057 = ; check: 8180 - 1057 = ' },
        { grade: '5', firstRow: '1.3370 + 1240 + 10833 = ; check: 15443 - 10833 = ' },
        { grade: '6', firstRow: '1.543082 + 101316 =  and 101316 + 543082 = ' }
    ])('Year $grade offers its exact T4-expanded rail with unchanged arithmetic streams', async ({ grade, firstRow }) => {
        await allVisiblePluginsLoaded();
        fireEvent.click(gradeRadio(grade));
        const rail = screen.getByRole('heading', { name: 'Math Type' }).parentElement!;
        // Algebra & Reasoning is the LAST entry on every Year 4..6 rail.
        await within(rail).findByRole('button', { name: 'Algebra & Reasoning' }, { timeout: 20_000 });
        const buttons = within(rail).getAllByRole('button');
        expect(arrayCreate(({ index }) => buttons[index]?.lastElementChild?.textContent))
            .toEqual(grade === '4'
                ? ['Addition', 'Subtraction', 'Fractions', 'Decimals', 'Multiplication & Division',
                    'Perimeter & Area', 'Metric Measurement', 'Statistics', 'Probability', 'Algebra & Reasoning']
                : ['Addition', 'Subtraction', 'Fractions', 'Decimals', 'Percentages', 'Multiplication & Division',
                    'Perimeter & Area', 'Metric Measurement', 'Statistics', 'Probability', 'Algebra & Reasoning']);
        expect(screen.getByTestId('toolbar-title').textContent).toBe(`Year ${grade} \u2014 Addition`);
        expect(text(within(screen.getByTestId('sheet-preview-page1')).getByText('1.').parentElement))
            .toBe(firstRow);
    });

    // ShapeTransformationsWorksheet.test.ts excludes Year 2. Await Algebra &
    // Reasoning, the last Year 3 entry in plugins/index.ts, so the later rail
    // pin tests gate, not load. The host must fall back to Addition without
    // resetting the shared page count (framework/host.tsx and worksheet-kit.tsx).
    it('falls back from transformations to Year 2 Addition, preserving pages into Year 4', async () => {
        fireEvent.click(gradeRadio('3'));
        const rail = screen.getByRole('heading', { name: 'Math Type' }).parentElement!;
        fireEvent.click(
            await within(rail).findByRole('button', { name: 'Shape Transformations' }, { timeout: 20_000 })
        );
        await within(rail).findByRole('button', { name: 'Algebra & Reasoning' }, { timeout: 20_000 });
        fireEvent.change(screen.getByTestId('page-count'), { target: { value: '2' } });
        expect(screen.getByTestId('toolbar-title').textContent).toBe('Year 3 \u2014 Shape Transformations');

        fireEvent.click(gradeRadio('2'));
        await within(rail).findByRole('button', { name: 'Addition' }, { timeout: 20_000 });
        expect(within(rail).queryByRole('button', { name: 'Shape Transformations' })).toBe(null);
        expect(screen.getByTestId('toolbar-title').textContent).toBe('Year 2 \u2014 Addition');
        expect(text(within(screen.getByTestId('sheet-preview-page1')).getByText('1.').parentElement))
            .toBe('1.99 + 1 =  and 97 + 2 = ; the sums differ by ');
        expect((screen.getByTestId('page-count') as HTMLInputElement).value).toBe('2');
        expect(screen.getByTestId('sheet-preview').querySelectorAll('[data-testid^="sheet-preview-page"]').length)
            .toBe(2);
        expect(document.querySelectorAll('.print-page').length).toBe(2);

        // Year 4 must not inherit the spatial or tables entries, nor disable
        // valid arithmetic controls after fallback. AdditionWorksheet.test.ts
        // pins this multi-addend first row; both pages must still be printable.
        fireEvent.click(gradeRadio('4'));
        await within(rail).findByRole('button', { name: 'Algebra & Reasoning' }, { timeout: 20_000 });
        const buttons = within(rail).getAllByRole('button');
        expect(arrayCreate(({ index }) => buttons[index]?.lastElementChild?.textContent))
            .toEqual(['Addition', 'Subtraction', 'Fractions', 'Decimals', 'Multiplication & Division',
                'Perimeter & Area', 'Metric Measurement', 'Statistics', 'Probability', 'Algebra & Reasoning']);
        expect(screen.getByTestId('toolbar-title').textContent).toBe('Year 4 \u2014 Addition');
        expect(text(within(screen.getByTestId('sheet-preview-page1')).getByText('1.').parentElement))
            .toBe('1.7123 + 1057 = ; check: 8180 - 1057 = ');
        expect((screen.getByTestId('page-count') as HTMLInputElement).value).toBe('2');
        expect(screen.getByTestId('sheet-preview').querySelectorAll('[data-testid^="sheet-preview-page"]').length)
            .toBe(2);
        expect(document.querySelectorAll('.print-page').length).toBe(2);
        expect(randomizeButton().getAttribute('aria-disabled')).toBe(null);
        expect(toolbarPrint().getAttribute('aria-disabled')).toBe(null);
        expect(screen.getByRole('button', { name: 'Decrease pages' }).getAttribute('aria-disabled')).toBe(null);
        expect(screen.getByRole('button', { name: 'Increase pages' }).getAttribute('aria-disabled')).toBe(null);
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
        // page is now 7 connected tasks, so page 2 starts at id 8 and page 3
        // at id 15; the '18 + 2 =' row is id 9, second on page 2).
        expect(text(screen.getByTestId('sheet-preview-page1'))).toContain('1.4 + 16 =');
        expect(text(screen.getByTestId('sheet-preview-page2'))).toContain('9.18 + 2 =');
        expect(text(screen.getByTestId('sheet-preview-page3'))).toContain('17.2 + 15 =');
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
        expect(text(screen.getByTestId('sheet-preview-page1'))).toContain('1.4 + 16 =');
    });
});

describe('MathsDashboard — randomize (re-roll the seed in place)', () => {
    it('regenerates the sheet with a new seed, preserving the page count', () => {
        // Initial (refresh 0) deterministic sheet pinned in AdditionWorksheet.test.ts.
        const page1 = () => text(screen.getByTestId('sheet-preview-page1'));
        expect(page1()).toContain('1.4 + 16 =');
        expect(page1()).toContain('2.True or false: 17 + 1 = 17.');
        const before = page1();

        // Pin 4 pages first so we can prove Randomize preserves the count.
        fireEvent.change(screen.getByTestId('page-count'), { target: { value: '4' } });
        expect(screen.getByTestId('sheet-preview-page4')).toBeDefined();

        fireEvent.click(randomizeButton());

        // refresh=1 stream, pinned via the deterministic generator: page 1 now
        // opens with the bond family ("The whole is 10 and one part is 5...")
        // and continues "10 + 9 =" (neither is the row-1/row-2 of the
        // refresh=0 sheet).
        expect(page1()).toContain('1.The whole is 10 and one part is 5.');
        expect(page1()).toContain('2.10 + 9 =');
        // The document was actually regenerated, not re-rendered unchanged.
        expect(page1()).not.toBe(before);

        // A second roll lands on yet another stream (refresh=2, row 2 pinned).
        fireEvent.click(randomizeButton());
        expect(page1()).toContain('2.True or false: 11 + 6 = 19.');

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
    // The plugin snapshot pins the seeded prose/figures; this host pin guards
    // activation, five original-plus-four-choice rows and the separate native
    // print mount (plugins/ShapeTransformationsWorksheet.test.ts and
    // framework/ShapeTransformationDiagram.test.tsx own the underlying maths).
    it('Year 3 Shape Transformations keeps exact text and geometry identical across two printed pages', async () => {
        fireEvent.click(gradeRadio('3'));
        fireEvent.click(
            await screen.findByRole('button', { name: 'Shape Transformations' }, { timeout: 20_000 })
        );

        const title = 'Year 3 \u2014 Shape Transformations';
        const subtitle = 'Shape Transformations \u2014 flips & 90\u00b0 turns';
        const page = screen.getByTestId('sheet-preview-page1');
        const grid = within(page).getByText('1.').parentElement!.parentElement!;
        expect(screen.getByTestId('toolbar-title').textContent).toBe(title);
        expect(text(screen.getByTestId('toolbar-title').nextElementSibling)).toBe(subtitle);
        expect(within(page).getByRole('heading', { level: 1 }).textContent).toBe(title);
        expect(text(page.querySelector('p'))).toBe(subtitle);
        // T2V pass: every prompt now also asks "Is this a flip or a turn?"
        // (second inline blank — rendered empty, both spaces retained).
        expect(text(grid.children[0])).toBe(
            '1.Flip pentagon 4 left to right across the dashed vertical line. Which option matches?  Is this a flip or a turn? OriginalABCD'
        );
        expect(grid.children.length).toBe(5);
        expect(page.querySelectorAll('svg').length).toBe(25);
        expect(arrayCreate(({ index }) => grid.children[index]?.querySelectorAll('svg').length))
            .toEqual([5, 5, 5, 5, 5]);

        // Pin the original and candidate order independently of preview/print
        // equality: two equally wrong surfaces must not pass. These vertices
        // come from the first-sheet ShapeTransformationsWorksheet snapshot.
        const firstPolygons = grid.children[0].querySelectorAll('polygon');
        expect(arrayCreate(({ index }) => firstPolygons[index]?.getAttribute('points'))).toEqual([
            '-2,3 -2,-1 0,-3 3,-1 1,3',
            '-2,3 -2,-1 0,-3 3,-1 1,3',
            '-2,-3 -2,1 0,3 3,1 1,-3',
            '2,3 2,-1 0,-3 -3,-1 -1,3',
            '-3,-2 1,-2 3,0 1,3 -3,1'
        ]);

        // Page 2 continues ids 6..10, not a second copy of page 1. Exact row
        // arrays mirror both snapshots in ShapeTransformationsWorksheet.test.ts;
        // the empty answer span disappears from textContent, not the diagrams.
        const expectedRows = [
            [
                '1.Flip pentagon 4 left to right across the dashed vertical line. Which option matches?  Is this a flip or a turn? OriginalABCD',
                '2.Flip triangle 1 top to bottom across the dashed horizontal line. Which option matches?  Is this a flip or a turn? OriginalABCD',
                '3.Rotate L-shape 1 90\u00b0 anticlockwise (a quarter turn left) around the dot. Which option matches?  Is this a flip or a turn? OriginalABCD',
                '4.Flip pentagon 1 top to bottom across the dashed horizontal line. Which option matches?  Is this a flip or a turn? OriginalABCD',
                '5.Flip L-shape 4 top to bottom across the dashed horizontal line. Which option matches?  Is this a flip or a turn? OriginalABCD'
            ],
            [
                '6.Flip pentagon 4 top to bottom across the dashed horizontal line. Which option matches?  Is this a flip or a turn? OriginalABCD',
                '7.Rotate pentagon 2 90\u00b0 clockwise (a quarter turn right) around the dot. Which option matches?  Is this a flip or a turn? OriginalABCD',
                '8.Flip triangle 3 top to bottom across the dashed horizontal line. Which option matches?  Is this a flip or a turn? OriginalABCD',
                '9.Flip triangle 4 top to bottom across the dashed horizontal line. Which option matches?  Is this a flip or a turn? OriginalABCD',
                '10.Rotate L-shape 2 90\u00b0 clockwise (a quarter turn right) around the dot. Which option matches?  Is this a flip or a turn? OriginalABCD'
            ]
        ];
        fireEvent.change(screen.getByTestId('page-count'), { target: { value: '2' } });
        const shells = screen.getByTestId('sheet-preview').querySelectorAll('[data-testid^="sheet-preview-page"]');
        const printDoc = document.querySelector('.print-doc')!;
        const printPages = printDoc.querySelectorAll('.print-page');
        const previewSheets: Element[] = arrayCreate(({ index }) => shells[index]?.firstElementChild?.firstElementChild);
        const printSheets: Element[] = arrayCreate(({ index }) => printPages[index]?.firstElementChild);
        expect((screen.getByTestId('page-count') as HTMLInputElement).value).toBe('2');
        expect(previewSheets.length).toBe(2);
        expect(printSheets.length).toBe(2);
        arrayEach(previewSheets, ({ value: sheet, index }) => {
            const rows = sheet.children[2].children;
            expect(arrayCreate(({ index: rowIndex }) => rows[rowIndex]?.textContent)).toEqual(expectedRows[index]);
            expect(arrayCreate(({ index: rowIndex }) => rows[rowIndex]?.querySelectorAll('svg').length))
                .toEqual([5, 5, 5, 5, 5]);
        });

        // Compare worksheet roots, not PageStack's screen-only page badges.
        // Full polygon/guide markup also catches guide coordinates or dash
        // styling diverging between mounts (ShapeTransformationDiagram.test.tsx).
        function content(sheets: Element[]) {
            return arrayCreate(({ index }) => {
                const sheet = sheets[index];
                if (!sheet) return undefined;
                const polygons = sheet.querySelectorAll('polygon');
                const guides = sheet.querySelectorAll('line, circle');
                return {
                    text: text(sheet),
                    polygons: arrayCreate(({ index: polygonIndex }) => polygons[polygonIndex]?.outerHTML),
                    guides: arrayCreate(({ index: guideIndex }) => guides[guideIndex]?.outerHTML)
                };
            });
        }
        const previewContent = content(previewSheets);
        expect(content(printSheets)).toEqual(previewContent);
        const header = `${title}${subtitle}Name: Date: `;
        expect(arrayCreate(({ index }) => previewContent[index]?.text)).toEqual([
            `${header}${expectedRows[0].join('')}Math WorksheetsPage 1 of 2`,
            `${header}${expectedRows[1].join('')}Math WorksheetsPage 2 of 2`
        ]);
        expect(arrayCreate(({ index }) => previewContent[index]?.polygons.length)).toEqual([25, 25]);
        const vertical = '<line x1="0" y1="-4" x2="0" y2="4" stroke="#1a1a1a" stroke-width="0.12" stroke-dasharray="0.4 0.3"></line>';
        const horizontal = '<line x1="-4" y1="0" x2="4" y2="0" stroke="#1a1a1a" stroke-width="0.12" stroke-dasharray="0.4 0.3"></line>';
        const centre = '<circle cx="0" cy="0" r="0.2" fill="#1a1a1a"></circle>';
        expect(arrayCreate(({ index }) => previewContent[index]?.guides)).toEqual([
            [vertical, horizontal, centre, horizontal, horizontal],
            [horizontal, centre, horizontal, horizontal, centre]
        ]);

        // worksheet-kit.tsx marks the native print tree screen-hidden. It must
        // stay outside .app-chrome or print media would hide every shape page;
        // the enabled Print action must still reach window.print immediately.
        expect(printDoc.getAttribute('aria-hidden')).toBe('true');
        expect(printDoc.closest('.app-chrome')).toBe(null);
        expect(toolbarPrint().getAttribute('aria-disabled')).toBe(null);
        const printSpy = vi.fn();
        window.print = printSpy;
        fireEvent.click(toolbarPrint());
        expect(printSpy.mock.calls.length).toBe(1);
        expect(content(printSheets)).toEqual(previewContent);
    });

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
        // continuation row ("18 + 2 =" present, id 9 at the 7-per-page count).
        expect(printPages[1].textContent).toContain('18 + 2 =');
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
        // Year 7 is unimplemented => empty document => dimmed toolbar actions.
        fireEvent.click(gradeRadio('7'));
        const printSpy = vi.fn();
        window.print = printSpy;

        expect(toolbarPrint().getAttribute('aria-disabled')).toBe('true');
        expect(randomizeButton().getAttribute('aria-disabled')).toBe('true');

        // Even a forced click cannot start a print job for an empty document.
        fireEvent.click(toolbarPrint());
        expect(printSpy).not.toHaveBeenCalled();
    });
});

// ── T8: TEACHER ANSWER KEY ───────────────────────────────────────────────────
// The key is OFF by default (student-safe: answers never appear in the
// worksheet rows), and when ON it renders as SEPARATE AnswerKeySheet pages
// APPENDED after the worksheet pages — in the preview AND the print tree,
// with page labels counting every page of the job.
describe('MathsDashboard — teacher answer key', () => {
    function answersToggle() {
        return screen.getByTestId('toolbar-answers');
    }

    it('is OFF by default: no key page, and no answers on the worksheet page', () => {
        expect(answersToggle().getAttribute('aria-pressed')).toBe('false');
        expect(text(answersToggle())).toBe('Answers: Off');

        // One worksheet page only — nothing appended.
        expect(screen.queryByTestId('sheet-preview-page2')).toBeNull();
        expect(document.querySelectorAll('.print-page').length).toBe(1);
        // The worksheet page carries no key chrome and no inline answers.
        const page1 = text(screen.getByTestId('sheet-preview-page1'));
        expect(page1).not.toContain('Answer key');
        expect(page1).not.toContain('Answer:');
    });

    it('toggling ON appends a key page to preview AND print, with counted labels', () => {
        fireEvent.click(answersToggle());
        expect(answersToggle().getAttribute('aria-pressed')).toBe('true');
        expect(text(answersToggle())).toBe('Answers: On');

        // Preview: worksheet page 1 + key page 2.
        expect(screen.getByTestId('sheet-preview-page2')).toBeDefined();
        const keyPage = text(screen.getByTestId('sheet-preview-page2'));
        expect(keyPage).toContain('Answer key');
        // Year 1 addition problem 1 is "4 + 16 = __ and 16 + 4 = __; the sums
        // differ by __" with answer "20, 20, 0" (pinned in
        // AdditionWorksheet.test.ts) — the key row is "1.20, 20, 0".
        expect(keyPage).toContain('1.20, 20, 0');
        // Page labels count EVERY page of the job so sheets order correctly.
        expect(text(screen.getByTestId('sheet-preview-page1'))).toContain('Page 1 of 2');
        expect(keyPage).toContain('Page 2 of 2');

        // Print tree mirrors the preview exactly (same buildPageSpecs call).
        const printPages = document.querySelectorAll('.print-page');
        expect(printPages.length).toBe(2);
        expect(printPages[0].textContent).not.toContain('Answer key');
        expect(printPages[1].textContent).toContain('Answer key');
        expect(printPages[1].textContent).toContain('1.20');
    });

    it('toggling OFF removes the key page again (single unlabelled page)', () => {
        fireEvent.click(answersToggle());
        expect(screen.getByTestId('sheet-preview-page2')).toBeDefined();

        fireEvent.click(answersToggle());
        expect(answersToggle().getAttribute('aria-pressed')).toBe('false');
        expect(screen.queryByTestId('sheet-preview-page2')).toBeNull();
        expect(document.querySelectorAll('.print-page').length).toBe(1);
        // Single page => no "Page i of n" label (unchanged default behaviour).
        expect(text(screen.getByTestId('sheet-preview-page1'))).not.toContain('Page 1 of');
    });

    it('key pages chunk at KEY_PER_PAGE and follow the page stepper', () => {
        // 2 worksheet pages (14 problems) + 1 key page = 3 pages in the job.
        fireEvent.change(screen.getByTestId('page-count'), { target: { value: '2' } });
        fireEvent.click(answersToggle());

        const printPages = document.querySelectorAll('.print-page');
        expect(printPages.length).toBe(3);
        expect(printPages[0].textContent).toContain('Page 1 of 3');
        expect(printPages[1].textContent).toContain('Page 2 of 3');
        expect(printPages[2].textContent).toContain('Page 3 of 3');
        expect(printPages[2].textContent).toContain('Answer key');

        // Shrinking the worksheet re-chunks the key with it (1 + 1 = 2).
        fireEvent.change(screen.getByTestId('page-count'), { target: { value: '1' } });
        expect(document.querySelectorAll('.print-page').length).toBe(2);
    });
});
