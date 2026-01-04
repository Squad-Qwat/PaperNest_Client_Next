import { ArrowLeft, MoreVertical } from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { ReviewStatus, ReviewStatusBadge } from '@/components/review/ReviewStatusBadge'
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
}

export default function ModalVersions({ isOpen, onClose, documentId }: ModalVersionsProps) {
	const { user } = useAuthContext()
	const { versions, loading: versionsLoading } = useDocumentVersions(documentId)
	const { reviews, loading: reviewsLoading, requestReview } = useDocumentReviews(documentId)

	const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)

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

			// Map to UI format
			return {
				id: version.documentBodyId,
				timestamp: format(new Date(version.createdAt), 'd MMMM yyyy, HH:mm', { locale: id }),
				author: version.createdBy, // In real app, this would be a name, not ID. Assuming ID for now.
				color: index === 0 ? 'bg-purple-500' : 'bg-orange-500',
				isCurrent: index === 0,
				review: versionReview
					? {
							reviewer: {
								name: 'Lecturer', // Placeholder until user data is joined
								avatarUrl: undefined,
							},
							date: format(new Date(versionReview.requestedAt), 'd MMMM yyyy, HH:mm', {
								locale: id,
							}),
							status: versionReview.status,
							content: versionReview.message,
						}
					: undefined,
			}
		})
	}, [versions, reviews])

	const selectedVersion = versionsList.find((v) => v.id === selectedVersionId)

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
									<div className='prose max-w-none text-gray-500 italic text-center mt-20'>
										{/* Placeholder for content */}
										Content preview not implemented yet.
									</div>
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
													<span className='text-xs text-gray-600'>User</span>
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
								<Button className='w-full'>Pulihkan versi ini</Button>
							)}

                            {/* Student Request Review Button */}
                            {user?.role === 'Student' && selectedVersion && !selectedVersion.review && (
                                <Button 
                                    className='w-full' 
                                    variant='outline'
                                    onClick={async () => {
                                        // For now using prompt, ideally a modal
                                        const message = prompt('Pesan untuk dosen (opsional):', 'Mohon direview Pak/Bu')
                                        if (message === null) return // Cancelled

                                        // Hardcoded active lecturer for prototype or prompt
                                        // In real app, user selects from list.
                                        // For now assume user ID from ENV or known ID, or just asking via prompt for testing
                                        // "user_lecturer_123" is from docs.
                                        // Let's rely on a default simple string if no list available. 
                                        // The user said "endpoint logic" must be correct.
                                        const lecturerId = 'user_lecturer_123' // Fallback/Placeholder
                                        
                                        try {
                                           await requestReview(selectedVersion.id, lecturerId, message)
                                           alert('Permintaan review berhasil dikirim')
                                        } catch (e: any) {
                                            alert('Gagal meminta review: ' + e.message)
                                        }
                                    }}
                                >
                                    Minta Review
                                </Button>
                            )}
						</div>
					</div>
				</div>
			</div>
		</Modal>
	)
}
