// ─────────────────────────────────────────────────────────────────────────────
// The maths dashboard — a THIN framework HOST.
//
// The dashboard is the FRAMEWORK: it contains no exercise logic. It owns:
//   - the app shell (header bar, body layout, sticky positioning, canvas);
//   - the framework components: the Title, the grade selector (shared
//     dashboard configuration), the toolbar card FRAME and rail FRAME;
//   - mounting points for the worksheet plugins (header / sidebar list /
//     toolbar / page), fed from the plugin list in ../plugins.
//
// Every worksheet is a self-contained plugin under src/plugins/<Name>Worksheet.ts —
// a factory function the dashboard LOADS with its configurations + layouts
// (DASHBOARD_FRAMEWORK). Deleting a plugin's file and its line in
// plugins/index.ts removes the worksheet without affecting this framework or
// any other plugin.
//
// Layout (top-to-bottom, left-to-right) — unchanged from the original:
//
//   +------------------------------------------------------------------+
//   | (∑) Maths Sheets            [grade selector] [plugin header slot]|
//   +----------------+-------------------------------------------------+
//   |  PLUGIN LIST    |  toolbar card: [plugin toolbar slot]           |
//   |  (left rail,    |  canvas: [plugin page slot]                    |
//   |   sticky)       |  (continuous A4 stack / plugin empty state)     |
//   |                 |  [+] zoom dock (plugin-owned, fixed)           |
//   +----------------+-------------------------------------------------+
//
// SCROLLING: the app is a normal, continuously-growing document (app.css
// job 1) — the window's own scrollbar scrolls long page stacks, the header
// / toolbar / rail are position:sticky and the zoom dock is position:fixed.
//
// PRINTING: the normal content view IS the print preview — a worksheet's
// Print button fires the browser-NATIVE print dialog (window.print()); under
// @media print (app.css) this shell (.app-chrome) is hidden and the active
// plugin's hidden .print-doc tree is revealed.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { styledComponent } from '@presource/react';
import { PLUGINS } from '../plugins';
import {
    DashboardContextProvider,
    usePluginRegistry,
    GradeSelector,
    PluginHeaderHost,
    PluginSidebarHost,
    PluginToolbarHost,
    PluginPageHost,
    PluginPrintHost
} from '../framework';

// ──────────────────────────────────────────────────────────────
// Framework shell (unchanged chrome from the original dashboard)
// ──────────────────────────────────────────────────────────────

// App root: a normal document box that grows with its content (see app.css).
// The `app-root` class exists so the @media print rules in app.css can target
// exactly this box (defensive un-clip on print).
const AppRoot = styledComponent('div', {
    position: 'relative',
    width: '100%',
    height: 'auto',
    overflow: 'visible',
    background: '#f4f6fb',
    color: '#0f172a'
});

// White top bar: brand mark + title on the left; the framework grade selector
// (shared configuration) and the active plugin's optional header on the right.
const HeaderBar = styledComponent('div', {
    position: 'sticky',
    top: 0,
    zIndex: 30,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    height: () => ({ xs: 'auto', sm: '64px' }),
    padding: () => ({ xs: '10px 20px', sm: '0 20px' }),
    boxSizing: 'border-box',
    background: '#ffffff',
    borderBottom: '1px solid #e4e9f2'
});

const BrandMark = styledComponent('div', {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '34px',
    height: '34px',
    flexShrink: 0,
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    color: '#ffffff',
    fontSize: '18px',
    fontWeight: 700,
    userSelect: 'none'
});

const AppTitle = styledComponent('h1', {
    fontSize: '17px',
    fontWeight: 800,
    margin: 0,
    color: '#0f172a',
    whiteSpace: 'nowrap',
    letterSpacing: '-0.01em'
});

const HeaderSpacer = styledComponent('div', {
    flex: 1,
    minWidth: 0
});

