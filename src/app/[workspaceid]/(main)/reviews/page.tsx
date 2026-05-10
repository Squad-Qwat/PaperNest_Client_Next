'use client'

import { Search } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { ReviewContentSkeleton } from '@/components/layout/DashboardSkeleton'
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
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useAuth } from '@/context/AuthContext'
import {
	useLecturerPendingReviews,
	useStudentReviews,
	useWorkspaceDocuments,
} from '@/lib/api/hooks/use-documents'
import { useWorkspace } from '@/lib/api/hooks/use-workspaces'
import { format, id } from '@/lib/date'

export default function ReviewsPage() {
	const params = useParams()
	const router = useRouter()
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

	const reviews = (isStudent ? studentReviewsRes?.reviews : lecturerReviewsRes?.reviews) || []
	const documents = docsRes?.documents || []
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
	}, [reviews, documents, docFilter, statusFilter, searchQuery, sortOrder])

	const getDocTitle = (docId: string) => {
		return documents.find((d) => d.documentId === docId)?.title || 'Untitled Document'
	}

	if (authLoading || (isLoading && reviews.length === 0)) {
		return <ReviewContentSkeleton />
	}

	if (!user) return null

	return (
		<>
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
				<div className='mb-8'>
					<div className='flex items-center justify-between mb-2'>
						<div className='flex items-center gap-3'>
							<h1 className='text-3xl font-bold text-gray-900'>Reviews</h1>
						</div>
					</div>
				</div>

				<div className='flex flex-col lg:flex-row gap-3 mb-8'>
					<div className='flex-1 relative'>
						<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
						<Input
							placeholder='Cari review...'
							className='pl-9 bg-white w-full'
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>

					<div className='flex flex-col sm:flex-row gap-3'>
						<div className='w-full lg:w-[220px]'>
							<Select value={docFilter} onValueChange={setDocFilter}>
								<SelectTrigger className='bg-white w-full'>
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

						<div className='w-full lg:w-[180px]'>
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className='bg-white w-full'>
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

						<div className='w-full lg:w-[130px]'>
							<Select value={sortOrder} onValueChange={setSortOrder}>
								<SelectTrigger className='bg-white w-full'>
									<SelectValue placeholder='Urutkan' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='newest'>Terbaru</SelectItem>
									<SelectItem value='oldest'>Terlama</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>

				<h2 className='text-lg font-bold text-gray-900 mb-4'>
					Semua Review ({filteredReviews.length})
				</h2>

				{filteredReviews.length === 0 ? (
					<div className='text-center py-16 bg-white rounded-lg border border-dashed border-gray-200'>
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
							/>
						))}
					</div>
				)}
			</main>
		</>
	)
}
