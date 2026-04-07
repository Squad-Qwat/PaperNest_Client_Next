'use client'

import { useState, useRef } from 'react'
import { nanoid } from 'nanoid'
import { CheckIcon, Sparkles } from 'lucide-react'

import { executeEditorTool } from '@/lib/ai/tools/functions'
import { AIChatHeader } from './AIChatHeader'

import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from '@/components/ui/ai-elements/conversation'
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
} from '@/components/ui/ai-elements/message'
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
} from '@/components/ui/ai-elements/model-selector'
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
} from '@/components/ui/ai-elements/prompt-input'
import { Suggestion, Suggestions } from '@/components/ui/ai-elements/suggestion'
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ui/ai-elements/reasoning'
import { Sources, Source, SourcesContent, SourcesTrigger } from '@/components/ui/ai-elements/sources'
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ui/ai-elements/tool'
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
	{ id: 'google-genai:gemma-4-31b-it', name: 'Nereus AI', chef: 'Google', chefSlug: 'google' },
	{ id: 'google-genai:gemini-3.1-flash-lite-preview', name: 'Neptune AI (New)', chef: 'Google', chefSlug: 'google' },
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
	// CRITICAL: useRef for plan so async while-loop always reads the latest value.
	// useState is stale inside async closures — setCurrentPlan() updates won't be
	// visible to the while loop that captured currentPlan at function start.
	const currentPlanRef = useRef<any[]>([])
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

	const makeToolCallSignature = (name: string, args: unknown): string => {
		const serializedArgs = stringifyToolResult(args)
		return `${name}:${serializedArgs}`
	}

	const handleClearChat = () => {
		setMessages([])
		setCurrentPlan([])
		currentPlanRef.current = [] // Sync ref with cleared state
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

			// VIRTUAL DOCUMENT: Track the document state locally during the thinking loop.
			// This prevents the AI from seeing the 'old' editor text when it has pending staged changes.
			let workingDocText = ''
			if (editorInstance?.state?.doc) {
				workingDocText = editorInstance.state.doc.toString()
			}

			const MAX_STEPS = 20
			let currentStep = 0
			let toolResultsForContinuation: any[] = []
			let shouldContinue = true
			const executedToolSignatures = new Set<string>()
			const toolRetryCount = new Map<string, number>() // Track repetitions of the same tool/args

			while (shouldContinue && currentStep < MAX_STEPS) {
				currentStep++

				// Read plan from ref (always fresh, unlike useState which is stale in closures)
				const latestPlan = currentPlanRef.current
				const hasUncompletedSteps = latestPlan?.some((s: any) => s.status !== 'completed') ?? false
				const planToSend = hasUncompletedSteps ? latestPlan : undefined

				// CRITICAL: Bypass Next.js proxy for SSE streaming.
				// Next.js rewrites buffer the response and break SSE connections.
				// We must call the backend directly.
				const backendBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') || 'http://localhost:3000/api'
				
				// SAFETY: Add timeout to prevent hanging connections
				const timeoutSignal = AbortSignal.timeout(60000) // 1 minute limit per request
				const combinedSignal = AbortSignal.any([controller.signal, timeoutSignal])

				console.log(`[AI] Starting request loop iteration ${currentStep}/${MAX_STEPS}...`)

				const response = await fetch(`${backendBase}/ai/stream`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						message: userInput,
						documentContent: workingDocText,
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
					signal: combinedSignal
				})

				if (!response.ok) throw new Error(`AI request failed: ${response.statusText}`)

				const reader = response.body?.getReader()
				const decoder = new TextDecoder()
				if (!reader) throw new Error('No response stream available')

				toolResultsForContinuation = []
				let hasToolCalls = false
				let backendHasMoreSteps: boolean | undefined

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
											const toolSignature = makeToolCallSignature(toolCall.name, toolCall.args)
											
											// SAFETY: Prevent infinite loop of the exact same tool call (max 3 retries)
											const retryCount = (toolRetryCount.get(toolSignature) || 0) + 1
											toolRetryCount.set(toolSignature, retryCount)
											
											if (retryCount > 3) {
												const stopMsg = `SAFETY BREAK: Tool loop detected for ${toolCall.name}. Stopping to prevent overflow.`
												console.error(`[AI] ${stopMsg}`)
												toolResultsForContinuation.push({
													toolCallId: toolCall.id,
													name: toolCall.name,
													result: stopMsg,
													success: false
												})
												shouldContinue = false
												continue
											}


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
													// SYNC: Update our virtual working document so the AI sees its own change in the next iteration
													if (result.modified) {
														workingDocText = result.modified;
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
												// REPORTING: If it's a staged change, send a clean success signal instead of the raw object.
												// This helps the Reflector understand that the edit is 'done' in the preview.
												const feedbackResult = (result && typeof result === 'object' && result.type === 'staged_change')
													? `SUCCESS: Document edit staged/previewed. ${result.searchBlock?.[0]?.length ?? 0} characters modified. User will need to Accept/Reject to make it permanent.`
													: stringifyToolResult(result);

												toolResultsForContinuation.push({
													toolCallId: toolCall.id,
													name: toolCall.name,
													result: feedbackResult
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
										currentPlanRef.current = data.plan || [] // Sync ref (stale closure fix)
										break
																case 'reasoning':
																	setMessages((prev) =>
																		prev.map((msg) => {
																			if (msg.key !== assistantKey) return msg
																			
																			const existing = msg.reasoning?.content || ''
																			const incoming = typeof data.content === 'string' ? data.content.trim() : ''
																			if (!incoming) return msg
																			
																			// SAFETY: Deduplicate reasoning lines
																			// If the incoming text block (or primary part of it) already exists, skip it.
																			// This prevents the "Step 1, Step 1, Step 1" spam in looping execution.
																			const existingLines = new Set(existing.split('\n').map(l => l.trim()))
																			const incomingLines = incoming.split('\n')
																			
																			const filteredIncoming = incomingLines
																				.filter((line: string) => line.trim() && !existingLines.has(line.trim()))
																				.join('\n')
																			
																			if (!filteredIncoming) return msg
																			
																			const combined = existing ? `${existing}\n\n${filteredIncoming}` : filteredIncoming
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
																case 'done':
																	backendHasMoreSteps = data.hasMoreSteps === true
																	break
									case 'stream_end':
										break
								}
							} catch (e) { /* parse error */ }
						}
					}
				}

											// LOGIC: Only continue if the backend says more steps are needed AND we actually did something (tool results)
											const hadToolActivity = hasToolCalls && toolResultsForContinuation.length > 0
											shouldContinue = backendHasMoreSteps !== false && hadToolActivity
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

