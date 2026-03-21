'use client'

/**
 * Editor-side Tool Execution
 * These functions run in the browser and interact with the CodeMirror/LaTeX editor.
 * TipTap editor support has been removed - now LaTeX/CodeMirror only.
 */

/**
 * Find all occurrences of text in the document with optional limit for early exit
 */
export const findTextPositions = (
	editor: any,
	searchText: string,
	caseSensitive = false,
	limit?: number
): Array<{ from: number; to: number }> => {
	const positions: Array<{ from: number; to: number }> = []
	const doc = editor.state.doc
	const maxPositions = limit || 1000 // Default limit to prevent excessive traversal

	doc.descendants((node: any, pos: number) => {
		if (positions.length >= maxPositions) {
			return false // Early exit
		}

		if (node.isText && node.text) {
			const nodeText = caseSensitive ? node.text : node.text.toLowerCase()
			const search = caseSensitive ? searchText : searchText.toLowerCase()

			let index = nodeText.indexOf(search)
			while (index !== -1 && positions.length < maxPositions) {
				positions.push({
					from: pos + index,
					to: pos + index + searchText.length,
				})
				index = nodeText.indexOf(search, index + 1)
			}
		}
	})

	return positions
}

/**
 * Check if a paragraph node looks like a heading
 */
export const isHeadingLikeParagraph = (node: any): boolean => {
	if (node.type.name !== 'paragraph') return false
	if (!node.content || node.content.size === 0) return false

	let hasBold = false
	node.content.forEach((child: any) => {
		if (child.marks?.some((mark: any) => mark.type.name === 'bold')) hasBold = true
	})

	let hasLargeFont = false
	node.content.forEach((child: any) => {
		if (child.marks) {
			const textStyleMark = child.marks.find((mark: any) => mark.type.name === 'textStyle')
			if (textStyleMark?.attrs?.fontSize) {
				const fontSize = textStyleMark.attrs.fontSize
				if (fontSize.includes('px') && parseInt(fontSize) >= 16) hasLargeFont = true
				else if (fontSize.includes('pt') && parseInt(fontSize) >= 12) hasLargeFont = true
			}
		}
	})

	const text = node.textContent
	const isAllCaps = text === text.toUpperCase() && text.length > 3

	return hasBold && (hasLargeFont || isAllCaps)
}

/**
 * Find section range by heading text
 */
export const findSectionRange = (
	editor: any,
	headingText: string
): { from: number; to: number; found: boolean; headingEnd: number } => {
	const doc = editor.state.doc
	const searchText = headingText.toLowerCase().trim()

	let sectionStart = -1
	let sectionEnd = -1
	let headingEnd = -1
	let foundHeading = false
	let currentPos = 0

	doc.content.forEach((node: any, offset: number) => {
		const nodeStart = currentPos
		const nodeEnd = currentPos + node.nodeSize

		const isHeading = node.type.name === 'heading'
		const isFakeHeading = isHeadingLikeParagraph(node)

		if (isHeading || isFakeHeading) {
			const nodeText = node.textContent.toLowerCase().trim()

			if (foundHeading && sectionEnd === -1) {
				sectionEnd = nodeStart
			}

			if (!foundHeading && (nodeText.includes(searchText) || searchText.includes(nodeText))) {
				sectionStart = nodeStart
				headingEnd = nodeEnd
				foundHeading = true
			}
		}

		currentPos = nodeEnd
	})

	if (foundHeading && sectionEnd === -1) {
		sectionEnd = doc.content.size
	}

	return {
		from: sectionStart,
		to: sectionEnd,
		headingEnd: headingEnd,
		found: foundHeading,
	}
}

/**
 * Find paragraph containing specific text
 */
