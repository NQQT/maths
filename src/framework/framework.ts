// ─────────────────────────────────────────────────────────────────────────────
// The DashboardFramework — the bundle of configurations + layouts the
// dashboard hands to EVERY worksheet plugin factory when it loads it.
//
// A worksheet plugin is a function like AdditionWorksheet(dashboard):
//
//   export function AdditionWorksheet(dashboard: DashboardFramework): DashboardPlugin {
//       return dashboard.createWorksheet({ id: 'addition', label: 'Addition', ... });
//   }
//
// Within the function the plugin describes its sidebar label and what happens
// when its label is clicked (its worksheet shows in the content area) — using
// the framework's standard worksheet recipe, grade configuration, deterministic
// seeding and A4 layouts provided here.
// ─────────────────────────────────────────────────────────────────────────────

import { GRADES, getGradeConfig, type GradeConfig } from './grades';
import { createRng, seedFrom } from './rng';
import { PageStack } from './PageStack';
import { PrintableSheet } from './PrintableSheet';
import { ZoomControl } from './ZoomControl';
import { createWorksheet } from './worksheet-kit';
import { useDashboardSession } from './store';
import { definePlugin, type DashboardPlugin, type DashboardSession, type WorksheetSpec } from './types';

export type DashboardFramework = {
    // The framework's standard worksheet recipe: builds the full plugin
    // (rail entry + toolbar + page + print + grade gating) from a spec.
    createWorksheet: (spec: WorksheetSpec) => DashboardPlugin;
    // The shared dashboard session state (grade, pages, zoom, refresh) —
    // reactive: mutations re-render subscribed components synchronously.
    useSession: () => DashboardSession;
    // Grade catalogue (the dashboard's maths configuration).
    GRADES: readonly GradeConfig[];
    getGradeConfig: (id: number) => GradeConfig;
    // Deterministic seeding + PRNG for plugin generators.
    seedFrom: typeof seedFrom;
    createRng: typeof createRng;
    // A4 layout components a custom plugin can compose its own surfaces from.
    PageStack: typeof PageStack;
    PrintableSheet: typeof PrintableSheet;
    ZoomControl: typeof ZoomControl;
    // Plugin factory helper (single injection point for future concerns).
    definePlugin: typeof definePlugin;
};

// The singleton bundle passed to every worksheet factory in plugins/index.ts.
export const DASHBOARD_FRAMEWORK: DashboardFramework = {
    createWorksheet,
    useSession: useDashboardSession,
    GRADES,
    getGradeConfig,
    seedFrom,
    createRng,
    PageStack,
    PrintableSheet,
    ZoomControl,
    definePlugin
};
