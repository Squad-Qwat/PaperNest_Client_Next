import { DiffMatchPatch } from 'diff-match-patch-ts'

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

/**
 * Performs an anti-stale Git-style 3-Way Fuzzy Merge using Google's Diff-Match-Patch algorithm.
 * Recommends changes from original -> modified to be applied to current document, tolerating
 * concurrent modifications.
 */
export function fuzzyDiff3WayMerge(
	original: string,
	modified: string,
	current: string
): { success: boolean; result: string; reason?: string } {
	if (original === modified) {
		return { success: true, result: current }
	}
	if (original === current) {
		return { success: true, result: modified }
	}

	try {
		const dmp = new DiffMatchPatch()

		// Configure DMP for robust and fuzzy matching
		dmp.Patch_Margin = 8 // Default is 4. Increase to handle slightly larger gaps
		dmp.Match_Threshold = 0.5 // Higher values are more fuzzy (default 0.5)

		// 1. Generate patches representing original -> modified transition
		const patches = dmp.patch_make(original, modified)
		if (patches.length === 0) {
			return { success: true, result: current }
		}

		// 2. Apply patches to current document fuzzily
		const [newText, results] = dmp.patch_apply(patches, current)
		const allApplied = results.every((r: boolean) => r === true)

		if (allApplied) {
			return { success: true, result: newText }
		} else {
			const failedCount = results.filter((r: boolean) => !r).length
			return {
				success: false,
				result: newText, // Return the best-effort merge result
				reason: `conflict: ${failedCount} of ${patches.length} hunks failed to apply`,
			}
		}
	} catch (error) {
		console.error('[Diff3WayMerge] Failed to execute fuzzy merge:', error)
		return { success: false, result: modified, reason: 'merge_execution_error' }
	}
}
