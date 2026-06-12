'use client'

import { GlobeIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { type MouseEvent, useEffect } from 'react'
import { PaperNestLoader } from '@/components/layout/PaperNestLoader'
import { Attachment, AttachmentPreview, Attachments } from '@/components/ui/ai-elements/attachments'
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
	ModelSelectorLogo,
	ModelSelectorName,
	ModelSelectorTrigger,
	SharedModelSelectorContent,
} from '@/components/ui/ai-elements/model-selector'
import {
	PromptInput,
	PromptInputActionAddAttachments,
	PromptInputActionAddScreenshot,
	PromptInputActionMenu,
	PromptInputActionMenuContent,
	PromptInputActionMenuTrigger,
	PromptInputBody,
	PromptInputButton,
	PromptInputFooter,
	PromptInputHeader,
	type PromptInputMessage,
	PromptInputProvider,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputTools,
	SharedPromptInputAttachments,
	usePromptInputAttachments,
	usePromptInputController,
} from '@/components/ui/ai-elements/prompt-input'
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
import { AI_MODELS } from '@/lib/ai/constants'
// New modular AI logic
import { useAIChat } from '@/lib/ai/hooks/use-ai-chat'
import { useAIChatStore } from '@/lib/ai/store'
import type { ToolStatus } from '@/lib/ai/types/chat'
import { cn, preprocessLatex } from '@/lib/utils'
import { AIChatHeader } from './AIChatHeader'

const models = AI_MODELS

const editorSuggestions = [
	'Help me write a paper abstract',
	'Check LaTeX errors in this document',
	'Create a simple bibliography',
	'Format title and section',
	'Add methodology table',
]

const viewerSuggestions = [
	'Explain the abstract of this document',
	'Check LaTeX errors in this document',
	'Review this document structure',
	'Summarize this document',
	'Search for relevant references',
]

interface EditorFunctions {
	editor?: any
	setPendingMerge?: (data: any) => void
	readOnly?: boolean
}

interface AIChatPanelProps {
	editor?: EditorFunctions
	onClose?: () => void
	documentId?: string
}

