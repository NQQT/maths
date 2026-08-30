// Worksheet problem generators, tuned to the researched Australian primary
// scope (ACARA F–10 Mathematics, V8-aligned since the app's Year 2 already
// uses within-100 numbers and times tables to 10):
//
//   Number & algebra  — addition & subtraction (within 20 Y1 / within 100 Y2),
//   number bonds (part-part-whole to 10 Y1, 10 & 20 Y2), missing addend,
//   doubles & near doubles (V9 AC9M2A02 / V8 number facts to 20), skip counting
//   (2s/5s/10s), times tables (Y2 to 10), division by equal sharing (Y2),
//   number patterns & repeating patterns (V9 AC9M2A01), place value (tens &
//   ones — AC9M1N02/AC9M2N02), counting & number recognition, single-step word
//   problems in familiar contexts, and Australian coins & money (V8 Y2: form
//   amounts with 5/10/20/50c coins and $ notes).
//   Measurement & time — informal measurement sense (longer/heavier/more, plus
//   uniform informal units and cm up to a metre in Y2), sequencing days of the
//   week / months / seasons (both years) and clock time to the hour & half past
//   (Y2, V8 ACMMG170 / V9 AC9M2M04).
//   Space & statistics — 2-D shape recognition & attributes (sides, corners;
//   Y2 adds hexagons and 3-D flat-face features) and tallies / picture & column
//   graphs (V8 ACMMG157-158 era, V9 AC9M1ST01/AC9M2ST01).
//
// Design notes:
// - Every generator is DETERMINISTIC given an Rng (see rng.ts). The same seed
//   always yields the same sheet, so the inline preview always matches the
//   DocumentPrint output, and tests can assert exact values.
// - All values are whole numbers >= 0. Subtraction never yields a negative
//   result (minuend >= subtrahend). Addition sums never exceed the cap.
// - `Caps` is the numeric-range contract shared with grades.ts so raising a
//   grade (e.g. Year 2 within-100) only changes the caps, not the generators.
import { createRng, type Rng } from './rng';
// Type-only import to avoid a runtime circular dependency between problems and grades.
import type { GradeConfig } from './grades';

export type MathTypeId =
    | 'counting'
    | 'comparison'
    | 'missing'
    | 'addition'
    | 'subtraction'
    | 'mult'
    | 'skip'
    | 'word'
    // Curriculum-extended types (Australian primary, see header):
    | 'doubles'
    | 'bonds'
    | 'patterns'
    | 'shapes'
    | 'time'
    | 'measure'
    | 'placevalue'
    | 'data'
    | 'division'
    | 'money';

// Numeric-range contract consumed by the generators. grades.ts supplies these
// per grade (e.g. Year 1 => within 20, Year 2 => within 100, times tables to 10).
export type Caps = {
    // Max operand value for addition/subtraction/comparison (e.g. 20).
    opCap: number;
    // Max value for counting / number-recognition items.
    numCap: number;
    // Max value inside word-problem sentences (kept small for one-line text).
    wordCap: number;
    // Max value reached by a skip-counting sequence.
    skipCap: number;
    // Enabled "count-by" intervals for skip counting (1/2/5/10).
    skipSet: readonly number[];
    // Max operand for times-tables (multiplication); products reach multCap².
    multCap: number;
    // Max base for doubles (a + a); near doubles use a + (a+1). Y1 => 10.
    doubleCap: number;
    // The part-part-whole target for number bonds (Y1 => 10; Y2 uses 10 & 20).
    bondCap: number;
    // Step sizes enabled for number/repeating patterns (Y1: 1/2/5/10, Y2 adds 3 & 4).
    patSet: readonly number[];
    // Shape names offered for the shape-recognition/attribute questions.
    shapeSet: readonly string[];
    // Max clock hour for time items (Y1 => 0 = no clocks, Y2 => 12).
    clockCap: number;
    // Max metric length in cm for measurement items (Y1 => 0 informal only, Y2 => 100).
    metricCap: number;
    // Max number represented in place-value (tens & ones) items.
    pvCap: number;
    // Upper bound for a column/picture graph count in data items.
    dataCap: number;
    // Max amount in cents for coins/money items (Y2 => 100 = $1).
    coinCap: number;
};

export type Problem = {
    // 1-based position on the sheet (assigned by generateDocument).
    id: number;
    type: MathTypeId;
    // The question text as printed. Blanks are written as "__".
    prompt: string;
    // The model answer. May be several values separated by commas.
    answer: string;
};

// A multi-page worksheet: `pages[i]` holds the problems printed on page i+1.
// Problem ids run CONTINUOUSLY across pages (page 1 = 1..count, page 2 =
// count+1..2*count, ...) so a 3-page worksheet is numbered 1..45 as a whole.
export type MathSheet = {
    pages: Problem[][];
    // Total number of problems in the document (pages.length * SHEET_COUNTS[type]).
    total: number;
};

type RawProblem = { prompt: string; answer: string };

// Sidebar catalogue: id, human label, and default problems-per-sheet.
// Order here is the left-to-top ordering used in the left sidebar. The first
// eight are the original catalogue; the rest are the curriculum extensions
// (see the file header) and are gated per grade in grades.ts.
export const MATH_TYPES: { id: MathTypeId; label: string }[] = [
    { id: 'addition', label: 'Addition' },
    { id: 'subtraction', label: 'Subtraction' },
    { id: 'mult', label: 'Multiplication' },
    { id: 'missing', label: 'Missing Number' },
    { id: 'comparison', label: 'Compare (>, <, =)' },
    { id: 'skip', label: 'Skip Counting' },
    { id: 'word', label: 'Word Problems' },
    { id: 'counting', label: 'Counting & Numbers' },
    { id: 'doubles', label: 'Doubles & Near Doubles' },
    { id: 'bonds', label: 'Number Bonds' },
    { id: 'patterns', label: 'Patterns' },
    { id: 'shapes', label: 'Shapes & Attributes' },
    { id: 'time', label: 'Time & Calendar' },
    { id: 'measure', label: 'Measurement' },
    { id: 'placevalue', label: 'Place Value' },
    { id: 'data', label: 'Data & Tally' },
    { id: 'division', label: 'Division' },
    { id: 'money', label: 'Coins & Money' }
];

