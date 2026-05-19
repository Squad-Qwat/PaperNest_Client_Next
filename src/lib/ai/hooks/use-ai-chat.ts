import { nanoid } from 'nanoid'
import { useCallback, useEffect, useRef } from 'react'
import { aiService } from '../services/ai.service'
import { useAIChatStore } from '../store'
import { executeEditorTool } from '../tools/functions'
import type { AIStreamPayload } from '../types/chat'
import { parseSSEStream } from './use-ai-stream'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const BACKEND_TOOLS = new Set([
	'search_semantic_scholar',
	'search_attached_pdfs',
	'search_workspace_documents',
	'read_workspace_document_by_id',
])

const STAGED_TOOLS = new Set(['insert_content', 'apply_diff_edit', 'replace_lines', 'format_latex'])

interface ToolExecutionContext {
	assistantKey: string
	documentId?: string
	editor: any
	store: any
	toolRetryCount: Map<string, number>
	workingDocTextRef: { current: string }
}

const prepareChatAttachments = (files?: any[]) => {
	return files?.map((f) => ({
		id: f.id || nanoid(),
		filename: f.filename,
		mediaType: f.mediaType,
		url: f.url,
	}))
}

const buildConversationHistory = (messages: any[]) => {
	return messages.slice(-10).map((msg) => ({
		role: msg.from,
		content: msg.versions[msg.activeVersionIndex].parts
			.filter((p: any) => p.type === 'text')
			.map((p: any) => p.content || '')
			.join('\n'),
	}))
}

const handleContentEvent = async (
	event: any,
	assistantKey: string,
	appendContent: (key: string, chunk: string) => void
) => {
	const fullContent = event.content
	if (fullContent.length > 2) {
		let typedLength = 0
		const chunkSize = 2
		while (typedLength < fullContent.length) {
			const chunk = fullContent.slice(typedLength, typedLength + chunkSize)
			appendContent(assistantKey, chunk)
			typedLength += chunkSize
			await delay(12)
		}
	} else {
		appendContent(assistantKey, fullContent)
	}
}

const executeSingleTool = async (
	toolData: any,
	ctx: ToolExecutionContext
): Promise<{ result: any; shouldStop?: boolean }> => {
	const { assistantKey, documentId, editor, store, toolRetryCount, workingDocTextRef } = ctx
	const toolSignature = `${toolData.name}:${JSON.stringify(toolData.args)}`
	const retryCount = (toolRetryCount.get(toolSignature) || 0) + 1
	toolRetryCount.set(toolSignature, retryCount)

	if (retryCount > 3) {
		const errorMsg = `SAFETY: Recursive tool call detected for ${toolData.name}. Stopping loop.`
		console.warn(`[useAIChat] ${errorMsg}`)
		store.addToolPart(assistantKey, {
			...toolData,
			status: 'error',
			result: errorMsg,
		})
		return {
			result: {
				toolCallId: toolData.id,
				name: toolData.name,
				result: errorMsg,
			},
			shouldStop: true,
		}
	}

	if (BACKEND_TOOLS.has(toolData.name)) {
		store.addToolPart(assistantKey, {
			id: toolData.id,
			name: toolData.name,
			args: toolData.args,
			status: 'executing',
		})
		return { result: null }
	}

	store.addToolPart(assistantKey, {
		id: toolData.id,
		name: toolData.name,
		args: toolData.args,
		status: 'executing',
	})

	try {
		const toolArgs = { ...toolData.args } as any
		if (STAGED_TOOLS.has(toolData.name)) {
			toolArgs.stage = true
		}

		const result = await executeEditorTool(editor, toolData.name, toolArgs, documentId)

		if (result && typeof result === 'object' && result.type === 'staged_change') {
			if (editor?.setPendingMerge) {
				editor.setPendingMerge(result)
			}
			if (result.modified) {
				workingDocTextRef.current = result.modified
			}
		}

		// Success status update
		store.updateToolResult(assistantKey, toolData.id, result, 'complete')

		const feedbackResult =
			result && typeof result === 'object' && result.type === 'staged_change'
				? 'SUCCESS: Document edit staged/previewed. User must accept/reject to finalize.'
				: typeof result === 'string'
					? result
					: JSON.stringify(result)

		return {
			result: {
				toolCallId: toolData.id,
				name: toolData.name,
				result: feedbackResult,
			},
		}
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : 'Tool execution failed'
		store.updateToolResult(assistantKey, toolData.id, errorMsg, 'error')
		return {
			result: {
				toolCallId: toolData.id,
				name: toolData.name,
				result: `ERROR: ${errorMsg}`,
			},
		}
	}
}

