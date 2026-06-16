'use client'

import Image from 'next/image'
import Link from 'next/link'
import type React from 'react'
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher'
import Grainient from '@/components/visuals/Grainient/Grainient'

interface AuthPageLayoutProps {
	/** Quote shown on the right-side Grainient panel */
	quote: string
	children: React.ReactNode
}

/**
 * Shared layout for all auth pages:
 * - Fixed logo top-left (desktop) / top-center (mobile)
 * - Left half: scrollable form area
 * - Right half (lg+): animated Grainient panel with italic quote
 */
export function AuthPageLayout({ quote, children }: AuthPageLayoutProps) {
	return (
		<div className='min-h-screen flex min-w-screen bg-background relative'>
			{/* Top bar — logo + locale switcher */}
			<div className='fixed top-6 left-0 right-0 flex items-center justify-between px-4 lg:top-8 lg:px-10 z-50'>
				<Link href='/' className='flex items-center gap-2 lg:gap-3'>
					<Image
						src='/PaperNest-logo.svg'
						alt='PaperNest Logo'
						width={40}
						height={40}
						className='w-8 h-8 lg:w-10 lg:h-10'
					/>
					<h1 className='text-2xl lg:text-3xl font-bold text-primary leading-none -mt-1'>
						PaperNest
					</h1>
				</Link>
				<LocaleSwitcher />
			</div>

			{/* Left — form */}
			<div className='w-full lg:w-1/2 min-h-screen flex flex-col items-center justify-center py-8 px-4 sm:px-6 md:px-8 lg:px-10 relative'>
				<div className='w-full max-w-sm space-y-6'>{children}</div>
			</div>

			{/* Right — Grainient panel (desktop only) */}
			<div className='hidden lg:flex lg:w-1/2 min-h-screen relative'>
				<div className='absolute inset-0 w-full h-full p-6'>
					<Grainient
						color1='#009689'
						color2='#F5A623'
						color3='#009689'
						timeSpeed={0.25}
						colorBalance={0}
						warpStrength={1}
						warpFrequency={5}
						warpSpeed={2}
						warpAmplitude={50}
						blendAngle={0}
						blendSoftness={0.05}
						rotationAmount={500}
						noiseScale={2}
						grainAmount={0.1}
						grainScale={2}
						grainAnimated={false}
						contrast={1.5}
						gamma={1}
						saturation={1}
						centerX={0}
						centerY={0}
						zoom={0.8}
					/>
				</div>
				<div className='absolute inset-0 flex flex-col items-center justify-center z-10 px-8'>
					<p
						className='text-xl text-white text-center mt-4 max-w-sm italic'
						style={{ fontFamily: 'Times New Roman, Times, serif' }}
					>
						{quote}
					</p>
				</div>
			</div>
		</div>
	)
}