// Problems per printed A4 page. Sized so the question grid — which flexes to
// fill the WHOLE page height and divides it into even 1fr rows (see
// PrintableSheet's ProblemGrid) — is comfortably dense down to the page foot:
// short two-column formats (addition/subtraction/multiplication/comparison)
// run 24 items = 12 rows; the longer formats fewer. The previous 15/10/8
// defaults left a large blank band at the bottom of every sheet.
export const SHEET_COUNTS: Record<MathTypeId, number> = {
    counting: 18,
    comparison: 24,
    missing: 16,
    addition: 24,
    subtraction: 24,
    mult: 24,
    skip: 16,
    word: 10,
    // Extension types: compact 2-column formats stay at 24; formats containing
    // prose lines (patterns/shapes/time/measure/division/money) drop to 12-18
    // so wrapped sentences never collide with the row beneath them.
    doubles: 24,
    bonds: 24,
    patterns: 16,
    shapes: 16,
    time: 16,
    measure: 12,
    placevalue: 16,
    data: 18,
    division: 12,
    money: 12
};

// Types whose questions are long prose or wrap onto a second line in a
// two-column grid. PrintableSheet renders these in a SINGLE column so every
// sentence has the full page width (word problems always were; the extension
// types below mix short items with worded ones, so they get the same layout).
export const SINGLE_COLUMN_TYPES: readonly MathTypeId[] = ['word', 'measure', 'division', 'money'];

// Kid-friendly vocabulary for word problems (no money, no time, single-step).
const NAMES = ['Sam', 'Mia', 'Leo', 'Zoe', 'Tom', 'Max', 'Rae', 'Kai'] as const;
const THINGS = ['apples', 'toys', 'stickers', 'balloons', 'cookies', 'crayons', 'flowers', 'cars'] as const;
// Singular forms of THINGS (index-aligned) for "1 star = 1 apple" phrasing.
const THINGS_SING = ['apple', 'toy', 'sticker', 'balloon', 'cookie', 'crayon', 'flower', 'car'] as const;

// Word pools for repeating-pattern items: each column is one pool; the
// generator picks a pool and 3 distinct words from it to form an
// A-B or A-B-C cycle (V9 AC9M1A01/AC9M2A01: repeating + constant-step
// patterns with missing elements).
const PATTERN_POOLS = [
    ['red', 'blue', 'green', 'yellow', 'pink', 'black', 'white', 'orange'],
    ['circle', 'square', 'triangle', 'oval', 'star', 'heart', 'diamond', 'cross'],
    ['cat', 'dog', 'fish', 'bird', 'frog', 'duck', 'pig', 'bee']
] as const;

// Shape catalogue for the shapes generator (V8-aligned 2-D + 3-D set: V9 keeps
// 3-D features for Year 3, but the app's Y2 already teaches V8-era content).
// `sides` counts STRAIGHT sides only (0 for curved-only shapes); `corners`
// is 2-D vertices; `flatFaces` is 3-D flat faces (0 for a sphere).
type ShapeDef = {
    name: string;
    sides: number;
    corners: number;
    flatFaces: number;
    curved: boolean;
    kind: '2d' | '3d';
};
const SHAPES: ShapeDef[] = [
    { name: 'circle', sides: 0, corners: 0, flatFaces: 0, curved: true, kind: '2d' },
    { name: 'oval', sides: 0, corners: 0, flatFaces: 0, curved: true, kind: '2d' },
    { name: 'triangle', sides: 3, corners: 3, flatFaces: 0, curved: false, kind: '2d' },
    { name: 'square', sides: 4, corners: 4, flatFaces: 0, curved: false, kind: '2d' },
    { name: 'rectangle', sides: 4, corners: 4, flatFaces: 0, curved: false, kind: '2d' },
    { name: 'hexagon', sides: 6, corners: 6, flatFaces: 0, curved: false, kind: '2d' },
    { name: 'cube', sides: 0, corners: 0, flatFaces: 6, curved: false, kind: '3d' },
    { name: 'prism', sides: 0, corners: 0, flatFaces: 6, curved: false, kind: '3d' },
    { name: 'pyramid', sides: 0, corners: 0, flatFaces: 4, curved: false, kind: '3d' },
    { name: 'cylinder', sides: 0, corners: 0, flatFaces: 2, curved: true, kind: '3d' },
    { name: 'cone', sides: 0, corners: 0, flatFaces: 1, curved: true, kind: '3d' },
    { name: 'sphere', sides: 0, corners: 0, flatFaces: 0, curved: true, kind: '3d' }
];
// Filter the catalogue down to the shapes the grade offers (names come from
// the grade's shapeSet); a grade with an empty set falls back to the FULL set
// so the generator can never run out of material.
function shapesFor(caps: Caps): ShapeDef[] {
    const avail = SHAPES.filter((s) => caps.shapeSet.includes(s.name));
    return avail.length >= 3 ? avail : SHAPES;
}
// "a"/"an" article for shape names (a circle, an oval).
function shapeArticle(name: string): string {
    return /^[aeiou]/i.test(name) ? 'an' : 'a';
}

// Calendar vocabulary for the time generator (V8 ACMMG168-170: days of the
// week, months and seasons in Y1; hour & half-paste clock time in Y2).
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;
const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;
// One-line calendar facts kids are expected to know (also V8 ACMMG168-169).
const TIME_FACTS: readonly [string, string][] = [
    ['How many days are in a week?', '7'],
    ['How many months are in a year?', '12'],
    ['How many days are in a year?', '365']
];

