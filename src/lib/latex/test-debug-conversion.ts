/**
 * Debug script - test what happens when user edits visual mode
 */

import { LaTeXConverter } from './LaTeXConverter';

// Simulate what happens:
// 1. LaTeX is converted to HTML
// 2. User edits (adds a word)
// 3. Tiptap generates new HTML with modification
// 4. toLaTeX() converts back

const originalLaTeX = `\\section{Introduction}
some paragraph with text`;

console.log('='.repeat(80));
console.log('ORIGINAL LaTeX:');
console.log(originalLaTeX);
console.log('');

// Step 1: toHTML()
const html = LaTeXConverter.toHTML(originalLaTeX);
console.log('='.repeat(80));
console.log('HTML from toHTML():');
console.log(html);
console.log('');

// Simulate Tiptap modification (user adds "new " to the paragraph)
// Tiptap might wrap text in <p>, preserve data-type spans, etc.
const modifiedHTML = html.replace('some paragraph', 'some new paragraph');
console.log('='.repeat(80));
console.log('Modified HTML (user added "new "):');
console.log(modifiedHTML);
console.log('');

// Step 2: toLaTeX()
const restoredLatex = LaTeXConverter.toLaTeX(modifiedHTML);
console.log('='.repeat(80));
console.log('RESTORED LaTeX:');
console.log(restoredLatex);
console.log('');

console.log('='.repeat(80));
console.log('COMPARISON:');
console.log('Match:', originalLaTeX.includes('some paragraph') && restoredLatex.includes('some new paragraph'));
