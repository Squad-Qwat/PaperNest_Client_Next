import { FileText, Clock, User as UserIcon, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReviewStatusBadge } from './ReviewStatusBadge'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

interface ReviewHeroProps {
	docTitle: string
	studentName: string
	formattedDate: string
	status: string
	documentId: string
	workspaceId: string
	isDeleted?: boolean
}

export function ReviewHero({
	docTitle,
	studentName,
	formattedDate,
	status,
	documentId,
	workspaceId,
	isDeleted = false,
}: ReviewHeroProps) {
	const router = useRouter()

	return (
		<div className='bg-white rounded-xl border shadow-sm p-5 md:p-6 relative overflow-hidden'>
			<div className='absolute top-0 right-0 p-6 opacity-5 pointer-events-none'>
				<FileText size={100} />
			</div>
			
			<div className='flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10'>
				<div className='space-y-3'>
					<div className='flex items-center gap-2.5'>
						<div className='p-1.5 bg-teal-50 rounded-lg'>
							<FileText className='w-5 h-5 text-teal-600' />
						</div>
						<h1 className={`text-xl md:text-2xl font-bold tracking-tight ${
							isDeleted ? 'text-gray-400 italic' : 'text-gray-900'
						}`}>
							{isDeleted ? 'Deleted Document' : (docTitle || 'Untitled Document')}
						</h1>
					</div>
					
					<div className='flex flex-wrap items-center gap-2 text-sm'>
						<Badge variant="secondary" className='font-medium px-2.5 py-0.5 flex items-center gap-1.5 bg-gray-100 text-gray-600 border-none'>
							<UserIcon className='w-3 h-3' />
							<span>Oleh <span className='font-bold text-gray-900'>{studentName}</span></span>
						</Badge>
						<Badge variant="secondary" className='font-medium px-2.5 py-0.5 flex items-center gap-1.5 bg-gray-100 text-gray-600 border-none'>
							<Clock className='w-3 h-3' />
							<span>{formattedDate}</span>
						</Badge>
						<Button 
							variant="link" 
							size="sm" 
							className={`h-auto p-0 font-bold ${isDeleted ? 'text-gray-400 cursor-not-allowed' : 'text-teal-600 hover:text-teal-700'}`}
							onClick={() => !isDeleted && router.push(`/${workspaceId}/documents/${documentId}`)}
							disabled={isDeleted}
						>
							<ExternalLink className='w-3.5 h-3.5 mr-1' /> {isDeleted ? 'Dokumen Terhapus' : 'Lihat Dokumen'}
						</Button>
					</div>
				</div>

				<div className='flex flex-col items-center md:items-end gap-1 shrink-0'>
					<span className='text-[9px] font-bold text-gray-400 uppercase tracking-widest'>Current Status</span>
					<ReviewStatusBadge status={status} className='text-md px-4 py-1' />
				</div>
			</div>
		</div>
	)
}