// Measurement items with reference values (V8 informal units + cm). `len` is
// length in cm, `mass` in grams, `cap` capacity in mL; 0 = not used for that
// comparison category. Only items with a non-zero value participate in a
// category's comparison pools.
type MeasureItem = { name: string; len: number; mass: number; cap: number };
const MEASURE_ITEMS: MeasureItem[] = [
    { name: 'finger', len: 5, mass: 0, cap: 0 },
    { name: 'crayon', len: 10, mass: 5, cap: 0 },
    { name: 'pencil', len: 15, mass: 10, cap: 0 },
    { name: 'notebook', len: 22, mass: 200, cap: 0 },
    { name: 'ruler', len: 30, mass: 25, cap: 0 },
    { name: 'table', len: 75, mass: 8000, cap: 0 },
    { name: 'door', len: 200, mass: 30000, cap: 0 },
    { name: 'apple', len: 0, mass: 150, cap: 0 },
    { name: 'water bottle', len: 0, mass: 500, cap: 1000 },
    { name: 'book', len: 0, mass: 600, cap: 0 },
    { name: 'cat', len: 0, mass: 4000, cap: 0 },
    { name: 'bowling ball', len: 0, mass: 6500, cap: 0 },
    { name: 'spoon', len: 0, mass: 8, cap: 15 },
    { name: 'cup', len: 0, mass: 50, cap: 250 },
    { name: 'bucket', len: 0, mass: 170, cap: 5000 },
    { name: 'tank', len: 0, mass: 0, cap: 100000 }
];
// Categories: which item field holds the value + the exact question sentence
// (capacity can't use the "Which is <word>" pattern, hence per-category text).
const MEASURE_CATEGORIES = {
    length: { field: 'len', ask: (a: string, b: string) => `Which is longer: the ${a} or the ${b}?` },
    mass: { field: 'mass', ask: (a: string, b: string) => `Which is heavier: the ${a} or the ${b}?` },
    capacity: { field: 'cap', ask: (a: string, b: string) => `Which holds more: the ${a} or the ${b}?` }
} as const;
type MeasureCategory = keyof typeof MEASURE_CATEGORIES;
// Length pairs whose values divide evenly (ratio 2..5) — used by the
// "about how many <small> long is the <big>?" informal-units questions.
type MeasurePair = { big: MeasureItem; small: MeasureItem };
const MEASURE_RATIO_PAIRS: MeasurePair[] = (() => {
    const pairs: MeasurePair[] = [];
    for (const a of MEASURE_ITEMS) {
        for (const b of MEASURE_ITEMS) {
            if (a.len === 0 || b.len === 0 || a.len <= b.len) continue;
            const r = a.len / b.len;
            if (r >= 2 && r <= 5 && a.len % b.len === 0) pairs.push({ big: a, small: b });
        }
    }
    return pairs;
})();

// Australian coin denominations (V8 Y2: form amounts to $10 with coins & notes;
// V9 moves cents to Y3, so this sheet is V8-aligned — flagged in grades.ts).
const AU_COIN_CENTS = [5, 10, 20, 50] as const;
const AU_COIN_WORDS = ['five-cent', 'ten-cent', 'twenty-cent', 'fifty-cent'] as const;
const AU_NOTE_DOLLARS = [1, 2, 5] as const;
// Format a cents amount the way a worksheet prints it: 85c or $1.50.
function formatMoney(cents: number): string {
    return cents >= 100 ? `$${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}` : `${cents}c`;
}

// ──────────────────────────────────────────────
// Per-type generators. Each returns `count` raw problems (no id yet).
// ──────────────────────────────────────────────

// Counting & number recognition: "what comes next" or "what comes before".
// Both reduce to a single integer answer and stay within numCap.
function genCounting(rng: Rng, caps: Caps, count: number): RawProblem[] {
    const out: RawProblem[] = [];
    for (let i = 0; i < count; i++) {
        if (rng.next() < 0.5) {
            // Next number: a, a+1, __  => answer a+2 (a+2 must be <= numCap)
            const a = rng.int(0, Math.max(0, caps.numCap - 2));
            out.push({ prompt: `${a}, ${a + 1}, __`, answer: `${a + 2}` });
        } else {
            // Previous number: __, a, a+1  => answer a-1 (a-1 >= 0)
            const a = rng.int(1, Math.max(1, caps.numCap - 1));
            out.push({ prompt: `__, ${a}, ${a + 1}`, answer: `${a - 1}` });
        }
    }
    return out;
}

// Comparison: fill in >, < or = between two numbers within opCap.
function genComparison(rng: Rng, caps: Caps, count: number): RawProblem[] {
    const out: RawProblem[] = [];
    for (let i = 0; i < count; i++) {
        const a = rng.int(0, caps.opCap);
        const b = rng.int(0, caps.opCap);
        const sign = a > b ? '>' : a < b ? '<' : '=';
        out.push({ prompt: `${a} __ ${b}`, answer: sign });
    }
    return out;
}

// Missing number / number bond: a + __ = c  or  __ + a = c  (c within opCap,
// the hidden addend is always >= 0 because a is chosen <= c).
function genMissing(rng: Rng, caps: Caps, count: number): RawProblem[] {
    const out: RawProblem[] = [];
    for (let i = 0; i < count; i++) {
        const c = rng.int(1, caps.opCap); // the sum
        const a = rng.int(0, c); // one known addend
        const missing = c - a; // always >= 0
        const prompt = rng.next() < 0.5 ? `${a} + __ = ${c}` : `__ + ${a} = ${c}`;
        out.push({ prompt, answer: `${missing}` });
    }
    return out;
}

// Addition within opCap. a is never the full cap and b >= 1 whenever possible,
// so we avoid the trivial "x + 0" and guarantee a + b <= opCap.
function genAddition(rng: Rng, caps: Caps, count: number): RawProblem[] {
    const out: RawProblem[] = [];
    const aMax = Math.max(1, caps.opCap - 1);
    for (let i = 0; i < count; i++) {
        const a = rng.int(1, aMax);
        const bMax = caps.opCap - a; // >= 1 because a <= opCap-1
        const b = bMax >= 1 ? rng.int(1, bMax) : 0;
        out.push({ prompt: `${a} + ${b} = __`, answer: `${a + b}` });
    }
    return out;
}

// Subtraction within opCap. b is chosen strictly below a so every answer is a
// positive whole number (no negative results, no trivial "x - x = 0").
function genSubtraction(rng: Rng, caps: Caps, count: number): RawProblem[] {
    const out: RawProblem[] = [];
    const aMax = Math.max(2, caps.opCap);
    for (let i = 0; i < count; i++) {
        const a = rng.int(2, aMax);
        const b = rng.int(0, a - 1); // b < a  =>  a - b >= 1
        out.push({ prompt: `${a} - ${b} = __`, answer: `${a - b}` });
    }
    return out;
}

