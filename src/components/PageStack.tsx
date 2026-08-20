// Scrollable stack of A4 pages rendered at the requested zoom. Lives in the
// dashboard's preview canvas, which doubles as the print preview: the A4
// blocks shown here are exactly what the hidden .print-doc tree (app.css)
// feeds the browser-native print dialog, so screen and print can never
// disagree.
//
// Each page is a fixed A4-sized box (794×1123px, see page-scale.ts) that is
// scaled with `transform: scale(...)` and clipped to the scaled footprint.
// transform keeps the layout identical to the printed page (no reflow at small
// sizes), which is why the on-screen preview matches window.print() output.
//
// The component owns the scroll viewport (measured by usePageScale for the
// 'fit' zoom). Its parent must be a flex container — in the dashboard that is
// the canvas, in the modal the overlay column — so `flex: 1; min-height: 0`
// sizes the viewport to whatever space is left.
import React, { useRef } from 'react';
import { styledComponent } from '@presource/react';
import { A4_H, A4_W, usePageScale, type ZoomMode } from './page-scale';
import { PrintableSheet } from './PrintableSheet';
import type { Problem } from '../lib/problems';

export type PageSpec = {
    // The problems printed on this page (ids run across the whole document).
    problems: Problem[];
    // Optional "Page i of n" label — drives BOTH the on-screen badge and the
    // in-sheet print footer. Omitted for single-page documents.
    pageLabel?: string;
};

export type PageStackProps = {
    title: string;
    subtitle: string;
    // Every A4 page of the document, in order.
    pages: PageSpec[];
    // 'fit' or a fixed percentage zoom (50/75/100).
    zoom: ZoomMode;
    // Test id for the scroll viewport root (e.g. "sheet-preview").
    testId?: string;
    // Per-page test id prefix; page i+1 gets `${pageTestId}${i+1}`.
    pageTestId?: string;
};

// Scroll viewport: fills the flex slot left by its parent and scrolls in both
// directions. Cast to ForwardRefExoticComponent so the measured ref can be
// passed through (Emotion forwards refs at runtime; @presource/react's typed
// React.FC surface does not expose `ref`).
const StackViewport = styledComponent('div', {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    overflow: 'auto',
    position: 'relative',
    // Pale slate with a subtle dot grid (PDF-viewer vibe).
    background: '#eef1f7',
    backgroundImage: 'radial-gradient(circle, #d9dfe9 1px, transparent 1px)',
    backgroundSize: '22px 22px'
}) as unknown as React.ForwardRefExoticComponent<
    React.RefAttributes<HTMLDivElement> &
        React.HTMLAttributes<HTMLElement> & {
            children?: React.ReactNode;
            [breakpoint: string]: any;
        }
>;

// The vertical stack of pages. `width: max-content` + `min-width: 100%` +
// centered margin: pages center when narrower than the viewport and scroll
// horizontally once they are wider.
const Stack = styledComponent('div', {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    padding: '28px 24px',
    width: 'max-content',
    minWidth: '100%',
    margin: '0 auto',
    boxSizing: 'border-box'
});

// Scaled page shell: its box is exactly the SCALED A4 footprint so flex
// layout (gaps, centering) sees the right size; the full-size sheet lives
// inside, scaled and top-left anchored.
const PageShell = styledComponent<{ scale: number }>('div', {
    position: 'relative',
    flexShrink: 0,
    width: ({ scale }) => `${A4_W * scale}px`,
    height: ({ scale }) => `${A4_H * scale}px`,
    background: '#ffffff',
    overflow: 'hidden',
    borderRadius: '10px',
    boxShadow: '0 10px 30px rgba(15,23,42,0.14)'
});

// Full-size A4 box scaled down inside the shell (anchored top-left so the
// scaled content lands exactly within the shell's box).
const PageScaleBox = styledComponent<{ scale: number }>('div', {
    width: `${A4_W}px`,
    height: `${A4_H}px`,
    transform: ({ scale }) => `scale(${scale})`,
    transformOrigin: 'top left'
});

// Screen-only "Page i of n" badge pinned to the page's bottom-right corner.
// Never printed (it lives outside PrintableSheet, so the .print-doc tree has
// no such element — the print footer inside the sheet carries the same text).
const PageBadge = styledComponent('div', {
    position: 'absolute',
    right: '10px',
    bottom: '10px',
    padding: '3px 10px',
    borderRadius: '999px',
    border: '1px solid #e4e9f2',
    background: 'rgba(255,255,255,0.92)',
    color: '#64748b',
    fontSize: '11px',
    fontWeight: 600
});

export function PageStack({ title, subtitle, pages, zoom, testId, pageTestId }: PageStackProps) {
    // Ref to the scroll viewport — measured live for the 'fit' zoom.
    const viewportRef = useRef<HTMLDivElement>(null);
    const scale = usePageScale(viewportRef, zoom);

    return (
        <StackViewport ref={viewportRef} data-testid={testId}>
            <Stack>
                {pages.map((page, i) => (
                    <PageShell
                        key={i}
                        scale={scale}
                        data-testid={pageTestId ? `${pageTestId}${i + 1}` : undefined}
                    >
                        {/* Full A4 sheet, scaled to fit the shell above. */}
                        <PageScaleBox scale={scale}>
                            <PrintableSheet
                                title={title}
                                subtitle={subtitle}
                                problems={page.problems}
                                pageLabel={page.pageLabel}
                            />
                        </PageScaleBox>
                        {/* On-screen multi-page position badge. */}
                        {page.pageLabel && (
                            <PageBadge aria-hidden="true">
                                {page.pageLabel}
                            </PageBadge>
                        )}
                    </PageShell>
                ))}
            </Stack>
        </StackViewport>
    );
}