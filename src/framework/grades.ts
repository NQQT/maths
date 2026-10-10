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
// tables to 10 + coins). Grades 3..6 run the ARITHMETIC LADDER (Addition +
// Subtraction scaling one digit per year, within 1 000 → 1 000 000,
// multi-term questions from Year 4) PLUS the T4 UPPER-PRIMARY STRANDS —
// fractions, decimals, percentages, multiplication & division, perimeter &
// area, metric conversion, statistics, probability and algebra/reasoning —
// so each Year 3..6 offers at least ten distinct, year-tiered worksheets
// (Australian Curriculum v9-informed; see readme.md for the code map).
// Year 3 additionally offers times tables to 10, cardinal NSWE and separate
// shape flips / 90-degree rotations. Grades 7..12 render a "coming soon"
// placeholder: the primary catalogue is finished by Year 6.
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
        // Max operand for times-tables (Years 2 and 3 => 10, products to 100);
        // also bounds division where that separate worksheet is offered (Year 2).
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
        // Max temperature in °C for the temperature worksheet (0 => not
        // offered). Grade 1 reads/compares within 20°C (matching its
        // within-20 number scope); grade 2 extends to 40°C (real-world
        // weather range).
        tempCap: number;
        // ── Upper-primary (Years 3..6) strand caps — added by the T4
        //    curriculum expansion. Every new Years 3..6 plugin gates its task
        //    families on these; Prep..Year 2 keep zero/empty values and never
        //    see the new sheets (their `available` lists exclude the ids).
        // Year tier for the upper-primary strands: 0 = Prep..Year 2 or
        // unimplemented, 3..6 = Year 3..6. The new plugins branch their
        // GENERATOR on this (scaffold families for the year's syllabus band),
        // while grade gating itself stays with `available`.
        yearLevel: number;
        // Fraction denominators in scope (empty => fractions not offered).
        // Y3 = the unit-fraction set halves..tenths; Y4..Y6 widen to the
        // related-denominator families (6/8/12) used for equivalence,
        // comparison and +/-.
        denSet: readonly number[];
        // Decimal places in scope (0 => decimals not offered). Y4 = tenths &
        // hundredths, Y5/Y6 = up to thousandths.
        decPlaces: number;
        // Max rectangle side length (in the sheet's printed unit) for the
        // perimeter & area worksheet (0 => not offered). Y4 counts squares
        // with small sides, Y5 works in cm/m, Y6 in m/km-scale numbers.
        areaSideCap: number;
    };
};

// The generator-facing slice of a grade config (consumed by plugin generators).
export type Caps = GradeConfig['caps'];

// Grade 0 (Prep) through 2 are fully covered; Grade 2 extends the same
// generators to bigger numbers (within 100). Grades 3..6 offer the arithmetic
// ladder, with times tables and spatial extensions only in Year 3; grades
// 7..12 complete the selector but are flagged `implemented: false`.
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
        coinCap: 0,
        tempCap: 0,
        // Upper-primary strand caps stay zero/empty for unimplemented grades.
        yearLevel: 0,
        denSet: [],
        decPlaces: 0,
        areaSideCap: 0
    }
});

