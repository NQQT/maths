// Unit tests for the ROWS & COLUMNS worksheet plugin (the multiplication
// foundation sheet for Years 1–2).
//
// The generator is DETERMINISTIC: the whole sheet is pinned here to exact
// expected values from the same seed the framework uses (seedFrom([grade.id,
// spec.id, 0])). Answers are PRIVATE problem data — the pins pair every
// answer with its figure so a re-rolled sheet or a mismatched grid is caught.
//
// Verification: npx vitest run <this file>; if the installed Windows npm shim
// resolves the hoisted runner at the wrong depth, invoke it directly:
// node ../../node_modules/vitest/vitest.mjs run <this file>.
import { describe, it, expect } from 'vitest';
import {
    createRng, generateDocument, generateSheet, getGradeConfig, seedFrom
} from '../framework';
import { rowsColumnsSpec } from './RowsColumnsWorksheet';

const g1 = getGradeConfig(1);
const g2 = getGradeConfig(2);
const seed1 = seedFrom([1, rowsColumnsSpec.id, 0]);
const seed2 = seedFrom([2, rowsColumnsSpec.id, 0]);

function sheet(grade: ReturnType<typeof getGradeConfig>) {
    return generateSheet(rowsColumnsSpec, grade, seedFrom([grade.id, rowsColumnsSpec.id, 0]));
}

// The sheet's answers are checkable against each figure INDEPENDENTLY of the
// generator: the relational "how many rows?" / "how many columns?" forms
// (prompts open "This grid has") answer the missing DIMENSION; every other
// form answers r × c.
function expectedAnswer(problem: { prompt: string; answer: string; rowsColumns: { rows: number; cols: number } }) {
    const { rows, cols } = problem.rowsColumns;
    if (problem.prompt.includes('How many rows?')) return `${rows}`;
    if (problem.prompt.includes('How many columns?')) return `${cols}`;
    return `${rows * cols}`;
}

describe('rows & columns — declarative spec', () => {
    it('declares its sidebar entry, page size and single-column layout', () => {
        expect(rowsColumnsSpec.id).toBe('rowscolumns');
        expect(rowsColumnsSpec.label).toBe('Rows & Columns');
        expect(rowsColumnsSpec.icon).toBe('▦');
        expect(rowsColumnsSpec.perPage).toBe(6);
        expect(rowsColumnsSpec.singleColumn).toBe(true);
    });

    it('offers the counting-bridge years only (Y1 and Y2) and scopes them apart', () => {
        const offered = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
            .map((id) => getGradeConfig(id))
            .map((grade) => rowsColumnsSpec.offered(grade));
        expect(offered).toEqual([false, true, true, false, false, false, false, false, false, false, false, false, false]);
        // Year 1 stays below multiplication (repeated addition); Year 2's
        // multCap > 0 switches the scope line to the product form.
        expect(rowsColumnsSpec.scope(g1)).toBe('rows, columns & repeated addition');
        expect(rowsColumnsSpec.scope(g2)).toBe('rows, columns & multiplication');
    });
});

