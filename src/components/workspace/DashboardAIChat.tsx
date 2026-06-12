'use client'

import { FileText, Sparkles } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { PaperNestLoader } from '@/components/layout/PaperNestLoader'
import { Attachment, AttachmentPreview, Attachments } from '@/components/ui/ai-elements/attachments'
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
import { preprocessLatex } from '@/lib/utils'

interface ChatMessage {
	id: string
	from: 'user' | 'assistant'
	text: string
	isReasoning?: boolean
	reasoningText?: string
	attachments?: any[]
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

	return parts.map((part) => {
		if (part.startsWith('@')) {
			const docTitle = part.slice(1)
			const matchedDoc = sortedDocs.find((doc) => doc.title === docTitle)
			if (matchedDoc) {
				return (
					<span
						key={`tag-${matchedDoc.id || matchedDoc.title}-${part}`}
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
	documents = [],
}: DashboardAIChatProps) {
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
							<h3 className='text-lg font-semibold text-foreground'>
								Start a conversation with Aurora AI
							</h3>
							<p className='text-sm text-muted-foreground max-w-md mt-1'>
								Ask about your documents, draft academic writing, or request research analysis
								assistance.
							</p>
						</div>
					) : (
						messages.map((msg) => (
							<div key={msg.id} className='animate-in fade-in slide-in-from-bottom-2 duration-300'>
								<Message
									from={msg.from}
									className={
										msg.from === 'assistant' ? 'max-w-4xl w-full' : 'max-w-2xl ml-auto w-fit'
									}
								>
									<div className={msg.from === 'assistant' ? 'w-full' : 'w-fit max-w-full'}>
										{msg.from === 'user' && msg.attachments && msg.attachments.length > 0 && (
											<div className='mb-2'>
												<Attachments variant='grid'>
													{msg.attachments.map((file: any) => (
														<Attachment key={file.id} data={{ ...file, type: 'file' }}>
															<AttachmentPreview />
														</Attachment>
													))}
												</Attachments>
											</div>
										)}

										{msg.from === 'assistant' && msg.reasoningText && (
											<div className='mb-2 w-full'>
												<Reasoning duration={1} className='w-full'>
													<ReasoningTrigger />
													<ReasoningContent>{msg.reasoningText}</ReasoningContent>
												</Reasoning>
											</div>
										)}

										<MessageContent
											className={
												msg.from === 'assistant'
													? 'w-full pt-0.5'
													: 'w-fit min-w-[80px] max-w-full pt-0.5 group-[.is-user]:bg-secondary group-[.is-user]:py-2'
											}
										>
											{msg.from === 'assistant' ? (
												<>
													{msg.text && (
														<MessageResponse className='text-foreground leading-relaxed text-sm md:text-base'>
															{preprocessLatex(msg.text)}
														</MessageResponse>
													)}
													<AnimatePresence>
														{isThinking && msg.id === messages.at(-1)?.id && (
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
												</>
											) : (
												<div className='text-foreground leading-relaxed text-sm md:text-base whitespace-pre-wrap break-words'>
													{renderMessageTextWithTags(msg.text, documents)}
												</div>
											)}
										</MessageContent>
									</div>
								</Message>
							</div>
						))
					)}

					{/* Thinking Animation */}
					<AnimatePresence>
						{isThinking && messages.at(-1)?.from !== 'assistant' && (
							<motion.div
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
								exit={{ opacity: 0, height: 0 }}
								transition={{ duration: 0.25, ease: 'easeInOut' }}
								className='animate-in fade-in duration-300 max-w-4xl overflow-hidden'
							>
								<Message from='assistant' className='max-w-4xl w-full'>
									<div className='w-full flex items-center gap-2 py-1'>
										<PaperNestLoader width={18} height={18} />
										<span className='text-sm md:text-base font-medium shimmer-text'>Working</span>
									</div>
								</Message>
							</motion.div>
						)}
					</AnimatePresence>
				</ConversationContent>
				<ConversationScrollButton />
			</Conversation>
		</div>
	)
}
