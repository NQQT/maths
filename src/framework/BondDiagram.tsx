// NumberBondsWorksheet supplies the fact via types.ts's BondFigure: the whole,
// the GIVEN part, and the requested part (null). This renderer only draws the
// part-part-whole diagram — a blank circle where the part is null — and never
// prints the missing value (it is the private answer).
// (Shared by the PageStack preview and the .print-doc tree.)
import React from 'react';
import { styledComponent } from '@presource/react';
import type { BondFigure } from './types';

// Block-level span inside the illustrated ProblemText (the nesting the other
// figure renderers use). 96 × 68px fits a two-column sheet's row.
const DiagramRoot = styledComponent('span', {
    display: 'block',
    width: 'fit-content',
    marginTop: '4px'
});

// Connection geometry, precomputed once (whole → part circle edges):
// whole (48,16) r14 and left (26,52) r14 give edge points (40.7,27.9) and
// (33.3,40.1); right side is the mirror about x=48.
const LINKS: Array<{ x1: number; y1: number; x2: number; y2: number }> = [
    { x1: 40.7, y1: 27.9, x2: 33.3, y2: 40.1 },
    { x1: 55.3, y1: 27.9, x2: 62.7, y2: 40.1 }
];

export function BondDiagram({ figure }: { figure: BondFigure }) {
    // Circle text is the value only; a null part renders as an EMPTY circle
    // (the student writes the missing part in it).
    const partLabel = (value: number | null, x: number) => (
        value === null
            ? <circle cx={x} cy="52" r="14" fill="#ffffff" stroke="#1a1a1a" strokeWidth="2" />
            : (
                <g>
                    <circle cx={x} cy="52" r="14" fill="#f2f2f2" stroke="#1a1a1a" strokeWidth="2" />
                    <text x={x} y="56" fontSize="10" fontWeight="700" textAnchor="middle" fill="#1a1a1a">{value}</text>
                </g>
            )
    );
    return (
        <DiagramRoot>
            <svg
                width="96px"
                height="68px"
                viewBox="0 0 96 68"
                role="img"
                // Neutral accessible name: the missing part is the answer.
                aria-label="part-part-whole bond"
            >
                {/* Links first so the circles cover their ends */}
                {LINKS.map((link, index) => (
                    <line key={index} x1={link.x1} y1={link.y1} x2={link.x2} y2={link.y2} stroke="#1a1a1a" strokeWidth="2" />
                ))}
                {/* Whole — always printed (it is given, never the answer) */}
                <circle cx="48" cy="16" r="14" fill="#f2f2f2" stroke="#1a1a1a" strokeWidth="2" />
                <text x="48" y="20" fontSize="10" fontWeight="700" textAnchor="middle" fill="#1a1a1a">{figure.whole}</text>
                {partLabel(figure.left, 26)}
                {partLabel(figure.right, 70)}
            </svg>
        </DiagramRoot>
    );
}
