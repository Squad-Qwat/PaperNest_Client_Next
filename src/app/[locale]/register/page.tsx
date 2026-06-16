'use client'

import { CheckIcon, EyeIcon, EyeOffIcon, XIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { AuthErrorMessage } from '@/components/auth/AuthErrorMessage'
import { AuthPageLayout } from '@/components/auth/AuthPageLayout'
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons'
import { TurnstileWidget } from '@/components/auth/TurnstileWidget'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/AuthContext'
import { useCheckEmail, useRegister, useSignInWithSocial } from '@/lib/api/hooks/use-auth'
import type { UserRole } from '@/lib/api/types/user.types'
import { getErrorMessage } from '@/lib/api/utils/error-handler'
import { cn } from '@/lib/utils'
import { isValidEmail } from '@/lib/utils/validation'

type StepData = {
	email: string
	password: string
	confirmPassword: string
	name: string
	username: string
	role: UserRole
	workspaceIcon: string
	workspaceTitle: string
	workspaceDescription: string
}

const workspaceIcons = ['📚', '🎓', '📖', '✍️', '🔬', '💼', '📊', '🎯', '🌟', '💡']

const variants = {
	initial: (direction: number) => ({
		x: direction > 0 ? 20 : -20,
		opacity: 0,
		filter: 'blur(4px)',
	}),
	animate: {
		x: 0,
		opacity: 1,
		filter: 'blur(0px)',
		transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as const },
	},
	exit: (direction: number) => ({
		x: direction > 0 ? -20 : 20,
		opacity: 0,
		filter: 'blur(4px)',
		transition: { duration: 0.3, ease: 'easeInOut' as const },
	}),
}

