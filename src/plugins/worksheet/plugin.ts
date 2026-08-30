// ─────────────────────────────────────────────────────────────────────────────
// WORKSHEET PLUGIN — plugin definition (the single entry point of the plugin).
//
// This plugin is FULLY self-contained: it owns its problem generators
// (generators.ts), its grade catalogue (grades.ts), its PRNG (rng.ts), its
// preview/print rendering components (WorksheetPage / WorksheetToolbar /
// WorksheetHeader / WorksheetPrint + PageStack / PrintableSheet / ZoomControl)
// and its scoped store slice. Deleting this directory (and removing the import
// in ../plugins/index.ts) removes the whole maths-exercise feature without
// affecting the dashboard host or any other plugin — nothing outside this
// folder imports anything inside it.
//
// CONTRIBUTIONS to the dashboard (via the DashboardPlugin contract in
// ../types.ts):
//   entries  : one list entry per math type — the dashboard merges these into
//              its left rail automatically (registration order = rail order;
//              filterEntries grade-gates what is actually visible).
//   header   : the grade selector pills (top-right of the header bar).
//   toolbar  : title/subtitle + Pages stepper + Randomize + Print.
//   page     : the A4 preview stack + zoom dock + empty states.
//   print    : the hidden .print-doc tree window.print() emits.
//   store    : { gradeId, pageCount, zoom, refresh } — all plugin state,
//              namespaced under this plugin's id in the shared store.
// ─────────────────────────────────────────────────────────────────────────────

import { definePlugin } from '../infrastructure';
import { WorksheetHeader } from './WorksheetHeader';
import { WorksheetToolbar } from './WorksheetToolbar';
import { WorksheetPage } from './WorksheetPage';
import { WorksheetPrint } from './WorksheetPrint';
import { getGradeConfig } from './grades';
import { MATH_TYPES, scopeLabel, type MathTypeId } from './generators';

// The plugin id doubles as its store namespace and React key prefix.
export const WORKSHEET_PLUGIN_ID = 'worksheet';

// One compact glyph per sheet type (moved verbatim from the old TypeSidebar —
// the rail BUTTON chrome is host-owned, but the GLYPHS are plugin data).
const TYPE_ICONS: Record<MathTypeId, string> = {
    addition: '+',
    subtraction: '−',
    mult: '×',
    missing: '?',
    comparison: '≟',
    skip: '»',
    word: '¶',
    counting: '#',
    doubles: '=',
    bonds: '∨',
    patterns: '↻',
    shapes: '△',
    time: '◷',
    measure: '↔',
    placevalue: '⊞',
    data: '▥',
    division: '÷',
    money: '$'
};

// Initial scoped store. Everything here is plugin-owned state: the host never
// reads it; toolbar/page components mutate it through their runtime context
// (context.store) and the dashboard re-renders on every mutation.
export const worksheetInitialStore = {
    // Grade (0 = Prep, 1..12 = Year 1..12) — drives generator caps + which
    // entries this plugin's rail slice actually offers.
    gradeId: 1,
    // A4 sheets to generate (>= 1, unbounded).
    pageCount: 1,
    // Preview zoom ('fit' | 50 | 75 | 100).
    zoom: 'fit' as 'fit' | 50 | 75 | 100,
    // Bump = "Randomize" → new seed, same page count.
    refresh: 0
};

// Entries: one per math type in catalogue order. Which entries are OFFERED for
// the currently selected grade is computed INSIDE this plugin (the rail filters
// by grade.availability) — the host stays dumb and just renders the list.
export const worksheetPlugin = definePlugin({
    id: WORKSHEET_PLUGIN_ID,
    name: 'Maths Worksheet Generator',
    entries: MATH_TYPES.map((t) => ({
        id: t.id,
        label: t.label,
        icon: TYPE_ICONS[t.id],
        ariaLabel: t.label
    })),
    initialStore: worksheetInitialStore,
    header: WorksheetHeader,
    toolbar: WorksheetToolbar,
    page: WorksheetPage,
    // Print surface: the hidden .print-doc tree window.print() emits. MUST be
    // a separate component from the page because the host mounts it OUTSIDE
    // .app-chrome (which @media print hides wholesale — see app.css).
    print: WorksheetPrint,
    // Grade-gated rail visibility (the old TypeSidebar's grade.available
    // filter, expressed through the plugin contract): only the types the
    // current grade offers are listed. Unimplemented grades (3..12) hide the
    // whole catalogue — the host shows nothing from this plugin then, and
    // its page renders the plugin's "coming soon" empty state.
    filterEntries: (store) => {
        const grade = getGradeConfig(store.gradeId ?? 1);
        if (!grade.implemented) return [];
        return MATH_TYPES.filter((t) => grade.available.includes(t.id)).map((t) => ({
            id: t.id,
            label: t.label,
            icon: TYPE_ICONS[t.id],
            ariaLabel: t.label
        }));
    },
    // Toolbar subtitle scope (e.g. "within 20") — derived from THIS plugin's
    // own slice + generators, never another plugin's data.
    scopeLabel: (entryId, store) => scopeLabel(getGradeConfig(store.gradeId ?? 1), entryId as MathTypeId)
});

// Re-exports: the plugin's internals its own tests consume. Nothing OUTSIDE
// this directory should import them (isolation contract); they are exported
// only for the plugin's test files, which live in this same directory.
export { GRADES, getGradeConfig, gradeOffers } from './grades';
export {
    MATH_TYPES,
    SHEET_COUNTS,
    SINGLE_COLUMN_TYPES,
    generateDocument,
    generateSheet,
    scopeLabel
} from './generators';
export type { MathTypeId, Problem, MathSheet, Caps } from './generators';