// Multiplication / times tables: `a × b = __` with both operands in
// [1, multCap]. Grade 2 introduces times tables (to 10), so with its cap
// every product stays <= multCap * multCap (100) — right-sized for the grade.
function genMultiplication(rng: Rng, caps: Caps, count: number): RawProblem[] {
    const out: RawProblem[] = [];
    // Grade that doesn't offer multiplication passes multCap 0; the generator
    // is unreachable for them (generateDocument checks grade.available first).
    const cap = Math.max(1, caps.multCap);
    for (let i = 0; i < count; i++) {
        const a = rng.int(1, cap);
        const b = rng.int(1, cap);
        out.push({ prompt: `${a} × ${b} = __`, answer: `${a * b}` });
    }
    return out;
}

// Skip counting: "count on" by an interval from skipSet. We print the first
// three terms and ask for the fourth (4 x interval). If the chosen interval
// would push the 4th term past skipCap we fall back to the smallest interval,
// which is always small enough.
function genSkip(rng: Rng, caps: Caps, count: number): RawProblem[] {
    const out: RawProblem[] = [];
    const fallback = caps.skipSet.length ? Math.min(...caps.skipSet) : 1;
    for (let i = 0; i < count; i++) {
        let interval = caps.skipSet.length ? rng.pick(caps.skipSet) : 1;
        if (interval * 4 > caps.skipCap) interval = fallback;
        out.push({
            prompt: `${interval}, ${interval * 2}, ${interval * 3}, __`,
            answer: `${interval * 4}`
        });
    }
    return out;
}

// Word problems: single-step add or subtract stories in familiar contexts.
// Numbers are drawn from wordCap. Addition keeps a + b <= wordCap.
function genWord(rng: Rng, caps: Caps, count: number): RawProblem[] {
    const out: RawProblem[] = [];
    const cap = Math.max(3, caps.wordCap);
    for (let i = 0; i < count; i++) {
        const thing = rng.pick(THINGS);
        if (rng.next() < 0.5) {
            // Addition story: two children combine their things.
            const a = rng.int(1, Math.max(1, cap - 2));
            const b = rng.int(1, cap - a); // b >= 1 and a+b <= cap
            const n1 = rng.pick(NAMES);
            let n2 = rng.pick(NAMES);
            if (n2 === n1) n2 = rng.pick(NAMES.filter((n) => n !== n1));
            out.push({
                prompt: `${n1} has ${a} ${thing}. ${n2} has ${b} ${thing}. How many ${thing} are there in total?`,
                answer: `${a + b}`
            });
        } else {
            // Subtraction story: a child gives some away. a >= 2, b in [1, a-1].
            const a = rng.int(2, cap);
            const b = rng.int(1, a - 1);
            const n1 = rng.pick(NAMES);
            out.push({
                prompt: `${n1} had ${a} ${thing}. ${n1} gave ${b} ${thing} to a friend. How many ${thing} does ${n1} have left?`,
                answer: `${a - b}`
            });
        }
    }
    return out;
}

// Doubles & near doubles (V9 AC9M2A02 / V8 "number facts to 20"): three forms
// — an exact double (a + a), a near double (a + a+1), or the worded "double
// of a". `doubleCap` bounds the base a (Y1: 10, Y2: 20).
function genDoubles(rng: Rng, caps: Caps, count: number): RawProblem[] {
    const out: RawProblem[] = [];
    const cap = Math.max(2, caps.doubleCap);
    for (let i = 0; i < count; i++) {
        const r = rng.next();
        if (r < 0.4) {
            // Exact double.
            const a = rng.int(1, cap);
            out.push({ prompt: `${a} + ${a} = __`, answer: `${a * 2}` });
        } else if (r < 0.7) {
            // Near double: a + (a+1) = 2a + 1. a+1 must stay within the cap.
            const a = rng.int(1, cap - 1);
            out.push({ prompt: `${a} + ${a + 1} = __`, answer: `${a + a + 1}` });
        } else {
            // Worded doubling (the verbal form teachers drill in Y1/Y2).
            const a = rng.int(1, cap);
            out.push({ prompt: `What is double ${a}?`, answer: `${a * 2}` });
        }
    }
    return out;
}

// Number bonds / part-part-whole (V9 AC9M1N02: "to 10" in Y1; Y2 bridges
// through 10 and 20). The total is 10 when bondCap < 20, otherwise 10 or 20.
function genBonds(rng: Rng, caps: Caps, count: number): RawProblem[] {
    const out: RawProblem[] = [];
    const totals = caps.bondCap >= 20 ? [10, 20] : [Math.max(5, caps.bondCap)];
    for (let i = 0; i < count; i++) {
        const total = rng.pick(totals);
        // Both parts of a bond are NON-ZERO (1..total-1) — a "10 + __ = 10"
        // item teaches nothing and would confuse the part-part-whole idea.
        const a = rng.int(1, total - 1);
        const missing = total - a; // the hidden part, 1..total-1
        const r = rng.next();
        const prompt =
            r < 0.4 ? `${a} + __ = ${total}` : r < 0.7 ? `__ + ${a} = ${total}` : `__ and ${a} make ${total}`;
        out.push({ prompt, answer: `${missing}` });
    }
    return out;
}

