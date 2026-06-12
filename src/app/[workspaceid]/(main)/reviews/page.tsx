'use client'

import { ArrowUpDown, ClipboardCheck, FileText } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { ReviewContentSkeleton } from '@/components/layout/DashboardSkeleton'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { ReviewCard } from '@/components/review/ReviewCard'
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { SearchInput } from '@/components/ui/search-input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useAuth } from '@/context/AuthContext'
import {
	useLecturerPendingReviews,
	useStudentReviews,
	useWorkspaceDocuments,
} from '@/lib/api/hooks/use-documents'
import { useWorkspace } from '@/lib/api/hooks/use-workspaces'
import type { Document, DocumentsResponse } from '@/lib/api/types/document.types'
import type { ReviewsResponse } from '@/lib/api/types/review.types'

export default function ReviewsPage() {
	const params = useParams()
	const _router = useRouter()
	const { user, loading: authLoading } = useAuth()
	const workspaceId = params.workspaceid as string

	const { data: workspace } = useWorkspace(workspaceId)
	const isStudent = user?.role?.toLowerCase() === 'student'
	const hasUser = !!user

	const { data: studentReviewsRes, isLoading: studentLoading } = useStudentReviews(
		hasUser && isStudent
	)
	const { data: lecturerReviewsRes, isLoading: lecturerLoading } = useLecturerPendingReviews(
		hasUser && !isStudent
	)
	const { data: docsRes, isLoading: docsLoading } = useWorkspaceDocuments(workspaceId)

	const reviews =
		(isStudent
			? (studentReviewsRes as ReviewsResponse)?.reviews
			: (lecturerReviewsRes as ReviewsResponse)?.reviews) || []
	const documents = (docsRes as DocumentsResponse)?.documents || []
	const isLoading = studentLoading || lecturerLoading || docsLoading

	const [docFilter, setDocFilter] = useState<string>('all')
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState<string>('all')
	const [sortOrder, setSortOrder] = useState<string>('newest')

	const filteredReviews = useMemo(() => {
		return reviews
			.filter((review) => {
				if (docFilter !== 'all' && review.documentId !== docFilter) return false

				if (statusFilter !== 'all') {
					if (statusFilter === 'pending' && review.status !== 'pending') return false
					if (statusFilter === 'approved' && review.status !== 'approved') return false
					if (statusFilter === 'rejected' && review.status !== 'rejected') return false
					if (statusFilter === 'revision_required' && review.status !== 'revision_required')
						return false
				}

				if (searchQuery) {
					const doc = documents.find((d: Document) => d.documentId === review.documentId)
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
	}, [reviews, documents, docFilter, statusFilter, searchQuery, sortOrder])

	const getDocTitle = (docId: string) => {
		return documents.find((d: Document) => d.documentId === docId)?.title || 'Untitled Document'
	}

	if (authLoading || (isLoading && reviews.length === 0)) {
		return <ReviewContentSkeleton />
	}

	if (!user) return null

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
								<BreadcrumbLink href={`/${workspaceId}`}>{workspace?.title}</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className='hidden md:block' />
							<BreadcrumbItem>
								<BreadcrumbPage>Reviews</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
				<div className='ml-auto'>
					<ThemeToggle />
				</div>
			</header>

			<main className='flex-1 p-6 w-full overflow-y-auto'>
				<div className='mb-8 flex items-center justify-between'>
					<div>
						<h2 className='text-2xl font-bold text-foreground'>Reviews</h2>
						<p className='text-sm text-muted-foreground mt-1'>
							Manage review requests for your documents in the workspace {workspace?.title}
						</p>
					</div>
				</div>

				<div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8'>
					<div className='flex-1 w-full lg:max-w-full'>
						<SearchInput
							value={searchQuery}
							onChange={setSearchQuery}
							placeholder='Search reviews...'
						/>
					</div>

					<div className='flex flex-wrap items-center gap-3'>
						<div className='flex items-center gap-2 overflow-x-auto pb-1 md:pb-0'>
							<Select value={docFilter} onValueChange={setDocFilter}>
								<SelectTrigger className='bg-background h-10 min-w-[200px]'>
									<FileText className='h-4 w-4 mr-2 text-muted-foreground' />
									<SelectValue placeholder='All Documents' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='all'>All Documents</SelectItem>
									{documents.map((doc: Document) => (
										<SelectItem key={doc.documentId} value={doc.documentId}>
											{doc.title}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className='bg-background h-10 min-w-[160px]'>
									<ClipboardCheck className='h-4 w-4 mr-2 text-muted-foreground' />
									<SelectValue placeholder='All Statuses' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='all'>All Statuses</SelectItem>
									<SelectItem value='pending'>Pending</SelectItem>
									<SelectItem value='approved'>Approved</SelectItem>
									<SelectItem value='revision_required'>Revision Required</SelectItem>
									<SelectItem value='rejected'>Rejected</SelectItem>
								</SelectContent>
							</Select>

							<Select value={sortOrder} onValueChange={setSortOrder}>
								<SelectTrigger className='bg-background h-10 min-w-[130px]'>
									<ArrowUpDown className='h-4 w-4 mr-2 text-muted-foreground' />
									<SelectValue placeholder='Sort By' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='newest'>Newest</SelectItem>
									<SelectItem value='oldest'>Oldest</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>

				<h2 className='text-lg font-bold text-foreground mb-4'>
					All Reviews ({filteredReviews.length})
				</h2>

				{filteredReviews.length === 0 ? (
					<div className='text-center py-16 bg-card rounded-lg border border-dashed border-border'>
						<div className='inline-flex items-center justify-center h-12 w-12 rounded-full bg-muted mb-4'>
							<svg
								className='h-6 w-6 text-muted-foreground'
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
						<p className='text-foreground font-medium mb-1'>No reviews found</p>
						<p className='text-muted-foreground text-sm'>
							Try adjusting your search or filter criteria
						</p>
					</div>
				) : (
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
						{filteredReviews.map((review, _index) => (
							<ReviewCard
								key={review.reviewId}
								reviewId={review.reviewId}
								documentId={review.documentId}
								lecturerUserId={review.lecturerUserId || 'Unknown Reviewer'}
								message={review.message}
								status={review.status}
								requestedAt={review.requestedAt}
								title={getDocTitle(review.documentId)}
								workspaceId={workspaceId}
								student={review.student}
								versionNumber={review.versionNumber}
							/>
						))}
					</div>
				)}
			</main>
		</>
	)
}
