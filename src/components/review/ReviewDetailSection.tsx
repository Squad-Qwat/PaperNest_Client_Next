import { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ReviewDetailSectionProps {
	title: string
	badgeText: string
	icon: LucideIcon
	children: ReactNode
	variant?: 'teal' | 'green' | 'red' | 'amber'
}

export function ReviewDetailSection({
	title,
	badgeText,
	icon: Icon,
	children,
	variant = 'teal'
}: ReviewDetailSectionProps) {
	const variants = {
		teal: {
			bg: 'bg-teal-50/30',
			iconBg: 'bg-teal-100',
			iconColor: 'text-teal-600',
			badge: 'text-teal-600 bg-teal-50 border-teal-100'
		},
		green: {
			bg: 'bg-green-50/30',
			iconBg: 'bg-green-100',
			iconColor: 'text-green-600',
			badge: 'text-green-600 bg-green-50 border-green-100'
		},
		red: {
			bg: 'bg-red-50/30',
			iconBg: 'bg-red-100',
			iconColor: 'text-red-600',
			badge: 'text-red-600 bg-red-50 border-red-100'
		},
		amber: {
			bg: 'bg-amber-50/30',
			iconBg: 'bg-amber-100',
			iconColor: 'text-amber-600',
			badge: 'text-amber-600 bg-amber-50 border-amber-100'
		}
	}

	const style = variants[variant]

	return (
		<Card className='overflow-hidden border shadow-sm bg-white'>
			<div className={`${style.bg} px-6 py-3.5 flex items-center justify-between border-b border-gray-100`}>
				<div className='flex items-center gap-3'>
					<div className={`${style.iconBg} p-1.5 rounded-lg`}>
						<Icon className={`w-4 h-4 ${style.iconColor}`} />
					</div>
					<h3 className='text-md font-bold text-gray-900 tracking-tight'>{title}</h3>
				</div>
				<Badge variant="outline" className={`text-[9px] font-bold px-2 py-0 rounded-full uppercase tracking-widest ${style.badge}`}>
					{badgeText}
				</Badge>
			</div>
			<div className='p-6'>
				{children}
			</div>
		</Card>
	)
}
