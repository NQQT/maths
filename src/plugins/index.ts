// ─────────────────────────────────────────────────────────────────────────────
// THE WORKSHEET PLUGIN LIST — the single registration point of the dashboard.
//
// Every worksheet is a PLUGIN: a factory FUNCTION (AdditionWorksheet,
// SubtractionWorksheet, MissingNumberWorksheet, CompareWorksheet, ...) that
// the dashboard LOADS by calling it with the framework's configurations +
// layouts (DASHBOARD_FRAMEWORK). Within each function the plugin describes its
// sidebar label and what happens when its label is clicked (its worksheet
// shows in the content area).
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
// The array ORDER is the UI order: plugins appear in the left rail in this
// sequence (grade-gated), and the first plugin's entry is the default
// selection. The order mirrors the curriculum catalogue (Addition first,
// Coins & Money last).
// ─────────────────────────────────────────────────────────────────────────────

import { DASHBOARD_FRAMEWORK, type DashboardPlugin } from '../framework';
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
import { MeasurementWorksheet } from './MeasurementWorksheet';
import { PlaceValueWorksheet } from './PlaceValueWorksheet';
import { DataWorksheet } from './DataWorksheet';
import { DivisionWorksheet } from './DivisionWorksheet';
import { MoneyWorksheet } from './MoneyWorksheet';

// All installed worksheet plugins, in display order. The dashboard loads each
// by calling its factory function with its framework bundle — the plugin then
// contributes its sidebar entry, toolbar, page and print surfaces.
export const PLUGINS: DashboardPlugin[] = [
    AdditionWorksheet(DASHBOARD_FRAMEWORK),
    SubtractionWorksheet(DASHBOARD_FRAMEWORK),
    MultiplicationWorksheet(DASHBOARD_FRAMEWORK),
    MissingNumberWorksheet(DASHBOARD_FRAMEWORK),
    CompareWorksheet(DASHBOARD_FRAMEWORK),
    SkipCountingWorksheet(DASHBOARD_FRAMEWORK),
    WordProblemsWorksheet(DASHBOARD_FRAMEWORK),
    CountingWorksheet(DASHBOARD_FRAMEWORK),
    DoublesWorksheet(DASHBOARD_FRAMEWORK),
    NumberBondsWorksheet(DASHBOARD_FRAMEWORK),
    PatternsWorksheet(DASHBOARD_FRAMEWORK),
    ShapesWorksheet(DASHBOARD_FRAMEWORK),
    TimeWorksheet(DASHBOARD_FRAMEWORK),
    MeasurementWorksheet(DASHBOARD_FRAMEWORK),
    PlaceValueWorksheet(DASHBOARD_FRAMEWORK),
    DataWorksheet(DASHBOARD_FRAMEWORK),
    DivisionWorksheet(DASHBOARD_FRAMEWORK),
    MoneyWorksheet(DASHBOARD_FRAMEWORK)
];
