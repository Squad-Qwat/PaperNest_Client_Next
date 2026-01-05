import { ArrowLeft, MoreVertical } from 'lucide-react'
import { useParams } from 'next/navigation'
import React, { useMemo, useState } from 'react'
import { ReviewRequestModal } from '@/components/review/ReviewRequestModal'
import { ReviewStatusBadge } from '@/components/review/ReviewStatusBadge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuthContext } from '@/context/AuthContext'
import { useDocumentReviews, useDocumentVersions } from '@/hooks/useDocumentVersions'
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

	const { user } = useAuthContext()
	const { versions, loading: versionsLoading, rollbackVersion } = useDocumentVersions(documentId)
	const { reviews, requestReview } = useDocumentReviews(documentId)

	const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
	const [isRollingBack, setIsRollingBack] = useState(false)
	const [showReviewModal, setShowReviewModal] = useState(false)

	// Set initial selected version to latest when data loads
	React.useEffect(() => {
		if (versions.length > 0 && !selectedVersionId) {
			setSelectedVersionId(versions[0].documentBodyId)
		}
	}, [versions, selectedVersionId])

	// Merge Version and Review Data
	const versionsList = useMemo(() => {
		return versions.map((version, index) => {
			// Find review for this version
			const versionReview = reviews.find((r) => r.documentBodyId === version.documentBodyId)

			// Resolve Author Name
			// If the ID matches current user, use their name.
			// "atau ga yang terlogin saja" -> Fallback to current user name if missing
			let authorName = version.createdBy
			if (user && (version.createdBy === user.id || !version.createdBy)) {
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
			setIsRollingBack(true)
			await rollbackVersion(selectedVersion.versionNumber)
			if (onVersionRestored) {
				onVersionRestored()
			}
			onClose() // Close modal on success
			alert('Versi berhasil dipulihkan') // Simple feedback
		} catch (error: any) {
			console.error('Rollback failed:', error)
			alert('Gagal memulihkan versi: ' + error.message)
		} finally {
			setIsRollingBack(false)
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
				<div className='h-14 border-b flex items-center justify-between px-4 shrink-0'>
					<div className='flex items-center gap-4'>
						<Button
							variant='ghost'
							size='icon'
							onClick={onClose}
							className='rounded-full hover:bg-gray-100'
						>
							<ArrowLeft className='h-5 w-5 text-gray-600' />
						</Button>
						<div className='flex flex-col'>
							<span className='text-sm font-medium text-gray-900'>Riwayat versi</span>
							<span className='text-xs text-gray-500'>
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

				<div className='flex-1 flex overflow-hidden'>
					<div className='flex-1 bg-gray-100 relative flex flex-col min-w-0'>
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

								{/* Document Page Mockup */}
								<div className='bg-white shadow-sm w-[816px] min-h-[1056px] p-12 border border-gray-200 shrink-0'>
									{selectedVersion?.content ? (
										<div
											className='prose max-w-none'
											dangerouslySetInnerHTML={{ __html: selectedVersion.content }}
										/>
									) : (
										<div className='prose max-w-none text-gray-500 italic text-center mt-20'>
											No content available for this version.
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
						await requestReview(selectedVersion.id, data.lecturerId, data.message)
						alert('Permintaan review berhasil dikirim')
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
