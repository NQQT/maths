// Barrel export for the dashboard HOST components.
//
// The host is now a thin plugin shell (MathsDashboard); every exercise UI has
// moved into self-contained plugins under src/plugins/<id>/ (see
// plugins/index.ts). The old per-exercise components (GradeSelector,
// TypeSidebar, PageStack, PrintableSheet, ZoomControl, page-scale) now live
// inside the worksheet plugin and are exported from
// plugins/worksheet/plugin.ts for that plugin's own tests only.
export * from './MathsDashboard';