// Grades 3..6 - the ARITHMETIC LADDER plus the UPPER-PRIMARY STRANDS.
// The operand cap scales one digit per year (Y3 = within 1 000 ... Y6 =
// within 1 000 000). Multi-term questions join from Year 4 (3 terms
// in addition / 2 subtrahends in subtraction) and Year 6 (4 addends /
// 3 subtrahends) — see plugins/AdditionWorksheet.ts and
// plugins/SubtractionWorksheet.ts. Year 3 alone also reuses
// plugins/MultiplicationWorksheet.ts (tables to 10) and
// plugins/CompassWorksheet.ts (cardinal NSWE, internally clockwise N/E/S/W).
// The separate 'transformations' plugin handles shape flips / 90-degree
// rotations, not the 'shapes' recognition sheet or a second compass plugin.
//
// T4 CURRICULUM EXPANSION (Australian Curriculum v9-informed, AC9 codes
// documented in readme.md): every Year 3..6 now offers at least TEN
// worksheet choices. The nine new plugins (fractions, decimals, percent,
// multidiv, perimeterarea, metricconv, statistics, probability, algebra)
// scale their task families on the yearLevel / denSet / decPlaces /
// areaSideCap / multCap caps below, so each year gets DISTINCT content —
// not just bigger random numbers. Availability per year (catalogue order):
//   Y3: ladder + mult + spatial + fractions/metric/statistics/probability/algebra
//   Y4: ladder + fractions/decimals/multidiv/perimeterarea/metricconv/
//       statistics/probability/algebra
//   Y5/Y6: Y4's set plus percent (AC9M5N04 / AC9M6N07 join at Year 5).
// Exact catalogue order and every configuration are pinned in grades.test.ts.
const arithmeticLadderGrade = (id: number): GradeConfig => ({
    id,
    short: String(id),
    label: `Year ${id}`,
    implemented: true,
    available: id === 3
        ? ['addition', 'subtraction', 'mult', 'transformations', 'compass',
            'fractions', 'metricconv', 'statistics', 'probability', 'algebra']
        : id === 4
            ? ['addition', 'subtraction', 'fractions', 'decimals', 'multidiv',
                'perimeterarea', 'metricconv', 'statistics', 'probability', 'algebra']
            : ['addition', 'subtraction', 'fractions', 'decimals', 'percent',
                'multidiv', 'perimeterarea', 'metricconv', 'statistics',
                'probability', 'algebra'],
    caps: {
        // One more digit each year: 10^3 (Y3) ... 10^6 (Y6).
        opCap: 10 ** id,
        // Pairs through Year 3; 3 terms from Year 4; 4 terms in Year 6.
        addendCap: id >= 6 ? 4 : id >= 4 ? 3 : 2,
        numCap: 0,
        wordCap: 0,
        skipCap: 0,
        skipSet: [],
        // Retain Year 2's tables to 10 in Year 3; do not scale with opCap.
        // Years 4..6 use multCap as the MULTIDIV operand ceiling (multiples
        // of 10 in Y4, two-digit work in Y5/Y6 — plugins/MultiplyDivideWorksheet.ts).
        multCap: id === 3 ? 10 : id >= 4 ? 100 : 0,
        doubleCap: 0,
        bondCap: 0,
        patSet: [],
        shapeSet: [],
        clockCap: 0,
        metricCap: 0,
        pvCap: 0,
        dataCap: 0,
        coinCap: 0,
        tempCap: 0,
        // ── Upper-primary strand tiering (see the Caps comments above) ──
        yearLevel: id,
        // Y3 = unit fractions halves..tenths (AC9M3N02); Y4..Y6 add the
        // related-denominator partners 6/8/12 for equivalence, comparison
        // and +/− (AC9M4N03-04, AC9M5N03-05, AC9M6N03-04).
        denSet: id === 3 ? [2, 3, 4, 5, 10] : [2, 3, 4, 5, 6, 8, 10, 12],
        // Decimals start in Year 4 (tenths/hundredths AC9M4N01), widen to
        // thousandths in Year 5 (AC9M5N01) and stay there for Year 6's
        // +/- to thousandths (AC9M6N05).
        decPlaces: id === 3 ? 0 : id === 4 ? 2 : 3,
        // Perimeter/area sides: Y4 counts small squares (AC9M4M02), Y5 works
        // in cm/m with formulas (AC9M5M02), Y6 in m/km-scale numbers with
        // unit links (AC9M6M01-02).
        areaSideCap: id === 4 ? 20 : id === 5 ? 100 : id === 6 ? 1000 : 0
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
            coinCap: 0,
            tempCap: 0,
            // Prep sits below the upper-primary strands (yearLevel 0).
            yearLevel: 0,
            denSet: [],
            decPlaces: 0,
            areaSideCap: 0
        },
    },
    {
        id: 1,
        short: '1',
        label: 'Year 1',
        implemented: true,
        // Year 1 gets the full extension catalogue (within 20): number bonds to
        // 10, doubles to 10, patterns (steps 1/2/5/10), 2-D & 3-D shapes,
        // compass directions N/S/E/W (spatial sense), days/months/seasons (no
        // clocks), informal measurement (no cm), temperatures within 20°C,
        // tens & ones to 20, tallies/picture & column graphs, and the rows &
        // columns counting sheet (4 × 5 grids at most, the repeated-addition
        // bridge to multiplication — plugins/RowsColumnsWorksheet.ts).
        available: [
            'counting',
            'rowscolumns',
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
            'compass',
            'time',
            'measure',
            'temperature',
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
            coinCap: 0,
            // Grade-1 temperature: friendly 1..20°C read/compare range (the
            // same within-20 scope as every other Year 1 number sheet).
            tempCap: 20,
            // Year 1 stays below the upper-primary strands.
            yearLevel: 1,
            denSet: [],
            decPlaces: 0,
            areaSideCap: 0
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
        // clock time to the hour & half-past (V8 ACMMG170) plus the dedicated
        // clock-faces sheet (reading + drawing hands, quarter past/to),
        // cm measurement up to a metre, bonds to 10 & 20, doubles to 20,
        // patterns with 3s & 4s steps, hexagons & extra 3-D shapes, tens &
        // ones to 99, and bigger data counts. The rows-columns sheet widens
        // to 5 × 5 grids AND gains the r × c product form (its multCap is 10,
        // so the multiplication bridge is grade-appropriate). The Year-1
        // compass sheet carries over unchanged; the temperature sheet widens
        // to 40°C.
        available: [
            'counting',
            'rowscolumns',
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
            'compass',
            'time',
            'clock',
            'measure',
            'temperature',
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
            coinCap: 100,
            // Year-2 temperature reaches the full everyday weather range.
            tempCap: 40,
            // Year 2 stays below the upper-primary strands.
            yearLevel: 2,
            denSet: [],
            decPlaces: 0,
            areaSideCap: 0
        },
    },
    // Grades 3..6 - arithmetic ladder, plus Year 3's explicit extensions above.
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