describe('rows & columns — Year 1 (within 20, no product form)', () => {
    it('matches the exact seeded sheet (prompts, private answers and grids)', () => {
        expect(sheet(g1)).toEqual([
            { "prompt": "This grid has 2 rows and 2 squares in all. How many columns? __", "answer": "1", "rowsColumns": { "rows": 2, "cols": 1 }, "id": 1, "type": "rowscolumns" },
            { "prompt": "This grid has 4 columns and 12 squares in all. How many rows? __", "answer": "3", "rowsColumns": { "rows": 3, "cols": 4 }, "id": 2, "type": "rowscolumns" },
            { "prompt": "This grid has 5 columns and 5 squares in all. How many rows? __", "answer": "1", "rowsColumns": { "rows": 1, "cols": 5 }, "id": 3, "type": "rowscolumns" },
            { "prompt": "A grid of 2 rows and 3 columns: 3 + 3 = __", "answer": "6", "rowsColumns": { "rows": 2, "cols": 3 }, "id": 4, "type": "rowscolumns" },
            { "prompt": "How many squares are in a grid of 1 row and 4 columns? __", "answer": "4", "rowsColumns": { "rows": 1, "cols": 4 }, "id": 5, "type": "rowscolumns" },
            { "prompt": "How many squares are in a grid of 1 row and 3 columns? __", "answer": "3", "rowsColumns": { "rows": 1, "cols": 3 }, "id": 6, "type": "rowscolumns" }
        ]);
        // Every printed answer agrees with its grid (independent check — the
        // pins above could drift if a figure were changed under a prompt).
        expect(sheet(g1).map(expectedAnswer)).toEqual(
            sheet(g1).map(({ answer }) => answer)
        );
    });

    it('continues one seeded stream across pages with stable earlier pages', () => {
        const doc = generateDocument(rowsColumnsSpec, g1, seed1, 2);
        expect(doc.total).toBe(12);
        expect(doc.pages.map((page) => page.length)).toEqual([6, 6]);
        // Page 1 of a 2-page run is byte-identical to the single-page sheet.
        expect(doc.pages[0]).toEqual(sheet(g1));
        expect(doc.pages[1]).toEqual([
            { "prompt": "How many squares are in a grid of 4 rows and 5 columns? __", "answer": "20", "rowsColumns": { "rows": 4, "cols": 5 }, "id": 7, "type": "rowscolumns" },
            { "prompt": "How many squares are in a grid of 3 rows and 1 column? __", "answer": "3", "rowsColumns": { "rows": 3, "cols": 1 }, "id": 8, "type": "rowscolumns" },
            { "prompt": "How many squares are in a grid of 3 rows and 3 columns? __", "answer": "9", "rowsColumns": { "rows": 3, "cols": 3 }, "id": 9, "type": "rowscolumns" },
            { "prompt": "This grid has 2 rows and 8 squares in all. How many columns? __", "answer": "4", "rowsColumns": { "rows": 2, "cols": 4 }, "id": 10, "type": "rowscolumns" },
            { "prompt": "How many squares are in a grid of 3 rows and 5 columns? __", "answer": "15", "rowsColumns": { "rows": 3, "cols": 5 }, "id": 11, "type": "rowscolumns" },
            { "prompt": "A grid of 3 rows and 5 columns: 5 + 5 + 5 = __", "answer": "15", "rowsColumns": { "rows": 3, "cols": 5 }, "id": 12, "type": "rowscolumns" }
        ]);
        expect(doc.pages.flat().map((problem) => problem.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // Adding a third page must not re-roll the first two (document.ts
        // promises one continuous stream, not just a unique prefix).
        expect(generateDocument(rowsColumnsSpec, g1, seed1, 3).pages.slice(0, 2)).toEqual(doc.pages);
        expect(generateSheet(rowsColumnsSpec, g1, seed1)).toEqual(sheet(g1));
    });

    it('deals all 72 distinct Year-1 questions before repeating', () => {
        // Bank = 4×5 count forms (minus 1×1) + 4×5 missing-row forms (minus
        // 1×1) + 4×5 missing-column forms (minus 1×1) + 3×5 repeated-
        // addition forms (rows ≥ 2); Y1 has no product form (multCap 0).
        // 72 < 80, so the 80th question repeats.
        const problems = rowsColumnsSpec.generate(createRng(seed1), g1.caps, 80);
        expect(problems.length).toBe(80);
        expect(new Set(problems.slice(0, 72).map((problem) => problem.prompt)).size).toBe(72);
        expect(new Set(problems.map((problem) => problem.prompt)).size).toBe(72);
        // Every relational form answers its OWN missing dimension: the
        // "How many rows?" form's answer is the figure's row count, the
        // "How many columns?" form's answer is the figure's column count.
        expect(problems
            .filter((problem) => problem.prompt.includes('How many rows?'))
            .every((problem) => problem.answer === `${problem.rowsColumns!.rows}`)
        ).toBe(true);
        expect(problems
            .filter((problem) => problem.prompt.includes('How many columns?'))
            .every((problem) => problem.answer === `${problem.rowsColumns!.cols}`)
        ).toBe(true);
        // Grids stay modest: at most 4 rows × 5 columns, totals inside 20.
        expect(problems.map((problem) => problem.rowsColumns!.rows * problem.rowsColumns!.cols).every((total) => total <= 20)).toBe(true);
        expect(problems.map((problem) => problem.rowsColumns!.rows).every((rows) => rows <= 4)).toBe(true);
    });

    it('pins a refreshed seed and the zero-count guard', () => {
        const refreshed = generateSheet(rowsColumnsSpec, g1, seedFrom([1, rowsColumnsSpec.id, 1]));
        expect(refreshed).toEqual([
            { "prompt": "This grid has 3 columns and 9 squares in all. How many rows? __", "answer": "3", "rowsColumns": { "rows": 3, "cols": 3 }, "id": 1, "type": "rowscolumns" },
            { "prompt": "This grid has 2 columns and 4 squares in all. How many rows? __", "answer": "2", "rowsColumns": { "rows": 2, "cols": 2 }, "id": 2, "type": "rowscolumns" },
            { "prompt": "This grid has 2 rows and 4 squares in all. How many columns? __", "answer": "2", "rowsColumns": { "rows": 2, "cols": 2 }, "id": 3, "type": "rowscolumns" },
            { "prompt": "How many squares are in a grid of 1 row and 3 columns? __", "answer": "3", "rowsColumns": { "rows": 1, "cols": 3 }, "id": 4, "type": "rowscolumns" },
            { "prompt": "This grid has 2 rows and 6 squares in all. How many columns? __", "answer": "3", "rowsColumns": { "rows": 2, "cols": 3 }, "id": 5, "type": "rowscolumns" },
            { "prompt": "A grid of 4 rows and 5 columns: 5 + 5 + 5 + 5 = __", "answer": "20", "rowsColumns": { "rows": 4, "cols": 5 }, "id": 6, "type": "rowscolumns" }
        ]);
        expect(refreshed).not.toEqual(sheet(g1));
        expect(rowsColumnsSpec.generate(createRng(seed1), g1.caps, 0)).toEqual([]);
        // Unoffered grades (Prep, Year 3+) build empty documents.
        for (const id of [0, 3, 7]) {
            expect(generateDocument(rowsColumnsSpec, getGradeConfig(id), seed1, 1)).toEqual({ pages: [], total: 0 });
        }
    });
});

describe('rows & columns — Year 2 (5 × 5 grids + the multiplication bridge)', () => {
    it('matches the exact seeded sheet including product and repeated forms', () => {
        expect(sheet(g2)).toEqual([
            { "prompt": "This grid has 2 rows and 10 squares in all. How many columns? __", "answer": "5", "rowsColumns": { "rows": 2, "cols": 5 }, "id": 1, "type": "rowscolumns" },
            { "prompt": "This grid has 2 rows and 2 squares in all. How many columns? __", "answer": "1", "rowsColumns": { "rows": 2, "cols": 1 }, "id": 2, "type": "rowscolumns" },
            { "prompt": "How many squares are in a grid of 4 rows and 4 columns? __", "answer": "16", "rowsColumns": { "rows": 4, "cols": 4 }, "id": 3, "type": "rowscolumns" },
            { "prompt": "This grid has 2 columns and 8 squares in all. How many rows? __", "answer": "4", "rowsColumns": { "rows": 4, "cols": 2 }, "id": 4, "type": "rowscolumns" },
            { "prompt": "2 × 3 = __", "answer": "6", "rowsColumns": { "rows": 2, "cols": 3 }, "id": 5, "type": "rowscolumns" },
            { "prompt": "This grid has 5 rows and 20 squares in all. How many columns? __", "answer": "4", "rowsColumns": { "rows": 5, "cols": 4 }, "id": 6, "type": "rowscolumns" }
        ]);
        expect(sheet(g2).map(expectedAnswer)).toEqual(sheet(g2).map(({ answer }) => answer));
    });

    it('deals all 116 distinct Year-2 questions before repeating, inside the 10 operand table', () => {
        // Bank = 24 + 24 + 24 (count / missing-row / missing-column, 5×5
        // minus 1×1) + 20 repeated (rows ≥ 2) + 24 product (cols ≤ multCap
        // 10, always true) = 116. A 9×9-style grid is impossible: cols never
        // exceed 5.
        const problems = rowsColumnsSpec.generate(createRng(seed2), g2.caps, 120);
        expect(problems.length).toBe(120);
        expect(new Set(problems.slice(0, 116).map((problem) => problem.prompt)).size).toBe(116);
        expect(new Set(problems.map((problem) => problem.prompt)).size).toBe(116);
        expect(problems.map((problem) => problem.rowsColumns!.cols).every((cols) => cols <= 5)).toBe(true);
        expect(problems.map((problem) => problem.rowsColumns!.rows).every((rows) => rows <= 5)).toBe(true);
        // The bridge form prints simple products only (operands ≤ 10, the
        // grade's times-tables scope).
        expect(problems
            .filter((problem) => problem.prompt.includes('×'))
            .map((problem) => problem.rowsColumns!.rows * problem.rowsColumns!.cols)
            .every((total) => total <= 100)).toBe(true);
    });

    it('continues page 2 from the same seeded stream', () => {
        const doc = generateDocument(rowsColumnsSpec, g2, seed2, 2);
        expect(doc.total).toBe(12);
        expect(doc.pages[0]).toEqual(sheet(g2));
        expect(doc.pages[1].slice(0, 3)).toEqual([
            { "prompt": "A grid of 5 rows and 5 columns: 5 + 5 + 5 + 5 + 5 = __", "answer": "25", "rowsColumns": { "rows": 5, "cols": 5 }, "id": 7, "type": "rowscolumns" },
            { "prompt": "3 × 2 = __", "answer": "6", "rowsColumns": { "rows": 3, "cols": 2 }, "id": 8, "type": "rowscolumns" },
            { "prompt": "5 × 1 = __", "answer": "5", "rowsColumns": { "rows": 5, "cols": 1 }, "id": 9, "type": "rowscolumns" }
        ]);
    });
});
