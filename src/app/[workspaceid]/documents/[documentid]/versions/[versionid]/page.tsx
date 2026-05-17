'use client'

import { ChevronLeft, FileText, Loader2, MessageSquare, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ReviewStatusBadge } from '@/components/review/ReviewStatusBadge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Label } from '@/components/ui/label'
import { Modal, ModalFooter } from '@/components/ui/modal'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/AuthContext'
import { useCompilePdf } from '@/hooks/editor/use-compile-pdf'
import { useDocumentFiles } from '@/lib/api/hooks/use-document-files'
import {
	useCreateReview,
	useDocumentReviews,
	useDocumentVersions,
	useDocumentWithRoomState,
	useRevertVersion,
} from '@/lib/api/hooks/use-documents'
import { useWorkspace, useWorkspaceMembers } from '@/lib/api/hooks/use-workspaces'
import type { Version } from '@/lib/api/types/document.types'
import type { Review } from '@/lib/api/types/review.types'
import { format, id } from '@/lib/date'
import { getAvatarUrl, getInitials } from '@/lib/utils'

export default function VersionDetailPage() {
	const params = useParams()
	const router = useRouter()
	const workspaceId = params.workspaceid as string
	const documentId = params.documentid as string
	const versionId = params.versionid as string

	const [showConfirm, setShowConfirm] = useState(false)

	const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
	const [selectedLecturerId, setSelectedLecturerId] = useState('')
	const [reviewMessage, setReviewMessage] = useState('')

	const { user } = useAuth()
	const { data: membersResponse } = useWorkspaceMembers(workspaceId)
	const { data: workspace } = useWorkspace(workspaceId)
	const { mutateAsync: createReview, isPending: isCreatingReview } = useCreateReview()

	const { data: versionsResponse, isLoading: versionsLoading } = useDocumentVersions(documentId)
	const { data: documentWithRoomData, refetch: refetchRoomState } =
		useDocumentWithRoomState(documentId)
	const { data: reviewsResponse } = useDocumentReviews(documentId)
	const { data: files = [] } = useDocumentFiles(documentId)
	const { mutateAsync: revertVersion, isPending: isReverting } = useRevertVersion()

	// PDF Compilation State using hook
	const { pdfUrl, isCompiling, compileError, handleCompile } = useCompilePdf(documentId, files)

	const activeUsers = documentWithRoomData?.room?.activeUsers || 0

	const members = membersResponse?.members || []
	const lecturers = members.filter((m: any) => m.user?.role?.toLowerCase() === 'lecturer')

	useEffect(() => {
		if (lecturers.length > 0) {
			if (!selectedLecturerId) {
				setSelectedLecturerId(lecturers[0]?.user?.userId || '')
			}
		} else if (workspace?.ownerId) {
			if (!selectedLecturerId) {
				setSelectedLecturerId(workspace.ownerId)
			}
		}
	}, [lecturers, workspace, selectedLecturerId])

	const handleRequestReviewSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!selectedLecturerId) return

		try {
			await createReview({
				documentId,
				documentBodyId: versionId,
				data: {
					lecturerUserId: selectedLecturerId,
					message: reviewMessage || 'Requesting review for version',
				},
			})
			toast.success('Pengajuan review berhasil dikirim!')
			setIsReviewModalOpen(false)
		} catch (error) {
			console.error('Failed to create review:', error)
			toast.error('Gagal mengirim pengajuan review')
		}
	}

	const versions = Array.isArray(versionsResponse)
		? (versionsResponse as Version[])
		: (versionsResponse as { versions: Version[] })?.versions || []

	const version = versions.find((v: Version) => v.documentBodyId === versionId)
	const reviews = Array.isArray(reviewsResponse)
		? (reviewsResponse as Review[])
		: (reviewsResponse as { reviews: Review[] })?.reviews || []
	const versionReview = reviews.find((r: Review) => r.documentBodyId === versionId)

	useEffect(() => {
		if (version?.content && !pdfUrl && !isCompiling && !compileError) {
			handleCompile(version.content)
		}
	}, [version?.content, handleCompile, pdfUrl, isCompiling, compileError])

	const handleRestore = async () => {
		if (!version) return

		// Refresh room state to get latest active users count
		const { data: latestRoomData } = await refetchRoomState()
		const currentActiveUsers = latestRoomData?.room?.activeUsers || 0

		if (currentActiveUsers > 0) {
			toast.error('Tidak Dapat Melakukan Pemulihan', {
				description:
					'Masih terdapat pengguna aktif di dalam editor. Harap pastikan semua pengguna telah keluar dari room sebelum melakukan pemulihan.',
				duration: 5000,
			})
			return
		}

		try {
			await revertVersion({ documentId, versionNumber: version.versionNumber })
			toast.success('Versi berhasil dipulihkan')
			router.push(`/${workspaceId}/documents/${documentId}`)
		} catch (_e: any) {
			toast.error('Gagal memulihkan versi')
		}
	}

	if (versionsLoading) {
		return (
			<div className='h-screen flex items-center justify-center bg-background'>
				<Loader2 className='w-8 h-8 animate-spin text-muted-foreground' />
			</div>
		)
	}

	if (!version) {
		return (
			<div className='h-screen flex flex-col items-center justify-center bg-background'>
				<p className='text-muted-foreground mb-4 text-sm'>Versi tidak ditemukan</p>
				<Button variant='outline' onClick={() => router.back()}>
					Kembali
				</Button>
			</div>
		)
	}

	return (
		<div className='h-screen flex flex-col font-sans bg-background text-foreground'>
			<header className='bg-background border-b sticky top-0 z-50 py-4'>
				<div className='w-full px-4 md:px-6 flex items-center justify-between'>
					<div className='flex items-center gap-4'>
						<Button
							variant='ghost'
							onClick={() => router.push(`/${workspaceId}/documents/${documentId}/versions`)}
							className='h-10 w-10 hover:bg-muted rounded-lg transition-all group p-0 min-w-0 shrink-0'
							title='Kembali ke Riwayat'
						>
							<ChevronLeft className='h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors' />
						</Button>
						<div className='flex flex-col'>
							<h1 className='text-sm font-semibold tracking-tight'>
								Detail Versi #{String(version.versionNumber).padStart(3, '0')}
							</h1>
							<p className='text-xs text-muted-foreground'>
								{format(version.createdAt, 'd MMMM yyyy, HH:mm', { locale: id })}
							</p>
						</div>
					</div>

					<div className='flex items-center gap-3'>
						{versionReview ? (
							<Link href={`/${workspaceId}/reviews/${versionReview.reviewId}`}>
								<Button variant='outline' size='sm' className='gap-2'>
									<MessageSquare className='w-4 h-4' />
									<span className='hidden sm:inline'>Lihat Review</span>
								</Button>
							</Link>
						) : (
							user?.role?.toLowerCase() === 'student' && (
								<Button
									variant='outline'
									size='sm'
									className='gap-2 bg-primary hover:bg-primary/90 text-white border-primary transition-all duration-200'
									onClick={() => setIsReviewModalOpen(true)}
								>
									<MessageSquare className='w-4 h-4' />
									<span>Ajukan Review</span>
								</Button>
							)
						)}
						<Button
							size='sm'
							className='gap-2'
							onClick={async () => {
								await refetchRoomState()
								setShowConfirm(true)
							}}
							disabled={isReverting}
						>
							<RotateCcw className='w-4 h-4' />
							<span className='hidden sm:inline'>
								{isReverting ? 'Memulihkan...' : 'Pulihkan Versi Ini'}
							</span>
						</Button>
					</div>
				</div>
			</header>

			<main className='flex-1 flex flex-col lg:flex-row overflow-hidden p-4 md:p-6 gap-6'>
				<div className='flex-1 bg-background rounded-lg border flex items-center justify-center relative overflow-hidden transition-all'>
					{isCompiling ? (
						<div className='flex flex-col items-center gap-4'>
							<Loader2 className='w-8 h-8 animate-spin text-muted-foreground' />
							<span className='text-sm text-muted-foreground'>Mengompilasi PDF...</span>
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
							<div className='w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4'>
								<FileText className='w-6 h-6 text-destructive' />
							</div>
							<p className='text-sm font-semibold text-destructive'>Gagal Compile</p>
							<pre className='text-xs text-muted-foreground mt-4 max-w-md mx-auto overflow-auto max-h-40 bg-muted p-4 rounded-md text-left'>
								{compileError}
							</pre>
						</div>
					) : null}
				</div>

				<div className='w-full lg:w-96 flex flex-col shrink-0 gap-6 overflow-y-auto'>
					<Card className='p-6 space-y-6 rounded-2xl border-gray-200/60 shadow-sm'>
						<div className='flex items-center justify-between border-b border-gray-100 pb-4'>
							<h3 className='text-sm font-bold text-gray-900 uppercase tracking-wider'>
								Metadata Versi
							</h3>
							<div className='px-2 py-1 bg-gray-100 rounded text-[10px] font-bold text-gray-500'>
								V{version.versionNumber}
							</div>
						</div>

						<div className='space-y-6'>
							{/* Author Info */}
							<div className='flex items-center gap-3'>
								{(() => {
									const displayName =
										version.user?.name || version.user?.username || version.userId || 'User'
									return (
										<>
											<Avatar className='h-10 w-10 border-2 border-white shadow-sm'>
												<AvatarImage
													src={version.user?.photoURL || getAvatarUrl(displayName, version.userId)}
												/>
												<AvatarFallback className='bg-primary/5 text-primary text-xs font-bold'>
													{getInitials(displayName)}
												</AvatarFallback>
											</Avatar>
											<div className='flex flex-col'>
												<span className='text-sm font-bold text-gray-900 leading-none mb-1'>
													{displayName}
												</span>
												<div className='flex items-center gap-1.5 text-[10px] text-gray-500 font-medium'>
													<span className='px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-sm uppercase tracking-tight'>
														Author
													</span>
													<span className='opacity-30'>•</span>
													<span>{format(version.createdAt, 'HH:mm, d MMM', { locale: id })}</span>
												</div>
											</div>
										</>
									)
								})()}
							</div>

							{/* Commit Message / Student Request */}
							<div className='space-y-2'>
								<div className='flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest'>
									<MessageSquare className='w-3 h-3' />
									Pesan Komit
								</div>
								<div className='bg-gray-50/80 rounded-xl p-4 border border-gray-100'>
									<p className='text-sm text-gray-700 leading-relaxed italic'>
										"{version.message || 'Tidak ada pesan komit.'}"
									</p>
								</div>
							</div>

							{/* Review Section */}
							{versionReview && (
								<div className='pt-6 border-t border-gray-100 space-y-4'>
									<div className='flex items-center justify-between'>
										<div className='text-[10px] font-bold text-gray-400 uppercase tracking-widest'>
											Status Review
										</div>
										<ReviewStatusBadge status={versionReview.status} />
									</div>

									{versionReview.status !== 'pending' && (
										<div className='space-y-3 animate-in fade-in slide-in-from-top-2 duration-300'>
											<div className='flex items-center gap-2'>
												<div className='h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse' />
												<span className='text-[10px] font-bold text-gray-500 uppercase tracking-tight'>
													Umpan Balik Dosen
												</span>
											</div>
											<div className='bg-green-50/30 rounded-xl p-4 border border-green-100/50'>
												<p className='text-sm text-gray-800 leading-relaxed'>
													{versionReview.lecturerMessage ||
														versionReview.message ||
														'Versi telah disetujui tanpa catatan tambahan.'}
												</p>
											</div>
											{versionReview.reviewedAt && (
												<p className='text-[10px] text-gray-400 text-right'>
													Ditinjau pada{' '}
													{format(versionReview.reviewedAt, 'd MMMM yyyy', { locale: id })}
												</p>
											)}
										</div>
									)}
								</div>
							)}
						</div>
					</Card>
				</div>
			</main>

			<ConfirmDialog
				isOpen={showConfirm}
				onClose={() => setShowConfirm(false)}
				onConfirm={activeUsers > 0 ? () => {} : handleRestore}
				title={activeUsers > 0 ? 'Editor Sedang Digunakan' : 'Konfirmasi Pemulihan'}
				message={
					activeUsers > 0
						? `Terdapat ${activeUsers} pengguna yang sedang aktif di room editor. Untuk menjaga integritas data, semua pengguna harus keluar dari room editor sebelum pemulihan dapat dilakukan.`
						: 'Apakah Anda yakin ingin memulihkan dokumen ini ke versi yang dipilih? Tindakan ini akan menghapus semua versi yang dibuat setelah versi ini.'
				}
				confirmText={activeUsers > 0 ? 'Mengerti' : 'Ya, Pulihkan'}
				cancelText={activeUsers > 0 ? undefined : 'Batal'}
				variant={activeUsers > 0 ? 'info' : 'warning'}
			/>

			<Modal
				isOpen={isReviewModalOpen}
				onClose={() => setIsReviewModalOpen(false)}
				title='Ajukan Review Dokumen'
			>
				<form onSubmit={handleRequestReviewSubmit} className='space-y-4 pt-2'>
					<p className='text-sm text-muted-foreground'>
						Pilih dosen peninjau dan tambahkan pesan opsional untuk menjelaskan perubahan atau fokus
						peninjauan Anda.
					</p>

					<div className='space-y-2'>
						<Label htmlFor='lecturer-select'>
							Dosen Peninjau <span className='text-red-500'>*</span>
						</Label>
						<Select
							value={selectedLecturerId}
							onValueChange={(value) => setSelectedLecturerId(value)}
							required
						>
							<SelectTrigger id='lecturer-select' className='w-full bg-white'>
								<SelectValue placeholder='-- Pilih Dosen --' />
							</SelectTrigger>
							<SelectContent className='z-[1025]'>
								{lecturers.map((m: any) => (
									<SelectItem key={m.user?.userId} value={m.user?.userId}>
										{m.user?.name || m.user?.username || 'Dosen'}
									</SelectItem>
								))}
								{lecturers.length === 0 && workspace?.ownerId && (
									<SelectItem value={workspace.ownerId}>Pemilik Workspace (Default)</SelectItem>
								)}
							</SelectContent>
						</Select>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='review-message'>Pesan Tambahan (Opsional)</Label>
						<Textarea
							id='review-message'
							placeholder='Tulis catatan atau instruksi khusus untuk peninjau...'
							value={reviewMessage}
							onChange={(e) => setReviewMessage(e.target.value)}
							disabled={isCreatingReview}
							className='resize-none text-sm'
							rows={4}
						/>
					</div>

					<ModalFooter className='px-0 pb-0 gap-2'>
						<Button
							type='button'
							variant='outline'
							onClick={() => setIsReviewModalOpen(false)}
							disabled={isCreatingReview}
						>
							Batal
						</Button>
						<Button
							type='submit'
							disabled={isCreatingReview || !selectedLecturerId}
							className='bg-primary text-white hover:bg-primary/90 flex items-center gap-1.5'
						>
							{isCreatingReview && <Loader2 className='w-4 h-4 animate-spin' />}
							{isCreatingReview ? 'Mengirim...' : 'Kirim Pengajuan'}
						</Button>
					</ModalFooter>
				</form>
			</Modal>
		</div>
	)
}
