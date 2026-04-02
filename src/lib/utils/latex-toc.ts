'use client'

// Utility to parse LaTeX headings/sections
export interface TableOfContentsEntry {
	command: 'chapter' | 'section' | 'subsection' | 'subsubsection'
	heading: string
	level: number
	position: number
}

export function parseLatexSections(content: string): TableOfContentsEntry[] {
	if (!content) return []

	const pattern = /\\(chapter|section|subsection|subsubsection)\{([^}]+)\}/g
	const entries: TableOfContentsEntry[] = []
	let match

	while ((match = pattern.exec(content)) !== null) {
		const command = match[1] as 'chapter' | 'section' | 'subsection' | 'subsubsection'
		entries.push({
			command,
			heading: match[2],
			level: getLevelNumber(command),
			position: match.index,
		})
	}

	return entries
}

function getLevelNumber(command: string): number {
	switch (command) {
		case 'chapter':
			return 0
		case 'section':
			return 1
		case 'subsection':
			return 2
		case 'subsubsection':
			return 3
		default:
			return 4
	}
}
