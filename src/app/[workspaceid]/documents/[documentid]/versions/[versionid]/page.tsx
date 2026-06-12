'use client'

import { ChevronLeft, FileText, Loader2, MessageSquare, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ReviewStatusBadge } from '@/components/review/ReviewStatusBadge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Label } from '@/components/ui/label'
import { Modal, ModalFooter } from '@/components/ui/modal'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/AuthContext'
import { useCompilePdf } from '@/hooks/editor/use-compile-pdf'
import { useDocumentFiles } from '@/lib/api/hooks/use-document-files'
import {
	useCreateReview,
	useDocumentReviews,
	useDocumentVersions,
	useDocumentWithRoomState,
	useRevertVersion,
} from '@/lib/api/hooks/use-documents'
import { useWorkspace, useWorkspaceMembers } from '@/lib/api/hooks/use-workspaces'
import type { Version } from '@/lib/api/types/document.types'
import type { Review } from '@/lib/api/types/review.types'
import { format, id } from '@/lib/date'
import { getAvatarUrl, getInitials, getMediaUrl } from '@/lib/utils'

export default function VersionDetailPage() {
	const params = useParams()
	const router = useRouter()
	const workspaceId = params.workspaceid as string
	const documentId = params.documentid as string
	const versionId = params.versionid as string

	const [showConfirm, setShowConfirm] = useState(false)

	const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
	const [selectedLecturerId, setSelectedLecturerId] = useState('')
	const [reviewMessage, setReviewMessage] = useState('')

	const { user } = useAuth()
	const { data: membersResponse } = useWorkspaceMembers(workspaceId)
	const { data: workspace } = useWorkspace(workspaceId)
	const { mutateAsync: createReview, isPending: isCreatingReview } = useCreateReview()

	const { data: versionsResponse, isLoading: versionsLoading } = useDocumentVersions(documentId)
	const { data: documentWithRoomData, refetch: refetchRoomState } =
		useDocumentWithRoomState(documentId)
	const { data: reviewsResponse } = useDocumentReviews(documentId)
	const { data: files = [] } = useDocumentFiles(documentId)
	const { mutateAsync: revertVersion, isPending: isReverting } = useRevertVersion()

	// PDF Compilation State using hook
	const { pdfUrl, isCompiling, compileError, handleCompile } = useCompilePdf(documentId, files)

	const activeUsers = documentWithRoomData?.room?.activeUsers || 0

	const members = membersResponse?.members || []
	const lecturers = members.filter((m: any) => m.user?.role?.toLowerCase() === 'lecturer')

	useEffect(() => {
		if (lecturers.length > 0) {
			if (!selectedLecturerId) {
				setSelectedLecturerId(lecturers[0]?.user?.userId || '')
			}
		} else if (workspace?.ownerId) {
			if (!selectedLecturerId) {
				setSelectedLecturerId(workspace.ownerId)
			}
		}
	}, [lecturers, workspace, selectedLecturerId])

	const handleRequestReviewSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!selectedLecturerId) return

		try {
			await createReview({
				documentId,
				documentBodyId: versionId,
				data: {
					lecturerUserId: selectedLecturerId,
					message: reviewMessage || 'Requesting review for version',
				},
			})
			toast.success('Review request sent successfully!')
			setIsReviewModalOpen(false)
		} catch (error) {
			console.error('Failed to create review:', error)
			toast.error('Failed to send review request')
		}
	}

	const versions = Array.isArray(versionsResponse)
		? (versionsResponse as Version[])
		: (versionsResponse as { versions: Version[] })?.versions || []

	const version = versions.find((v: Version) => v.documentBodyId === versionId)
	const reviews = Array.isArray(reviewsResponse)
		? (reviewsResponse as Review[])
		: (reviewsResponse as { reviews: Review[] })?.reviews || []
	const versionReview = reviews.find((r: Review) => r.documentBodyId === versionId)

	useEffect(() => {
		if (version?.content && !pdfUrl && !isCompiling && !compileError) {
			handleCompile(version.content)
		}
	}, [version?.content, handleCompile, pdfUrl, isCompiling, compileError])

	const handleRestore = async () => {
		if (!version) return

		// Refresh room state to get latest active users count
		const { data: latestRoomData } = await refetchRoomState()
		const currentActiveUsers = latestRoomData?.room?.activeUsers || 0

		if (currentActiveUsers > 0) {
			toast.error('Unable to Restore', {
				description:
					'Active users are still in the editor. Please ensure all users have left the room before restoring.',
				duration: 5000,
			})
			return
		}

		try {
			await revertVersion({ documentId, versionNumber: version.versionNumber })
			toast.success('Version restored successfully')
			router.push(`/${workspaceId}/documents/${documentId}`)
		} catch (_e: any) {
			toast.error('Failed to restore version')
		}
	}

	if (versionsLoading) {
		return (
			<div className='h-screen flex items-center justify-center bg-background'>
				<Loader2 className='w-8 h-8 animate-spin text-muted-foreground' />
			</div>
		)
	}

	if (!version) {
		return (
			<div className='h-screen flex flex-col items-center justify-center bg-background'>
				<p className='text-muted-foreground mb-4 text-sm'>Version not found</p>
				<Button variant='outline' onClick={() => router.back()}>
					Go Back
				</Button>
			</div>
		)
	}

	return (
		<div className='h-screen flex flex-col font-sans bg-background text-foreground'>
			<header className='bg-background border-b sticky top-0 z-50 py-4'>
				<div className='w-full px-4 md:px-6 flex items-center justify-between'>
					<div className='flex items-center gap-4'>
						<Button
							variant='ghost'
							onClick={() => router.push(`/${workspaceId}/documents/${documentId}/versions`)}
							className='h-10 w-10 hover:bg-muted rounded-lg transition-all group p-0 min-w-0 shrink-0'
							title='Back to History'
						>
							<ChevronLeft className='h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors' />
						</Button>
						<div className='flex flex-col'>
							<h1 className='text-sm font-semibold tracking-tight'>
								Version Details #{String(version.versionNumber).padStart(3, '0')}
							</h1>
							<p className='text-xs text-muted-foreground'>
								{format(version.createdAt, 'd MMMM yyyy, HH:mm')}
							</p>
						</div>
					</div>

					<div className='flex items-center gap-3'>
						{versionReview ? (
							<Link href={`/${workspaceId}/reviews/${versionReview.reviewId}`}>
								<Button variant='outline' size='sm' className='gap-2'>
									<MessageSquare className='w-4 h-4' />
									<span className='hidden sm:inline'>View Review</span>
								</Button>
							</Link>
						) : (
							user?.role?.toLowerCase() === 'student' && (
								<Button
									variant='outline'
									size='sm'
									className='gap-2 bg-primary hover:bg-primary/90 text-white border-primary transition-all duration-200'
									onClick={() => setIsReviewModalOpen(true)}
								>
									<MessageSquare className='w-4 h-4' />
									<span>Submit Review</span>
								</Button>
							)
						)}
						<Button
							size='sm'
							className='gap-2'
							onClick={async () => {
								await refetchRoomState()
								setShowConfirm(true)
							}}
							disabled={isReverting}
						>
							<RotateCcw className='w-4 h-4' />
							<span className='hidden sm:inline'>
								{isReverting ? 'Restoring...' : 'Restore This Version'}
							</span>
						</Button>
					</div>
				</div>
			</header>

			<main className='flex-1 flex flex-col lg:flex-row overflow-hidden p-4 md:p-6 gap-6'>
				<div className='flex-1 bg-background rounded-lg border flex items-center justify-center relative overflow-hidden transition-all'>
					{isCompiling ? (
						<div className='flex flex-col items-center gap-4'>
							<Loader2 className='w-8 h-8 animate-spin text-muted-foreground' />
							<span className='text-sm text-muted-foreground'>Compiling PDF...</span>
						</div>
					) : pdfUrl ? (
						<iframe
							key={pdfUrl}
							src={`${pdfUrl}#toolbar=1`}
							className='w-full h-full border-none'
							title='PDF Preview'
						/>
					) : compileError ? (
						<div className='p-8 text-center'>
							<div className='w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4'>
								<FileText className='w-6 h-6 text-destructive' />
							</div>
							<p className='text-sm font-semibold text-destructive'>Compilation Failed</p>
							<pre className='text-xs text-muted-foreground mt-4 max-w-md mx-auto overflow-auto max-h-40 bg-muted p-4 rounded-md text-left'>
								{compileError}
							</pre>
						</div>
					) : null}
				</div>

				<div className='w-full lg:w-96 flex flex-col shrink-0 gap-6 overflow-y-auto'>
					<Card className='p-6 space-y-6 rounded-2xl border-border/60 shadow-sm bg-card'>
						<div className='flex items-center justify-between border-b border-border pb-4'>
							<h3 className='text-sm font-bold text-foreground uppercase tracking-wider'>
								Version Metadata
							</h3>
							<div className='px-2 py-1 bg-muted rounded text-[10px] font-bold text-muted-foreground'>
								V{version.versionNumber}
							</div>
						</div>

						<div className='space-y-6'>
							{/* Author Info */}
							<div className='flex items-center gap-3'>
								{(() => {
									const displayName =
										version.user?.name || version.user?.username || version.userId || 'User'
									return (
										<>
											<Avatar className='h-10 w-10 border-2 border-background shadow-sm'>
												<AvatarImage
													src={
														getMediaUrl(version.user?.photoURL) ||
														getAvatarUrl(displayName, version.userId)
													}
												/>
												<AvatarFallback className='bg-primary/5 text-primary text-xs font-bold'>
													{getInitials(displayName)}
												</AvatarFallback>
											</Avatar>
											<div className='flex flex-col'>
												<span className='text-sm font-bold text-foreground leading-none mb-1'>
													{displayName}
												</span>
												<div className='flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium'>
													<span className='px-1.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-sm uppercase tracking-tight'>
														Author
													</span>
													<span className='opacity-30'>•</span>
													<span>{format(version.createdAt, 'HH:mm, d MMM')}</span>
												</div>
											</div>
										</>
									)
								})()}
							</div>

							{/* Commit Message / Student Request */}
							<div className='space-y-2'>
								<div className='flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest'>
									<MessageSquare className='w-3 h-3' />
									Commit Message
								</div>
								<div className='bg-muted/50 rounded-xl p-4 border border-border'>
									<p className='text-sm text-foreground leading-relaxed italic'>
										"{version.message || 'No commit message.'}"
									</p>
								</div>
							</div>

							{/* Review Section */}
							{versionReview && (
								<div className='pt-6 border-t border-border space-y-4'>
									<div className='flex items-center justify-between'>
										<div className='text-[10px] font-bold text-muted-foreground uppercase tracking-widest'>
											Review Status
										</div>
										<ReviewStatusBadge status={versionReview.status} />
									</div>

									{versionReview.status !== 'pending' && (
										<div className='space-y-3 animate-in fade-in slide-in-from-top-2 duration-300'>
											<div className='flex items-center gap-2'>
												<div className='h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse' />
												<span className='text-[10px] font-bold text-muted-foreground uppercase tracking-tight'>
													Lecturer Feedback
												</span>
											</div>
											<div className='bg-green-500/10 rounded-xl p-4 border border-green-500/20'>
												<p className='text-sm text-foreground leading-relaxed'>
													{versionReview.lecturerMessage ||
														versionReview.message ||
														'Version approved with no additional notes.'}
												</p>
											</div>
											{versionReview.reviewedAt && (
												<p className='text-[10px] text-muted-foreground text-right'>
													Reviewed on {format(versionReview.reviewedAt, 'd MMMM yyyy')}
												</p>
											)}
										</div>
									)}
								</div>
							)}
						</div>
					</Card>
				</div>
			</main>

			<ConfirmDialog
				isOpen={showConfirm}
				onClose={() => setShowConfirm(false)}
				onConfirm={activeUsers > 0 ? () => {} : handleRestore}
				title={activeUsers > 0 ? 'Editor Currently in Use' : 'Confirm Restore'}
				message={
					activeUsers > 0
						? `There are ${activeUsers} users currently active in the editor. To maintain data integrity, all users must leave the editor before restoring.`
						: 'Are you sure you want to restore this document to the selected version? This action will overwrite any newer changes.'
				}
				confirmText={activeUsers > 0 ? 'Understand' : 'Yes, Restore'}
				cancelText={activeUsers > 0 ? undefined : 'Cancel'}
				variant={activeUsers > 0 ? 'info' : 'warning'}
			/>

			<Modal
				isOpen={isReviewModalOpen}
				onClose={() => setIsReviewModalOpen(false)}
				title='Submit Document Review'
			>
				<form onSubmit={handleRequestReviewSubmit} className='space-y-4 pt-2'>
					<p className='text-sm text-muted-foreground'>
						Choose a reviewer and add an optional message to explain your changes or focus areas.
					</p>

					<div className='space-y-2'>
						<Label htmlFor='lecturer-select'>
							Reviewer <span className='text-red-500'>*</span>
						</Label>
						<Select
							value={selectedLecturerId}
							onValueChange={(value) => setSelectedLecturerId(value)}
							required
						>
							<SelectTrigger id='lecturer-select' className='w-full bg-background border-border'>
								<SelectValue placeholder='-- Choose Reviewer --' />
							</SelectTrigger>
							<SelectContent className='z-[1025]'>
								{lecturers.map((m: any) => (
									<SelectItem key={m.user?.userId} value={m.user?.userId}>
										{m.user?.name || m.user?.username || 'Reviewer'}
									</SelectItem>
								))}
								{lecturers.length === 0 && workspace?.ownerId && (
									<SelectItem value={workspace.ownerId}>Workspace Owner (Default)</SelectItem>
								)}
							</SelectContent>
						</Select>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='review-message'>Additional Message (Optional)</Label>
						<Textarea
							id='review-message'
							placeholder='Write notes or specific instructions for the reviewer...'
							value={reviewMessage}
							onChange={(e) => setReviewMessage(e.target.value)}
							disabled={isCreatingReview}
							className='resize-none text-sm'
							rows={4}
						/>
					</div>

					<ModalFooter className='px-0 pb-0 gap-2'>
						<Button
							type='button'
							variant='outline'
							onClick={() => setIsReviewModalOpen(false)}
							disabled={isCreatingReview}
						>
							Cancel
						</Button>
						<Button
							type='submit'
							disabled={isCreatingReview || !selectedLecturerId}
							className='bg-primary text-white hover:bg-primary/90 flex items-center gap-1.5'
						>
							{isCreatingReview && <Loader2 className='w-4 h-4 animate-spin' />}
							{isCreatingReview ? 'Sending...' : 'Submit Request'}
						</Button>
					</ModalFooter>
				</form>
			</Modal>
		</div>
	)
}