export function AIChatPanel({ editor, onClose, documentId }: AIChatPanelProps) {
	const activeSuggestions = editor?.readOnly ? viewerSuggestions : editorSuggestions

	// 1. Hooks & Store
	const { sendMessage, stop, messages, isStreaming } = useAIChat({
		editor,
		documentId,
	})
	const {
		model,
		setModel,
		agentId,
		setAgentId,
		clearChat,
		reasoningEnabled: _reasoningEnabled,
		setReasoningEnabled: _setReasoningEnabled,
		updateMessageVersion,
		switchContext,
	} = useAIChatStore()

	useEffect(() => {
		if (documentId) {
			switchContext(documentId)
		}
	}, [documentId, switchContext])

	const selectedModelData = models.find((m) => m.id === model)

	// 2. Handlers
	const handleSubmit = (promptMsg: PromptInputMessage | string) => {
		if (typeof promptMsg === 'string') {
			sendMessage(promptMsg)
		} else {
			sendMessage(promptMsg.text, promptMsg.files)
		}
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
		<div className='flex flex-col h-full w-full bg-card overflow-hidden'>
			<AIChatHeader onClearChat={clearChat} onClose={onClose} />

			<Conversation className='min-h-0 flex-1 border-b border-border'>
				<ConversationContent>
					{messages.map((message) => (
						<MessageBranch key={message.key} defaultBranch={message.activeVersionIndex}>
							<MessageBranchContent>
								{message.versions.map((version) => (
									<Message
										from={message.from as any}
										key={version.id}
										className={
											message.from === 'assistant' ? 'max-w-full' : 'max-w-[85%] ml-auto w-fit'
										}
									>
										<div className={message.from === 'assistant' ? 'w-full' : 'w-fit max-w-full'}>
											{message.attachments && message.attachments.length > 0 && (
												<div className='mb-2'>
													<Attachments variant='grid'>
														{message.attachments.map((file) => (
															<Attachment key={file.id} data={{ ...file, type: 'file' } as any}>
																<AttachmentPreview />
															</Attachment>
														))}
													</Attachments>
												</div>
											)}
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

											<MessageContent
												className={
													message.from === 'assistant'
														? 'w-full pt-0.5'
														: 'w-fit min-w-[80px] max-w-full pt-0.5 group-[.is-user]:bg-secondary group-[.is-user]:py-2'
												}
											>
												{(version.parts || []).map((part) => {
													if (part.type === 'text') {
														if (!part.content?.trim()) return null
														return (
															<div key={part.id} className='my-2'>
																{message.from === 'assistant' ? (
																	<MessageResponse>
																		{preprocessLatex(part.content || '')}
																	</MessageResponse>
																) : (
																	<div className='text-foreground leading-relaxed text-sm md:text-base whitespace-pre-wrap break-words'>
																		{part.content || ''}
																	</div>
																)}
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
												<AnimatePresence>
													{isStreaming && message.key === messages.at(-1)?.key && (
														<motion.div
															initial={{ opacity: 0, height: 0 }}
															animate={{ opacity: 1, height: 'auto' }}
															exit={{ opacity: 0, height: 0 }}
															transition={{ duration: 0.25, ease: 'easeInOut' }}
															className='flex items-center gap-2 py-1 mt-1 overflow-hidden'
														>
															<PaperNestLoader width={18} height={18} />
															<span className='text-sm md:text-base font-medium shimmer-text'>
																Working
															</span>
														</motion.div>
													)}
												</AnimatePresence>
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
				</ConversationContent>
				<ConversationScrollButton />
			</Conversation>

			<div
				className={`shrink-0 space-y-4 pt-4 bg-gradient-to-t from-card to-transparent z-20 glow-chat-divider ${isStreaming ? 'is-ai-thinking' : ''}`}
			>
				<Suggestions className='px-4'>
					{activeSuggestions.map((suggestion) => (
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
							agentId={agentId}
							setAgentId={setAgentId}
							readOnly={editor?.readOnly}
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

function PromptInputAttachmentsList() {
	const attachments = usePromptInputAttachments()
	if (attachments.files.length === 0) return null

	return (
		<PromptInputHeader className='border-b border-border/40 p-2'>
			<SharedPromptInputAttachments />
		</PromptInputHeader>
	)
}

interface AIChatInputProps {
	onSend: (msg: PromptInputMessage | string) => void
	isLoading: boolean
	onStop: () => void
	model: string
	setModel: (model: string) => void
	selectedModelData?: any
	agentId: string
	setAgentId: (id: string) => void
	readOnly?: boolean
}

function AIChatInput({
	onSend,
	isLoading,
	onStop,
	model,
	setModel,
	selectedModelData,
	agentId,
	setAgentId,
	readOnly,
}: AIChatInputProps) {
	const controller = usePromptInputController()
	const input = controller?.textInput.value || ''
	const attachments = usePromptInputAttachments()
	const { webSearchEnabled, setWebSearchEnabled } = useAIChatStore()

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
			accept='image/*,application/pdf'
			multiple={true}
			className='w-full min-w-0'
		>
			<PromptInputAttachmentsList />
			<PromptInputBody>
				<PromptInputTextarea
					className='py-3 px-4'
					placeholder={readOnly ? 'Ask Neptune anything (Read Only)...' : 'Ask Neptune anything...'}
				/>
			</PromptInputBody>
			<PromptInputFooter>
				<PromptInputTools>
					<PromptInputActionMenu>
						<PromptInputActionMenuTrigger />
						<PromptInputActionMenuContent>
							<PromptInputActionAddAttachments />
							<PromptInputActionAddScreenshot />
						</PromptInputActionMenuContent>
					</PromptInputActionMenu>

					<PromptInputButton
						onClick={(e: MouseEvent) => {
							e.preventDefault()
							setWebSearchEnabled(!webSearchEnabled)
						}}
						className={cn(
							'gap-2 h-8 px-2.5 rounded-md transition-all duration-200 cursor-pointer',
							webSearchEnabled
								? 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15'
								: 'text-muted-foreground hover:bg-accent hover:text-foreground'
						)}
					>
						<GlobeIcon
							className={cn('size-4', webSearchEnabled ? 'text-primary' : 'text-muted-foreground')}
						/>
						<span className='text-xs font-medium'>Search</span>
					</PromptInputButton>

					<ModelSelector>
						<ModelSelectorTrigger asChild>
							<Button size='sm' variant='ghost' className='gap-2 h-8'>
								{selectedModelData?.chef && (
									<ModelSelectorLogo provider={(selectedModelData?.chef || 'google') as any} />
								)}
								{selectedModelData?.name && (
									<ModelSelectorName className='text-xs'>
										{selectedModelData.name.length > 15
											? `${selectedModelData.name.slice(0, 15)}...`
											: selectedModelData.name}
									</ModelSelectorName>
								)}
							</Button>
						</ModelSelectorTrigger>
						<SharedModelSelectorContent
							model={model}
							setModel={setModel}
							agentId={agentId}
							setAgentId={setAgentId}
						/>
					</ModelSelector>
				</PromptInputTools>
				<PromptInputSubmit
					disabled={!input.trim() && attachments.files.length === 0 && !isLoading}
					status={isLoading ? 'streaming' : 'ready'}
					onStop={onStop}
				/>
			</PromptInputFooter>
		</PromptInput>
	)
}

export default AIChatPanel
