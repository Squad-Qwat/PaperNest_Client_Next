import { ArrowLeft, ChevronLeft, MoreVertical, Loader2, FileText } from 'lucide-react'
import { useParams } from 'next/navigation'
import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { ReviewRequestModal } from '@/components/review/ReviewRequestModal'
import { ReviewStatusBadge } from '@/components/review/ReviewStatusBadge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { laTeXService } from '@/lib/latex/LaTeXService'
import { useDocumentFiles } from '@/lib/api/hooks/use-document-files'
import {
	useDocumentVersions,
	useDocumentReviews,
	useRevertVersion,
	useCreateReview,
} from '@/lib/api/hooks/use-documents'
import type { Version } from '@/lib/api/types/document.types'
import type { Review } from '@/lib/api/types/review.types'
import { format, id } from '@/lib/date'

interface ModalVersionsProps {
	isOpen: boolean
	onClose: () => void
	documentId: string
	onVersionRestored?: () => void
}

export default function ModalVersions({
	isOpen,
	onClose,
	documentId: propDocumentId,
	onVersionRestored,
}: ModalVersionsProps) {
	const params = useParams()
	// Prioritize prop, fallback to param (users note: "dapatkan param documentid saja")
	// But since we fixed the parent passing it, prop should work.
	// However, user specifically asked to "try getting param documentid only".
	// So let's extract it from params if prop is missing OR to be safe.
	// Actually, let's trust the prop if passed, but if not, use param.
	const documentId = propDocumentId || (params?.documentid as string)

	const { user } = useAuth()

	const { data: versionsResponse, isLoading: versionsLoading } = useDocumentVersions(documentId)
	// Handle robust response parsing if response is different format
	let versions: Version[] = []
	if (versionsResponse && Array.isArray((versionsResponse as any).versions)) {
		versions = (versionsResponse as any).versions
	} else if (Array.isArray(versionsResponse)) {
		versions = versionsResponse as Version[]
	}

	const { data: reviewsResponse } = useDocumentReviews(documentId)
	let reviews: Review[] = []
	if (reviewsResponse && Array.isArray((reviewsResponse as any).reviews)) {
		reviews = (reviewsResponse as any).reviews
	} else if (Array.isArray(reviewsResponse)) {
		reviews = reviewsResponse as Review[]
	}

	const { mutateAsync: revertVersionMutate, isPending: isRollingBack } = useRevertVersion()
	const { mutateAsync: requestReviewMutate } = useCreateReview()
	const { data: files = [] } = useDocumentFiles(documentId)

	const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
	const [showReviewModal, setShowReviewModal] = useState(false)
	const [pdfUrl, setPdfUrl] = useState<string | null>(null)
	const [isCompiling, setIsCompiling] = useState(false)
	const [compileError, setCompileError] = useState<string | null>(null)

	// Function to compile LaTeX to PDF
	const handleCompile = useCallback(async (content: string) => {
		if (!content) return

		setIsCompiling(true)
		setCompileError(null)
		
		try {
			// Using server mode for preview consistency in modal
			const result = await laTeXService.compileWithAssets('main.tex', content, files)
			
			if (result.status === 0 && result.pdf) {
				// Use Uint8Array directly, but cast to any or use it in the array to satisfy TypeScript's BlobPart requirement
				const blob = new Blob([result.pdf as any], { type: 'application/pdf' })
				const url = URL.createObjectURL(blob)
				
				// Revoke old URL to prevent memory leaks
				if (pdfUrl) URL.revokeObjectURL(pdfUrl)
				setPdfUrl(url)
			} else {
				setCompileError(result.log || 'Compilation failed')
			}
		} catch (error: any) {
			console.error('Compilation error in ModalVersions:', error)
			setCompileError(error.message || 'Error compiling PDF')
		} finally {
			setIsCompiling(false)
		}
	}, [files, pdfUrl])

	// const { toast } = useToast()

	// Set initial selected version to latest when data loads
	React.useEffect(() => {
		if (versions.length > 0 && !selectedVersionId) {
			setSelectedVersionId(versions[0].documentBodyId)
		}
	}, [versions, selectedVersionId])

	// Compile when version selection changes
	useEffect(() => {
		const version = versionsList.find(v => v.id === selectedVersionId)
		if (isOpen && version?.content) {
			handleCompile(version.content)
		}
	}, [selectedVersionId, isOpen])

	// Cleanup on unmount or close
	useEffect(() => {
		return () => {
			if (pdfUrl) URL.revokeObjectURL(pdfUrl)
		}
	}, [pdfUrl])

	// Merge Version and Review Data
	const versionsList = useMemo(() => {
		return versions.map((version, index) => {
			// Find review for this version
			const versionReview = reviews.find((r) => r.documentBodyId === version.documentBodyId)

			// Resolve Author Name
			// If the ID matches current user, use their name.
			// "atau ga yang terlogin saja" -> Fallback to current user name if missing
			let authorName = version.createdBy
			if (user && (version.createdBy === user.userId || !version.createdBy)) {
				authorName = user.name || 'User'
			}

			// Map to UI format
			return {
				id: version.documentBodyId,
				versionNumber: version.versionNumber,
				timestamp: format(version.createdAt, 'd MMMM yyyy, HH:mm', { locale: id }),
				author: authorName,
				color: index === 0 ? 'bg-purple-500' : 'bg-orange-500',
				isCurrent: index === 0,
				content: version.content,
				review: versionReview
					? {
							reviewer: {
								name: versionReview.lecturerUserId || 'Lecturer', // Use ID if no name
								avatarUrl: undefined,
							},
							date: format(versionReview.requestedAt, 'd MMMM yyyy, HH:mm', {
								locale: id,
							}),
							status: versionReview.status,
							content: versionReview.message,
						}
					: undefined,
			}
		})
	}, [versions, reviews, user])

	const selectedVersion = versionsList.find((v) => v.id === selectedVersionId)

	const handleRollback = async () => {
		if (!selectedVersion) return

		try {
			await revertVersionMutate({ documentId, versionNumber: selectedVersion.versionNumber })
			if (onVersionRestored) {
				onVersionRestored()
			}
			onClose() // Close modal on success
			toast.success('Versi dipulihkan', {
				description: 'Dokumen telah dikembalikan ke versi yang dipilih.',
			})
		} catch (error: any) {
			console.error('Rollback failed:', error)
			toast.error('Gagal memulihkan versi', {
				description: error.message || 'Terjadi kesalahan saat memulihkan versi.',
			})
		}
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			size='full'
			showCloseButton={false}
			title='Riwayat versi'
			visuallyHiddenTitle={true}
		>
			<div className='flex flex-col h-screen w-full bg-white'>
				<div className='h-20 border-b flex items-center justify-between px-3'>
					<div className='flex items-center gap-4'>
						<Button
							variant='ghost'
							onClick={onClose}
							className='p-2 hover:bg-gray-100 rounded-lg transition-colors group'
							title='Back'
						>
							<ChevronLeft className='h-5 w-5 text-gray-500 group-hover:text-primary transition-colors' />
						</Button>
						<div className='flex flex-col'>
							<span className='text-xl font-medium text-gray-900'>Riwayat versi</span>
							<span className='text-md text-gray-500'>
								{selectedVersion
									? selectedVersion.timestamp
									: versionsLoading
										? 'Loading...'
										: 'No version selected'}
							</span>
						</div>
					</div>

					<div className='flex items-center gap-2'></div>
				</div>

				<div className='flex-1 flex overflow-hidden h-full'>
					<div className='flex-1 bg-gray-100 relative h-full flex flex-col min-w-0'>
						<ScrollArea className='h-full w-full'>
							<div className='flex flex-col items-center p-8 min-h-full gap-6'>
								{/* Review Card */}
								{selectedVersion?.review && (
									<div className='w-[816px] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden shrink-0'>
										<div className='p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50'>
											<div className='flex items-center gap-3'>
												<Avatar className='h-8 w-8 border border-gray-200'>
													<AvatarImage src={selectedVersion.review.reviewer.avatarUrl} />
													<AvatarFallback className='text-xs bg-blue-50 text-blue-600 font-medium'>
														L
													</AvatarFallback>
												</Avatar>
												<div className='flex flex-col'>
													<span className='text-sm font-medium text-gray-900'>
														{selectedVersion.review.reviewer.name}
													</span>
													<span className='text-xs text-gray-500'>
														Ditinjau pada {selectedVersion.review.date}
													</span>
												</div>
											</div>
											<ReviewStatusBadge status={selectedVersion.review.status} />
										</div>
										{selectedVersion.review.content && (
											<div className='p-4 text-sm text-gray-700 leading-relaxed bg-white'>
												{selectedVersion.review.content}
											</div>
										)}
									</div>
								)}

								{/* PDF Viewer Mockup */}
								<div className='bg-gray-200 shadow-sm w-[816px] aspect-[1/1.414] border border-gray-300 shrink-0 flex items-center justify-center relative overflow-hidden'>
									{isCompiling ? (
										<div className='flex flex-col items-center gap-3 text-gray-500'>
											<Loader2 className='w-10 h-10 animate-spin opacity-50' />
											<span className='text-sm font-medium'>Menyiapkan Preview PDF...</span>
										</div>
									) : pdfUrl ? (
										<iframe
											src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
											className='w-full min-h-full border-none'
											title='PDF Preview'
										/>
									) : compileError ? (
										<div className='flex flex-col items-center gap-3 p-8 text-center'>
											<FileText className='w-12 h-12 text-red-200' />
											<div className='space-y-1'>
												<p className='text-sm font-medium text-red-600'>Gagal Memuat Preview</p>
												<p className='text-xs text-gray-500 max-w-xs line-clamp-3'>
													{compileError}
												</p>
											</div>
											<Button 
												variant="outline" 
												size="sm" 
												onClick={() => selectedVersion?.content && handleCompile(selectedVersion.content)}
											>
												Coba Lagi
											</Button>
										</div>
									) : (
										<div className='flex flex-col items-center gap-2 text-gray-400'>
											<FileText className='w-10 h-10 opacity-20' />
											<p className='text-sm italic'>Pilih versi untuk melihat pratinjau</p>
										</div>
									)}
								</div>
							</div>
						</ScrollArea>
					</div>

					<div className='w-80 bg-white border-l shadow-sm flex flex-col shrink-0 z-10'>
						<div className='p-4 border-b flex items-center justify-between'>
							<h3 className='font-medium text-gray-700'>Riwayat versi</h3>
						</div>

						<ScrollArea className='flex-1'>
							<div className='py-2'>
								<div className='px-4 py-2 text-xs font-medium text-gray-500'>
									{versionsLoading ? 'Memuat...' : 'Versi Dokumen'}
								</div>

								{versionsList.map((version) => (
									<div
										key={version.id}
										onClick={() => setSelectedVersionId(version.id)}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												setSelectedVersionId(version.id)
											}
										}}
										role='button'
										tabIndex={0}
										className={`px-4 py-3 cursor-pointer group transition-colors relative ${
											selectedVersionId === version.id ? 'bg-blue-50' : 'hover:bg-gray-50'
										}`}
									>
										<div className='flex items-start justify-between'>
											<div>
												<div className='text-sm font-medium text-gray-900 mb-1'>
													{version.timestamp}
												</div>
												<div className='flex items-center gap-2'>
													<div className={`w-2 h-2 rounded-full ${version.color}`} />
													<span className='text-xs text-gray-600'>
														{version.author || 'Unknown'}
													</span>
												</div>
											</div>
											<Button
												variant='ghost'
												size='icon'
												className='h-6 w-6 opacity-0 group-hover:opacity-100'
											>
												<MoreVertical className='h-4 w-4' />
											</Button>
										</div>
									</div>
								))}
							</div>
						</ScrollArea>

						<div className='p-4 border-t space-y-3'>
							{selectedVersion?.isCurrent ? (
								<div className='text-center text-sm text-gray-500 py-2'>Versi saat ini</div>
							) : (
								<Button className='w-full' onClick={handleRollback} disabled={isRollingBack}>
									{isRollingBack ? 'Memulihkan...' : 'Pulihkan versi ini'}
								</Button>
							)}

							{/* Student Request Review Button */}
							{user?.role === 'Student' && selectedVersion && !selectedVersion.review && (
								<Button
									className='w-full'
									variant='outline'
									onClick={() => setShowReviewModal(true)}
								>
									Minta Review
								</Button>
							)}
						</div>
					</div>
				</div>
			</div>

			<ReviewRequestModal
				isOpen={showReviewModal}
				onClose={() => setShowReviewModal(false)}
				onSubmit={async (data) => {
					if (!selectedVersion) return
					try {
						await requestReviewMutate({
							documentId,
							documentBodyId: selectedVersion.id,
							data: { lecturerUserId: data.lecturerId, message: data.message },
						})
						toast.success('Permintaan Terkirim', {
							description: 'Permintaan review Anda telah dikirim ke dosen.',
						})
						setShowReviewModal(false)
					} catch (e: any) {
						console.error('Review request failed', e)
						throw e
					}
				}}
			/>
		</Modal>
	)
}
