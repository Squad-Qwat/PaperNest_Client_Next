'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Mail, CheckCircle2, ArrowRight, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useVerifyCompletion } from '@/lib/api/hooks/use-auth'
import { getErrorMessage } from '@/lib/api/utils/error-handler'
import Grainient from '@/components/visuals/Grainient/Grainient'

export default function VerifyEmailPage() {
	const { mutate: verify, isPending, error: verifyError } = useVerifyCompletion()
	const [localError, setLocalError] = useState<string | null>(null)

	const handleCheckStatus = () => {
		setLocalError(null)
		verify()
	}

	// Auto-polling every 10 seconds (optimized)
	useEffect(() => {
		const interval = setInterval(() => {
			if (!isPending) {
				verify()
			}
		}, 10000)

		return () => clearInterval(interval)
	}, [verify, isPending])

	const displayError = verifyError ? getErrorMessage(verifyError) : localError

	return (
		<div className='min-h-screen flex min-w-screen bg-background relative'>
			{/* Logo - Global Fixed Responsive */}
			<div className='fixed top-6 left-0 right-0 flex justify-center lg:top-8 lg:left-10 lg:right-auto lg:justify-start z-50'>
				<h1 className='text-2xl lg:text-3xl font-bold text-primary'>PaperNest</h1>
			</div>

			{/* Left Side - Content Container */}
			<div className='w-full lg:w-1/2 min-h-screen flex flex-col items-center justify-center py-4 px-4 sm:px-6 md:px-8 lg:px-10 relative'>
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className='w-full max-w-sm space-y-8 text-center'
				>
					{/* Icon Header - Minimalist */}
					<div className='flex justify-center'>
						<div className='relative'>
							<div className='bg-primary/5 p-6 rounded-full'>
								<Mail className='w-10 h-10 text-primary/80 stroke-[1.5]' />
							</div>
							<motion.div
								animate={{ opacity: [0.4, 0.8, 0.4] }}
								transition={{ repeat: Infinity, duration: 3 }}
								className='absolute inset-0 bg-primary/10 rounded-full blur-xl -z-10'
							/>
						</div>
					</div>

					{/* Text Content - Focused */}
					<div className=''>
						<h1 className='text-2xl font-bold tracking-tight text-gray-900'>
							Check your inbox
						</h1>
						<p className='text-sm text-gray-500 leading-relaxed max-w-[280px] mx-auto'>
							We've sent a verification link to your email.
							Please click it to activate your account.
						</p>
					</div>

					{/* Actions & Status */}
					<div className='space-y-4'>
						<div className=''>
							<Button
								className='w-full'
								onClick={handleCheckStatus}
								disabled={isPending}
							>
								{isPending ? (
									<Loader2 className='w-4 h-4 animate-spin' />
								) : (
									'Verifikasikan Sekarang'
								)}
							</Button>

							{/* Dynamic Status Display */}
							<div className=''>
								{displayError && displayError !== 'EMAIL_NOT_VERIFIED' && (
									<motion.p
										initial={{ opacity: 0, y: -5 }}
										animate={{ opacity: 1, y: 0 }}
										className='text-xs text-red-500 font-medium'
									>
										{displayError}
									</motion.p>
								)}
							</div>
						</div>

						{/* Minimalist Footnotes */}
						<div className='flex flex-col gap-3 items-center w-full text-gray-500'>
							<Button
								variant='outline'
								className='w-full'
								onClick={() => window.location.reload()}
							>
								Kirim Ulang Email
							</Button>

							<div className='flex items-center gap-2 text-sm opacity-70'>
								<span>Salah alamat?</span>
								<a href="/login" className='text-gray-900 hover:text-primary underline transition-colors font-medium'>
									Login ulang
								</a>
							</div>
						</div>
					</div>
				</motion.div>
			</div>

			{/* Right Side - Visuals (Consistent with Register/Login) */}
			<div className='hidden lg:flex lg:w-1/2 min-h-screen relative'>
				<div className='absolute inset-0 w-full h-full p-6'>
					<Grainient
						color1="#009689"
						color2="#F5A623"
						color3="#009689"
						timeSpeed={0.25}
						zoom={0.8}
					/>
				</div>
				<div className='absolute inset-0 flex flex-col items-center justify-center z-10 px-8'>
					<p className='text-xl text-white text-center mt-4 max-w-sm italic' style={{ fontFamily: 'Times New Roman, Times, serif' }}>
						"Your security is our priority. Verifying your email ensures your research data remains protected and private."
					</p>
				</div>
			</div>
		</div>
	)
}
