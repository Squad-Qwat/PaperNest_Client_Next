'use client'

import { Search } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { ReviewCard } from '@/components/review/ReviewCard'
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/context/AuthContext'
import { useWorkspace } from '@/lib/api/hooks/use-workspaces'
import { documentsService } from '@/lib/api/services/documents.service'
import type { Document } from '@/lib/api/types/document.types'
import type { Review } from '@/lib/api/types/review.types'
import { format, id } from '@/lib/date'

const normalizeReviewStatus = (status?: string) =>
	(status || '').toLowerCase().replace(/\s+/g, '_')

const toReviews = (response: unknown): Review[] => {
	if (Array.isArray(response)) return response as Review[]
	if (response && Array.isArray((response as { reviews?: Review[] }).reviews)) {
		return (response as { reviews: Review[] }).reviews
	}
	return []
}

const mergeReviews = (...reviewGroups: Review[][]) => {
	const byId = new Map<string, Review>()

	for (const review of reviewGroups.flat()) {
		if (review?.reviewId) {
			byId.set(review.reviewId, review)
		}
	}

	return Array.from(byId.values())
}

export default function ReviewsPage() {
	const params = useParams()
	const router = useRouter()
	const { user } = useAuth()
	const workspaceId = params.workspaceid as string
	const { data: workspace } = useWorkspace(workspaceId)

	const [reviews, setReviews] = useState<Review[]>([])
	const [documents, setDocuments] = useState<Document[]>([])
	const [loading, setLoading] = useState(true)

	// Filters
	const [docFilter, setDocFilter] = useState<string>('all')
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState<string>('all')
	const [sortOrder, setSortOrder] = useState<string>('newest')

	useEffect(() => {
		const fetchData = async () => {
			if (!user || !workspaceId) {
				setLoading(false)
				return
			}

			try {
				setLoading(true)

				// Fetch Documents for titles and filter
				const docsRes = await documentsService.getWorkspaceDocuments(workspaceId)
				const workspaceDocuments = docsRes.documents || []
				setDocuments(workspaceDocuments)

				// Role endpoints can be scoped to pending/student views only. Fetching per-document
				// reviews keeps the list visible after status changes and aligned with the document filter.
				const roleReviewsRequest =
					user.role?.toLowerCase() === 'student'
						? documentsService.getStudentReviews()
						: documentsService.getPendingReviews()

				const [roleReviewsRes, documentReviewResults] = await Promise.all([
					roleReviewsRequest,
					Promise.allSettled(
						workspaceDocuments.map((doc) => documentsService.getReviews(doc.documentId))
					),
				])

				const documentReviews = documentReviewResults.flatMap((result) =>
					result.status === 'fulfilled' ? toReviews(result.value) : []
				)

				setReviews(mergeReviews(toReviews(roleReviewsRes), documentReviews))
			} catch (error) {
				console.error('Failed to fetch data:', error)
			} finally {
				setLoading(false)
			}
		}

		fetchData()
	}, [user, workspaceId])

	// Derive visible reviews
	const filteredReviews = reviews
		.filter((review) => {
			// Document Filter
			if (docFilter !== 'all' && review.documentId !== docFilter) return false

			// Status Filter
			if (statusFilter !== 'all') {
				if (normalizeReviewStatus(review.status) !== statusFilter) return false
			}

			// Search Query (Title or Message)
			if (searchQuery) {
				const doc = documents.find((d) => d.documentId === review.documentId)
				const title = doc?.title?.toLowerCase() || ''
				const msg = review.message?.toLowerCase() || ''
				const query = searchQuery.toLowerCase()
				return title.includes(query) || msg.includes(query)
			}

			return true
		})
		.sort((a, b) => {
			const dateA = new Date(a.requestedAt).getTime()
			const dateB = new Date(b.requestedAt).getTime()
			return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
		})

	const getDocTitle = (docId: string) => {
		return documents.find((d) => d.documentId === docId)?.title || 'Untitled Document'
	}

	return (
		<SidebarProvider>
			<AppSidebar/>
			<SidebarInset className='flex flex-col min-h-0 overflow-hidden border border-gray-200/50 transition-all duration-300 isolate rounded-2xl m-2'>
				<header className='flex h-16 shrink-0 items-center gap-2 px-4 bg-white border-b sticky top-0 z-30 rounded-t-2xl'>
					<SidebarTrigger className='-ml-1' />
					<Separator orientation='vertical' className='mr-2 h-4' />
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem className='hidden md:block'>
								<BreadcrumbLink href='#'>PaperNest</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className='hidden md:block' />
							<BreadcrumbItem>
								<BreadcrumbLink href={`/${workspaceId}`}>{workspace?.title}</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className='hidden md:block' />
							<BreadcrumbItem>
								<BreadcrumbPage>Reviews</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</header>

				<main className='flex-1 p-6 w-full overflow-y-auto'>
					<div className='mb-8 flex items-center justify-between'>
						<div>
							<h2 className='text-2xl font-bold text-gray-900'>Reviews</h2>
							<p className='text-sm text-gray-500 mt-1'>
								Kelola review Anda di workspace <b>{workspace?.title}</b>
							</p>
						</div>
					</div>

					{/* Filters Row */}
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8'>
						{/* Document Filter */}
						<div>
							<Select value={docFilter} onValueChange={setDocFilter}>
								<SelectTrigger className='bg-white'>
									<SelectValue placeholder='Semua Dokumen' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='all'>Semua Dokumen</SelectItem>
									{documents.map((doc) => (
										<SelectItem key={doc.documentId} value={doc.documentId}>
											{doc.title}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Search */}
						<div className='lg:col-span-2 relative'>
							<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
							<Input
								placeholder='Cari review...'
								className='pl-9 bg-white'
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>

						{/* Status Filter */}
						<div>
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className='bg-white'>
									<SelectValue placeholder='Semua Status' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='all'>Semua Status</SelectItem>
									<SelectItem value='pending'>Pending</SelectItem>
									<SelectItem value='approved'>Approved</SelectItem>
									<SelectItem value='revision_required'>Revision Required</SelectItem>
									<SelectItem value='rejected'>Rejected</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Sort */}
						<div>
							<Select value={sortOrder} onValueChange={setSortOrder}>
								<SelectTrigger className='bg-white'>
									<SelectValue placeholder='Sort Order' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='newest'>Newest First</SelectItem>
									<SelectItem value='oldest'>Oldest First</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* List Header */}
					<h2 className='text-lg font-bold text-gray-900 mb-4'>
						Semua Review ({filteredReviews.length})
					</h2>

					{/* Reviews List */}
					{loading ? (
						<div className='grid gap-4'>
							{[1, 2, 3, 4, 5].map((i) => (
								<Skeleton key={`review-skeleton-item-${i}`} className='h-24 rounded-lg' />
							))}
						</div>
					) : filteredReviews.length === 0 ? (
						<div className='text-center py-16 bg-white rounded-lg border border-dashed border-gray-300'>
							<div className='inline-flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4'>
								<svg
									className='h-6 w-6 text-gray-400'
									fill='none'
									stroke='currentColor'
									viewBox='0 0 24 24'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
									/>
								</svg>
							</div>
							<p className='text-gray-600 font-medium mb-1'>No reviews found</p>
							<p className='text-gray-500 text-sm'>Try adjusting your search or filter criteria</p>
						</div>
					) : (
						<div className='grid gap-4'>
							{filteredReviews.map((review, index) => (
								<ReviewCard
									key={review.reviewId}
									reviewId={review.reviewId}
									documentId={review.documentId}
									documentBodyId={review.documentBodyId || review.documentId}
									lecturerUserId={review.lecturerUserId || 'Unknown Reviewer'}
									message={review.message}
									status={review.status}
									date={format(review.requestedAt, 'd MMMM yyyy', { locale: id })}
									title={getDocTitle(review.documentId)}
									workspaceId={workspaceId}
									isLatest={index === 0 && sortOrder === 'newest'}
									onAddReview={
										user?.role === 'Student'
											? () => {
												router.push(`/${workspaceId}/documents/${review.documentId}`)
											}
											: undefined
									}
									onReviewUpdate={(newStatus, newMessage) => {
										setReviews((prev) =>
											prev.map((r) =>
												r.reviewId === review.reviewId
													? {
														...r,
														status: newStatus as Review['status'],
														message: newMessage || r.message,
													}
													: r
											)
										)
									}}
								/>
							))}
						</div>
					)}
				</main>
			</SidebarInset>
		</SidebarProvider>
	)
}
