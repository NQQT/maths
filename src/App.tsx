// App root — mounts the maths worksheet dashboard.
//
// The dashboard itself is fully self-contained (grade selector top-right, math
// type sidebar on the left, printable sheet preview + print on the right). See
// src/components/MathsDashboard.tsx for the layout/behaviour.

import { MathsDashboard } from './components/MathsDashboard';

export function App() {
    return <MathsDashboard />;
}