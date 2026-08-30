// Barrel export for the DASHBOARD FRAMEWORK.
//
// The framework is everything the worksheet plugins USE but none of them OWN:
// the plugin contract (types), the reactive store + session state (store),
// the registry + slot hosts (registry / host), the progressive plugin loader
// (loader), the grade catalogue (grades),
// the deterministic PRNG (rng), document assembly (document), the A4 layout
// components (PageStack / PrintableSheet / ZoomControl / page-scale), the
// grade selector (GradeSelector), the standard worksheet recipe
// (worksheet-kit) and the DASHBOARD_FRAMEWORK bundle handed to every plugin
// factory (framework.ts).
export * from './types';
export * from './grades';
export * from './rng';
export * from './document';
export * from './page-scale';
export * from './PageStack';
export * from './PrintableSheet';
export * from './ZoomControl';
export * from './GradeSelector';
export * from './store';
export * from './registry';
export * from './loader';
export * from './host';
export * from './worksheet-kit';
export * from './framework';