// Body: plugin list rail (left) + main column (right). Stacks vertically on xs
// (rail becomes a chip strip above the canvas); row layout from sm up.
const Body = styledComponent('div', {
    display: 'flex',
    flexDirection: () => ({ xs: 'column', sm: 'row' }),
    minWidth: 0
});

// Right-hand column: toolbar card, then the canvas. Content-height driven.
const Main = styledComponent('div', {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px',
    boxSizing: 'border-box',
    flex: 1,
    minWidth: 0
});

// Toolbar card frame. position:sticky under the pinned header (sm+, where the
// header is exactly 64px) so worksheet controls stay reachable while the
// window scrolls long page stacks; xs keeps it static.
const ToolbarCard = styledComponent('div', {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
    position: () => ({ xs: 'static', sm: 'sticky' }),
    top: '64px',
    zIndex: 20,
    padding: '10px 14px',
    flexShrink: 0,
    boxSizing: 'border-box',
    background: '#ffffff',
    border: '1px solid #e4e9f2',
    borderRadius: '12px',
    boxShadow: '0 1px 2px rgba(15,23,42,0.04)'
});

// Left rail frame: the plugin list. From sm up it is position:sticky so it
// pins under the sticky header while the WINDOW scrolls the continuous page
// stack; a viewport-capped maxHeight makes long lists scroll inside the rail.
// xs: collapses to a static horizontal chip strip above the canvas.
const Sidebar = styledComponent('div', {
    display: 'flex',
    gap: '6px',
    padding: '16px',
    boxSizing: 'border-box',
    background: '#ffffff',
    overflowY: 'auto',
    flexDirection: () => ({ xs: 'row', sm: 'column' }),
    flexWrap: () => ({ xs: 'wrap', sm: 'nowrap' }),
    width: () => ({ xs: '100%', sm: '264px' }),
    alignSelf: 'flex-start',
    position: () => ({ xs: 'static', sm: 'sticky' }),
    top: () => ({ xs: '0px', sm: '64px' }),
    maxHeight: () => ({ xs: 'none', sm: 'calc(100vh - 80px)' }),
    zIndex: 10,
    flexShrink: 0,
    overflowX: () => ({ xs: 'auto', sm: 'hidden' }),
    borderRight: () => ({ xs: 'none', sm: '1px solid #e4e9f2' }),
    borderBottom: () => ({ xs: '1px solid #e4e9f2', sm: 'none' })
});

const SidebarHeading = styledComponent('h2', {
    // On xs the heading rides inline above the chip row (width 100% forces the
    // wrap); on sm+ it is the first column item.
    width: () => ({ xs: '100%', sm: 'auto' }),
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#94a3b8',
    margin: '0 0 6px 0',
    flexShrink: 0
});

// The canvas frame: a plain, content-height wrapper (no overflow — plugin
// pages extend the document and the window scrollbar scrolls them, app.css
// job 1).
const Canvas = styledComponent('div', {
    position: 'relative',
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: '12px',
    border: '1px solid #e4e9f2',
    background: '#eef1f7'
});

// Framework-level empty state: shown when NO plugin is registered at all (all
// plugins deleted). Distinct from a plugin's own empty state, which renders
// inside the canvas when the plugin's selection has no content.
const HostEmptyState = styledComponent('div', {
    width: '100%',
    minHeight: '50vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    boxSizing: 'border-box'
});

const HostEmptyCard = styledComponent('div', {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '32px 40px',
    background: '#ffffff',
    border: '1px solid #e4e9f2',
    borderRadius: '16px',
    boxShadow: '0 4px 16px rgba(15,23,42,0.06)',
    textAlign: 'center'
});

// ──────────────────────────────────────────────────────────────
// Framework body — subscribes to the store INSIDE the provider
// ──────────────────────────────────────────────────────────────

