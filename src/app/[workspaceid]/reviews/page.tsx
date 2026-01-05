'use client'

import { Search } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { ReviewCard } from '@/components/review/ReviewCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { useAuthContext } from '@/context/AuthContext'
import { documentsService } from '@/lib/api/services/documents.service'
import type { Document } from '@/lib/api/types/document.types'
import type { Review } from '@/lib/api/types/review.types'
import { format, id } from '@/lib/date'

export default function ReviewsPage() {
	const params = useParams()
	const router = useRouter()
	const { user } = useAuthContext()
	const workspaceId = params.workspaceid as string

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
			if (!user || !workspaceId) return
			try {
				setLoading(true)

				// Fetch Reviews
				let reviewsRes
				if (user.role?.toLowerCase() === 'student') {
					reviewsRes = await documentsService.getStudentReviews()
				} else {
					reviewsRes = await documentsService.getPendingReviews()
				}
				setReviews(reviewsRes.reviews || [])

				// Fetch Documents for titles and filter
				const docsRes = await documentsService.getWorkspaceDocuments(workspaceId)
				setDocuments(docsRes.documents || [])
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
				if (statusFilter === 'pending' && review.status !== 'pending') return false
				if (statusFilter === 'approved' && review.status !== 'approved') return false
				if (statusFilter === 'rejected' && review.status !== 'rejected') return false
				if (statusFilter === 'revision_required' && review.status !== 'revision_required')
					return false
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
		<div className='min-h-screen bg-gray-50'>
			<Navbar mode='workspace' />
			<main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
				<div className='mb-8'>
					<div className='flex items-center justify-between mb-2'>
						<div className='flex items-center gap-3'>
							<h1 className='text-3xl font-bold text-gray-900'>Reviews</h1>
						</div>
					</div>
				</div>

				{/* Filters Row */}
				<div className='flex flex-wrap gap-4 mb-8'>
					{/* Document Filter */}
					<div className='w-[200px]'>
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
					<div className='flex-1 relative'>
						<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
						<Input
							placeholder='Cari review...'
							className='pl-9 bg-white'
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>

					{/* Status Filter */}
					<div className='w-[180px]'>
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
					<div className='w-[180px]'>
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
					<div className='text-center py-20 text-gray-500'>Loading reviews...</div>
				) : filteredReviews.length === 0 ? (
					<div className='text-center py-12 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300'>
						No reviews found matching your filters.
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
								onReviewUpdate={(newStatus, newMessage) => {
									setReviews(prev => prev.map(r => 
										r.reviewId === review.reviewId 
											? { ...r, status: newStatus as any, message: newMessage || r.message }
											: r
									))
								}}
							/>
						))}
					</div>
				)}
			</main>
		</div>
	)
}
