'use client'

import { ChevronLeft, Loader2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ReviewStatusBadge } from '@/components/review/ReviewStatusBadge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/AuthContext'
import { useCompilePdf } from '@/hooks/editor/use-compile-pdf'
import { useDocumentFiles } from '@/lib/api/hooks/use-document-files'
import {
	useDocument,
	useDocumentVersions,
	useReviewDetail,
	useUpdateReviewStatus,
} from '@/lib/api/hooks/use-documents'
import { useWorkspace, useWorkspaceMembers } from '@/lib/api/hooks/use-workspaces'
import type { Document, Version } from '@/lib/api/types/document.types'
import type { Review } from '@/lib/api/types/review.types'
import { format, id } from '@/lib/date'
import { getAvatarUrl, getInitials, getMediaUrl } from '@/lib/utils'

export default function ReviewDetailPage() {
	const params = useParams()
	const router = useRouter()
	const { workspaceid, reviewId } = params
	const workspaceId = workspaceid as string

	const { user, loading: authLoading } = useAuth()
	useWorkspace(workspaceId)
	const { data: membersRes } = useWorkspaceMembers(workspaceId)
	const { data: reviewRes, isLoading: reviewLoading } = useReviewDetail(reviewId as string)
	const reviewData = reviewRes as Review

	const documentId = reviewData?.documentId || ''
	const documentBodyId = reviewData?.documentBodyId || ''

	const { data: documentRes } = useDocument(workspaceId, documentId)
	const document = (documentRes as Document) || null

	const { data: versionsResponse, isLoading: versionsLoading } = useDocumentVersions(documentId)
	const { data: files = [] } = useDocumentFiles(documentId)

	const { mutateAsync: updateStatus, isPending: isUpdating } = useUpdateReviewStatus()

	// PDF Compilation State using hook
	const { pdfUrl, isCompiling, compileError, handleCompile } = useCompilePdf(documentId, files)

	// Feedback Modal State
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [decision, setDecision] = useState<'approved' | 'rejected' | 'revision_required'>(
		'approved'
	)
	const [feedback, setFeedback] = useState('')

	// Derived data
	const members = membersRes?.members || []
	const studentMember = reviewData
		? members.find(
				(m: any) =>
					m.userId === reviewData.studentUserId || m.user?.userId === reviewData.studentUserId
			)
		: null
	const lecturerMember = reviewData
		? members.find(
				(m: any) =>
					m.userId === reviewData.lecturerUserId || m.user?.userId === reviewData.lecturerUserId
			)
		: null

	const studentName = reviewData?.student?.name || studentMember?.user?.name || 'Student'
	const lecturerName = reviewData?.lecturer?.name || lecturerMember?.user?.name || 'Reviewer'
	const isDocumentDeleted = !documentRes && !reviewLoading && !!reviewData
	const docTitle = document?.title || 'Document'
	const formattedDate = format(
		reviewData?.requestedAt ? new Date(reviewData.requestedAt) : new Date(),
		'd MMMM yyyy, HH:mm',
		{ locale: id }
	)

	const versions = Array.isArray(versionsResponse)
		? (versionsResponse as Version[])
		: (versionsResponse as { versions: Version[] })?.versions || []

	const version = versions.find((v: Version) => v.documentBodyId === documentBodyId)

	useEffect(() => {
		if (version?.content && !pdfUrl && !isCompiling && !compileError) {
			handleCompile(version.content)
		}
	}, [version?.content, handleCompile, pdfUrl, isCompiling, compileError])

	const handleAction = async () => {
		if (!reviewId) return

		try {
			await updateStatus({
				reviewId: reviewId as string,
				data: { status: decision, message: feedback },
			})
			toast.success(`Review decision (${decision.replace('_', ' ')}) successfully sent`)
			setIsModalOpen(false)
			setFeedback('')
		} catch (error: any) {
			toast.error(error.message || 'Failed to update review status')
		}
	}

	const openDecisionModal = (type: 'approved' | 'rejected' | 'revision_required') => {
		setDecision(type)
		setFeedback('')
		setIsModalOpen(true)
	}

	const handleBack = () => {
		if (typeof window !== 'undefined' && window.history.length > 1) {
			router.back()
		} else {
			router.push(`/${workspaceId}/reviews`)
		}
	}

	if (authLoading || reviewLoading || (documentId && versionsLoading)) {
		return (
			<div className='h-screen flex flex-col font-sans bg-background text-foreground animate-pulse'>
				{/* Header Skeleton */}
				<header className='bg-background border-b sticky top-0 z-50 py-4'>
					<div className='w-full px-4 md:px-6 flex items-center justify-between'>
						<div className='flex items-center gap-4'>
							<Skeleton className='h-10 w-10 rounded-lg' />
							<div className='flex flex-col gap-2'>
								<Skeleton className='h-4 w-40' />
								<Skeleton className='h-3 w-60' />
							</div>
						</div>
						<div className='flex items-center gap-3'>
							<Skeleton className='h-6 w-20 rounded-full' />
						</div>
					</div>
				</header>

				{/* Main Layout Skeleton */}
				<main className='flex-1 flex flex-col lg:flex-row overflow-hidden p-4 md:p-6 gap-6'>
					{/* Left side: PDF Compiler/Preview Box */}
					<div className='flex-1 bg-background rounded-lg border flex items-center justify-center relative overflow-hidden p-4'>
						<Skeleton className='w-full h-full rounded-lg' />
					</div>

					{/* Right side: Review Sidebar Details */}
					<div className='w-full lg:w-96 flex flex-col shrink-0 gap-6 overflow-y-auto'>
						{/* Card 1: Student Requester Info & Message */}
						<Card className='p-5 space-y-4 rounded-2xl border-gray-200/60 shadow-sm bg-white'>
							<div className='flex items-center gap-3 border-b border-gray-100 pb-3'>
								<Skeleton className='h-9 w-9 rounded-full' />
								<div className='flex-1 min-w-0 space-y-2'>
									<Skeleton className='h-4.5 w-32' />
									<Skeleton className='h-3 w-24' />
								</div>
							</div>
							<div className='space-y-2'>
								<Skeleton className='h-3 w-16' />
								<Skeleton className='h-16 w-full rounded-lg' />
							</div>
						</Card>

						{/* Card 2: Decision Box / Status */}
						<Card className='p-5 space-y-4 rounded-2xl border-gray-200/60 shadow-sm bg-white'>
							<div className='border-b border-gray-100 pb-3'>
								<Skeleton className='h-4 w-36' />
							</div>
							<div className='grid grid-cols-1 gap-2.5'>
								<Skeleton className='h-10 w-full rounded-md' />
								<Skeleton className='h-10 w-full rounded-md' />
								<Skeleton className='h-10 w-full rounded-md' />
							</div>
						</Card>

						{/* Card 3: Document Information Card */}
						<Card className='p-5 rounded-2xl border-gray-200/60 shadow-sm bg-white space-y-4'>
							<div className='border-b border-gray-100 pb-3'>
								<Skeleton className='h-4 w-40' />
							</div>
							<div className='space-y-3'>
								<div className='flex items-center justify-between'>
									<Skeleton className='h-4 w-24' />
									<Skeleton className='h-4 w-20' />
								</div>
								<Separator className='opacity-50' />
								<div className='flex items-center justify-between'>
									<Skeleton className='h-4 w-12' />
									<Skeleton className='h-4 w-8' />
								</div>
							</div>
							<Skeleton className='h-10 w-full rounded-md mt-4' />
						</Card>
					</div>
				</main>
			</div>
		)
	}

	if (!reviewData) {
		return (
			<div className='h-screen flex flex-col items-center justify-center bg-background gap-4'>
				<h2 className='text-lg font-semibold text-foreground'>Review not found</h2>
				<Button variant='outline' onClick={handleBack}>
					Back to Review List
				</Button>
			</div>
		)
	}

	const isLecturer = user?.role === 'Lecturer' && reviewData.lecturerUserId === user?.userId
	const isPending = reviewData.status === 'pending'

	return (
		<div className='h-screen flex flex-col font-sans bg-background text-foreground'>
			<header className='bg-background border-b sticky top-0 z-50 py-4'>
				<div className='w-full px-4 md:px-6 flex items-center justify-between'>
					<div className='flex items-center gap-4'>
						<Button
							variant='ghost'
							onClick={handleBack}
							className='h-10 w-10 hover:bg-muted rounded-lg transition-all group p-0 min-w-0 shrink-0'
							title='Back to Review List'
						>
							<ChevronLeft className='h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors' />
						</Button>
						<div className='flex flex-col'>
							<h1 className='text-sm font-semibold tracking-tight line-clamp-1'>
								Review: {docTitle}
							</h1>
							<p className='text-xs text-muted-foreground'>
								Submitted by {studentName} • {formattedDate}
							</p>
						</div>
					</div>

					<div className='flex items-center gap-3'>
						<ReviewStatusBadge status={reviewData.status} />
					</div>
				</div>
			</header>

			<main className='flex-1 flex flex-col lg:flex-row overflow-hidden p-4 md:p-6 gap-6'>
				{/* Left side: PDF Compiler/Preview */}
				<div className='flex-1 bg-background rounded-lg border flex items-center justify-center relative overflow-hidden transition-all'>
					{isCompiling ? (
						<div className='flex flex-col items-center gap-4'>
							<Loader2 className='w-8 h-8 animate-spin text-muted-foreground' />
							<span className='text-sm text-muted-foreground'>Compiling Document PDF...</span>
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
							<p className='text-sm font-semibold text-destructive'>Failed to Compile PDF</p>
							<pre className='text-xs text-muted-foreground mt-4 max-w-md mx-auto overflow-auto max-h-40 bg-muted p-4 rounded-md text-left'>
								{compileError}
							</pre>
						</div>
					) : (
						<div className='flex flex-col items-center gap-2 text-center p-6'>
							<p className='text-sm text-muted-foreground'>
								The content of this document version is not available.
							</p>
						</div>
					)}
				</div>

				{/* Right side: Review Sidebar Details */}
				<div className='w-full lg:w-96 flex flex-col shrink-0 gap-6 overflow-y-auto'>
					{/* Student Requester Info & Message Card */}
					<Card className='p-5 space-y-4 rounded-2xl border-border/60 shadow-sm bg-card'>
						<div className='flex items-center gap-3 border-b border-border pb-3'>
							<Avatar className='h-9 w-9'>
								<AvatarImage
									src={
										getMediaUrl(reviewData.student?.photoURL) ||
										getAvatarUrl(studentName, reviewData.studentUserId)
									}
								/>
								<AvatarFallback className='text-xs font-bold bg-primary/10 text-primary'>
									{getInitials(studentName)}
								</AvatarFallback>
							</Avatar>
							<div className='flex-1 min-w-0'>
								<p className='text-sm font-bold text-foreground truncate'>{studentName}</p>
								<p className='text-xs text-muted-foreground font-semibold uppercase tracking-wider'>
									Review Requester
								</p>
							</div>
						</div>

						<div className='space-y-2'>
							<Label className='text-xs font-semibold text-muted-foreground uppercase tracking-wider block'>
								Message
							</Label>
							<div className='p-3 bg-muted/50 border border-border rounded-lg text-sm text-foreground leading-relaxed font-normal whitespace-pre-line'>
								{reviewData.message || 'No message provided.'}
							</div>
						</div>
					</Card>

					{/* Review Status or Actions Card */}
					{isPending && isLecturer ? (
						<Card className='p-5 space-y-4 rounded-2xl border-border/60 shadow-sm bg-card'>
							<h3 className='text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-3'>
								Determine Decision
							</h3>

							<div className='grid grid-cols-1 gap-2.5'>
								<Button
									variant='default'
									onClick={() => openDecisionModal('approved')}
									className='w-full font-semibold'
								>
									Approve
								</Button>
								<Button
									variant='secondary'
									onClick={() => openDecisionModal('revision_required')}
									className='w-full font-semibold'
								>
									Request Revision
								</Button>
								<Button
									variant='destructive'
									onClick={() => openDecisionModal('rejected')}
									className='w-full font-semibold'
								>
									Reject
								</Button>
							</div>

							<div className='p-3 bg-muted/50 rounded-lg border border-border'>
								<p className='text-xs text-muted-foreground leading-normal'>
									Please review the document in the left panel before making a decision.
								</p>
							</div>
						</Card>
					) : (
						/* Decided Review Card */
						<Card className='p-5 space-y-4 rounded-2xl border-border/60 shadow-sm bg-card'>
							<div className='flex items-center gap-3 border-b border-border pb-3'>
								<Avatar className='h-9 w-9'>
									<AvatarImage
										src={
											getMediaUrl(reviewData.lecturer?.photoURL) ||
											getAvatarUrl(lecturerName, reviewData.lecturerUserId)
										}
									/>
									<AvatarFallback className='text-xs font-bold bg-primary/10 text-primary'>
										{getInitials(lecturerName)}
									</AvatarFallback>
								</Avatar>
								<div className='flex-1 min-w-0'>
									<p className='text-sm font-bold text-foreground truncate'>{lecturerName}</p>
									<p className='text-xs text-muted-foreground font-semibold uppercase tracking-wider'>
										Reviewer
									</p>
								</div>
							</div>

							<div className='space-y-2'>
								<Label className='text-xs font-semibold text-muted-foreground uppercase tracking-wider block'>
									Feedback / Reviewer Notes
								</Label>
								{isPending ? (
									<div className='p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-600 dark:text-yellow-400'>
										<span>Awaiting response and assessment from the Reviewer.</span>
									</div>
								) : (
									<div className='p-3 bg-muted/50 border border-border rounded-lg text-sm text-foreground leading-relaxed font-normal whitespace-pre-line'>
										{reviewData.lecturerMessage || 'No additional notes.'}
									</div>
								)}
							</div>
						</Card>
					)}

					{/* Document Navigation Card */}
					<Card className='p-5 rounded-2xl border-border/60 shadow-sm bg-card space-y-4'>
						<h3 className='text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-3'>
							Document Information
						</h3>
						<div className='space-y-3'>
							<div className='flex items-center justify-between text-sm'>
								<span className='text-muted-foreground'>Document Name</span>
								<span className='font-bold text-foreground truncate max-w-[150px]'>{docTitle}</span>
							</div>
							<Separator className='opacity-50' />
							<div className='flex items-center justify-between text-sm'>
								<span className='text-muted-foreground'>Version</span>
								<span className='font-bold text-foreground'>
									V{reviewData.versionNumber || '?'}
								</span>
							</div>
						</div>

						<Button
							variant='outline'
							className='w-full mt-4 h-10 font-bold shadow-sm'
							onClick={() =>
								!isDocumentDeleted && router.push(`/${workspaceId}/documents/${documentId}`)
							}
							disabled={isDocumentDeleted}
						>
							{isDocumentDeleted ? 'Document Deleted' : 'Open in Editor'}
						</Button>
					</Card>
				</div>
			</main>

			{/* Decision Modal */}
			<Modal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				title={`Confirm Decision: ${
					decision === 'approved'
						? 'Approve'
						: decision === 'revision_required'
							? 'Request Revision'
							: 'Reject'
				}`}
			>
				<div className='space-y-4 pt-2'>
					<p className='text-sm text-muted-foreground'>
						Provide comments or additional feedback for the student regarding this decision.
					</p>

					<div className='space-y-2'>
						<Label htmlFor='decision-feedback'>Reviewer Notes</Label>
						<Textarea
							id='decision-feedback'
							placeholder='Write your feedback here (optional)...'
							value={feedback}
							onChange={(e) => setFeedback(e.target.value)}
							className='min-h-[120px] resize-none text-sm'
						/>
					</div>

					<ModalFooter className='px-0 pb-0 gap-2'>
						<Button variant='outline' onClick={() => setIsModalOpen(false)}>
							Cancel
						</Button>
						<Button
							variant={decision === 'rejected' ? 'destructive' : 'default'}
							onClick={handleAction}
							disabled={isUpdating}
							className='font-semibold'
						>
							{isUpdating ? 'Processing...' : 'Submit Decision'}
						</Button>
					</ModalFooter>
				</div>
			</Modal>
		</div>
	)
}
