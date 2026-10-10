// ─────────────────────────────────────────────────────────────────────────────
// PERIMETER & AREA WORKSHEET — self-contained plugin (T4 expansion).
//
// YEAR-TIERED STRAND (Australian Curriculum v9-informed, codes in readme.md):
//   Year 4  perimeter as the distance around, and area by counting square
//           units, on small rectangles (AC9M4M02).
//   Year 5  perimeter and area of rectangles with formulas, working back from
//           a given perimeter/area, and cm↔m unit links (AC9M5M02).
//   Year 6  formula-based area/perimeter on larger measurements, cm²→m²
//           unit links, and around-the-outside path problems (AC9M6M01-02).
//
// SCAFFOLDED LEARNING SEQUENCE (R4): printed "Starter:/Practice:/Challenge:"
// tier prefixes, 3+4+3 per page (see plugins/FractionsWorksheet.ts).
//
// EXACT BY CONSTRUCTION: dimensions are drawn FIRST and every printed
// perimeter/area is computed from them, so reverse questions ("area is 36,
// width is 4 — length?") always have an integer answer. Unit-link answers
// use scale-integer maths (160 cm at place 2 => "1.6 m").
//
// Difficulty reads caps.areaSideCap (max side: 20 cm Y4, 100 Y5, 1000 Y6)
// and caps.yearLevel. Self-contained: delete file + index line to remove.
// ─────────────────────────────────────────────────────────────────────────────

import type { Caps, DashboardFramework, DashboardPlugin, GradeConfig, RawProblem, Rng, WorksheetSpec } from '../framework';
import { createDeck, sampleUnique } from '../framework';

// Eight richer measurement tasks per A4, two columns (four grid rows) — the
// prompts are full sentences, so this sheet runs one step sparser than the
// compact number sheets.
const PER_PAGE = 8;
const S_COUNT = 2;
const P_COUNT = 4;
const C_COUNT = 2;

// Shortest exact decimal display for unit links (160 at place 2 => "1.6").
function fmtTrim(v: number, places: number): string {
    let val = v;
    let p = places;
    while (p > 0 && val % 10 === 0) {
        val /= 10;
        p -= 1;
    }
    if (p <= 0) return String(val);
    const s = String(val).padStart(p + 1, '0');
    return `${s.slice(0, -p)}.${s.slice(-p)}`;
}

// "A 7 cm" vs "An 8 cm" — the article follows the number's vowel sound
// (eight/eighty..., eleven, eighteen).
function article(n: number): string {
    const s = String(n);
    return s.startsWith('8') || s === '11' || s === '18' ? 'An' : 'A';
}

// Draw a length/width pair with width <= length, inside the grade's side cap.
function drawRect(rng: Rng, cap: number): [number, number] {
    const l = rng.int(Math.max(3, Math.floor(cap / 5)), cap);
    const w = rng.int(2, l);
    return [l, w];
}

// ── Year 4 (AC9M4M02): counting units, small rectangles ──────────────────────
function starterY4(rng: Rng, caps: Caps): RawProblem {
    const deck = createDeck(rng, ['perim', 'area'] as const);
    const form = deck.take();
    const [l, w] = drawRect(rng, caps.areaSideCap);
    if (form === 'perim') {
        return { prompt: `Starter: A rectangle is ${l} cm long and ${w} cm wide. Its perimeter is __ cm`, answer: String(2 * (l + w)) };
    }
    return { prompt: `Starter: A rectangle is ${l} cm by ${w} cm. Its area is __ cm²`, answer: String(l * w) };
}

function practiceY4(rng: Rng, caps: Caps): RawProblem {
    const deck = createDeck(rng, ['square', 'count'] as const);
    const form = deck.take();
    if (form === 'square') {
        const s = rng.int(3, 12);
        return {
            prompt: `Practice: A square has sides of ${s} cm. Its perimeter is __ cm and its area is __ cm²`,
            answer: `${4 * s}, ${s * s}`
        };
    }
    const [l, w] = drawRect(rng, caps.areaSideCap);
    return { prompt: `Practice: ${article(l)} ${l} cm by ${w} cm rectangle is covered with 1 cm² squares. It needs __ squares`, answer: String(l * w) };
}

