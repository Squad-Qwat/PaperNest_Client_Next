'use client'

import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, FileText, Loader2, RotateCcw, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { useDocumentVersions, useDocumentReviews, useRevertVersion } from '@/lib/api/hooks/use-documents'
import { laTeXService } from '@/lib/latex/LaTeXService'
import { useDocumentFiles } from '@/lib/api/hooks/use-document-files'
import { format, id } from '@/lib/date'
import { ReviewStatusBadge } from '@/components/review/ReviewStatusBadge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { getAvatarUrl, getInitials } from '@/lib/utils'

export default function VersionDetailPage() {
	const params = useParams()
	const router = useRouter()
	const workspaceId = params.workspaceid as string
	const documentId = params.documentid as string
	const versionId = params.versionid as string

	const [pdfUrl, setPdfUrl] = useState<string | null>(null)
	const [isCompiling, setIsCompiling] = useState(false)
	const [compileError, setCompileError] = useState<string | null>(null)

	const { data: versionsResponse, isLoading: versionsLoading } = useDocumentVersions(documentId)
	const { data: reviewsResponse } = useDocumentReviews(documentId)
	const { data: files = [] } = useDocumentFiles(documentId)
	const { mutateAsync: revertVersion, isPending: isReverting } = useRevertVersion()

	const versions = Array.isArray(versionsResponse) 
		? versionsResponse 
		: (versionsResponse as any)?.versions || []
	
	const version = versions.find((v: any) => v.documentBodyId === versionId)
	const reviews = Array.isArray(reviewsResponse) 
		? reviewsResponse 
		: (reviewsResponse as any)?.reviews || []
	const versionReview = reviews.find((r: any) => r.documentBodyId === versionId)

	const handleCompile = useCallback(async (content: string) => {
		if (!content) return
		setIsCompiling(true)
		setCompileError(null)
		try {
			const result = await laTeXService.compileWithAssets('main.tex', content, files)
			if (result.status === 0 && result.pdf) {
				const blob = new Blob([result.pdf as any], { type: 'application/pdf' })
				const url = URL.createObjectURL(blob)
				// We'll manage the revocation in a separate effect to avoid logic loops
				setPdfUrl(url)
			} else {
				setCompileError(result.log || 'Compilation failed')
			}
		} catch (error: any) {
			setCompileError(error.message || 'Error compiling PDF')
		} finally {
			setIsCompiling(false)
		}
	}, [files]) // Removed pdfUrl from dependencies

	useEffect(() => {
		if (version?.content && !pdfUrl && !isCompiling && !compileError) {
			handleCompile(version.content)
		}
	}, [version?.content, handleCompile, pdfUrl, isCompiling, compileError])

	useEffect(() => {
		return () => {
			if (pdfUrl) URL.revokeObjectURL(pdfUrl)
		}
	}, [pdfUrl])

	const handleRestore = async () => {
		if (!version) return
		try {
			await revertVersion({ documentId, versionNumber: version.versionNumber })
			toast.success('Versi berhasil dipulihkan')
			router.push(`/${workspaceId}/documents/${documentId}`)
		} catch (e: any) {
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
				<Button variant='outline' onClick={() => router.back()}>Kembali</Button>
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
							<h1 className='text-sm font-semibold tracking-tight'>Detail Versi #{String(version.versionNumber).padStart(3, '0')}</h1>
							<p className='text-xs text-muted-foreground'>
								{format(version.createdAt, 'd MMMM yyyy, HH:mm', { locale: id })}
							</p>
						</div>
					</div>

					<div className='flex items-center gap-3'>
						{versionReview && (
							<Link href={`/${workspaceId}/reviews/${versionReview.reviewId}`}>
								<Button variant='outline' size='sm' className='gap-2'>
									<MessageSquare className='w-4 h-4' />
									<span className='hidden sm:inline'>Lihat Review</span>
								</Button>
							</Link>
						)}
						<Button size='sm' className='gap-2' onClick={handleRestore} disabled={isReverting}>
							<RotateCcw className='w-4 h-4' />
							<span className='hidden sm:inline'>{isReverting ? 'Memulihkan...' : 'Pulihkan Versi Ini'}</span>
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

				<div className='w-full lg:w-80 flex flex-col shrink-0 gap-6 overflow-y-auto'>
					<Card className='p-5 space-y-5 rounded-lg'>
						<div className='border-b pb-3'>
							<h3 className='text-sm font-semibold text-foreground'>Metadata Versi</h3>
						</div>
						
						<div className='space-y-4'>
							<div className='flex items-center gap-3'>
								{(() => {
									const displayName = version.user?.name || version.user?.username || version.userId || 'User'
									return (
										<>
											<Avatar className='h-9 w-9 border'>
												<AvatarImage src={version.user?.photoURL || getAvatarUrl(displayName, version.userId)} />
												<AvatarFallback className='text-xs'>{getInitials(displayName)}</AvatarFallback>
											</Avatar>
											<div className='flex flex-col'>
												<span className='text-sm font-medium'>{displayName}</span>
												<span className='text-xs text-muted-foreground'>Author</span>
											</div>
										</>
									)
								})()}
							</div>
							
							{versionReview && (
								<div className='pt-3 border-t space-y-3'>
									<div>
										<p className='text-xs font-medium text-muted-foreground mb-2'>Status Review</p>
										<ReviewStatusBadge status={versionReview.status} />
									</div>
									<div className='bg-muted/50 p-3 rounded-md'>
										<p className='text-sm text-foreground italic'>
											"{versionReview.message}"
										</p>
									</div>
								</div>
							)}
						</div>
					</Card>
				</div>
			</main>
		</div>
	)
}
