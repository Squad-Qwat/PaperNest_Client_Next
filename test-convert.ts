import { LaTeXConverter } from './src/lib/latex/LaTeXConverter';

const testLatex = `
\\begin{table}[h]
\\centering
\\caption{Distribusi Topik AIEd (2018--2024)}
\\label{tab:tren}
\\small
\\begin{tabular}{@{}lcc@{}}
\\toprule
\\textbf{Aplikasi AI} & \\textbf{Jumlah} & \\textbf{(\\%)} \\\\
\\midrule
Sistem Tutor Cerdas  & 28 & 32,9 \\\\
Analitik Pembelajaran & 21 & 24,7 \\\\
Penilaian Otomatis   & 18 & 21,2 \\\\
Asisten Virtual      & 11 & 12,9 \\\\
Lainnya              & 7 & 8,2 \\\\
\\midrule
\\textbf{Total}      & 85 & 100 \\\\
\\bottomrule
\\end{tabular}
\\end{table}
`;

console.log("--- HTML OUTPUT ---");
console.log(LaTeXConverter.toHTML(testLatex));
