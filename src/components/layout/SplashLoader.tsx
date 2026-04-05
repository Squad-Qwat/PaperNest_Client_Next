'use client'

import React from 'react'
import { motion } from 'motion/react'

export function SplashLoader() {
	return (
		<div className='min-h-screen bg-white flex flex-col items-center justify-center p-4'>
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.5, ease: 'easeOut' }}
				className='flex flex-col items-center'
			>
				{/* Brand Logo Placeholder */}
				<motion.div
					animate={{
						scale: [1, 1.05, 1],
						opacity: [0.8, 1, 0.8],
					}}
					transition={{
						duration: 2,
						repeat: Infinity,
						ease: 'easeInOut',
					}}
					className='w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-primary/20'
				>
					<span className='text-3xl font-bold text-primary'>PN</span>
				</motion.div>

				{/* Brand Name */}
				<h1 className='text-2xl font-bold text-gray-900 mb-2 tracking-tight'>PaperNest</h1>
				
				{/* Loading Indicator */}
				<div className='flex items-center gap-1.5 mt-2'>
					<motion.div
						animate={{
							scale: [1, 1.5, 1],
							opacity: [0.3, 1, 0.3],
						}}
						transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
						className='w-1.5 h-1.5 rounded-full bg-primary'
					/>
					<motion.div
						animate={{
							scale: [1, 1.5, 1],
							opacity: [0.3, 1, 0.3],
						}}
						transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
						className='w-1.5 h-1.5 rounded-full bg-primary'
					/>
					<motion.div
						animate={{
							scale: [1, 1.5, 1],
							opacity: [0.3, 1, 0.3],
						}}
						transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
						className='w-1.5 h-1.5 rounded-full bg-primary'
					/>
				</div>
			</motion.div>
		</div>
	)
}
