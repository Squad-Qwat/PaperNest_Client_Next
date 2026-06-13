import { ChevronLeft, FileText, Loader2, MoreVertical } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ReviewRequestModal } from '@/components/review/ReviewRequestModal'
import { ReviewStatusBadge } from '@/components/review/ReviewStatusBadge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/context/AuthContext'
import { useCompilePdf } from '@/hooks/editor/use-compile-pdf'
import { useDocumentFiles } from '@/lib/api/hooks/use-document-files'
import {
	useCreateReview,
	useDocumentReviews,
	useDocumentVersions,
	useRevertVersion,
} from '@/lib/api/hooks/use-documents'
import { useWorkspace, useWorkspaceMembers } from '@/lib/api/hooks/use-workspaces'
import type { Version } from '@/lib/api/types/document.types'
import type { Review } from '@/lib/api/types/review.types'
import { format, id } from '@/lib/date'

interface ModalVersionsProps {
	isOpen: boolean
	onClose: () => void
	documentId: string
	onVersionRestored?: () => void
}

export default function ModalVersions({
	isOpen,
	onClose,
	documentId: propDocumentId,
	onVersionRestored,
}: ModalVersionsProps) {
	const params = useParams()
	// Prioritize prop, fallback to param (users note: "dapatkan param documentid saja")
	// But since we fixed the parent passing it, prop should work.
	// However, user specifically asked to "try getting param documentid only".
	// So let's extract it from params if prop is missing OR to be safe.
	// Actually, let's trust the prop if passed, but if not, use param.
	const documentId = propDocumentId || (params?.documentid as string)
	const workspaceId = params?.workspaceid as string

	const { user } = useAuth()
	const { data: workspace } = useWorkspace(workspaceId)
	const isEditorOrOwner = workspace?.userRole === 'owner' || workspace?.userRole === 'editor'
	const t = useTranslations('VersionModal')

	const { data: versionsResponse, isLoading: versionsLoading } = useDocumentVersions(documentId)
	const versions: Version[] = useMemo(() => {
		if (versionsResponse && Array.isArray((versionsResponse as any).versions)) {
			return (versionsResponse as any).versions
		}
		if (Array.isArray(versionsResponse)) {
			return versionsResponse as Version[]
		}
		return []
	}, [versionsResponse])

	const { data: reviewsResponse } = useDocumentReviews(documentId)
	const reviews: Review[] = useMemo(() => {
		if (reviewsResponse && Array.isArray((reviewsResponse as any).reviews)) {
			return (reviewsResponse as any).reviews
		}
		if (Array.isArray(reviewsResponse)) {
			return reviewsResponse as Review[]
		}
		return []
	}, [reviewsResponse])

	const { mutateAsync: revertVersionMutate, isPending: isRollingBack } = useRevertVersion()
	const { mutateAsync: requestReviewMutate } = useCreateReview()
	const { data: files = [] } = useDocumentFiles(documentId)
	const { data: membersResponse } = useWorkspaceMembers(workspaceId)
	const members = membersResponse?.members || []

	const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
	const [showReviewModal, setShowReviewModal] = useState(false)

	const { pdfUrl, isCompiling, compileError, handleCompile } = useCompilePdf(documentId, files)

	// const { toast } = useToast()

	// Set initial selected version to latest when data loads
	React.useEffect(() => {
		if (versions.length > 0 && !selectedVersionId) {
			setSelectedVersionId(versions[0].documentBodyId)
		}
	}, [versions, selectedVersionId])

	// Merge Version and Review Data
	const versionsList = useMemo(() => {
		return versions.map((version) => {
			// Find review for this version
			const versionReview = reviews.find((r) => r.documentBodyId === version.documentBodyId)

			// Resolve Author Name
			const member = members.find(
				(m: any) => m.userId === version.userId || m.user?.userId === version.userId
			)
			let authorName = version.user?.name || member?.user?.name || version.createdBy

			if (user && (authorName === user.userId || !authorName)) {
				authorName = user.name || t('unknown')
			}

			// If it's still a UID, show t('unknown')
			const isUid = authorName && authorName.length > 20 && !authorName.includes(' ')
			const finalName = isUid ? t('unknown') : authorName || t('unknown')

			// Map to UI format
			return {
				id: version.documentBodyId,
				versionNumber: version.versionNumber,
				timestamp: format(version.createdAt, 'd MMMM yyyy, HH:mm', { locale: id }),
				author: finalName,
				authorId: version.userId,
				authorPhoto: version.user?.photoURL || member?.user?.photoURL,
				color: version.isCurrentVersion === true ? 'bg-purple-500' : 'bg-orange-500',
				isCurrent: version.isCurrentVersion === true,
				content: version.content,
				review: versionReview
					? {
							reviewer: {
								name: versionReview.lecturerUserId || 'Lecturer', // Use ID if no name
								avatarUrl: undefined,
							},
							date: format(versionReview.requestedAt, 'd MMMM yyyy, HH:mm', {
								locale: id,
							}),
							status: versionReview.status,
							content: versionReview.message,
						}
					: undefined,
			}
		})
	}, [versions, reviews, user, members, t])

	// Compile when version selection changes
	useEffect(() => {
		const version = versionsList.find((v) => v.id === selectedVersionId)
		if (isOpen && version?.content) {
			handleCompile(version.content)
		}
	}, [selectedVersionId, isOpen, handleCompile, versionsList])

	const selectedVersion = versionsList.find((v) => v.id === selectedVersionId)

	const handleRollback = async () => {
		if (!selectedVersion) return

		try {
			await revertVersionMutate({ documentId, versionNumber: selectedVersion.versionNumber })
			if (onVersionRestored) {
				onVersionRestored()
			}
			onClose() // Close modal on success
			toast.success('Version restored', {
				description: 'The document has been restored to the selected version.',
			})
		} catch (error: any) {
			console.error('Rollback failed:', error)
			toast.error('Failed to restore version', {
				description: error.message || 'An error occurred while restoring the version.',
			})
		}
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			size='full'
			showCloseButton={false}
			title='Version history'
			visuallyHiddenTitle={true}
		>
			<div className='flex flex-col h-screen w-full bg-background'>
				<div className='h-20 border-b border-border flex items-center justify-between px-3'>
					<div className='flex items-center gap-4'>
						<Button
							type='button'
							variant='ghost'
							onClick={onClose}
							className='p-2 hover:bg-accent rounded-lg transition-colors group'
							title={t('back')}
						>
							<ChevronLeft className='h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors' />
						</Button>
						<div className='flex flex-col'>
							<span className='text-xl font-medium text-foreground'>{t('versionHistory')}</span>
							<span className='text-md text-muted-foreground'>
								{selectedVersion
									? selectedVersion.timestamp
									: versionsLoading
										? t('loading')
										: t('noVersionSelected')}
							</span>
						</div>
					</div>

					<div className='flex items-center gap-2'></div>
				</div>

				<div className='flex-1 flex overflow-hidden h-full'>
					<div className='flex-1 bg-muted/30 relative h-full flex flex-col min-w-0'>
						<ScrollArea className='h-full w-full'>
							<div className='flex flex-col items-center p-8 min-h-full gap-6'>
								{selectedVersion?.review && (
									<div className='w-[816px] bg-card rounded-xl border border-border shadow-sm overflow-hidden shrink-0'>
										<div className='p-4 border-b border-border flex items-center justify-between bg-muted/50'>
											<div className='flex items-center gap-3'>
												<Avatar className='h-8 w-8 border border-border'>
													<AvatarImage src={selectedVersion.review.reviewer.avatarUrl} />
													<AvatarFallback className='text-xs bg-blue-50 text-blue-600 font-medium'>
														L
													</AvatarFallback>
												</Avatar>
												<div className='flex flex-col'>
													<span className='text-sm font-medium text-foreground'>
														{selectedVersion.review.reviewer.name}
													</span>
													<span className='text-xs text-muted-foreground'>
														{t('reviewedOn', { date: selectedVersion.review.date })}
													</span>
												</div>
											</div>
											<ReviewStatusBadge status={selectedVersion.review.status} />
										</div>
										{selectedVersion.review.content && (
											<div className='p-4 text-sm text-foreground leading-relaxed bg-card'>
												{selectedVersion.review.content}
											</div>
										)}
									</div>
								)}

								<div className='bg-muted/50 shadow-sm w-[816px] aspect-[1/1.414] border border-border shrink-0 flex items-center justify-center relative overflow-hidden'>
									{isCompiling ? (
										<div className='flex flex-col items-center gap-3 text-muted-foreground'>
											<Loader2 className='w-10 h-10 animate-spin opacity-50' />
											<span className='text-sm font-medium'>{t('preparingPdf')}</span>
										</div>
									) : pdfUrl ? (
										<iframe
											src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
											className='w-full min-h-full border-none'
											title='PDF Preview'
											suppressHydrationWarning
										/>
									) : compileError ? (
										<div className='flex flex-col items-center gap-3 p-8 text-center'>
											<FileText className='w-12 h-12 text-red-200' />
											<div className='space-y-1'>
												<p className='text-sm font-medium text-red-600'>{t('failedPreview')}</p>
												<p className='text-xs text-muted-foreground max-w-xs line-clamp-3'>
													{compileError}
												</p>
											</div>
											<Button
												variant='outline'
												size='sm'
												onClick={() =>
													selectedVersion?.content && handleCompile(selectedVersion.content)
												}
											>
												{t('tryAgain')}
											</Button>
										</div>
									) : (
										<div className='flex flex-col items-center gap-2 text-muted-foreground'>
											<FileText className='w-10 h-10 opacity-20' />
											<p className='text-sm italic'>{t('selectVersionToView')}</p>
										</div>
									)}
								</div>
							</div>
						</ScrollArea>
					</div>

					<div className='w-80 bg-card border-l border-border shadow-sm flex flex-col shrink-0 z-10'>
						<div className='p-4 border-b border-border flex items-center justify-between'>
							<h3 className='font-medium text-foreground'>{t('versionHistory')}</h3>
						</div>

						<ScrollArea className='flex-1'>
							<div className='py-2'>
								<div className='px-4 py-2 text-xs font-medium text-muted-foreground'>
									{versionsLoading ? t('loading') : t('documentVersions')}
								</div>

								{versionsList.map((version) => (
									<button
										type='button'
										key={version.id}
										onClick={() => setSelectedVersionId(version.id)}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												setSelectedVersionId(version.id)
											}
										}}
										className={`w-full text-left px-4 py-3 cursor-pointer group transition-colors relative block ${
											selectedVersionId === version.id
												? 'bg-accent text-accent-foreground'
												: 'hover:bg-muted'
										}`}
									>
										<div className='flex items-start justify-between'>
											<div>
												<div className='text-sm font-medium text-foreground mb-1'>
													{version.timestamp}
												</div>
												<div className='flex items-center gap-2'>
													<div className={`w-2 h-2 rounded-full ${version.color}`} />
													<span className='text-xs text-muted-foreground'>
														{version.author || 'Unknown'}
													</span>
												</div>
											</div>
											<Button
												variant='ghost'
												size='icon'
												className='h-6 w-6 opacity-0 group-hover:opacity-100'
											>
												<MoreVertical className='h-4 w-4' />
											</Button>
										</div>
									</button>
								))}
							</div>
						</ScrollArea>

						<div className='p-4 border-t border-border space-y-3'>
							{selectedVersion?.isCurrent ? (
								<div className='text-center text-sm text-muted-foreground py-2'>
									{t('currentVersion')}
								</div>
							) : (
								isEditorOrOwner && (
									<Button className='w-full' onClick={handleRollback} disabled={isRollingBack}>
										{isRollingBack ? t('restoring') : t('restoreVersion')}
									</Button>
								)
							)}

							{/* Student Request Review Button */}
							{user?.role === 'Student' &&
								isEditorOrOwner &&
								selectedVersion &&
								!selectedVersion.review && (
									<Button
										className='w-full'
										variant='outline'
										onClick={() => setShowReviewModal(true)}
									>
										{t('requestReview')}
									</Button>
								)}
						</div>
					</div>
				</div>
			</div>

			<ReviewRequestModal
				isOpen={showReviewModal}
				onClose={() => setShowReviewModal(false)}
				onSubmit={async (data) => {
					if (!selectedVersion) return
					try {
						await requestReviewMutate({
							documentId,
							documentBodyId: selectedVersion.id,
							data: { lecturerUserId: data.lecturerId, message: data.message },
						})
						toast.success('Request Sent', {
							description: 'Your review request has been sent to the lecturer.',
						})
						setShowReviewModal(false)
					} catch (e: any) {
						console.error('Review request failed', e)
						throw e
					}
				}}
			/>
		</Modal>
	)
}
