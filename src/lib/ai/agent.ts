import { createAIModel } from './config'
import { createDocumentTools, getToolDescriptions } from './tools'
import type { Editor } from '@tiptap/core'
import type { BaseMessage } from '@langchain/core/messages'
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages'

/**
 * Extract text content from LangChain message content
 * Handles both string and array of content blocks (e.g., from Gemini with tool calls)
 */
const extractTextContent = (content: string | Array<any>): string => {
	if (typeof content === 'string') {
		return content
	}

	if (Array.isArray(content)) {
		return content
			.filter((block) => block && typeof block === 'object' && (block.type === 'text' || block.text))
			.map((block) => block.text || '')
			.join('')
	}

	// Fallback for unknown types
	try {
		return JSON.stringify(content)
	} catch {
		return String(content)
	}
}

/**
 * Comprehensive System Prompt for Neptune AI Assistant
 * 
 * This prompt provides full TipTap capability reference, chunking awareness,
 * and strong guidelines for reliable document manipulation.
 */
const SYSTEM_PROMPT = `You are Neptune, an expert AI document editor for PaperNest (TipTap-based editor).


## Your Capabilities

You have FULL CONTROL over the document through these tools:

### 📖 Reading & Navigation
- Document content is AUTO-INJECTED in [CURRENT DOCUMENT STATE] - NO need to read first
- For large docs (8000+ chars): use get_chunk_info, read_chunk, read_chunk_by_section

### 🧭 Advanced Cursor Navigation (NEW!)
| Tool | Use Case |
|------|----------|
| move_to_section | Jump to section: "EDUCATION", "EXPERIENCE", etc. |
| move_to_element | Navigate to nth table/heading/list/paragraph |
| move_relative | Move forward/backward by paragraph/section/word |
| select_block | Select entire paragraph/section/table |
| get_position_info_detailed | Get complete cursor context |
| get_document_context | Get comprehensive document structure |
| get_section_content | Get full content of a specific section |

**Cursor Navigation Patterns:**
- "pindah ke EDUCATION" → move_to_section({ sectionName: "EDUCATION" })
- "ke tabel pertama" → move_to_element({ elementType: "table", index: 1 })
- "2 paragraf ke bawah" → move_relative({ direction: "forward", units: 2, unitType: "paragraph" })

### ✏️ Text Manipulation (Semantic - ALWAYS use these)
| Tool | Use Case |
|------|----------|
| find_and_replace | Replace/delete text by content (NOT for formatting) |
| delete_section | Delete entire section by heading name |
| delete_by_text | Delete paragraph containing specific text |
| insert_after_text | Insert content after matching text |
| insert_content | Insert at cursor/start/end |
| clear_document | Delete everything |

### 🎨 Formatting (Use apply_format_to_text for existing text)
| Tool | Description |
|------|-------------|
| apply_format_to_text | Find text & apply: bold, italic, underline, strike, code, highlight |
| format_text | Format selected text (bold, italic, heading, lists, etc.) |
| set_text_style | Font size, family, color |
| set_text_align | left, center, right, justify |
| set_line_spacing | 1.0, 1.5, 2.0, etc. |

### 📊 Tables
| Tool | Description |
|------|-------------|
| insert_table | Create table (rows, cols, withHeaderRow) |
| add_table_row | Add row above/below |
| delete_table_row | Remove current row |
| add_table_column | Add column left/right |
| delete_table_column | Remove current column |

### 🔗 Media & Links
| Tool | Description |
|------|-------------|
| insert_image | Insert image by URL |
| insert_link | Create hyperlink |
| remove_link | Remove hyperlink |

### 📐 Structure
| Tool | Description |
|------|-------------|
| insert_horizontal_rule | Add divider line |

### 📈 Analytics & History
| Tool | Description |
|------|-------------|
| get_document_stats | Word count, reading time, etc. |
| undo_redo | Undo/redo actions |

## HTML for insert_content ONLY

When inserting NEW content, use HTML:
- **Bold**: <strong>text</strong>
- **Italic**: <em>text</em>
- **Underline**: <u>text</u>
- **Headings**: <h1>, <h2>, <h3>, <h4>
- **Lists**: <ul><li>item</li></ul> or <ol><li>item</li></ol>
- **Links**: <a href="url">text</a>
- **Blockquote**: <blockquote>text</blockquote>

Example:
insert_content({ content: "<h2>SKILLS</h2><ul><li>JavaScript</li><li>Python</li></ul>", position: "end" })

## 🚨 CRITICAL ONE-SHOT EXECUTION RULE 🚨

**MOST IMPORTANT RULE:** For simple requests like "add title and table", you MUST:
1. **ONE insert_content call** with ALL the content (title + table together)
2. **STOP immediately** after successful insert
3. **DO NOT** insert at start, then end, then start again!

**WRONG (what you keep doing):**
  insert_content at start -> insert_content at end -> insert_content at start again

**CORRECT:**
  insert_content({ content: "<h1>Title</h1><table>...</table>", position: "end" }) -> DONE!

## CRITICAL RULES

1. **DON'T call read_document at START** - Document is in [CURRENT DOCUMENT STATE]
2. **CHECK document BEFORE inserting** - If content already exists, DON'T insert again!
3. **ONE operation per request** - "Add title and table" = ONE insert_content with both
4. **STOP after success** - When tool returns success, RESPOND to user, don't call more tools
5. **NEVER insert the same thing twice** - If you just inserted a title, DON'T insert another title

## ⚠️ DUPLICATE PREVENTION ⚠️

**Before calling insert_content, ASK YOURSELF:**
- Did I already insert something in this conversation?
- Does [CURRENT DOCUMENT STATE] already have this content?
- Is the tool result telling me it succeeded?

**If YES to any → STOP and respond to user!**

## ⚠️ CRITICAL SAFETY RULES ⚠️

### Move/Relocate Text Pattern (FOLLOW THIS EXACTLY!)
When user asks to MOVE content from one place to another:
1. READ the content first (read_document or get exact text from [CURRENT DOCUMENT STATE])
2. INSERT the content at the NEW location FIRST using insert_after_text or insert_content
3. VERIFY the insertion was successful with read_document
4. ONLY THEN delete the original content
5. VERIFY again that document is correct

WRONG ORDER: Delete → Insert (DANGEROUS - you may lose content!)
RIGHT ORDER: Read → Insert → Verify → Delete → Verify

### NEVER USE WITHOUT EXPLICIT PERMISSION:
- **clear_document** - Only if user says "delete everything" or "clear all content"
- **delete_section** on multiple sections at once
- Any operation that removes large amounts of content

### Error Handling:
- If a tool fails ONCE → try a DIFFERENT approach, not the same tool again
- If tool fails TWICE → STOP and ask user for guidance
- NEVER loop more than 3 times on the same operation
- If content is accidentally deleted → immediately try to reconstruct from user's original request

## Task Patterns

### Make text bold:
apply_format_to_text({ searchText: "PROJECTS", format: "bold" })

### Delete section:
delete_section({ sectionName: "EDUCATION" })

### Replace text:
find_and_replace({ searchText: "old", replaceWith: "new", replaceAll: true })

### Add section:
insert_content({ content: "<h2>NEW SECTION</h2><p>Content here</p>", position: "end" })

### MOVE content (SAFE pattern):
1. insert_after_text({ searchText: "TARGET_LOCATION", content: "CONTENT_TO_MOVE" })
2. read_document() // verify insertion worked
3. delete_by_text({ text: "ORIGINAL_CONTENT_LOCATION" }) // only after verifying step 2

### Create table:
insert_table({ rows: 3, cols: 3, withHeaderRow: true })

### Add table rows (EFFICIENT WAY):
// DON'T: Call add_table_row 5 times for 5 rows
// DO: Use insert_content with HTML table to add multiple rows at once
// Or: Call add_table_row ONCE, then use find_and_replace to fill cells

## 🚨 CRITICAL ANTI-LOOP RULES 🚨

**YOU MUST STOP AFTER:**
1. Task is logically complete (content added, formatted, deleted as requested)
2. You have made MORE THAN 3 tool calls for a simple task
3. You are about to call the SAME TOOL more than 2 times in a row

**LOOP DETECTION - STOP IMMEDIATELY IF:**
- You've called the same tool 3+ times consecutively
- Each iteration produces similar results
- User asked for "add 3 rows" but you've called add_table_row 3+ times already
- You're repeating because verification shows "nothing changed" - ASK USER instead

**EFFICIENT PATTERNS:**
- "Add 5 cities to table" → Use insert_content with HTML <tr> rows, NOT 5x add_table_row
- "Format multiple words" → Use apply_format_to_text with replaceAll: true
- "Delete multiple items" → Call delete_by_text for each UNIQUE item, max 4 calls

## Response Guidelines

1. Execute MINIMAL tool calls (1-3 per simple task)
2. After tools complete, PROVIDE FINAL RESPONSE - don't keep calling tools
3. If task seems incomplete, ASK USER rather than looping
4. NEVER repeat the same tool call pattern more than twice
5. When done, say "Done!" or "Selesai!" and STOP calling tools

## CRITICAL: Task Completion Detection

**STOP and respond naturally when:**
- You've executed the core action (insert/delete/format)
- Tool results show success messages
- You've verified once with read_document

**DON'T:**
- Keep verifying in a loop
- Keep adding rows one-by-one when you could use HTML
- Call read_document more than once per task
- Retry the same failed operation more than once

## Proactive but EFFICIENT Behavior

Be proactive to fix issues, but ALWAYS be efficient:
- Fix issues with DIFFERENT approaches, not same tool
- If stuck, provide response and let user guide you
- Never sacrifice user experience for "perfect" results

You are an expert. Execute precisely, verify ONCE, and confirm!`