function challengeY4(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['reverseP', 'reverseA'] as const);
    const form = deck.take();
    const [l, w] = drawRect(rng, 12);
    if (form === 'reverseP') {
        // Perimeter and length given → width (integer by construction).
        return { prompt: `Challenge: A rectangle's perimeter is ${2 * (l + w)} cm and its length is ${l} cm. Its width is __ cm`, answer: String(w) };
    }
    return { prompt: `Challenge: A rectangle's area is ${l * w} cm² and its width is ${w} cm. Its length is __ cm`, answer: String(l) };
}

// ── Year 5 (AC9M5M02): formulas, reverse work, cm↔m links ───────────────────
function starterY5(rng: Rng, caps: Caps): RawProblem {
    const deck = createDeck(rng, ['perim', 'area'] as const);
    const form = deck.take();
    const [l, w] = drawRect(rng, caps.areaSideCap);
    if (form === 'perim') {
        return { prompt: `Starter: ${article(l)} ${l} m by ${w} m rectangle has perimeter __ m`, answer: String(2 * (l + w)) };
    }
    return { prompt: `Starter: ${article(l)} ${l} m by ${w} m rectangle has area __ m²`, answer: String(l * w) };
}

function practiceY5(rng: Rng, caps: Caps): RawProblem {
    const deck = createDeck(rng, ['reverseP', 'reverseA', 'mixedunit'] as const);
    const form = deck.take();
    const [l, w] = drawRect(rng, caps.areaSideCap);
    if (form === 'reverseP') {
        return { prompt: `Practice: A rectangle's perimeter is ${2 * (l + w)} m and its length is ${l} m. Its width is __ m`, answer: String(w) };
    }
    if (form === 'reverseA') {
        return { prompt: `Practice: A rectangle's area is ${l * w} m² and its width is ${w} m. Its length is __ m`, answer: String(l) };
    }
    // cm dimensions, perimeter asked in metres (unit link, exact at place 2).
    const lc = rng.int(20, 90) * 10;
    const wc = rng.int(10, lc / 10 - 1);
    return {
        prompt: `Practice: A tray is ${lc} cm by ${wc * 10} cm. Its perimeter is __ m`,
        answer: fmtTrim(2 * (lc + wc * 10), 2)
    };
}

function challengeY5(rng: Rng): RawProblem {
    // Composite area: two rectangles joined (sum of products, exact).
    const [l1, w1] = drawRect(rng, 12);
    const [l2, w2] = drawRect(rng, 6);
    return {
        prompt: `Challenge: An L-shape is made from two rectangles: one ${l1} cm by ${w1} cm and one ${l2} cm by ${w2} cm. Its total area is __ cm²`,
        answer: String(l1 * w1 + l2 * w2)
    };
}

// ── Year 6 (AC9M6M01-02): larger measurements & unit links ──────────────────
function starterY6(rng: Rng, caps: Caps): RawProblem {
    const deck = createDeck(rng, ['perim', 'area'] as const);
    const form = deck.take();
    // Larger fields: sides in the hundreds of metres (cap 1000).
    const l = rng.int(50, Math.floor(caps.areaSideCap / 2));
    const w = rng.int(20, l);
    if (form === 'perim') {
        return { prompt: `Starter: A field is ${l} m by ${w} m. Its perimeter is __ m`, answer: String(2 * (l + w)) };
    }
    return { prompt: `Starter: A field is ${l} m by ${w} m. Its area is __ m²`, answer: String(l * w) };
}

