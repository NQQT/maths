// PrintableSheet owns layout and blanks, not answers or transformations.
// See types.ts for figure data, ShapeTransformationDiagram.test.tsx for exact
// vertices, and plugins/plugins.test.tsx for the existing clock integration.
import React from 'react';
import { arrayCreate, arrayEach } from '@presource/core';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PrintableSheet } from './PrintableSheet';
import type { Problem } from './document';
import type { ShapeTransformationFigure } from './types';

afterEach(cleanup);

const heading = {
    title: 'Year 3 - Shape Transformations',
    subtitle: 'Flips and quarter turns',
    testId: 'printed-sheet'
};

// A local rendering fixture keeps these tests independent of the plugin's RNG,
// grade gating and answer selection (ShapeTransformationsWorksheet.test.ts).
const figure: ShapeTransformationFigure = {
    name: 'triangle',
    original: [[-2, -2], [2, -2], [-2, 1]],
    options: [
        { label: 'A', points: [[2, -2], [-2, -2], [2, 1]] },
        { label: 'B', points: [[-2, -2], [2, -2], [-2, 1]] },
        { label: 'C', points: [[2, 2], [-2, 2], [2, -1]] },
        { label: 'D', points: [[-2, 2], [2, 2], [-2, -1]] }
    ],
    guide: 'vertical'
};

// jsdom does not evaluate styledComponent's min-width media rules. Reading
// matching declarations pins actual generated CSS without mocking the sheet;
// in particular, unitless line-height/flex must not become rem dimensions.
function declarations(element: Element, properties: string[]) {
    const values: Record<string, string> = {};
    arrayEach(properties, ({ value }) => { values[value] = ''; });
    function inspect(rules: CSSRuleList) {
        arrayEach([...rules], ({ value: rule }) => {
            const styleRule = rule as CSSStyleRule;
            if (styleRule.selectorText && element.matches(styleRule.selectorText)) {
                arrayEach(properties, ({ value }) => {
                    const declaration = styleRule.style.getPropertyValue(value);
                    if (declaration) values[value] = declaration;
                });
            } else if ('cssRules' in rule) {
                inspect((rule as CSSMediaRule).cssRules);
            }
        });
    }
    arrayEach([...document.styleSheets], ({ value }) => { inspect(value.cssRules); });
    return values;
}

// Text nodes and empty spans expose blank placement without depending on
// generated Emotion class names or mistaking diagram labels for prompt text.
function contentNodes(element: Element) {
    return arrayCreate(({ index }) => {
        const node = element.childNodes[index];
        return node && { name: node.nodeName, text: node.textContent };
    });
}

const textProperties = ['font-size', 'line-height', 'display', 'min-width', 'flex', 'white-space'];
const legacyText = {
    'font-size': '', 'line-height': '', display: '', 'min-width': '', flex: '', 'white-space': 'pre-wrap'
};
const illustratedText = {
    'font-size': '16px', 'line-height': '1.35', display: 'block', 'min-width': '0px', flex: '1 1 0%', 'white-space': 'pre-wrap'
};

