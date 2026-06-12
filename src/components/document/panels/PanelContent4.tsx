'use client'

import { Calendar, ChevronRight, MessageSquare } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import type React from 'react'
import { ReviewStatusBadge } from '@/components/review/ReviewStatusBadge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDocumentReviews } from '@/lib/api/hooks/use-documents'
import type { Review } from '@/lib/api/types/review.types'
import { format, id } from '@/lib/date'
import { getAvatarUrl, getInitials } from '@/lib/utils'

interface PanelContent4Props {
	documentId?: string | null
}

const PanelContent4: React.FC<PanelContent4Props> = ({ documentId }) => {
	const params = useParams()
	const router = useRouter()
	const workspaceId = params.workspaceid as string

	const { data: reviewsResponse, isLoading } = useDocumentReviews(documentId || '')

	const reviews = Array.isArray(reviewsResponse)
		? (reviewsResponse as Review[])
		: (reviewsResponse as { reviews: Review[] })?.reviews || []

	if (isLoading) {
		return (
			<div className='p-4 space-y-4 bg-background'>
				{[1, 2, 3].map((n) => (
					<Card key={n} className='p-4 space-y-3 border border-border shadow-sm bg-card'>
						<div className='flex items-center justify-between'>
							<Skeleton className='h-4 w-12 rounded' />
							<Skeleton className='h-5 w-20 rounded-full' />
						</div>
						<div className='flex items-center gap-2'>
							<Skeleton className='h-6 w-6 rounded-full' />
							<Skeleton className='h-3 w-24 rounded' />
						</div>
						<Skeleton className='h-8 w-full rounded' />
					</Card>
				))}
			</div>
		)
	}

	if (!documentId || reviews.length === 0) {
		return (
			<div className='flex flex-col items-center justify-center gap-4 p-8 text-muted-foreground min-h-[300px] bg-background'>
				<MessageSquare className='h-12 w-12 text-muted' />
				<div className='text-center space-y-1.5'>
					<p className='font-semibold text-sm text-foreground'>No Reviews Yet</p>
					<p className='text-xs text-muted-foreground max-w-[200px] mx-auto leading-normal'>
						This document has not been submitted for review yet.
					</p>
				</div>
			</div>
		)
	}

	return (
		<div className='p-4 space-y-3.5 text-foreground bg-background'>
			<div className='flex items-center justify-between text-xs text-muted-foreground font-semibold uppercase tracking-wider px-1 pb-1'>
				<span>Submission History</span>
				<span>{reviews.length} Submissions</span>
			</div>

			<div className='space-y-3'>
				{reviews.map((review) => {
					const studentName = review.student?.name || 'Student'
					const formattedDate = format(
						review.requestedAt ? new Date(review.requestedAt) : new Date(),
						'd MMMM yyyy'
					)

					return (
						<Card
							key={review.reviewId}
							onClick={() => router.push(`/${workspaceId}/reviews/${review.reviewId}`)}
							className='group p-4 border border-border shadow-sm bg-card hover:border-teal-500/50 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col gap-3 rounded-xl relative overflow-hidden text-foreground'
						>
							{/* Top badge line */}
							<div className='flex items-center justify-between gap-2'>
								<span className='text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20'>
									V{review.versionNumber || '?'}
								</span>
								<ReviewStatusBadge status={review.status} className='scale-90 origin-right' />
							</div>

							{/* Student requester info */}
							<div className='flex items-center gap-2'>
								<Avatar className='h-5 w-5'>
									<AvatarImage
										src={
											review.student?.photoURL || getAvatarUrl(studentName, review.studentUserId)
										}
									/>
									<AvatarFallback className='text-[9px] font-bold bg-primary/10 text-primary'>
										{getInitials(studentName)}
									</AvatarFallback>
								</Avatar>
								<span className='text-xs font-bold text-foreground truncate max-w-[150px]'>
									{studentName}
								</span>
							</div>

							{/* Message Preview */}
							{review.message && (
								<p className='text-xs text-muted-foreground italic line-clamp-2 leading-relaxed bg-muted/30 p-2 rounded-lg border border-border'>
									"{review.message}"
								</p>
							)}

							{/* Date & Action footer */}
							<div className='flex items-center justify-between border-t border-border pt-2.5 mt-0.5'>
								<div className='flex items-center gap-1 text-[10px] text-muted-foreground font-medium'>
									<Calendar className='w-3 h-3' />
									<span>{formattedDate}</span>
								</div>
								<div className='flex items-center gap-0.5 text-[10px] font-bold text-teal-600 dark:text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
									<span>Details</span>
									<ChevronRight className='w-3 h-3' />
								</div>
							</div>
						</Card>
					)
				})}
			</div>
		</div>
	)
}

export default PanelContent4
