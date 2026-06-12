import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { format, id } from '@/lib/date'
import { ReviewStatusBadge } from './ReviewStatusBadge'

interface ReviewCardProps {
	reviewId: string
	documentId: string
	lecturerUserId: string
	studentUserId?: string
	userRole?: string
	student?: {
		name: string
		photoURL: string | null
	}
	lecturer?: {
		name: string
		photoURL: string | null
	}
	message: string
	status: string
	requestedAt: string | Date
	title?: string
	workspaceId: string
	versionNumber?: number
	isDocumentDeleted?: boolean
}

export function ReviewCard({
	reviewId,
	message,
	status,
	requestedAt,
	title,
	workspaceId,
	versionNumber,
	isDocumentDeleted = false,
}: Readonly<ReviewCardProps>) {
	const router = useRouter()

	const displayDate = format(requestedAt, 'd MMMM yyyy HH:mm', { locale: id })

	const handleCardClick = () => {
		router.push(`/${workspaceId}/reviews/${reviewId}`)
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault()
			handleCardClick()
		}
	}

	return (
		// biome-ignore lint/a11y/useSemanticElements: wrapper contains nested interactive button
		<div
			className='bg-card border border-border rounded-lg p-6 hover:border-primary transition-all group relative text-left w-full flex flex-col h-full cursor-pointer'
			onClick={handleCardClick}
			onKeyDown={handleKeyDown}
			role='button'
			tabIndex={0}
		>
			{/* Top: Title and Status Badge */}
			<div className='flex items-start justify-between gap-4 mb-2.5'>
				<h3
					className={`text-lg font-semibold line-clamp-2 leading-snug transition-colors flex-1 ${
						isDocumentDeleted
							? 'text-muted-foreground italic'
							: 'text-foreground group-hover:text-primary'
					}`}
				>
					{isDocumentDeleted ? 'Dokumen Terhapus' : title || 'Dokumen Tanpa Judul'}
				</h3>
				<div className='shrink-0 scale-95 origin-right'>
					<ReviewStatusBadge status={status as any} />
				</div>
			</div>

			{/* Meta: Version and Date (Date replaces student name) */}
			<div className='flex items-center gap-2 text-xs text-muted-foreground mb-3'>
				{versionNumber && (
					<span className='font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded'>
						Versi V{versionNumber}
					</span>
				)}
				<span>{displayDate}</span>
			</div>

			{/* Middle: Request Message (Plain text description style, non-italic) */}
			<p className='text-muted-foreground text-sm mb-4 line-clamp-2 min-h-[40px] leading-relaxed font-normal'>
				{message || 'Tidak ada pesan pengantar.'}
			</p>

			{/* Footer: Button "Lihat Detail" (Matches the dashboard "Open Editor" button layout and classes) */}
			<div className='flex gap-2 items-center w-full mt-auto'>
				<Button
					onClick={(e) => {
						e.stopPropagation()
						handleCardClick()
					}}
					className='flex-1 h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-lg transition-all shadow-sm'
				>
					Lihat Detail
				</Button>
			</div>
		</div>
	)
}
