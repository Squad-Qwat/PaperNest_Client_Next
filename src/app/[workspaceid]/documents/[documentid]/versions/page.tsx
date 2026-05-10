'use client'

import { ArrowRight, ChevronLeft, Clock, FileText, History, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { ReviewStatusBadge } from '@/components/review/ReviewStatusBadge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDocumentReviews, useDocumentVersions } from '@/lib/api/hooks/use-documents'
import { useWorkspaceMembers } from '@/lib/api/hooks/use-workspaces'
import type { Version } from '@/lib/api/types/document.types'
import type { Review } from '@/lib/api/types/review.types'
import { format, id } from '@/lib/date'
import { getAvatarUrl, getInitials } from '@/lib/utils'

export default function VersionsPage() {
	const params = useParams()
	const router = useRouter()
	const workspaceId = params.workspaceid as string
	const documentId = params.documentid as string

	const { data: versionsResponse, isLoading: versionsLoading } = useDocumentVersions(documentId)
	const { data: reviewsResponse, isLoading: reviewsLoading } = useDocumentReviews(documentId)
	const { data: membersResponse } = useWorkspaceMembers(workspaceId)

	const members = membersResponse?.members || []

	const versions = Array.isArray(versionsResponse)
		? versionsResponse
		: (versionsResponse as { versions: Version[] })?.versions || []

	const reviews = Array.isArray(reviewsResponse)
		? reviewsResponse
		: (reviewsResponse as { reviews: Review[] })?.reviews || []

	const isLoading = versionsLoading || reviewsLoading

	// Group versions by date
	const groupedVersions = useMemo(() => {
		if (!versions.length) return []

		const groups: { title: string; items: any[] }[] = []
		const now = new Date()
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
		const yesterday = today - 86400000

		versions.forEach((version: Version) => {
			const date = new Date(version.createdAt)
			const time = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()

			let title = format(version.createdAt, 'd MMMM yyyy', { locale: id })
			if (time === today) title = 'Hari ini'
			else if (time === yesterday) title = 'Kemarin'

			const existingGroup = groups.find((g) => g.title === title)
			if (existingGroup) {
				existingGroup.items.push(version)
			} else {
				groups.push({ title, items: [version] })
			}
		})

		return groups
	}, [versions])

	const _latestVersion = versions[0]

	const renderVersionsContent = () => {
		if (isLoading) {
			return (
				<div className='space-y-8'>
					{[1, 2].map((i) => (
						<div key={`skeleton-item-${i}`} className='space-y-4'>
							<Skeleton className='h-6 w-32' />
							<div className='space-y-3'>
								<Skeleton className='h-24 w-full' />
								<Skeleton className='h-24 w-full' />
							</div>
						</div>
					))}
				</div>
			)
		}

		if (groupedVersions.length > 0) {
			return (
				<div className='space-y-10'>
					{groupedVersions.map((group, groupIdx) => (
						<section key={group.title} className='space-y-4'>
							<div className='flex items-center gap-4'>
								<h2 className='text-sm font-semibold text-muted-foreground'>{group.title}</h2>
								<div className='h-px flex-1 bg-border' />
							</div>

							<div className='grid gap-3'>
								{group.items.map((version, idx) => {
									const versionReview = reviews.find(
										(r: Review) => r.documentBodyId === version.documentBodyId
									)
									const isLatest = groupIdx === 0 && idx === 0

									const getCardStyles = () => {
										if (isLatest) return 'border-l-blue-600 bg-blue-50/30 ring-1 ring-blue-100'
										if (!versionReview) return 'border-l-gray-300'
										return versionReview.status === 'approved'
											? 'border-l-green-500'
											: 'border-l-amber-500'
									}

									return (
										<div key={version.documentBodyId} className='group'>
											<Card
												className={`p-5 transition-all duration-300 border-l-4 ${getCardStyles()} hover:shadow-md group-hover:translate-x-1`}
											>
												<div className='flex flex-col md:flex-row md:items-start gap-6'>
													{/* Version Meta */}
													<div className='flex items-center gap-4 md:w-48 shrink-0'>
														<div
															className={`h-12 w-12 shrink-0 rounded-xl flex items-center justify-center shadow-sm ${
																isLatest
																	? 'bg-blue-600 text-white'
																	: 'bg-white border border-gray-200 text-gray-400'
															}`}
														>
															<FileText className='w-6 h-6' />
														</div>
														<div className='flex flex-col'>
															<div className='flex items-center gap-2'>
																<span className='text-sm font-bold text-gray-900'>
																	Versi #{String(version.versionNumber).padStart(3, '0')}
																</span>
																{!versionReview && !isLatest && (
																	<span className='text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded uppercase'>
																		Snapshot
																	</span>
																)}
															</div>
															<div className='flex items-center gap-1.5 text-xs text-gray-500 mt-0.5'>
																<Clock className='w-3 h-3' />
																{format(version.createdAt, 'HH:mm')}
																{isLatest && (
																	<span className='ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-md font-bold text-[10px] uppercase tracking-wider'>
																		Active
																	</span>
																)}
															</div>
														</div>
													</div>

													{/* Content */}
													<div className='flex-1 min-w-0 flex flex-col justify-center space-y-2'>
														<div className='flex items-center gap-2'>
															{(() => {
																const member = members.find(
																	(m: any) =>
																		m.userId === version.userId || m.user?.userId === version.userId
																)
																const displayName =
																	version.user?.name || member?.user?.name || 'User'

																const isUid = displayName.length > 20 && !displayName.includes(' ')
																const finalName = isUid ? 'User' : displayName

																return (
																	<>
																		<Avatar className='h-5 w-5'>
																			<AvatarImage
																				src={
																					version.user?.photoURL ||
																					member?.user?.photoURL ||
																					getAvatarUrl(displayName, version.userId)
																				}
																			/>
																			<AvatarFallback className='text-[10px]'>
																				{getInitials(displayName)}
																			</AvatarFallback>
																		</Avatar>
																		<span className='text-sm text-muted-foreground'>
																			{finalName}
																		</span>
																	</>
																)
															})()}
														</div>

														{versionReview ? (
															<div className='flex flex-col gap-3'>
																{/* Student Request Message - Always from version.message (Commit Message) */}
																<div className='flex items-start gap-2 group/msg'>
																	<div className='mt-1 p-1 bg-blue-50 rounded text-blue-600 shrink-0'>
																		<MessageSquare className='w-3 h-3' />
																	</div>
																	<div className='flex flex-col'>
																		<span className='text-[10px] font-bold text-blue-500 uppercase tracking-tight leading-none mb-1'>
																			Student Request
																		</span>
																		<p className='text-sm text-gray-700 leading-tight'>
																			{version.message || 'No commit message.'}
																		</p>
																	</div>
																</div>

																{/* Lecturer Feedback Message */}
																{versionReview.status !== 'pending' && (
																	<div className='flex items-center gap-3 pt-1'>
																		<ReviewStatusBadge status={versionReview.status} />
																		{/* Logic for legacy data: if lecturerMessage is empty, use review.message as lecturer message */}
																		{(() => {
																			const feedback =
																				versionReview.lecturerMessage || versionReview.message
																			// Only show if it's different from the version message or explicitly provided
																			if (feedback) {
																				return (
																					<div className='flex items-start gap-2 border-l-2 border-gray-100 pl-3'>
																						<div className='flex flex-col'>
																							<span className='text-[10px] font-bold text-gray-400 uppercase tracking-tight leading-none mb-1'>
																								Lecturer Feedback
																							</span>
																							<p className='text-sm text-gray-600 italic leading-tight'>
																								"{feedback}"
																							</p>
																						</div>
																					</div>
																				)
																			}
																			return null
																		})()}
																	</div>
																)}
															</div>
														) : (
															<div className='text-sm text-muted-foreground italic flex items-center gap-2'>
																<div className='w-1 h-1 bg-gray-300 rounded-full' />
																Belum ada catatan review
															</div>
														)}
													</div>

													{/* Actions */}
													<div className='shrink-0 flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity'>
														{versionReview && (
															<Link href={`/${workspaceId}/reviews/${versionReview.reviewId}`}>
																<Button
																	variant='ghost'
																	size='sm'
																	className='h-8 px-3 text-muted-foreground'
																>
																	<MessageSquare className='mr-2 h-3.5 w-3.5' />
																	<span className='hidden md:inline'>Review</span>
																</Button>
															</Link>
														)}
														<Link
															href={`/${workspaceId}/documents/${documentId}/versions/${version.documentBodyId}`}
														>
															<Button variant='secondary' size='sm' className='h-8 px-3'>
																Buka
																<ArrowRight className='ml-2 h-3.5 w-3.5' />
															</Button>
														</Link>
													</div>
												</div>
											</Card>
										</div>
									)
								})}
							</div>
						</section>
					))}
				</div>
			)
		}

		return (
			<div className='text-center py-20 border-2 border-dashed rounded-lg'>
				<div className='bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4'>
					<History className='w-6 h-6 text-muted-foreground' />
				</div>
				<h3 className='text-lg font-semibold'>Riwayat Kosong</h3>
				<p className='text-sm text-muted-foreground max-w-sm mx-auto mt-2'>
					Belum ada versi yang tersimpan.
				</p>
				<Button
					onClick={() => router.push(`/${workspaceId}/documents/${documentId}`)}
					variant='outline'
					className='mt-6'
				>
					Ke Editor
				</Button>
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-background flex flex-col font-sans'>
			<header className='bg-background border-b sticky top-0 z-50 py-4'>
				<div className='w-full px-4 md:px-6 flex items-center justify-between'>
					<div className='flex items-center gap-4'>
						<Button
							variant='ghost'
							onClick={() => router.push(`/${workspaceId}/documents/${documentId}`)}
							className='h-10 w-10 hover:bg-muted rounded-lg transition-all group p-0 min-w-0 shrink-0'
							title='Kembali ke Editor'
						>
							<ChevronLeft className='h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors' />
						</Button>
						<div className='flex flex-col'>
							<div className='flex items-center gap-3'>
								<h1 className='text-xl font-semibold tracking-tight'>Riwayat Versi</h1>
								<div className='bg-muted px-2 py-0.5 rounded-md'>
									<span className='text-xs font-medium text-muted-foreground'>
										{versions.length}
									</span>
								</div>
							</div>
							<p className='text-sm text-muted-foreground'>Monitor jejak perubahan dokumen</p>
						</div>
					</div>

					<div className='hidden md:flex items-center gap-3'>
						<div className='flex -space-x-2'>
							{versions.slice(0, 3).map((v: Version) => {
								const member = members.find(
									(m: any) => m.userId === v.userId || m.user?.userId === v.userId
								)
								const dName = v.user?.name || member?.user?.name || 'User'
								return (
									<Avatar key={v.documentBodyId} className='h-8 w-8 border-2 border-background'>
										<AvatarImage
											src={
												v.user?.photoURL || member?.user?.photoURL || getAvatarUrl(dName, v.userId)
											}
										/>
										<AvatarFallback className='text-[10px] bg-blue-50 text-blue-600'>
											{getInitials(dName)}
										</AvatarFallback>
									</Avatar>
								)
							})}
							{versions.length > 3 && (
								<Avatar className='h-8 w-8 border-2 border-background flex items-center justify-center bg-muted'>
									<AvatarFallback className='text-xs text-muted-foreground'>
										+{versions.length - 3}
									</AvatarFallback>
								</Avatar>
							)}
						</div>
					</div>
				</div>
			</header>

			<main className='flex-1 px-4 md:px-6 py-6 w-full overflow-y-auto mb-16'>
				{renderVersionsContent()}
			</main>

			<footer className='py-6 border-t'>
				<div className='w-full px-4 md:px-6 flex justify-between items-center text-xs text-muted-foreground'>
					<span>PaperNest</span>
					<span>© 2026</span>
				</div>
			</footer>
		</div>
	)
}
