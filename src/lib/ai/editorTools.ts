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

/**
 * Primary tool execution dispatcher for AI interactions (CodeMirror/LaTeX only)
 */
export const executeEditorTool = async (
	editor: any,
	toolName: string,
	args: any,
	documentId?: string
): Promise<string> => {
	if (!editor) return 'Error: Editor not available'

	// Extract CodeMirror view from the editor wrapper provided by LatexEditor
	const view = editor.editor
	if (!view) return 'Error: CodeMirror view not available'
	
	try {
		switch (toolName) {
			case 'read_document': {
				const { fromLine, toLine, full } = args
				const doc = view.state.doc
				
				if (full) {
					return doc.toString()
				}
				
				if (fromLine !== undefined) {
					const startLine = Math.max(1, fromLine)
					const endLine = toLine !== undefined ? Math.min(doc.lines, toLine) : Math.min(doc.lines, startLine + 100)
					
					let content = ''
					for (let i = startLine; i <= endLine; i++) {
						content += doc.line(i).text + '\n'
					}
					
					return JSON.stringify({
						metadata: {
							fromLine: startLine,
							toLine: endLine,
							totalLines: doc.lines
						},
						content
					})
				}

				const docText = doc.toString()
				return JSON.stringify({
					metadata: {
						title: 'LaTeX Document',
						characterCount: docText.length,
						lineCount: doc.lines
					},
					preview: docText.substring(0, 1000),
					hasFullContent: false
				})
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
			
			case 'insert_content': {
				const { content, position } = args
				const selection = view.state.selection.main
				let from = selection.from
				let to = selection.to
				
				if (position === 'start') { from = 0; to = 0; }
				else if (position === 'end') { from = view.state.doc.length; to = view.state.doc.length; }
				
				view.dispatch({
					changes: { from, to, insert: content },
					selection: { anchor: from + content.length },
					scrollIntoView: true
				})
				view.focus()
				return `Inserted content at ${position || 'cursor'}`
			}
			
			case 'apply_diff_edit': {
				const { searchBlock, replaceBlock } = args
				const docText = view.state.doc.toString()
				const index = docText.indexOf(searchBlock)
				
				if (index === -1) {
					return `Error: Could not find exact match for search block.`
				}
				
				view.dispatch({
					changes: { from: index, to: index + searchBlock.length, insert: replaceBlock },
					scrollIntoView: true
				})
				view.focus()
				return `Successfully applied patch.`
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
			
			case 'search_document_context': {
				const { query, k } = args
				if (!documentId) return 'Error: documentId is not available for context search'
				
				try {
					const response = await fetch('/api/ai-rag-query', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ documentId, query, k }),
					})
					if (!response.ok) throw new Error(`API returned ${response.status}`)
					const data = await response.json()
					return data.context || data.error || 'No relevant context found'
				} catch (e) {
					return `Error searching document context: ${e instanceof Error ? e.message : 'Unknown error'}`
				}
			}

			case 'compile_latex': {
				if (typeof editor.handleCompile === 'function') {
					await editor.handleCompile()
					return 'Compilation triggered. Check logs if you need details on errors.'
				}
				return 'Error: compile_latex is not supported by this editor instance.'
			}

			case 'get_compile_logs': {
				// The editor functions passed to AIChatPanel should include state info
				// or we can try to find the log in a shared state if available.
				// For now, we expect the editor object to have the log.
				if (editor.compileResult?.log) {
					return editor.compileResult.log
				}
				return 'No compilation logs found. Try calling compile_latex first.'
			}

			case 'format_latex': {
				const docText = view.state.doc.toString()
				// Simple regex-based formatting for now
				const formatted = docText
					.replace(/([^\\])\s+/g, '$1 ') // simplify spaces
					.replace(/\\(section|subsection|subsubsection|paragraph)\{/g, '\n\\$1{') // ensure newline before sections
					.replace(/\\begin\{/g, '\n\\begin{')
					.replace(/\\end\{/g, '\\end{\n')
					.trim()
				
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
