// ─────────────────────────────────────────────────────────────────────────────
// FRAMEWORK — grade catalogue (the dashboard's maths configuration).
//
// Part of the DASHBOARD FRAMEWORK, not of any worksheet plugin: the grades
// define the numeric caps every plugin's generator consumes and which
// worksheet ids each grade offers (`available`). Plugins read this
// configuration through the DashboardFramework they receive at load time.
//
// Grades run 0..12 where 0 = Prep and 1..12 = Year 1..12 (AU/UK labelling).
// Prep, Year 1 and Year 2 have real content (the app targets the Australian
// primary scope, ACARA F-10, V8-era: Y1 within 20, Y2 within 100 + times
// tables to 10 + coins). Grades 3..6 continue with the ARITHMETIC LADDER:
// Addition + Subtraction, scaling one digit per year (within 1 000 →
// 1 000 000, multi-term questions from Year 4). Grades 7..12 render a
// "coming soon" placeholder — addition and subtraction (like every other
// type) are finished by Year 6.
//
// `caps` drives the worksheet generators — see the per-cap comments.
// `available` lists the worksheet plugin ids (plugins/AdditionWorksheet.ts
// etc.) the grade's rail offers; an unimplemented grade offers nothing.
// ─────────────────────────────────────────────────────────────────────────────

export type GradeId = number;

export type GradeConfig = {
    id: GradeId;
    // Short pill label shown in the top-right grade selector (P, 1..12).
    short: string;
    // Full label used in titles ("Prep", "Year 1", ...).
    label: string;
    // Whether any sheet content is implemented for this grade at all.
    implemented: boolean;
    // Which worksheet plugin ids are selectable in the left sidebar for this grade.
    available: string[];
    // Numeric range caps consumed by the problem generators.
    caps: {
        // Max operand value for addition/subtraction/comparison (grade 1 => 20).
        // For the grades 3..6 arithmetic ladder this IS the difficulty dial:
        // 10 (P) → 20 (Y1) → 100 (Y2) → 1 000 (Y3) → ... → 1 000 000 (Y6).
        opCap: number;
        // Max number of terms in ONE +/- ladder question (2 = classic pairs;
        // 3+ enables multi-addend addition AND multi-subtrahend subtraction
        // from Year 4 upwards — see both ladder plugins).
        addendCap: number;
        // Max value for counting / number-recognition items
        numCap: number;
        // Max value inside word-problem sentences (kept small for one-line text)
        wordCap: number;
        // Max value reached by skip-counting sequences (also bounds patterns)
        skipCap: number;
        // Which skip intervals (count-by) are enabled for the grade
        skipSet: readonly number[];
        // Max operand for times-tables (grade 2 => 10, products to 100); bounds division
        multCap: number;
        // Max base `a` for doubles questions (a + a / a + a+1)
        doubleCap: number;
        // Part-part-whole target for number bonds (10; >= 20 enables 10 & 20)
        bondCap: number;
        // Step sizes for number patterns (repeating patterns are word-based, no cap)
        patSet: readonly number[];
        // Shape names offered to the shapes generator (2-D + 3-D)
        shapeSet: readonly string[];
        // Max clock hour (0 => Y1 has no clock items; 12 => Y2 hour & half-past)
        clockCap: number;
        // Max length in cm (0 => informal units only; 100 => Y2 cm + metre)
        metricCap: number;
        // Max number for place-value (tens & ones) items
        pvCap: number;
        // Max count for tally / picture-graph / column-graph items
        dataCap: number;
        // Max amount in cents for coins/money items (0 => no money items)
        coinCap: number;
    };
};

// The generator-facing slice of a grade config (consumed by plugin generators).
export type Caps = GradeConfig['caps'];

// Grade 0 (Prep) through 2 are fully covered; Grade 2 extends the same
// generators to bigger numbers (within 100). Grades 3..6 offer the arithmetic
// ladder only; grades 7..12 are listed so the selector is complete but
// flagged `implemented: false`.
//
// Shape sets per grade (V8-aligned 2-D + 3-D recognition): Year 1 knows the
// everyday set (circles, ovals, triangles, quadrilaterals + cube/cylinder/
// sphere); Year 2 adds hexagons, prisms, pyramids and cones.
const Y1_SHAPES = ['circle', 'oval', 'triangle', 'square', 'rectangle', 'cube', 'cylinder', 'sphere'];
const Y2_SHAPES = [...Y1_SHAPES, 'hexagon', 'prism', 'pyramid', 'cone'];

// Grades 7..12 share the same "no content yet" shape — a helper keeps the
// config list readable without repeating the zero-cap block six times.
const unimplementedGrade = (id: number): GradeConfig => ({
    id,
    short: String(id),
    label: `Year ${id}`,
    implemented: false,
    available: [],
    caps: {
        opCap: 0,
        addendCap: 0,
        numCap: 0,
        wordCap: 0,
        skipCap: 0,
        skipSet: [],
        multCap: 0,
        doubleCap: 0,
        bondCap: 0,
        patSet: [],
        shapeSet: [],
        clockCap: 0,
        metricCap: 0,
        pvCap: 0,
        dataCap: 0,
        coinCap: 0
    }
});

