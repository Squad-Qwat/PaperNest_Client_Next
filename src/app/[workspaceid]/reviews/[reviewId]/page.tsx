'use client'

import { AlertCircle, CheckCircle2, ChevronLeft, MessageSquare } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { AppSidebar } from '@/components/app-sidebar'
import { ReviewActionCard } from '@/components/review/ReviewActionCard'
import { ReviewComment } from '@/components/review/ReviewComment'
import { ReviewDetailSection } from '@/components/review/ReviewDetailSection'
import { ReviewHero } from '@/components/review/ReviewHero'
import { ReviewInfoCard } from '@/components/review/ReviewInfoCard'
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/AuthContext'
import { useDocument, useReviewDetail, useUpdateReviewStatus } from '@/lib/api/hooks/use-documents'
import { useWorkspace, useWorkspaceMembers } from '@/lib/api/hooks/use-workspaces'
import { format, id } from '@/lib/date'

export default function ReviewDetailPage() {
	const params = useParams()
	const router = useRouter()
	const { workspaceid, reviewId } = params
	const workspaceId = workspaceid as string

	const { user, loading: authLoading } = useAuth()
	const { data: workspace } = useWorkspace(workspaceId)
	const { data: membersRes } = useWorkspaceMembers(workspaceId)
	const { data: reviewRes, isLoading: reviewLoading } = useReviewDetail(reviewId as string)
	const reviewData = reviewRes?.review

	const { data: documentRes } = useDocument(workspaceId, reviewData?.documentId)
	const document = documentRes?.document || documentRes

	const { mutateAsync: updateStatus, isPending: isUpdating } = useUpdateReviewStatus()

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
	const lecturerName = reviewData?.lecturer?.name || lecturerMember?.user?.name || 'Lecturer'
	const isDocumentDeleted = !documentRes && !reviewLoading && !!reviewData
	const docTitle = document?.title
	const formattedDate = format(reviewData?.requestedAt || new Date(), 'd MMMM yyyy, HH:mm', {
		locale: id,
	})

	const handleAction = async () => {
		if (!reviewId) return

		try {
			await updateStatus({
				reviewId: reviewId as string,
				data: { status: decision, message: feedback },
			})
			toast.success(`Review ${decision.replace('_', ' ')} successfully`)
			setIsModalOpen(false)
			setFeedback('')
		} catch (error: any) {
			toast.error(error.message || 'Failed to update review')
		}
	}

	const openDecisionModal = (type: 'approved' | 'rejected' | 'revision_required') => {
		setDecision(type)
		setFeedback('')
		setIsModalOpen(true)
	}

	if (authLoading || reviewLoading) {
		return (
			<SidebarProvider>
				<AppSidebar />
				<SidebarInset className='flex flex-col min-h-0 bg-sidebar rounded-xl m-2 overflow-hidden border'>
					<header className='flex h-16 shrink-0 items-center gap-2 px-4 bg-white border-b sticky top-0 z-30'>
						<SidebarTrigger className='-ml-1' />
						<Separator orientation='vertical' className='mr-2 h-4' />
						<Skeleton className='h-4 w-64' />
					</header>
					<main className='flex-1 p-6 space-y-6'>
						<Skeleton className='h-64 w-full rounded-xl' />
						<div className='grid grid-cols-3 gap-8'>
							<Skeleton className='col-span-2 h-64 rounded-xl' />
							<Skeleton className='h-64 rounded-xl' />
						</div>
					</main>
				</SidebarInset>
			</SidebarProvider>
		)
	}

	if (!reviewData) {
		return (
			<SidebarProvider>
				<AppSidebar />
				<SidebarInset className='flex flex-col min-h-0 bg-sidebar rounded-xl m-2 border overflow-hidden'>
					<header className='flex h-16 shrink-0 items-center gap-2 px-4 bg-white border-b'>
						<SidebarTrigger className='-ml-1' />
						<Separator orientation='vertical' className='mr-2 h-4' />
						<Breadcrumb>
							<BreadcrumbList>
								<BreadcrumbItem>
									<BreadcrumbLink href={`/${workspaceId}`}>Workspace</BreadcrumbLink>
								</BreadcrumbItem>
								<BreadcrumbSeparator />
								<BreadcrumbItem>
									<BreadcrumbPage>Review Not Found</BreadcrumbPage>
								</BreadcrumbItem>
							</BreadcrumbList>
						</Breadcrumb>
					</header>
					<main className='flex-1 p-6 flex flex-col items-center justify-center text-center'>
						<div className='bg-red-50 p-6 rounded-full mb-4'>
							<AlertCircle className='w-12 h-12 text-red-500' />
						</div>
						<h2 className='text-2xl font-bold text-gray-900'>Review tidak ditemukan</h2>
						<Button
							variant='outline'
							className='mt-6'
							onClick={() => router.push(`/${workspaceId}/reviews`)}
						>
							<ChevronLeft className='w-4 h-4 mr-2' /> Kembali ke Daftar Review
						</Button>
					</main>
				</SidebarInset>
			</SidebarProvider>
		)
	}

	const isLecturer = user?.role === 'Lecturer'
	const isPending = reviewData.status === 'pending'
	const getStatusVariant = (status: string) => {
		switch (status) {
			case 'approved':
				return 'green'
			case 'rejected':
				return 'red'
			default:
				return 'amber'
		}
	}
	const statusVariant = getStatusVariant(reviewData.status)

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset className='flex flex-col min-h-0 bg-sidebar rounded-xl m-2 border overflow-hidden'>
				<header className='flex h-16 shrink-0 items-center gap-2 px-4 bg-white border-b sticky top-0 z-30'>
					<SidebarTrigger className='-ml-1' />
					<Separator orientation='vertical' className='mr-2 h-4' />
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem className='hidden md:block'>
								<BreadcrumbLink href='/'>PaperNest</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className='hidden md:block' />
							<BreadcrumbItem>
								<BreadcrumbLink href={`/${workspaceId}`}>
									{workspace?.title || 'Workspace'}
								</BreadcrumbLink>
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

				<main className='flex-1 p-4 md:p-6 w-full overflow-y-auto space-y-6'>
					<div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
						<div className='space-y-1'>
							<div className='flex items-center gap-3'>
								<h2 className='text-2xl font-bold text-gray-900'>Detail Review</h2>
								<span
									className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${
										user?.role === 'Lecturer'
											? 'bg-purple-100 text-purple-700'
											: 'bg-teal-100 text-teal-700'
									}`}
								>
									{user?.role}
								</span>
							</div>
							<p className='text-sm text-gray-500'>
								{user?.role === 'Lecturer'
									? `Kelola keputusan review untuk dokumen mahasiswa`
									: `Lihat hasil review dokumen Anda oleh dosen`}
							</p>
						</div>

						{/* User Identity Info */}
						<div className='flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100'>
							<div className='text-right hidden sm:block'>
								<p className='text-xs font-bold text-gray-900'>{user?.name || user?.email}</p>
								<p className='text-[10px] text-gray-500 uppercase tracking-tight'>{user?.role}</p>
							</div>
							<div className='h-8 w-8 rounded-full bg-white border flex items-center justify-center text-xs font-bold text-teal-600 shadow-sm'>
								{(user?.name || user?.email || '?').charAt(0).toUpperCase()}
							</div>
						</div>
					</div>
					<ReviewHero
						docTitle={docTitle}
						studentName={studentName}
						formattedDate={formattedDate}
						status={reviewData.status}
						documentId={reviewData.documentId}
						workspaceId={workspaceId}
						isDeleted={isDocumentDeleted}
					/>

					<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
						<div className='lg:col-span-2 space-y-6'>
							<ReviewDetailSection
								title='Review Request'
								badgeText='Student Message'
								icon={MessageSquare}
								variant='teal'
							>
								<ReviewComment
									authorName={studentName}
									date={formattedDate}
									content={reviewData.message || 'Tidak ada pesan pengantar.'}
									userType='student'
								/>
							</ReviewDetailSection>

							{!isPending && (
								<ReviewDetailSection
									title='Review Feedback'
									badgeText='Decision Reached'
									icon={CheckCircle2}
									variant={statusVariant}
								>
									<ReviewComment
										authorName={lecturerName}
										date={format(reviewData.reviewedAt || new Date(), 'd MMMM yyyy, HH:mm', {
											locale: id,
										})}
										content={
											reviewData.lecturerMessage ||
											`Dokumen telah ditandai sebagai ${reviewData.status.replace('_', ' ')}.`
										}
										userType='lecturer'
									/>
								</ReviewDetailSection>
							)}
						</div>

						<div className='space-y-6'>
							{isLecturer && isPending ? (
								<ReviewActionCard onAction={openDecisionModal} />
							) : (
								<ReviewInfoCard
									lecturerName={lecturerName}
									studentName={studentName}
									documentId={reviewData.documentId}
									workspaceId={workspaceId}
									isDeleted={isDocumentDeleted}
								/>
							)}
						</div>
					</div>
				</main>
			</SidebarInset>

			{/* Decision Modal */}
			<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
				<DialogContent className='sm:max-w-[500px]'>
					<DialogHeader>
						<DialogTitle>
							Konfirmasi{' '}
							{decision.replace('_', ' ').charAt(0).toUpperCase() +
								decision.replace('_', ' ').slice(1)}
						</DialogTitle>
						<DialogDescription>
							Berikan catatan atau masukan tambahan untuk mahasiswa mengenai keputusan ini.
						</DialogDescription>
					</DialogHeader>

					<div className='py-4'>
						<Textarea
							placeholder='Tulis pesan masukan Anda di sini (opsional)...'
							value={feedback}
							onChange={(e) => setFeedback(e.target.value)}
							className='min-h-[120px]'
						/>
					</div>

					<DialogFooter className='flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2'>
						<Button variant='outline' onClick={() => setIsModalOpen(false)} className='px-6'>
							Batal
						</Button>
						<Button onClick={handleAction} disabled={isUpdating} className='font-bold px-8'>
							{isUpdating ? 'Memproses...' : 'Kirim Keputusan'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</SidebarProvider>
	)
}
