// ─────────────────────────────────────────────────────────────────────────────
// THE WORKSHEET PLUGIN LIST — the single registration point of the dashboard.
//
// Every worksheet is a PLUGIN: a factory FUNCTION (AdditionWorksheet,
// SubtractionWorksheet, MissingNumberWorksheet, CompareWorksheet, ...) that
// the dashboard loads by calling it with the framework's configurations +
// layouts (DASHBOARD_FRAMEWORK). Within each function the plugin describes
// its sidebar label and what happens when its label is clicked (its worksheet
// shows in the content area).
//
// LOADING ORDER — the dashboard loads FIRST, the plugins SECOND: the
// factories below are stored UNINVOKED (a PluginFactory, not a
// DashboardPlugin). The dashboard renders its shell + the first plugin
// immediately, then loads the remaining factories ONE BY ONE after mount —
// see framework/loader.ts (usePluginLoader). Previously every factory was
// invoked right here at module load time, which constructed all 18 plugins
// before the dashboard ever rendered.
//
// This is the ONLY file that changes when adding or removing a worksheet
// (besides the plugin's own file, which is fully self-contained):
//
//   ADD     a worksheet:  create src/plugins/<Name>Worksheet.ts exporting the
//                         factory function and add one line to PLUGINS below.
//   DELETE  a worksheet:  delete its file and remove its line here. Nothing
//                         else in the app references it — no imports, no
//                         shared state, no framework code changes. The
//                         framework falls back to the remaining plugins
//                         automatically.
//
// The array ORDER is the UI order AND the loading order: plugins appear in
// the left rail in this sequence (grade-gated), the first plugin's entry is
// the default selection AND the first plugin loaded with the dashboard's
// first render. The order mirrors the curriculum catalogue (Addition first,
// Coins & Money last).
// ─────────────────────────────────────────────────────────────────────────────

import type { PluginFactory } from '../framework';
import { AdditionWorksheet } from './AdditionWorksheet';
import { SubtractionWorksheet } from './SubtractionWorksheet';
import { MultiplicationWorksheet } from './MultiplicationWorksheet';
import { MissingNumberWorksheet } from './MissingNumberWorksheet';
import { CompareWorksheet } from './CompareWorksheet';
import { SkipCountingWorksheet } from './SkipCountingWorksheet';
import { WordProblemsWorksheet } from './WordProblemsWorksheet';
import { CountingWorksheet } from './CountingWorksheet';
import { DoublesWorksheet } from './DoublesWorksheet';
import { NumberBondsWorksheet } from './NumberBondsWorksheet';
import { PatternsWorksheet } from './PatternsWorksheet';
import { ShapesWorksheet } from './ShapesWorksheet';
import { TimeWorksheet } from './TimeWorksheet';
import { ClockWorksheet } from './ClockWorksheet';
import { MeasurementWorksheet } from './MeasurementWorksheet';
import { PlaceValueWorksheet } from './PlaceValueWorksheet';
import { DataWorksheet } from './DataWorksheet';
import { DivisionWorksheet } from './DivisionWorksheet';
import { MoneyWorksheet } from './MoneyWorksheet';

// All installed worksheet plugins, in display/loading order. UNINVOKED
// factories — the dashboard loads each one by calling it with its framework
// bundle, one by one after the dashboard has rendered (framework/loader.ts);
// each loaded plugin then contributes its sidebar entry, toolbar, page and
// print surfaces.
export const PLUGINS: PluginFactory[] = [
    AdditionWorksheet,
    SubtractionWorksheet,
    MultiplicationWorksheet,
    MissingNumberWorksheet,
    CompareWorksheet,
    SkipCountingWorksheet,
    WordProblemsWorksheet,
    CountingWorksheet,
    DoublesWorksheet,
    NumberBondsWorksheet,
    PatternsWorksheet,
    ShapesWorksheet,
    TimeWorksheet,
    ClockWorksheet,
    MeasurementWorksheet,
    PlaceValueWorksheet,
    DataWorksheet,
    DivisionWorksheet,
    MoneyWorksheet
];
