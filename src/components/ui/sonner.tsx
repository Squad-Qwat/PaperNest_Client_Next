'use client'

import {
	CircleCheckIcon,
	InfoIcon,
	Loader2Icon,
	OctagonXIcon,
	TriangleAlertIcon,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
	const { theme = 'system' } = useTheme()

	return (
		<Sonner
			theme={theme as ToasterProps['theme']}
			className='toaster group'
			icons={{
				success: <CircleCheckIcon className='size-4' />,
				info: <InfoIcon className='size-4' />,
				warning: <TriangleAlertIcon className='size-4' />,
				error: <OctagonXIcon className='size-4' />,
				loading: <Loader2Icon className='size-4 animate-spin' />,
			}}
			style={
				{
					'--normal-bg': 'var(--popover)',
					'--normal-text': 'var(--popover-foreground)',
					'--normal-border': 'var(--border)',
					'--border-radius': 'var(--radius)',
					// Keep toasts above modal/dialog overlays (dialog overlay is z-[1010],
					// content z-[1011], full-screen modal z-[1015]). This ensures the toast
					// is visible and clickable (e.g. by Katalon automation) while a modal is open.
					zIndex: 2000,
				} as React.CSSProperties
			}
			toastOptions={{
				// Ensure each toast remains clickable even when a modal sets
				// pointer-events: none on the body.
				className: 'pointer-events-auto',
			}}
			{...props}
		/>
	)
}


export { Toaster }
