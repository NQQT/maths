// ROWS & COLUMNS WORKSHEET — a self-contained Year-1/2 counting worksheet that
// builds the FOUNDATION OF MULTIPLICATION: students count the rows, the
// columns and the total number of squares in a drawn grid, then bridge from
// repeated addition (Year 1) to simple products r × c (Year 2).
//
// Like every plugin it lives in ONE file (see plugins/index.ts): the generator
// calculates all prompts/answers, framework/RowsColumnsDiagram.tsx only draws
// the supplied r × c square lattice in preview AND print, and answers stay
// private problem data exactly as the clock's and shape answers do.
//
// Fully self-contained: deleting this file and its line in plugins/index.ts
// removes the Rows & Columns worksheet without affecting the framework or any
// other plugin.
import { arrayCreate, arrayEach } from '@presource/core';
import {
    createDeck, sampleUnique,
    type Caps, type DashboardFramework, type DashboardPlugin, type RawProblem, type RowsColumnsFigure,
    type Rng, type WorksheetSpec
} from '../framework';

// Five fixed question forms over one modest grid space. The two RELATIONAL
// forms (`rows` / `columns`) ask for a missing dimension with the OTHER
// dimension + total given — a straightforward "How many rows?"/"How many
// columns?" exercise (not only relational missing-factor wording). The
// product form is the multiplication bridge and is only offered where the
// grade has a multCap (Year 2 => 10; Year 1 => 0, so repeated addition stays
// there).
type GridKind = 'count' | 'rows' | 'columns' | 'repeated' | 'product';

// Five columns keeps every printed grid within 80px wide (16px per 12-unit
// cell in RowsColumnsDiagram.tsx) while a single-column six-question page
// still fits a fixed A4 sheet. The MAX ROWS derive from the EXISTING dataCap
// (no new caps): Y1 (dataCap 20) => floor(20 / 5) = 4 rows (max grid 4 × 5 =
// 20 squares, inside its within-20 number scope); Y2 (dataCap 40) => 5 rows.
const MAX_COLS = 5;
function maxRows(caps: Caps): number {
    return Math.min(5, Math.floor(caps.dataCap / MAX_COLS));
}

// Grammatical "rows"/"columns" phrasing for the printed prompts.
const unit = (count: number, word: string) => (count === 1 ? `1 ${word}` : `${count} ${word}s`);

// One question for a fixed (kind, rows, cols) grid. The prompt text carries
// enough numbers to stay DISTINCT per grid (the sampling key is the printed
// prompt) while the ANSWER stays in the problem data: no form prints its own
// answer inside the prompt, and the figure prints dimensions only.
function makeQuestion(kind: GridKind, rows: number, cols: number): RawProblem {
    const rowsText = unit(rows, 'row');
    const colsText = unit(cols, 'column');
    switch (kind) {
        case 'count':
            // Read the dimensions off the grid, write the TOTAL (the exact
            // skill multiplication replaces later).
            return {
                prompt: `How many squares are in a grid of ${rowsText} and ${colsText}? __`,
                answer: `${rows * cols}`,
                rowsColumns: { rows, cols }
            };
        case 'rows':
            // The total is GIVEN with the column count: the student works the
            // missing dimension back — the "How many rows?" twin of 'columns'
            // (a first relational step, V8 Y1/2).
            return {
                prompt: `This grid has ${colsText} and ${rows * cols} squares in all. How many rows? __`,
                answer: `${rows}`,
                rowsColumns: { rows, cols }
            };
        case 'columns':
            // The total is GIVEN with the row count: the student works the
            // missing dimension back (a first relational step, V8 Y1/2).
            return {
                prompt: `This grid has ${rowsText} and ${rows * cols} squares in all. How many columns? __`,
                answer: `${cols}`,
                rowsColumns: { rows, cols }
            };
        case 'repeated':
            // The REPEATED-ADDITION bridge: rows equal addends of `cols`
            // written out in full (3 + 3 + 3 = __ for 3 rows of 3 columns).
            const sum = arrayCreate(({ index }) => (index < rows ? cols : undefined)).join(' + ');
            return {
                prompt: `A grid of ${rowsText} and ${colsText}: ${sum} = __`,
                answer: `${rows * cols}`,
                rowsColumns: { rows, cols }
            };
        case 'product':
            // The simple multiplication form (Year 2 only — its multCap gate
            // keeps the operands inside the times-tables scope).
            return {
                prompt: `${rows} × ${cols} = __`,
                answer: `${rows * cols}`,
                rowsColumns: { rows, cols }
            };
    }
}

