import { useCallback, useRef } from 'react'
import { nanoid } from 'nanoid'
import { useAIChatStore } from '../store'
import { aiService } from '../services/ai.service'
import { parseSSEStream } from './use-ai-stream'
import { executeEditorTool } from '../tools/functions'
import type { MessageRole, ToolCall, AIStreamPayload } from '../types/chat'

interface UseAIChatOptions {
	editor: any
	documentId?: string
}

export function useAIChat({ editor, documentId }: UseAIChatOptions) {
	const store = useAIChatStore()
	const abortControllerRef = useRef<AbortController | null>(null)
	
	// Virtual Document Reference: Always keeps a "working version" of the document 
	// during the thinking loop so the AI sees its own staged changes immediately.
	const workingDocTextRef = useRef<string>('')

	/**
	 * Stops any active streaming and cleans up controllers
	 */
	const stop = useCallback(() => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort()
			abortControllerRef.current = null
		}
		store.setStreaming(false)
	}, [store])

	/**
	 * Main entry point to send a message to the AI
	 */
	const sendMessage = useCallback(async (text: string) => {
		if (!text.trim() || store.isStreaming) return

		// 1. Cleanup previous request if any
		stop()
		
		const controller = new AbortController()
		// Increased timeout for backend-executed tools (Semantic Scholar can take >60s)
		const timeoutSignal = AbortSignal.timeout(180000)
		const combinedSignal = AbortSignal.any([controller.signal, timeoutSignal])
		abortControllerRef.current = controller

		// 2. Setup initial state
		const assistantKey = nanoid()
		store.addUserMessage(text)
		store.initAssistantMessage(assistantKey)
		store.setStreaming(true)

		// Get initial document state
		workingDocTextRef.current = editor?.getCurrentContent?.() ?? ''

		try {
			const MAX_STEPS = 20
			let currentStep = 0
			let toolResultsForContinuation: any[] = []
			let shouldContinue = true
			const toolRetryCount = new Map<string, number>()

			// --- Think-Execute-Reflect Loop ---
			while (shouldContinue && currentStep < MAX_STEPS) {
				currentStep++

				// Get the freshest state from the store to avoid stale closures in the async loop
				const currentState = useAIChatStore.getState()

				// Prepare conversation history for the AI context
				const conversationHistory = currentState.messages.slice(-10).map((msg) => ({
					role: msg.from,
					content: msg.versions[msg.activeVersionIndex].parts
						.filter(p => p.type === 'text')
						.map(p => (p as any).content || '')
						.join('\n'),
				}))

				const [providerId, modelId] = currentState.model.split(':')

				const payload: AIStreamPayload = {
					message: text,
					documentContent: workingDocTextRef.current,
					conversationHistory,
					toolResults: toolResultsForContinuation.length > 0 ? toolResultsForContinuation : undefined,
					threadId: currentState.threadId,
					documentId,
					reasoningEnabled: currentState.reasoningEnabled,
					agentId: currentState.agentId,
					plan: currentState.currentPlan.length > 0 ? currentState.currentPlan : undefined,
					providerId,
					modelId,
				}

				const stream = await aiService.streamChat(payload, combinedSignal)
				
				// Reset continuation logic for this iteration
				toolResultsForContinuation = []
				let hasToolCallsInThisIteration = false
				let backendHasMoreSteps = false

				// Consume the stream via async generator
				for await (const event of parseSSEStream(stream)) {
					switch (event.type) {
						case 'content':
							store.appendContent(assistantKey, event.content)
							break
							
						case 'tool_calls':
							hasToolCallsInThisIteration = true
							for (const toolData of event.toolCalls) {
								const toolSignature = `${toolData.name}:${JSON.stringify(toolData.args)}`
								const retryCount = (toolRetryCount.get(toolSignature) || 0) + 1
								toolRetryCount.set(toolSignature, retryCount)

								// SAFETY: Prevent infinite tool-calling loops
								if (retryCount > 3) {
									const errorMsg = `SAFETY: Recursive tool call detected for ${toolData.name}. Stopping loop.`
									console.warn(`[useAIChat] ${errorMsg}`)
									store.addToolPart(assistantKey, {
										...toolData,
										status: 'error',
										result: errorMsg
									})
									toolResultsForContinuation.push({
										toolCallId: toolData.id,
										name: toolData.name,
										result: errorMsg
									})
									shouldContinue = false
									continue
								}

								// Backend-executed tools: show loading state, wait for tool_results event
								const BACKEND_TOOLS = new Set(['search_semantic_scholar', 'search_attached_pdfs'])
								if (BACKEND_TOOLS.has(toolData.name)) {
									store.addToolPart(assistantKey, {
										id: toolData.id,
										name: toolData.name,
										args: toolData.args,
										status: 'executing'
									})
									continue
								}

								// Execute the tool
								store.addToolPart(assistantKey, {
									id: toolData.id,
									name: toolData.name,
									args: toolData.args,
									status: 'executing'
								})

								try {
									// Support for "dry-run/staged" edits
									const toolArgs = { ...toolData.args } as any
									if (['insert_content', 'apply_diff_edit', 'replace_lines', 'format_latex'].includes(toolData.name)) {
										toolArgs.stage = true
									}

									const result = await executeEditorTool(editor, toolData.name, toolArgs, documentId)

									// Logic for staged document changes
									if (result && typeof result === 'object' && result.type === 'staged_change') {
										if (editor?.setPendingMerge) {
											editor.setPendingMerge(result)
										}
										// SYNC: Update virtual doc so AI sees its own preview change
										if (result.modified) {
											workingDocTextRef.current = result.modified
										}
									}

									// Success status update
									store.updateToolResult(assistantKey, toolData.id, result, 'complete')

									// Prepare feedback for AI reflection
									const feedbackResult = (result && typeof result === 'object' && result.type === 'staged_change')
										? `SUCCESS: Document edit staged/previewed. User must accept/reject to finalize.`
										: (typeof result === 'string' ? result : JSON.stringify(result))

									toolResultsForContinuation.push({
										toolCallId: toolData.id,
										name: toolData.name,
										result: feedbackResult
									})
								} catch (error) {
									const errorMsg = error instanceof Error ? error.message : 'Tool execution failed'
									store.updateToolResult(assistantKey, toolData.id, errorMsg, 'error')
									toolResultsForContinuation.push({
										toolCallId: toolData.id,
										name: toolData.name,
										result: `ERROR: ${errorMsg}`
									})
								}
							}
							break

						case 'tool_results':
						// Backend-executed tool results (e.g. Semantic Scholar) — update tool boxes with real data
						for (const r of event.results) {
							store.updateToolResult(assistantKey, r.toolCallId, r.result, 'complete')
						}
						break

					case 'plan_update':
							store.setPlan(event.plan)
							break

						case 'reasoning':
							store.appendReasoning(assistantKey, event.content, event.duration)
							break

						case 'done':
							backendHasMoreSteps = event.hasMoreSteps
							break

						case 'stream_end':
							break
					}
				}

				// Reflection Logic: Continue loop only if backend requests more steps 
				// AND we actually have tool results to feed back.
				shouldContinue = backendHasMoreSteps && hasToolCallsInThisIteration && toolResultsForContinuation.length > 0
			}
		} catch (error: any) {
			if (error.name === 'AbortError') {
				console.log('[useAIChat] Request aborted by user or timeout')
			} else {
				console.error('[useAIChat] Execution error:', error)
				store.appendContent(assistantKey, `\n\n*Error: ${error.message || 'An unexpected error occurred'}*`)
			}
		} finally {
			store.setStreaming(false)
			abortControllerRef.current = null
		}
	}, [editor, documentId, store, stop])

	return {
		sendMessage,
		stop,
		messages: store.messages,
		isStreaming: store.isStreaming,
		currentPlan: store.currentPlan,
	}
}
