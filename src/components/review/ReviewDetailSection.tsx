import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

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
	variant = 'teal',
}: ReviewDetailSectionProps) {
	const variants = {
		teal: {
			bg: 'bg-teal-50/30 dark:bg-teal-950/10',
			iconBg: 'bg-teal-100 dark:bg-teal-950/40',
			iconColor: 'text-teal-600 dark:text-teal-400',
			badge:
				'text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/20 border-teal-100 dark:border-teal-900/30',
		},
		green: {
			bg: 'bg-green-50/30 dark:bg-green-950/10',
			iconBg: 'bg-green-100 dark:bg-green-950/40',
			iconColor: 'text-green-600 dark:text-green-400',
			badge:
				'text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-950/20 border-green-100 dark:border-green-900/30',
		},
		red: {
			bg: 'bg-red-50/30 dark:bg-red-950/10',
			iconBg: 'bg-red-100 dark:bg-red-950/40',
			iconColor: 'text-red-600 dark:text-red-400',
			badge:
				'text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30',
		},
		amber: {
			bg: 'bg-amber-50/30 dark:bg-amber-950/10',
			iconBg: 'bg-amber-100 dark:bg-amber-950/40',
			iconColor: 'text-amber-600 dark:text-amber-400',
			badge:
				'text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30',
		},
	}

	const style = variants[variant]

	return (
		<Card className='overflow-hidden border shadow-sm bg-card'>
			<div
				className={`${style.bg} px-6 py-3.5 flex items-center justify-between border-b border-border`}
			>
				<div className='flex items-center gap-3'>
					<div className={`${style.iconBg} p-1.5 rounded-lg`}>
						<Icon className={`w-4 h-4 ${style.iconColor}`} />
					</div>
					<h3 className='text-md font-bold text-foreground tracking-tight'>{title}</h3>
				</div>
				<Badge
					variant='outline'
					className={`text-[9px] font-bold px-2 py-0 rounded-full uppercase tracking-widest ${style.badge}`}
				>
					{badgeText}
				</Badge>
			</div>
			<div className='p-6'>{children}</div>
		</Card>
	)
}
