// Barrel export for the dashboard plugin infrastructure.
// - types:  the DashboardPlugin contract every exercise plugin implements.
// - store:  the shared reactive store (selection + per-plugin scoped slices).
// - registry: host hooks to mount plugins and resolve runtime contexts.
// - host:   the header/sidebar/toolbar/page mount components the dashboard
//           renders (plugins never import these — one-way dependency).
export * from './types';
export * from './store';
export * from './registry';
export * from './host';
