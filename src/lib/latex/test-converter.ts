/**
 * Test file untuk LaTeXConverter
 * Untuk run: npx tsx src/lib/latex/test-converter.ts
 */

import { LaTeXConverter } from './LaTeXConverter';

const testLatex = `% ═════════════════════════════════════════════════════════════════════════════
\\begin{document}

% ─── Judul (satu kolom penuh) ────────────────────────────────────────────────
\\twocolumn[
  \\begin{@twocolumnfalse}
    \\begin{center}
      {\\LARGE\\bfseries\\color{aksen}
        Kecerdasan Buatan dalam Pendidikan Modern:
        Peluang, Tantangan, dan Arah Pengembangan
      }

      \\vspace{10pt}
      {\\large Ahmad Fauzi\$^{1}\$, Siti Rahayu\$^{2}\$, Budi Santoso\$^{3}\$}

      \\vspace{6pt}
      {\\small
        \$^{1}\$Departemen Ilmu Komputer, Universitas Indonesia, Jakarta\\newline
        \$^{2}\$Fakultas Keguruan dan Ilmu Pendidikan, Universitas Gadjah Mada, Yogyakarta\\newline
        \$^{3}\$Program Studi Teknologi Pendidikan, Institut Teknologi Bandung, Bandung

        \\vspace{4pt}
        \\textit{Korespondensi: \\href{mailto:ahmad.fauzi@ui.ac.id}{ahmad.fauzi@ui.ac.id}}
      }

      \\vspace{10pt}
      \\hrule height 1pt
      \\vspace{8pt}
      \\begin{abstract}
        Artikel ini mengkaji peran kecerdasan buatan (AI) dalam transformasi
        sistem pendidikan modern di Indonesia. Dengan menggunakan pendekatan
        studi literatur komprehensif terhadap 85 artikel ilmiah dari tahun
        2018 hingga 2024, penelitian ini menemukan bahwa penerapan AI di
        bidang pendidikan mampu meningkatkan efektivitas pembelajaran hingga
        34\\% dibandingkan metode konvensional. Namun demikian, sejumlah
        tantangan kritis masih dihadapi, meliputi kesenjangan infrastruktur
        digital, kesiapan tenaga pendidik, serta isu privasi data peserta
        didik. Artikel ini juga memaparkan model integrasi AI yang adaptif
        dan berkeadilan untuk konteks pendidikan Indonesia.

        \\vspace{4pt}
        \\noindent\\textbf{Kata Kunci:} kecerdasan buatan, pendidikan, pembelajaran
        adaptif, teknologi pendidikan, transformasi digital
      \\end{abstract}
      \\vspace{8pt}
      \\hrule height 0.5pt
      \\vspace{12pt}
    \\end{center}
  \\end{@twocolumnfalse}
]`;

console.log('='.repeat(80));
console.log('ORIGINAL LATEX:');
console.log('='.repeat(80));
console.log(testLatex);
console.log('\n');

console.log('='.repeat(80));
console.log('STEP 1: LaTeX → HTML');
console.log('='.repeat(80));
const html = LaTeXConverter.toHTML(testLatex);
console.log(html);
console.log('\n');

console.log('='.repeat(80));
console.log('STEP 2: HTML → LaTeX (RESTORED)');
console.log('='.repeat(80));
const restored = LaTeXConverter.toLaTeX(html);
console.log(restored);
console.log('\n');

console.log('='.repeat(80));
console.log('COMPARISON:');
console.log('='.repeat(80));

// Compare key elements
const checks = [
    { pattern: /\\vspace\{10pt\}/, name: '\\vspace{10pt}' },
    { pattern: /\\small/, name: '\\small' },
    { pattern: /\\LARGE/, name: '\\LARGE' },
    { pattern: /\\large/, name: '\\large' },
    { pattern: /\\bfseries/, name: '\\bfseries' },
    { pattern: /\\color\{aksen\}/, name: '\\color{aksen}' },
    { pattern: /\\textit/, name: '\\textit' },
    { pattern: /\\href\{mailto/, name: '\\href{...}{...}' },
    { pattern: /\\hrule height 1pt/, name: '\\hrule height 1pt' },
    { pattern: /\\noindent\s*\\textbf/, name: '\\noindent\\textbf (with optional space)' },
    { pattern: /\\newline/, name: '\\newline' },
    { pattern: /\$\^\{1\}\$/, name: '$^{1}$ (math mode)' },
    { pattern: /\\begin\{@twocolumnfalse\}/, name: '\\begin{@twocolumnfalse}' },
    { pattern: /\\end\{@twocolumnfalse\}/, name: '\\end{@twocolumnfalse}' },
    { pattern: /\\begin\{center\}/, name: '\\begin{center}' },
    { pattern: /\\end\{center\}/, name: '\\end{center}' },
    { pattern: /\\begin\{abstract\}/, name: '\\begin{abstract}' },
    { pattern: /\\end\{abstract\}/, name: '\\end{abstract}' },
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