export const findParagraphContaining = (
	editor: any,
	containsText: string,
	nodeType = 'any'
): { from: number; to: number; found: boolean } => {
	const doc = editor.state.doc
	const searchText = containsText.toLowerCase()
	let result = { from: -1, to: -1, found: false }

	doc.descendants((node: any, pos: number) => {
		if (result.found) return false

		const nodeTypeName = node.type.name
		const isMatch =
			nodeType === 'any' ||
			(nodeType === 'paragraph' && nodeTypeName === 'paragraph') ||
			(nodeType === 'listItem' && nodeTypeName === 'listItem')

		if (isMatch && node.textContent.toLowerCase().includes(searchText)) {
			result = { from: pos, to: pos + node.nodeSize, found: true }
			return false
		}
	})

	return result
}

/**
 * Find exact text matches across multiple nodes
 */
export const findTextRangeExact = (editor: any, searchText: string): { from: number; to: number } | null => {
	const doc = editor.state.doc
	let text = ''
	const mapping: { textPos: number; docPos: number }[] = []

	// Build a map of text positions to document positions
	doc.descendants((node: any, pos: number) => {
		if (node.isText && node.text) {
			for (let i = 0; i < node.text.length; i++) {
				mapping.push({ textPos: text.length, docPos: pos + i })
				text += node.text[i]
			}
		} else if (node.isBlock) {
			// Add newline for block boundaries
			mapping.push({ textPos: text.length, docPos: pos })
			text += '\n'
		}
	})

	const normalizedSearch = searchText.replace(/\r\n/g, '\n')
	const matchIndex = text.indexOf(normalizedSearch)

	if (matchIndex !== -1) {
		const startMap = mapping[matchIndex]
		const endMap = mapping[Math.min(matchIndex + normalizedSearch.length - 1, mapping.length - 1)]

		if (startMap && endMap) {
			return {
				from: startMap.docPos,
				to: endMap.docPos + 1, // +1 because we want to include the last character
			}
		}
	}

	return null
}

type DiffPair = {
	index: number
	search: string
	replace: string
}

type DiffMatch = {
	pairIndex: number
	from: number
	to: number
	search: string
	replace: string
}

const parseApplyDiffPairs = (args: any): { pairs?: DiffPair[]; error?: string } => {
	const { searchBlock, replaceBlock } = args || {}

	if (!Array.isArray(searchBlock) || !Array.isArray(replaceBlock)) {
		return { error: 'Error: apply_diff_edit requires both searchBlock and replaceBlock as arrays of strings.' }
	}

	if (searchBlock.length !== replaceBlock.length) {
		return { error: `Error: apply_diff_edit requires equal length arrays. searchBlock.length=${searchBlock.length}, replaceBlock.length=${replaceBlock.length}.` }
	}

	if (searchBlock.length === 0) {
		return { error: 'Error: apply_diff_edit requires at least one pair.' }
	}

	const normalizeSpaces = (text: string): string => {
		return text
			.split('\n')
			.map((line) => line.trimEnd())
			.join('\n')
			.trimStart()
	}

	const pairs: DiffPair[] = []
	for (let i = 0; i < searchBlock.length; i++) {
		let search = searchBlock[i]
		let replace = replaceBlock[i]

		if (typeof search !== 'string' || typeof replace !== 'string') {
			return { error: `Error: apply_diff_edit expects string values in arrays. Invalid value at index ${i}.` }
		}

		if (search.length === 0) {
			return { error: `Error: apply_diff_edit searchBlock[${i}] cannot be empty.` }
		}

		search = normalizeSpaces(search)
		replace = normalizeSpaces(replace)

		pairs.push({ index: i, search, replace })
	}

	return { pairs }
}

