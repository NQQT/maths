// Vite config for the maths distribution.
// `base` is set to "./" so all asset paths are relative — works on any GitHub Pages subpath
// e.g. https://NQQT.github.io/maths/ without needing to hardcode the repo name.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    // Relative base path so the build works on GitHub Pages subpaths
    base: './',
    server: {
        // Never watch the service's shared writable data root: chokidar
        // holding files under temporary/database while the underload service
        // writes them surfaces as sporadic EPERM failures on Windows.
        watch: {
            ignored: ['**/temporary/**']
        }
    },
    build: {
        outDir: 'dist',
    },
});