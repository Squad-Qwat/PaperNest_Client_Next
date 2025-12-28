import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface ReviewCommentProps {
	authorName: string
	date: string
	content: string
	userType?: 'lecturer' | 'student' | 'system'
	avatarUrl?: string
	authorInitials?: string
}

export function ReviewComment({
	authorName,
	date,
	content,
	userType = 'lecturer',
	avatarUrl,
	authorInitials = 'LC',
}: ReviewCommentProps) {
	return (
		<div className='flex gap-4 group relative'>
			{/* Comment Body */}
			<Card className='flex-1 shadow-sm border-border/60 overflow-hidden'>
				<div className='px-4 py-3 border-b bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2'>
					<div className='text-sm text-muted-foreground'>
						<span className='font-semibold text-foreground mr-1'>{authorName}</span>
						<span className='text-xs sm:text-sm'>commented {date}</span>
					</div>
				</div>
				<div className='p-4 text-sm text-foreground/90 leading-relaxed prose-sm max-w-none'>
					<p>{content}</p>
				</div>
			</Card>
		</div>
	)
}
