/**
 * Debug - test complex structures
 */

import { LaTeXConverter } from './LaTeXConverter';

const testCases = [
    // Test 1: Math modes with brackets
    {
        name: 'Math with brackets',
        latex: `Some text with math: $x = [1, 2, 3]$ more text`
    },
    // Test 2: Commands with square brackets
    {
        name: 'Commands with optional params',
        latex: `\\begin{figure}[htbp]
\\includegraphics[width=0.5\\textwidth]{image.png}
\\caption{A figure}
\\end{figure}`
    },
    // Test 3: Mixed structures
    {
        name: 'Mixed itemize + math',
        latex: `\\begin{itemize}
\\item First $x = 1$
\\item Second $y = [2]$
\\end{itemize}`
    }
];

testCases.forEach(test => {
    console.log('\\n' + '='.repeat(80));
    console.log(`TEST: ${test.name}`);
    console.log('='.repeat(80));

    try {
        const html = LaTeXConverter.toHTML(test.latex);
        const restored = LaTeXConverter.toLaTeX(html);

        console.log('Original:', test.latex.replace(/\\n/g, ' | '));
        console.log('');
        console.log('HTML:', html);
        console.log('');
        console.log('Restored:', restored.replace(/\\n/g, ' | '));
        console.log('');
        console.log('Match:', test.latex === restored);

        if (test.latex !== restored) {
            console.log('MISMATCH DETAILS:');
            console.log('Missing:', test.latex.split('\\n').filter(l => !restored.includes(l)));
            console.log('Extra:', restored.split('\\n').filter(l => !test.latex.includes(l)));
        }
    } catch (e: any) {
        console.log('ERROR:', e.message);
    }
});