const processSSEEventStream = async (stream: any, ctx: ToolExecutionContext) => {
	let hasToolCalls = false
	let backendHasMoreSteps = false
	let shouldContinue = true
	const toolResults: any[] = []

	for await (const event of parseSSEStream(stream)) {
		switch (event.type) {
			case 'content':
				await handleContentEvent(event, ctx.assistantKey, ctx.store.appendContent)
				break

			case 'tool_calls': {
				hasToolCalls = true
				for (const toolData of event.toolCalls) {
					const { result, shouldStop } = await executeSingleTool(toolData, ctx)
					if (shouldStop) {
						shouldContinue = false
					}
					if (result) {
						toolResults.push(result)
					}
				}
				break
			}

			case 'tool_results':
				for (const r of event.results) {
					ctx.store.updateToolResult(ctx.assistantKey, r.toolCallId, r.result, 'complete')
				}
				break

			case 'plan_update':
				ctx.store.setPlan(event.plan)
				break

			case 'reasoning':
				ctx.store.appendReasoning(ctx.assistantKey, event.content, event.duration)
				break

			case 'done':
				backendHasMoreSteps = event.hasMoreSteps
				break

			case 'stream_end':
				break
		}
	}

	return {
		hasToolCalls,
		backendHasMoreSteps,
		shouldContinue,
		toolResults,
	}
}

interface UseAIChatOptions {
	editor?: any
	documentId?: string
	workspaceId?: string
}

export function useAIChat({ editor, documentId, workspaceId }: UseAIChatOptions) {
	const store = useAIChatStore()
	const abortControllerRef = useRef<AbortController | null>(null)

	const editorRef = useRef(editor)
	useEffect(() => {
		editorRef.current = editor
	}, [editor])

	const workingDocTextRef = useRef<string>('')

	const stop = useCallback(() => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort()
			abortControllerRef.current = null
		}
		store.setStreaming(false)
	}, [store])

	const sendMessage = useCallback(
		async (text: string, files?: any[], taggedDocumentIds?: string[]) => {
			if (!text.trim() && (!files || files.length === 0)) return
			if (store.isStreaming) return

			stop()

			const controller = new AbortController()
			const timeoutSignal = AbortSignal.timeout(180000)
			const combinedSignal = AbortSignal.any([controller.signal, timeoutSignal])
			abortControllerRef.current = controller

			const assistantKey = nanoid()
			const attachments = prepareChatAttachments(files)

			store.addUserMessage(text, attachments)
			store.initAssistantMessage(assistantKey)
			store.setStreaming(true)

			workingDocTextRef.current = editorRef.current?.getCurrentContent?.() ?? ''

			try {
				const MAX_STEPS = 20
				let currentStep = 0
				let toolResultsForContinuation: any[] = []
				let shouldContinue = true
				const toolRetryCount = new Map<string, number>()

				while (shouldContinue && currentStep < MAX_STEPS) {
					currentStep++

					const currentState = useAIChatStore.getState()
					const conversationHistory = buildConversationHistory(currentState.messages)
					const [providerId, modelId] = currentState.model.split(':')

					const payload: AIStreamPayload = {
						message: text,
						documentContent: workingDocTextRef.current,
						conversationHistory,
						toolResults:
							toolResultsForContinuation.length > 0 ? toolResultsForContinuation : undefined,
						threadId: currentState.threadId,
						documentId,
						workspaceId,
						reasoningEnabled: currentState.reasoningEnabled,
						agentId: currentState.agentId,
						plan: currentState.currentPlan.length > 0 ? currentState.currentPlan : undefined,
						providerId,
						modelId,
						files: currentStep === 1 ? attachments : undefined,
						taggedDocumentIds: currentStep === 1 ? taggedDocumentIds : undefined,
					}

					const stream = await aiService.streamChat(payload, combinedSignal)

					const streamCtx: ToolExecutionContext = {
						assistantKey,
						documentId,
						editor: editorRef.current,
						store,
						toolRetryCount,
						workingDocTextRef,
					}

					const streamResult = await processSSEEventStream(stream, streamCtx)

					toolResultsForContinuation = streamResult.toolResults
					shouldContinue =
						streamResult.shouldContinue &&
						streamResult.backendHasMoreSteps &&
						streamResult.hasToolCalls &&
						streamResult.toolResults.length > 0
				}
			} catch (error: any) {
				if (error.name === 'AbortError') {
					console.log('[useAIChat] Request aborted by user or timeout')
				} else {
					console.error('[useAIChat] Execution error:', error)
					store.appendContent(
						assistantKey,
						`\n\n*Error: ${error.message || 'An unexpected error occurred'}*`
					)
				}
			} finally {
				store.setStreaming(false)
				abortControllerRef.current = null
			}
		},
		[documentId, store, stop, workspaceId]
	)

	return {
		sendMessage,
		stop,
		messages: store.messages,
		isStreaming: store.isStreaming,
		currentPlan: store.currentPlan,
	}
}
