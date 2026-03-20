/**
 * Integration test untuk Tiptap + LaTeX Extensions
 * Run: npx tsx src/lib/latex/test-tiptap-integration.ts
 */

import { createEditor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { LaTeXConverter } from './LaTeXConverter';

// Import extensions (simulate what LatexVisualEditor does)
import {
    LaTeXFontSize,
    LaTeXFontStyle,
    LaTeXColor,
    LaTeXLayoutCommand,
    LaTeXDocumentCommand,
    LaTeXComment,
    LaTeXEnvironment,
    LaTeXTwocolumn,
    LaTeXBrace
} from '../../components/document/tiptap/LaTeXExtensions';

const testLatex = `% Test comment
\\section{Test Section}

{\\LARGE\\bfseries\\color{aksen}
  Large Bold Colored Title
}

\\vspace{10pt}

{\\large Author Names: Ahmad$^{1}$, Budi$^{2}$}

\\vspace{6pt}
\\hrule height 1pt
\\vspace{8pt}

\\noindent\\textbf{Keywords:} AI, education, technology

Test paragraph dengan \\textit{italic text} dan \\textbf{bold text}.`;

console.log('='.repeat(80));
console.log('ORIGINAL LATEX:');
console.log('='.repeat(80));
console.log(testLatex);
console.log('\n');

// Step 1: Convert LaTeX to HTML
console.log('='.repeat(80));
console.log('STEP 1: LaTeX → HTML (via LaTeXConverter)');
console.log('='.repeat(80));
const html = LaTeXConverter.toHTML(testLatex);
console.log(html);
console.log('\n');

// Step 2: Create Tiptap editor with extensions
console.log('='.repeat(80));
console.log('STEP 2: Load HTML into Tiptap Editor');
console.log('='.repeat(80));

const editor = createEditor({
    extensions: [
        StarterKit,
        LaTeXFontSize,
        LaTeXFontStyle,
        LaTeXColor,
        LaTeXLayoutCommand,
        LaTeXDocumentCommand,
        LaTeXComment,
        LaTeXEnvironment,
        LaTeXTwocolumn,
        LaTeXBrace
    ],
    content: html,
});

console.log('✅ Tiptap editor created with LaTeX extensions');
console.log('\n');

// Step 3: Get HTML from Tiptap (after processing)
console.log('='.repeat(80));
console.log('STEP 3: Get HTML from Tiptap (after processing)');
console.log('='.repeat(80));
const tiptapHTML = editor.getHTML();
console.log(tiptapHTML);
console.log('\n');

// Step 4: Convert back to LaTeX
console.log('='.repeat(80));
console.log('STEP 4: HTML → LaTeX (RESTORED)');
console.log('='.repeat(80));
const restored = LaTeXConverter.toLaTeX(tiptapHTML);
console.log(restored);
console.log('\n');

// Step 5: Comparison
console.log('='.repeat(80));
console.log('COMPARISON:');
console.log('='.repeat(80));

const checks = [
    { pattern: /\\LARGE/, name: '\\LARGE' },
    { pattern: /\\large/, name: '\\large' },
    { pattern: /\\bfseries/, name: '\\bfseries' },
    { pattern: /\\color\{aksen\}/, name: '\\color{aksen}' },
    { pattern: /\\vspace\{10pt\}/, name: '\\vspace{10pt}' },
    { pattern: /\\vspace\{6pt\}/, name: '\\vspace{6pt}' },
    { pattern: /\\vspace\{8pt\}/, name: '\\vspace{8pt}' },
    { pattern: /\\hrule height 1pt/, name: '\\hrule height 1pt' },
    { pattern: /\\noindent/, name: '\\noindent' },
    { pattern: /\\textbf\{Keywords:\}/, name: '\\textbf{Keywords:}' },
    { pattern: /\\textit\{italic text\}/, name: '\\textit{italic text}' },
    { pattern: /\$\^{1}\$/, name: '$^{1}$ (math)' },
    { pattern: /%\s*Test comment/, name: '% comment' },
];

let passCount = 0;
checks.forEach(check => {
    const present = check.pattern.test(restored);
    const status = present ? '✅' : '❌';
    console.log(`${status} ${check.name}: ${present ? 'PRESERVED' : 'MISSING'}`);
    if (present) passCount++;
});

console.log('\n');
console.log(`Result: ${passCount}/${checks.length} checks passed`);

// Cleanup
editor.destroy();
