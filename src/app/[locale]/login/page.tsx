'use client'

import { EyeIcon, EyeOffIcon, Link2 } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type React from 'react'
import { useState } from 'react'
import { AuthErrorMessage } from '@/components/auth/AuthErrorMessage'
import { AuthPageLayout } from '@/components/auth/AuthPageLayout'
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons'
import { TurnstileWidget } from '@/components/auth/TurnstileWidget'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'
import { useLoginEmail, useSignInWithSocial } from '@/lib/api/hooks/use-auth'
import { getErrorMessage } from '@/lib/api/utils/error-handler'

export default function LoginPage() {
	const t = useTranslations('Auth')
	const { setOnboardingData } = useAuth()

	const { mutateAsync: loginEmailMutate, isPending: isEmailPending } = useLoginEmail()
	const {
		mutateAsync: socialMutate,
		isPending: isSocialPending,
		linkingSession,
		linkMutation,
		resetLinking,
	} = useSignInWithSocial({ setOnboardingData })

	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [localError, setLocalError] = useState('')
	const [turnstileToken, setTurnstileToken] = useState('')
	const [showPassword, setShowPassword] = useState(false)

	const isLinking = linkMutation.isPending
	const loading = isEmailPending || isSocialPending || isLinking

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLocalError('')

		if (!email || !password) {
			setLocalError(t('fillAllFields'))
			return
		}

		if (!email.includes('@')) {
			setLocalError(t('validEmail'))
			return
		}

		if (!turnstileToken) {
			setLocalError(t('captchaVerify'))
			return
		}

		try {
			await loginEmailMutate({ email, password, turnstileToken })
		} catch (err) {
			setLocalError(getErrorMessage(err))
		}
	}

	const handleSocialLogin = async (provider: 'google' | 'github' | 'microsoft') => {
		if (!turnstileToken) {
			setLocalError(t('captchaVerifyFirst'))
			return
		}
		setLocalError('')
		resetLinking()
		try {
			await socialMutate({ providerName: provider, turnstileToken })
		} catch (err: any) {
			if (err.message === 'ACCOUNT_EXISTS_CONFLICT') {
				return // Handled by linkingSession UI
			}
			if (err.message === 'PASSWORD_CONFLICT') {
				setLocalError(t('passwordConflict'))
				return
			}
			setLocalError(getErrorMessage(err))
		}
	}

	return (
		<AuthPageLayout quote={t('loginLeftSubtitle')}>
			{/* Title */}
			<div className='text-center'>
				<h1 className='text-2xl font-bold text-foreground mb-2'>{t('loginTitle')}</h1>
				<p className='text-sm text-muted-foreground'>{t('welcomeBack')}</p>
			</div>

			{/* Error Message */}
			<AuthErrorMessage message={localError} />

			{/* Linking Modal */}
			<Dialog open={!!linkingSession} onOpenChange={(open) => !open && resetLinking()}>
				<DialogContent className='sm:max-w-md'>
					<DialogHeader>
						<div className='flex justify-center mb-4'>
							<div className='p-3 rounded-full bg-primary/10 text-primary'>
								<Link2 className='w-6 h-6' />
							</div>
						</div>
						<DialogTitle className='text-center text-lg font-semibold'>
							{t('linkAccount')}
						</DialogTitle>
						<DialogDescription className='text-center text-sm'>
							{t('linkDescription', {
								email: linkingSession?.email,
								target: linkingSession?.targetMethod.split('.')[0],
								providerName: linkingSession?.providerName,
							})}
						</DialogDescription>
					</DialogHeader>
					<div className='grid gap-2 mt-4'>
						<Button
							className='w-full'
							onClick={() => linkMutation.mutate(turnstileToken)}
							disabled={isLinking || !turnstileToken}
						>
							{isLinking ? t('linkingAccount') : t('linkNow')}
						</Button>
						<Button
							variant='outline'
							className='w-full'
							onClick={resetLinking}
							disabled={isLinking}
						>
							{t('cancel')}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Social Login */}
			<SocialLoginButtons
				onLogin={handleSocialLogin}
				disabled={loading}
				labels={{
					google: t('continueWithGoogle'),
					github: t('continueWithGithub'),
					microsoft: t('continueWithMicrosoft'),
					or: t('orCredentials'),
				}}
			/>

			{/* Login Form */}
			<form onSubmit={handleSubmit} className='space-y-6'>
				<div className='space-y-2'>
					<Label htmlFor='email' className='text-foreground font-normal'>
						{t('email')}
					</Label>
					<Input
						id='email'
						type='email'
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder={t('enterEmail')}
						disabled={loading}
					/>
				</div>

				<div className='space-y-2'>
					<Label htmlFor='password' className='text-foreground font-normal'>
						{t('password')}
					</Label>
					<div className='relative'>
						<Input
							id='password'
							type={showPassword ? 'text' : 'password'}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder={t('enterPassword')}
							disabled={loading}
							className='pr-9'
						/>
						<Button
							variant='ghost'
							size='icon'
							type='button'
							onClick={() => setShowPassword(!showPassword)}
							className='text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent'
							disabled={loading}
						>
							{showPassword ? <EyeOffIcon className='size-4' /> : <EyeIcon className='size-4' />}
						</Button>
					</div>
					<div className='text-right'>
						<Link
							href='/forgot-password'
							className='text-sm text-teal-500 hover:text-teal-600 transition-colors'
						>
							{t('forgotPassword')}
						</Link>
					</div>
				</div>

				<TurnstileWidget onVerify={setTurnstileToken} />

				<Button type='submit' className='w-full' disabled={loading}>
					{loading ? t('loggingIn') : t('login')}
				</Button>
			</form>

			{/* Sign Up Link */}
			<div className='mt-6 text-center text-sm text-muted-foreground'>
				{t('dontHaveAccount')}{' '}
				<Link
					href='/register'
					className='text-foreground hover:text-muted-foreground font-medium underline transition-colors'
				>
					{t('join')}
				</Link>
			</div>
		</AuthPageLayout>
	)
}
