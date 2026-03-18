'use client'

import { useState, useRef, useEffect } from 'react'
import { AIChatHeader } from './ai/AIChatHeader'
import { AIChatMessageList, type Message } from './ai/AIChatMessageList'
import { AIChatInput } from './ai/AIChatInput'
import { executeEditorTool } from '@/lib/ai/editorTools'

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
	documentId?: string
}

/**
 * Execute AI tool on the real Tiptap editor instance
 */
const executeToolOnEditor = executeEditorTool;
export function AIChatPanel({ editor, onClose, documentId }: AIChatPanelProps) {
	const [messages, setMessages] = useState<Message[]>([])
	const [input, setInput] = useState('')
	const [isLoading, setIsLoading] = useState(false)
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
					// Handle both Tiptap and CodeMirror
					if (typeof tiptapEditor.getText === 'function') {
						docText = tiptapEditor.getText()
						docHtml = tiptapEditor.getHTML()
						const docJson = tiptapEditor.getJSON()
						docJson.content?.forEach((node: any) => {
							if (node.type === 'heading') {
								const text = node.content?.map((c: any) => c.text || '').join('') || ''
								if (text) sections.push(text)
							}
						})
					} else if (tiptapEditor.state?.doc) {
						// CodeMirror path
						docText = tiptapEditor.state.doc.toString()
						docHtml = docText // Plain text for LaTeX
						
						// Basic LaTeX section parsing
						const lines = docText.split('\n')
						lines.forEach(line => {
							const sectionMatch = line.match(/\\(?:sub)*section\{([^}]+)\}/)
							if (sectionMatch) {
								sections.push(sectionMatch[1])
							}
						})
					}
				} catch (e) {
					console.log('[AI] Could not get document context:', e)
				}
			}

			const MAX_STEPS = 20
			let currentStep = 0
			let accumulatedContent = ''
			let toolResultsForContinuation: Array<{ toolCallId: string; name: string; result: string }> = []
			let shouldContinue = true

			while (shouldContinue && currentStep < MAX_STEPS) {
				currentStep++

				// Refresh document context each step if needed
				let currentDocText = docText
				let currentDocHtml = docHtml
				let currentSections = sections
				if (tiptapEditor && currentStep > 1) {
					try {
						if (typeof tiptapEditor.getText === 'function') {
							currentDocText = tiptapEditor.getText()
						} else if (tiptapEditor.state?.doc) {
							currentDocText = tiptapEditor.state.doc.toString()
						}
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
						threadId: threadIdRef.current,
						documentId,
					}),
				})

				if (!response.ok) throw new Error(`AI request failed: ${response.statusText}`)

				const reader = response.body?.getReader()
				const decoder = new TextDecoder()
				if (!reader) throw new Error('No response stream available')

				toolResultsForContinuation = []
				let hasToolCalls = false

				while (true) {
					const { done, value } = await reader.read()
					if (done) break

					const chunk = decoder.decode(value, { stream: true })
					const lines = chunk.split('\n')

					for (const line of lines) {
						if (line.startsWith('data: ')) {
							try {
								const data = JSON.parse(line.slice(6))
								switch (data.type) {
									case 'content':
										accumulatedContent += data.content
										setMessages((prev) =>
											prev.map((msg) =>
												msg.id === assistantId ? { ...msg, content: accumulatedContent } : msg
											)
										)
										break
									case 'tool_calls':
										hasToolCalls = true
										for (const toolCall of data.toolCalls) {
											try {
												const result = await executeToolOnEditor(tiptapEditor, toolCall.name, toolCall.args, documentId)
												toolResultsForContinuation.push({
													toolCallId: toolCall.id,
													name: toolCall.name,
													result,
												})

												const readingTools = ['read_document', 'get_sections', 'get_document_stats']
												if (!readingTools.includes(toolCall.name)) {
													accumulatedContent += `\n\n✓ ${toolCall.name}: ${result}`
													setMessages((prev) =>
														prev.map((msg) =>
															msg.id === assistantId ? { ...msg, content: accumulatedContent } : msg
														)
													)
												}
											} catch (e) {
												toolResultsForContinuation.push({
													toolCallId: toolCall.id,
													name: toolCall.name,
													result: `Error: ${e instanceof Error ? e.message : 'Unknown tool error'}`,
												})
											}
										}
										break
									case 'stream_end':
										if (data.hasMoreSteps === false || !hasToolCalls) shouldContinue = false
										break
								}
							} catch (e) { /* ignore parse error */ }
						}
					}
				}

				if (!hasToolCalls) shouldContinue = false
			}

			if (!accumulatedContent) {
				setMessages((prev) =>
					prev.map((msg) =>
						msg.id === assistantId ? { ...msg, content: 'Sorry, I received an empty response.' } : msg
					)
				)
			}
		} catch (error) {
			console.error('[AI] Error:', error)
			setMessages((prev) =>
				prev.map((msg) =>
					msg.id === assistantId
						? { ...msg, content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }
						: msg
				)
			)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden shadow-2xl border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
			<AIChatHeader onClearChat={handleClearChat} onClose={onClose} />

			<AIChatMessageList messages={messages} isLoading={isLoading} />

			<AIChatInput
				input={input}
				isLoading={isLoading}
				setInput={setInput}
				onSubmit={handleSubmit}
			/>
		</div>
	)
}
