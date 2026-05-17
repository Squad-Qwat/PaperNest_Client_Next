'use client'

import { CheckIcon } from 'lucide-react'
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
import {
	ChainOfThought,
	ChainOfThoughtContent,
	ChainOfThoughtHeader,
	ChainOfThoughtStep,
} from '@/components/ui/ai-elements/chain-of-thought'
import {
	Reasoning,
	ReasoningContent,
	ReasoningTrigger,
} from '@/components/ui/ai-elements/reasoning'
import {
	Source,
	Sources,
	SourcesContent,
	SourcesTrigger,
} from '@/components/ui/ai-elements/sources'
import { Suggestion, Suggestions } from '@/components/ui/ai-elements/suggestion'
import {
	Tool,
	ToolContent,
	ToolHeader,
	ToolInput,
	ToolOutput,
} from '@/components/ui/ai-elements/tool'
import { Button } from '@/components/ui/button'
// New modular AI logic
import { useAIChat } from '@/lib/ai/hooks/use-ai-chat'
import { useAIChatStore } from '@/lib/ai/store'
import type { ToolStatus } from '@/lib/ai/types/chat'
import { AgentSelector } from './AgentSelector'
import { AIChatHeader } from './AIChatHeader'
import { AI_MODELS } from '@/lib/ai/constants'

const models = AI_MODELS

const suggestions = [
	'Bantu saya menulis abstrak paper',
	'Cek error LaTeX dokumen ini',
	'Buat daftar pustaka sederhana',
	'Format judul dan section',
	'Tambahkan tabel metodologi',
]

interface EditorFunctions {
	editor?: any
	setPendingMerge?: (data: any) => void
}

interface AIChatPanelProps {
	editor?: EditorFunctions
	onClose?: () => void
	documentId?: string
}

