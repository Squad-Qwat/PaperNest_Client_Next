'use client'

import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, History, FileText, Clock, User, ArrowRight, MessageSquare, CheckCircle2, AlertCircle, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDocumentVersions, useDocumentReviews } from '@/lib/api/hooks/use-documents'
import { format, id } from '@/lib/date'
import Link from 'next/link'
import { ReviewStatusBadge } from '@/components/review/ReviewStatusBadge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useMemo } from 'react'
import { getAvatarUrl, getInitials } from '@/lib/utils'

export default function VersionsPage() {
	const params = useParams()
	const router = useRouter()
	const workspaceId = params.workspaceid as string
	const documentId = params.documentid as string

	const { data: versionsResponse, isLoading: versionsLoading } = useDocumentVersions(documentId)
	const { data: reviewsResponse, isLoading: reviewsLoading } = useDocumentReviews(documentId)

	const versions = Array.isArray(versionsResponse) 
		? versionsResponse 
		: (versionsResponse as any)?.versions || []

	const reviews = Array.isArray(reviewsResponse) 
		? reviewsResponse 
		: (reviewsResponse as any)?.reviews || []

	const isLoading = versionsLoading || reviewsLoading

	// Group versions by date
	const groupedVersions = useMemo(() => {
		if (!versions.length) return []

		const groups: { title: string; items: any[] }[] = []
		const now = new Date()
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
		const yesterday = today - 86400000

		versions.forEach((version: any) => {
			const date = new Date(version.createdAt)
			const time = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()

			let title = format(version.createdAt, 'd MMMM yyyy', { locale: id })
			if (time === today) title = 'Hari ini'
			else if (time === yesterday) title = 'Kemarin'

			const existingGroup = groups.find(g => g.title === title)
			if (existingGroup) {
				existingGroup.items.push(version)
			} else {
				groups.push({ title, items: [version] })
			}
		})

		return groups
	}, [versions])

	const latestVersion = versions[0]

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
							{versions.slice(0, 3).map((v: any, i: number) => {
								const dName = v.user?.name || v.user?.username || v.userId || 'User'
								return (
									<Avatar key={i} className='h-8 w-8 border-2 border-background'>
										<AvatarImage src={v.user?.photoURL || getAvatarUrl(dName, v.userId)} />
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
				{isLoading ? (
					<div className='space-y-8'>
						{Array.from({ length: 2 }).map((_, i) => (
							<div key={i} className='space-y-4'>
								<Skeleton className='h-6 w-32' />
								<div className='space-y-3'>
									<Skeleton className='h-24 w-full' />
									<Skeleton className='h-24 w-full' />
								</div>
							</div>
						))}
					</div>
				) : groupedVersions.length > 0 ? (
					<div className='space-y-10'>
						{groupedVersions.map((group, groupIdx) => (
							<section 
								key={group.title} 
								className='space-y-4'
							>
								<div className='flex items-center gap-4'>
									<h2 className='text-sm font-semibold text-muted-foreground'>
										{group.title}
									</h2>
									<div className='h-[1px] flex-1 bg-border' />
								</div>

								<div className='grid gap-3'>
									{group.items.map((version, idx) => {
										const versionReview = reviews.find((r: any) => r.documentBodyId === version.documentBodyId)
										const isLatest = groupIdx === 0 && idx === 0

										return (
											<div
												key={version.documentBodyId}
												className='group'
											>
												<Card className={`p-4 transition-colors hover:bg-muted/50 ${isLatest ? 'border-primary' : ''}`}>
													<div className='flex flex-col md:flex-row md:items-center gap-4'>
														{/* Version Meta */}
														<div className='flex items-center gap-4 md:w-48 shrink-0'>
															<div className={`h-10 w-10 shrink-0 rounded-md flex items-center justify-center ${isLatest ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
																<FileText className='w-5 h-5' />
															</div>
															<div className='flex flex-col'>
																<span className='text-sm font-medium'>
																	Versi #{String(version.versionNumber).padStart(3, '0')}
																</span>
																<div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
																	<Clock className='w-3 h-3' />
																	{format(version.createdAt, 'HH:mm')}
																	{isLatest && (
																		<>
																			<span className='mx-1'>&bull;</span>
																			<span className='text-primary font-medium'>Aktif</span>
																		</>
																	)}
																</div>
															</div>
														</div>

														{/* Content */}
														<div className='flex-1 min-w-0 flex flex-col justify-center space-y-2'>
															<div className='flex items-center gap-2'>
																{(() => {
																	const displayName = version.user?.name || version.user?.username || version.userId || 'User'
																	return (
																		<>
																			<Avatar className='h-5 w-5'>
																				<AvatarImage src={version.user?.photoURL || getAvatarUrl(displayName, version.userId)} />
																				<AvatarFallback className='text-[10px]'>{getInitials(displayName)}</AvatarFallback>
																			</Avatar>
																			<span className='text-sm text-muted-foreground'>{displayName}</span>
																		</>
																	)
																})()}
															</div>

															{versionReview ? (
																<div className='flex items-center gap-2'>
																	<ReviewStatusBadge status={versionReview.status} />
																	<span className='text-sm text-muted-foreground truncate'>
																		{versionReview.message}
																	</span>
																</div>
															) : (
																<div className='text-sm text-muted-foreground italic'>
																	Belum ada catatan review
																</div>
															)}
														</div>

														{/* Actions */}
														<div className='shrink-0 flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity'>
															{versionReview && (
																<Link href={`/${workspaceId}/reviews/${versionReview.reviewId}`}>
																	<Button variant='ghost' size='sm' className='h-8 px-3 text-muted-foreground'>
																		<MessageSquare className='mr-2 h-3.5 w-3.5' />
																		<span className='hidden md:inline'>Review</span>
																	</Button>
																</Link>
															)}
															<Link href={`/${workspaceId}/documents/${documentId}/versions/${version.documentBodyId}`}>
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
				) : (
					<div className='text-center py-20 border-2 border-dashed rounded-lg'>
						<div className='bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4'>
							<History className='w-6 h-6 text-muted-foreground' />
						</div>
						<h3 className='text-lg font-semibold'>Riwayat Kosong</h3>
						<p className='text-sm text-muted-foreground max-w-sm mx-auto mt-2'>
							Belum ada versi yang tersimpan.
						</p>
						<Button onClick={() => router.push(`/${workspaceId}/documents/${documentId}`)} variant='outline' className='mt-6'>
							Ke Editor
						</Button>
					</div>
				)}
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
