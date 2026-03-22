'use client'

import { useState, useRef } from 'react'
import { nanoid } from 'nanoid'
import { CheckIcon, Sparkles } from 'lucide-react'

import { executeEditorTool } from '@/lib/ai/tools/functions'
import { AIChatHeader } from './ai/AIChatHeader'

import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import {
	Message,
	MessageBranch,
	MessageBranchContent,
	MessageBranchNext,
	MessageBranchPage,
	MessageBranchPrevious,
	MessageBranchSelector,
	MessageContent,
	MessageResponse,
} from '@/components/ai-elements/message'
import {
	ModelSelector,
	ModelSelectorContent,
	ModelSelectorEmpty,
	ModelSelectorGroup,
	ModelSelectorInput,
	ModelSelectorItem,
	ModelSelectorList,
	ModelSelectorLogo,
	ModelSelectorName,
	ModelSelectorTrigger,
} from '@/components/ai-elements/model-selector'
import {
	PromptInput,
	PromptInputBody,
	PromptInputFooter,
	PromptInputHeader,
	type PromptInputMessage,
	PromptInputProvider,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputTools,
	usePromptInputController,
} from '@/components/ai-elements/prompt-input'
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion'
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning'
import { Sources, Source, SourcesContent, SourcesTrigger } from '@/components/ai-elements/sources'
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool'
import { Button } from '@/components/ui/button'
import type { UIMessage } from 'ai'

// --- Advanced Message Types ---
interface MessagePart {
	id: string
	type: 'text' | 'tool'
	content?: string
	tool?: ToolCall
}

interface MessageVersion {
	id: string
	parts: MessagePart[]
}

interface MessageType {
	key: string
	from: 'user' | 'assistant'
	versions: MessageVersion[]
	activeVersionIndex: number
	timestamp: Date
	sources?: { href: string; title: string }[]
	reasoning?: {
		content: string
		duration?: number
	}
}

interface ToolCall {
	id: string
	name: string
	args: any
	result?: any
	status: 'executing' | 'complete' | 'error'
}

const models = [
	{ id: 'google-genai:gemini-2.5-flash-lite', name: 'Neptune AI', chef: 'Google', chefSlug: 'google' },
	{ id: 'google-genai:gemini-2.5-flash', name: 'Neptune AI Pro', chef: 'Google', chefSlug: 'google' },
]

const suggestions = [
	"Bantu saya menulis abstrak paper",
	"Cek error LaTeX dokumen ini",
	"Buat daftar pustaka sederhana",
	"Format judul dan section",
	"Tambahkan tabel metodologi"
]

interface EditorFunctions {
	editor?: any
	getCurrentContent?: () => any
	handleCompile?: () => Promise<void>
	setPendingMerge?: (data: {
		original: string
		modified: string
		description?: string
		searchBlock?: string[]
		replaceBlock?: string[]
	} | null) => void
}

interface AIChatPanelProps {
	editor?: EditorFunctions
	onClose?: () => void
	documentId?: string
}

