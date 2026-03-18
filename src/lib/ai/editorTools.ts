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

	// All editors are CodeMirror/LaTeX now
	const view = editor;
	try {
		switch (toolName) {
			case 'read_document': {
				const docText = view.state.doc.toString()
				return JSON.stringify({
					metadata: {
						title: 'LaTeX Document',
						characterCount: docText.length,
						lineCount: view.state.doc.lines
					},
					preview: docText.substring(0, 500),
					hasFullContent: true
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

			default:
				return `Tool "${toolName}" is not yet available for LaTeX editor. Basic content tools (insert_content, apply_diff_edit, get_cursor_info) are supported.`
		}
	} catch (e) {
		return `Error in CodeMirror tool execution: ${e instanceof Error ? e.message : 'Unknown error'}`
	}
}