describe('PrintableSheet', () => {
    // Legacy text sheets keep two columns, inherited typography, short/wide
    // blanks, continuous numbering and the optional multi-page footer.
    it('prints exact text, blanks and page metadata without a diagram', () => {
        const problems: Problem[] = [
            { id: 7, type: 'text', prompt: 'Choose __, then __.', answer: 'PRIVATE ANSWER' },
            { id: 8, type: 'text', prompt: 'Write the time in words: __.', answer: 'PRIVATE ANSWER', wideBlanks: true },
            { id: 9, type: 'text', prompt: 'Explain your answer:', answer: 'PRIVATE ANSWER', answerLine: true }
        ];
        render(<PrintableSheet {...heading} problems={problems} pageLabel="Page 2 of 3" />);
        const page = screen.getByTestId('printed-sheet');
        const grid = page.children[2];
        const firstText = grid.children[0].lastElementChild!;
        const secondText = grid.children[1].lastElementChild!;
        const thirdText = grid.children[2].lastElementChild!;

        expect(page.textContent).toBe(
            'Year 3 - Shape TransformationsFlips and quarter turnsName: Date: ' +
            '7.Choose , then .8.Write the time in words: .9.Explain your answer:Maths SheetsPage 2 of 3'
        );
        expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(heading.title);
        expect(screen.getByText(heading.subtitle).tagName).toBe('P');
        expect(arrayCreate(({ index }) => grid.children[index]?.firstElementChild?.textContent)).toEqual(['7.', '8.', '9.']);
        expect(declarations(grid, ['grid-template-columns'])).toEqual({ 'grid-template-columns': '1fr 1fr' });
        expect(page.querySelectorAll('svg').length).toBe(0);
        expect(contentNodes(firstText)).toEqual([
            { name: '#text', text: 'Choose ' },
            { name: 'SPAN', text: '' },
            { name: '#text', text: ', then ' },
            { name: 'SPAN', text: '' },
            { name: '#text', text: '.' }
        ]);
        expect(contentNodes(secondText)).toEqual([
            { name: '#text', text: 'Write the time in words: ' },
            { name: 'SPAN', text: '' },
            { name: '#text', text: '.' }
        ]);
        expect(contentNodes(thirdText)).toEqual([
            { name: '#text', text: 'Explain your answer:' },
            { name: 'SPAN', text: '' }
        ]);
        expect(declarations(firstText.children[0], ['min-width'])).toEqual({ 'min-width': '38px' });
        expect(declarations(firstText.children[1], ['min-width'])).toEqual({ 'min-width': '38px' });
        expect(declarations(secondText.children[0], ['min-width'])).toEqual({ 'min-width': '140px' });
        expect(declarations(screen.getByText('Name:').children[0], ['min-width'])).toEqual({ 'min-width': '140px' });
        expect(declarations(screen.getByText('Date:').children[0], ['min-width'])).toEqual({ 'min-width': '140px' });
        expect(declarations(thirdText.children[0], ['display', 'height', 'margin-top'])).toEqual({
            display: 'block', height: '1.2em', 'margin-top': '12px'
        });
        expect(getComputedStyle(thirdText.children[0]).borderBottomWidth).toBe('2px');
        arrayEach([...grid.children], ({ value: row }) => {
            expect(declarations(row, ['font-size', 'line-height'])).toEqual({ 'font-size': '22px', 'line-height': '1.5' });
            expect(declarations(row.lastElementChild!, textProperties)).toEqual(legacyText);
        });
    });

    // ShapeTransformationsWorksheet requests six rows and singleColumn. All
    // guides use the same sheet path; letter blanks stay before the figures.
    it('prints six illustrated questions in one column with their numbers, header and footer', () => {
        const questions: { prompt: string; guide: ShapeTransformationFigure['guide'] }[] = [
            { prompt: 'Flip the triangle across the vertical mirror line. Letter: __.', guide: 'vertical' },
            { prompt: 'Flip the triangle across the horizontal mirror line. Letter: __.', guide: 'horizontal' },
            { prompt: 'Turn the triangle 90 degrees clockwise about the dot. Letter: __.', guide: 'centre' },
            { prompt: 'Turn the triangle 90 degrees anticlockwise about the dot. Letter: __.', guide: 'centre' },
            { prompt: 'Flip the triangle from left to right. Letter: __.', guide: 'vertical' },
            { prompt: 'Flip the triangle from top to bottom. Letter: __.', guide: 'horizontal' }
        ];
        const problems: Problem[] = arrayCreate(({ index }) => {
            const question = questions[index];
            return question && {
                id: index + 7,
                type: 'shape-fixture',
                prompt: question.prompt,
                answer: 'PRIVATE SHAPE ANSWER',
                shapeTransformation: { ...figure, guide: question.guide }
            };
        });
        render(<PrintableSheet {...heading} problems={problems} single pageLabel="Page 2 of 3" />);
        const page = screen.getByTestId('printed-sheet');
        const grid = page.children[2];

        expect(page.children[0].textContent).toBe('Year 3 - Shape TransformationsFlips and quarter turnsName: Date: ');
        expect(page.lastElementChild!.textContent).toBe('Maths SheetsPage 2 of 3');
        expect(declarations(grid, ['grid-template-columns'])).toEqual({ 'grid-template-columns': '1fr' });
        expect(arrayCreate(({ index }) => grid.children[index]?.firstElementChild?.textContent)).toEqual([
            '7.', '8.', '9.', '10.', '11.', '12.'
        ]);
        expect(arrayCreate(({ index }) => grid.children[index]?.lastElementChild?.textContent)).toEqual([
            'Flip the triangle across the vertical mirror line. Letter: .OriginalABCD',
            'Flip the triangle across the horizontal mirror line. Letter: .OriginalABCD',
            'Turn the triangle 90 degrees clockwise about the dot. Letter: .OriginalABCD',
            'Turn the triangle 90 degrees anticlockwise about the dot. Letter: .OriginalABCD',
            'Flip the triangle from left to right. Letter: .OriginalABCD',
            'Flip the triangle from top to bottom. Letter: .OriginalABCD'
        ]);
        expect(page.querySelectorAll('svg').length).toBe(30);
        arrayEach([...grid.children], ({ value: row }) => {
            const text = row.lastElementChild!;
            expect(text.tagName).toBe('SPAN');
            expect(declarations(text, textProperties)).toEqual(illustratedText);
            expect(declarations(text.children[0], ['min-width'])).toEqual({ 'min-width': '38px' });
            expect(text.children[1].textContent).toBe('OriginalABCD');
            expect(text.children[1].tagName).toBe('SPAN');
            expect(text.childNodes[2].textContent).toBe('.');
        });
        expect(page.querySelector('[style]')).toBe(null);
    });

    // Optional illustration and answerLine are independent. A wide inline
    // blank must survive too, and changing private answers cannot alter DOM.
    it.each([false, true])('preserves blanks and bottom answer space without a footer (illustrated: %s)', (illustrated) => {
        const problem: Problem = {
            id: 25,
            type: 'fixture',
            prompt: 'Choose __, then explain.',
            answer: 'PRIVATE ANSWER ONE',
            wideBlanks: true,
            answerLine: true,
            ...(illustrated ? { shapeTransformation: figure } : {})
        };
        const { rerender } = render(<PrintableSheet {...heading} problems={[problem]} single />);
        const page = screen.getByTestId('printed-sheet');
        const text = page.children[2].children[0].lastElementChild!;
        expect(page.children.length).toBe(3);
        expect(page.textContent).toBe(
            'Year 3 - Shape TransformationsFlips and quarter turnsName: Date: 25.Choose , then explain.' +
            (illustrated ? 'OriginalABCD' : '')
        );
        expect(contentNodes(text)).toEqual([
            { name: '#text', text: 'Choose ' },
            { name: 'SPAN', text: '' },
            { name: '#text', text: ', then explain.' },
            ...(illustrated ? [{ name: 'SPAN', text: 'OriginalABCD' }] : []),
            { name: 'SPAN', text: '' }
        ]);
        expect(declarations(text, textProperties)).toEqual(illustrated ? illustratedText : legacyText);
        expect(declarations(text.children[0], ['min-width'])).toEqual({ 'min-width': '140px' });
        expect(declarations(text.lastElementChild!, ['display', 'height', 'margin-top'])).toEqual({
            display: 'block', height: '1.2em', 'margin-top': '12px'
        });
        expect(getComputedStyle(text.lastElementChild!).borderBottomWidth).toBe('2px');
        const originalMarkup = page.outerHTML;
        rerender(<PrintableSheet {...heading} problems={[{ ...problem, answer: 'PRIVATE ANSWER TWO' }]} single />);
        expect(page.outerHTML).toBe(originalMarkup);
    });

    // The clock section of plugins/plugins.test.tsx covers the real worksheet.
    // Pin the legacy drawn/blank face geometry and prompt order here so shape
    // integration cannot restyle clocks or replace pure-text conversion rows.
    it('keeps reading clocks, blank drawing faces and text-only clock questions unchanged', () => {
        const problems: Problem[] = [
            { id: 1, type: 'clock', prompt: 'Write the digital time: __.', answer: '3:00', clock: { hour: 3, minute: 0 }, wideBlanks: true },
            { id: 2, type: 'clock', prompt: "Draw the hands to show 3 o'clock.", answer: 'PRIVATE ANSWER', clock: { hour: 3, minute: 0, hands: false } },
            { id: 3, type: 'clock', prompt: 'Write 3:00 in words:', answer: 'PRIVATE ANSWER', answerLine: true }
        ];
        render(<PrintableSheet title="Year 2 - Clock Faces" subtitle="Reading and drawing clocks" testId="printed-sheet" problems={problems} />);
        const page = screen.getByTestId('printed-sheet');
        const grid = page.children[2];
        const images = screen.getAllByRole('img');
        const numerals = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

        expect(page.textContent).toBe(
            'Year 2 - Clock FacesReading and drawing clocksName: Date: ' +
            "1.123456789101112Write the digital time: .2.123456789101112Draw the hands to show 3 o'clock.3.Write 3:00 in words:"
        );
        expect(arrayCreate(({ index }) => {
            const image = images[index];
            if (!image) return undefined;
            const circles = image.querySelectorAll('circle');
            const numbers = image.querySelectorAll('text');
            return {
                name: image.getAttribute('aria-label'),
                viewBox: image.getAttribute('viewBox'),
                width: image.getAttribute('width'),
                height: image.getAttribute('height'),
                lines: image.querySelectorAll('line').length,
                circles: arrayCreate(({ index: circleIndex }) => circles[circleIndex]?.outerHTML),
                numbers: arrayCreate(({ index: numberIndex }) => numbers[numberIndex]?.textContent)
            };
        })).toEqual([
            {
                name: 'clock showing 3:00', viewBox: '0 0 64 64', width: '100', height: '100', lines: 14,
                circles: [
                    '<circle cx="32" cy="32" r="30" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"></circle>',
                    '<circle cx="32" cy="32" r="2" fill="#1a1a1a"></circle>'
                ],
                numbers: numerals
            },
            {
                name: 'blank clock face', viewBox: '0 0 64 64', width: '100', height: '100', lines: 12,
                circles: ['<circle cx="32" cy="32" r="30" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"></circle>'],
                numbers: numerals
            }
        ]);
        const hands = images[0].querySelectorAll('line[stroke-width="3.5"], line[stroke-width="2.5"]');
        expect(arrayCreate(({ index }) => hands[index]?.outerHTML)).toEqual([
            '<line x1="32" y1="32" x2="45" y2="32" stroke="#1a1a1a" stroke-width="3.5" stroke-linecap="round"></line>',
            '<line x1="32" y1="32" x2="32" y2="10" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round"></line>'
        ]);
        expect(contentNodes(grid.children[0])).toEqual([
            { name: 'SPAN', text: '1.' },
            { name: 'SPAN', text: '123456789101112' },
            { name: 'SPAN', text: 'Write the digital time: .' }
        ]);
        expect(contentNodes(grid.children[1])).toEqual([
            { name: 'SPAN', text: '2.' },
            { name: 'SPAN', text: '123456789101112' },
            { name: 'SPAN', text: "Draw the hands to show 3 o'clock." }
        ]);
        expect(contentNodes(grid.children[2])).toEqual([
            { name: 'SPAN', text: '3.' },
            { name: 'SPAN', text: 'Write 3:00 in words:' }
        ]);
        arrayEach([...grid.children], ({ value: row }) => {
            expect(declarations(row.lastElementChild!, textProperties)).toEqual(legacyText);
        });
        expect(page.querySelectorAll('polygon').length).toBe(0);
    });
});
