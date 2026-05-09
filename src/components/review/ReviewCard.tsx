import { FileText, ChevronRight, MessageSquare, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { ReviewStatusBadge } from './ReviewStatusBadge'
import { format, id } from '@/lib/date'

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
	title: string
	workspaceId: string
	versionNumber?: number
}

export function ReviewCard({
	reviewId,
	documentId,
	student,
	message,
	status,
	requestedAt,
	title,
	workspaceId,
	userRole,
	versionNumber,
}: ReviewCardProps) {
	const router = useRouter()
	
	const displayDate = format(requestedAt, 'd MMMM yyyy HH:mm', { locale: id })

	const studentName = student?.name || 'Student'
	const isLecturer = userRole?.toLowerCase() === 'lecturer'

	const handleCardClick = () => {
		if (isLecturer) {
			router.push(`/${workspaceId}/reviews/${reviewId}`)
		} else {
			router.push(`/${workspaceId}/documents/${documentId}`)
		}
	}

	return (
		<Card
			className="group relative bg-white border shadow-sm transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full hover:shadow-md hover:border-teal-500/50"
			onClick={handleCardClick}
		>
			<div className='p-6 space-y-4 flex-1 flex flex-col'>
				{/* Top Info */}
				<div className='flex items-start justify-between gap-4'>
					<div className='space-y-1'>
						<div className='flex items-center justify-between'>
							<div className='flex items-center gap-1.5'>
								<FileText className='w-3.5 h-3.5 text-teal-600' />
								<span className='text-[10px] font-bold text-gray-400 uppercase tracking-widest'>Document</span>
							</div>
							{versionNumber && (
								<span className='text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full'>
									Versi #{versionNumber.toString().padStart(3, '0')}
								</span>
							)}
						</div>
						<h3 className='text-lg font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-teal-600 transition-colors'>
							{title || 'Untitled Document'}
						</h3>
					</div>
					<div className='shrink-0'>
						<ReviewStatusBadge status={status as any} />
					</div>
				</div>

				{/* Message Snippet */}
				<div className='bg-gray-50/50 rounded-lg p-4 border border-gray-100 relative flex-1'>
					<div className='text-[9px] font-bold text-gray-400 uppercase tracking-tight mb-2'>Request:</div>
					<p className='text-sm text-gray-600 line-clamp-3 italic leading-relaxed'>
						"{message || 'Tidak ada pesan pengantar.'}"
					</p>
				</div>

				{/* Footer */}
				<div className='pt-4 flex items-center justify-between border-t border-gray-50 mt-auto'>
					<div className='flex flex-col gap-1'>
						<div className='flex items-center gap-2'>
							<div className={`w-1.5 h-1.5 rounded-full ${
								status === 'approved' ? 'bg-green-500' : 
								status === 'rejected' ? 'bg-red-500' : 
								status === 'revision_required' ? 'bg-amber-500' : 'bg-teal-500'
							}`} />
							<span className='text-sm font-bold text-gray-900'>{studentName}</span>
						</div>
						<div className='flex items-center gap-1.5 text-[10px] text-gray-400 pl-3'>
							<Clock className='w-3 h-3' />
							<span>{displayDate}</span>
						</div>
					</div>
					
					<div className='h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-teal-500 group-hover:text-white transition-all duration-300 shadow-inner'>
						<ChevronRight className='w-4 h-4' />
					</div>
				</div>
			</div>
		</Card>
	)
}
