'use client'

import { LayoutGrid, LayoutList, Search } from 'lucide-react'
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
import { useWorkspaceDocuments } from '@/lib/api/hooks/use-documents'
import { documentsService } from '@/lib/api/services/documents.service'
import type { Document, Version } from '@/lib/api/types/document.types'
import type { Review } from '@/lib/api/types/review.types'
import { format, id } from '@/lib/date'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'

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

	const { data: docsRes, isLoading: docsLoading } = useWorkspaceDocuments(workspaceId)
	const documents = docsRes?.documents || []
	
	const [reviews, setReviews] = useState<Review[]>([])
	const [versions, setVersions] = useState<Record<string, Version>>({})
	const [loading, setLoading] = useState(true)

	// Filters
	const [docFilter, setDocFilter] = useState<string>('all')
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState<string>('all')
	const [sortOrder, setSortOrder] = useState<string>('newest')

	const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

	useEffect(() => {
		const fetchData = async () => {
			if (!user || !workspaceId) {
				setLoading(false)
				return
			}

			try {
				setLoading(true)

				// 1. Fetch Role-based Reviews
				const roleReviewsRequest =
					user.role?.toLowerCase() === 'student'
						? documentsService.getStudentReviews()
						: documentsService.getPendingReviews()
						
				const [roleReviewsRes, documentReviewResults] = await Promise.all([
					roleReviewsRequest,
					Promise.allSettled(
						documents.map((doc) => documentsService.getReviews(doc.documentId))
					),
				])

				const allReviews = mergeReviews(
					toReviews(roleReviewsRes),
					documentReviewResults.flatMap((result) =>
						result.status === 'fulfilled' ? toReviews(result.value) : []
					)
				)
				
				setReviews(allReviews)

				// 3. Fetch Versions for all reviews to sync dates
				const uniqueDocIds = Array.from(new Set(allReviews.map(r => r.documentId)))
				const versionsMap: Record<string, Version> = {}
				
				await Promise.allSettled(
					uniqueDocIds.map(async (docId) => {
						try {
							const vRes = await documentsService.getVersions(docId)
							if (vRes.versions) {
								vRes.versions.forEach(v => {
									versionsMap[v.documentBodyId] = v
								})
							}
						} catch (e) {
							// Handle missing documents (404) gracefully without noisy console errors
							if ((e as any).status !== 404) {
								console.error(`Failed to fetch versions for doc ${docId}:`, e)
							}
						}
					})
				)
				
				setVersions(versionsMap)
			} catch (error) {
				console.error('Failed to fetch data:', error)
			} finally {
				setLoading(false)
			}
		}

		fetchData()
	}, [user, workspaceId, documents.length]) // Re-run if docs list changes to get their reviews

	// Derive visible reviews
	const filteredReviews = reviews
		.filter((review) => {
			// 1. Document Filter
			if (docFilter !== 'all' && review.documentId !== docFilter) return false

			// 2. Status Filter
			if (statusFilter !== 'all') {
				const currentStatus = (review.status || '').toLowerCase().replace(/\s+/g, '_')
				if (currentStatus !== statusFilter) return false
			}

			// 3. Search Query (Title or Message)
			if (searchQuery) {
				const doc = documents.find((d) => d.documentId === review.documentId)
				const title = doc?.title?.toLowerCase() || ''
				const msg = (review.message || '').toLowerCase()
				const query = searchQuery.toLowerCase()
				
				if (!title.includes(query) && !msg.includes(query)) return false
			}

			return true
		})
		.sort((a, b) => {
			const verA = versions[a.documentBodyId]
			const verB = versions[b.documentBodyId]
			
			const dateA = new Date(verA?.createdAt || a.requestedAt || 0).getTime()
			const dateB = new Date(verB?.createdAt || b.requestedAt || 0).getTime()
			
			if (isNaN(dateA) || isNaN(dateB)) return 0
			return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
		})

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

				<main className='flex-1 p-4 md:p-6 w-full overflow-y-auto'>
					<div className='mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4'>
						<div>
							<h2 className='text-2xl font-bold text-gray-900'>Reviews</h2>
							<p className='text-sm text-gray-500 mt-1'>
								Kelola review Anda di workspace <b>{workspace?.title}</b>
							</p>
						</div>
					</div>

					{/* Unified Controls Row */}
					<div className='flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-8'>
						{/* Search - Left Side */}
						<div className='relative w-full xl:max-w-md'>
							<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
							<Input
								placeholder='Cari review...'
								className='pl-9 bg-white'
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>

						{/* Filters & View Toggle - Right Side */}
						<div className='flex flex-wrap items-center gap-2 md:justify-end'>
							<Select value={docFilter} onValueChange={setDocFilter}>
								<SelectTrigger className='bg-white w-full md:w-auto md:min-w-[160px]'>
									<SelectValue placeholder='Dokumen' />
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

							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className='bg-white w-full md:w-auto md:min-w-[140px]'>
									<SelectValue placeholder='Status' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='all'>Semua Status</SelectItem>
									<SelectItem value='pending'>Pending</SelectItem>
									<SelectItem value='approved'>Approved</SelectItem>
									<SelectItem value='revision_required'>Revision Required</SelectItem>
									<SelectItem value='rejected'>Rejected</SelectItem>
								</SelectContent>
							</Select>

							<Select value={sortOrder} onValueChange={setSortOrder}>
								<SelectTrigger className='bg-white w-full md:w-auto md:min-w-[140px]'>
									<SelectValue placeholder='Urutkan' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='newest'>Paling Baru</SelectItem>
									<SelectItem value='oldest'>Paling Lama</SelectItem>
								</SelectContent>
							</Select>

							{(docFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
								<Button 
									variant="ghost" 
									size="sm" 
									onClick={() => {
										setDocFilter('all');
										setStatusFilter('all');
										setSearchQuery('');
									}}
									className='text-gray-500 hover:text-teal-600 px-2'
								>
									Reset
								</Button>
							)}

							<Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />

							<ButtonGroup orientation="horizontal">
								<Button 
									variant={viewMode === 'list' ? 'default' : 'outline'} 
									size="sm" 
									onClick={() => setViewMode('list')}
									className="px-2.5"
								>
									<LayoutList className="w-4 h-4" />
								</Button>
								<Button 
									variant={viewMode === 'grid' ? 'default' : 'outline'} 
									size="sm" 
									onClick={() => setViewMode('grid')}
									className="px-2.5"
								>
									<LayoutGrid className="w-4 h-4" />
								</Button>
							</ButtonGroup>
						</div>
					</div>

					{/* List Header */}
					<div className="flex items-center justify-between mb-4">
						<h2 className='text-lg font-bold text-gray-900'>
							Semua Review ({filteredReviews.length})
						</h2>
					</div>

					{/* Reviews List */}
					{loading || docsLoading ? (
						<div className={viewMode === 'list' ? 'grid gap-4' : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'}>
							{[1, 2, 3, 4, 5, 6].map((i) => (
								<Skeleton key={`review-skeleton-item-${i}`} className={viewMode === 'list' ? 'h-24 rounded-lg' : 'h-64 rounded-lg'} />
							))}
						</div>
					) : filteredReviews.length === 0 ? (
						<div className='text-center py-16 bg-white rounded-lg border border-dashed border-gray-300'>
							<div className='inline-flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4'>
								<Search className='h-6 w-6 text-gray-400' />
							</div>
							<p className='text-gray-600 font-medium mb-1'>No reviews found</p>
							<p className='text-gray-500 text-sm'>Try adjusting your search or filter criteria</p>
						</div>
					) : (
						<div className={viewMode === 'list' ? 'grid gap-4' : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'}>
							{filteredReviews.map((review, index) => {
								const version = versions[review.documentBodyId]
								const doc = documents.find(d => d.documentId === review.documentId)
								return (
									<ReviewCard
										key={review.reviewId}
										reviewId={review.reviewId}
										documentId={review.documentId}
										lecturerUserId={review.lecturerUserId || 'Unknown Reviewer'}
										student={review.student}
										lecturer={review.lecturer}
										message={review.message}
										status={review.status}
										requestedAt={version?.createdAt || review.requestedAt}
										versionNumber={version?.versionNumber}
										title={doc?.title}
										isDocumentDeleted={!doc}
										workspaceId={workspaceId}
										userRole={user?.role}
									/>
								)
							})}
						</div>
					)}
				</main>
			</SidebarInset>
		</SidebarProvider>
	)
}
