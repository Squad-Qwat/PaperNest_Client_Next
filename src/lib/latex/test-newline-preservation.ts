/**
 * Test file untuk LaTeX Newline Preservation
 * Verifikasi bahwa single newlines tidak hilang selama round-trip conversion
 * Run: npx tsx src/lib/latex/test-newline-preservation.ts
 */

import { LaTeXConverter } from './LaTeXConverter';

// Test cases
const testCases = [
  {
    name: 'Test 1: Single Newline Between Comment and Section',
    latex: `\begin{document}
% This is a comment
\section{Title}
Body text
\end{document}`,
  },
  {
    name: 'Test 2: Your Real Document Issue',
    latex: `\begin{document}% [block] Edit in Source Mode
% \section{Pendahuluan}
Perkembangan...
\end{document}`,
  },
  {
    name: 'Test 3: Mixed Newline Types',
    latex: `\section{Title}
Body text


Next paragraph
\centering
More text`,
  },
  {
    name: 'Test 4: Comments with Following Content',
    latex: `% Comment line
\textbf{Bold text}

Another paragraph`,
  },
  {
    name: 'Test 5: Multiple Commands with Single Newlines',
    latex: `\large
\bfseries
\color{red}
Text content`,
  },
];

console.log('='.repeat(80));
console.log('LATEX NEWLINE PRESERVATION TESTS');
console.log('='.repeat(80));
console.log('\n');

testCases.forEach((testCase, index) => {
  console.log(`\n${'─'.repeat(80)}`);
  console.log(`${testCase.name}`);
  console.log(`${'─'.repeat(80)}`);

  // Step 1: Show original
  console.log('\n📄 ORIGINAL LATEX:');
  console.log(`\`\`\`\n${testCase.latex}\n\`\`\``);

  // Step 2: Convert to HTML
  const html = LaTeXConverter.toHTML(testCase.latex);
  console.log('\n🔄 HTML INTERMEDIATE:');
  // Show only first 500 chars for readability
  const htmlPreview = html.length > 500 ? html.substring(0, 500) + '...' : html;
  console.log(`\`\`\`\n${htmlPreview}\n\`\`\``);

  // Check for newline markers
  const newlineMarkersCount = (html.match(/data-type="latex-newline"/g) || []).length;
  console.log(`\n🔍 Found ${newlineMarkersCount} latex-newline markers`);

  // Step 3: Convert back to LaTeX
  const restored = LaTeXConverter.toLaTeX(html);
  console.log('\n✨ RESTORED LATEX:');
  console.log(`\`\`\`\n${restored}\n\`\`\``);

  // Step 4: Compare
  console.log('\n📊 COMPARISON:');
  const normalize = (s: string) => s.trim().replace(/\r\n/g, '\n');
  const originalNorm = normalize(testCase.latex);
  const restoredNorm = normalize(restored);

  if (originalNorm === restoredNorm) {
    console.log('✅ PERFECT MATCH - Newlines preserved correctly!');
  } else {
    console.log('❌ MISMATCH - Content differs:');
    console.log('\nOriginal lines:');
    originalNorm.split('\n').forEach((line, i) => {
      console.log(`  ${i + 1}: "${line}"`);
    });
    console.log('\nRestored lines:');
    restoredNorm.split('\n').forEach((line, i) => {
      console.log(`  ${i + 1}: "${line}"`);
    });

    // Find first difference
    const origLines = originalNorm.split('\n');
    const restLines = restoredNorm.split('\n');
    for (let i = 0; i < Math.max(origLines.length, restLines.length); i++) {
      if (origLines[i] !== restLines[i]) {
        console.log(`\n❌ First difference at line ${i + 1}:`);
        console.log(`   Original:  "${origLines[i]}"`);
        console.log(`   Restored:  "${restLines[i]}"`);
        break;
      }
    }
  }

  // Detailed check: count newlines
  const origNewlines = (testCase.latex.match(/\n/g) || []).length;
  const restNewlines = (restored.match(/\n/g) || []).length;
  console.log(`\nNewline count: Original=${origNewlines}, Restored=${restNewlines}`);
  if (origNewlines === restNewlines) {
    console.log('✅ Newline count matches');
  } else {
    console.log(`❌ Newline count mismatch: lost ${origNewlines - restNewlines} newlines`);
  }
});

console.log('\n' + '='.repeat(80));
console.log('TEST SUMMARY');
console.log('='.repeat(80));
console.log('\nTests completed. Check each test case above to verify preservation.');