export function AIChatPanel({ editor, onClose, documentId }: AIChatPanelProps) {
	const [messages, setMessages] = useState<MessageType[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [model, setModel] = useState<string>(models[0].id)
	const [modelSelectorOpen, setModelSelectorOpen] = useState(false)
	const [reasoningEnabled, setReasoningEnabled] = useState<boolean>(false)
	const [currentPlan, setCurrentPlan] = useState<any[]>([])

	const threadIdRef = useRef<string>(`thread_${Date.now()}_${nanoid(6)}`)
	const abortControllerRef = useRef<AbortController | null>(null)
	const selectedModelData = models.find(m => m.id === model)

	const stringifyToolResult = (value: unknown): string => {
		if (typeof value === 'string') return value
		if (value === null || value === undefined) return ''
		try {
			return JSON.stringify(value)
		} catch {
			return '[unserializable-value]'
		}
	}

	const handleClearChat = () => {
		setMessages([])
		setCurrentPlan([])
		threadIdRef.current = `thread_${Date.now()}_${nanoid(6)}`
	}

	const handleStop = () => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort()
			abortControllerRef.current = null
			setIsLoading(false)
		}
	}

	const mapStatusToShadcn = (status: string): any => {
		switch (status) {
			case 'executing': return 'input-available';
			case 'complete': return 'output-available';
			case 'error': return 'output-error';
			default: return 'input-available';
		}
	}

	const handleSubmit = async (promptMsg: PromptInputMessage | string) => {
		const textContent = typeof promptMsg === 'string' ? promptMsg : promptMsg.text
		if (!textContent.trim() && (typeof promptMsg === 'string' || !promptMsg.files?.length)) return
		if (isLoading) return

		handleStop() // Cleanup previous if any
		const controller = new AbortController()
		abortControllerRef.current = controller

		const messageKey = nanoid()
		const userMessage: MessageType = {
			key: messageKey,
			from: 'user',
			versions: [{
				id: nanoid(),
				parts: [{ id: nanoid(), type: 'text', content: textContent.trim() }]
			}],
			activeVersionIndex: 0,
			timestamp: new Date(),
		}

		setMessages((prev) => [...prev, userMessage])
		const userInput = textContent.trim()
		setIsLoading(true)

		const assistantKey = nanoid()
		const initialAssistantVersionId = nanoid()
		setMessages((prev) => [
			...prev,
			{
				key: assistantKey,
				from: 'assistant',
				versions: [{ id: initialAssistantVersionId, parts: [] }],
				activeVersionIndex: 0,
				timestamp: new Date(),
			},
		])

		try {
			const editorInstance = editor?.editor
			const conversationHistory = messages.slice(-10).map((msg) => ({
				role: msg.from === 'user' ? 'user' : 'assistant',
				content: msg.versions[msg.activeVersionIndex].parts
					.filter(p => p.type === 'text')
					.map(p => p.content)
					.join('\n'),
			}))

			let docText = ''
			if (editorInstance?.state?.doc) {
				docText = editorInstance.state.doc.toString()
			}

			const MAX_STEPS = 20
			let currentStep = 0
			let toolResultsForContinuation: any[] = []
			let shouldContinue = true

			while (shouldContinue && currentStep < MAX_STEPS) {
				currentStep++

				// CRITICAL FIX: Don't send completed plan on new messages
				// Let backend generate fresh plan for each new task
				const hasUncompletedSteps = currentPlan && currentPlan.length > 0 
					&& currentPlan.some((s: any) => s.status !== 'completed')
				const planToSend = hasUncompletedSteps ? currentPlan : undefined

				const response = await fetch('/api/ai-stream', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						message: userInput,
						documentContent: docText,
						conversationHistory,
						toolResults: toolResultsForContinuation.length > 0 ? toolResultsForContinuation : undefined,
						threadId: threadIdRef.current,
						documentId,
						reasoningEnabled,
						plan: planToSend, // Only send if has pending/active steps
						// Extract provider and model from model ID
						providerId: model.split(':')[0],
						modelId: model.split(':')[1],
					}),
					signal: controller.signal
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
										setMessages((prev) =>
											prev.map((msg) => {
												if (msg.key !== assistantKey) return msg
												const currentVersion = msg.versions[msg.activeVersionIndex]
												const lastPart = currentVersion.parts.at(-1)

												let newParts = [...currentVersion.parts]
												if (lastPart?.type === 'text') {
													newParts[newParts.length - 1] = {
														...lastPart,
														content: (lastPart.content || '') + data.content
													}
												} else {
													newParts.push({ id: nanoid(), type: 'text', content: data.content })
												}

												return {
													...msg,
													versions: msg.versions.map((v, i) =>
														i === msg.activeVersionIndex ? { ...v, parts: newParts } : v
													)
												}
											})
										)
										break
									case 'tool_calls':
										hasToolCalls = true
										for (const toolCall of data.toolCalls) {
											const newTool: ToolCall = {
												id: toolCall.id,
												name: toolCall.name,
												args: toolCall.args,
												status: 'executing'
											}

											setMessages((prev) =>
												prev.map((msg) => {
													if (msg.key !== assistantKey) return msg
													const currentVersion = msg.versions[msg.activeVersionIndex]
													return {
														...msg,
														versions: msg.versions.map((v, i) =>
															i === msg.activeVersionIndex
																? { ...v, parts: [...v.parts, { id: nanoid(), type: 'tool', tool: newTool }] }
																: v
														)
													}
												})
											)

											try {
												// Add staging flag for tools that modify the document
												const toolArgs = { ...toolCall.args };
												if (['insert_content', 'apply_diff_edit', 'replace_lines', 'format_latex'].includes(toolCall.name)) {
													toolArgs.stage = true;
												}

												const result = await executeEditorTool(editor, toolCall.name, toolArgs, documentId)

												// If tool returned a staged change, trigger the merge view
												if (result && typeof result === 'object' && result.type === 'staged_change') {
													if (editor?.setPendingMerge) {
														editor.setPendingMerge(result);
													}
												}

												setMessages((prev) =>
													prev.map((msg) => {
														if (msg.key !== assistantKey) return msg
														const currentVersion = msg.versions[msg.activeVersionIndex]
														return {
															...msg,
															versions: msg.versions.map((v, i) =>
																i === msg.activeVersionIndex
																	? {
																		...v,
																		parts: v.parts.map(p =>
																			p.type === 'tool' && p.tool?.id === toolCall.id
																				? { ...p, tool: { ...p.tool!, result, status: 'complete' } }
																				: p
																		)
																	}
																	: v
															)
														}
													})
												)
												toolResultsForContinuation.push({
													toolCallId: toolCall.id,
													name: toolCall.name,
													result: stringifyToolResult(result)
												})
											} catch (e) {
												const errMsg = e instanceof Error ? e.message : 'Tool error'
												setMessages((prev) =>
													prev.map((msg) => {
														if (msg.key !== assistantKey) return msg
														const currentVersion = msg.versions[msg.activeVersionIndex]
														return {
															...msg,
															versions: msg.versions.map((v, i) =>
																i === msg.activeVersionIndex
																	? {
																		...v,
																		parts: v.parts.map(p =>
																			p.type === 'tool' && p.tool?.id === toolCall.id
																				? { ...p, tool: { ...p.tool!, result: `Error: ${errMsg}`, status: 'error' } }
																				: p
																		)
																	}
																	: v
															)
														}
													})
												)
												toolResultsForContinuation.push({ toolCallId: toolCall.id, name: toolCall.name, result: `Error: ${errMsg}` })
											}
										}
										break
									case 'plan_update':
										setCurrentPlan(data.plan || [])
										break
																case 'reasoning':
																	setMessages((prev) =>
																		prev.map((msg) => {
																			if (msg.key !== assistantKey) return msg
																			const existing = msg.reasoning?.content?.trim() || ''
																			const incoming = typeof data.content === 'string' ? data.content.trim() : ''
																			if (!incoming) return msg
																			const combined = existing ? `${existing}\n\n${incoming}` : incoming
																			return {
																				...msg,
																				reasoning: {
																					content: combined,
																					duration: typeof data.duration === 'number' ? data.duration : msg.reasoning?.duration,
																				},
																			}
																		})
																	)
																	break
									case 'stream_end':
										if (data.hasMoreSteps === false || !hasToolCalls) shouldContinue = false
										break
								}
							} catch (e) { /* parse error */ }
						}
					}
				}
				if (!hasToolCalls) shouldContinue = false
			}
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') {
				console.log('[AI] Request aborted')
				return
			}
			console.error('[AI] Error:', error)
			setMessages((prev) =>
				prev.map((msg) => {
					if (msg.key !== assistantKey) return msg
					const currentVersion = msg.versions[msg.activeVersionIndex]
					return {
						...msg,
						versions: msg.versions.map((v, i) =>
							i === msg.activeVersionIndex
								? {
									...v,
									parts: [...v.parts, { id: nanoid(), type: 'text', content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }]
								}
								: v
						)
					}
				})
			)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="flex flex-col h-full w-full bg-white dark:bg-slate-950 overflow-hidden animate-in slide-in-from-right duration-300">
			<AIChatHeader onClearChat={handleClearChat} onClose={onClose} />

			<Conversation className="min-h-0 flex-1 border-b">
				<ConversationContent>
					{messages.map((message) => (
						<MessageBranch key={message.key} defaultBranch={message.activeVersionIndex}>
							<MessageBranchContent>
								{message.versions.map((version) => (
									<Message
										from={message.from as UIMessage['role']}
										key={version.id}
										className={message.from === 'assistant' ? 'max-w-full' : ''}
									>
										<div className="w-full">
											{/* Sources (if any) */}
											{message.sources && message.sources.length > 0 && (
												<Sources className="w-full">
													<SourcesTrigger count={message.sources.length} />
													<SourcesContent>
														{message.sources.map(s => (
															<Source key={s.href} href={s.href} title={s.title} />
														))}
													</SourcesContent>
												</Sources>
											)}

											{/* Reasoning (if any) */}
											{message.reasoning && (
												<Reasoning duration={message.reasoning.duration} className="w-full">
													<ReasoningTrigger />
													<ReasoningContent>{message.reasoning.content}</ReasoningContent>
												</Reasoning>
											)}

											<MessageContent className={message.from === 'assistant' ? 'w-full' : ''}>
												{(version.parts || []).map((part, index) => {
													const isFirstPart = index === 0
													if (part.type === 'text') {
														return (
															<div key={part.id} className={isFirstPart ? 'my-2' : ''}>
																<MessageResponse>{part.content || ''}</MessageResponse>
															</div>
														)
													}
													if (part.type === 'tool' && part.tool) {
														const { tool } = part
														return (
															<div key={part.id} className={isFirstPart ? 'my-2 w-full' : 'w-full'}>
																<Tool className="w-full">
																	<ToolHeader title={tool.name} type="dynamic-tool" toolName={tool.name} state={mapStatusToShadcn(tool.status)} />
																	<ToolContent className="w-full">
																		<ToolInput input={tool.args} className="w-full" />
																		<ToolOutput output={tool.result} errorText={tool.status === 'error' ? tool.result : undefined} className="w-full" />
																	</ToolContent>
																</Tool>
															</div>
														)
													}
													return null
												})}
											</MessageContent>
										</div>
									</Message>
								))}
							</MessageBranchContent>

							{/* Version Selector (If multiple versions) */}
							{message.versions.length > 1 && (
								<MessageBranchSelector>
									<MessageBranchPrevious
										onClick={() => setMessages(prev => prev.map(m => m.key === message.key ? { ...m, activeVersionIndex: m.activeVersionIndex - 1 } : m))}
									/>
									<MessageBranchPage />
									<MessageBranchNext
										onClick={() => setMessages(prev => prev.map(m => m.key === message.key ? { ...m, activeVersionIndex: m.activeVersionIndex + 1 } : m))}
									/>
								</MessageBranchSelector>
							)}
						</MessageBranch>
					))}
					{isLoading && !messages.at(-1)?.versions?.[0]?.parts?.length && (
						<div className="animate-pulse text-slate-400 text-sm italic font-light">
							Neptune sedang merenung...
						</div>
					)}
				</ConversationContent>
				<ConversationScrollButton />
			</Conversation>

			<div className="shrink-0 space-y-4 pt-4">
				<Suggestions className="px-4">
					{suggestions.map(suggestion => (
						<Suggestion
							key={suggestion}
							onClick={(s) => handleSubmit(s)}
							suggestion={suggestion}
						/>
					))}
				</Suggestions>

				<div className="w-full px-4 pb-4">
					<PromptInputProvider>
						<AIChatInput
							onSend={handleSubmit}
							isLoading={isLoading}
							onStop={handleStop}
							model={model}
							setModel={setModel}
							modelSelectorOpen={modelSelectorOpen}
							setModelSelectorOpen={setModelSelectorOpen}
								reasoningEnabled={reasoningEnabled}
								setReasoningEnabled={setReasoningEnabled}
							selectedModelData={selectedModelData}
						/>
					</PromptInputProvider>
				</div>
			</div>
		</div>
	)
}

