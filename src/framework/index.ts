// Barrel export for the DASHBOARD FRAMEWORK.
//
// The framework is everything the worksheet plugins USE but none of them OWN:
// the plugin contract (types), the reactive store + session state (store),
// the registry + slot hosts (registry / host), the progressive plugin loader
// (loader), the grade catalogue (grades), the deterministic PRNG (rng) +
// unique-sampling primitives (sampling), document assembly (document), the A4
// layout components (PageStack / PrintableSheet / ZoomControl / page-scale),
// the grade selector (GradeSelector), the standard worksheet recipe
// (worksheet-kit) and the DASHBOARD_FRAMEWORK bundle handed to every plugin
// factory (framework.ts).
export * from './types';
export * from './grades';
export * from './rng';
export * from './sampling';
export * from './document';
export * from './page-scale';
export * from './PageStack';
export * from './PrintableSheet';
// Data-only shape figures are shared by preview/print, not coupled to a plugin.
export * from './ShapeTransformationDiagram';
// The rows/columns grid figure is data the generators own (dimensions only);
// this renderer never computes totals or answers.
export * from './RowsColumnsDiagram';
// The remaining family figure renderers share the same contract: draw the
// plugin-supplied data only; answers stay private problem data (PrintableSheet).
export * from './DataDiagram';
export * from './ShapeFigure';
export * from './BondDiagram';
export * from './CompassDiagram';
export * from './MoneyDiagram';
export * from './DivisionDiagram';
export * from './ColumnDiagram';
export * from './ZoomControl';
export * from './GradeSelector';
export * from './store';
export * from './registry';
export * from './loader';
export * from './host';
export * from './worksheet-kit';
export * from './framework';