// Build the FINITE question bank for the grade: every (kind, rows, cols)
// combination, fixed order (kinds outer, then rows, then columns) so a deck
// over it is fully reproducible from the document seed. `repeated` needs at
// least two rows — a single row writes no sum — and `product` only exists
// when the grade's multCap is positive (Year 2 / Year 3; never Y1's zero).
function buildBank(caps: Caps): RawProblem[] {
    const rows = maxRows(caps);
    // kind order is part of the bank's identity (deck deals are reproducible
    // from it); the product form extends the list only where multCap > 0.
    // 'rows' and 'columns' are the two relational missing-dimension forms.
    const kinds: GridKind[] = ['count', 'rows', 'columns', 'repeated', ...(caps.multCap > 0 ? (['product'] as GridKind[]) : [])];
    const bank: RawProblem[] = [];
    arrayEach(kinds, ({ value: kind }) => {
        arrayEach(arrayCreate(({ index }) => (index < rows ? index + 1 : undefined)), ({ value: r }) => {
            // A single row has nothing to repeat: the repeated-addition form
            // starts at two rows.
            if (kind === 'repeated' && r < 2) return;
            arrayEach(arrayCreate(({ index }) => (index < MAX_COLS ? index + 1 : undefined)), ({ value: c }) => {
                // A 1 × 1 grid is a single square — too trivial to count by rows.
                if (r === 1 && c === 1) return;
                // Products stay inside the grade's times-tables operands.
                if (kind === 'product' && c > caps.multCap) return;
                bank.push(makeQuestion(kind, r, c));
            });
        });
    });
    return bank;
}

// Deal the bank through a SEEDed deck (createDeck): every distinct question
// prints once per cycle, repeats stay evenly spread across later cycles, and
// the same seed always yields the same document (worksheet-kit.tsx). The
// first pass is unique-keyed (prompts are bank-distinct, so nothing is
// discarded), then the SAME deck continues directly after exhaustion — no
// cycle-boundary repeats (the ShapeTransformationsWorksheet pattern).
function generateRowsColumns(rng: Rng, caps: Caps, count: number): RawProblem[] {
    const bank = buildBank(caps);
    if (count <= 0 || bank.length === 0) return [];
    const questions = createDeck(rng, bank);
    const firstPass = sampleUnique(Math.min(count, bank.length), () => questions.take(), (problem) => problem.prompt);
    return [...firstPass, ...arrayCreate(({ index }) => (index < count - firstPass.length ? questions.take() : undefined))];
}

// The plugin's declarative spec (exported for its own tests and pins.ts).
export const rowsColumnsSpec: WorksheetSpec = {
    id: 'rowscolumns',
    label: 'Rows & Columns',
    icon: '▦',
    // Six illustrated single-column items: prose + 80px-max grid fits a
    // fixed A4 page the way the six shape rows do (PrintableSheet.tsx).
    perPage: 6,
    singleColumn: true,
    offered: (grade) => grade.available.includes('rowscolumns'),
    // Year 1 bridges counting → repeated addition; Year 2 extends the bridge
    // to the r × c product (its multCap > 0 is the grade signal).
    scope: (grade) => (grade.caps.multCap > 0 ? 'rows, columns & multiplication' : 'rows, columns & repeated addition'),
    generate: generateRowsColumns
};

// The plugin: a function the dashboard calls with its framework bundle.
export function RowsColumnsWorksheet(dashboard: DashboardFramework): DashboardPlugin {
    return dashboard.createWorksheet(rowsColumnsSpec);
}

// Exported for the plugin's unit tests (the figure type itself is the
// framework's; RowsColumnsFigure is re-listed for test convenience).
export type { RowsColumnsFigure };
