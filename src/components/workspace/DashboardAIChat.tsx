'use client'

import { FileText, Sparkles } from 'lucide-react'
import { useEffect, useRef } from 'react'
import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from '@/components/ui/ai-elements/conversation'
import { Message, MessageContent, MessageResponse } from '@/components/ui/ai-elements/message'
import {
	Reasoning,
	ReasoningContent,
	ReasoningTrigger,
} from '@/components/ui/ai-elements/reasoning'
import {
	ChainOfThought,
	ChainOfThoughtContent,
	ChainOfThoughtHeader,
	ChainOfThoughtStep,
} from '@/components/ui/ai-elements/chain-of-thought'
import { useAIChatStore } from '@/lib/ai/store'

interface ChatMessage {
	id: string
	from: 'user' | 'assistant'
	text: string
	isReasoning?: boolean
	reasoningText?: string
}

interface DashboardAIChatProps {
	messages: ChatMessage[]
	isThinking?: boolean
	userDisplayName?: string
	documents?: any[]
}

const renderMessageTextWithTags = (text: string, documents: any[]) => {
	if (!text) return text

	// Sort by title length descending to avoid partial matching bugs
	const sortedDocs = [...documents].sort((a, b) => b.title.length - a.title.length)
	if (sortedDocs.length === 0) return text

	const escapeRegExp = (string: string) => {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	}

	const patterns = sortedDocs.map((doc) => `@${escapeRegExp(doc.title)}`)
	const regex = new RegExp(`(${patterns.join('|')})`, 'g')
	const parts = text.split(regex)

	return parts.map((part, index) => {
		if (part.startsWith('@')) {
			const docTitle = part.slice(1)
			const matchedDoc = sortedDocs.find((doc) => doc.title === docTitle)
			if (matchedDoc) {
				return (
					<span
						key={index}
						className='inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-[11px] font-medium tracking-tight select-none align-middle mx-0.5 transition-all duration-200 hover:bg-primary/15 cursor-default'
					>
						<FileText className='size-3 shrink-0 opacity-75' />
						{matchedDoc.title}
					</span>
				)
			}
		}
		return part
	})
}

export function DashboardAIChat({
	messages,
	isThinking = false,
	userDisplayName = 'User',
	documents = [],
}: DashboardAIChatProps) {
	const { currentPlan } = useAIChatStore()
	const contentRef = useRef<HTMLDivElement | null>(null)

	// Auto-scroll to the bottom of the conversation area when messages or thinking state changes
	useEffect(() => {
		if (contentRef.current) {
			const scrollContainer = contentRef.current.closest('.overflow-y-auto')
			if (scrollContainer) {
				scrollContainer.scrollTo({
					top: scrollContainer.scrollHeight,
					behavior: 'smooth',
				})
			}
		}
	}, [])

	return (
		<div className='flex flex-col flex-1 w-full max-w-5xl mx-auto px-4 py-6 h-full min-h-[400px]'>
			<Conversation className='border-none flex-1 overflow-hidden bg-transparent shadow-none'>
				<ConversationContent className='pb-24 space-y-6'>
					<div ref={contentRef} />
					{messages.length === 0 ? (
						<div className='flex flex-col items-center justify-center py-16 text-center animate-in fade-in slide-in-from-bottom duration-500'>
							<div className='w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 border border-primary/20'>
								<Sparkles className='h-6 w-6 text-primary animate-pulse' />
							</div>
							<h3 className='text-lg font-semibold text-gray-900'>
								Mulai diskusi dengan Neptune AI
							</h3>
							<p className='text-sm text-gray-500 max-w-md mt-1'>
								Tanyakan tentang dokumen Anda, buat draf tulisan akademis, atau mintalah bantuan
								analisis riset.
							</p>
						</div>
					) : (
						messages.map((msg) => (
							<div key={msg.id} className='animate-in fade-in slide-in-from-bottom-2 duration-300'>
								{/* Render optional reasoning block if AI has reasoning state */}
								{msg.from === 'assistant' && msg.reasoningText && (
									<div className='mb-3 max-w-4xl'>
										<Reasoning
											duration={1}
											className='w-full border border-slate-100 shadow-xs rounded-lg'
										>
											<ReasoningTrigger />
											<ReasoningContent>{msg.reasoningText}</ReasoningContent>
										</Reasoning>
									</div>
								)}

								<Message
									from={msg.from}
									className={
										msg.from === 'assistant'
											? 'max-w-4xl w-full'
											: 'max-w-2xl ml-auto w-fit'
									}
								>
									<MessageContent className={msg.from === 'assistant' ? 'w-full pt-0.5' : 'w-fit min-w-[80px] max-w-full pt-0.5 group-[.is-user]:bg-slate-100/60 dark:group-[.is-user]:bg-slate-800/40 group-[.is-user]:py-2'}>
										{msg.from === 'assistant' ? (
											<MessageResponse className='text-gray-800 leading-relaxed text-sm md:text-base'>
												{msg.text}
											</MessageResponse>
										) : (
											<div className='text-gray-800 leading-relaxed text-sm md:text-base whitespace-pre-wrap break-words'>
												{renderMessageTextWithTags(msg.text, documents)}
											</div>
										)}
									</MessageContent>
								</Message>
							</div>
						))
					)}

					{/* Thinking Animation */}
					{isThinking && (
						<div className='animate-in fade-in duration-300 max-w-4xl'>
							<Message
								from='assistant'
								className='max-w-4xl w-full'
							>
								<div className='w-full'>
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
								</div>
							</Message>
						</div>
					)}
				</ConversationContent>
				<ConversationScrollButton />
			</Conversation>
		</div>
	)
}
