// App root — mounts the maths worksheet dashboard.
//
// The dashboard itself is fully self-contained (grade selector top-right, math
// type sidebar on the left, printable sheet preview + print on the right). See
// src/components/MathsDashboard.tsx for the layout/behaviour.
//
// DOCUMENT TITLE (R4): the tab/PDF default name is "Math Worksheets
// v{package.version}" — the version is the compile-time __APP_VERSION__
// define (vite.config.ts / vitest.config.ts read package.json via
// readFileSync; ambient declaration in src/vite-env.d.ts), so nothing here
// hardcodes it. index.html carries the unversioned fallback for the first
// paint. worksheet-kit's Print still retitles to the worksheet title while
// the dialog is open and restores THIS title afterwards (the save/restore
// pair reads whatever document.title currently is — behaviour preserved).

import React from 'react';
import { MathsDashboard } from './components';

export function App() {
    // Publish the versioned document title once the app mounts.
    React.useEffect(() => {
        document.title = `Math Worksheets v${__APP_VERSION__}`;
    }, []);

    return <MathsDashboard />;
}
