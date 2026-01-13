/**
 * Document Editing Tools for AI Assistant (Neptune)
 * 
 * This module provides a comprehensive set of tools for AI-powered document editing.
 * Tools are designed to work with Tiptap editor and LangChain.js agents.
 * 
 * Architecture:
 * - Tools use LangChain's tool() function with Zod schemas for validation
 * - Each tool returns JSON strings for structured data or success/error messages
 * - Tools operate on the real client-side Tiptap editor instance
 * - Error handling is built into each tool with descriptive messages
 * 
 * Tool Categories:
 * 1. Content Reading: read_document, get_sections
 * 2. Content Manipulation: find_and_replace, delete_section, delete_by_text, insert_after_text
 * 3. Formatting: format_text, set_text_style, set_text_align
 * 4. Structure: insert_table, insert_horizontal_rule
 * 5. Analytics: get_document_stats
 * 6. History: undo_redo
 * 
 * IMPORTANT: All editing tools use TEXT-BASED SEMANTIC operations, not position-based.
 * This ensures reliability when AI operates on documents.
 * 
 * @module ai/tools
 */

import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import type { Editor } from '@tiptap/core'

/**
 * Create document editing tools for LangChain agent
 * 
 * @param editor - Tiptap editor instance to operate on
 * @returns Array of LangChain tool definitions with semantic CRUD operations
 */
