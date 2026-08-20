// Tests for the App component (the maths worksheet dashboard).
//
// App simply mounts <MathsDashboard />, so these tests assert the dashboard
// renders its core layout: header title, top-right grade selector, left math
// type list, and the right-hand sheet preview.

import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { App } from './App';

afterEach(() => {
    cleanup();
});

describe('App (MathsDashboard)', () => {
    it('renders the dashboard header title', () => {
        render(<App />);
        expect(screen.getByText('Maths Sheets')).toBeDefined();
    });

    it('starts on Year 1 (the target grade) with the addition sheet previewed', () => {
        render(<App />);
        // Year 1 grade pill is selected by default.
        expect(screen.getByRole('radio', { name: '1' }).getAttribute('aria-checked')).toBe('true');
        // Preview is present and shows the first addition problem for Year 1.
        expect((screen.getByTestId('sheet-preview').textContent ?? '')).toContain('10 + 9 =');
    });
});