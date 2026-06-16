'use client'

import { CheckCircle2, Mail } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type React from 'react'
import { useState } from 'react'
import { AuthPageLayout } from '@/components/auth/AuthPageLayout'
import { TurnstileWidget } from '@/components/auth/TurnstileWidget'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useForgotPassword } from '@/lib/api/hooks/use-auth'
import { isValidEmail } from '@/lib/utils/validation'

const variants = {
	initial: { opacity: 0, y: 16, filter: 'blur(4px)' },
	animate: {
		opacity: 1,
		y: 0,
		filter: 'blur(0px)',
		transition: { duration: 0.45, ease: [0.23, 1, 0.32, 1] as const },
	},
	exit: {
		opacity: 0,
		y: -12,
		filter: 'blur(4px)',
		transition: { duration: 0.3, ease: 'easeInOut' as const },
	},
} as const

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

		if (!isValidEmail(email)) {
			setLocalError(t('validEmail'))
			return
		}

		if (!turnstileToken) {
			setLocalError(t('captchaVerify'))
			return
		}

		try {
			await forgotPassword({ email })
		} catch {
			// Fail silently — always show success to prevent email enumeration
		}
		setSubmittedEmail(email)
		setSubmitted(true)
	}

	const handleTryAnother = () => {
		setSubmitted(false)
		setEmail('')
		setTurnstileToken('')
		setLocalError('')
		setSubmittedEmail('')
	}

	return (
		<AuthPageLayout quote={t('forgotPasswordLeftSubtitle')}>
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

						{/* Error */}
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
		</AuthPageLayout>
	)
}