export const createDocumentTools = (editor: Editor, htmlContent?: string) => {
	return [
		// ===== CURSOR CONTROL TOOLS =====

		// Get cursor position and context
		tool(
			async () => {
				try {
					return JSON.stringify({
						action: 'get_cursor_info',
					})
				} catch (error) {
					return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'get_cursor_info',
				description: 'Get current cursor position, selection range, and surrounding context. Use this to understand WHERE you are in the document.',
				schema: z.object({}),
			}
		),

		// Move cursor to specific position
		tool(
			async ({ position, target }) => {
				try {
					return JSON.stringify({
						action: 'set_cursor_position',
						position,
						target,
					})
				} catch (error) {
					return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'set_cursor_position',
				description: 'Move cursor to a position. Use position for exact number, or target for semantic positions like "start", "end", "after:TEXT"',
				schema: z.object({
					position: z.number().optional().describe('Exact character position (0-based)'),
					target: z.string().optional().describe('Semantic target: "start", "end", "after:SEARCH_TEXT", "before:SEARCH_TEXT"'),
				}),
			}
		),

		// Select text by content or range
		tool(
			async ({ text, from, to }) => {
				try {
					return JSON.stringify({
						action: 'select_text',
						text,
						from,
						to,
					})
				} catch (error) {
					return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'select_text',
				description: 'Select text in the document. Either provide text to find and select, or from/to positions for exact range.',
				schema: z.object({
					text: z.string().optional().describe('Text to find and select'),
					from: z.number().optional().describe('Start position for range selection'),
					to: z.number().optional().describe('End position for range selection'),
				}),
			}
		),

		// Get context at current cursor
		tool(
			async () => {
				try {
					return JSON.stringify({
						action: 'get_context_at_cursor',
					})
				} catch (error) {
					return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'get_context_at_cursor',
				description: 'Get detailed context at cursor: which element (table/list/paragraph/heading), parent structure, nearby text. Use this to make informed edits.',
				schema: z.object({}),
			}
		),

		// ===== CONTENT READING TOOLS =====


		// Read document content with structure info
		tool(
			async ({ selection }) => {
				try {
					if (selection) {
						// Get selected text only
						const { from, to } = editor.state.selection
						const selectedText = editor.state.doc.textBetween(from, to, '\n')
						return JSON.stringify({
							content: selectedText,
							selection: true,
							from,
							to,
						})
					}

					// Get full document with structured info
					const json = editor.getJSON()
					const text = editor.getText()

					// Extract sections (headings) for structure awareness
					const sections: Array<{ text: string; level: number }> = []
					json.content?.forEach((node: any) => {
						if (node.type === 'heading') {
							const headingText = node.content?.map((c: any) => c.text || '').join('') || ''
							sections.push({
								text: headingText,
								level: node.attrs?.level || 1,
							})
						}
					})

					return JSON.stringify({
						content: json,
						text,
						sections,
						selection: false,
						wordCount: text.split(/\s+/).filter(Boolean).length,
						charCount: text.length,
					})
				} catch (error) {
					return `Error reading document: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'read_document',
				description:
					'Read the current document content. Returns full document as JSON, text, and section list. Set selection=true to read only selected text. ALWAYS call this first before any editing operation.',
				schema: z.object({
					selection: z
						.boolean()
						.optional()
						.describe('Set to true to read only selected text'),
				}),
			}
		),

		// Get all sections/headings in document
		tool(
			async () => {
				try {
					const json = editor.getJSON()
					const sections: Array<{ text: string; level: number; nodeIndex: number }> = []

					json.content?.forEach((node: any, index: number) => {
						if (node.type === 'heading') {
							const headingText = node.content?.map((c: any) => c.text || '').join('') || ''
							sections.push({
								text: headingText,
								level: node.attrs?.level || 1,
								nodeIndex: index,
							})
						}
					})

					return JSON.stringify({
						sections,
						totalSections: sections.length,
					})
				} catch (error) {
					return `Error getting sections: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'get_sections',
				description: 'Get all section headings in the document. Returns list of headings with their text and level. Use this to understand document structure before editing.',
				schema: z.object({}),
			}
		),

		// ===== CHUNKING TOOLS FOR LARGE DOCUMENTS =====

		// Read a specific chunk
		tool(
			async ({ chunkIndex }) => {
				try {
					return JSON.stringify({
						action: 'read_chunk',
						chunkIndex: chunkIndex ?? 0,
					})
				} catch (error) {
					return `Error in read_chunk: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'read_chunk',
				description:
					'Read a specific chunk of a large document by index. For documents over 8000 characters, content is split into chunks. Use get_chunk_info first to see available chunks.',
				schema: z.object({
					chunkIndex: z.number().optional().describe('Index of chunk to read (0-based, default: 0)'),
				}),
			}
		),

		// Read chunk containing a section
		tool(
			async ({ sectionName }) => {
				try {
					if (!sectionName) {
						return 'Error: sectionName is required'
					}
					return JSON.stringify({
						action: 'read_chunk_by_section',
						sectionName,
					})
				} catch (error) {
					return `Error in read_chunk_by_section: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'read_chunk_by_section',
				description:
					'Read the chunk that contains a specific section. Useful for navigating large documents to find relevant content.',
				schema: z.object({
					sectionName: z.string().describe('Name of the section to find (e.g., "EDUCATION", "EXPERIENCE")'),
				}),
			}
		),

		// Get chunk overview
		tool(
			async () => {
				try {
					return JSON.stringify({
						action: 'get_chunk_info',
					})
				} catch (error) {
					return `Error in get_chunk_info: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'get_chunk_info',
				description:
					'Get information about document chunks including total count, sections per chunk, and word counts. Call this first for large documents.',
				schema: z.object({}),
			}
		),

		// ===== SEMANTIC CONTENT MANIPULATION TOOLS =====

		// Find and replace text (MOST RELIABLE for editing)
		tool(
			async ({ searchText, replaceWith, replaceAll, caseSensitive }) => {
				try {
					if (!searchText) {
						return 'Error: searchText is required'
					}

					// This will be executed client-side with proper implementation
					// Return instruction for client-side execution
					return JSON.stringify({
						action: 'find_and_replace',
						searchText,
						replaceWith: replaceWith || '',
						replaceAll: replaceAll ?? false,
						caseSensitive: caseSensitive ?? false,
					})
				} catch (error) {
					return `Error in find_and_replace: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'find_and_replace',
				description:
					'Find text in the document and replace it. This is the MOST RELIABLE way to edit text. Use empty string for replaceWith to delete text. Supports case-sensitive search and replace all occurrences.',
				schema: z.object({
					searchText: z.string().describe('Text to search for (exact match)'),
					replaceWith: z.string().optional().describe('Replacement text. Empty string or omit to delete the text.'),
					replaceAll: z.boolean().optional().describe('Replace all occurrences (default: false, replaces first only)'),
					caseSensitive: z.boolean().optional().describe('Case sensitive search (default: false)'),
				}),
			}
		),

		// Delete section by heading name
		tool(
			async ({ sectionName, includeHeading }) => {
				try {
					if (!sectionName) {
						return 'Error: sectionName is required'
					}

					// Return instruction for client-side execution
					return JSON.stringify({
						action: 'delete_section',
						sectionName,
						includeHeading: includeHeading ?? true,
					})
				} catch (error) {
					return `Error in delete_section: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'delete_section',
				description:
					'Delete a section of the document by its heading name. Finds the heading and deletes all content from it until the next heading or end of document. Use this to remove entire sections like "EDUCATION", "EXPERIENCE", etc.',
				schema: z.object({
					sectionName: z.string().describe('Text of the section heading to delete (e.g., "EDUCATION", "PROJECTS")'),
					includeHeading: z.boolean().optional().describe('Also delete the heading itself (default: true)'),
				}),
			}
		),

		// Move section by heading name
		tool(
			async ({ sectionName, position }) => {
				try {
					if (!sectionName) {
						return 'Error: sectionName is required'
					}

					return JSON.stringify({
						action: 'move_section',
						sectionName,
						position: position || 'start',
					})
				} catch (error) {
					return `Error in move_section: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'move_section',
				description:
					'Move an entire section (heading + content) to a new position in the document. This is atomic (cut & paste) and preserves all content. Supported positions: "start" (top of doc), "end" (bottom of doc).',
				schema: z.object({
					sectionName: z.string().describe('Name of the section heading to move'),
					position: z.enum(['start', 'end']).optional().describe('Target position (default: start)'),
				}),
			}
		),

		// Delete content containing specific text
		tool(
			async ({ containsText, deleteType }) => {
				try {
					if (!containsText) {
						return 'Error: containsText is required'
					}

					return JSON.stringify({
						action: 'delete_by_text',
						containsText,
						deleteType: deleteType || 'paragraph',
					})
				} catch (error) {
					return `Error in delete_by_text: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'delete_by_text',
				description:
					'Delete a paragraph or list item that contains the specified text. Use this for surgical removal of specific content.',
				schema: z.object({
					containsText: z.string().describe('Text that the paragraph/item must contain to be deleted'),
					deleteType: z.enum(['paragraph', 'listItem', 'any']).optional().describe('Type of node to delete (default: paragraph)'),
				}),
			}
		),

		// Insert content after specific text
		tool(
			async ({ afterText, content, newParagraph }) => {
				try {
					if (!afterText || !content) {
						return 'Error: afterText and content are required'
					}

					return JSON.stringify({
						action: 'insert_after_text',
						afterText,
						content,
						newParagraph: newParagraph ?? true,
					})
				} catch (error) {
					return `Error in insert_after_text: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'insert_after_text',
				description:
					'Insert new content after a paragraph that contains specific text. Use HTML for formatting: <strong>bold</strong>, <em>italic</em>, <u>underline</u>, <h1>heading</h1>, <ul><li>list</li></ul>',
				schema: z.object({
					afterText: z.string().describe('Text that identifies where to insert (finds paragraph containing this text)'),
					content: z.string().describe('HTML content to insert. Use <strong>, <em>, <u>, <h1>-<h4>, <ul>/<ol>, <p> tags'),
					newParagraph: z.boolean().optional().describe('Insert as new paragraph (default: true)'),
				}),
			}
		),

		// Insert content at cursor or end
		tool(
			async ({ content, position }) => {
				try {
					return JSON.stringify({
						action: 'insert_content',
						content,
						position: position || 'cursor',
					})
				} catch (error) {
					return `Error inserting content: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'insert_content',
				description: 'Insert new content at position. Use HTML for formatting: <strong>bold</strong>, <em>italic</em>, <u>underline</u>, <h1>heading</h1>, <ul><li>list</li></ul>, <p>paragraph</p>',
				schema: z.object({
					content: z.string().describe('HTML content to insert. Examples: "<h2>Title</h2><p>Text with <strong>bold</strong> and <em>italic</em></p>"'),
					position: z.enum(['cursor', 'end', 'start']).optional().describe('Where to insert (default: cursor)'),
				}),
			}
		),

		// Clear all document content
		tool(
			async () => {
				try {
					return JSON.stringify({
						action: 'clear_document',
					})
				} catch (error) {
					return `Error clearing document: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'clear_document',
				description: 'Clear ALL content from the document. Use this when the user wants to delete everything or start fresh. WARNING: This cannot be undone easily.',
				schema: z.object({}),
			}
		),

		// Apply formatting to specific text (find and format)
		tool(
			async ({ searchText, format, replaceAll }) => {
				try {
					if (!searchText || !format) {
						return 'Error: searchText and format are required'
					}

					return JSON.stringify({
						action: 'apply_format_to_text',
						searchText,
						format,
						replaceAll: replaceAll ?? false,
					})
				} catch (error) {
					return `Error in apply_format_to_text: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'apply_format_to_text',
				description:
					'Find specific text and apply formatting to it. Use this to make text bold, italic, underline, etc. WITHOUT replacing the text. Example: apply_format_to_text({ searchText: "PROJECTS", format: "bold" })',
				schema: z.object({
					searchText: z.string().describe('Exact text to find and format'),
					format: z
						.enum(['bold', 'italic', 'underline', 'strike', 'code', 'highlight'])
						.describe('Format to apply: bold, italic, underline, strike, code, highlight'),
					replaceAll: z.boolean().optional().describe('Apply to all occurrences (default: false, only first)'),
				}),
			}
		),

		// ===== FORMATTING TOOLS =====

		// Format text
		tool(
			async ({ format, level }) => {
				try {
					const chain = editor.chain().focus()

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
								chain.toggleHeading({ level: level as 1 | 2 | 3 | 4 }).run()
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

					return `Successfully applied ${format} formatting${level ? ` (level ${level})` : ''}`
				} catch (error) {
					return `Error formatting text: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'format_text',
				description:
					'Apply formatting to selected text or toggle formatting. First select text, then apply formatting. Supports bold, italic, underline, strike, code, highlight, headings, lists, blockquote, code block.',
				schema: z.object({
					format: z
						.enum([
							'bold',
							'italic',
							'underline',
							'strike',
							'code',
							'highlight',
							'heading',
							'bulletList',
							'orderedList',
							'blockquote',
							'codeBlock',
						])
						.describe('Format to apply'),
					level: z
						.number()
						.min(1)
						.max(4)
						.optional()
						.describe('Heading level (1-4, only for heading format)'),
				}),
			}
		),

		// Set text style (font, size, color)
		tool(
			async ({ fontSize, fontFamily, color, highlightColor }) => {
				try {
					return JSON.stringify({
						action: 'set_text_style',
						fontSize,
						fontFamily,
						color,
						highlightColor,
					})
				} catch (error) {
					return `Error setting text style: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'set_text_style',
				description:
					'Set text style properties like font size, font family, text color, or highlight color on selected text.',
				schema: z.object({
					fontSize: z.string().optional().describe('Font size (e.g., "12pt", "16px")'),
					fontFamily: z.string().optional().describe('Font family (e.g., "Arial", "Times New Roman")'),
					color: z.string().optional().describe('Text color (e.g., "#ff0000", "red")'),
					highlightColor: z.string().optional().describe('Highlight/background color'),
				}),
			}
		),

		// Set text alignment
		tool(
			async ({ alignment }) => {
				try {
					editor.chain().focus().setTextAlign(alignment).run()
					return `Successfully set text alignment to ${alignment}`
				} catch (error) {
					return `Error setting alignment: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'set_text_align',
				description: 'Set text alignment for selected text or paragraph.',
				schema: z.object({
					alignment: z
						.enum(['left', 'center', 'right', 'justify'])
						.describe('Text alignment'),
				}),
			}
		),

		// ===== STRUCTURE TOOLS =====

		// Get list of all tables in document
		tool(
			async () => {
				try {
					return JSON.stringify({
						action: 'get_all_tables',
					})
				} catch (error) {
					return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'get_all_tables',
				description: 'Get a list of all tables in the document with their index, position, and content preview. Use this to understand what tables exist before modifying them.',
				schema: z.object({}),
			}
		),

		// Select table by index (1-based)
		tool(
			async ({ tableIndex }) => {
				try {
					return JSON.stringify({
						action: 'select_table_by_index',
						tableIndex,
					})
				} catch (error) {
					return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'select_table_by_index',
				description: 'Select a table by its index (1 = first table, 2 = second table, etc.). Use get_all_tables first to see available tables.',
				schema: z.object({
					tableIndex: z.number().min(1).describe('Index of table to select (1 = first table, 2 = second, etc.)'),
				}),
			}
		),

		// Select table by content (for smart table targeting)
		tool(
			async ({ containsText }) => {
				try {
					if (!containsText) {
						return 'Error: containsText is required'
					}
					return JSON.stringify({
						action: 'select_table_by_content',
						containsText,
					})
				} catch (error) {
					return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'select_table_by_content',
				description: 'Find and select a table that contains specific text. Use this BEFORE add_table_row, add_table_column, etc. to target a specific table.',
				schema: z.object({
					containsText: z.string().describe('Text that the target table contains (e.g., "Produk", "Sales", header text)'),
				}),
			}
		),

		// Insert table
		tool(
			async ({ rows, cols, withHeaderRow }) => {
				try {
					// Return action for client-side execution
					return JSON.stringify({
						action: 'insert_table',
						rows: rows || 3,
						cols: cols || 3,
						withHeaderRow: withHeaderRow ?? true,
					})
				} catch (error) {
					return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'insert_table',
				description: 'Insert an EMPTY table into the document with specified rows and columns.',
				schema: z.object({
					rows: z.number().min(1).max(20).describe('Number of rows'),
					cols: z.number().min(1).max(10).describe('Number of columns'),
					withHeaderRow: z
						.boolean()
						.optional()
						.describe('Include header row (default: true)'),
				}),
			}
		),

		// Insert table WITH DATA using native Tiptap commands - PREFERRED for tables with content
		tool(
			async ({ headers, rows, title }) => {
				try {
					return JSON.stringify({
						action: 'insert_table_with_data',
						headers: headers,
						rows: rows,
						title: title || null,
					})
				} catch (error) {
					return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'insert_table_with_data',
				description: 'Insert a table WITH DATA using native Tiptap commands. This is the PREFERRED method for creating tables with content. Takes structured data instead of HTML.',
				schema: z.object({
					headers: z.array(z.string()).describe('Array of column header strings, e.g., ["City", "Population", "Province"]'),
					rows: z.array(z.array(z.string())).describe('2D array of row data, e.g., [["Jakarta", "10M", "DKI"], ["Surabaya", "3M", "East Java"]]'),
					title: z.string().optional().describe('Optional title/heading to insert before the table'),
				}),
			}
		),


		// Insert horizontal rule
		tool(
			async () => {
				try {
					editor.chain().focus().setHorizontalRule().run()
					return 'Successfully inserted horizontal rule'
				} catch (error) {
					return `Error inserting horizontal rule: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'insert_horizontal_rule',
				description: 'Insert a horizontal line (divider) into the document.',
				schema: z.object({}),
			}
		),

		// Add table row
		tool(
			async ({ position }) => {
				try {
					return JSON.stringify({
						action: 'add_table_row',
						position: position || 'below',
					})
				} catch (error) {
					return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'add_table_row',
				description: 'Add a row to the table. Cursor must be inside a table.',
				schema: z.object({
					position: z.enum(['above', 'below']).optional().describe('Where to add the row (default: below)'),
				}),
			}
		),

		// Delete table row
		tool(
			async () => {
				try {
					return JSON.stringify({
						action: 'delete_table_row',
					})
				} catch (error) {
					return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'delete_table_row',
				description: 'Delete the current row from the table. Cursor must be inside a table.',
				schema: z.object({}),
			}
		),

		// Add table column
		tool(
			async ({ position }) => {
				try {
					return JSON.stringify({
						action: 'add_table_column',
						position: position || 'right',
					})
				} catch (error) {
					return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'add_table_column',
				description: 'Add a column to the table. Cursor must be inside a table.',
				schema: z.object({
					position: z.enum(['left', 'right']).optional().describe('Where to add the column (default: right)'),
				}),
			}
		),

		// Delete table column
		tool(
			async () => {
				try {
					return JSON.stringify({
						action: 'delete_table_column',
					})
				} catch (error) {
					return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'delete_table_column',
				description: 'Delete the current column from the table. Cursor must be inside a table.',
				schema: z.object({}),
			}
		),

		// Delete entire table
		tool(
			async () => {
				try {
					return JSON.stringify({
						action: 'delete_table',
					})
				} catch (error) {
					return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'delete_table',
				description: 'Delete the entire table. Cursor must be inside a table.',
				schema: z.object({}),
			}
		),

		// Merge table cells
		tool(
			async () => {
				try {
					return JSON.stringify({
						action: 'merge_table_cells',
					})
				} catch (error) {
					return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'merge_table_cells',
				description: 'Merge currently selected cells into one. Select multiple cells first.',
				schema: z.object({}),
			}
		),

		// Split table cell
		tool(
			async () => {
				try {
					return JSON.stringify({
						action: 'split_table_cell',
					})
				} catch (error) {
					return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'split_table_cell',
				description: 'Split a merged cell back into individual cells.',
				schema: z.object({}),
			}
		),

		// Toggle header row
		tool(
			async () => {
				try {
					return JSON.stringify({
						action: 'toggle_header_row',
					})
				} catch (error) {
					return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'toggle_header_row',
				description: 'Toggle the first row as a header row (styled differently).',
				schema: z.object({}),
			}
		),

		// Toggle header column
		tool(
			async () => {
				try {
					return JSON.stringify({
						action: 'toggle_header_column',
					})
				} catch (error) {
					return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'toggle_header_column',
				description: 'Toggle the first column as a header column (styled differently).',
				schema: z.object({}),
			}
		),

		// Go to next/previous cell
		tool(
			async ({ direction }) => {
				try {
					return JSON.stringify({
						action: 'navigate_table_cell',
						direction: direction || 'next',
					})
				} catch (error) {
					return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'navigate_table_cell',
				description: 'Navigate to next or previous cell in the table.',
				schema: z.object({
					direction: z.enum(['next', 'previous']).describe('Direction to navigate'),
				}),
			}
		),

		// Fix table structure
		tool(
			async () => {
				try {
					return JSON.stringify({
						action: 'fix_tables',
					})
				} catch (error) {
					return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'fix_tables',
				description: 'Fix malformed table structure (missing cells, wrong colspan/rowspan).',
				schema: z.object({}),
			}
		),

		// Get table content as structured data
		tool(
			async ({ tableIndex }) => {
				try {
					// Server-side execution (if editor is null but htmlContent is provided)
					if (!editor && htmlContent) {
						console.log(`[ServerTool] get_table_content: parsing HTML (len=${htmlContent.length})`)
						const tableMatches = [...htmlContent.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/gi)]
						console.log(`[ServerTool] Found ${tableMatches.length} tables`)

						const targetIndex = tableIndex ?? 0

						if (targetIndex >= tableMatches.length) {
							console.log(`[ServerTool] Target index ${targetIndex} out of bounds`)
							return JSON.stringify({ headers: [], rows: [] })
						}

						const tableHtml = tableMatches[targetIndex][1]
						const rows: string[][] = []
						const headers: string[] = []

						const rowMatches = [...tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]
						console.log(`[ServerTool] Found ${rowMatches.length} rows in table ${targetIndex}`)

						rowMatches.forEach((rowMatch, i) => {
							const rowContent = rowMatch[1]
							const cellMatches = [...rowContent.matchAll(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi)]
							const rowData = cellMatches.map(m => m[1].replace(/<[^>]+>/g, '').trim()) // Strip tags

							// Initial assumption: First row is header
							if (i === 0) {
								headers.push(...rowData)
							} else {
								rows.push(rowData)
							}
						})

						return JSON.stringify({
							headers,
							rows
						})
					}

					return JSON.stringify({
						action: 'get_table_content',
						tableIndex: tableIndex ?? 0,
					})
				} catch (error) {
					return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'get_table_content',
				description: 'Get the content of a table as structured data (headers and rows). Use tableIndex to specify which table (0 = first table).',
				schema: z.object({
					tableIndex: z.number().optional().describe('Index of the table to read (0-based, default: 0)'),
				}),
			}
		),

		// Replace entire table with new structured data
		tool(
			async ({ tableIndex, headers, rows }) => {
				try {
					return JSON.stringify({
						action: 'replace_table_with_data',
						tableIndex: tableIndex ?? 0,
						headers,
						rows,
					})
				} catch (error) {
					return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'replace_table',
				description: 'Replace an entire table with new structured data (headers and rows). Use this to modify existing tables (add columns, update data).',
				schema: z.object({
					tableIndex: z.number().optional().describe('Index of the table to replace (0-based, default: 0)'),
					headers: z.array(z.string()).describe('New column headers, e.g., ["City", "Province", "Population", "Founded"]'),
					rows: z.array(z.array(z.string())).describe('New row data as 2D array'),
				}),
			}
		),

		// Insert content after specific text (Anchor-based insertion)
		tool(
			async ({ targetText, content, type, tableData, matchInfo }) => {
				try {
					return JSON.stringify({
						action: 'insert_content_after_text',
						targetText,
						content,
						type: type || 'text',
						tableData,
						matchInfo
					})
				} catch (error) {
					return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'insert_content_after_text',
				description: 'Insert content immediately AFTER a specific text segments (e.g. after a Heading). Use this for precise placement.',
				schema: z.object({
					targetText: z.string().describe('The text to search for (anchor), e.g., "Introduction" or "Chapter 1"'),
					content: z.string().optional().describe('HTML content to insert (if type is text)'),
					type: z.enum(['text', 'table_data']).optional().describe('Type of content: "text" (default) or "table_data"'),
					tableData: z.object({
						title: z.string().optional(),
						headers: z.array(z.string()),
						rows: z.array(z.array(z.string()))
					}).optional().describe('Structured table data if type is table_data'),
					matchInfo: z.string().optional().describe('Optional hint about what to look for (e.g., "heading", "paragraph")')
				}),
			}
		),



		// Insert image
		tool(
			async ({ src, alt, title }) => {
				try {
					editor.chain().focus().setImage({ src, alt, title }).run()
					return `Inserted image from ${src}`
				} catch (error) {
					return `Error inserting image: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'insert_image',
				description: 'Insert an image into the document by URL.',
				schema: z.object({
					src: z.string().describe('Image URL'),
					alt: z.string().optional().describe('Alt text for accessibility'),
					title: z.string().optional().describe('Image title'),
				}),
			}
		),

		// Insert link
		tool(
			async ({ href, text }) => {
				try {
					return JSON.stringify({
						action: 'insert_link',
						href,
						text,
					})
				} catch (error) {
					return `Error inserting link: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'insert_link',
				description: 'Insert a hyperlink. If text is selected, it will be linked. Otherwise, new linked text will be inserted.',
				schema: z.object({
					href: z.string().describe('Link URL'),
					text: z.string().optional().describe('Link text (if inserting new text)'),
				}),
			}
		),

		// Remove link
		tool(
			async () => {
				try {
					editor.chain().focus().unsetLink().run()
					return 'Removed link from selection'
				} catch (error) {
					return `Error removing link: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'remove_link',
				description: 'Remove hyperlink from selected text.',
				schema: z.object({}),
			}
		),

		// Set line spacing
		tool(
			async ({ spacing }) => {
				try {
					return JSON.stringify({
						action: 'set_line_spacing',
						spacing,
					})
				} catch (error) {
					return `Error setting line spacing: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'set_line_spacing',
				description: 'Set line spacing for the current paragraph.',
				schema: z.object({
					spacing: z.string().describe('Line spacing value (e.g., "1.0", "1.5", "2.0")'),
				}),
			}
		),

		// ===== ANALYTICS TOOLS =====

		// Get document statistics
		tool(
			async () => {
				try {
					const text = editor.getText()
					const words = text.split(/\s+/).filter(Boolean)
					const chars = text.length
					const charsNoSpaces = text.replace(/\s/g, '').length
					const paragraphs = editor.state.doc.childCount
					const sentences = text.split(/[.!?]+/).filter(Boolean).length

					// Calculate reading time (average 200 words per minute)
					const readingTime = Math.ceil(words.length / 200)

					return JSON.stringify({
						words: words.length,
						characters: chars,
						charactersNoSpaces: charsNoSpaces,
						paragraphs,
						sentences,
						readingTimeMinutes: readingTime,
						avgWordsPerSentence: Math.round(words.length / sentences),
					})
				} catch (error) {
					return `Error getting statistics: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'get_document_stats',
				description:
					'Get comprehensive statistics about the document including word count, character count, reading time, etc.',
				schema: z.object({}),
			}
		),

		// ===== HISTORY TOOLS =====

		// Undo/Redo
		tool(
			async ({ action }) => {
				try {
					if (action === 'undo') {
						editor.chain().focus().undo().run()
						return 'Successfully performed undo'
					} else {
						editor.chain().focus().redo().run()
						return 'Successfully performed redo'
					}
				} catch (error) {
					return `Error performing ${action}: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'undo_redo',
				description: 'Undo or redo the last action in the document.',
				schema: z.object({
					action: z.enum(['undo', 'redo']).describe('Action to perform'),
				}),
			}
		),

		// ===== ADVANCED CURSOR NAVIGATION TOOLS =====

		// Move to a specific section
		tool(
			async ({ sectionName, position }) => {
				try {
					return JSON.stringify({
						action: 'move_to_section',
						sectionName,
						position: position || 'start',
					})
				} catch (error) {
					return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'move_to_section',
				description: 'Move cursor to a specific section by name. Use this for quick navigation to sections like "EDUCATION", "EXPERIENCE", etc. Position can be "start", "end", or "after_heading".',
				schema: z.object({
					sectionName: z.string().describe('Name of the section to move to (fuzzy match supported)'),
					position: z.enum(['start', 'end', 'after_heading']).optional().describe('Where in the section to position cursor (default: start)'),
				}),
			}
		),

		// Move to element by type and index
		tool(
			async ({ elementType, index, position }) => {
				try {
					return JSON.stringify({
						action: 'move_to_element',
						elementType,
						index: index || 1,
						position: position || 'start',
					})
				} catch (error) {
					return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'move_to_element',
				description: 'Move cursor to the nth element of a specific type. Example: move_to_element({ elementType: "table", index: 2 }) moves to second table.',
				schema: z.object({
					elementType: z.enum(['heading', 'paragraph', 'table', 'list', 'image', 'codeBlock', 'blockquote']).describe('Type of element to navigate to'),
					index: z.number().min(1).optional().describe('1-based index of the element (default: 1 = first)'),
					position: z.enum(['start', 'end', 'inside']).optional().describe('Where to place cursor relative to element (default: start)'),
				}),
			}
		),

		// Move relative to current position
		tool(
			async ({ direction, units, unitType }) => {
				try {
					return JSON.stringify({
						action: 'move_relative',
						direction,
						units,
						unitType,
					})
				} catch (error) {
					return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'move_relative',
				description: 'Move cursor relative to current position. Example: move_relative({ direction: "forward", units: 2, unitType: "paragraph" }) moves 2 paragraphs forward.',
				schema: z.object({
					direction: z.enum(['forward', 'backward']).describe('Direction to move'),
					units: z.number().min(1).describe('Number of units to move'),
					unitType: z.enum(['character', 'word', 'line', 'paragraph', 'section', 'block']).describe('Type of unit for movement'),
				}),
			}
		),

		// Select entire block at cursor
		tool(
			async ({ blockType }) => {
				try {
					return JSON.stringify({
						action: 'select_block',
						blockType: blockType || 'current',
					})
				} catch (error) {
					return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'select_block',
				description: 'Select an entire block at or containing cursor. Use this to select entire paragraphs, sections, lists, or tables.',
				schema: z.object({
					blockType: z.enum(['paragraph', 'section', 'list', 'table', 'current']).optional().describe('Type of block to select (default: current block at cursor)'),
				}),
			}
		),

		// Get detailed position information
		tool(
			async () => {
				try {
					return JSON.stringify({
						action: 'get_position_info_detailed',
					})
				} catch (error) {
					return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'get_position_info_detailed',
				description: 'Get comprehensive information about current cursor position including: absolute position, percentage through document, current node type/content, parent hierarchy, containing section, and movement possibilities.',
				schema: z.object({}),
			}
		),

		// ===== DOCUMENT CONTEXT TOOLS =====

		// Get full document context
		tool(
			async () => {
				try {
					return JSON.stringify({
						action: 'get_document_context',
					})
				} catch (error) {
					return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'get_document_context',
				description: 'Get comprehensive document context including: structure overview (sections, tables, lists, images), cursor context, metadata (word count, section count), and formatted content. Use this for deep understanding of document structure.',
				schema: z.object({}),
			}
		),

		// Get specific section content
		tool(
			async ({ sectionName }) => {
				try {
					if (!sectionName) {
						return 'Error: sectionName is required'
					}
					return JSON.stringify({
						action: 'get_section_content',
						sectionName,
					})
				} catch (error) {
					return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'get_section_content',
				description: 'Get the full content of a specific section by name. Returns section name and all content within that section. Supports fuzzy matching.',
				schema: z.object({
					sectionName: z.string().describe('Name of section to get content for (e.g., "EDUCATION", "SKILLS")'),
				}),
			}
		),

		// ===== ESSENTIAL TIPTAP COMMANDS (History, Selection, Structure) =====
		tool(
			async ({ command }) => {
				try {
					return JSON.stringify({
						action: 'perform_tiptap_command',
						command,
					})
				} catch (error) {
					return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			},
			{
				name: 'perform_tiptap_command',
				description: 'Execute essential Tiptap commands for history (undo/redo), selection, and structure manipulation. Use this for navigation, fixing structure, or undoing mistakes.',
				schema: z.object({
					command: z.enum([
						'undo', 'redo',
						'selectAll', 'selectParentNode', 'selectTextblockStart', 'selectTextblockEnd',
						'selectNodeBackward', 'selectNodeForward', 'deleteSelection',
						'lift', 'sink', 'splitBlock', 'hardBreak',
						'liftListItem', 'sinkListItem',
						'joinBackward', 'joinForward',
						'unsetAllMarks', 'clearNodes',
						'focus', 'scrollIntoView'
					]).describe('The Tiptap command to execute'),
				}),
			}
		),
	]
}


/**
 * Get tool descriptions for prompt
 */
export const getToolDescriptions = () => {
	return `
You have access to the following tools for document editing:

## Reading Tools
- read_document - Read document content and structure. ALWAYS call this first before editing.
- get_sections - Get list of all section headings in the document.

## Editing Tools (SEMANTIC - Use these for reliable editing)
- find_and_replace - Find text and replace it. MOST RELIABLE for text changes.
- move_section - Move an entire section (heading + content) to start or end of document. ATOMIC & SAFE.
- delete_section - Delete ENTIRE section by heading name, including all content until next section.
- delete_by_text - Delete paragraph/list item containing specific text.
- insert_after_text - Insert content after a paragraph containing specific text.
- insert_content - Insert content at cursor, start, or end of document.
- clear_document - Clear ALL content from the document. Use for "delete everything".
## Chunking Tools (Large Documents)
- read_chunk - Read a specific chunk by index
- read_chunk_by_section - Read chunk containing a section
- get_chunk_info - Get overview of all chunks

## Formatting Tools
- apply_format_to_text - Find text and apply: bold, italic, underline, strike, code, highlight
- format_text - Apply formatting to selected text
- set_text_style - Set font size, family, color
- set_text_align - Set alignment (left, center, right, justify)
- set_line_spacing - Set line spacing (1.0, 1.5, 2.0)

## Table Tools
- insert_table - Create table (rows, cols, withHeaderRow)
- add_table_row - Add row above/below
- delete_table_row - Remove current row
- add_table_column - Add column left/right
- delete_table_column - Remove current column

## Media & Links
- insert_image - Insert image by URL
- insert_link - Create hyperlink
- remove_link - Remove hyperlink

## Structure Tools
- insert_horizontal_rule - Insert a horizontal divider

## Analytics & History
- get_document_stats - Word count, reading time, etc.
- undo_redo - Undo or redo last action

CRITICAL GUIDELINES:
1. Document content is provided in [CURRENT DOCUMENT STATE] - no need to read first
2. Use apply_format_to_text to make existing text bold/italic (NOT find_and_replace!)
3. Use find_and_replace for text replacement (NOT for formatting)
4. Use delete_section to remove sections by heading name
5. Use HTML tags only in insert_content for new formatted content
`
}