// Sub-component to access PromptInputProvider context
function AIChatInput({
	onSend,
	isLoading,
	onStop,
	model,
	setModel,
	modelSelectorOpen,
	setModelSelectorOpen,
	reasoningEnabled,
	setReasoningEnabled,
	selectedModelData
}: any) {
	const controller = usePromptInputController();
	const input = controller?.textInput.value || '';

	return (
		<PromptInput
			onSubmit={(msg: PromptInputMessage, e) => {
				e.preventDefault();
				if (isLoading) {
					onStop();
				} else {
					onSend(msg);
				}
			}}
			className="w-full"
		>
			<PromptInputHeader />
			<PromptInputBody>
				<PromptInputTextarea
					className="py-3 px-4"
					placeholder="Tanyakan apa saja ke Neptune..."
				// Note: value and onChange are managed internally by PromptInputProvider/Textarea
				/>
			</PromptInputBody>
			<PromptInputFooter>
				<PromptInputTools>
					<Button
						size="default"
						onClick={() => setReasoningEnabled(!reasoningEnabled)}
						variant={reasoningEnabled ? "default" : "ghost"}
						className="h-8 text-xs gap-1"
					>
						<Sparkles className="w-4 h-4" />
						<span className="hidden sm:inline">Reasoning</span>
					</Button>
					<ModelSelector onOpenChange={setModelSelectorOpen} open={modelSelectorOpen}>
						<ModelSelectorTrigger asChild>
							<Button size="sm" variant="ghost" className='gap-2 h-8' onClick={() => setModelSelectorOpen(!modelSelectorOpen)}>
								<ModelSelectorLogo provider={selectedModelData?.chefSlug || 'google'} />
								{selectedModelData?.name && (
									<ModelSelectorName className="text-xs">{selectedModelData.name}</ModelSelectorName>
								)}
							</Button>
						</ModelSelectorTrigger>
						<ModelSelectorContent>
							<ModelSelectorInput placeholder="Cari model..." />
							<ModelSelectorList>
								<ModelSelectorEmpty>Model tidak ditemukan.</ModelSelectorEmpty>
								<ModelSelectorGroup heading="Model Tersedia">
									{models.map(m => (
										<ModelSelectorItem
											key={m.id}
											onSelect={() => {
												setModel(m.id);
												setModelSelectorOpen(false);
											}}
											value={m.id}
										>
											<ModelSelectorLogo provider={m.chefSlug} />
											<ModelSelectorName>{m.name}</ModelSelectorName>
											{model === m.id && <CheckIcon className="ml-auto size-3" />}
										</ModelSelectorItem>
									))}
								</ModelSelectorGroup>
							</ModelSelectorList>
						</ModelSelectorContent>
					</ModelSelector>
				</PromptInputTools>
				<PromptInputSubmit
					disabled={!input.trim() && !isLoading}
					status={isLoading ? "streaming" : "ready"}
				/>
			</PromptInputFooter>
		</PromptInput>
	)
}

export default AIChatPanel