/**
 * Convert message history to LangChain format
 */
export const convertToLangChainMessages = (
	messages: Array<{ role: string; content: string; toolCallId?: string; name?: string }>
): BaseMessage[] => {
	return messages.map((msg) => {
		switch (msg.role) {
			case 'user':
				return new HumanMessage(msg.content)
			case 'assistant':
				return new AIMessage(msg.content)
			case 'system':
				return new SystemMessage(msg.content)
			case 'tool':
				// Tool results are now sent as HumanMessage in the continuation
				return new HumanMessage(`Tool result: ${msg.content}`)
			default:
				return new HumanMessage(msg.content)
		}
	})
}

/**
 * Create AI agent with document tools
 */
export const createDocumentAgent = async (
	editor: Editor,
	messages: Array<{ role: string; content: string }> = []
) => {
	// Create model
	const model = createAIModel()

	// Create tools
	const tools = createDocumentTools(editor)

	// Bind tools to model
	const modelWithTools = model?.bindTools?.(tools) ?? model

	// Convert message history
	const langChainMessages = [
		new SystemMessage(SYSTEM_PROMPT),
		...convertToLangChainMessages(messages),
	]

	return {
		model: modelWithTools,
		tools,
		messages: langChainMessages,
	}
}

/**
 * Multi-step agent streaming with tool result continuation
 * 
 * This generator supports multi-step execution:
 * 1. Yields tool_calls for client-side execution
 * 2. Client executes tools and returns results
 * 3. Agent decides if more steps needed
 * 4. Continues until task complete
 */
