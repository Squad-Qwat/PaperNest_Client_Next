'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface Message {
	id: string
	role: 'user' | 'assistant'
	content: string
	timestamp: Date
}

interface EditorFunctions {
	editor?: any
	getCurrentContent?: () => any
	getCurrentHTML?: () => string
	saveCurrentContent?: () => Promise<void>
	insertTable?: (rows: number, cols: number) => void
	undo?: () => void
	redo?: () => void
	canUndo?: boolean
	canRedo?: boolean
	debugContentExtraction?: () => void
}

interface AIChatPanelProps {
	editor?: EditorFunctions
	onClose?: () => void
}

// ===== HELPER FUNCTIONS FOR SEMANTIC OPERATIONS =====

/**
 * Find all occurrences of text in the document
 */
const findTextPositions = (
	editor: any,
	searchText: string,
	caseSensitive = false
): Array<{ from: number; to: number }> => {
	const positions: Array<{ from: number; to: number }> = []
	const doc = editor.state.doc

	doc.descendants((node: any, pos: number) => {
		if (node.isText && node.text) {
			const nodeText = caseSensitive ? node.text : node.text.toLowerCase()
			const search = caseSensitive ? searchText : searchText.toLowerCase()

			let index = nodeText.indexOf(search)
			while (index !== -1) {
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
 * Check if a paragraph node looks like a heading (bold, larger font)
 */
const isHeadingLikeParagraph = (node: any): boolean => {
	if (node.type.name !== 'paragraph') return false
	if (!node.content || node.content.size === 0) return false

	// Check if all text content is bold
	let hasBold = false
	node.content.forEach((child: any) => {
		if (child.marks) {
			const hasBoldMark = child.marks.some((mark: any) => mark.type.name === 'bold')
			if (hasBoldMark) hasBold = true
		}
	})

	// Also check if it has larger font size (common heading pattern)
	let hasLargeFont = false
	node.content.forEach((child: any) => {
		if (child.marks) {
			const textStyleMark = child.marks.find((mark: any) => mark.type.name === 'textStyle')
			if (textStyleMark?.attrs?.fontSize) {
				const fontSize = textStyleMark.attrs.fontSize
				// Consider 16px+ or 12pt+ as "large" (heading-like)
				if (fontSize.includes('px')) {
					const size = parseInt(fontSize)
					if (size >= 16) hasLargeFont = true
				} else if (fontSize.includes('pt')) {
					const size = parseInt(fontSize)
					if (size >= 12) hasLargeFont = true
				}
			}
		}
	})

	// A heading-like paragraph is bold AND has larger font, or just bold with all caps
	const text = node.textContent
	const isAllCaps = text === text.toUpperCase() && text.length > 3

	return hasBold && (hasLargeFont || isAllCaps)
}

/**
 * Find section range by heading text
 * Handles both proper heading nodes AND bold paragraphs (fake headings)
 * FIXED: Properly iterate top-level nodes and calculate correct ranges
 */
const findSectionRange = (
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

	// Iterate through top-level nodes only
	doc.content.forEach((node: any, offset: number, index: number) => {
		const nodeStart = currentPos
		const nodeEnd = currentPos + node.nodeSize

		// Check if this is a heading (proper or fake)
		const isHeading = node.type.name === 'heading'
		let isFakeHeading = false

		if (node.type.name === 'paragraph' && node.content && node.content.size > 0) {
			const nodeText = node.textContent
			if (nodeText.trim()) {
				let hasBold = false
				let hasLargeFont = false

				node.content.forEach((child: any) => {
					if (child.marks) {
						if (child.marks.some((m: any) => m.type.name === 'bold')) hasBold = true
						const tsm = child.marks.find((m: any) => m.type.name === 'textStyle')
						if (tsm?.attrs?.fontSize) {
							const fs = tsm.attrs.fontSize
							if ((fs.includes('px') && parseInt(fs) >= 16) || (fs.includes('pt') && parseInt(fs) >= 12)) {
								hasLargeFont = true
							}
						}
					}
				})

				const isAllCaps = nodeText === nodeText.toUpperCase() && nodeText.length > 3
				isFakeHeading = hasBold && (hasLargeFont || isAllCaps)
			}
		}

		if (isHeading || isFakeHeading) {
			const nodeText = node.textContent.toLowerCase().trim()

			if (foundHeading && sectionEnd === -1) {
				// Found next heading - this is where previous section ends
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

	// If section was found but no next heading, section goes to end of document
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
const findParagraphContaining = (
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
			result = {
				from: pos,
				to: pos + node.nodeSize,
				found: true,
			}
			return false
		}
	})

	return result
}

/**
 * Force the editor view to update and sync
 * This helps ensure content is visually rendered after AI modifications
 */
const forceViewUpdate = (tiptapEditor: any): void => {
	if (!tiptapEditor || !tiptapEditor.view) return

	try {
		// Method 1: Force synchronous view update
		tiptapEditor.view.updateState(tiptapEditor.state)

		// Method 2: Trigger a harmless transaction to wake up the view
		setTimeout(() => {
			if (tiptapEditor && tiptapEditor.view) {
				const tr = tiptapEditor.state.tr.setMeta('forceUpdate', true)
				tiptapEditor.view.dispatch(tr)
			}
		}, 10)

		// Method 3: Request animation frame for visual sync
		requestAnimationFrame(() => {
			if (tiptapEditor.view && tiptapEditor.view.dom) {
				tiptapEditor.view.dom.blur()
				tiptapEditor.view.focus()
			}
		})
	} catch (error) {
		console.warn('[forceViewUpdate] Error:', error)
	}
}

/**
 * Execute AI tool on the real Tiptap editor instance
 */
const executeToolOnEditor = async (
	tiptapEditor: any,
	toolName: string,
	args: any
): Promise<string> => {
	if (!tiptapEditor) {
		return 'Error: Editor not available'
	}

	try {

		switch (toolName) {
			// ===== CURSOR CONTROL TOOLS =====
			case 'get_cursor_info': {
				const { from, to, empty } = tiptapEditor.state.selection
				const docSize = tiptapEditor.state.doc.content.size

				// Get text around cursor
				const beforeStart = Math.max(0, from - 50)
				const afterEnd = Math.min(docSize, to + 50)
				const textBefore = tiptapEditor.state.doc.textBetween(beforeStart, from, ' ')
				const textAfter = tiptapEditor.state.doc.textBetween(to, afterEnd, ' ')
				const selectedText = empty ? '' : tiptapEditor.state.doc.textBetween(from, to, ' ')

				// Get node at cursor
				const resolvedPos = tiptapEditor.state.doc.resolve(from)
				const nodeNames: string[] = []
				for (let d = resolvedPos.depth; d >= 0; d--) {
					nodeNames.push(resolvedPos.node(d).type.name)
				}

				return JSON.stringify({
					position: from,
					selectionEnd: to,
					hasSelection: !empty,
					selectedText: selectedText.substring(0, 100),
					textBefore: textBefore.substring(textBefore.length - 50),
					textAfter: textAfter.substring(0, 50),
					inElement: nodeNames[0],
					elementHierarchy: nodeNames.reverse(),
					documentSize: docSize,
				})
			}

			case 'set_cursor_position': {
				const { position, target } = args
				const { from } = tiptapEditor.state.selection
				const docSize = tiptapEditor.state.doc.content.size

				if (position !== undefined) {
					const safePos = Math.max(1, Math.min(position, docSize - 1))
					tiptapEditor.chain().focus().setTextSelection(safePos).run()
					return `Cursor moved to position ${safePos}`
				}

				if (target) {
					// Basic positions
					if (target === 'start') {
						tiptapEditor.chain().focus().setTextSelection(1).run()
						return 'Cursor moved to document start'
					}
					if (target === 'end') {
						tiptapEditor.chain().focus().setTextSelection(docSize - 1).run()
						return 'Cursor moved to document end'
					}

					// Arrow-key style movement
					if (target === 'left') {
						const newPos = Math.max(1, from - 1)
						tiptapEditor.chain().focus().setTextSelection(newPos).run()
						return `Cursor moved left to position ${newPos}`
					}
					if (target === 'right') {
						const newPos = Math.min(docSize - 1, from + 1)
						tiptapEditor.chain().focus().setTextSelection(newPos).run()
						return `Cursor moved right to position ${newPos}`
					}
					if (target === 'up') {
						// Move to previous paragraph/block
						const resolvedPos = tiptapEditor.state.doc.resolve(from)
						const parentStart = resolvedPos.start(1)
						if (parentStart > 1) {
							tiptapEditor.chain().focus().setTextSelection(parentStart - 1).run()
							return 'Cursor moved up to previous block'
						}
						return 'Already at first block'
					}
					if (target === 'down') {
						// Move to next paragraph/block
						const resolvedPos = tiptapEditor.state.doc.resolve(from)
						const parentEnd = resolvedPos.end(1)
						if (parentEnd < docSize - 1) {
							tiptapEditor.chain().focus().setTextSelection(parentEnd + 1).run()
							return 'Cursor moved down to next block'
						}
						return 'Already at last block'
					}
					if (target === 'line_start') {
						const resolvedPos = tiptapEditor.state.doc.resolve(from)
						const lineStart = resolvedPos.start(resolvedPos.depth)
						tiptapEditor.chain().focus().setTextSelection(lineStart).run()
						return 'Cursor moved to line start'
					}
					if (target === 'line_end') {
						const resolvedPos = tiptapEditor.state.doc.resolve(from)
						const lineEnd = resolvedPos.end(resolvedPos.depth)
						tiptapEditor.chain().focus().setTextSelection(lineEnd).run()
						return 'Cursor moved to line end'
					}

					// Semantic search
					if (target.startsWith('after:')) {
						const searchText = target.substring(6)
						const text = tiptapEditor.getText()
						const idx = text.toLowerCase().indexOf(searchText.toLowerCase())
						if (idx === -1) return `Text "${searchText}" not found`
						tiptapEditor.chain().focus().setTextSelection(idx + searchText.length + 1).run()
						return `Cursor moved after "${searchText}"`
					}
					if (target.startsWith('before:')) {
						const searchText = target.substring(7)
						const text = tiptapEditor.getText()
						const idx = text.toLowerCase().indexOf(searchText.toLowerCase())
						if (idx === -1) return `Text "${searchText}" not found`
						tiptapEditor.chain().focus().setTextSelection(idx + 1).run()
						return `Cursor moved before "${searchText}"`
					}
				}

				return 'Error: Provide either position or target'
			}

			case 'select_text': {
				const { text, from, to } = args

				if (from !== undefined && to !== undefined) {
					tiptapEditor.chain().focus().setTextSelection({ from, to }).run()
					return `Selected range ${from}-${to}`
				}

				if (text) {
					const docText = tiptapEditor.getText()
					const idx = docText.toLowerCase().indexOf(text.toLowerCase())
					if (idx === -1) return `Text "${text}" not found`
					// Account for document offset
					tiptapEditor.chain().focus().setTextSelection({ from: idx + 1, to: idx + text.length + 1 }).run()
					return `Selected text "${text}"`
				}

				return 'Error: Provide text or from/to range'
			}

			case 'get_context_at_cursor': {
				const { from } = tiptapEditor.state.selection
				const resolvedPos = tiptapEditor.state.doc.resolve(from)

				// Build context info
				const context: any = {
					position: from,
					inTable: false,
					inList: false,
					inHeading: false,
					inCodeBlock: false,
					elements: [],
				}

				for (let d = resolvedPos.depth; d >= 0; d--) {
					const node = resolvedPos.node(d)
					const nodeName = node.type.name
					context.elements.push(nodeName)

					if (nodeName === 'table') context.inTable = true
					if (nodeName === 'bulletList' || nodeName === 'orderedList') context.inList = true
					if (nodeName === 'heading') {
						context.inHeading = true
						context.headingLevel = node.attrs?.level
					}
					if (nodeName === 'codeBlock') context.inCodeBlock = true
				}

				// Get nearby text
				const docSize = tiptapEditor.state.doc.content.size
				const start = Math.max(0, from - 100)
				const end = Math.min(docSize, from + 100)
				context.nearbyText = tiptapEditor.state.doc.textBetween(start, end, ' ').trim()

				return JSON.stringify(context)
			}

			// ===== READING TOOLS =====
			case 'read_document': {
				const content = tiptapEditor.getJSON()
				const text = tiptapEditor.getText()

				// Extract sections - check both headings and bold paragraphs (fake headings)
				const sections: Array<{ text: string; level: number; type: string }> = []
				content.content?.forEach((node: any) => {
					// Check for proper heading
					if (node.type === 'heading') {
						const headingText = node.content?.map((c: any) => c.text || '').join('') || ''
						sections.push({
							text: headingText,
							level: node.attrs?.level || 1,
							type: 'heading',
						})
					}
					// Check for fake heading (bold paragraph with large font or all caps)
					else if (node.type === 'paragraph' && node.content) {
						const nodeText = node.content?.map((c: any) => c.text || '').join('') || ''
						if (!nodeText.trim()) return

						// Check for bold mark
						let hasBold = false
						let hasLargeFont = false
						node.content?.forEach((child: any) => {
							if (child.marks) {
								const hasBoldMark = child.marks.some((m: any) => m.type === 'bold')
								if (hasBoldMark) hasBold = true

								const textStyleMark = child.marks.find((m: any) => m.type === 'textStyle')
								if (textStyleMark?.attrs?.fontSize) {
									const fs = textStyleMark.attrs.fontSize
									if (fs.includes('px') && parseInt(fs) >= 16) hasLargeFont = true
									if (fs.includes('pt') && parseInt(fs) >= 12) hasLargeFont = true
								}
							}
						})

						const isAllCaps = nodeText === nodeText.toUpperCase() && nodeText.length > 3

						if (hasBold && (hasLargeFont || isAllCaps)) {
							sections.push({
								text: nodeText,
								level: 2, // Treat as level 2 heading
								type: 'bold-paragraph',
							})
						}
					}
				})

				return JSON.stringify({
					content,
					text,
					sections,
					wordCount: text.split(/\s+/).filter(Boolean).length,
				})
			}

			case 'get_sections': {
				const json = tiptapEditor.getJSON()
				const sections: Array<{ text: string; level: number; nodeIndex: number; type: string }> = []

				json.content?.forEach((node: any, index: number) => {
					// Check for proper heading
					if (node.type === 'heading') {
						const headingText = node.content?.map((c: any) => c.text || '').join('') || ''
						sections.push({
							text: headingText,
							level: node.attrs?.level || 1,
							nodeIndex: index,
							type: 'heading',
						})
					}
					// Check for fake heading (bold paragraph)
					else if (node.type === 'paragraph' && node.content) {
						const nodeText = node.content?.map((c: any) => c.text || '').join('') || ''
						if (!nodeText.trim()) return

						let hasBold = false
						let hasLargeFont = false
						node.content?.forEach((child: any) => {
							if (child.marks) {
								if (child.marks.some((m: any) => m.type === 'bold')) hasBold = true
								const tsm = child.marks.find((m: any) => m.type === 'textStyle')
								if (tsm?.attrs?.fontSize) {
									const fs = tsm.attrs.fontSize
									if ((fs.includes('px') && parseInt(fs) >= 16) || (fs.includes('pt') && parseInt(fs) >= 12)) {
										hasLargeFont = true
									}
								}
							}
						})

						const isAllCaps = nodeText === nodeText.toUpperCase() && nodeText.length > 3
						if (hasBold && (hasLargeFont || isAllCaps)) {
							sections.push({
								text: nodeText,
								level: 2,
								nodeIndex: index,
								type: 'bold-paragraph',
							})
						}
					}
				})

				return JSON.stringify({ sections, totalSections: sections.length })
			}

			// ===== SEMANTIC EDITING TOOLS =====
			case 'find_and_replace': {
				const { searchText, replaceWith, replaceAll, caseSensitive } = args

				if (!searchText) {
					return 'Error: searchText is required'
				}

				const positions = findTextPositions(tiptapEditor, searchText, caseSensitive)

				if (positions.length === 0) {
					return `Text "${searchText}" not found in document`
				}

				// Replace from end to start to maintain position validity
				const positionsToReplace = replaceAll ? positions.reverse() : [positions[0]]
				const replacement = replaceWith || ''

				for (const pos of positionsToReplace) {
					tiptapEditor
						.chain()
						.focus()
						.deleteRange({ from: pos.from, to: pos.to })
						.insertContentAt(pos.from, replacement)
						.run()
				}

				const count = positionsToReplace.length
				if (replacement === '') {
					return `Deleted ${count} occurrence(s) of "${searchText}"`
				}
				return `Replaced ${count} occurrence(s) of "${searchText}" with "${replacement}"`
			}

			case 'delete_section': {
				const { sectionName, includeHeading } = args

				if (!sectionName) {
					return 'Error: sectionName is required'
				}

				const range = findSectionRange(tiptapEditor, sectionName)

				if (!range.found) {
					return `Section "${sectionName}" not found in document`
				}

				// If includeHeading is false, start deletion after the heading
				const from = includeHeading !== false ? range.from : range.headingEnd
				const to = range.to

				console.log(`[delete_section] Deleting from ${from} to ${to} (${to - from} chars)`)
				tiptapEditor.chain().focus().deleteRange({ from, to }).run()

				return `Deleted section "${sectionName}" and its content (${to - from} characters removed)`
			}

			case 'move_section': {
				const { sectionName, position } = args

				if (!sectionName) {
					return 'Error: sectionName is required'
				}

				const range = findSectionRange(tiptapEditor, sectionName)

				if (!range.found) {
					return `Section "${sectionName}" not found in document`
				}

				// 1. Capture content
				// Use slice to get the structured content (nodes)
				const slice = tiptapEditor.state.doc.slice(range.from, range.to)
				const jsonContent = slice.toJSON()

				// 2. Delete original
				// Use a transaction to ensure atomic feeling?
				// Chain delete then insert

				// Calculate target pos
				let targetPos = 0
				if (position === 'end') {
					targetPos = tiptapEditor.state.doc.content.size - (range.to - range.from) // Adjusted? No, delete shrinks doc.
					// Actually if we delete first:
					// New Size = Old Size - (to - from)
					// Insert at New Size
				} else if (position === 'start') {
					targetPos = 0
				} else {
					targetPos = 0 // Default start
				}

				tiptapEditor
					.chain()
					.focus()
					.deleteRange({ from: range.from, to: range.to })
					.insertContentAt(targetPos, jsonContent)
					.run()

				return `Moved section "${sectionName}" to ${position || 'start'} successfully`
			}

			case 'delete_by_text': {
				const { containsText, deleteType } = args

				if (!containsText) {
					return 'Error: containsText is required'
				}

				const result = findParagraphContaining(
					tiptapEditor,
					containsText,
					deleteType || 'any'
				)

				if (!result.found) {
					return `No ${deleteType || 'content'} containing "${containsText}" found`
				}

				tiptapEditor.chain().focus().deleteRange({ from: result.from, to: result.to }).run()

				return `Deleted content containing "${containsText}"`
			}

			case 'insert_after_text': {
				const { afterText, content, newParagraph } = args

				if (!afterText || !content) {
					return 'Error: afterText and content are required'
				}

				const result = findParagraphContaining(tiptapEditor, afterText, 'any')

				if (!result.found) {
					return `No content containing "${afterText}" found`
				}

				const insertPos = result.to
				const insertContent = newParagraph !== false ? `<p>${content}</p>` : content

				tiptapEditor.chain().focus().insertContentAt(insertPos, insertContent).run()

				// Force view update to ensure content is rendered
				forceViewUpdate(tiptapEditor)

				// Scroll to show the inserted content
				setTimeout(() => tiptapEditor.commands.scrollIntoView(), 100)

				return `Inserted content after "${afterText}"`
			}



			case 'insert_content': {
				const { content, position } = args

				if (!content) {
					return 'Error: content is required'
				}

				// Validate and sanitize HTML content
				const MAX_CONTENT_SIZE = 50000 // 50KB limit
				if (content.length > MAX_CONTENT_SIZE) {
					console.warn(`[insert_content] Content too large: ${content.length} chars (max: ${MAX_CONTENT_SIZE})`)
					return `Error: Content too large (${content.length} chars). Maximum allowed is ${MAX_CONTENT_SIZE} chars.`
				}

				// Basic HTML validation using DOMParser
				let sanitizedContent = content
				try {
					const parser = new DOMParser()
					const doc = parser.parseFromString(content, 'text/html')

					// Check for parsing errors
					const parseError = doc.querySelector('parsererror')
					if (parseError) {
						console.warn('[insert_content] HTML parsing error, attempting to use as plain text')
						// Wrap plain text in paragraph if HTML is invalid
						sanitizedContent = `<p>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`
					} else {
						// Extract body content (removes html/head wrappers added by DOMParser)
						sanitizedContent = doc.body.innerHTML
					}
				} catch (e) {
					console.warn('[insert_content] HTML validation failed:', e)
					// Fallback: escape HTML and wrap in paragraph
					sanitizedContent = `<p>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`
				}

				// CRITICAL: Collapse whitespace and newlines for Tiptap
				// Tiptap interprets newlines as paragraph breaks, causing empty pages
				sanitizedContent = sanitizedContent
					.replace(/>\s+</g, '><')      // Remove whitespace between tags
					.replace(/\n/g, '')           // Remove all newlines
					.replace(/\r/g, '')           // Remove carriage returns
					.replace(/\t/g, '')           // Remove tabs
					.trim()

				// Log content for debugging (truncated)
				console.log(`[insert_content] Inserting ${sanitizedContent.length} chars at ${position || 'cursor'}`)
				console.log(`[insert_content] Content preview: ${sanitizedContent.substring(0, 200)}...`)

				try {
					switch (position) {
						case 'start':
							tiptapEditor.chain().focus('start').insertContent(sanitizedContent).run()
							break
						case 'end':
							tiptapEditor.chain().focus('end').insertContent(sanitizedContent).run()
							break
						default:
							tiptapEditor.chain().focus().insertContent(sanitizedContent).run()
					}

					// Force view update to ensure content is rendered
					forceViewUpdate(tiptapEditor)

					// Scroll to the cursor position so user can see the inserted content
					setTimeout(() => {
						tiptapEditor.commands.scrollIntoView()
					}, 100)

					return `Inserted content at ${position || 'cursor'}`
				} catch (insertError) {
					console.error('[insert_content] Error inserting content:', insertError)
					return `Error inserting content: ${insertError instanceof Error ? insertError.message : 'Unknown error'}`
				}
			}


			case 'clear_document': {
				const doc = tiptapEditor.state.doc
				const docSize = doc.content.size

				// Clear all content and insert empty paragraph
				tiptapEditor
					.chain()
					.focus()
					.deleteRange({ from: 0, to: docSize })
					.insertContent('<p></p>')
					.run()

				return `Cleared document (${docSize} characters removed)`
			}

			// ===== TABLE TOOLS =====
			case 'insert_table': {
				const { rows, cols, withHeaderRow } = args
				const numRows = rows || 3
				const numCols = cols || 3
				const hasHeader = withHeaderRow !== false

				tiptapEditor
					.chain()
					.focus()
					.insertTable({ rows: numRows, cols: numCols, withHeaderRow: hasHeader })
					.run()

				// Force view update to ensure table is rendered
				forceViewUpdate(tiptapEditor)
				setTimeout(() => tiptapEditor.commands.scrollIntoView(), 100)

				return `Inserted ${numRows}x${numCols} table${hasHeader ? ' with header row' : ''}`
			}

			case 'insert_table_with_data': {
				const { headers, rows, title } = args

				if (!headers || !Array.isArray(headers) || headers.length === 0) {
					return 'Error: headers array is required'
				}
				if (!rows || !Array.isArray(rows)) {
					return 'Error: rows array is required'
				}

				const numCols = headers.length
				const numRows = rows.length + 1 // +1 for header row

				// If title provided, insert it first with a paragraph break to ensure table comes AFTER
				if (title) {
					tiptapEditor.chain().focus().insertContent(`<h2>${title}</h2><p></p>`).run()
					// Move cursor to the end (into the new paragraph) to ensure table inserts after title
					tiptapEditor.chain().focus().run()
				}

				// Create table with correct dimensions
				tiptapEditor
					.chain()
					.focus()
					.insertTable({ rows: numRows, cols: numCols, withHeaderRow: true })
					.run()

				// Fill header row
				// First, position cursor at first cell
				let filledCells = 0
				for (let col = 0; col < numCols; col++) {
					const headerText = headers[col] || ''
					// Insert text in current cell
					tiptapEditor.chain().focus().insertContent(headerText).goToNextCell().run()
					filledCells++
				}

				// Fill data rows
				for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
					const rowData = rows[rowIdx] || []
					for (let col = 0; col < numCols; col++) {
						const cellText = rowData[col] || ''
						tiptapEditor.chain().focus().insertContent(cellText).goToNextCell().run()
						filledCells++
					}
				}

				// Force view update
				forceViewUpdate(tiptapEditor)
				setTimeout(() => tiptapEditor.commands.scrollIntoView(), 100)

				console.log(`[insert_table_with_data] Created ${numCols}x${numRows} table, filled ${filledCells} cells`)
				return `Inserted table with ${numCols} columns, ${rows.length} data rows${title ? ` titled "${title}"` : ''}`
			}

			case 'add_table_row': {
				const { position } = args
				if (position === 'above') {
					tiptapEditor.chain().focus().addRowBefore().run()
				} else {
					tiptapEditor.chain().focus().addRowAfter().run()
				}
				forceViewUpdate(tiptapEditor)
				return `Added row ${position || 'below'} current row`
			}

			case 'add_table_column': {
				const { position } = args
				if (position === 'left') {
					tiptapEditor.chain().focus().addColumnBefore().run()
				} else {
					tiptapEditor.chain().focus().addColumnAfter().run()
				}
				forceViewUpdate(tiptapEditor)
				return `Added column ${position || 'right'} of current column`
			}

			case 'delete_table_row': {
				tiptapEditor.chain().focus().deleteRow().run()
				forceViewUpdate(tiptapEditor)
				return 'Deleted current row'
			}

			case 'delete_table_column': {
				tiptapEditor.chain().focus().deleteColumn().run()
				forceViewUpdate(tiptapEditor)
				return 'Deleted current column'
			}

			case 'delete_table': {
				tiptapEditor.chain().focus().deleteTable().run()
				forceViewUpdate(tiptapEditor)
				return 'Deleted table'
			}

			case 'apply_format_to_text': {
				const { searchText, format, replaceAll } = args

				if (!searchText || !format) {
					return 'Error: searchText and format are required'
				}

				// Find all occurrences of the text
				const positions = findTextPositions(tiptapEditor, searchText, true) // case sensitive

				if (positions.length === 0) {
					return `Text "${searchText}" not found in document`
				}

				// Apply formatting to found positions (from end to start to maintain positions)
				const positionsToFormat = replaceAll ? [...positions].reverse() : [positions[0]]

				for (const pos of positionsToFormat) {
					// Select the text range
					tiptapEditor.chain().focus().setTextSelection({ from: pos.from, to: pos.to }).run()

					// Apply the formatting based on the format type
					switch (format) {
						case 'bold':
							tiptapEditor.chain().focus().toggleBold().run()
							break
						case 'italic':
							tiptapEditor.chain().focus().toggleItalic().run()
							break
						case 'underline':
							tiptapEditor.chain().focus().toggleUnderline().run()
							break
						case 'strike':
							tiptapEditor.chain().focus().toggleStrike().run()
							break
						case 'code':
							tiptapEditor.chain().focus().toggleCode().run()
							break
						case 'highlight':
							tiptapEditor.chain().focus().toggleHighlight().run()
							break
					}
				}

				// Deselect
				tiptapEditor.commands.focus('end')

				const count = positionsToFormat.length
				return `Applied ${format} to ${count} occurrence(s) of "${searchText}"`
			}

			// ===== FORMATTING TOOLS =====
			case 'format_text': {
				const { format, level } = args
				const chain = tiptapEditor.chain().focus()

				switch (format) {
					case 'bold':
						chain.toggleBold().run()
						break
					case 'italic':
						chain.toggleItalic().run()
						break
					case 'underline':
						chain.toggleUnderline().run()
						break
					case 'strike':
						chain.toggleStrike().run()
						break
					case 'code':
						chain.toggleCode().run()
						break
					case 'highlight':
						chain.toggleHighlight().run()
						break
					case 'heading':
						if (level && level >= 1 && level <= 4) {
							chain.toggleHeading({ level }).run()
						}
						break
					case 'bulletList':
						chain.toggleBulletList().run()
						break
					case 'orderedList':
						chain.toggleOrderedList().run()
						break
					case 'blockquote':
						chain.toggleBlockquote().run()
						break
					case 'codeBlock':
						chain.toggleCodeBlock().run()
						break
					default:
						return `Unknown format: ${format}`
				}
				return `Applied ${format} formatting`
			}

			case 'set_text_style': {
				const { fontSize, fontFamily, color, highlightColor } = args
				const chain = tiptapEditor.chain().focus()

				if (fontSize) {
					chain.setFontSize(fontSize)
				}
				if (fontFamily) {
					chain.setFontFamily(fontFamily)
				}
				if (color) {
					chain.setColor(color)
				}
				if (highlightColor) {
					chain.setHighlight({ color: highlightColor })
				}

				chain.run()

				const applied = [
					fontSize && `font-size: ${fontSize}`,
					fontFamily && `font-family: ${fontFamily}`,
					color && `color: ${color}`,
					highlightColor && `highlight: ${highlightColor}`,
				]
					.filter(Boolean)
					.join(', ')

				return `Applied text style: ${applied || 'none'}`
			}

			case 'set_text_align': {
				const { alignment } = args
				tiptapEditor.chain().focus().setTextAlign(alignment || 'left').run()
				return `Set text alignment to ${alignment}`
			}

			// ===== STRUCTURE TOOLS =====
			case 'insert_table': {
				const { rows, cols, withHeaderRow } = args
				tiptapEditor
					.chain()
					.focus()
					.insertTable({ rows: rows || 3, cols: cols || 3, withHeaderRow: withHeaderRow ?? true })
					.run()
				return `Inserted ${rows}x${cols} table`
			}

			case 'insert_horizontal_rule': {
				tiptapEditor.chain().focus().setHorizontalRule().run()
				return 'Inserted horizontal rule'
			}

			// ===== ANALYTICS TOOLS =====
			case 'get_document_stats': {
				const text = tiptapEditor.getText()
				const words = text.split(/\s+/).filter((w: string) => w.length > 0).length
				const chars = text.length
				const paragraphs =
					tiptapEditor.getJSON().content?.filter((n: any) => n.type === 'paragraph').length || 0
				const readingTime = Math.ceil(words / 200)
				return JSON.stringify({ words, chars, paragraphs, readingTime })
			}

			// ===== HISTORY TOOLS =====
			case 'undo_redo': {
				const { action } = args
				if (action === 'undo') {
					tiptapEditor.chain().focus().undo().run()
					return 'Undo action performed'
				} else if (action === 'redo') {
					tiptapEditor.chain().focus().redo().run()
					return 'Redo action performed'
				}
				return 'Invalid undo/redo action'
			}

			// ===== CHUNKING TOOLS =====
			case 'read_chunk': {
				const { chunkIndex } = args
				const { chunkDocument, getChunkByIndex, getChunkSummary } = await import('@/lib/ai/chunkDocument')
				const result = chunkDocument(tiptapEditor)

				if (result.totalChunks <= 1) {
					const text = tiptapEditor.getText()
					return JSON.stringify({
						message: 'Document is small enough to fit in one chunk',
						content: text.substring(0, 8000),
						totalChars: text.length,
					})
				}

				const chunk = getChunkByIndex(result.chunks, chunkIndex || 0)
				if (!chunk) {
					return `Chunk ${chunkIndex} not found. Total chunks: ${result.totalChunks}`
				}

				return JSON.stringify({
					chunkIndex: chunk.index,
					totalChunks: result.totalChunks,
					content: chunk.content,
					sections: chunk.sections,
					wordCount: chunk.wordCount,
				})
			}

			case 'read_chunk_by_section': {
				const { sectionName } = args
				const { chunkDocument, getChunkForSection } = await import('@/lib/ai/chunkDocument')
				const result = chunkDocument(tiptapEditor)

				const chunk = getChunkForSection(result.chunks, sectionName)
				if (!chunk) {
					return `Section "${sectionName}" not found in any chunk`
				}

				return JSON.stringify({
					chunkIndex: chunk.index,
					totalChunks: result.totalChunks,
					content: chunk.content,
					sections: chunk.sections,
					wordCount: chunk.wordCount,
				})
			}

			case 'get_chunk_info': {
				const { chunkDocument, getChunkSummary } = await import('@/lib/ai/chunkDocument')
				const result = chunkDocument(tiptapEditor)
				return getChunkSummary(result)
			}

			// ===== TABLE TOOLS =====
			case 'get_all_tables': {
				// Find all tables and return their index, position and content preview
				const doc = tiptapEditor.state.doc
				const tables: Array<{ index: number; contentPreview: string; rows: number; cols: number }> = []

				doc.descendants((node: any, pos: number) => {
					if (node.type.name === 'table') {
						// Get text content from this table
						let tableText = ''
						let rows = 0
						let cols = 0

						node.descendants((child: any) => {
							if (child.type.name === 'tableRow') rows++
							if (child.type.name === 'tableCell' || child.type.name === 'tableHeader') {
								if (rows === 1) cols++
							}
							if (child.isText) {
								tableText += child.text + ' '
							}
						})

						tables.push({
							index: tables.length + 1,
							contentPreview: tableText.trim().substring(0, 100) + (tableText.length > 100 ? '...' : ''),
							rows,
							cols,
						})
					}
				})

				if (tables.length === 0) {
					return 'No tables found in document'
				}

				return JSON.stringify({
					totalTables: tables.length,
					tables: tables.map(t => `Table ${t.index}: ${t.rows}x${t.cols}, content: "${t.contentPreview}"`),
				})
			}

			case 'select_table_by_index': {
				const { tableIndex } = args
				if (!tableIndex || tableIndex < 1) {
					return 'Error: tableIndex must be at least 1'
				}

				// Find the nth table
				const doc = tiptapEditor.state.doc
				let currentIndex = 0
				let targetTablePos: number | null = null

				doc.descendants((node: any, pos: number) => {
					if (node.type.name === 'table' && targetTablePos === null) {
						currentIndex++
						if (currentIndex === tableIndex) {
							targetTablePos = pos
							return false
						}
					}
				})

				if (targetTablePos === null) {
					return `Table ${tableIndex} not found. Document only has ${currentIndex} table(s).`
				}

				// Move cursor to the first cell of the found table
				tiptapEditor.chain().focus().setTextSelection(targetTablePos + 3).run()
				return `Selected table #${tableIndex} - cursor is now inside it`
			}

			case 'select_table_by_content': {
				const { containsText } = args
				if (!containsText) {
					return 'Error: containsText is required'
				}

				// Find all tables and their content
				const doc = tiptapEditor.state.doc
				let targetTablePos: number | null = null

				doc.descendants((node: any, pos: number) => {
					if (node.type.name === 'table' && targetTablePos === null) {
						// Get all text content from this table
						let tableText = ''
						node.descendants((child: any) => {
							if (child.isText) {
								tableText += child.text
							}
						})

						// Check if table contains the search text (case insensitive)
						if (tableText.toLowerCase().includes(containsText.toLowerCase())) {
							targetTablePos = pos
							return false // Stop searching
						}
					}
				})

				if (targetTablePos === null) {
					return `No table containing "${containsText}" found`
				}

				// Move cursor to the first cell of the found table
				tiptapEditor.chain().focus().setTextSelection(targetTablePos + 3).run()
				return `Selected table containing "${containsText}" - cursor is now inside it`
			}

			case 'add_table_row': {
				const { position } = args
				if (position === 'above') {
					tiptapEditor.chain().focus().addRowBefore().run()
				} else {
					tiptapEditor.chain().focus().addRowAfter().run()
				}
				return `Added row ${position || 'below'} current row`
			}

			case 'delete_table_row': {
				tiptapEditor.chain().focus().deleteRow().run()
				return 'Deleted current row'
			}

			case 'add_table_column': {
				const { position } = args
				if (position === 'left') {
					tiptapEditor.chain().focus().addColumnBefore().run()
				} else {
					tiptapEditor.chain().focus().addColumnAfter().run()
				}
				return `Added column ${position || 'right'} of current column`
			}

			case 'delete_table_column': {
				tiptapEditor.chain().focus().deleteColumn().run()
				return 'Deleted current column'
			}

			case 'delete_table': {
				tiptapEditor.chain().focus().deleteTable().run()
				return 'Deleted entire table'
			}

			case 'merge_table_cells': {
				tiptapEditor.chain().focus().mergeCells().run()
				return 'Merged selected cells'
			}

			case 'split_table_cell': {
				tiptapEditor.chain().focus().splitCell().run()
				return 'Split cell'
			}

			case 'toggle_header_row': {
				tiptapEditor.chain().focus().toggleHeaderRow().run()
				return 'Toggled header row'
			}

			case 'toggle_header_column': {
				tiptapEditor.chain().focus().toggleHeaderColumn().run()
				return 'Toggled header column'
			}

			case 'navigate_table_cell': {
				const { direction } = args
				if (direction === 'next') {
					tiptapEditor.chain().focus().goToNextCell().run()
				} else {
					tiptapEditor.chain().focus().goToPreviousCell().run()
				}
				return `Moved to ${direction} cell`
			}

			case 'fix_tables': {
				tiptapEditor.chain().focus().fixTables().run()
				return 'Fixed table structure'
			}

			case 'get_table_content': {
				const { tableIndex } = args
				const targetIndex = tableIndex ?? 0
				const doc = tiptapEditor.state.doc
				let currentTableIndex = 0
				let tableData: { headers: string[], rows: string[][] } | null = null

				doc.descendants((node: any, pos: number) => {
					if (node.type.name === 'table' && tableData === null) {
						if (currentTableIndex === targetIndex) {
							const headers: string[] = []
							const rows: string[][] = []
							let isFirstRow = true

							node.forEach((row: any) => {
								if (row.type.name === 'tableRow') {
									const cells: string[] = []
									row.forEach((cell: any) => {
										let cellText = ''
										cell.descendants((n: any) => {
											if (n.isText) cellText += n.text
										})
										cells.push(cellText.trim())
									})

									if (isFirstRow) {
										headers.push(...cells)
										isFirstRow = false
									} else {
										rows.push(cells)
									}
								}
							})

							tableData = { headers, rows }
							return false
						}
						currentTableIndex++
					}
				})

				if (!tableData) {
					return `Table at index ${targetIndex} not found. Document has ${currentTableIndex} table(s).`
				}

				return JSON.stringify(tableData)
			}

			case 'replace_table':
			case 'replace_table_with_data': {
				const { tableIndex, headers, rows } = args
				const targetIndex = tableIndex ?? 0

				if (!headers || !Array.isArray(headers) || headers.length === 0) {
					return 'Error: headers array is required'
				}
				if (!rows || !Array.isArray(rows)) {
					return 'Error: rows array is required'
				}

				const doc = tiptapEditor.state.doc
				let currentTableIndex = 0
				let tablePos: { from: number, to: number } | null = null

				doc.descendants((node: any, pos: number) => {
					if (node.type.name === 'table' && tablePos === null) {
						if (currentTableIndex === targetIndex) {
							tablePos = { from: pos, to: pos + node.nodeSize }
							return false
						}
						currentTableIndex++
					}
				})

				if (!tablePos) {
					return `Table at index ${targetIndex} not found. Document has ${currentTableIndex} table(s).`
				}

				// Helper to clean cell text
				const cleanText = (text: string) => (text || '').replace(/[\n\r]/g, ' ').trim()

				// Construct Table JSON Node for ATOMIC REPLACEMENT
				// This prevents layout shifts/cursor jumps because we replace the specific range directly
				const tableNode = {
					type: 'table',
					content: [
						// Header Row
						{
							type: 'tableRow',
							content: headers.map((h: string) => ({
								type: 'tableHeader',
								content: [{
									type: 'paragraph',
									content: cleanText(h) ? [{ type: 'text', text: cleanText(h) }] : []
								}]
							}))
						},
						// Data Rows
						...rows.map((row: string[]) => ({
							type: 'tableRow',
							content: Array.from({ length: headers.length }).map((_, colIdx) => ({
								type: 'tableCell',
								content: [{
									type: 'paragraph',
									content: cleanText(row[colIdx]) ? [{ type: 'text', text: cleanText(row[colIdx]) }] : []
								}]
							}))
						}))
					]
				}

				// Execute Atomic Replacement
				const range = tablePos as { from: number, to: number }
				tiptapEditor.chain()
					.insertContentAt(range, tableNode)
					.run()

				forceViewUpdate(tiptapEditor)

				console.log(`[replace_table_with_data] Atomically replaced table ${targetIndex} with new structure`)
				return `Replaced table at index ${targetIndex} with new ${headers.length}-column table`
			}

			case 'insert_content_after_text': {
				const { targetText, content, type, tableData } = args

				if (!targetText) return 'Error: targetText is required'

				// Fuzzy Search Logic
				const doc = tiptapEditor.state.doc
				let foundPos: number | null = null
				let bestMatchScore = 0

				const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
				const targetNormalized = normalize(targetText)
				const targetTokens = targetNormalized.split(' ')

				doc.descendants((node: any, pos: number) => {
					if (node.isText) {
						const nodeText = normalize(node.text || '')

						// 1. Exact substring match (Highest priority)
						if (nodeText.includes(targetNormalized)) {
							foundPos = pos + node.nodeSize
							bestMatchScore = 100
							return false // Stop search
						}

						// 2. Token match (Medium priority)
						let matchCount = 0
						targetTokens.forEach(token => {
							if (nodeText.includes(token)) matchCount++
						})

						const score = (matchCount / targetTokens.length) * 100
						if (score > 60 && score > bestMatchScore) { // Threshold 60% match
							bestMatchScore = score
							foundPos = pos + node.nodeSize
						}
					}
				})

				if (!foundPos) {
					return `Could not find text similar to "${targetText}". Please refine your search.`
				}

				// Move cursor to found position and insert paragraph break
				tiptapEditor.chain().focus().setPosition(foundPos).insertContent('<p></p>').run()

				// Move into new paragraph
				tiptapEditor.chain().focus().run()

				if (type === 'table_data' && tableData) {
					// Reuse table insertion logic
					const headers = tableData.headers
					const rows = tableData.rows
					const numCols = headers.length
					const numRows = rows.length + 1

					if (tableData.title) {
						tiptapEditor.chain().focus().insertContent(`<h2>${tableData.title}</h2><p></p>`).run()
						tiptapEditor.chain().focus().run()
					}

					tiptapEditor.chain().focus().insertTable({ rows: numRows, cols: numCols, withHeaderRow: true }).run()

					// Fill header
					const cleanText = (text: string) => (text || '').replace(/[\n\r]/g, ' ').trim()
					let headerChain = tiptapEditor.chain().focus()
					for (let col = 0; col < numCols; col++) {
						headerChain = headerChain.insertContent(cleanText(headers[col])).goToNextCell()
					}
					headerChain.run()

					// Fill rows
					for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
						const rowData = rows[rowIdx] || []
						let rowChain = tiptapEditor.chain().focus()
						for (let col = 0; col < numCols; col++) {
							rowChain = rowChain.insertContent(cleanText(rowData[col])).goToNextCell()
						}
						rowChain.run()
					}

					return `Inserted table after "${targetText}"`

				} else {
					// Standard content insertion
					const cleanContent = (content || '').replace(/\n/g, '').replace(/\r/g, '').trim()
					tiptapEditor.chain().focus().insertContent(cleanContent).run()
					return `Inserted content after "${targetText}"`
				}
			}

			case 'insert_link': {
				const { href, text } = args
				if (text) {
					// Insert new linked text
					tiptapEditor.chain().focus().insertContent(`<a href="${href}">${text}</a>`).run()
				} else {
					// Link selected text
					tiptapEditor.chain().focus().setLink({ href }).run()
				}
				return `Inserted link to ${href}`
			}

			// ===== ADVANCED FORMATTING =====
			case 'set_line_spacing': {
				const { spacing } = args
				tiptapEditor.chain().focus().setLineSpacing(spacing).run()
				return `Set line spacing to ${spacing}`
			}

			// ===== ADVANCED CURSOR NAVIGATION TOOLS =====
			case 'move_to_section': {
				const { sectionName, position } = args
				if (!sectionName) {
					return 'Error: sectionName is required'
				}
				const { moveToSection } = await import('@/lib/ai/cursorNavigation')
				const result = moveToSection(tiptapEditor, { sectionName, position: position || 'start' })
				return result.success ? result.message : `Error: ${result.message}`
			}

			case 'move_to_element': {
				const { elementType, index, position } = args
				if (!elementType) {
					return 'Error: elementType is required'
				}
				const { moveToElement } = await import('@/lib/ai/cursorNavigation')
				const result = moveToElement(tiptapEditor, { elementType, index: index || 1, position: position || 'start' })
				return result.success ? result.message : `Error: ${result.message}`
			}

			case 'move_relative': {
				const { direction, units, unitType } = args
				if (!direction || !units || !unitType) {
					return 'Error: direction, units, and unitType are required'
				}
				const { moveRelative } = await import('@/lib/ai/cursorNavigation')
				const result = moveRelative(tiptapEditor, { direction, units, unitType })
				return result.success ? result.message : `Error: ${result.message}`
			}

			case 'select_block': {
				const { blockType } = args
				const { selectBlock } = await import('@/lib/ai/cursorNavigation')
				const result = selectBlock(tiptapEditor, { blockType: blockType || 'current' })
				return result.success ? result.message : `Error: ${result.message}`
			}

			case 'get_position_info_detailed': {
				const { getPositionInfoDetailed } = await import('@/lib/ai/cursorNavigation')
				const result = getPositionInfoDetailed(tiptapEditor)
				return JSON.stringify(result)
			}

			case 'perform_tiptap_command': {
				const { command } = args
				const chain = tiptapEditor.chain().focus()

				switch (command) {
					case 'undo': chain.undo(); break
					case 'redo': chain.redo(); break
					case 'selectAll': chain.selectAll(); break
					case 'selectParentNode': chain.selectParentNode(); break
					case 'selectTextblockStart': chain.selectTextblockStart(); break
					case 'selectTextblockEnd': chain.selectTextblockEnd(); break
					case 'selectNodeBackward': chain.selectNodeBackward(); break
					case 'selectNodeForward': chain.selectNodeForward(); break
					case 'deleteSelection': chain.deleteSelection(); break
					case 'lift': chain.lift(); break
					case 'sink': chain.sink(); break
					case 'splitBlock': chain.splitBlock(); break
					case 'hardBreak': chain.setHardBreak(); break
					case 'liftListItem': chain.liftListItem('listItem'); break // Standard Tiptap list item type
					case 'sinkListItem': chain.sinkListItem('listItem'); break
					case 'joinBackward': chain.joinBackward(); break
					case 'joinForward': chain.joinForward(); break
					case 'unsetAllMarks': chain.unsetAllMarks(); break
					case 'clearNodes': chain.clearNodes(); break
					case 'focus': chain.focus(); break
					case 'scrollIntoView': chain.scrollIntoView(); break
					default: return `Error: Unknown command "${command}"`
				}

				chain.run()
				forceViewUpdate(tiptapEditor)
				return `Executed Tiptap command: ${command}`
			}

			// ===== DOCUMENT CONTEXT TOOLS =====
			case 'get_document_context': {
				const { buildDocumentContext, formatContextForPrompt } = await import('@/lib/ai/documentContext')
				const context = buildDocumentContext(tiptapEditor)
				return formatContextForPrompt(context)
			}

			case 'get_section_content': {
				const { sectionName } = args
				if (!sectionName) {
					return 'Error: sectionName is required'
				}
				const { getSectionContent } = await import('@/lib/ai/documentContext')
				const result = getSectionContent(tiptapEditor, sectionName)
				if (!result) {
					return `Section "${sectionName}" not found`
				}
				return JSON.stringify(result)
			}

			default:
				return `Unknown tool: ${toolName}`
		}
	} catch (error) {
		console.error(`[Tool Execution] Error executing ${toolName}:`, error)
		return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
	}
}


export function AIChatPanel({ editor, onClose }: AIChatPanelProps) {
	const [messages, setMessages] = useState<Message[]>([])
	const [input, setInput] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}

	useEffect(() => {
		scrollToBottom()
	}, [messages])

	const threadIdRef = useRef<string>(`thread_${Date.now()}_${Math.random().toString(36).substring(7)}`)

	const handleClearChat = () => {
		setMessages([])
		// Reset thread ID for new conversation context
		threadIdRef.current = `thread_${Date.now()}_${Math.random().toString(36).substring(7)}`
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!input.trim() || isLoading) return

		const userMessage: Message = {
			id: Date.now().toString(),
			role: 'user',
			content: input.trim(),
			timestamp: new Date(),
		}

		setMessages((prev) => [...prev, userMessage])
		const userInput = input.trim()
		setInput('')
		setIsLoading(true)

		// Create assistant message placeholder for streaming
		const assistantId = (Date.now() + 1).toString()
		setMessages((prev) => [
			...prev,
			{
				id: assistantId,
				role: 'assistant',
				content: '',
				timestamp: new Date(),
			},
		])

		try {
			// Get real Tiptap editor for tool execution
			const tiptapEditor = editor?.editor

			const conversationHistory = messages.slice(-10).map((msg) => ({
				role: msg.role,
				content: msg.content,
			}))

			// Get document content and sections for LangGraph
			let docText = ''
			let docHtml = ''
			let sections: string[] = []
			if (tiptapEditor) {
				try {
					docText = tiptapEditor.getText()
					docHtml = tiptapEditor.getHTML()
					const docJson = tiptapEditor.getJSON()
					docJson.content?.forEach((node: any) => {
						if (node.type === 'heading') {
							const text = node.content?.map((c: any) => c.text || '').join('') || ''
							if (text) sections.push(text)
						} else if (node.type === 'paragraph' && node.content) {
							const text = node.content?.map((c: any) => c.text || '').join('') || ''
							const hasBold = node.content?.some((c: any) => c.marks?.some((m: any) => m.type === 'bold'))
							if (text && hasBold && text === text.toUpperCase() && text.length > 3) {
								sections.push(text)
							}
						}
					})
					console.log('[AI LangGraph] Document sections:', sections)
				} catch (e) {
					console.log('[AI] Could not get document context:', e)
				}
			}

			const MAX_STEPS = 20 // Max steps, but stops early when task complete (no tool_calls)
			let currentStep = 0
			let accumulatedContent = ''
			let toolResultsForContinuation: Array<{ toolCallId: string; name: string; result: string }> = []
			let shouldContinue = true

			while (shouldContinue && currentStep < MAX_STEPS) {
				currentStep++
				console.log(`[AI] Step ${currentStep}/${MAX_STEPS}`)

				// Refresh document content each step (may have changed from tool execution)
				let currentDocText = docText
				let currentDocHtml = docHtml
				let currentSections = sections
				if (tiptapEditor && currentStep > 1) {
					try {
						currentDocText = tiptapEditor.getText()
						currentDocHtml = tiptapEditor.getHTML()
						const docJson = tiptapEditor.getJSON()
						currentSections = []
						docJson.content?.forEach((node: any) => {
							if (node.type === 'heading') {
								const text = node.content?.map((c: any) => c.text || '').join('') || ''
								if (text) currentSections.push(text)
							}
						})
					} catch (e) { /* ignore */ }
				}

				const response = await fetch('/api/ai-stream', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						message: userInput,
						documentContent: currentDocText,
						documentHTML: currentDocHtml,
						documentSections: currentSections,
						conversationHistory,
						toolResults: toolResultsForContinuation.length > 0 ? toolResultsForContinuation : undefined,
						threadId: threadIdRef.current, // Pass persistent threadId
					}),
				})

				if (!response.ok) {
					throw new Error(`AI request failed: ${response.statusText}`)
				}

				// Handle SSE streaming
				const reader = response.body?.getReader()
				const decoder = new TextDecoder()

				if (!reader) {
					throw new Error('No response stream available')
				}

				// Reset tool results for this step
				toolResultsForContinuation = []
				let hasToolCalls = false

				while (true) {
					const { done, value } = await reader.read()
					if (done) break

					// Decode chunk
					const chunk = decoder.decode(value, { stream: true })
					const lines = chunk.split('\n')

					for (const line of lines) {
						if (line.startsWith('data: ')) {
							try {
								const data = JSON.parse(line.slice(6))

								switch (data.type) {
									case 'connected':
										console.log(`[AI Step ${currentStep}] Connected`)
										break

									case 'content':
										accumulatedContent += data.content
										setMessages((prev) =>
											prev.map((msg) =>
												msg.id === assistantId
													? { ...msg, content: accumulatedContent }
													: msg
											)
										)
										break

									case 'tool_calls': {
										hasToolCalls = true
										console.log(`[AI Step ${currentStep}] 🔧 Received ${data.toolCalls.length} tool call(s):`)
										data.toolCalls.forEach((tc: any, i: number) => {
											console.log(`  ${i + 1}. ${tc.name}`, tc.args)
										})

										for (const toolCall of data.toolCalls) {
											try {
												console.log(`[AI Step ${currentStep}] ▶️ Executing: ${toolCall.name}`)
												const result = await executeToolOnEditor(
													tiptapEditor,
													toolCall.name,
													toolCall.args
												)
												console.log(`[AI Step ${currentStep}] ✅ Result:`, result.substring(0, 200))

												// Store result for continuation
												toolResultsForContinuation.push({
													toolCallId: toolCall.id,
													name: toolCall.name,
													result: result,
												})

												// Show non-reading tools in chat
												const readingTools = ['read_document', 'get_sections', 'get_document_stats']
												if (!readingTools.includes(toolCall.name)) {
													accumulatedContent += `\n\n✓ ${toolCall.name}: ${result}`
													setMessages((prev) =>
														prev.map((msg) =>
															msg.id === assistantId
																? { ...msg, content: accumulatedContent }
																: msg
														)
													)
												}
											} catch (toolError) {
												console.log(`[AI Step ${currentStep}] ❌ Error:`, toolError)
												toolResultsForContinuation.push({
													toolCallId: toolCall.id,
													name: toolCall.name,
													result: `Error: ${toolError instanceof Error ? toolError.message : 'Unknown error'}`,
												})
												accumulatedContent += `\n\n✗ ${toolCall.name}: Failed`
												setMessages((prev) =>
													prev.map((msg) =>
														msg.id === assistantId
															? { ...msg, content: accumulatedContent }
															: msg
													)
												)
											}
										}
										break
									}

									case 'done':
									case 'stream_end':
										// Graph explicitly signals completion - ALWAYS stop
										// hasMoreSteps: false means graph is truly done
										if (data.hasMoreSteps === false || !hasToolCalls) {
											shouldContinue = false
											console.log(`[AI Step ${currentStep}] Graph signaled completion`)
										}
										break

									case 'error':
										throw new Error(data.error)
								}
							} catch (parseError) {
								console.error('[AI] Parse error:', parseError)
							}
						}
					}
				}

				// If no tool calls OR graph said done, task complete
				if (!hasToolCalls) {
					shouldContinue = false
					console.log(`[AI] Task complete after ${currentStep} step(s)`)
				}
			}

			if (currentStep >= MAX_STEPS) {
				accumulatedContent += '\n\n⚠️ Reached max steps limit'
				setMessages((prev) =>
					prev.map((msg) =>
						msg.id === assistantId ? { ...msg, content: accumulatedContent } : msg
					)
				)
			}

			// If no content was received, show error
			if (!accumulatedContent) {
				setMessages((prev) =>
					prev.map((msg) =>
						msg.id === assistantId
							? {
								...msg,
								content:
									'Sorry, I received an empty response. Please try again.',
							}
							: msg
					)
				)
			}
		} catch (error) {
			console.error('[AI] Error:', error)

			// Update assistant message with error
			setMessages((prev) =>
				prev.map((msg) =>
					msg.id === assistantId
						? {
							...msg,
							content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'
								}. Please try again.`,
						}
						: msg
				)
			)
		} finally {
			setIsLoading(false)
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			handleSubmit(e)
		}
	}

	return (
		<div className='flex flex-col h-full bg-white'>
			{/* Header */}
			<div className='flex items-center justify-between px-6 py-4 border-b'>
				<h2 className='text-lg font-semibold text-gray-900'>Neptune</h2>
				<div className='flex items-center gap-2'>
					<Button variant='outline' size='sm' onClick={handleClearChat}>
						Clear Chat
					</Button>
					{onClose && (
						<Button
							variant='ghost'
							size='icon'
							onClick={onClose}
							className='h-8 w-8'
							aria-label='Close AI Assistant'
						>
							<svg
								className='w-5 h-5'
								fill='none'
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth='2'
								viewBox='0 0 24 24'
								stroke='currentColor'
							>
								<path d='M6 18L18 6M6 6l12 12'></path>
							</svg>
						</Button>
					)}
				</div>
			</div>

			{/* Messages Area */}
			<div className='flex-1 overflow-y-auto px-6 py-4 space-y-4'>
				{messages.length === 0 ? (
					<div className='flex flex-col items-center justify-center h-full text-center'>
						<div className='w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center'>
							<svg
								className='w-8 h-8 text-gray-400'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z'
								/>
							</svg>
						</div>
						<h3 className='text-lg font-medium text-gray-900 mb-2'>Start a conversation</h3>
						<p className='text-sm text-gray-500 max-w-xs'>
							Ask questions about your document, get suggestions, or request help with writing and editing.
						</p>
						<div className='mt-4 text-xs text-gray-400'>
							<p>Try: &quot;Delete the EDUCATION section&quot;</p>
							<p>Or: &quot;Replace all &apos;Student&apos; with &apos;Professional&apos;&quot;</p>
						</div>
					</div>
				) : (
					<>
						{messages.map((message) => (
							<div
								key={message.id}
								className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
							>
								<div
									className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
										? 'bg-primary text-primary-foreground'
										: 'bg-gray-100 text-gray-900'
										}`}
								>
									<p className='text-sm whitespace-pre-wrap break-words'>{message.content}</p>
								</div>
							</div>
						))}
						{isLoading && (
							<div className='flex justify-start'>
								<div className='max-w-[80%] rounded-2xl px-4 py-3 bg-gray-100'>
									<div className='flex space-x-2'>
										<div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'></div>
										<div
											className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
											style={{ animationDelay: '0.2s' }}
										></div>
										<div
											className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
											style={{ animationDelay: '0.4s' }}
										></div>
									</div>
								</div>
							</div>
						)}
						<div ref={messagesEndRef} />
					</>
				)}
			</div>

			{/* Input Area - White Theme */}
			<div className='bg-white px-4 py-4 border-t border-gray-200'>
				<form onSubmit={handleSubmit} className='relative'>
					{/* Add Context Button */}
					<div className='mb-3'>
						<Button
							type='button'
							variant='ghost'
							size='sm'
							className='h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full px-4 text-sm'
						>
							<svg
								className='w-4 h-4 mr-2'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207'
								/>
							</svg>
							Add context
						</Button>
					</div>

					{/* Text Input Container with White Theme */}
					<div className='relative bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-gray-300 transition-colors'>
						<Textarea
							ref={textareaRef}
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder='Ask, search, or make anything...'
							className='min-h-[100px] max-h-[200px] resize-none bg-transparent border-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus-visible:ring-0 focus-visible:border-0 px-4 pt-4 pb-14 text-base'
							disabled={isLoading}
						/>

						{/* Bottom Controls */}
						<div className='absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 pb-3'>
							{/* Left Controls - Attachment + Mode Selectors */}
							<div className='flex items-center gap-3'>
								{/* Attachment Button */}
								<Button
									type='button'
									variant='ghost'
									size='icon'
									className='h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-lg'
								>
									<svg
										className='w-4 h-4'
										fill='none'
										stroke='currentColor'
										viewBox='0 0 24 24'
									>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth={2}
											d='M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13'
										/>
									</svg>
								</Button>

								{/* Mode Selectors */}
								<div className='flex items-center gap-4 text-xs text-gray-500'>
									<button
										type='button'
										className='flex items-center gap-1.5 hover:text-gray-900 transition-colors'
									>
										<svg
											className='w-4 h-4'
											fill='none'
											stroke='currentColor'
											viewBox='0 0 24 24'
										>
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth={2}
												d='M13 10V3L4 14h7v7l9-11h-7z'
											/>
										</svg>
										Auto
									</button>
									<button
										type='button'
										className='flex items-center gap-1.5 hover:text-gray-900 transition-colors'
									>
										<svg
											className='w-4 h-4'
											fill='none'
											stroke='currentColor'
											viewBox='0 0 24 24'
										>
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth={2}
												d='M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9'
											/>
										</svg>
										All Sources
									</button>
								</div>
							</div>

							{/* Right Control - Submit Button */}
							<Button
								type='submit'
								size='icon'
								disabled={!input.trim() || isLoading}
								className={`shrink-0 rounded-full w-9 h-9 transition-colors ${input.trim() && !isLoading
									? 'bg-primary hover:bg-primary/90 text-primary-foreground'
									: 'bg-gray-300 text-gray-500 cursor-not-allowed'
									}`}
							>
								<svg
									className='w-4 h-4'
									fill='none'
									stroke='currentColor'
									strokeWidth={2.5}
									viewBox='0 0 24 24'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										d='M5 10l7-7m0 0l7 7m-7-7v18'
									/>
								</svg>
							</Button>
						</div>
					</div>
				</form>
			</div>
		</div>
	)
}
