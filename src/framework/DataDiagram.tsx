// DataWorksheet supplies the counts via types.ts's DataFigure. This renderer
// never prints a total, difference, unit scale or name answer; it only draws
// the exact marks, stars and bars the plugin attached, in preview AND print.
// (Shared by the PageStack preview and the .print-doc tree.)
import React from 'react';
import { arrayCreate } from '@presource/core';
import { styledComponent } from '@presource/react';
import type { DataFigure } from './types';

// Spans keep this valid inside PrintableSheet's illustrated ProblemText (the
// same nesting constraint ShapeTransformationDiagram.tsx works under).
const DiagramRoot = styledComponent('span', {
    display: 'block',
    width: 'fit-content',
    marginTop: '4px'
});

// 5-pointed star centred at (cx, cy): outer radius 6 / inner radius 2.5,
// fixed to one decimal so the pin (DataDiagram.test.tsx) stays exact.
function starPoints(cx: number, cy: number) {
    // (x, y) offsets of the 10 alternating outer/inner vertices, precomputed
    // from the standard 5-point star angles (see DataDiagram.test.tsx).
    const offsets: Array<[number, number]> = [
        [0, -6], [1.47, -2.02], [5.71, -1.85], [2.38, 0.77],
        [5.71, 4.85], [0, 2.5], [-5.71, 4.85], [-2.38, 0.77],
        [-5.71, -1.85], [-1.47, -2.02]
    ];
    return offsets.map(([x, y]) => `${(cx + x).toFixed(2)},${(cy + y).toFixed(2)}`).join(' ');
}

export function DataDiagram({ figure }: { figure: DataFigure }) {
    if (figure.kind === 'tally') {
        // Classic tallies: floor(total/5) five-groups (4 strokes + slash) plus
        // the remainder as single strokes. 34px group pitch, 6px stroke pitch,
        // so 40 (the Year-2 ceiling) prints 276px wide inside a two-column sheet.
        const fives = Math.floor(figure.total / 5);
        const rest = figure.total % 5;
        const width = fives * 34 + (rest > 0 ? rest * 6 + 3 : 0) + 2;
        return (
            <DiagramRoot>
                <svg
                    width={`${width}px`}
                    height="24px"
                    viewBox={`0 0 ${width} 24`}
                    role="img"
                    // Neutral accessible name — the total is the PRIVATE answer.
                    aria-label="tally marks"
                >
                    {arrayCreate(({ index }) => {
                        if (index >= fives) return undefined;
                        const x = index * 34;
                        return (
                            <g key={`five-${index}`}>
                                {arrayCreate(({ index: s }) => {
                                    if (s >= 4) return undefined;
                                    return <line key={s} x1={x + s * 6} y1="4" x2={x + s * 6} y2="20" stroke="#1a1a1a" strokeWidth="2" />;
                                })}
                                <line x1={x + 2} y1="21" x2={x + 27} y2="3" stroke="#1a1a1a" strokeWidth="2" />
                            </g>
                        );
                    })}
                    {arrayCreate(({ index }) => {
                        if (index >= rest) return undefined;
                        const x = fives * 34 + index * 6;
                        return <line key={`rest-${index}`} x1={x} y1="4" x2={x} y2="20" stroke="#1a1a1a" strokeWidth="2" />;
                    })}
                </svg>
            </DiagramRoot>
        );
    }
    if (figure.kind === 'picture') {
        // One star per counted unit (the "1 star = u things" scale is the
        // prompt's text, not the figure's — the figure prints the stars only).
        const width = figure.stars * 18 - 8;
        return (
            <DiagramRoot>
                <svg
                    width={`${width}px`}
                    height="14px"
                    viewBox={`0 0 ${width} 14`}
                    role="img"
                    // Neutral: star counts ARE the printed data, but the unit
                    // scale and the total answer stay out of accessible names.
                    aria-label="picture graph"
                >
                    {arrayCreate(({ index }) => {
                        if (index >= figure.stars) return undefined;
                        return (
                            <polygon
                                key={index}
                                points={starPoints(9 + index * 18, 7)}
                                fill="#f2f2f2"
                                stroke="#1a1a1a"
                                strokeWidth="1"
                                strokeLinejoin="round"
                            />
                        );
                    })}
                </svg>
            </DiagramRoot>
        );
    }
    // Column graph: two named bars, 2px per square (40 votes => 80px, inside
    // a two-column sheet). Bars grow UP from the y=68 baseline; names sit
    // below. No heights-in-numbers, no difference label (the difference is
    // the PRIVATE answer).
    const leftHeight = figure.left * 2;
    const rightHeight = figure.right * 2;
    return (
        <DiagramRoot>
            <svg
                width="76px"
                height="80px"
                viewBox="0 0 76 80"
                role="img"
                aria-label="column graph"
            >
                {/* Baseline */}
                <line x1="6" y1="68" x2="70" y2="68" stroke="#1a1a1a" strokeWidth="1.5" />
                {/* The two bars (value = square count, printed as pixels only) */}
                <rect x="12" y={68 - leftHeight} width="22" height={leftHeight} fill="#f2f2f2" stroke="#1a1a1a" strokeWidth="1" />
                <rect x="42" y={68 - rightHeight} width="22" height={rightHeight} fill="#f2f2f2" stroke="#1a1a1a" strokeWidth="1" />
                {/* Names only — never vote counts. */}
                <text x="23" y="78" fontSize="9" textAnchor="middle" fill="#1a1a1a">{figure.leftName}</text>
                <text x="53" y="78" fontSize="9" textAnchor="middle" fill="#1a1a1a">{figure.rightName}</text>
            </svg>
        </DiagramRoot>
    );
}