export const streamAgentMultiStep = async function* (
	editor: Editor,
	userMessage: string,
	conversationHistory: Array<{ role: string; content: string }> = [],
	toolResults?: Array<{ toolCallId: string; name: string; result: string }>,
	previousAIResponse?: any
) {
	const model = createAIModel()
	const tools = createDocumentTools(editor)
	const modelWithTools = model?.bindTools?.(tools) ?? model

	// Build messages
	let langChainMessages: BaseMessage[] = [
		new SystemMessage(SYSTEM_PROMPT),
		...convertToLangChainMessages(conversationHistory),
		new HumanMessage(userMessage),
	]

	// If we have tool results from previous step, add them as context
	// Using HumanMessage with tool results summary for simpler continuation
	if (toolResults && toolResults.length > 0) {
		const toolResultsSummary = toolResults
			.map((tr) => `Tool "${tr.name}" executed.Result: ${tr.result} `)
			.join('\n')

		langChainMessages.push(
			new HumanMessage(
				`The following tools were executed on the document: \n\n${toolResultsSummary} \n\nBased on these results, continue with the task.If the task is complete, provide a summary.If more actions are needed, call the appropriate tools.`
			)
		)

		console.log('[Agent] Continuing with tool results:', toolResults.map(t => t.name))
	}

	// Stream the response
	const stream = await modelWithTools.stream(langChainMessages)

	let toolCalls: any[] = []
	let contentChunks: string[] = []
	let fullResponse: any = null

	for await (const chunk of stream) {
		// Yield content chunks
		if (chunk.content) {
			const textContent = extractTextContent(chunk.content)
			if (textContent) {
				contentChunks.push(textContent)
				yield {
					type: 'content',
					content: textContent,
				}
			}
		}

		// Collect tool calls
		if (chunk.tool_calls && chunk.tool_calls.length > 0) {
			toolCalls = [...toolCalls, ...chunk.tool_calls]
		}

		// Keep track of the full response for continuation
		fullResponse = chunk
	}

	// If there are tool calls, yield them for client execution
	if (toolCalls.length > 0) {
		yield {
			type: 'tool_calls',
			toolCalls: toolCalls.map((tc) => ({
				id: tc.id || `${tc.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)} `,
				name: tc.name,
				args: tc.args,
			})),
			// Send back info needed for continuation
			continueData: {
				conversationHistory,
				userMessage,
			},
		}
	} else {
		// No more tool calls - task is complete
		yield {
			type: 'done',
			fullContent: contentChunks.join(''),
			hasMoreSteps: false,
		}
	}
}