function practiceY6(rng: Rng, caps: Caps): RawProblem {
    const deck = createDeck(rng, ['square', 'cm2m2', 'km'] as const);
    const form = deck.take();
    if (form === 'square') {
        // Square from its perimeter: side = P/4, area = side² (exact).
        const s = rng.int(11, 99);
        return {
            prompt: `Practice: A square has perimeter ${4 * s} m. Its side is __ m and its area is __ m²`,
            answer: `${s}, ${s * s}`
        };
    }
    if (form === 'cm2m2') {
        // cm dimensions, area asked in m² (sides are whole metres).
        const lm = rng.int(2, 9);
        const wm = rng.int(1, lm);
        return {
            prompt: `Practice: A table top is ${lm * 100} cm by ${wm * 100} cm. Its area is __ m²`,
            answer: String(lm * wm)
        };
    }
    const lk = rng.int(2, 9);
    const wk = rng.int(1, lk);
    return { prompt: `Practice: A paddock is ${lk} km by ${wk} km. Its area is __ km²`, answer: String(lk * wk) };
}

function challengeY6(rng: Rng, caps: Caps): RawProblem {
    const deck = createDeck(rng, ['path', 'reverseA'] as const);
    const form = deck.take();
    if (form === 'path') {
        // Path all around: outer sides grow by 2×path, perimeter exact.
        const l = rng.int(8, 30);
        const w = rng.int(4, l);
        return {
            prompt: `Challenge: ${article(l)} ${l} m by ${w} m garden has a 1 m wide path all around it. The path's OUTER perimeter is __ m`,
            answer: String(2 * (l + w + 4))
        };
    }
    const [l, w] = drawRect(rng, caps.areaSideCap);
    return { prompt: `Challenge: A rectangle's area is ${l * w} m² and its width is ${w} m. Its length is __ m`, answer: String(l) };
}

function tierItem(rng: Rng, caps: Caps, tier: 'starter' | 'practice' | 'challenge'): RawProblem {
    const level = caps.yearLevel;
    if (tier === 'starter') return level === 4 ? starterY4(rng, caps) : level === 5 ? starterY5(rng, caps) : starterY6(rng, caps);
    if (tier === 'practice') return level === 4 ? practiceY4(rng, caps) : level === 5 ? practiceY5(rng, caps) : practiceY6(rng, caps);
    return level === 4 ? challengeY4(rng) : level === 5 ? challengeY5(rng) : challengeY6(rng, caps);
}

// Page-by-page scaffold→core→stretch assembly (shared T4 rationale).
function generatePerimeterArea(rng: Rng, caps: Caps, count: number): RawProblem[] {
    const pages = Math.ceil(count / PER_PAGE);
    const starter = sampleUnique(pages * S_COUNT, () => tierItem(rng, caps, 'starter'), (p) => p.prompt);
    const practice = sampleUnique(pages * P_COUNT, () => tierItem(rng, caps, 'practice'), (p) => p.prompt);
    const challenge = sampleUnique(pages * C_COUNT, () => tierItem(rng, caps, 'challenge'), (p) => p.prompt);
    const out: RawProblem[] = [];
    for (let pg = 0; pg < pages; pg++) {
        out.push(
            ...starter.slice(pg * S_COUNT, pg * S_COUNT + S_COUNT),
            ...practice.slice(pg * P_COUNT, pg * P_COUNT + P_COUNT),
            ...challenge.slice(pg * C_COUNT, pg * C_COUNT + C_COUNT)
        );
    }
    return out.slice(0, count);
}

export const perimeterAreaSpec: WorksheetSpec = {
    id: 'perimeterarea',
    label: 'Perimeter & Area',
    icon: '▭',
    perPage: PER_PAGE,
    offered: (grade: GradeConfig) => grade.available.includes('perimeterarea'),
    scope: (grade: GradeConfig) => {
        const level = grade.caps.yearLevel;
        if (level === 4) return 'perimeter & area by counting units (AC9M4M02)';
        if (level === 5) return 'rectangle formulas & reverse problems (AC9M5M02)';
        return 'area formulas & metric links (AC9M6M01-02)';
    },
    generate: generatePerimeterArea
};

export function PerimeterAreaWorksheet(dashboard: DashboardFramework): DashboardPlugin {
    return dashboard.createWorksheet(perimeterAreaSpec);
}
