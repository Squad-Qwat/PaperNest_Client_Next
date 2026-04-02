import { AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type ReviewStatus = 'Pending' | 'Approved' | 'Revision Required' | 'Open'

interface ReviewStatusBadgeProps {
	status: string
	className?: string
	showIcon?: boolean
}

export function ReviewStatusBadge({ status, className, showIcon = true }: ReviewStatusBadgeProps) {
	// Normalize status to match display logic (or handle mapping)
	const getStatusConfig = (rawStatus: string) => {
		// Map backend status to Display String if needed, or just handle keys
		// Statuses: 'pending', 'approved', 'revision_required', 'rejected'
		// Legacy/Other: 'Pending', 'Approved', ...

		const normalized = rawStatus.toLowerCase().replace('_', ' ')

		if (normalized.includes('approv')) {
			return {
				label: 'Approved',
				className: 'bg-green-500/15 text-green-600 hover:bg-green-500/25 border-green-500/20',
				icon: CheckCircle2,
			}
		}
		if (normalized.includes('revision')) {
			return {
				label: 'Revision Required',
				className: 'bg-orange-500/15 text-orange-600 hover:bg-orange-500/25 border-orange-500/20',
				icon: AlertCircle,
			}
		}
		if (normalized.includes('reject')) {
			return {
				label: 'Rejected',
				className: 'bg-red-500/15 text-red-600 hover:bg-red-500/25 border-red-500/20',
				icon: XCircle,
			}
		}
		// Default to pending for 'pending' or unknown
		if (normalized.includes('open')) {
			return {
				label: 'Open',
				className: 'bg-blue-500 hover:bg-blue-600 text-white border-transparent',
				icon: CheckCircle2,
			}
		}

		return {
			label: 'Pending',
			className: 'bg-yellow-500/15 text-yellow-600 hover:bg-yellow-500/25 border-yellow-500/20',
			icon: Clock,
		}
	}

	const config = getStatusConfig(status || 'pending')
	const Icon = config.icon

	return (
		<Badge
			variant='outline'
			className={cn('gap-1.5 pl-1.5 pr-2.5 py-0.5 font-medium', config.className, className)}
		>
			{showIcon && <Icon className='w-3.5 h-3.5' />}
			{config.label}
		</Badge>
	)
}
