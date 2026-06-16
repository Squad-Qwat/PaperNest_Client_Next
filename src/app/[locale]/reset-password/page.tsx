'use client'

import { CheckCircle2, CheckIcon, EyeIcon, EyeOffIcon, Loader2, XIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type React from 'react'
import { Suspense, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Grainient from '@/components/visuals/Grainient/Grainient'
import { useResetPassword, useValidateResetToken } from '@/lib/api/hooks/use-auth'
import { getErrorMessage } from '@/lib/api/utils/error-handler'
import { cn } from '@/lib/utils'

// ─── Password strength helpers (same logic as register page) ───────────────

function usePasswordStrength(password: string, t: ReturnType<typeof useTranslations<'Auth'>>) {
	const requirements = useMemo(
		() => [
			{ regex: /.{8,}/, text: t('passwordReqLength') },
			{ regex: /[a-z]/, text: t('passwordReqLowercase') },
			{ regex: /[A-Z]/, text: t('passwordReqUppercase') },
			{ regex: /[0-9]/, text: t('passwordReqNumber') },
			{ regex: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, text: t('passwordReqSpecial') },
		],
		[t]
	)

	const strength = useMemo(
		() => requirements.map((req) => ({ met: req.regex.test(password), text: req.text })),
		[password, requirements]
	)

	const score = strength.filter((r) => r.met).length

	const getColor = (s: number) => {
		if (s === 0) return 'bg-border'
		if (s <= 1) return 'bg-destructive'
		if (s <= 2) return 'bg-orange-500'
		if (s <= 3) return 'bg-amber-500'
		if (s === 4) return 'bg-yellow-400'
		return 'bg-green-500'
	}

	const getText = (s: number) => {
		if (s === 0) return t('strengthEmpty')
		if (s <= 2) return t('strengthWeak')
		if (s <= 3) return t('strengthMedium')
		if (s === 4) return t('strengthStrong')
		return t('strengthVeryStrong')
	}

	return { strength, score, getColor, getText }
}

// ─── Token validation states ───────────────────────────────────────────────

type TokenState = 'loading' | 'valid' | 'invalid' | 'used' | 'social'

function getTokenState(isLoading: boolean, isSuccess: boolean, error: unknown): TokenState {
	if (isLoading) return 'loading'
	if (error) {
		const msg = getErrorMessage(error).toUpperCase()
		if (msg.includes('ALREADY_USED')) return 'used'
		if (msg.includes('SOCIAL_ACCOUNT')) return 'social'
		return 'invalid'
	}
	if (isSuccess) return 'valid'
	return 'loading'
}

// ─── Main content (needs useSearchParams so wrapped in Suspense) ───────────

function ResetPasswordContent() {
	const t = useTranslations('Auth')
	const searchParams = useSearchParams()
	const token = searchParams.get('token') ?? ''

	const { isLoading, isSuccess, error: validateError } = useValidateResetToken(token)
	const { mutateAsync: resetPassword, isPending } = useResetPassword()

	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirm, setShowConfirm] = useState(false)
	const [formError, setFormError] = useState('')
	const [done, setDone] = useState(false)

	const { strength, score, getColor, getText } = usePasswordStrength(password, t)

	const tokenState = getTokenState(isLoading, isSuccess, validateError)

	const pageVariants = {
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
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setFormError('')

		if (!password) {
			setFormError(t('passwordRequired'))
			return
		}

		if (score < 5) {
			setFormError(t('passwordRequirementsNotMet'))
			return
		}

		if (!confirmPassword) {
			setFormError(t('confirmPasswordRequired'))
			return
		}

		if (password !== confirmPassword) {
			setFormError(t('passwordsDoNotMatch'))
			return
		}

		try {
			await resetPassword({ token, password })
			setDone(true)
		} catch (err) {
			setFormError(getErrorMessage(err))
		}
	}

	return (
		<div className='min-h-screen flex min-w-screen bg-background relative'>
			{/* Logo */}
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

			{/* Left — Form */}
			<div className='w-full lg:w-1/2 min-h-screen flex flex-col items-center justify-center py-8 px-4 sm:px-6 md:px-8 lg:px-10 relative'>
				<div className='w-full max-w-sm'>
					<AnimatePresence mode='wait'>
						{/* ── Loading token validation ── */}
						{tokenState === 'loading' && (
							<motion.div
								key='loading'
								variants={pageVariants}
								initial='initial'
								animate='animate'
								exit='exit'
								className='flex flex-col items-center justify-center gap-4 py-16'
							>
								<Loader2 className='w-8 h-8 animate-spin text-primary/50' />
								<p className='text-sm text-muted-foreground'>{t('validatingToken')}</p>
							</motion.div>
						)}

						{/* ── Token invalid / used / social ── */}
						{(tokenState === 'invalid' || tokenState === 'used' || tokenState === 'social') && (
							<motion.div
								key='invalid'
								variants={pageVariants}
								initial='initial'
								animate='animate'
								exit='exit'
								className='space-y-6 text-center'
							>
								<div className='flex justify-center'>
									<div className='bg-destructive/10 p-5 rounded-full'>
										<XIcon className='w-9 h-9 text-destructive stroke-[1.5]' />
									</div>
								</div>

								<div className='space-y-2'>
									<h1 className='text-2xl font-bold text-foreground'>
										{tokenState === 'used'
											? t('resetTokenUsed')
											: tokenState === 'social'
												? t('socialAccountNoPassword')
												: t('resetTokenInvalid')}
									</h1>
									{tokenState !== 'social' && (
										<p className='text-sm text-muted-foreground leading-relaxed'>
											{t('resetTokenInvalid')}
										</p>
									)}
								</div>

								<div className='w-full flex flex-col gap-3'>
									<Link href='/forgot-password' className='w-full'>
										<Button className='w-full h-9'>{t('requestNewLink')}</Button>
									</Link>
									<Link href='/login' className='w-full'>
										<Button variant='outline' className='w-full h-9'>
											{t('backToLogin')}
										</Button>
									</Link>
								</div>
							</motion.div>
						)}

						{/* ── Form ── */}
						{tokenState === 'valid' && !done && (
							<motion.div
								key='form'
								variants={pageVariants}
								initial='initial'
								animate='animate'
								exit='exit'
								className='space-y-6'
							>
								{/* Title */}
								<div className='text-center'>
									<h1 className='text-2xl font-bold text-foreground mb-2'>
										{t('resetPasswordTitle')}
									</h1>
									<p className='text-sm text-muted-foreground leading-relaxed'>
										{t('resetPasswordSubtitle')}
									</p>
								</div>

								{/* Error */}
								{formError && (
									<div className='p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm text-center font-medium'>
										{formError}
									</div>
								)}

								<form onSubmit={handleSubmit} className='space-y-6'>
									{/* New password */}
									<div className='space-y-2'>
										<Label htmlFor='password'>{t('password')}</Label>
										<div className='relative'>
											<Input
												id='password'
												type={showPassword ? 'text' : 'password'}
												value={password}
												onChange={(e) => {
													setPassword(e.target.value)
													setFormError('')
												}}
												placeholder={t('enterPassword')}
												disabled={isPending}
												className='pr-9'
												autoFocus
											/>
											<Button
												variant='ghost'
												size='icon'
												type='button'
												onClick={() => setShowPassword(!showPassword)}
												className='text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent'
												disabled={isPending}
											>
												{showPassword ? (
													<EyeOffIcon className='size-4' />
												) : (
													<EyeIcon className='size-4' />
												)}
											</Button>
										</div>

										{/* Strength bar */}
										<div className='flex h-1 w-full gap-1 mt-3'>
											{[0, 1, 2, 3, 4].map((idx) => (
												<span
													key={idx}
													className={cn(
														'h-full flex-1 rounded-full transition-all duration-500 ease-out',
														idx < score ? getColor(score) : 'bg-border'
													)}
												/>
											))}
										</div>

										<p className='text-foreground text-sm font-medium pt-1'>
											{t('passwordRequirementTitle', { strengthText: getText(score) })}
										</p>

										<ul className='space-y-1.5'>
											{strength.map((req) => (
												<li key={req.text} className='flex items-center gap-2'>
													{req.met ? (
														<CheckIcon className='size-4 text-green-600 dark:text-green-400' />
													) : (
														<XIcon className='text-muted-foreground size-4' />
													)}
													<span
														className={cn(
															'text-xs',
															req.met
																? 'text-green-600 dark:text-green-400'
																: 'text-muted-foreground'
														)}
													>
														{req.text}
													</span>
												</li>
											))}
										</ul>
									</div>

									{/* Confirm password */}
									<div className='space-y-2'>
										<Label htmlFor='confirmPassword'>{t('confirmPassword')}</Label>
										<div className='relative'>
											<Input
												id='confirmPassword'
												type={showConfirm ? 'text' : 'password'}
												value={confirmPassword}
												onChange={(e) => {
													setConfirmPassword(e.target.value)
													setFormError('')
												}}
												placeholder={t('confirmPassword')}
												disabled={isPending}
												className='pr-9'
											/>
											<Button
												variant='ghost'
												size='icon'
												type='button'
												onClick={() => setShowConfirm(!showConfirm)}
												className='text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent'
												disabled={isPending}
											>
												{showConfirm ? (
													<EyeOffIcon className='size-4' />
												) : (
													<EyeIcon className='size-4' />
												)}
											</Button>
										</div>
									</div>

									<Button type='submit' className='w-full' disabled={isPending}>
										{isPending ? (
											<>
												<Loader2 className='size-4 animate-spin' />
												{t('resettingPassword')}
											</>
										) : (
											t('resetPasswordBtn')
										)}
									</Button>
								</form>

								<div className='text-center text-sm text-muted-foreground'>
									<Link
										href='/login'
										className='text-foreground hover:text-muted-foreground font-medium underline transition-colors'
									>
										{t('backToLogin')}
									</Link>
								</div>
							</motion.div>
						)}

						{/* ── Success ── */}
						{done && (
							<motion.div
								key='success'
								variants={pageVariants}
								initial='initial'
								animate='animate'
								exit='exit'
								className='space-y-6 text-center'
							>
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

								<div className='space-y-2'>
									<h1 className='text-2xl font-bold text-foreground'>
										{t('resetPasswordSuccess')}
									</h1>
									<p className='text-sm text-muted-foreground leading-relaxed'>
										{t('resetPasswordSuccessDesc')}
									</p>
								</div>

								<Link href='/login' className='w-full'>
									<Button className='w-full h-9'>{t('backToLogin')}</Button>
								</Link>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</div>

			{/* Right — Grainient */}
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
						{t('resetPasswordLeftSubtitle')}
					</p>
				</div>
			</div>
		</div>
	)
}

// Wrap in Suspense because useSearchParams requires it in Next.js App Router
export default function ResetPasswordPage() {
	return (
		<Suspense
			fallback={
				<div className='min-h-screen flex items-center justify-center bg-background'>
					<Loader2 className='w-10 h-10 animate-spin text-primary/40' />
				</div>
			}
		>
			<ResetPasswordContent />
		</Suspense>
	)
}
