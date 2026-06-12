'use client'

import { Eye, Laptop } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

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
				<motion.div
					initial={{ y: 10, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ duration: 0.4, ease: 'easeOut' }}
					className='max-w-[320px] w-full relative'
				>
					{/* Brand Logo - Using PaperNest-logo.svg */}
					<div className='flex justify-center mb-6'>
						<Image
							src='/PaperNest-logo.svg'
							alt='PaperNest Logo'
							width={64}
							height={64}
							className='w-16 h-16'
							priority
						/>
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
				</motion.div>
			</motion.div>
		</AnimatePresence>
	)
}
