'use client'

import { motion } from 'motion/react'
import { PaperNestLoader } from './PaperNestLoader'

export function SplashLoader() {
	return (
		<div className='min-h-screen bg-background flex flex-col items-center justify-center p-4'>
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.5, ease: 'easeOut' }}
				className='flex flex-col items-center'
			>
				{/* Brand Logo - Animated SVG Loader */}
				<div className='mb-6'>
					<PaperNestLoader />
				</div>

				{/* Brand Name */}
				<h1 className='text-2xl font-bold text-foreground mb-2 tracking-tight'>PaperNest</h1>
			</motion.div>
		</div>
	)
}
