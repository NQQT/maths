// Vitest config scoped to this maths distribution.
// Uses jsdom environment for React component testing with global APIs.
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
        passWithNoTests: true,
    },
});