export function AIChatPanel({ editor, onClose, documentId }: AIChatPanelProps) {
	// 1. Hooks & Store
	const { sendMessage, stop, messages, isStreaming, currentPlan } = useAIChat({ editor, documentId })
	const {
		model,
		setModel,
		clearChat,
		reasoningEnabled: _reasoningEnabled,
		setReasoningEnabled: _setReasoningEnabled,
		updateMessageVersion,
	} = useAIChatStore()

	const selectedModelData = models.find((m) => m.id === model)

	// 2. Handlers
	const handleSubmit = (promptMsg: PromptInputMessage | string) => {
		const text = typeof promptMsg === 'string' ? promptMsg : promptMsg.text
		sendMessage(text)
	}

	const mapStatusToShadcn = (status: ToolStatus): any => {
		switch (status) {
			case 'executing':
				return 'input-available'
			case 'complete':
				return 'output-available'
			case 'error':
				return 'output-error'
			default:
				return 'input-available'
		}
	}

	return (
		<div className='flex flex-col h-full w-full bg-white dark:bg-slate-950 overflow-hidden animate-in slide-in-from-right duration-300'>
			<AIChatHeader onClearChat={clearChat} onClose={onClose} />

			<Conversation className='min-h-0 flex-1 border-b'>
				<ConversationContent>
					{messages.map((message) => (
						<MessageBranch key={message.key} defaultBranch={message.activeVersionIndex}>
							<MessageBranchContent>
								{message.versions.map((version) => (
									<Message
										from={message.from as any}
										key={version.id}
										className={
											message.from === 'assistant'
												? 'max-w-full'
												: 'max-w-[85%] ml-auto w-fit'
										}
									>
										<div className={message.from === 'assistant' ? 'w-full' : 'w-fit max-w-full'}>
											{/* Sources */}
											{message.sources && message.sources.length > 0 && (
												<Sources className='w-full'>
													<SourcesTrigger count={message.sources.length} />
													<SourcesContent>
														{message.sources.map((s) => (
															<Source key={s.href} href={s.href} title={s.title} />
														))}
													</SourcesContent>
												</Sources>
											)}

											{/* Reasoning */}
											{message.reasoning && (
												<Reasoning duration={message.reasoning.duration} className='w-full'>
													<ReasoningTrigger />
													<ReasoningContent>{message.reasoning.content}</ReasoningContent>
												</Reasoning>
											)}

											<MessageContent className={message.from === 'assistant' ? 'w-full' : 'w-fit min-w-[80px] max-w-full group-[.is-user]:bg-slate-100/60 dark:group-[.is-user]:bg-slate-800/40 group-[.is-user]:py-2'}>
												{(version.parts || []).map((part) => {
													if (part.type === 'text') {
														return (
															<div key={part.id} className='my-2'>
																<MessageResponse>{part.content || ''}</MessageResponse>
															</div>
														)
													}
													if (part.type === 'tool' && part.tool) {
														const { tool } = part
														return (
															<div key={part.id} className='my-2 w-full'>
																<Tool className='w-full'>
																	<ToolHeader
																		title={tool.name}
																		type='dynamic-tool'
																		toolName={tool.name}
																		state={mapStatusToShadcn(tool.status)}
																	/>
																	<ToolContent className='w-full'>
																		<ToolInput input={tool.args} className='w-full' />
																		<ToolOutput
																			output={tool.result}
																			errorText={tool.status === 'error' ? tool.result : undefined}
																			className='w-full'
																		/>
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

							{/* Version Selector */}
							{message.versions.length > 1 && (
								<MessageBranchSelector>
									<MessageBranchPrevious
										onClick={() =>
											updateMessageVersion(message.key, message.activeVersionIndex - 1)
										}
									/>
									<MessageBranchPage />
									<MessageBranchNext
										onClick={() =>
											updateMessageVersion(message.key, message.activeVersionIndex + 1)
										}
									/>
								</MessageBranchSelector>
							)}
						</MessageBranch>
					))}
					{isStreaming && !messages.at(-1)?.versions?.[0]?.parts?.length && (
						<Message
							from='assistant'
							className='max-w-full w-full'
						>
							<MessageContent className='w-full pt-1'>
								{currentPlan && currentPlan.length > 0 ? (
									<ChainOfThought defaultOpen={true}>
										<ChainOfThoughtHeader>Rencana Neptune AI</ChainOfThoughtHeader>
										<ChainOfThoughtContent>
											{currentPlan.map((step, idx) => (
												<ChainOfThoughtStep
													key={idx}
													label={step.title}
													status={
														step.status === 'completed'
															? 'complete'
															: step.status === 'failed'
																? 'failed'
																: step.status
													}
												/>
											))}
										</ChainOfThoughtContent>
									</ChainOfThought>
								) : (
									<span className='text-sm text-slate-400 italic font-light animate-pulse'>
										Neptune sedang merenung...
									</span>
								)}
							</MessageContent>
						</Message>
					)}
				</ConversationContent>
				<ConversationScrollButton />
			</Conversation>

			<div className={`shrink-0 space-y-4 pt-4 bg-gradient-to-t from-slate-50 via-slate-50/98 to-transparent dark:from-slate-950 dark:via-slate-950/98 dark:to-transparent z-20 glow-chat-divider ${isStreaming ? 'is-ai-thinking' : ''}`}>
				<Suggestions className='px-4'>
					{suggestions.map((suggestion) => (
						<Suggestion key={suggestion} onClick={(s) => sendMessage(s)} suggestion={suggestion} />
					))}
				</Suggestions>

				<div className='w-full px-4'>
					<PromptInputProvider>
						<AIChatInput
							onSend={handleSubmit}
							isLoading={isStreaming}
							onStop={stop}
							model={model}
							setModel={setModel}
							selectedModelData={selectedModelData}
						/>
					</PromptInputProvider>
				</div>
				<style>{`
					.glow-chat-divider {
						position: relative;
					}
					.glow-chat-divider:before,
					.glow-chat-divider:after {
						content: "";
						position: absolute;
						background: linear-gradient(
							90deg,
							var(--primary),
							var(--warning),
							var(--primary),
							var(--warning),
							var(--primary)
						);
						background-size: 400%;
						opacity: 0;
						transition: opacity 1.2s ease-in-out;
						pointer-events: none;
					}
					/* Horizontal glowing neon line on the absolute top border */
					.glow-chat-divider:before {
						top: 0;
						left: 0;
						width: 100%;
						height: 2px;
						z-index: 30;
					}
					/* Ultra-smooth ambient blur shadow projecting DOWNWARDS from top */
					.glow-chat-divider:after {
						top: 0;
						left: 0;
						width: 100%;
						height: 120px;
						filter: blur(24px);
						z-index: -1;
						-webkit-mask-image: linear-gradient(
							to bottom,
							rgba(0,0,0,1) 0%,
							rgba(0,0,0,0.85) 15%,
							rgba(0,0,0,0.6) 35%,
							rgba(0,0,0,0.3) 60%,
							rgba(0,0,0,0.1) 80%,
							rgba(0,0,0,0) 100%
						);
						mask-image: linear-gradient(
							to bottom,
							rgba(0,0,0,1) 0%,
							rgba(0,0,0,0.85) 15%,
							rgba(0,0,0,0.6) 35%,
							rgba(0,0,0,0.3) 60%,
							rgba(0,0,0,0.1) 80%,
							rgba(0,0,0,0) 100%
						);
					}
					.glow-chat-divider.is-ai-thinking:before,
					.glow-chat-divider.is-ai-thinking:after {
						opacity: 1;
						animation: glow-flow 12s linear infinite;
					}
					@keyframes glow-flow {
						0% {
							background-position: 0 0;
						}
						100% {
							background-position: 400% 0;
						}
					}
				`}</style>
			</div>
		</div>
	)
}

function AIChatInput({ onSend, isLoading, onStop, model, setModel, selectedModelData }: any) {
	const controller = usePromptInputController()
	const input = controller?.textInput.value || ''

	return (
		<PromptInput
			onSubmit={(msg: PromptInputMessage, e) => {
				e.preventDefault()
				if (isLoading) {
					onStop()
				} else {
					onSend(msg)
				}
			}}
			className='w-full'
		>
			<PromptInputHeader />
			<PromptInputBody>
				<PromptInputTextarea className='py-3 px-4' placeholder='Tanyakan apa saja ke Neptune...' />
			</PromptInputBody>
			<PromptInputFooter>
				<PromptInputTools>
					<AgentSelector />

					<ModelSelector>
						<ModelSelectorTrigger asChild>
							<Button size='sm' variant='ghost' className='gap-2 h-8'>
								<ModelSelectorLogo provider={selectedModelData?.chef || 'google'} />
								{selectedModelData?.name && (
									<ModelSelectorName className='text-xs'>
										{selectedModelData.name}
									</ModelSelectorName>
								)}
							</Button>
						</ModelSelectorTrigger>
						<ModelSelectorContent>
							<ModelSelectorInput placeholder='Cari model...' />
							<ModelSelectorList>
								<ModelSelectorEmpty>Model tidak ditemukan.</ModelSelectorEmpty>
								<ModelSelectorGroup heading='Model Tersedia'>
									{models.map((m) => (
										<ModelSelectorItem key={m.id} onSelect={() => setModel(m.id)} value={m.id}>
											<ModelSelectorLogo provider={m.chef as any} />
											<ModelSelectorName>{m.name}</ModelSelectorName>
											{model === m.id && <CheckIcon className='ml-auto size-3' />}
										</ModelSelectorItem>
									))}
								</ModelSelectorGroup>
							</ModelSelectorList>
						</ModelSelectorContent>
					</ModelSelector>
				</PromptInputTools>
				<PromptInputSubmit
					disabled={!input.trim() && !isLoading}
					status={isLoading ? 'streaming' : 'ready'}
					onStop={onStop}
				/>
			</PromptInputFooter>
		</PromptInput>
	)
}

export default AIChatPanel
