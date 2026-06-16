'use client'

import { CheckCircle2, Mail } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type React from 'react'
import { useState } from 'react'
import { TurnstileWidget } from '@/components/auth/TurnstileWidget'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Grainient from '@/components/visuals/Grainient/Grainient'
import { useForgotPassword } from '@/lib/api/hooks/use-auth'
import { getErrorMessage } from '@/lib/api/utils/error-handler'

export default function ForgotPasswordPage() {
	const t = useTranslations('Auth')

	const [email, setEmail] = useState('')
	const [turnstileToken, setTurnstileToken] = useState('')
	const [localError, setLocalError] = useState('')
	const [submitted, setSubmitted] = useState(false)
	const [submittedEmail, setSubmittedEmail] = useState('')

	const { mutateAsync: forgotPassword, isPending } = useForgotPassword()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLocalError('')

		if (!email) {
			setLocalError(t('enterEmail'))
			return
		}

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			setLocalError(t('validEmail'))
			return
		}

		if (!turnstileToken) {
			setLocalError(t('captchaVerify'))
			return
		}

		try {
			await forgotPassword({ email })
			setSubmittedEmail(email)
			setSubmitted(true)
		} catch (err) {
			// Even on server error, show success to prevent email enumeration
			setSubmittedEmail(email)
			setSubmitted(true)
		}
	}

	const handleTryAnother = () => {
		setSubmitted(false)
		setEmail('')
		setTurnstileToken('')
		setLocalError('')
		setSubmittedEmail('')
	}

	const variants = {
		initial: { opacity: 0, y: 16, filter: 'blur(4px)' },
		animate: {
			opacity: 1,
			y: 0,
			filter: 'blur(0px)',
			transition: { duration: 0.45, ease: [0.23, 1, 0.32, 1] },
		},
		exit: {
			opacity: 0,
			y: -12,
			filter: 'blur(4px)',
			transition: { duration: 0.3, ease: 'easeInOut' },
		},
	}

	return (
		<div className='min-h-screen flex min-w-screen bg-background relative'>
			{/* Logo - Global Fixed Responsive */}
			<div className='fixed top-6 left-0 right-0 flex justify-center lg:top-8 lg:left-10 lg:right-auto lg:justify-start z-50'>
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
			</div>

			{/* Left Side - Form Container */}
			<div className='w-full lg:w-1/2 min-h-screen flex flex-col items-center justify-center py-8 px-4 sm:px-6 md:px-8 lg:px-10 relative'>
				<div className='w-full max-w-sm'>
					<AnimatePresence mode='wait'>
						{/* ── Step 1: Email Form ── */}
						{!submitted ? (
							<motion.div
								key='form'
								variants={variants}
								initial='initial'
								animate='animate'
								exit='exit'
								className='space-y-6'
							>
								{/* Icon */}
								<div className='flex justify-center'>
									<div className='bg-primary/5 p-5 rounded-full'>
										<Mail className='w-9 h-9 text-primary/80 stroke-[1.5]' />
									</div>
								</div>

								{/* Title */}
								<div className='text-center'>
									<h1 className='text-2xl font-bold text-foreground mb-2'>
										{t('forgotPasswordTitle')}
									</h1>
									<p className='text-sm text-muted-foreground leading-relaxed'>
										{t('forgotPasswordSubtitle')}
									</p>
								</div>

								{/* Error Message */}
								{localError && (
									<div className='p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm text-center font-medium'>
										{localError}
									</div>
								)}

								{/* Form */}
								<form onSubmit={handleSubmit} className='space-y-6'>
									<div className='space-y-2'>
										<Label htmlFor='email' className='text-foreground font-normal'>
											{t('email')}
										</Label>
										<Input
											id='email'
											type='email'
											value={email}
											onChange={(e) => {
												setEmail(e.target.value)
												setLocalError('')
											}}
											placeholder={t('enterEmail')}
											disabled={isPending}
											autoFocus
										/>
									</div>

									<TurnstileWidget onVerify={setTurnstileToken} />

									<Button type='submit' className='w-full' disabled={isPending}>
										{isPending ? t('sendingResetLink') : t('sendResetLink')}
									</Button>
								</form>

								{/* Back to Login */}
								<div className='text-center text-sm text-muted-foreground'>
									<Link
										href='/login'
										className='text-foreground hover:text-muted-foreground font-medium underline transition-colors'
									>
										{t('backToLogin')}
									</Link>
								</div>
							</motion.div>
						) : (
							/* ── Step 2: Success State ── */
							<motion.div
								key='success'
								variants={variants}
								initial='initial'
								animate='animate'
								exit='exit'
								className='space-y-6 text-center'
							>
								{/* Success Icon */}
								<div className='flex justify-center'>
									<div className='relative'>
										<div className='bg-green-500/10 p-5 rounded-full'>
											<CheckCircle2 className='w-9 h-9 text-green-500 stroke-[1.5]' />
										</div>
										<motion.div
											animate={{ opacity: [0.3, 0.7, 0.3] }}
											transition={{ repeat: Infinity, duration: 3 }}
											className='absolute inset-0 bg-green-500/10 rounded-full blur-xl -z-10'
										/>
									</div>
								</div>

								{/* Title */}
								<div className='space-y-2'>
									<h1 className='text-2xl font-bold text-foreground'>{t('resetLinkSent')}</h1>
									<p className='text-sm text-muted-foreground leading-relaxed'>
										{t('resetLinkSentDesc', { email: submittedEmail })}
									</p>
								</div>

								{/* Actions */}
								<div className='w-full flex flex-col gap-3'>
									<Link href='/login' className='w-full'>
										<Button className='w-full h-9'>{t('backToLogin')}</Button>
									</Link>
									<Button variant='outline' className='w-full h-9' onClick={handleTryAnother}>
										{t('tryAnotherEmail')}
									</Button>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</div>

			{/* Right Side - Gradient Background with Text */}
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
						{t('forgotPasswordLeftSubtitle')}
					</p>
				</div>
			</div>
		</div>
	)
}
