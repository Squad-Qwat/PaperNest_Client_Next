'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { ReviewComment } from '@/components/review/ReviewComment'
import { ReviewStatusBadge } from '@/components/review/ReviewStatusBadge'
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/context/AuthContext'
import { useWorkspace } from '@/lib/api/hooks/use-workspaces'
import { documentsService } from '@/lib/api/services/documents.service'

export default function ReviewDetailPage() {
	const params = useParams()
	const router = useRouter()
	const { workspaceid, reviewId } = params
	const workspaceId = workspaceid as string
	const { user, loading: authLoading } = useAuth()
	const { data: workspace } = useWorkspace(workspaceId)
	const [review, setReview] = useState<any | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const fetchReview = async () => {
			if (!reviewId || authLoading) return
			try {
				const { review: reviewData } = await documentsService.getReview(reviewId as string)
				// Fetch document title if needed, or use generic
				// For now mapping to UI shape
				setReview({
					id: reviewData.reviewId,
					title: 'Review Details',
					lecturerName: 'Lecturer',
					status: reviewData.status,
					requestBy: 'Student',
					createdAt: new Date(reviewData.requestedAt).toLocaleDateString(),
					description: reviewData.message,
					documentName: 'Document',
					documentId: reviewData.documentId,
					lecturerUserId: reviewData.lecturerUserId,
				})
			} catch (e) {
				console.error('Failed to fetch review:', e)
			} finally {
				setLoading(false)
			}
		}

		if (!authLoading) {
			fetchReview()
		}
	}, [reviewId, authLoading])

	if (authLoading || loading) {
		return (
			<SidebarProvider>
				<AppSidebar />
				<SidebarInset className='flex flex-col min-h-0 overflow-hidden border border-gray-200/50 transition-all duration-300 isolate rounded-2xl m-2'>
					<header className='flex h-16 shrink-0 items-center gap-2 px-4 bg-white border-b sticky top-0 z-30 rounded-t-2xl'>
						<SidebarTrigger className='-ml-1' />
						<Separator orientation='vertical' className='mr-2 h-4' />
						<Skeleton className='h-4 w-64' />
					</header>
					<main className='flex-1 p-6'>
						<Skeleton className='h-8 w-1/3 mb-4' />
						<Skeleton className='h-32 w-full' />
					</main>
				</SidebarInset>
			</SidebarProvider>
		)
	}

	if (!review) {
		return (
			<SidebarProvider>
				<AppSidebar />
				<SidebarInset className='flex flex-col min-h-0 overflow-hidden border border-gray-200/50 transition-all duration-300 isolate rounded-2xl m-2'>
					<header className='flex h-16 shrink-0 items-center gap-2 px-4 bg-white border-b sticky top-0 z-30 rounded-t-2xl'>
						<SidebarTrigger className='-ml-1' />
						<Separator orientation='vertical' className='mr-2 h-4' />
						<Breadcrumb>
							<BreadcrumbList>
								<BreadcrumbItem>
									<BreadcrumbLink href={`/${workspaceId}`}>Workspace</BreadcrumbLink>
								</BreadcrumbItem>
								<BreadcrumbSeparator />
								<BreadcrumbItem>
									<BreadcrumbLink href={`/${workspaceId}/reviews`}>Reviews</BreadcrumbLink>
								</BreadcrumbItem>
							</BreadcrumbList>
						</Breadcrumb>
					</header>
					<main className='flex-1 p-6 flex items-center justify-center'>
						<div className='text-center'>
							<h2 className='text-xl font-semibold text-gray-900'>Review not found</h2>
							<p className='text-gray-500 mt-2'>The review you are looking for does not exist or has been removed.</p>
							<button 
								type="button"
								onClick={() => router.push(`/${workspaceId}/reviews`)}
								className='mt-4 text-blue-600 hover:underline font-medium'
							>
								Back to Reviews
							</button>
						</div>
					</main>
				</SidebarInset>
			</SidebarProvider>
		)
	}

	return (
		<SidebarProvider>
			<AppSidebar />
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
								<BreadcrumbLink href={`/${workspaceId}`}>{workspace?.title || 'Workspace'}</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className='hidden md:block' />
							<BreadcrumbItem>
								<BreadcrumbLink href={`/${workspaceId}/reviews`}>Reviews</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className='hidden md:block' />
							<BreadcrumbItem>
								<BreadcrumbPage>Detail</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</header>

				<main className='flex-1 p-6 w-full overflow-y-auto'>
					<div className='mb-8'>
						<div className='flex flex-col gap-4'>
							<div className='flex items-center justify-between'>
								<h1 className='text-2xl font-bold text-gray-900'>{review.title}</h1>
								<ReviewStatusBadge status={review.status} />
							</div>

							<div className='flex flex-wrap items-center gap-3 text-sm text-gray-600'>
								<span>
									Requested by <span className='font-semibold text-gray-900'>{review.requestBy}</span>
								</span>
								<span className='mx-1 text-gray-300'>•</span>
								<span>
									Document:{' '}
									<span className='font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded'>
										{review.documentName}
									</span>
								</span>
								<span className='mx-1 text-gray-300'>•</span>
								<span>{review.createdAt}</span>
							</div>
						</div>
					</div>

					<div className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm'>
						<h3 className='text-lg font-semibold text-gray-900 mb-4'>Feedback</h3>
						<div className='relative pl-4'>
							<div className='absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-full' />
							<ReviewComment
								authorName={review.lecturerName}
								authorInitials='LC'
								date={review.createdAt}
								content={review.description || 'No comment provided'}
								userType='lecturer'
							/>
						</div>
					</div>
					
					{user?.role === 'Student' && (
						<div className='mt-6 flex justify-end'>
							<button
								type="button"
								onClick={() => router.push(`/${workspaceId}/documents/${review.documentId}`)}
								className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm'
							>
								Open Document
							</button>
						</div>
					)}
				</main>
			</SidebarInset>
		</SidebarProvider>
	)
}
