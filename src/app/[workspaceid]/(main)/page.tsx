'use client'

import { FileText, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { DashboardContentSkeleton } from '@/components/layout/DashboardSkeleton'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { TemplateGallery } from '@/components/templates/TemplateGallery'
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { AISearchPrompt } from '@/components/workspace/AISearchPrompt'
import { DashboardAIChat } from '@/components/workspace/DashboardAIChat'
import { useAuth } from '@/context/AuthContext'
import { useAIChat } from '@/lib/ai/hooks/use-ai-chat'
import { useAIChatStore } from '@/lib/ai/store'
import { useDeleteDocument, useWorkspaceDocuments } from '@/lib/api/hooks/use-documents'
import { useWorkspace } from '@/lib/api/hooks/use-workspaces'
import type { Document, DocumentsResponse } from '@/lib/api/types/document.types'
import { format } from '@/lib/date'
import { cn } from '@/lib/utils'

export default function WorkspacePage() {
	const params = useParams()
	const router = useRouter()
	const { user, loading: authLoading } = useAuth()
	const workspaceId = params.workspaceid as string
	const {
		data: workspace,
		isLoading: workspaceLoading,
		error: workspaceErrorObj,
	} = useWorkspace(workspaceId)
	const workspaceError = workspaceErrorObj ? (workspaceErrorObj as Error).message : null

	const { data: documentsResponse, isLoading: documentsLoading } =
		useWorkspaceDocuments(workspaceId)
	const documents = (documentsResponse as DocumentsResponse)?.documents || []

	const { mutateAsync: deleteDocMutate, isPending: isDeleting } = useDeleteDocument()

	const [searchQuery, setSearchQuery] = useState('')
	const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
	const [isChatActive, setIsChatActive] = useState(false)

	const { sendMessage, stop, messages, isStreaming } = useAIChat({
		editor: undefined,
		documentId: undefined,
		workspaceId,
	})
	const { clearChat, switchContext } = useAIChatStore()

	useEffect(() => {
		switchContext(workspaceId ? `${workspaceId}_dashboard` : 'dashboard')
	}, [workspaceId, switchContext])

	const aiStatus = useMemo(() => {
		if (!isStreaming) return 'ready'
		const lastMsg = messages[messages.length - 1]
		const version = lastMsg?.versions?.[lastMsg.activeVersionIndex]
		const hasContent = version?.parts?.some(
			(p) => p.type === 'text' && (p as any).content?.trim().length > 0
		)
		return hasContent ? 'streaming' : 'submitted'
	}, [isStreaming, messages])

	const mappedChatMessages = useMemo(() => {
		return messages.map((m) => {
			const version = m.versions[m.activeVersionIndex]
			const text = version?.parts
				? version.parts
						.filter((p) => p.type === 'text')
						.map((p) => (p as any).content || '')
						.join('\n')
				: ''

			return {
				id: m.key,
				from: m.from,
				text,
				reasoningText: m.reasoning?.content,
				attachments: m.attachments,
			}
		})
	}, [messages])

	const handleAIStop = useCallback(() => {
		stop()
	}, [stop])

	const filteredDocuments = useMemo(() => {
		if (!searchQuery) return documents

		const query = searchQuery.toLowerCase()
		return documents.filter(
			(doc: Document) =>
				doc.title.toLowerCase().includes(query) || doc.description?.toLowerCase().includes(query)
		)
	}, [documents, searchQuery])

	const handleDeleteDocument = async (docId: string) => {
		if (!workspaceId) return

		toast.promise(deleteDocMutate({ workspaceId, documentId: docId }), {
			loading: 'Deleting document...',
			success: () => {
				setDeleteConfirm(null)
				return 'Document deleted successfully'
			},
			error: (err) => (err instanceof Error ? err.message : 'Failed to delete document'),
		})
	}

	const handleOpenDocument = (docId: string, title?: string) => {
		toast.promise(
			new Promise((resolve) => {
				router.push(`/${workspaceId}/documents/${docId}`)
				setTimeout(resolve, 800)
			}),
			{
				loading: `Opening ${title || 'document'}...`,
				success: 'Redirecting to editor...',
				error: 'Failed to open document',
			}
		)
	}

	const handleAIPromptSubmit = useCallback(
		async (message: any) => {
			const text = typeof message === 'string' ? message : message.text
			const files = typeof message === 'string' ? undefined : message.files
			const sources = typeof message === 'string' ? [] : message.sources || []
			const taggedDocumentIds = sources.map((s: any) => s.documentId)

			if (!text?.trim() && (!files || files.length === 0)) return

			setIsChatActive(true)
			sendMessage(text, files, taggedDocumentIds)
		},
		[sendMessage]
	)

	if (authLoading || workspaceLoading || documentsLoading) {
		return <DashboardContentSkeleton />
	}

	if (!user) {
		return null
	}

	if (workspaceError) {
		return (
			<div className='min-h-screen bg-background flex items-center justify-center'>
				<div className='text-center'>
					<p className='text-destructive mb-4'>{workspaceError}</p>
					<p className='text-muted-foreground mb-4'>You don't have access to this workspace</p>
					<Button onClick={() => router.push('/')}>Go to Home</Button>
				</div>
			</div>
		)
	}

	if (!workspace) {
		return (
			<div className='min-h-screen bg-background flex items-center justify-center'>
				<div className='text-center'>
					<p className='text-muted-foreground mb-4'>Workspace not found</p>
					<Button onClick={() => router.push('/')}>Go to Home</Button>
				</div>
			</div>
		)
	}

	return (
		<>
			<header className='flex h-16 shrink-0 items-center justify-between gap-2 px-4 bg-background border-b border-border sticky top-0 z-30 rounded-t-2xl'>
				<div className='flex items-center gap-2'>
					<SidebarTrigger className='-ml-1' />
					<Separator orientation='vertical' className='mr-2 h-4' />
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem className='hidden md:block'>
								<BreadcrumbLink href='#'>PaperNest</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className='hidden md:block' />
							<BreadcrumbItem>
								<BreadcrumbPage>{workspace?.title}</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>

				<div className='flex items-center gap-3 ml-auto'>
					{/* Back Button in header when in AI chat mode */}
					{isChatActive && (
						<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
							<Button
								variant='outline'
								onClick={() => {
									setIsChatActive(false)
									clearChat()
								}}
								className='h-9 px-4 text-xs font-semibold rounded-xl text-foreground bg-background border border-border hover:bg-accent hover:text-accent-foreground transition-all shadow-2xs'
							>
								Back to Dashboard
							</Button>
						</motion.div>
					)}
					<ThemeToggle />
				</div>
			</header>

			<main
				className={cn(
					'flex-1 w-full flex flex-col transition-all duration-300',
					isChatActive ? 'h-[calc(100vh-4rem)] overflow-hidden p-0' : 'p-6 overflow-y-auto'
				)}
			>
				<AnimatePresence mode='wait'>
					{!isChatActive ? (
						<motion.div
							key='dashboard-view'
							initial={{ opacity: 0, scale: 0.995 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.995 }}
							transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
							className='w-full flex-1 flex flex-col'
						>
							<div className='mb-8 flex flex-col items-center text-center'>
								<h2 className='text-3xl font-bold text-foreground'>
									What are we researching today?
								</h2>
								<p className='text-muted-foreground mt-2'>
									Find documents or start a new research in workspace {workspace?.title}
								</p>
							</div>

							{/* Center AISearchPrompt in normal Dashboard Mode */}
							<div className='flex flex-col sm:flex-row gap-4 mb-8 justify-center'>
								<div className='flex-1 max-w-5xl mx-auto w-full'>
									<AISearchPrompt
										onSearchChange={setSearchQuery}
										onSearchSubmit={handleAIPromptSubmit}
										status={aiStatus}
										documents={documents}
										placeholder='Search documents or ask PaperNest AI...'
										onStop={handleAIStop}
									/>
								</div>
							</div>

							{(workspace?.userRole === 'owner' || workspace?.userRole === 'editor') && (
								<div className='mb-6'>
									<TemplateGallery workspaceId={workspaceId} />
								</div>
							)}

							<div className='mb-6'>
								<h3 className='text-lg font-semibold flex items-center gap-2'>Manage Documents</h3>
							</div>
							{filteredDocuments.length === 0 ? (
								<div className='flex flex-col items-center justify-center text-center py-12 px-4 bg-background border border-dashed border-muted-foreground/20 rounded-xl max-w-md mx-auto w-full'>
									<FileText className='h-8 w-8 text-muted-foreground/60 mb-3' />
									<h3 className='text-sm font-medium text-foreground mb-1'>
										{searchQuery ? 'No documents found' : 'No documents yet'}
									</h3>
									<p className='text-xs text-muted-foreground'>
										{searchQuery
											? 'Try a different search term'
											: 'No documents available in this workspace'}
									</p>
								</div>
							) : (
								<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
									{filteredDocuments.map((doc: Document) => {
										return (
											<div
												key={doc.documentId}
												className='bg-card border border-border rounded-lg p-6 hover:border-primary transition-all group relative text-left w-full'
											>
												<div className='flex items-start justify-between mb-3'>
													<h3 className='text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 flex-1'>
														{doc.title}
													</h3>
												</div>

												<p className='text-muted-foreground text-sm mb-3 line-clamp-2 min-h-[40px]'>
													{doc.description || 'No description'}
												</p>

												<div className='flex items-center justify-between text-xs text-muted-foreground mb-4'>
													<span>{format(doc.updatedAt || doc.createdAt, 'd MMMM yyyy')}</span>
												</div>

												<div className='flex gap-2 items-center'>
													<Button
														onClick={(e) => {
															e.stopPropagation()
															handleOpenDocument(doc.documentId, doc.title)
														}}
														className='flex-1 bg-primary hover:bg-primary/90'
													>
														Open
													</Button>
													{(workspace?.userRole === 'owner' ||
														workspace?.userRole === 'editor' ||
														doc.createdBy === user?.userId) && (
														<button
															type='button'
															onClick={(e) => {
																e.stopPropagation()
																setDeleteConfirm(doc.documentId)
															}}
															disabled={isDeleting}
															className='inline-flex items-center justify-center h-9 w-9 rounded-md border border-border text-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors disabled:opacity-50'
															title='Delete Document'
														>
															<Trash2 className='h-4 w-4' />
														</button>
													)}
												</div>
											</div>
										)
									})}
								</div>
							)}
						</motion.div>
					) : (
						<motion.div
							key='chat-view'
							initial={{ opacity: 0, scale: 0.995 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.995 }}
							transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
							className='w-full flex-1 flex flex-col justify-between h-full relative bg-muted/10'
						>
							{/* Scrollable Conversation Content */}
							<div className='flex-1 overflow-y-auto thin-scrollbar min-h-0 w-full'>
								<DashboardAIChat
									messages={mappedChatMessages}
									isThinking={isStreaming}
									userDisplayName={(user as any)?.displayName || user?.email || 'User'}
									documents={documents}
								/>
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
								/* Horizontal glowing neon line on the absolute bottom border */
								.glow-chat-divider:before {
									bottom: 0;
									left: 0;
									width: 100%;
									height: 2px;
									z-index: 30;
								}
								/* Ultra-smooth ambient blur shadow projecting UPWARDS */
								.glow-chat-divider:after {
									bottom: 0;
									left: 0;
									width: 100%;
									height: 120px;
									filter: blur(24px);
									z-index: -1;
									-webkit-mask-image: linear-gradient(
										to top,
										rgba(0,0,0,1) 0%,
										rgba(0,0,0,0.85) 15%,
										rgba(0,0,0,0.6) 35%,
										rgba(0,0,0,0.3) 60%,
										rgba(0,0,0,0.1) 80%,
										rgba(0,0,0,0) 100%
									);
									mask-image: linear-gradient(
										to top,
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
							{/* Bottom Fixed Sticky Prompt Area inside Chat Mode */}
							<div
								className={`sticky bottom-0 left-0 right-0 w-full pt-4 pb-6 bg-gradient-to-t from-background via-background/98 to-transparent z-20 glow-chat-divider ${
									aiStatus === 'streaming' || aiStatus === 'submitted' ? 'is-ai-thinking' : ''
								}`}
							>
								<div className='max-w-5xl mx-auto w-full px-4'>
									<AISearchPrompt
										onSearchChange={setSearchQuery}
										onSearchSubmit={handleAIPromptSubmit}
										status={aiStatus}
										documents={documents}
										placeholder='Ask PaperNest AI anything else...'
										onStop={handleAIStop}
									/>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</main>

			<ConfirmDialog
				isOpen={deleteConfirm !== null}
				onClose={() => setDeleteConfirm(null)}
				onConfirm={() => deleteConfirm && handleDeleteDocument(deleteConfirm)}
				title='Delete Document'
				message='Are you sure you want to delete this document? This action cannot be undone.'
				confirmText='Delete'
				variant='danger'
			/>
		</>
	)
}
