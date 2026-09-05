// Vitest config scoped to this maths distribution.
// Uses jsdom environment for React component testing with global APIs.
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
        passWithNoTests: true,
        // The dashboard loads its 19 worksheet plugins ONE BY ONE after mount
        // (chained macrotasks, framework/loader.ts). Tests that await the
        // FULL rail (allVisiblePluginsLoaded in MathsDashboard.test.tsx) sit
        // on that whole chain — when the monorepo test run goes wide
        // (yarn runs every workspace in parallel) the 5s default testTimeout
        // is not enough headroom. 15s keeps a margin without masking hangs.
        testTimeout: 15000,
    },
});