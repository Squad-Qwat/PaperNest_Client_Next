import { Separator } from '@/components/ui/separator'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ReviewInfoCardProps {
	lecturerName: string
	studentName: string
	documentId: string
	workspaceId: string
}

export function ReviewInfoCard({
	lecturerName,
	studentName,
	documentId,
	workspaceId,
}: ReviewInfoCardProps) {
	const router = useRouter()

	return (
		<Card className='p-5 border bg-white sticky top-24 shadow-sm'>
			<h3 className='text-lg font-bold text-gray-900 mb-4'>Informasi Review</h3>
			<div className='space-y-3.5'>
				<div className='flex items-center justify-between text-sm'>
					<span className='text-gray-500'>Dosen Penguji</span>
					<span className='font-bold text-gray-900'>{lecturerName}</span>
				</div>
				<Separator className='opacity-50' />
				<div className='flex items-center justify-between text-sm'>
					<span className='text-gray-500'>Mahasiswa</span>
					<span className='font-bold text-gray-900'>{studentName}</span>
				</div>
				<Separator className='opacity-50' />
				<div className='flex items-center justify-between text-sm'>
					<span className='text-gray-500'>ID Dokumen</span>
					<span className='font-mono text-[10px] text-gray-400 truncate ml-4'>{documentId}</span>
				</div>
			</div>
			<Button 
				className='w-full mt-6 bg-white hover:bg-gray-50 text-gray-900 border rounded-lg font-bold shadow-sm'
				onClick={() => router.push(`/${workspaceId}/documents/${documentId}`)}
			>
				Buka Editor <ArrowRight className='w-4 h-4 ml-2' />
			</Button>
		</Card>
	)
}