/**
 * Legacy single-step stream agent (backward compatible)
 */
export const streamAgent = async function* (
	editor: Editor,
	userMessage: string,
	conversationHistory: Array<{ role: string; content: string }> = []
) {
	// Use multi-step but only for first iteration
	yield* streamAgentMultiStep(editor, userMessage, conversationHistory)
}

/**
 * Invoke agent with a single message (legacy, for non-streaming)
 */
export const invokeAgent = async (
	editor: Editor,
	userMessage: string,
	conversationHistory: Array<{ role: string; content: string }> = []
) => {
	const { model, tools, messages } = await createDocumentAgent(editor, [
		...conversationHistory,
		{ role: 'user', content: userMessage },
	])

	// Invoke model
	const response = await model.invoke(messages)

	// Check if model wants to use tools
	if (response.tool_calls && response.tool_calls.length > 0) {
		const toolResults = []

		// Execute each tool call
		for (const toolCall of response.tool_calls) {
			const tool = tools.find((t) => t.name === toolCall.name)

			if (tool) {
				try {
					// Invoke tool dynamically to handle union types
					const result = await (tool as any).invoke(toolCall.args)
					toolResults.push({
						toolName: toolCall.name,
						result,
					})
				} catch (error) {
					toolResults.push({
						toolName: toolCall.name,
						result: `Error: ${error instanceof Error ? error.message : 'Unknown error'} `,
					})
				}
			}
		}

		// Get final response after tool execution
		const finalMessages = [
			...messages,
			response,
			new HumanMessage(
				`Tool execution results: ${JSON.stringify(toolResults)} \n\nProvide a natural language summary of what was done.`
			),
		]

		const finalResponse = await model.invoke(finalMessages)

		return {
			content: extractTextContent(finalResponse.content),
			toolCalls: response.tool_calls,
			toolResults,
		}
	}

	// No tool calls, return direct response
	return {
		content: extractTextContent(response.content),
		toolCalls: [],
		toolResults: [],
	}
}
