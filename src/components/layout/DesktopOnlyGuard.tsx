'use client'

import { Eye, Laptop } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface DesktopOnlyGuardProps {
	workspaceId: string
}

export function DesktopOnlyGuard({ workspaceId }: DesktopOnlyGuardProps) {
	const [hidden, setHidden] = useState(false)

	if (hidden) return null

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className='fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-6 text-center'
			>
				{/* Minimal Grid Background */}
				<div
					className='absolute inset-0 opacity-[0.05] pointer-events-none'
					style={{
						backgroundImage:
							'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
						backgroundSize: '40px 40px',
					}}
				></div>

				<motion.div
					initial={{ y: 10, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ duration: 0.4, ease: 'easeOut' }}
					className='max-w-[320px] w-full relative'
				>
					{/* Brand Logo - Consistent with SplashLoader */}
					<div className='w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20'>
						<span className='text-2xl font-bold text-primary'>PN</span>
					</div>

					<h1 className='text-xl font-bold text-foreground mb-2 tracking-tight'>
						Desktop Recommended
					</h1>

					<p className='text-muted-foreground text-sm leading-relaxed mb-8'>
						PaperNest Editor is optimized for larger screens to handle complex LaTeX layouts and
						side-by-side PDF previewing.
					</p>

					<div className='bg-muted border border-border rounded-xl p-4 mb-8 flex flex-col items-center gap-2'>
						<Laptop className='h-8 w-8 text-primary/40' />
						<p className='text-[10px] font-bold text-muted-foreground uppercase tracking-widest'>
							Best viewed on desktop
						</p>
					</div>

					<div className='flex flex-col gap-3'>
						<Button asChild className='w-full transition-all shadow-none rounded-lg'>
							<Link href={`/${workspaceId}`}>Back to Dashboard</Link>
						</Button>

						<Button
							variant='ghost'
							onClick={() => setHidden(true)}
							className='text-xs font-semibold text-muted-foreground hover:text-foreground transition-all h-9 flex items-center gap-1.5'
						>
							<Eye className='h-3 w-3' />
							Continue anyway (View only)
						</Button>
					</div>

					<div className='mt-12'>
						<Separator className='w-12 mx-auto mb-4 bg-border' />
						<p className='text-[9px] uppercase tracking-[0.2em] font-bold text-muted-foreground/50'>
							PaperNest Professional
						</p>
					</div>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	)
}
