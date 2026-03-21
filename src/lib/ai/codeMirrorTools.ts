import { tool } from '@langchain/core/tools'
import { z } from 'zod'

/**
 * Minimal toolset for CodeMirror/LaTeX editor integration.
 *
 * These tools are intentionally limited to handlers implemented in
 * `executeEditorTool` on the client side.
 */
export const createCodeMirrorTools = () => {
	return [
		tool(
			async ({ fromLine, toLine, full }) => JSON.stringify({ action: 'read_document', fromLine, toLine, full: full ?? true }),
			{
				name: 'read_document',
				description: 'Read document content. Defaults to full document read.',
				schema: z.object({
					fromLine: z.number().optional().describe('Start line number (1-based)'),
					toLine: z.number().optional().describe('End line number (inclusive)'),
					full: z.boolean().optional().default(true).describe('Read the entire document. Defaults to true.'),
				}),
			}
		),
		tool(
			async ({ content, position }) => JSON.stringify({ action: 'insert_content', content, position }),
			{
				name: 'insert_content',
				description: 'Insert content at cursor, start, or end of document.',
				schema: z.object({
					content: z.string().describe('Text content to insert'),
					position: z.enum(['cursor', 'start', 'end']).optional(),
				}),
			}
		),
		tool(
			async ({ searchBlock, replaceBlock }) =>
				JSON.stringify({ action: 'apply_diff_edit', searchBlock, replaceBlock }),
			{
				name: 'apply_diff_edit',
				description:
					'Apply array-based block replacement. Each searchBlock item is replaced with the corresponding replaceBlock item by index.',
				schema: z.object({
					searchBlock: z.array(z.string()).describe('Array of search text blocks.'),
					replaceBlock: z.array(z.string()).describe('Array of replacement text blocks.'),
				}),
			}
		),
		tool(
			async () => JSON.stringify({ action: 'get_cursor_info' }),
			{
				name: 'get_cursor_info',
				description: 'Get current cursor position, selection, and surrounding context.',
				schema: z.object({}),
			}
		),
		tool(
			async () => JSON.stringify({ action: 'get_sections' }),
			{
				name: 'get_sections',
				description: 'Get LaTeX section headings from current document.',
				schema: z.object({}),
			}
		),
		tool(
			async () => JSON.stringify({ action: 'get_document_stats' }),
			{
				name: 'get_document_stats',
				description: 'Get document statistics such as character count, line count, and estimated word count.',
				schema: z.object({}),
			}
		),
		tool(
			async ({ query, k }) => JSON.stringify({ action: 'search_document_context', query, k }),
			{
				name: 'search_document_context',
				description: 'Search semantic context from indexed document chunks.',
				schema: z.object({
					query: z.string().describe('Search query for contextual retrieval'),
					k: z.number().optional().describe('Number of chunks to retrieve'),
				}),
			}
		),
		tool(
			async () => JSON.stringify({ action: 'compile_latex' }),
			{
				name: 'compile_latex',
				description: 'Trigger LaTeX compilation to generate PDF and check for errors. ALWAYS call this after making changes to verify they work.',
				schema: z.object({}),
			}
		),
		tool(
			async () => JSON.stringify({ action: 'get_compile_logs' }),
			{
				name: 'get_compile_logs',
				description: 'Get the LaTeX compilation logs. Use this if compile_latex reported errors to understand what went wrong.',
				schema: z.object({}),
			}
		),
		tool(
			async () => JSON.stringify({ action: 'format_latex' }),
			{
				name: 'format_latex',
				description: 'Automatically format the LaTeX source code for better readability.',
				schema: z.object({}),
			}
		),
	]
}