// Number & repeating patterns (V9 AC9M1A01/AC9M2A01). 60% numeric: count on by
// a step from patSet, blank at the END (4 terms) or in the MIDDLE (5 terms) —
// the missing-element form is the Y2 requirement. 40% word: an A-B or A-B-C
// colour/shape/animal cycle with the 6th term blanked.
function genPatterns(rng: Rng, caps: Caps, count: number): RawProblem[] {
    const out: RawProblem[] = [];
    const steps = caps.patSet.length ? [...caps.patSet].sort((a, b) => a - b) : [1, 2, 5];
    const fallback = steps[0];
    for (let i = 0; i < count; i++) {
        if (rng.next() < 0.6) {
            // Numeric count-on pattern.
            const middle = rng.next() < 0.5;
            // span = number of steps from the first term to the blanked term.
            const span = middle ? 4 : 3;
            let step = rng.pick(steps);
            if (step * span > caps.skipCap) step = fallback;
            const start = rng.int(0, Math.max(0, caps.skipCap - span * step));
            if (middle) {
                // start, start+s, __, start+3s, start+4s  => answer start+2s
                out.push({
                    prompt: `${start}, ${start + step}, __, ${start + 3 * step}, ${start + 4 * step}`,
                    answer: `${start + 2 * step}`
                });
            } else {
                // start, start+s, start+2s, __  => answer start+3s
                out.push({
                    prompt: `${start}, ${start + step}, ${start + 2 * step}, __`,
                    answer: `${start + 3 * step}`
                });
            }
        } else {
            // Repeating word pattern: A-B or A-B-C cycle, 6th term missing.
            const pool = rng.pick(PATTERN_POOLS);
            let w1 = rng.pick(pool);
            let w2 = rng.pick(pool);
            if (w2 === w1) w2 = rng.pick(pool.filter((w) => w !== w1));
            let w3 = rng.pick(pool);
            if (w3 === w1 || w3 === w2) {
                w3 = rng.pick(pool.filter((w) => w !== w1 && w !== w2));
            }
            const cycle = rng.next() < 0.5 ? [w1, w2] : [w1, w2, w3];
            const shown = Array.from({ length: 5 }, (_, k) => cycle[k % cycle.length]);
            out.push({ prompt: `${shown.join(', ')}, __`, answer: cycle[5 % cycle.length] });
        }
    }
    return out;
}

// 2-D & 3-D shape recognition + attributes (V8 ACMMG159/174-175 era; V9 keeps
// the 2-D attribute questions for Y2 and moves 3-D features to Y3). Each
// question variant must pick from shapes the grade actually offers (shapeSet);
// if a variant's candidate pool is empty the generator degrades to the next
// simpler variant so Prep-sized shape sets still produce valid items.
function genShapes(rng: Rng, caps: Caps, count: number): RawProblem[] {
    const out: RawProblem[] = [];
    const shapes = shapesFor(caps);
    const twoD = shapes.filter((s) => s.kind === '2d');
    const threeD = shapes.filter((s) => s.kind === '3d');
    for (let i = 0; i < count; i++) {
        const r = rng.next();
        if (r < 0.25) {
            // "How many (straight) sides..." — only shapes that have them.
            const pool = twoD.filter((s) => s.sides > 0);
            const s = rng.pick(pool.length ? pool : twoD);
            out.push({ prompt: `How many sides does ${shapeArticle(s.name)} ${s.name} have?`, answer: `${s.sides}` });
        } else if (r < 0.45) {
            // "How many corners..." — circles/ovals answer 0 (curved side).
            const s = rng.pick(twoD);
            out.push({ prompt: `How many corners does ${shapeArticle(s.name)} ${s.name} have?`, answer: `${s.corners}` });
        } else if (r < 0.65 && threeD.length >= 3) {
            // "How many flat faces..." — 3-D objects only.
            const s = rng.pick(threeD);
            out.push({ prompt: `How many flat faces does ${shapeArticle(s.name)} ${s.name} have?`, answer: `${s.flatFaces}` });
        } else if (r < 0.8) {
            // Multiple-choice on 2-D corners: the answer must be UNIQUE among
            // the shown options, so distractors share no corner count with it.
            let answer = rng.pick(twoD);
            let distractors = twoD.filter((s) => s.name !== answer.name && s.corners !== answer.corners);
            if (distractors.length < 2) {
                // Deeper ambiguity (e.g. only circles+ovals offered) — fall
                // back to a plain "how many corners" line instead.
                answer = rng.pick(twoD);
                out.push({
                    prompt: `How many corners does ${shapeArticle(answer.name)} ${answer.name} have?`,
                    answer: `${answer.corners}`
                });
            } else {
                // Two distractors with different corner counts; the correct
                // shape sits at a random position in the printed list.
                const d1 = rng.pick(distractors);
                const d2 = rng.pick(distractors.filter((s) => s.name !== d1.name));
                const order = [answer, d1, d2];
                const at = rng.int(0, 2);
                const shown = [order[at], ...order.filter((s) => s !== order[at])];
                out.push({
                    prompt: `Which 2-D shape has ${answer.corners} corners? (${shown.map((s) => s.name).join(', ')})`,
                    answer: answer.name
                });
            }
        } else {
            // 3-D "only flat faces" identification — shapes with NO curved surface (cube
            // / prism / pyramid); cones & cylinders have a curved side and a
            // sphere none at all, so flatFaces>0 is the WRONG filter.
            const allFlat = threeD.filter((s) => !s.curved);
            if (threeD.length >= 3 && allFlat.length >= 1) {
                const answer = rng.pick(allFlat);
                const others = threeD.filter((s) => s.name !== answer.name);
                const d1 = rng.pick(others);
                const d2 = rng.pick(others.filter((s) => s.name !== d1.name));
                out.push({
                    prompt: `Which of these 3-D objects has only flat faces? (${[answer, d1, d2].map((s) => s.name).join(', ')})`,
                    answer: answer.name
                });
            } else {
                const curved = twoD.filter((s) => s.curved);
                const answer = rng.pick(curved.length ? curved : twoD);
                out.push({ prompt: `Does ${shapeArticle(answer.name)} ${answer.name} have a curved side?`, answer: answer.curved ? 'Yes' : 'No' });
            }
        }
    }
    return out;
}

