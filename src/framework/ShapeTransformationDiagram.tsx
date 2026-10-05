// ShapeTransformationsWorksheet supplies the geometry via types.ts's
// ShapeTransformationFigure. This renderer never calculates a transform or
// receives an answer; SVG's positive-down y axis already matches the data.
import React from 'react';
import { arrayCreate } from '@presource/core';
import { styledComponent } from '@presource/react';
import type { ShapeTransformationFigure } from './types';

// Spans keep this valid inside PrintableSheet's ProblemText span. Five 60px
// cards plus four 8px gaps fit a single-column sheet without wrapping.
const DiagramRoot = styledComponent('span', {
    display: 'flex',
    width: 'fit-content',
    maxWidth: '100%',
    gap: '8px',
    marginTop: '4px',
    alignItems: 'flex-start',
    whiteSpace: 'normal'
});

const DiagramCard = styledComponent('span', {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '60px',
    flex: '0 0 60px',
    gap: '2px'
});

// An explicit 16px label line plus the 2px gap and 60px SVG totals 78px;
// inherited worksheet line heights must not enlarge the printed cards.
const CardLabel = styledComponent('span', {
    fontSize: '13px',
    lineHeight: '16px',
    fontWeight: 600
});

export function ShapeTransformationDiagram({ figure }: { figure: ShapeTransformationFigure }) {
    // Keep the plugin's candidate order and readonly vertices untouched. The
    // original uses the same outline styling, so no option is singled out.
    const cards = [{ label: 'Original', points: figure.original }, ...figure.options];
    return (
        <DiagramRoot>
            {cards.map(({ label, points }, index) => (
                <DiagramCard key={index}>
                    <CardLabel>{label}</CardLabel>
                    <svg
                        width="60px"
                        height="60px"
                        viewBox="-4 -4 8 8"
                        role="img"
                        aria-label={index === 0 ? `Original ${figure.name}` : `Option ${label}`}
                    >
                        {/* Format only: no vertex sorting, coordinate changes,
                            or inferred closing point on these SVG polygons. */}
                        <polygon
                            points={arrayCreate(({ index: pointIndex }) => points[pointIndex]?.join(',')).join(' ')}
                            fill="#f2f2f2"
                            stroke="#1a1a1a"
                            strokeWidth="0.18"
                            strokeLinejoin="round"
                        />
                        {/* Guides overlay the ORIGINAL so they remain visible
                            through its light fill; candidates have none. */}
                        {index === 0 && figure.guide !== 'centre' && (
                            <line
                                x1={figure.guide === 'vertical' ? '0' : '-4'}
                                y1={figure.guide === 'vertical' ? '-4' : '0'}
                                x2={figure.guide === 'vertical' ? '0' : '4'}
                                y2={figure.guide === 'vertical' ? '4' : '0'}
                                stroke="#1a1a1a"
                                strokeWidth="0.12"
                                strokeDasharray="0.4 0.3"
                            />
                        )}
                        {index === 0 && figure.guide === 'centre' && (
                            <circle cx="0" cy="0" r="0.2" fill="#1a1a1a" />
                        )}
                    </svg>
                </DiagramCard>
            ))}
        </DiagramRoot>
    );
}
