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
import { useWorkspaceMembers, useWorkspace } from '@/lib/api/hooks/use-workspaces'
import { useWorkspaceDocuments } from '@/lib/api/hooks/use-documents'
import { documentsService } from '@/lib/api/services/documents.service'
import { format, id } from '@/lib/date'

export default function ReviewDetailPage() {
	const params = useParams()
	const router = useRouter()
	const { workspaceid, reviewId } = params
	const workspaceId = workspaceid as string
	
	const { user, loading: authLoading } = useAuth()
	const { data: workspace } = useWorkspace(workspaceId)
	const { data: membersRes } = useWorkspaceMembers(workspaceId)
	const { data: docsRes } = useWorkspaceDocuments(workspaceId)
	
	const [reviewData, setReviewData] = useState<any | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const fetchReview = async () => {
			if (!reviewId || authLoading) return
			try {
				const res = await documentsService.getReview(reviewId as string)
				setReviewData(res.review)
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

	// Derived data
	const members = membersRes?.members || []
	const documents = docsRes?.documents || []
	
	const studentMember = reviewData ? members.find((m: any) => m.user?.userId === reviewData.studentUserId) : null
	const lecturerMember = reviewData ? members.find((m: any) => m.user?.userId === reviewData.lecturerUserId) : null
	const document = reviewData ? documents.find((d: any) => d.documentId === reviewData.documentId) : null
	
	const studentDisplayName = studentMember 
		? `${studentMember.user.name} (@${studentMember.user.username})`
		: 'Unknown Student'
	
	const lecturerDisplayName = lecturerMember
		? `${lecturerMember.user.name} (@${lecturerMember.user.username})`
		: 'Unknown Lecturer'
	
	const docTitle = document?.title || 'Untitled Document'
	
	const formattedDate = format(reviewData?.requestedAt, 'd MMMM yyyy, HH:mm', { locale: id })

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

	if (!reviewData) {
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
								<BreadcrumbPage>{docTitle}</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</header>

				<main className='flex-1 p-6 w-full overflow-y-auto'>
					<div className='mb-8'>
						<div className='flex flex-col gap-4'>
							<div className='flex items-center justify-between'>
								<h1 className='text-2xl font-bold text-gray-900'>Detail Review: {docTitle}</h1>
								<ReviewStatusBadge status={reviewData.status} />
							</div>

							<div className='flex flex-wrap items-center gap-3 text-sm text-gray-600'>
								<span>
									Requested by <span className='font-semibold text-gray-900'>{studentDisplayName}</span>
								</span>
								<span className='mx-1 text-gray-300'>•</span>
								<span>
									Document:{' '}
									<span className='font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded'>
										{docTitle}
									</span>
								</span>
								<span className='mx-1 text-gray-300'>•</span>
								<span>{formattedDate}</span>
							</div>
						</div>
					</div>

					<div className='flex flex-col flex-1 gap-8'>
						{/* Section 1: Review Request (from Student) */}
						<section className='bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden'>
							<div className='bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between'>
								<h3 className='text-lg font-bold text-gray-900'>Review Request</h3>
								<span className='text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase'>
									Student Message
								</span>
							</div>
							<div className='p-6'>
								<div className='relative pl-6'>
									<div className='absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 rounded-full' />
									<ReviewComment
										authorName={studentMember?.user.name || 'Student'}
										authorInitials={studentMember?.user.name?.charAt(0) || 'S'}
										date={formattedDate}
										content={reviewData.message || 'No comment provided'}
										userType='student'
									/>
								</div>
							</div>
						</section>

						{/* Section 2: Lecturer Feedback (only if reviewed) */}
						{reviewData.status !== 'pending' && (
							<section className='bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500'>
								<div className='bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between'>
									<h3 className='text-lg font-bold text-gray-900'>Review Feedback</h3>
									<div className='flex items-center gap-2'>
										<ReviewStatusBadge status={reviewData.status} />
										<span className='text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase'>
											Lecturer Decision
										</span>
									</div>
								</div>
								<div className='p-6'>
									<div className='relative pl-6'>
										<div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-full ${
											reviewData.status === 'approved' ? 'bg-green-500' : 
											reviewData.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'
										}`} />
										<ReviewComment
											authorName={lecturerMember?.user.name || 'Lecturer'}
											authorInitials={lecturerMember?.user.name?.charAt(0) || 'L'}
											date={reviewData.reviewedAt ? format(reviewData.reviewedAt, 'd MMMM yyyy, HH:mm', { locale: id }) : 'Just now'}
											content={reviewData.lecturerMessage || `The document has been marked as ${reviewData.status.replace('_', ' ')}.`}
											userType='lecturer'
										/>
									</div>
								</div>
							</section>
						)}
					</div>
					
					{user?.role === 'Student' && (
						<div className='mt-6 flex justify-end'>
							<button
								type="button"
								onClick={() => router.push(`/${workspaceId}/documents/${reviewData.documentId}`)}
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
