// Barrel export for the maths distribution app.
//
// The app is a PLUGIN HOST: the dashboard chrome lives in ./components, and
// every exercise is a self-contained plugin under ./plugins (see
// plugins/index.ts — the single registration point).
export { App } from './App';
export * from './components';
// The plugin infrastructure (contract, store, registry, hosts) ships too, so
// external consumers can build dashboard-compatible plugins against it.
export * from './plugins';
