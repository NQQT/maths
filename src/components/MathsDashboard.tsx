// The maths worksheet dashboard. Composition (top-to-bottom, left-to-right):
//
//   +------------------------------------------------------------------+
//   |  Maths Sheets                        [P][1][2]..[12]  (top-right)|
//   +----------------+-------------------------------------------------+
//   |  MATH TYPE     |   toolbar: <title>  [New Sheet] [Print]         |
//   |  (left)        |   scaled A4 preview of the generated sheet      |
//   |  - Addition    |                                                 |
//   |  - Subtraction |                                                 |
//   |  - ...         |                                                 |
//   +----------------+-------------------------------------------------+
//
// "Print" opens @react/headless `DocumentPrint` as a full-screen A4 overlay of
// the identical sheet; "Back" dismisses it. Because the sheet is generated ONCE
// per (grade, type, refresh) and that same problem list is reused for both the
// inline preview and the print overlay, the two always match.
import React, { useMemo } from 'react';
import { useStateHook, styledComponent } from '@presource/react';
import { DocumentPrint, FlexColumn, TwoColumnDashboard } from '@react/headless';
import { getGradeConfig } from '../lib/grades';
import { generateSheet, MATH_TYPES, type MathTypeId } from '../lib/problems';
import { seedFrom } from '../lib/rng';
import { GradeSelector } from './GradeSelector';
import { TypeSidebar } from './TypeSidebar';
import { SheetPreview } from './SheetPreview';
import { PrintableSheet } from './PrintableSheet';

// Full-viewport, positioned root. `position: relative` is important: it becomes
// the containing block for the absolute-positioned DocumentPrint fullscreen
// overlay so the overlay is sized to the whole app, not to a mid-page panel.
const AppRoot = styledComponent('div', {
    position: 'relative',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    background: '#eef2f7'
});

const HeaderBar = styledComponent('div', {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '12px 20px',
    background: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    flexWrap: 'wrap'
});

const AppTitle = styledComponent('h1', {
    fontSize: '20px',
    fontWeight: 800,
    margin: 0,
    color: '#0f172a'
});

// Right-hand content window: toolbar on top, scrollable preview below.
const ContentWrap = styledComponent('div', {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    height: '100%',
    padding: '16px',
    boxSizing: 'border-box'
});

const Toolbar = styledComponent('div', {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px'
});

const ToolbarTitle = styledComponent('div', {
    fontSize: '16px',
    fontWeight: 700,
    color: '#0f172a'
});

const Button = styledComponent('button', {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#334155',
    fontSize: '14px',
    cursor: 'pointer'
});

const PrintButton = styledComponent('button', {
    padding: '8px 18px',
    borderRadius: '8px',
    border: 'none',
    background: '#2563eb',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer'
});

const PreviewScroll = styledComponent('div', {
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    display: 'flex',
    justifyContent: 'center',
    background: '#0f172a'
});

const EmptyState = styledComponent('div', {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    color: '#cbd5e1',
    fontSize: '18px'
});

// Floating "back" button shown above the DocumentPrint overlay so the user can
// return to the dashboard (DocumentPrint's own speed dial only offers Print).
// Rendered after the overlay with a high z-index so it stacks on top.
const BackButton = styledComponent('button', {
    position: 'fixed',
    top: '16px',
    right: '16px',
    zIndex: 9999,
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#0f172a',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(0,0,0,0.3)'
});

// Resolve the human label for a math type id (falls back to the id itself).
function labelFor(type: MathTypeId): string {
    return MATH_TYPES.find((t) => t.id === type)?.label ?? type;
}

export function MathsDashboard() {
    // Accessor-state per the @presource/react state-hook contract:
    // read with `x()`, write with `x(value)`.
    const gradeId = useStateHook(1); // start on the target grade (Year 1)
    const typeId = useStateHook<MathTypeId>('addition');
    const isPrinting = useStateHook(false);
    const refresh = useStateHook(0); // bump = "New Sheet" => new seed

    const grade = getGradeConfig(gradeId());
    // If the previously selected type isn't offered by the new grade, fall back
    // to the first offered type so no invalid selection can linger.
    const activeType: MathTypeId = grade.available.includes(typeId()) ? typeId() : (grade.available[0] ?? 'addition');

    // Stable seed from the current selection + refresh counter. Deterministic,
    // so the same inputs always yield the same sheet.
    const seed = seedFrom([grade.id, activeType, refresh()]);

    // Generate the sheet exactly once per selection and reuse it for both the
    // preview and the print overlay. Empty list => "not implemented", which the
    // content window renders as a placeholder.
    const problems = useMemo(
        () => (grade.implemented && grade.available.includes(activeType) ? generateSheet(grade, activeType, seed) : []),
        [grade, activeType, seed]
    );

    const title = `${grade.label} — ${labelFor(activeType)}`;
    const subtitle = `${labelFor(activeType)} worksheet`;

    const openPrint = () => isPrinting(true);
    const closePrint = () => isPrinting(false);
    const newSheet = () => refresh(refresh() + 1);

    // Content window: toolbar + scaled preview, or a placeholder when empty.
    const content =
        problems.length === 0 ? (
            <EmptyState data-testid="empty-state">
                <span>No worksheets for this selection yet.</span>
                <span aria-hidden>Choose Prep, Year 1 or Year 2.</span>
            </EmptyState>
        ) : (
            <ContentWrap>
                <Toolbar>
                    {/* data-testid lets tests target the toolbar title specifically, since the
                        same title string also appears as the A4 preview's heading. */}
                    <ToolbarTitle data-testid="toolbar-title">{title}</ToolbarTitle>
                    <Toolbar>
                        <Button onClick={newSheet}>New Sheet</Button>
                        <PrintButton onClick={openPrint}>Print</PrintButton>
                    </Toolbar>
                </Toolbar>
                <PreviewScroll>
                    <SheetPreview title={title} subtitle={subtitle} problems={problems} testId="sheet-preview" />
                </PreviewScroll>
            </ContentWrap>
        );

    return (
        <AppRoot>
            <FlexColumn style={{ height: '100%' }} spacing={0} justify="flex-start">
                {/* Header: app title on the left, grade selector pinned top-right. */}
                <HeaderBar>
                    <AppTitle>Maths Sheets</AppTitle>
                    <GradeSelector
                        value={gradeId()}
                        onChange={(id) => {
                            gradeId(id);
                        }}
                    />
                </HeaderBar>

                {/* Body: fixed two-column split — math types (left), sheet (right). */}
                <div style={{ flex: 1, minHeight: 0 }}>
                    <TwoColumnDashboard
                        left={<TypeSidebar grade={grade} value={activeType} onChange={(id) => typeId(id)} />}
                        right={content}
                        defaultLeftWidth={24}
                        isFixed
                    />
                </div>
            </FlexColumn>

            {/* On-demand printable A4 overlay (identical content to the preview). */}
            {isPrinting() && (
                <>
                    <DocumentPrint
                        content={
                            <PrintableSheet
                                title={title}
                                subtitle={subtitle}
                                problems={problems}
                                testId="sheet-print"
                            />
                        }
                    />
                    <BackButton onClick={closePrint}>&larr; Back</BackButton>
                </>
            )}
        </AppRoot>
    );
}