const findAtomicDiffMatches = (docText: string, pairs: DiffPair[]): { matches?: DiffMatch[]; error?: string } => {
	const candidateMatchesByPair: DiffMatch[][] = []
	const isDeletionByPair: boolean[] = []

	for (const pair of pairs) {
		const candidates: DiffMatch[] = []
		let searchFrom = 0
		const isDeletion = pair.replace.length === 0

		while (searchFrom <= docText.length) {
			const index = docText.indexOf(pair.search, searchFrom)
			if (index === -1) break

			candidates.push({
				pairIndex: pair.index,
				from: index,
				to: index + pair.search.length,
				search: pair.search,
				replace: pair.replace,
			})

			// For deletions, use only first match (deterministic)
			if (isDeletion) {
				searchFrom = docText.length + 1
				break
			}

			searchFrom = index + 1
		}

		if (candidates.length === 0) {
			return {
				error: `error: apply_diff_edit FAILED at index ${pair.index} — search text not found.\nreason: searchBlock[${pair.index}] does not exist exactly in document.\ninstructions: Use search_text_lines and replace_lines for this block, then retry batch if needed.`,
			}
		}

		candidateMatchesByPair.push(candidates)
		isDeletionByPair.push(isDeletion)
	}

	if (pairs.length === 1 && candidateMatchesByPair[0].length > 1 && !isDeletionByPair[0]) {
		return {
			error: `error: apply_diff_edit FAILED at index ${pairs[0].index} — search text is ambiguous.\nreason: searchBlock[${pairs[0].index}] appears multiple times; batch replacement is unsafe.\ninstructions: Disambiguate with line-based tools (search_text_lines + replace_lines).`,
		}
	}

	const solutions: DiffMatch[][] = []
	const current: DiffMatch[] = []

	const backtrack = (pairIdx: number, minStart: number) => {
		if (pairIdx === candidateMatchesByPair.length) {
			solutions.push([...current])
			return
		}

		// For deletions, always use first match (deterministic, no backtracking)
		if (isDeletionByPair[pairIdx]) {
			const candidate = candidateMatchesByPair[pairIdx][0]
			if (candidate && candidate.from >= minStart) {
				current.push(candidate)
				backtrack(pairIdx + 1, candidate.to)
				current.pop()
			}
		} else {
			// For non-deletions: use GREEDY matching (first valid candidate only)
			// This avoids "ambiguous match" errors by always picking earliest match
			const validCandidates = candidateMatchesByPair[pairIdx].filter(c => c.from >= minStart)
			if (validCandidates.length > 0) {
				const candidate = validCandidates[0] // Greedy: take earliest
				current.push(candidate)
				backtrack(pairIdx + 1, candidate.to)
				current.pop()
			}
		}
	}

	backtrack(0, 0)

	if (solutions.length === 0) {
		return {
			error: `error: apply_diff_edit FAILED — overlapping or out-of-order batch ranges detected.\nreason: provided search blocks cannot be mapped to one non-overlapping sequence in document order.\ninstructions: split the operation into smaller ordered edits.`,
		}
	}

	// With greedy matching, should always have exactly 1 solution now
	// (no more "ambiguous match" errors)
	return { matches: solutions[0] }
}

const applyMatchesToText = (docText: string, matches: DiffMatch[]): string => {
	let result = docText
	const sortedDesc = [...matches].sort((a, b) => b.from - a.from)

	for (const match of sortedDesc) {
		result = result.slice(0, match.from) + match.replace + result.slice(match.to)
	}

	return result
}

/**
 * Primary tool execution dispatcher for AI interactions (CodeMirror/LaTeX only)
 */
/**
 * Primary tool execution dispatcher for AI interactions (CodeMirror/LaTeX only)
 */
