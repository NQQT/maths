// AdditionWorksheet / SubtractionWorksheet (Year 3 multi-digit pairs) supply
// the terms via types.ts's ColumnFigure. This renderer right-aligns the terms
// into a vertical column layout — operator before the last row, a result rule
// below — and NEVER prints the sum/result (it is the private answer).
// (Shared by the PageStack preview and the .print-doc tree.)
import React from 'react';
import { arrayCreate } from '@presource/core';
import { styledComponent } from '@presource/react';
import type { ColumnFigure } from './types';

// Block-level span inside the illustrated ProblemText. 10px digits, 12px row
// pitch: a two-term three-digit pair prints ~30 × 32px, so a 24-item
// two-column sheet keeps fitting A4 (see plugins/AdditionWorksheet.ts).
const DiagramRoot = styledComponent('span', {
    display: 'block',
    width: 'fit-content',
    marginTop: '4px'
});

const ROW_PITCH = 12;
const TOP = 10;
const DIGIT_WIDTH = 6;

export function ColumnDiagram({ figure }: { figure: ColumnFigure }) {
    const digits = Math.max(...figure.terms.map((term) => String(term).length));
    const width = digits * DIGIT_WIDTH + 12; // operator + right margin
    const height = TOP + (figure.terms.length - 1) * ROW_PITCH + 10;
    return (
        <DiagramRoot>
            <svg
                width={`${width}px`}
                height={`${height}px`}
                viewBox={`0 0 ${width} ${height}`}
                role="img"
                // Neutral: the rows are the GIVEN operands only; no result.
                aria-label={figure.op === '+' ? 'vertical sum layout' : 'vertical difference layout'}
            >
                {/* Rows, right-aligned; the operator sits before the LAST row */}
                {arrayCreate(({ index }) => {
                    if (index >= figure.terms.length) return undefined;
                    const text = index === figure.terms.length - 1 ? `${figure.op === '-' ? '−' : '+'}${figure.terms[index]}` : `${figure.terms[index]}`;
                    return (
                        <text
                            key={index}
                            x={width - 4}
                            y={TOP + index * ROW_PITCH}
                            fontSize="10"
                            fontWeight="600"
                            textAnchor="end"
                            fontFamily="monospace"
                            fill="#1a1a1a"
                        >
                            {text}
                        </text>
                    );
                })}
                {/* The result rule: the student writes the answer below it. */}
                <line x1="2" y1={TOP + (figure.terms.length - 1) * ROW_PITCH + 4} x2={width - 2} y2={TOP + (figure.terms.length - 1) * ROW_PITCH + 4} stroke="#1a1a1a" strokeWidth="1.5" />
            </svg>
        </DiagramRoot>
    );
}