// Time & calendar (V8 ACMMG168-170; V9 AC9M2M04). Kind pool is uniform:
// day-after/before, yesterday/tomorrow, days-until, month-after, season-after,
// calendar facts — plus clock forms (o'clock + hours-later, half-past + one
// hour later) which only appear when clockCap > 0 (i.e. Year 2).
function genTime(rng: Rng, caps: Caps, count: number): RawProblem[] {
    const out: RawProblem[] = [];
    const clock = caps.clockCap > 0;
    for (let i = 0; i < count; i++) {
        const kinds: string[] = ['after', 'before', 'yesterday', 'tomorrow', 'until', 'month', 'season', 'fact'];
        if (clock) kinds.push('clock', 'half');
        const kind = rng.pick(kinds);
        switch (kind) {
            case 'after': {
                const d = rng.pick(DAYS);
                const j = DAYS.indexOf(d);
                out.push({ prompt: `What day comes after ${d}?`, answer: DAYS[(j + 1) % 7] });
                break;
            }
            case 'before': {
                const d = rng.pick(DAYS);
                const j = DAYS.indexOf(d);
                out.push({ prompt: `What day comes before ${d}?`, answer: DAYS[(j + 6) % 7] });
                break;
            }
            case 'yesterday': {
                const d = rng.pick(DAYS);
                const j = DAYS.indexOf(d);
                out.push({ prompt: `If today is ${d}, what day was yesterday?`, answer: DAYS[(j + 6) % 7] });
                break;
            }
            case 'tomorrow': {
                const d = rng.pick(DAYS);
                const j = DAYS.indexOf(d);
                out.push({ prompt: `If today is ${d}, what day is tomorrow?`, answer: DAYS[(j + 1) % 7] });
                break;
            }
            case 'until': {
                // Start Mon-Fri, target strictly later the same week.
                const i1 = rng.int(0, 4);
                const i2 = rng.int(i1 + 1, 6);
                out.push({
                    prompt: `If today is ${DAYS[i1]}, how many days is it until ${DAYS[i2]}?`,
                    answer: `${i2 - i1}`
                });
                break;
            }
            case 'month': {
                const m = rng.int(0, 11);
                out.push({ prompt: `What month comes after ${MONTHS[m]}?`, answer: MONTHS[(m + 1) % 12] });
                break;
            }
            case 'season': {
                const s = rng.pick(SEASONS);
                const k = SEASONS.indexOf(s);
                out.push({ prompt: `What season comes after ${s}?`, answer: SEASONS[(k + 1) % 4] });
                break;
            }
            case 'fact': {
                const [prompt, answer] = rng.pick(TIME_FACTS);
                out.push({ prompt, answer });
                break;
            }
            case 'clock': {
                // O'clock now, k (1-2) hours later; answer wraps at 12.
                const h = rng.int(1, 12);
                const k = rng.int(1, 2);
                const h2 = ((h - 1 + k) % 12) + 1;
                out.push({ prompt: `It is ${h} o'clock now. What time is it ${k} ${k === 1 ? 'hour' : 'hours'} later?`, answer: `${h2} o'clock` });
                break;
            }
            default: {
                // 'half': half-past h now, one hour later (half past 12 wraps back to 1).
                const h = rng.int(1, 12);
                out.push({ prompt: `It is half past ${h} now. What time is it one hour later?`, answer: `half past ${(h % 12) + 1}` });
                break;
            }
        }
    }
    return out;
}

// Measurement sense (V8 ACMMG171-173; V9 AC9M1M01-02): compare items on
// length/mass/capacity, count how many small units make a big one (uniform
// informal units), and — Year 2 only (metricCap > 0) — compare a measured
// length to a metre.
function genMeasure(rng: Rng, caps: Caps, count: number): RawProblem[] {
    const out: RawProblem[] = [];
    const metric = caps.metricCap > 0;
    const cats: MeasureCategory[] = ['length', 'mass', 'capacity'];
    for (let i = 0; i < count; i++) {
        // Comparison items are always available; the two metric items only for
        // grades with metricCap > 0 (Year 2).
        const kinds: string[] = metric ? ['compare', 'compare', 'compare', 'ratio', 'metre'] : ['compare'];
        const kind = rng.pick(kinds);
        if (kind === 'compare') {
            const cat = rng.pick(cats);
            // `field` resolves to 'len' | 'mass' | 'cap' (numeric keys only),
            // so item comparisons below are number-vs-number.
            const field: 'len' | 'mass' | 'cap' = MEASURE_CATEGORIES[cat].field;
            const pool = MEASURE_ITEMS.filter((it) => it[field] > 0);
            const a = rng.pick(pool);
            // Pick a distinct item with a DIFFERENT value so the answer is
            // never a tie.
            let b = rng.pick(pool);
            while (b === a || b[field] === a[field]) b = rng.pick(pool);
            const bigger = a[field] > b[field] ? a : b;
            // Per-category question sentence (capacity reads "holds more", not
            // "is holds more").
            out.push({ prompt: MEASURE_CATEGORIES[cat].ask(a.name, b.name), answer: bigger.name });
        } else if (kind === 'ratio') {
            // Uniform informal units: "about how many <small> long is the <big>"
            // (only pairs with an integer ratio 2..5, precomputed at module load).
            const p = rng.pick(MEASURE_RATIO_PAIRS);
            const r = p.big.len / p.small.len;
            out.push({
                prompt: `A ${p.big.name} is about ${p.big.len} cm long. A ${p.small.name} is about ${p.small.len} cm long. About how many ${p.small.name}s long is a ${p.big.name}?`,
                answer: `${r}`
            });
        } else {
            // Year 2: compare a measured length to a metre (100 cm).
            const pool = MEASURE_ITEMS.filter((it) => it.len > 0);
            const it = rng.pick(pool);
            out.push({
                prompt: `A ${it.name} is about ${it.len} cm long. Is it longer or shorter than a metre?`,
                answer: it.len < 100 ? 'shorter' : 'longer'
            });
        }
    }
    return out;
}

// Place value (V9 AC9M1N02/AC9M2N02 partitions into tens & ones; Y1 range is
// at most 20, Y2 up to pvCap=99). Four forms: decompose a number, compose a
// number from tens/ones, "how many tens in N", "how many ones in N".
function genPlaceValue(rng: Rng, caps: Caps, count: number): RawProblem[] {
    const out: RawProblem[] = [];
    const cap = Math.max(10, caps.pvCap);
    // "1 ten" / "1 one" (singular) vs "4 tens" / "5 ones".
    const words = (t: number) => (t === 1 ? 'ten' : 'tens');
    const onesWord = (o: number) => (o === 1 ? 'one' : 'ones');
    for (let i = 0; i < count; i++) {
        const r = rng.next();
        if (r < 0.35) {
            // Decompose: N = t tens and o ones.
            const n = rng.int(10, cap);
            const t = Math.floor(n / 10);
            out.push({ prompt: `How many tens and ones make ${n}?`, answer: `${t} ${words(t)} and ${n % 10} ${onesWord(n % 10)}` });
        } else if (r < 0.6) {
            // Compose: "what number is t tens and o ones?" The ones must be a
            // DIGIT (0..9) and the total must stay within the cap, so at the
            // top tens row only trailing zeros are allowed.
            const t = rng.int(1, Math.floor(cap / 10));
            const o = rng.int(0, Math.min(9, cap - t * 10));
            out.push({ prompt: `What number is ${t} ${words(t)} and ${o} ${onesWord(o)}?`, answer: `${t * 10 + o}` });
        } else if (r < 0.8) {
            // Tens digit of N.
            const n = rng.int(10, cap);
            out.push({ prompt: `How many tens are in ${n}?`, answer: `${Math.floor(n / 10)}` });
        } else {
            // Ones digit of N (legitimately 0 for round tens like 20).
            const n = rng.int(10, cap);
            out.push({ prompt: `How many ones are in ${n}?`, answer: `${n % 10}` });
        }
    }
    return out;
}

