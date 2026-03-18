'use client'

/**
 * Editor-side Tool Execution
 * These functions run in the browser and interact directly with the Tiptap editor instance.
 */

import { extractSections, extractTables, buildDocumentMetadata, getSectionContent } from './documentContext'

/**
 * Force the editor view to update with minimal reflows
 */
export const forceViewUpdate = (tiptapEditor: any): void => {
	if (!tiptapEditor?.view?.dom) return

	try {
		// Single dispatch instead of multiple reflows
		const tr = tiptapEditor.state.tr.setMeta('forceUpdate', true)
		tiptapEditor.view.dispatch(tr)

		// Focus in next frame, not via arbitrary setTimeout
		requestAnimationFrame(() => {
			if (tiptapEditor?.view) {
				tiptapEditor.view.focus()
			}
		})
	} catch (error) {
		console.warn('[forceViewUpdate] Error:', error)
	}
}

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
 * Primary tool execution dispatcher for AI interactions
 */
export const executeEditorTool = async (
	tiptapEditor: any,
	toolName: string,
	args: any,
	documentId?: string
): Promise<string> => {
	if (!tiptapEditor) return 'Error: Editor not available'

	// DETECT EDITOR TYPE
	const isCodeMirror = !!(tiptapEditor.state?.doc && tiptapEditor.dispatch)
	
	if (isCodeMirror) {
		const view = tiptapEditor;
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
				
				default:
					return `Tool "${toolName}" is not yet optimized for LaTeX mode, but basic content tools are available.`
			}
		} catch (e) {
			return `Error in CodeMirror tool execution: ${e instanceof Error ? e.message : 'Unknown error'}`
		}
	}

	try {
		switch (toolName) {
			// CURSOR CONTROL
			case 'get_cursor_info': {
				const { from, to, empty } = tiptapEditor.state.selection
				const docSize = tiptapEditor.state.doc.content.size
				const textBefore = tiptapEditor.state.doc.textBetween(Math.max(0, from - 50), from, ' ')
				const textAfter = tiptapEditor.state.doc.textBetween(to, Math.min(docSize, to + 50), ' ')
				return JSON.stringify({
					position: from,
					selectedText: empty ? '' : tiptapEditor.state.doc.textBetween(from, to, ' '),
					textBefore,
					textAfter,
					documentSize: docSize,
				})
			}

			case 'set_cursor_position': {
				const { position, target } = args
				const docSize = tiptapEditor.state.doc.content.size
				if (position !== undefined) {
					tiptapEditor.chain().focus().setTextSelection(Math.max(1, Math.min(position, docSize - 1))).run()
					return `Cursor moved to position ${position}`
				}
				if (target === 'start') tiptapEditor.chain().focus().setTextSelection(1).run()
				else if (target === 'end') tiptapEditor.chain().focus().setTextSelection(docSize - 1).run()
				return `Cursor moved to ${target}`
			}

			// CONTENT MODIFICATION
			case 'insert_content': {
				const { content, position } = args
				const chain = tiptapEditor.chain().focus()
				if (position === 'start') chain.insertContentAt(0, content)
				else if (position === 'end') chain.insertContentAt(tiptapEditor.state.doc.content.size, content)
				else chain.insertContent(content)
				chain.run()
				forceViewUpdate(tiptapEditor)
				return `Inserted content at ${position || 'cursor'}`
			}

			case 'clear_document': {
				tiptapEditor.chain().selectAll().deleteSelection().run()
				forceViewUpdate(tiptapEditor)
				return 'Successfully cleared all document content'
			}
				case 'insert_rich_content': {
				const { jsonContent, position } = args
				if (!jsonContent) return 'Error: jsonContent parameter is required'
				
				try {
				// Parse JSON content (ProseMirror format with marks preserved)
				const parsed = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent
				const chain = tiptapEditor.chain().focus()
				
				if (position === 'start') {
				chain.insertContentAt(0, parsed)
				} else if (position === 'end') {
				chain.insertContentAt(tiptapEditor.state.doc.content.size, parsed)
				} else {
				chain.insertContent(parsed)
				}
				chain.run()
				forceViewUpdate(tiptapEditor)
				return `Successfully inserted rich content WITH formatting preserved at ${position || 'cursor'}`
				} catch (error) {
				return `Error parsing or inserting rich content: ${error instanceof Error ? error.message : 'Invalid JSON format'}`
				}
				}


			case 'delete_by_text': {
				const { text, caseSensitive } = args
				if (!text) return 'Error: text parameter is required'

				const positions = findTextPositions(tiptapEditor, text, caseSensitive)
				if (positions.length === 0) return `Text "${text}" not found`

				// Delete in reverse order to maintain positions
				positions.reverse().forEach(pos => {
					tiptapEditor.chain().deleteRange(pos).run()
				})
				forceViewUpdate(tiptapEditor)
				return `Successfully deleted ${positions.length} occurrence(s) of "${text}"`
			}

			case 'insert_after_text': {
				const { searchText, content } = args
				if (!searchText || !content) return 'Error: searchText and content parameters are required'

				const positions = findTextPositions(tiptapEditor, searchText)
				if (positions.length === 0) return `Search text "${searchText}" not found`

				const afterPos = positions[0].to
				tiptapEditor.chain().focus().insertContentAt(afterPos, content).run()
				forceViewUpdate(tiptapEditor)
				return `Successfully inserted content after "${searchText}"`
			}

			case 'delete_section': {
				const { sectionName, includeHeading } = args
				const range = findSectionRange(tiptapEditor, sectionName)
				if (!range.found) return `Section "${sectionName}" not found`
				const from = includeHeading !== false ? range.from : range.headingEnd
				tiptapEditor.chain().focus().deleteRange({ from, to: range.to }).run()
				forceViewUpdate(tiptapEditor)
				return `Deleted section "${sectionName}"`
			}

			case 'find_and_replace': {
				const { searchText, replaceWith, replaceAll, caseSensitive } = args
				const positions = findTextPositions(tiptapEditor, searchText, caseSensitive)
				if (positions.length === 0) return `Text "${searchText}" not found`
				const targets = replaceAll ? positions.reverse() : [positions[0]]
				for (const pos of targets) {
					tiptapEditor.chain().focus().deleteRange(pos).insertContentAt(pos.from, replaceWith || '').run()
				}
				forceViewUpdate(tiptapEditor)
				return `Replaced ${targets.length} occurrence(s)`
			}

			// DIFF EDITOR
			case 'apply_diff_edit': {
				const { searchBlock, replaceBlock } = args
				const range = findTextRangeExact(tiptapEditor, searchBlock)
				
				if (!range) {
					return `Error: Could not find exact match for the provided search block. Please provide a more unique or exact text snippet.`
				}
				
				tiptapEditor.chain().focus().deleteRange(range).insertContentAt(range.from, replaceBlock).run()
				forceViewUpdate(tiptapEditor)
				return `Successfully applied diff patch replacing ${searchBlock.length} characters.`
			}

			// READING TOOLS
			case 'read_document': {
				// Return metadata only (not full content) to reduce token usage
				const metadata = buildDocumentMetadata(tiptapEditor)
				const sections = extractSections(tiptapEditor)
				const tables = extractTables(tiptapEditor)
				const text = tiptapEditor.getText()

				return JSON.stringify({
					metadata: {
						...metadata,
						sectionCount: sections.length,
					},
					preview: text.substring(0, 500),
					sections: sections.map(s => ({ name: s.name, level: s.level, type: s.type })),
					tables: tables.length,
					hasFullContent: false,
					hint: 'Use search_document_context or get_full_document tools to retrieve complete content'
				})
			}

			case 'get_sections': {
				const sections = extractSections(tiptapEditor)
				return JSON.stringify({
					total: sections.length,
					sections: sections.map(s => ({
						name: s.name,
						level: s.level,
						type: s.type,
						startPos: s.startPos,
						endPos: s.endPos,
					}))
				})
			}

		case 'get_section_content': {
			const { sectionName } = args
			if (!sectionName) return 'Error: sectionName parameter is required'

			const result = getSectionContent(tiptapEditor, sectionName)
			if (!result) {
				return `Section "${sectionName}" not found. Use get_sections to see available sections.`
			}

			return JSON.stringify({
				name: result.name,
				content: result.content,
				length: result.content.length,
				preview: result.content.substring(0, 200)
			})
		}

			// RAG QUERY
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

			// TABLE TOOLS
			case 'insert_table': {
				const { rows, cols, withHeaderRow } = args
				tiptapEditor.chain().focus().insertTable({ rows: rows || 3, cols: cols || 3, withHeaderRow: withHeaderRow ?? true }).run()
				forceViewUpdate(tiptapEditor)
				return `Inserted ${rows || 3}x${cols || 3} table`
			}

			case 'get_all_tables': {
				const tables: any[] = []
				tiptapEditor.state.doc.descendants((node: any, pos: number) => {
					if (node.type.name === 'table') {
						let tableText = '', rows = 0, cols = 0
						node.descendants((child: any) => {
							if (child.type.name === 'tableRow') rows++
							if ((child.type.name === 'tableCell' || child.type.name === 'tableHeader') && rows === 1) cols++
							if (child.isText) tableText += child.text + ' '
						})
						tables.push({ index: tables.length + 1, preview: tableText.trim().substring(0, 50), rows, cols, pos })
					}
				})
				return tables.length === 0 ? 'No tables found' : JSON.stringify({ total: tables.length, tables })
			}
			
			// FORMATTING
			case 'format_text': {
				const { format, level } = args
				const chain = tiptapEditor.chain().focus()
				if (format === 'bold') chain.toggleBold()
				else if (format === 'italic') chain.toggleItalic()
				else if (format === 'heading') chain.toggleHeading({ level: level || 1 })
				chain.run()
				return `Applied ${format} formatting`
			}

			case 'navigate_table_cell': {
				const { direction } = args
				if (direction === 'next') tiptapEditor.chain().focus().goToNextCell().run()
				else tiptapEditor.chain().focus().goToPreviousCell().run()
				return `Moved to ${direction} cell`
			}

			case 'merge_table_cells': 
				tiptapEditor.chain().focus().mergeCells().run(); 
				return 'Merged cells'
			
			case 'split_table_cell':
				tiptapEditor.chain().focus().splitCell().run();
				return 'Split cell'

			// ADVANCED NAVIGATION (Async imports moved to top-level or handled here)
			case 'move_to_section': 
				return 'Error: move_to_section is no longer supported'

			case 'move_to_element':
				return 'Error: move_to_element is no longer supported'

			default:
				return `Tool "${toolName}" is recognized. If it's a core Tiptap command, it should be added here.`
		}
	} catch (error) {
		return `Error executing ${toolName}: ${error instanceof Error ? error.message : 'Unknown error'}`
	}
}
