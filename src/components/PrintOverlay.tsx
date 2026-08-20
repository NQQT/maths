// Full-screen print-review modal. Replaces the old @react/headless
// DocumentPrint overlay, whose fixed 297mm inner page inside a `height: auto`
// absolute wrapper stretched the document and produced viewport scrollbars
// (and clipped pages on short screens).
//
// This overlay is `position: fixed; inset: 0`, so it can NEVER grow the
// scrollable document area (fixed boxes are out of flow); the page stack
// scrolls INTERNALLY. The actual print goes through window.print() + the
// global @media print rules in app.css: the on-screen app (including this
// modal, which lives inside `.app-chrome`) is hidden and the hidden
// `.print-doc` tree — one A4 block per worksheet page, breaking onto new
// sheets — is what the browser prints, so multi-page worksheets print
// page-for-page with no print framework involved.
import React, { useEffect } from 'react';
import { styledComponent } from '@presource/react';
import type { PageSpec } from './PageStack';
import { PageStack } from './PageStack';
import { ZoomControl } from './ZoomControl';
import type { ZoomMode } from './page-scale';

export type PrintOverlayProps = {
    // Document heading, also used as the printed-PDF file name while open.
    title: string;
    subtitle: string;
    // Every A4 page of the document, in order.
    pages: PageSpec[];
    // Shared zoom preference (the same state drives the inline preview).
    zoom: ZoomMode;
    onZoomChange: (mode: ZoomMode) => void;
    onClose: () => void;
};

// Fixed, viewport-locked modal layer. `inset: 0` + high z-index: it covers
// the app exactly and, being fixed, contributes zero to document scrolling.
const OverlayRoot = styledComponent('div', {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(2,6,23,0.78)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)'
});

const TopBar = styledComponent('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 16px',
    flexShrink: 0,
    background: 'rgba(15,23,42,0.94)',
    borderBottom: '1px solid rgba(148,163,184,0.2)'
});

// Ellipsizes instead of wrapping so the bar stays exactly one line on narrow
// screens (the zoom control and buttons keep their priority).
const BarTitle = styledComponent('div', {
    flex: 1,
    minWidth: 0,
    fontSize: '14px',
    fontWeight: 700,
    color: '#f1f5f9',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
});

// Ghost "Back" button on the dark bar.
const BackButton = styledComponent('button', {
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(148,163,184,0.35)',
    background: 'transparent',
    color: '#e2e8f0',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0
});

// Primary "Print" button — fires window.print(); the @media print CSS does
// the rest (see app.css and the dashboard's hidden .print-doc tree).
const PrintAction = styledComponent('button', {
    padding: '7px 18px',
    borderRadius: '9px',
    border: 'none',
    background: '#4f46e5',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    flexShrink: 0,
    boxShadow: '0 4px 14px rgba(79,70,229,0.4)'
});

export function PrintOverlay({
    title,
    subtitle,
    pages,
    zoom,
    onZoomChange,
    onClose
}: PrintOverlayProps) {
    // Standard modal affordance: Escape dismisses the review.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    // Rename the tab (and by default the saved-PDF file) to the worksheet
    // title while the review is open; restore the previous title on close.
    useEffect(() => {
        const previous = document.title;
        document.title = title;
        return () => {
            document.title = previous;
        };
    }, [title]);

    return (
        <OverlayRoot
            role="dialog"
            aria-modal="true"
            aria-label={`Print preview — ${title}`}
            data-testid="sheet-print"
        >
            <TopBar>
                <BackButton onClick={onClose}>&larr; Back</BackButton>
                <BarTitle>{title} — print preview</BarTitle>
                <ZoomControl label="Print zoom" tone="dark" value={zoom} onChange={onZoomChange} />
                <PrintAction onClick={() => window.print()}>Print</PrintAction>
            </TopBar>
            {/* Scrolls internally; the document never scrolls (fixed root). */}
            <PageStack
                dark
                title={title}
                subtitle={subtitle}
                pages={pages}
                zoom={zoom}
                testId="sheet-print-viewport"
                pageTestId="sheet-print-page"
            />
        </OverlayRoot>
    );
}