// Tests for the App component (the maths worksheet dashboard).
//
// App simply mounts <MathsDashboard />, so these tests assert the dashboard
// renders its core layout: header title, top-right grade selector, left math
// type list, and the right-hand sheet preview.
//
// R4 pins: the header brand is "Math Worksheets v{package.version}" and the
// document title is the same — the version is asserted against package.json
// itself (read here) via the __APP_VERSION__ define, so the pin can never
// drift from the real package version.

import React from 'react';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { App } from './App';

// The single source of truth for the version (vite/vitest inject it as the
// __APP_VERSION__ define from this same file). NOTE: under vitest's jsdom
// environment the GLOBAL URL is jsdom's implementation, which resolves
// relative inputs against the document base (http://localhost:3000/) instead
// of the passed file: base — so `new URL(rel, import.meta.url)` yields an
// http: URL that node:fs rejects. fileURLToPath(import.meta.url) keeps this
// read environment-independent and cwd-independent.
const here = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
    readFileSync(join(here, '../package.json'), 'utf-8'),
) as { version: string };

afterEach(() => {
    cleanup();
});

describe('App (MathsDashboard)', () => {
    it('renders the versioned dashboard header title from package.json', () => {
        // The define must equal the package version (config wiring pin)...
        expect(__APP_VERSION__).toBe(pkg.version);
        render(<App />);
        // ...and the header shows "Math Worksheets v<version>" (R4).
        expect(screen.getByText(`Math Worksheets v${pkg.version}`)).toBeDefined();
    });

    it('sets the document title to the versioned app name', () => {
        render(<App />);
        expect(document.title).toBe(`Math Worksheets v${pkg.version}`);
    });

    it('offers the Theme select (System/Light/Dark) in the header', () => {
        render(<App />);
        const theme = screen.getByLabelText('Theme') as HTMLSelectElement;
        expect(theme.tagName).toBe('SELECT');
        expect(theme.value).toBe('system');
    });

    it('starts on Year 1 (the target grade) with the addition sheet previewed', () => {
        render(<App />);
        // Year 1 grade pill is selected by default.
        expect(screen.getByRole('radio', { name: '1' }).getAttribute('aria-checked')).toBe('true');
        // Preview is present and shows the first addition problem for Year 1
        // (the connected switch-family row pinned in AdditionWorksheet.test.ts).
        expect((screen.getByTestId('sheet-preview').textContent ?? '')).toContain('4 + 16 =');
    });
});