// Data & tally (V8 ACMMG157-158 era; V9 AC9M1ST01/AC9M2ST01): count a classic
// five-tally (4 strokes + slash) in groups of five, scale a picture graph (1
// star = u things), or read the difference between two column-graph bars.
function genData(rng: Rng, caps: Caps, count: number): RawProblem[] {
    const out: RawProblem[] = [];
    const cap = Math.max(5, caps.dataCap);
    for (let i = 0; i < count; i++) {
        const r = rng.next();
        if (r < 0.45) {
            // Tally: groups of five (|||/) plus a remainder of single strokes.
            const total = rng.int(3, cap);
            const marks: string[] = [];
            const fives = Math.floor(total / 5);
            for (let f = 0; f < fives; f++) marks.push('||||/');
            const rest = total % 5;
            for (let d = 0; d < rest; d++) marks.push('|');
            out.push({ prompt: `Count the tallies: ${marks.join(' ')} — how many in all?`, answer: `${total}` });
        } else if (r < 0.75) {
            // Picture graph: each star counts for u things. Pick by index so we
            // can pair the plural (the sentence) with the singular ("1 star =
            // 1 apple") for grammatical counting language.
            const u = rng.int(1, 3);
            const k = rng.int(1, 6);
            const idx = rng.int(0, THINGS.length - 1);
            const plural = THINGS[idx];
            const singular = THINGS_SING[idx];
            const unit = u === 1 ? `1 ${singular}` : `${u} ${plural}`;
            out.push({
                prompt: `In a picture graph, 1 star = ${unit}. How many ${plural} do ${'★'.repeat(k)} show?`,
                answer: `${k * u}`
            });
        } else {
            // Column graph: each square is 1 vote; compare two bars. a >= 2 and
            // b in [1, a-1] keep the "how many more" difference strictly
            // positive (never a 0-difference trick question).
            const a = rng.int(2, Math.max(3, Math.floor(cap / 2)));
            const b = rng.int(1, a - 1);
            const squares = (n: number) => (n === 1 ? 'square' : 'squares');
            const n1 = rng.pick(NAMES);
            let n2 = rng.pick(NAMES);
            if (n2 === n1) n2 = rng.pick(NAMES.filter((n) => n !== n1));
            out.push({
                prompt: `In a column graph, each square is 1 vote. ${n1}'s bar is ${a} ${squares(a)} tall and ${n2}'s bar is ${b} ${squares(b)} tall. How many more votes did ${n1} get?`,
                answer: `${a - b}`
            });
        }
    }
    return out;
}

// Division by equal sharing & grouping (V8 Y2 multiplication/division; V9
// AC9M2N05). Three forms: the ÷ sign, a "share between friends" story, and a
// "put into groups of d" story. Divisors are >= 2 to avoid trivial x ÷ 1, and
// every dividend stays <= multCap * multCap (100 for Year 2). Only offered in
// Year 2 (generateDocument checks grade.available first).
function genDivision(rng: Rng, caps: Caps, count: number): RawProblem[] {
    const out: RawProblem[] = [];
    const cap = Math.max(2, caps.multCap);
    for (let i = 0; i < count; i++) {
        const r = rng.next();
        const d = rng.int(2, cap); // divisor / friends / group size
        const q = rng.int(1, cap); // quotient
        if (r < 0.4) {
            out.push({ prompt: `${d * q} ÷ ${d} = __`, answer: `${q}` });
        } else if (r < 0.7) {
            const thing = rng.pick(THINGS);
            const n = rng.pick(NAMES);
            out.push({
                prompt: `${n} had ${d * q} ${thing}. ${n} shared them equally between ${d} friends. How many ${thing} does each friend get?`,
                answer: `${q}`
            });
        } else {
            const thing = rng.pick(THINGS);
            out.push({
                prompt: `There are ${d * q} ${thing}. They are put into groups of ${d}. How many groups are there?`,
                answer: `${q}`
            });
        }
    }
    return out;
}

// Australian coins & money (V8 Y2: form amounts with 5c/10c/20c/50c coins and
// notes; V9 moves cents to Y3 — this sheet is V8-aligned, see grades.ts).
// Four forms: make an amount with the canonical fewest coins, total a jar of
// same-denomination coins, "how many <coin> make <amount>?", and a note +
// coin combination.
function genMoney(rng: Rng, caps: Caps, count: number): RawProblem[] {
    const out: RawProblem[] = [];
    const cap = Math.max(5, caps.coinCap);
    for (let i = 0; i < count; i++) {
        const r = rng.next();
        if (r < 0.4) {
            // Make the amount: multiples of 5c up to the cap, answered with
            // the canonical coin set (greedy 50/20/10/5 = fewest coins).
            const amount = 5 * rng.int(1, Math.floor(cap / 5));
            const coinList: string[] = [];
            let rem = amount;
            for (const c of [50, 20, 10, 5]) {
                const n = Math.floor(rem / c);
                for (let k = 0; k < n; k++) coinList.push(`${c}c`);
                rem -= n * c;
            }
            out.push({ prompt: `What coins make ${formatMoney(amount)}?`, answer: coinList.join(' + ') });
        } else if (r < 0.65) {
            // A jar of one denomination — a skip-counting-in-money task. The
            // coin count is capped at 9: "16 five-cent coins" is a fine fact
            // but a tedious count for the grade's counting fluency goal.
            const c = rng.pick(AU_COIN_CENTS);
            const word = AU_COIN_WORDS[AU_COIN_CENTS.indexOf(c)];
            const n = rng.int(1, Math.max(1, Math.min(9, Math.floor(cap / c))));
            out.push({ prompt: `A jar holds ${n} ${word} coins. How much money is in the jar?`, answer: formatMoney(n * c) });
        } else if (r < 0.85) {
            // How many of one coin make a round amount.
            const c = rng.pick(AU_COIN_CENTS);
            const word = AU_COIN_WORDS[AU_COIN_CENTS.indexOf(c)];
            const k = rng.int(1, Math.max(1, Math.min(4, Math.floor(cap / c))));
            out.push({ prompt: `How many ${word} coins make ${formatMoney(k * c)}?`, answer: `${k}` });
        } else {
            // A note plus one coin: total printed as dollars.cents.
            const note = rng.pick(AU_NOTE_DOLLARS);
            const cent = rng.pick(AU_COIN_CENTS);
            const word = AU_COIN_WORDS[AU_COIN_CENTS.indexOf(cent)];
            out.push({
                prompt: `You have one $${note} note and one ${word} coin. How much money is there in all?`,
                answer: formatMoney(note * 100 + cent)
            });
        }
    }
    return out;
}