// The dashboard body must render INSIDE DashboardContextProvider to use the
// store hooks, so the outer component is a two-part shell: provider here,
// body (a child component) below.
export function MathsDashboard() {
    return (
        <DashboardContextProvider>
            <MathsDashboardBody />
        </DashboardContextProvider>
    );
}

// The actual framework chrome. All worksheet content comes from the plugin
// slots.
function MathsDashboardBody() {
    // Registry hook: mounts every plugin's store slice, reconciles the
    // selection (falling back to the first plugin when the selection is stale
    // or empty) and hands back the ordered plugin list.
    const { plugins, activePlugin } = usePluginRegistry(PLUGINS);

    return (
        <AppRoot className="app-root">
            {/* Everything inside .app-chrome is hidden when printing — the
                @media print rules in app.css swap it for .print-doc (which
                the active plugin renders outside this shell). */}
            <div className="app-chrome">
                <HeaderBar>
                    <BrandMark aria-hidden="true">∑</BrandMark>
                    <AppTitle>Maths Sheets</AppTitle>
                    <HeaderSpacer />
                    {/* Framework grade selector: shared dashboard configuration
                        that re-gates every plugin's rail entry and re-caps
                        every plugin's generator. */}
                    <GradeSelector />
                    {/* Plugin header slot (unused by the worksheet plugins;
                        any plugin may still contribute header UI here). */}
                    <PluginHeaderHost plugins={plugins} />
                </HeaderBar>

                <Body>
                    <Sidebar className="scrollbar-hidden">
                        <SidebarHeading>Math Type</SidebarHeading>
                        {/* Plugin list: every visible plugin's entries in
                            registration order, wrapped in the shared rail
                            button chrome. Grade gating is plugin-declared
                            (isOffered) — the framework just renders the list. */}
                        {plugins.length > 0 ? (
                            <PluginSidebarHost plugins={plugins} />
                        ) : (
                            // No plugins installed at all — framework-level
                            // empty rail notice (only reachable when PLUGINS
                            // is []).
                            <SidebarNotice />
                        )}
                    </Sidebar>

                    <Main>
                        {/* Toolbar card frame with the ACTIVE plugin's toolbar
                            slot inside. */}
                        <ToolbarCard>
                            <PluginToolbarHost plugins={plugins} />
                        </ToolbarCard>

                        {/* Canvas / content area: the ACTIVE plugin's page
                            slot. This view doubles as the print preview — a
                            worksheet's Print button opens the browser-native
                            dialog over it. */}
                        <Canvas>
                            {activePlugin ? (
                                <PluginPageHost plugins={plugins} />
                            ) : (
                                <HostEmptyState data-testid="host-empty-state">
                                    <HostEmptyCard>
                                        <div style={{ fontSize: '24px' }}>∑</div>
                                        <strong>No exercises installed</strong>
                                    </HostEmptyCard>
                                </HostEmptyState>
                            )}
                        </Canvas>
                    </Main>
                </Body>
            </div>

            {/* Screen-hidden print tree of the ACTIVE plugin, mounted as a
                SIBLING of .app-chrome: print media hides the shell wholesale
                and reveals .print-doc (app.css), so this is exactly what
                window.print() emits — one A4 block per worksheet page. */}
            <PluginPrintHost plugins={plugins} />
        </AppRoot>
    );
}

// Rail notice for the (rare) zero-plugin state — mirrors the framework empty
// card.
const SidebarNoticeCard = styledComponent('div', {
    padding: '14px',
    background: '#f8fafc',
    border: '1px solid #e4e9f2',
    borderRadius: '12px',
    color: '#475569',
    fontSize: '14px',
    lineHeight: 1.5,
    width: () => ({ xs: '100%', sm: 'auto' })
});

function SidebarNotice() {
    return (
        <SidebarNoticeCard>
            <strong>No exercises installed.</strong>
            <br />
            Add a worksheet plugin in src/plugins/index.ts to see worksheets here.
        </SidebarNoticeCard>
    );
}
