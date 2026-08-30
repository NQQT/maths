// ─────────────────────────────────────────────────────────────────────────────
// THE PLUGIN LIST — the single registration point of the dashboard.
//
// This is the ONLY file that changes when adding or removing an exercise
// plugin (besides the plugin's own directory, which is fully self-contained):
//
//   ADD     a plugin:  create src/plugins/<id>/ exporting a `DashboardPlugin`
//                      (see plugins/worksheet for the reference implementation)
//                      and add one line to PLUGINS below.
//   DELETE  a plugin:  delete its directory and remove its line here. Nothing
//                      else in the app references it — no imports, no shared
//                      state, no dashboard code changes. The host falls back
//                      to the remaining plugins automatically.
//
// The array ORDER is the UI order: entries appear in the left rail in this
// sequence, and the first plugin's first entry is the default selection.
// ─────────────────────────────────────────────────────────────────────────────

// Plugin infrastructure (contract, store, registry, host components) —
// re-exported so consumers (the dashboard host, plugin tests) can import
// everything from '../plugins' in one place.
export * from './infrastructure';

import type { DashboardPlugin } from './infrastructure';
import { worksheetPlugin } from './worksheet/plugin';

// All installed plugins, in display order. Each entry becomes a slice of the
// dashboard UI: its entries merge into the left list, its header into the top
// bar, its toolbar + page into the active view.
export const PLUGINS: DashboardPlugin[] = [worksheetPlugin];
