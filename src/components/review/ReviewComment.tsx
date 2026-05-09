import { Quote } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

interface ReviewCommentProps {
	authorName: string
	date: string
	content: string
	userType: 'lecturer' | 'student' | 'system'
}

export function ReviewComment({
	authorName,
	date,
	content,
	userType,
}: Readonly<ReviewCommentProps>) {
	const isLecturer = userType === 'lecturer'
	const isSystem = userType === 'system'

	if (isSystem) {
		return (
			<div className='flex justify-center my-2'>
				<Badge
					variant='outline'
					className='px-3 py-0.5 rounded-full text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border-gray-100'
				>
					{content} • {date}
				</Badge>
			</div>
		)
	}

	return (
		<div className='flex flex-col gap-1.5 group relative w-full'>
			<div className='flex items-center justify-between px-1'>
				<div className='flex items-center gap-2'>
					<div
						className={`w-1.5 h-1.5 rounded-full ${isLecturer ? 'bg-amber-500' : 'bg-teal-500'}`}
					/>
					<span className='font-bold text-gray-900 text-[13px]'>{authorName}</span>
					<Badge
						variant='secondary'
						className={`text-[8px] font-bold px-1.5 py-0 rounded-full uppercase tracking-tighter border-none h-4 flex items-center ${
							isLecturer ? 'bg-amber-100 text-amber-700' : 'bg-teal-50 text-teal-700'
						}`}
					>
						{userType}
					</Badge>
				</div>
				<span className='text-[10px] text-gray-400 font-medium'>{date}</span>
			</div>

			<Card
				className={`p-4 rounded-lg shadow-none border-none ring-1 leading-relaxed text-sm relative overflow-hidden ${
					isLecturer
						? 'bg-amber-50/50 ring-amber-100 text-amber-900'
						: 'bg-white ring-gray-100 text-gray-700'
				}`}
			>
				{isLecturer && (
					<Quote className='w-8 h-8 absolute -left-1 -top-1 text-amber-200/40 transform rotate-180 pointer-events-none' />
				)}
				<div className={`relative z-10 ${isLecturer ? 'italic pl-2 font-medium' : ''}`}>
					{content}
				</div>
			</Card>
		</div>
	)
}