const GENERATORS: Record<MathTypeId, (rng: Rng, caps: Caps, count: number) => RawProblem[]> = {
    addition: genAddition,
    subtraction: genSubtraction,
    mult: genMultiplication,
    counting: genCounting,
    comparison: genComparison,
    missing: genMissing,
    skip: genSkip,
    word: genWord,
    // Curriculum-extension generators (availability gated in grades.ts).
    doubles: genDoubles,
    bonds: genBonds,
    patterns: genPatterns,
    shapes: genShapes,
    time: genTime,
    measure: genMeasure,
    placevalue: genPlaceValue,
    data: genData,
    division: genDivision,
    money: genMoney
};

// Convenience for the dashboard: build the full, MULTI-PAGE problem document
// for a grade/type/seed/pageCount. GradeConfig is imported as a type only (no
// runtime circular import).
//
// Multi-page behaviour: the ENTIRE document is generated from a single RNG
// stream (one call to the type's generator for `perPage * pageCount` problems)
// and then chunked into pages of `perPage`. Because it is one continuous
// stream, page 2 is the exact continuation of page 1 — the same seed always
// yields the same document, and page 1 of a 1-page document is byte-identical
// to the old single-sheet output (which keeps the pinned sheet tests green).
export function generateDocument(grade: GradeConfig, type: MathTypeId, seed: number, pageCount: number): MathSheet {
    // Empty document signals "not implemented / not offered / bogus page
    // count" to the UI, which then shows a friendly placeholder instead of a
    // blank A4 page.
    if (!grade.implemented || !grade.available.includes(type) || pageCount < 1) {
        return { pages: [], total: 0 };
    }
    const perPage = SHEET_COUNTS[type];
    const total = perPage * pageCount;
    const rng = createRng(seed);
    const raw = GENERATORS[type](rng, grade.caps, total);
    const pages: Problem[][] = [];
    for (let p = 0; p < pageCount; p++) {
        pages.push(
            raw.slice(p * perPage, (p + 1) * perPage).map((item, i) => ({
                ...item,
                id: p * perPage + i + 1,
                type
            }))
        );
    }
    return { pages, total };
}

// Backward-compatible single-page helper: a 1-page document, flattened.
// Page-1 ids (1..count) and the RNG stream are identical to the previous
// flat implementation, so every exact-value sheet test stays green.
export function generateSheet(grade: GradeConfig, type: MathTypeId, seed: number): Problem[] {
    const doc = generateDocument(grade, type, seed, 1);
    return doc.pages[0] ?? [];
}

// Human-readable description of the numeric scope for a sheet type, used to
// build subtitles like "Addition — within 20" or "Skip Counting — count by
// 2, 5, 10". Purely presentational; derived from the grade's caps.
export function scopeLabel(grade: GradeConfig, type: MathTypeId): string {
    const c = grade.caps;
    switch (type) {
        case 'addition':
        case 'subtraction':
        case 'missing':
        case 'comparison':
            // All operand-based types share the opCap range.
            return `within ${c.opCap}`;
        case 'counting':
            // Number-recognition items stay within numCap.
            return `to ${c.numCap}`;
        case 'mult':
            // Times-tables range for the grade (Year 2 => to 10).
            return `times tables to ${c.multCap}`;
        case 'skip':
            // Which "count-by" intervals the grade enables (ascending order).
            return `count by ${[...c.skipSet].sort((a, b) => a - b).join(', ')}`;
        case 'doubles':
            // Base of the doubles (a + a); near doubles add one more.
            return `doubles to ${Math.max(2, c.doubleCap)}`;
        case 'bonds':
            // Part-part-whole targets the grade works with.
            return c.bondCap >= 20 ? 'bonds to 10 & 20' : `bonds to ${Math.max(5, c.bondCap)}`;
        case 'patterns':
            // Number-pattern steps the grade enables, ascending.
            return `steps of ${[...c.patSet].sort((a, b) => a - b).join(', ')}`;
        case 'shapes':
            // Same 2-D + 3-D recognition/attribute scope at both primary grades.
            return '2-D & 3-D shapes';
        case 'time':
            // Year 1: days/months/seasons only; Year 2 adds clock time.
            return c.clockCap > 0 ? 'time to the half hour' : 'days & months';
        case 'measure':
            // Informal units at Y1; Y2 also measures in cm up to a metre.
            return c.metricCap > 0 ? 'informal & metric units' : 'informal units';
        case 'placevalue':
            // Number range the tens/ones partitions are built from.
            return `tens & ones to ${Math.max(10, c.pvCap)}`;
        case 'data':
            return 'tallies & simple graphs';
        case 'division':
            // Sharing/grouping stays inside the grade's times-tables square.
            return `equal sharing within ${Math.max(2, c.multCap) * Math.max(2, c.multCap)}`;
        case 'money':
            // Coin amounts printed in dollars (Y2 cap 100c => "$1").
            return `coins up to $${Math.max(1, Math.round(c.coinCap / 100))}`;
        case 'word':
        default:
            // Word problems are always single-step at every grade.
            return 'one-step';
    }
}