export const executeEditorTool = async (
	editor: any,
	toolName: string,
	args: any,
	documentId?: string
): Promise<any> => {
	if (!editor) return 'Error: Editor not available'

	// Extract CodeMirror view from the editor wrapper provided by LatexEditor
	const view = editor.editor
	if (!view) return 'Error: CodeMirror view not available'

	try {
		switch (toolName) {
			case 'read_document': {
				const { fromLine, toLine, full } = args
				const isFull = full ?? true
				const doc = view.state.doc

				// Helper: format content with line numbers for LLM reference
				const withLineNumbers = (startLine: number, endLine: number): string => {
					const lines: string[] = []
					for (let i = startLine; i <= endLine; i++) {
						const lineNum = String(i).padStart(4, ' ')
						lines.push(`${lineNum} | ${doc.line(i).text}`)
					}
					return lines.join('\n')
				}

				if (isFull) {
					return `[Document Content (Full)]\nTotal Lines: ${doc.lines}\n\n` + withLineNumbers(1, doc.lines)
				}

				if (fromLine !== undefined) {
					const startLine = Math.max(1, fromLine)
					const endLine = toLine !== undefined ? Math.min(doc.lines, toLine) : Math.min(doc.lines, startLine + 100)

					return `[Document Slice: Lines ${startLine} to ${endLine}]\nTotal Lines: ${doc.lines}\n\n` + withLineNumbers(startLine, endLine)
				}

				// Default preview: first 50 lines with line numbers
				const previewEnd = Math.min(doc.lines, 50)
				return `[Document Preview: First 50 Lines]\nTotal Lines: ${doc.lines}\nNote: Use fromLine/toLine or full=true for more.\n\n` + withLineNumbers(1, previewEnd)
			}

			case 'get_sections': {
				const docText = view.state.doc.toString()
				const sectionRegex = /^\\(?:sub)*section\{([^}]+)\}/gm
				const sections: Array<{ text: string; level: number; line: number }> = []
				let match: RegExpExecArray | null

				while ((match = sectionRegex.exec(docText)) !== null) {
					const textBeforeMatch = docText.slice(0, match.index)
					const line = textBeforeMatch.split('\n').length
					const command = match[0].match(/^\\((?:sub)*)section/)?.[1] ?? ''
					const level = 1 + Math.floor(command.length / 3)

					sections.push({
						text: match[1],
						level,
						line,
					})
				}

				return JSON.stringify({
					sections,
					totalSections: sections.length,
				})
			}

			case 'get_document_stats': {
				const docText = view.state.doc.toString()
				const words = docText.trim().length === 0 ? 0 : docText.trim().split(/\s+/).length
				const readingTimeMinutes = Math.max(1, Math.ceil(words / 200))

				return JSON.stringify({
					characterCount: docText.length,
					lineCount: view.state.doc.lines,
					wordCount: words,
					estimatedReadingTimeMinutes: readingTimeMinutes,
				})
			}

			case 'search_text_lines': {
				const { query, caseSensitive } = args
				const doc = view.state.doc
				const results: { line: number; text: string }[] = []
				const searchString = caseSensitive ? query : query.toLowerCase()

				for (let i = 1; i <= doc.lines; i++) {
					const lineText = doc.line(i).text
					const compareText = caseSensitive ? lineText : lineText.toLowerCase()
					if (compareText.includes(searchString)) {
						results.push({ line: i, text: lineText })
					}
				}

				let output = `[Search Results for "${query}"]\n`
				output += `Match Count: ${results.length}\n`
				if (results.length >= 50) output += `Note: Showing first 50 matches.\n`
				output += `\n` + results.map(r => `${String(r.line).padStart(4, ' ')} | ${r.text}`).join('\n')

				return output
			}

			case 'replace_lines': {
				const { fromLine, toLine, newContent, stage } = args
				const doc = view.state.doc

				if (fromLine < 1 || toLine > doc.lines || fromLine > toLine) {
					return `Error: Invalid line range ${fromLine}-${toLine}. Total lines: ${doc.lines}`
				}

				const fromPos = doc.line(fromLine).from
				const toPos = doc.line(toLine).to

				if (stage) {
					const original = doc.toString()
					const prefix = doc.sliceString(0, fromPos)
					const suffix = doc.sliceString(toPos)
					return {
						type: 'staged_change',
						original,
						modified: prefix + newContent + suffix,
						description: `Replace lines ${fromLine}-${toLine}`
					}
				}

				view.dispatch({
					changes: { from: fromPos, to: toPos, insert: newContent },
					scrollIntoView: true
				})
				view.focus()
				return `Successfully replaced lines ${fromLine} to ${toLine}.`
			}

			case 'insert_content': {
				const { content, position, stage } = args
				const selection = view.state.selection.main
				let from = selection.from
				let to = selection.to

				if (position === 'start') { from = 0; to = 0; }
				else if (position === 'end') { from = view.state.doc.length; to = view.state.doc.length; }

				if (stage) {
					const doc = view.state.doc
					const prefix = doc.sliceString(0, from)
					const suffix = doc.sliceString(to)
					return {
						type: 'staged_change',
						original: doc.toString(),
						modified: prefix + content + suffix,
						description: `Insert content at ${position || 'cursor'}`
					}
				}

				view.dispatch({
					changes: { from, to, insert: content },
					selection: { anchor: from + content.length },
					scrollIntoView: true
				})
				view.focus()
				return `Inserted content at ${position || 'cursor'}`
			}

			case 'apply_diff_edit': {
				const { stage } = args
				const parsed = parseApplyDiffPairs(args)
				if (!parsed.pairs) {
					return parsed.error
				}

				const docText = view.state.doc.toString()
				const resolved = findAtomicDiffMatches(docText, parsed.pairs)
				if (!resolved.matches) {
					return resolved.error
				}

				const matches = resolved.matches
				const modified = applyMatchesToText(docText, matches)
				const sortedDesc = [...matches].sort((a, b) => b.from - a.from)

				if (stage) {
					const isBatch = parsed.pairs.length > 1
					return {
						type: 'staged_change',
						original: docText,
						modified,
						searchBlock: parsed.pairs.map(pair => pair.search),
						replaceBlock: parsed.pairs.map(pair => pair.replace),
						description: isBatch
							? `Apply diff edit (batch ${parsed.pairs.length} items)`
							: 'Apply diff edit'
					}
				}

				view.dispatch({
					changes: sortedDesc.map(match => ({ from: match.from, to: match.to, insert: match.replace })),
					scrollIntoView: true
				})
				view.focus()
				return parsed.pairs.length > 1
					? `Successfully applied batch patch (${parsed.pairs.length} items).`
					: `Successfully applied patch.`
			}

			case 'get_cursor_info': {
				const selection = view.state.selection.main
				const doc = view.state.doc
				return JSON.stringify({
					position: selection.from,
					selectedText: doc.sliceString(selection.from, selection.to),
					textBefore: doc.sliceString(Math.max(0, selection.from - 50), selection.from),
					textAfter: doc.sliceString(selection.to, Math.min(doc.length, selection.to + 50)),
					documentSize: doc.length
				})
			}

			case 'compile_latex': {
				if (typeof editor.handleCompile === 'function') {
					await editor.handleCompile()
					return 'Compilation triggered. Check logs if you need details on errors.'
				}
				return 'Error: compile_latex is not supported by this editor instance.'
			}

			case 'get_compile_logs': {
				if (editor.compileResult?.log) {
					return editor.compileResult.log
				}
				return 'No compilation logs found. Try calling compile_latex first.'
			}

			case 'format_latex': {
				const { stage } = args
				const docText = view.state.doc.toString()
				// Simple regex-based formatting for now
				const formatted = docText
					.replace(/([^\\])\s+/g, '$1 ')
					.replace(/\\(section|subsection|subsubsection|paragraph)\{/g, '\n\\$1{')
					.replace(/\\begin\{/g, '\n\\begin{')
					.replace(/\\end\{/g, '\\end{\n')
					.trim()

				if (stage) {
					return {
						type: 'staged_change',
						original: docText,
						modified: formatted,
						description: 'Format LaTeX document'
					}
				}

				view.dispatch({
					changes: { from: 0, to: docText.length, insert: formatted }
				})
				return 'Document formatted successfully.'
			}

			default:
				return `Tool "${toolName}" is not yet available for LaTeX editor. Supported tools: read_document, get_sections, get_document_stats, insert_content, apply_diff_edit, get_cursor_info, search_document_context.`
		}
	} catch (e) {
		return `Error in CodeMirror tool execution: ${e instanceof Error ? e.message : 'Unknown error'}`
	}
}

