import type { CompletionContext, CompletionResult } from '@codemirror/autocomplete'

/**
 * Curated list of common LaTeX commands and environments.
 */
const LATEX_COMMANDS = [
	// Environments
	{ label: '\\begin{equation}', type: 'keyword', detail: 'math equation block' },
	{ label: '\\begin{figure}', type: 'keyword', detail: 'figure environment' },
	{ label: '\\begin{table}', type: 'keyword', detail: 'table environment' },
	{ label: '\\begin{itemize}', type: 'keyword', detail: 'bulleted list' },
	{ label: '\\begin{enumerate}', type: 'keyword', detail: 'numbered list' },
	{ label: '\\begin{align}', type: 'keyword', detail: 'aligned math block' },

	// Structure
	{ label: '\\documentclass', type: 'keyword', detail: 'document class' },
	{ label: '\\usepackage', type: 'keyword', detail: 'import package' },
	{ label: '\\title', type: 'keyword', detail: 'document title' },
	{ label: '\\author', type: 'keyword', detail: 'author name' },
	{ label: '\\date', type: 'keyword', detail: 'document date' },
	{ label: '\\maketitle', type: 'keyword', detail: 'generate title header' },
	{ label: '\\section', type: 'keyword', detail: 'section heading' },
	{ label: '\\subsection', type: 'keyword', detail: 'subsection heading' },
	{ label: '\\subsubsection', type: 'keyword', detail: 'subsubsection heading' },

	// Text Formatting
	{ label: '\\textbf', type: 'keyword', detail: 'bold text' },
	{ label: '\\textit', type: 'keyword', detail: 'italic text' },
	{ label: '\\underline', type: 'keyword', detail: 'underlined text' },
	{ label: '\\emph', type: 'keyword', detail: 'emphasized text' },
	{ label: '\\centering', type: 'keyword', detail: 'center alignment' },

	// References & Citations
	{ label: '\\cite', type: 'keyword', detail: 'insert citation' },
	{ label: '\\ref', type: 'keyword', detail: 'insert cross-reference' },
	{ label: '\\label', type: 'keyword', detail: 'insert label marker' },
	{ label: '\\href', type: 'keyword', detail: 'hyperlink with text' },
	{ label: '\\url', type: 'keyword', detail: 'raw URL link' },
	{ label: '\\includegraphics', type: 'keyword', detail: 'insert image file' },

	// Helpers
	{ label: '\\item', type: 'keyword', detail: 'list item' },
	{ label: '\\begin', type: 'keyword', detail: 'custom environment begin' },
	{ label: '\\end', type: 'keyword', detail: 'custom environment end' },
]

/**
 * Autocompletion source for LaTeX commands starting with '\'.
 */
export function latexAutocompleteSource(context: CompletionContext): CompletionResult | null {
	// Match words starting with a backslash
	const word = context.matchBefore(/\\[a-zA-Z]*/)
	if (!word || (word.from === word.to && !context.explicit)) return null

	return {
		from: word.from,
		options: LATEX_COMMANDS,
		validFor: /^\\[a-zA-Z]*$/,
	}
}
