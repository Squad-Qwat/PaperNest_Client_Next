import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertCircle, Clock, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ReviewStatus = 'Pending' | 'Approved' | 'Revision Required' | 'Open'

interface ReviewStatusBadgeProps {
	status: ReviewStatus
	className?: string
	showIcon?: boolean
}

export function ReviewStatusBadge({ status, className, showIcon = true }: ReviewStatusBadgeProps) {
	const getStatusConfig = (status: ReviewStatus) => {
		switch (status) {
			case 'Approved':
				return {
					className: 'bg-green-500/15 text-green-600 hover:bg-green-500/25 border-green-500/20',
					icon: CheckCircle2,
				}
			case 'Open':
				return {
					className: 'bg-green-500 hover:bg-green-600 text-white border-transparent',
					icon: CheckCircle2,
				}
			case 'Pending':
				return {
					className: 'bg-yellow-500/15 text-yellow-600 hover:bg-yellow-500/25 border-yellow-500/20',
					icon: Clock,
				}
			case 'Revision Required':
				return {
					className: 'bg-red-500/15 text-red-600 hover:bg-red-500/25 border-red-500/20',
					icon: AlertCircle,
				}
			default:
				return {
					className: 'bg-gray-500/15 text-gray-600',
					icon: Loader2,
				}
		}
	}

	const config = getStatusConfig(status)
	const Icon = config.icon

	return (
		<Badge
			variant='outline'
			className={cn('gap-1.5 pl-1.5 pr-2.5 py-0.5 font-medium', config.className, className)}
		>
			{showIcon && <Icon className='w-3.5 h-3.5' />}
			{status}
		</Badge>
	)
}
