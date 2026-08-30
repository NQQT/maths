// Barrel export for the dashboard HOST components.
//
// The host is a thin framework shell (MathsDashboard). Every worksheet lives
// in a self-contained plugin under src/plugins/<Name>Worksheet.ts (see
// plugins/index.ts — the single registration point). The framework pieces the
// plugins consume (store, grade catalogue, A4 layouts, worksheet recipe) ship
// from src/framework.
export * from './MathsDashboard';
