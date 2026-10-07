// DivisionWorksheet supplies the story counts via types.ts's DivisionFigure.
// This renderer draws the VISIBLE equal-group model — buckets with dots
// inside — and NEVER labels the quotient ("how many groups / each"): that
// result is the private answer.
// (Shared by the PageStack preview and the .print-doc tree.)
import React from 'react';
import { arrayCreate } from '@presource/core';
import { styledComponent } from '@presource/react';
import type { DivisionFigure } from './types';

// Block-level span inside the illustrated ProblemText. Six 20px buckets +
// gaps (150px) fit the single-column sheet at full width.
const DiagramRoot = styledComponent('span', {
    display: 'block',
    width: 'fit-content',
    marginTop: '4px'
});

// Bucket dimensions: 20 × 26px, 6px gaps. Dots are 2px radius circles in a
// 2-column grid (10 dots max: rows 0..4).
const BOX_W = 20;
const BOX_H = 26;
const GAP = 6;

export function DivisionDiagram({ figure }: { figure: DivisionFigure }) {
    // Both story forms draw the same picture: `groups` buckets, each holding
    // `buckets` dots (total = groups × buckets, exact by construction).
    const groups = figure.kind === 'share' ? figure.friends : figure.total / figure.size;
    const dotsPerBox = figure.kind === 'share' ? figure.total / figure.friends : figure.size;
    const buckets = arrayCreate(({ index }) => index < groups ? index : undefined);
    return (
        <DiagramRoot>
            <svg
                width={`${groups * BOX_W + (groups - 1) * GAP}px`}
                height={`${BOX_H}px`}
                viewBox={`0 0 ${groups * BOX_W + (groups - 1) * GAP} ${BOX_H}`}
                role="img"
                // Neutral accessible name: the bucket/dot COUNTS are the data,
                // the quotient question's answer is never spoken.
                aria-label="equal groups of objects"
            >
                {buckets.map((group) => (
                    <g key={group}>
                        <rect
                            x={group * (BOX_W + GAP)}
                            y="0"
                            width={BOX_W}
                            height={BOX_H}
                            rx="3"
                            fill="#f2f2f2"
                            stroke="#1a1a1a"
                            strokeWidth="1"
                        />
                        {arrayCreate(({ index }) => {
                            if (index >= dotsPerBox) return undefined;
                            const col = index % 2;
                            const row = Math.floor(index / 2);
                            return (
                                <circle
                                    key={index}
                                    cx={group * (BOX_W + GAP) + 6.5 + col * 7}
                                    cy={4 + row * 4}
                                    r="2"
                                    fill="#1a1a1a"
                                />
                            );
                        })}
                    </g>
                ))}
            </svg>
        </DiagramRoot>
    );
}
