// Scaled-down, inline preview of the printable sheet shown in the right-hand
// content window. It renders the SAME <PrintableSheet> that DocumentPrint will
// print, shrunk to fit the dashboard.
//
// A4 at 96dpi is 794 x 1123 px. We render the sheet at full A4 px size inside a
// `transform: scale(0.5)` box, then clip it to the scaled frame (397 x 561 px).
// transform keeps the layout identical to the printed page (no reflow at small
// size), which is why the preview matches the print output.
import React from 'react';
import { styledComponent } from '@presource/react';
import { PrintableSheet, type PrintableSheetProps } from './PrintableSheet';

// A4 in CSS pixels at 96dpi (210mm / 297mm).
const A4_W = 794;
const A4_H = 1123;
// Preview is shown at half size to leave room for the toolbar.
const SCALE = 0.5;

// Outer frame: fixed to the scaled A4 footprint, clips the scaled sheet.
const PreviewFrame = styledComponent('div', {
    width: `${A4_W * SCALE}px`,
    height: `${A4_H * SCALE}px`,
    overflow: 'hidden',
    border: '1px solid #cbd5e1',
    borderRadius: '4px',
    boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
    background: '#ffffff',
    flexShrink: 0
});

// Inner box: full A4 size, scaled down, anchored top-left.
const PreviewScale = styledComponent('div', {
    width: `${A4_W}px`,
    height: `${A4_H}px`,
    transform: `scale(${SCALE})`,
    transformOrigin: 'top left'
});

export function SheetPreview(props: PrintableSheetProps) {
    return (
        <PreviewFrame>
            <PreviewScale>
                <PrintableSheet {...props} />
            </PreviewScale>
        </PreviewFrame>
    );
}