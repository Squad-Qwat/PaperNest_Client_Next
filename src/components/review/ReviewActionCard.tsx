import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface ReviewActionCardProps {
	onAction: (type: 'approved' | 'rejected' | 'revision_required') => void
}

export function ReviewActionCard({ onAction }: Readonly<ReviewActionCardProps>) {
	return (
		<Card className='p-6 border shadow-sm bg-white sticky top-24'>
			<h3 className='text-lg font-bold text-gray-900 mb-6 flex items-center gap-2'>
				<CheckCircle2 className='w-5 h-5 text-teal-600' />
				Tentukan Keputusan
			</h3>

			<div className='grid grid-cols-1 gap-3 mb-6'>
				<Button
					onClick={() => onAction('approved')}
					className='w-full bg-teal-600 hover:bg-teal-700 font-bold'
				>
					<CheckCircle2 className='w-4 h-4 mr-2' /> Approve
				</Button>
				<Button
					variant='outline'
					onClick={() => onAction('revision_required')}
					className='w-full border-amber-200 text-amber-700 hover:bg-amber-50 font-bold'
				>
					<AlertCircle className='w-4 h-4 mr-2' /> Minta Revisi
				</Button>
				<Button
					variant='outline'
					onClick={() => onAction('rejected')}
					className='w-full border-red-200 text-red-600 hover:bg-red-50 font-bold'
				>
					<XCircle className='w-4 h-4 mr-2' /> Reject
				</Button>
			</div>

			<div className='p-4 bg-gray-50 rounded-lg border border-gray-100'>
				<div className='flex gap-2'>
					<Info className='w-4 h-4 text-gray-400 mt-0.5' />
					<p className='text-xs text-gray-500 leading-normal'>
						Pastikan Anda telah memeriksa konten dokumen terbaru sebelum mengambil keputusan.
					</p>
				</div>
			</div>
		</Card>
	)
}