export default function RegisterPage() {
	const t = useTranslations('Auth')
	const tWorkspace = useTranslations('Workspace')
	const { setOnboardingData } = useAuth()

	const { mutateAsync: registerUser, isPending: isRegisterPending } = useRegister()
	const { mutateAsync: verifyEmail, isPending: checkingEmail } = useCheckEmail()
	const { mutateAsync: socialMutate, isPending: isSocialPending } = useSignInWithSocial({
		setOnboardingData,
	})

	const loading = isRegisterPending || isSocialPending

	const [currentStep, setCurrentStep] = useState(1)
	const [direction, setDirection] = useState(0)
	const [formData, setFormData] = useState<StepData>({
		email: '',
		password: '',
		confirmPassword: '',
		name: '',
		username: '',
		role: 'Student',
		workspaceIcon: '📚',
		workspaceTitle: '',
		workspaceDescription: '',
	})
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [isVisible, setIsVisible] = useState(false)
	const [isConfirmVisible, setIsConfirmVisible] = useState(false)
	const [turnstileToken, setTurnstileToken] = useState('')

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
		() => requirements.map((req) => ({ met: req.regex.test(formData.password), text: req.text })),
		[formData.password, requirements]
	)
	const strengthScore = useMemo(() => strength.filter((req) => req.met).length, [strength])

	const getStrengthColor = (score: number) => {
		if (score === 0) return 'bg-border'
		if (score <= 1) return 'bg-destructive'
		if (score <= 2) return 'bg-orange-500'
		if (score <= 3) return 'bg-amber-500'
		if (score === 4) return 'bg-yellow-400'
		return 'bg-green-500'
	}

	const getStrengthText = (score: number) => {
		if (score === 0) return t('strengthEmpty')
		if (score <= 2) return t('strengthWeak')
		if (score <= 3) return t('strengthMedium')
		if (score === 4) return t('strengthStrong')
		return t('strengthVeryStrong')
	}

	const totalSteps = 4

	const updateFormData = (field: keyof StepData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }))
		setErrors((prev) => ({ ...prev, [field]: '' }))
	}

	const validateStep1 = (): boolean => {
		const newErrors: Record<string, string> = {}
		if (!formData.email) newErrors.email = t('enterEmail')
		else if (!isValidEmail(formData.email)) newErrors.email = t('validEmail')
		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	const validateStep2 = (): boolean => {
		const newErrors: Record<string, string> = {}
		if (!formData.password) newErrors.password = t('passwordRequired')
		else if (strengthScore < 5) newErrors.password = t('passwordRequirementsNotMet')
		if (!formData.confirmPassword) newErrors.confirmPassword = t('confirmPasswordRequired')
		else if (formData.password !== formData.confirmPassword)
			newErrors.confirmPassword = t('passwordsDoNotMatch')
		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	const validateStep3 = (): boolean => {
		const newErrors: Record<string, string> = {}
		if (!formData.name) newErrors.name = t('fullNameRequired')
		else if (formData.name.length < 2) newErrors.name = t('fullNameMinLength')
		if (!formData.username) newErrors.username = t('usernameRequired')
		else if (formData.username.length < 3) newErrors.username = t('usernameMinLength')
		else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) newErrors.username = t('usernameFormat')
		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	const validateStep4 = (): boolean => {
		const newErrors: Record<string, string> = {}
		if (!formData.workspaceTitle) newErrors.workspaceTitle = t('workspaceTitleRequired')
		else if (formData.workspaceTitle.length < 3)
			newErrors.workspaceTitle = t('workspaceTitleMinLength')
		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	const handleNext = async () => {
		let isValid = false
		switch (currentStep) {
			case 1:
				isValid = validateStep1()
				if (isValid) {
					if (!turnstileToken) {
						setErrors({ email: t('captchaVerify') })
						isValid = false
					} else {
						try {
							const result = await verifyEmail(formData.email)
							if (!result.available) {
								setErrors({ email: t('emailTaken') })
								isValid = false
							}
						} catch {
							setErrors({ email: t('emailVerifyFailed') })
							isValid = false
						}
					}
				}
				break
			case 2:
				isValid = validateStep2()
				break
			case 3:
				isValid = validateStep3()
				break
			case 4:
				isValid = validateStep4()
				break
		}
		if (isValid && currentStep < totalSteps) {
			setDirection(1)
			setCurrentStep(currentStep + 1)
			setErrors({})
		} else if (isValid && currentStep === totalSteps) handleSubmit()
	}

	const handleBack = () => {
		if (currentStep > 1) {
			setDirection(-1)
			setCurrentStep(currentStep - 1)
			setErrors({})
		}
	}

	const handleSubmit = async () => {
		setErrors({})
		try {
			await registerUser({
				email: formData.email,
				password: formData.password,
				name: formData.name,
				username: formData.username,
				role: formData.role,
				turnstileToken,
				workspaceData: {
					title: formData.workspaceTitle,
					description: formData.workspaceDescription || undefined,
					icon: formData.workspaceIcon,
					mode: 'create',
				},
			})
		} catch (error) {
			setErrors({ submit: getErrorMessage(error) })
		}
	}

	const handleSocialSignup = async (provider: 'google' | 'github' | 'microsoft') => {
		if (!turnstileToken) {
			setErrors({ submit: t('captchaVerifyFirst') })
			return
		}
		setErrors({})
		try {
			await socialMutate({ providerName: provider, turnstileToken })
		} catch (error) {
			setErrors({ submit: getErrorMessage(error) })
		}
	}

	return (
		<AuthPageLayout quote={t('registerLeftSubtitle')}>
			<AuthErrorMessage message={errors.submit} />

			<div className='space-y-6 overflow-hidden'>
				<AnimatePresence mode='wait' custom={direction}>
					<motion.div
						key={currentStep}
						custom={direction}
						variants={variants}
						initial='initial'
						animate='animate'
						exit='exit'
						className='w-full'
					>
						{/* Step 1: Email */}
						{currentStep === 1 && (
							<div className='space-y-6'>
								<div className='text-center'>
									<h1 className='text-2xl font-bold text-foreground mb-2'>{t('createAccount')}</h1>
									<p className='text-sm text-muted-foreground'>
										{t('step', { current: currentStep, total: totalSteps })} - Account
									</p>
								</div>
								<SocialLoginButtons
									onLogin={handleSocialSignup}
									disabled={loading}
									labels={{
										google: t('continueWithGoogle'),
										github: t('continueWithGithub'),
										microsoft: t('continueWithMicrosoft'),
										or: t('orCredentials'),
									}}
								/>
								<div className='space-y-2'>
									<Label htmlFor='email' className='text-foreground font-normal'>
										{t('email')}
									</Label>
									<Input
										id='email'
										type='email'
										value={formData.email}
										onChange={(e) => updateFormData('email', e.target.value)}
										placeholder={t('enterEmail')}
									/>
									{errors.email && <p className='text-sm text-red-600'>{errors.email}</p>}
								</div>
								<TurnstileWidget onVerify={setTurnstileToken} />
							</div>
						)}

						{/* Step 2: Password */}
						{currentStep === 2 && (
							<div className='space-y-6'>
								<div className='text-center'>
									<h1 className='text-2xl font-bold text-foreground mb-2'>
										{t('passwordNewTitle')}
									</h1>
									<p className='text-sm text-muted-foreground'>
										{t('step', { current: currentStep, total: totalSteps })} - Password
									</p>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='password'>{t('password')}</Label>
									<div className='relative'>
										<Input
											id='password'
											type={isVisible ? 'text' : 'password'}
											value={formData.password}
											onChange={(e) => updateFormData('password', e.target.value)}
											placeholder={t('enterPassword')}
											className='pr-9'
										/>
										<Button
											variant='ghost'
											size='icon'
											type='button'
											onClick={() => setIsVisible(!isVisible)}
											className='text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent'
										>
											{isVisible ? (
												<EyeOffIcon className='size-4' />
											) : (
												<EyeIcon className='size-4' />
											)}
										</Button>
									</div>
									<div className='flex h-1 w-full gap-1 mt-3'>
										{[0, 1, 2, 3, 4].map((idx) => (
											<span
												key={idx}
												className={cn(
													'h-full flex-1 rounded-full transition-all duration-500 ease-out',
													idx < strengthScore ? getStrengthColor(strengthScore) : 'bg-border'
												)}
											/>
										))}
									</div>
									<p className='text-foreground text-sm font-medium pt-1'>
										{t('passwordRequirementTitle', {
											strengthText: getStrengthText(strengthScore),
										})}
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
														req.met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
													)}
												>
													{req.text}
												</span>
											</li>
										))}
									</ul>
									{errors.password && <p className='text-sm text-red-600'>{errors.password}</p>}
								</div>
								<div className='space-y-2'>
									<Label htmlFor='confirmPassword'>{t('confirmPassword')}</Label>
									<div className='relative'>
										<Input
											id='confirmPassword'
											type={isConfirmVisible ? 'text' : 'password'}
											value={formData.confirmPassword}
											onChange={(e) => updateFormData('confirmPassword', e.target.value)}
											placeholder={t('confirmPassword')}
											className='pr-9'
										/>
										<Button
											variant='ghost'
											size='icon'
											type='button'
											onClick={() => setIsConfirmVisible(!isConfirmVisible)}
											className='text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent'
										>
											{isConfirmVisible ? (
												<EyeOffIcon className='size-4' />
											) : (
												<EyeIcon className='size-4' />
											)}
										</Button>
									</div>
									{errors.confirmPassword && (
										<p className='text-sm text-red-600'>{errors.confirmPassword}</p>
									)}
								</div>
							</div>
						)}

						{/* Step 3: User Details */}
						{currentStep === 3 && (
							<div className='space-y-6'>
								<div className='text-center'>
									<h1 className='text-2xl font-bold text-foreground mb-2'>
										{t('credentialsTitle')}
									</h1>
									<p className='text-sm text-muted-foreground'>
										{t('step', { current: currentStep, total: totalSteps })} - User Details
									</p>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='name' className='text-foreground font-normal'>
										{t('fullNameLabel')}
									</Label>
									<Input
										id='name'
										type='text'
										value={formData.name}
										onChange={(e) => updateFormData('name', e.target.value)}
										placeholder='John Doe'
									/>
									{errors.name && <p className='text-sm text-red-600'>{errors.name}</p>}
								</div>
								<div className='space-y-2'>
									<Label htmlFor='username' className='text-foreground font-normal'>
										{t('username')}
									</Label>
									<Input
										id='username'
										type='text'
										value={formData.username}
										onChange={(e) => updateFormData('username', e.target.value)}
										placeholder={t('createUsernamePlaceholder')}
									/>
									{errors.username && <p className='text-sm text-red-600'>{errors.username}</p>}
								</div>
								<div className='space-y-2'>
									<Label className='text-foreground font-normal'>{t('yourRole')}</Label>
									<Select
										value={formData.role}
										onValueChange={(value) => updateFormData('role', value as UserRole)}
									>
										<SelectTrigger className='w-full'>
											<SelectValue placeholder={t('selectRole')} />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='Student'>{t('student')}</SelectItem>
											<SelectItem value='Lecturer'>{t('lecturer')}</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						)}

						{/* Step 4: Workspace */}
						{currentStep === 4 && (
							<div className='space-y-6'>
								<div className='text-center'>
									<h1 className='text-2xl font-bold text-foreground mb-2'>{t('setupWorkspace')}</h1>
									<p className='text-sm text-muted-foreground'>
										{t('step', { current: currentStep, total: totalSteps })} - Workspace Setup
									</p>
								</div>
								<div className='space-y-6'>
									<div className='space-y-2'>
										<Label className='text-foreground font-normal'>{t('workspaceIcon')}</Label>
										<div className='grid grid-cols-5 gap-2'>
											{workspaceIcons.map((icon) => (
												<button
													key={icon}
													type='button'
													onClick={() => updateFormData('workspaceIcon', icon)}
													className={`p-3 text-2xl border rounded-lg transition-all hover:scale-105 ${formData.workspaceIcon === icon ? 'bg-teal-500 border-teal-400 text-white' : 'bg-muted/50 border-border hover:bg-muted text-foreground'}`}
												>
													{icon}
												</button>
											))}
										</div>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='workspaceTitle' className='text-foreground font-normal'>
											{t('workspaceTitle')}
										</Label>
										<Input
											id='workspaceTitle'
											type='text'
											value={formData.workspaceTitle}
											onChange={(e) => updateFormData('workspaceTitle', e.target.value)}
											placeholder={tWorkspace('titlePlaceholder')}
										/>
										{errors.workspaceTitle && (
											<p className='text-sm text-red-600'>{errors.workspaceTitle}</p>
										)}
									</div>
									<div className='space-y-2'>
										<Label htmlFor='workspaceDescription' className='text-foreground font-normal'>
											{t('workspaceDescription')}
										</Label>
										<Textarea
											id='workspaceDescription'
											value={formData.workspaceDescription}
											onChange={(e) => updateFormData('workspaceDescription', e.target.value)}
											placeholder={t('workspaceDescPlaceholder')}
											rows={3}
											className='resize-none'
										/>
									</div>
								</div>
							</div>
						)}
					</motion.div>
				</AnimatePresence>

				{/* Navigation */}
				<div className='flex items-center gap-3 mt-8'>
					{currentStep > 1 && (
						<Button
							type='button'
							variant='outline'
							onClick={handleBack}
							disabled={loading || checkingEmail}
							className='flex-1'
						>
							{t('back')}
						</Button>
					)}
					<Button
						type='button'
						onClick={handleNext}
						disabled={loading || checkingEmail}
						className={currentStep === 1 ? 'w-full' : 'flex-1'}
					>
						{checkingEmail
							? t('checkingEmail')
							: loading
								? t('creatingAccount')
								: currentStep === totalSteps
									? t('finish')
									: t('continue')}
					</Button>
				</div>

				{currentStep === 1 && (
					<div className='mt-6 text-center text-sm text-muted-foreground'>
						{t('haveAccount')}{' '}
						<Link
							href='/login'
							className='text-foreground hover:text-muted-foreground font-medium underline transition-colors'
						>
							{t('login')}
						</Link>
					</div>
				)}
			</div>
		</AuthPageLayout>
	)
}
