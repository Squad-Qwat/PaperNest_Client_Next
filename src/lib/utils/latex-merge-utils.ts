/**
 * Normalizes text for resilient comparison by:
 * 1. Converting CRLF to LF
 * 2. Trimming trailing whitespace on every line
 * 3. Trimming the overall document
 */
export const normalizeText = (text: string): string => {
	return text
		.replace(/\r\n/g, '\n')
		.split('\n')
		.map((line) => line.trimEnd())
		.join('\n')
		.trim()
}

/**
 * Applies a list of text ranges to a string in reverse order
 */
export const applyRangesToText = (
	text: string,
	ranges: Array<{ from: number; to: number; insert: string }>
): string => {
	let next = text
	const sortedDesc = [...ranges].sort((a, b) => b.from - a.from)
	for (const range of sortedDesc) {
		next = next.slice(0, range.from) + range.insert + next.slice(range.to)
	}
	return next
}

/**
 * Signature helper for merge items
 */
export const getMergeSignature = (data: any): string => {
	const search = Array.isArray(data.searchBlock) ? data.searchBlock.join('\u241f') : ''
	const replace = Array.isArray(data.replaceBlock) ? data.replaceBlock.join('\u241f') : ''
	return `${data.description || ''}\u241e${data.original}\u241e${data.modified}\u241e${search}\u241e${replace}`
}