// Grades 3..6 — the ARITHMETIC LADDER. Only Addition + Subtraction are
// offered; the operand cap scales one digit per year (Y3 = within 1 000 ...
// Y6 = within 1 000 000) and multi-term questions join from Year 4 (3 terms
// in addition / 2 subtrahends in subtraction) and Year 6 (4 addends /
// 3 subtrahends) — see plugins/AdditionWorksheet.ts and
// plugins/SubtractionWorksheet.ts. Every other cap stays zeroed: no other
// worksheet type is offered for these grades, and a zero cap would keep an
// accidental gate change from producing content.
const arithmeticLadderGrade = (id: number): GradeConfig => ({
    id,
    short: String(id),
    label: `Year ${id}`,
    implemented: true,
    available: ['addition', 'subtraction'],
    caps: {
        // One more digit each year: 10^3 (Y3) ... 10^6 (Y6).
        opCap: 10 ** id,
        // Pairs through Year 3; 3 terms from Year 4; 4 terms in Year 6.
        addendCap: id >= 6 ? 4 : id >= 4 ? 3 : 2,
        numCap: 0,
        wordCap: 0,
        skipCap: 0,
        skipSet: [],
        multCap: 0,
        doubleCap: 0,
        bondCap: 0,
        patSet: [],
        shapeSet: [],
        clockCap: 0,
        metricCap: 0,
        pvCap: 0,
        dataCap: 0,
        coinCap: 0
    }
});

const CONFIGS: GradeConfig[] = [
    {
        id: 0,
        short: 'P',
        label: 'Prep',
        implemented: true,
        available: ['counting', 'comparison', 'addition', 'subtraction'],
        caps: {
            opCap: 10,
            // Prep practices classic pairs only (within 10).
            addendCap: 2,
            numCap: 10,
            wordCap: 10,
            skipCap: 50,
            skipSet: [10],
            multCap: 0,
            // Prep keeps the original narrow scope: the extension types are
            // not offered (zero/empty caps would be harmless anyway).
            doubleCap: 10,
            bondCap: 10,
            patSet: [],
            shapeSet: [],
            clockCap: 0,
            metricCap: 0,
            pvCap: 10,
            dataCap: 10,
            coinCap: 0
        },
    },
    {
        id: 1,
        short: '1',
        label: 'Year 1',
        implemented: true,
        // Year 1 gets the full extension catalogue (within 20): number bonds to
        // 10, doubles to 10, patterns (steps 1/2/5/10), 2-D & 3-D shapes,
        // days/months/seasons (no clocks), informal measurement (no cm),
        // tens & ones to 20, tallies/picture & column graphs.
        available: [
            'counting',
            'comparison',
            'missing',
            'addition',
            'subtraction',
            'skip',
            'word',
            'doubles',
            'bonds',
            'patterns',
            'shapes',
            'time',
            'measure',
            'placevalue',
            'data'
        ],
        caps: {
            opCap: 20,
            addendCap: 2,
            numCap: 20,
            wordCap: 20,
            skipCap: 50,
            skipSet: [2, 5, 10],
            multCap: 0,
            doubleCap: 10,
            bondCap: 10,
            patSet: [1, 2, 5, 10],
            shapeSet: Y1_SHAPES,
            clockCap: 0,
            metricCap: 0,
            pvCap: 20,
            dataCap: 20,
            coinCap: 0
        },
    },
    {
        id: 2,
        short: '2',
        label: 'Year 2',
        implemented: true,
        // Year 2 adds times tables (mult, operands to 10 = products to 100),
        // division by equal sharing (bound by multCap), Australian coins &
        // money (V8 Y2: 5/10/20/50c coins + notes, amounts to about $1+),
        // clock time to the hour & half-past (V8 ACMMG170), cm measurement up
        // to a metre, bonds to 10 & 20, doubles to 20, patterns with 3s & 4s
        // steps, hexagons & extra 3-D shapes, tens & ones to 99, and bigger
        // data counts.
        available: [
            'counting',
            'comparison',
            'missing',
            'addition',
            'subtraction',
            'mult',
            'skip',
            'word',
            'doubles',
            'bonds',
            'patterns',
            'shapes',
            'time',
            'measure',
            'placevalue',
            'data',
            'division',
            'money'
        ],
        caps: {
            opCap: 100,
            // Two-digit pairs; multi-addend column work starts in Year 4.
            addendCap: 2,
            numCap: 100,
            wordCap: 30,
            skipCap: 100,
            skipSet: [2, 5, 10],
            multCap: 10,
            doubleCap: 20,
            bondCap: 20,
            patSet: [1, 2, 3, 4, 5, 10],
            shapeSet: Y2_SHAPES,
            clockCap: 12,
            metricCap: 100,
            pvCap: 99,
            dataCap: 40,
            coinCap: 100
        },
    },
    // Grades 3..6 — the arithmetic ladder (only Addition + Subtraction).
    ...[3, 4, 5, 6].map(arithmeticLadderGrade),
    // Grades 7..12 — selector entries only; no content generated yet
    // (addition and subtraction, like every other type, are finished by
    // Year 6).
    ...[7, 8, 9, 10, 11, 12].map(unimplementedGrade)
];

export const GRADES: readonly GradeConfig[] = CONFIGS;

// Look up a grade config by id. Falls back to grade 1 for unknown ids so a bad
// selection can never crash the dashboard.
export function getGradeConfig(id: number): GradeConfig {
    return CONFIGS.find((g) => g.id === id) ?? CONFIGS[1];
}
