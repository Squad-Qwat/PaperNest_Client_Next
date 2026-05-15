'use client'

import { CheckIcon, EyeIcon, EyeOffIcon, XIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { FaGithub } from 'react-icons/fa'
import { FcGoogle } from 'react-icons/fc'
import { TurnstileWidget } from '@/components/auth/TurnstileWidget'
import { MicrosoftIconIcon } from '@/components/icons/logos-microsoft-icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import Grainient from '@/components/visuals/Grainient/Grainient'
import { useAuth } from '@/context/AuthContext'
import { useCheckEmail, useRegister, useSignInWithSocial } from '@/lib/api/hooks/use-auth'
import { useCreateWorkspace, useJoinWorkspace } from '@/lib/api/hooks/use-workspaces'
import type { UserRole } from '@/lib/api/types/user.types'
import { getErrorMessage } from '@/lib/api/utils/error-handler'
import { cn } from '@/lib/utils'

type StepData = {
	email: string
	password: string
	confirmPassword: string
	name: string
	username: string
	role: UserRole
	workspaceMode: 'create' | 'join'
	workspaceIcon: string
	workspaceTitle: string
	workspaceDescription: string
	invitationCode: string
}

const workspaceIcons = ['📚', '🎓', '📖', '✍️', '🔬', '💼', '📊', '🎯', '🌟', '💡']

export default function RegisterPage() {
	const _router = useRouter()
	const { setOnboardingData } = useAuth()

	const { mutateAsync: registerUser, isPending: isRegisterPending } = useRegister()
	const { mutateAsync: verifyEmail, isPending: checkingEmail } = useCheckEmail()
	const { mutateAsync: _createWorkspace, isPending: isCreatePending } = useCreateWorkspace()
	const { mutateAsync: _joinWorkspace, isPending: isJoinPending } = useJoinWorkspace()
	const { mutateAsync: socialMutate, isPending: isSocialPending } = useSignInWithSocial({
		setOnboardingData,
	})

	const loading =
		isRegisterPending || isCreatePending || isJoinPending || isSocialPending || checkingEmail

	const [currentStep, setCurrentStep] = useState(1)
	const [direction, setDirection] = useState(0)
	const [formData, setFormData] = useState<StepData>({
		email: '',
		password: '',
		confirmPassword: '',
		name: '',
		username: '',
		role: 'Student',
		workspaceMode: 'create',
		workspaceIcon: '📚',
		workspaceTitle: '',
		workspaceDescription: '',
		invitationCode: '',
	})
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [isVisible, setIsVisible] = useState(false)
	const [isConfirmVisible, setIsConfirmVisible] = useState(false)
	const [turnstileToken, setTurnstileToken] = useState('')

	const requirements = [
		{ regex: /.{8,}/, text: 'At least 8 characters' },
		{ regex: /[a-z]/, text: 'At least 1 lowercase letter' },
		{ regex: /[A-Z]/, text: 'At least 1 uppercase letter' },
		{ regex: /[0-9]/, text: 'At least 1 number' },
		{
			regex: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
			text: 'At least 1 special character',
		},
	]

	const strength = useMemo(() => {
		return requirements.map((req) => ({
			met: req.regex.test(formData.password),
			text: req.text,
		}))
	}, [formData.password])

	const strengthScore = useMemo(() => {
		return strength.filter((req) => req.met).length
	}, [strength])

	const getStrengthColor = (score: number) => {
		if (score === 0) return 'bg-border'
		if (score <= 1) return 'bg-destructive'
		if (score <= 2) return 'bg-orange-500'
		if (score <= 3) return 'bg-amber-500'
		if (score === 4) return 'bg-yellow-400'
		return 'bg-green-500'
	}

	const getStrengthText = (score: number) => {
		if (score === 0) return 'Enter a password'
		if (score <= 2) return 'Weak password'
		if (score <= 3) return 'Medium password'
		if (score === 4) return 'Strong password'
		return 'Very strong password'
	}

	const totalSteps = 4

	const updateFormData = (field: keyof StepData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }))
		setErrors((prev) => ({ ...prev, [field]: '' }))
	}

	// Step 1: Email validation
	const validateStep1 = (): boolean => {
		const newErrors: Record<string, string> = {}

		if (!formData.email) {
			newErrors.email = 'Email is required'
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			newErrors.email = 'Please enter a valid email address'
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	// Step 2: Password validation
	const validateStep2 = (): boolean => {
		const newErrors: Record<string, string> = {}

		if (!formData.password) {
			newErrors.password = 'Password is required'
		} else if (strengthScore < 5) {
			newErrors.password = 'Please meet all password requirements'
		}

		if (!formData.confirmPassword) {
			newErrors.confirmPassword = 'Please confirm your password'
		} else if (formData.password !== formData.confirmPassword) {
			newErrors.confirmPassword = 'Passwords do not match'
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	// Step 3: User details validation
	const validateStep3 = (): boolean => {
		const newErrors: Record<string, string> = {}

		if (!formData.name) {
			newErrors.name = 'Name is required'
		} else if (formData.name.length < 2) {
			newErrors.name = 'Name must be at least 2 characters'
		}

		if (!formData.username) {
			newErrors.username = 'Username is required'
		} else if (formData.username.length < 3) {
			newErrors.username = 'Username must be at least 3 characters'
		} else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
			newErrors.username = 'Username can only contain letters, numbers, and underscores'
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	// Step 4: Workspace validation
	const validateStep4 = (): boolean => {
		const newErrors: Record<string, string> = {}

		if (formData.workspaceMode === 'create') {
			if (!formData.workspaceTitle) {
				newErrors.workspaceTitle = 'Workspace title is required'
			} else if (formData.workspaceTitle.length < 3) {
				newErrors.workspaceTitle = 'Workspace title must be at least 3 characters'
			}
		} else if (formData.workspaceMode === 'join') {
			if (!formData.invitationCode) {
				newErrors.invitationCode = 'Invitation code is required'
			} else if (formData.invitationCode.length < 3) {
				newErrors.invitationCode = 'Invalid invitation code'
			}
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	// Handle next step
	const handleNext = async () => {
		let isValid = false

		switch (currentStep) {
			case 1:
				isValid = validateStep1()
				if (isValid) {
					if (!turnstileToken) {
						setErrors({ email: 'Please complete the captcha verification' })
						isValid = false
					} else {
						// Check email availability early
						try {
							const result = await verifyEmail(formData.email)
							if (!result.available) {
								setErrors({
									email: 'This email is already registered. Please use another one or log in.',
								})
								isValid = false
							}
						} catch (_err) {
							setErrors({ email: 'Failed to verify email. Please try again.' })
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
		} else if (isValid && currentStep === totalSteps) {
			handleSubmit()
		}
	}

	// Handle back step
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
					mode: formData.workspaceMode,
					invitationCode: formData.invitationCode,
				},
			})
		} catch (error) {
			console.error('Registration failed:', error)
			setErrors({ submit: getErrorMessage(error) })
		}
	}

	const handleSocialSignup = async (provider: 'google' | 'github' | 'microsoft') => {
		if (!turnstileToken) {
			setErrors({ submit: 'Please complete the captcha verification first' })
			return
		}
		setErrors({})
		try {
			await socialMutate({ providerName: provider, turnstileToken })
		} catch (error) {
			setErrors({ submit: getErrorMessage(error) })
		}
	}

	const displayError = errors.submit

	const variants: any = {
		initial: (direction: number) => ({
			x: direction > 0 ? 20 : -20,
			opacity: 0,
			filter: 'blur(4px)',
		}),
		animate: {
			x: 0,
			opacity: 1,
			filter: 'blur(0px)',
			transition: {
				duration: 0.4,
				ease: [0.23, 1, 0.32, 1],
			},
		},
		exit: (direction: number) => ({
			x: direction > 0 ? -20 : 20,
			opacity: 0,
			filter: 'blur(4px)',
			transition: {
				duration: 0.3,
				ease: 'easeInOut',
			},
		}),
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
				{/* Registration Card */}
				<div className='w-full max-w-sm space-y-6 overflow-hidden'>
					{/* Error Message */}
					{displayError && (
						<div className='mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center'>
							{displayError}
						</div>
					)}

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
									{/* Title */}
									<div className='text-center'>
										<h1 className='text-2xl font-bold text-gray-900 mb-2'>Create your account</h1>
										<p className='text-sm text-gray-500'>
											Step {currentStep} of {totalSteps} - Account
										</p>
									</div>

									{/* Social Sign Up */}
									<div className='grid grid-cols-3 gap-3 sm:grid-cols-1'>
										<Button
											type='button'
											variant='outline'
											onClick={() => handleSocialSignup('google')}
											disabled={loading}
										>
											<FcGoogle />
											<span className='hidden sm:inline'>Continue with Google</span>
										</Button>
										<Button
											type='button'
											variant='outline'
											onClick={() => handleSocialSignup('github')}
											disabled={loading}
										>
											<FaGithub />
											<span className='hidden sm:inline'>Continue with GitHub</span>
										</Button>
										<Button
											type='button'
											variant='outline'
											onClick={() => handleSocialSignup('microsoft')}
											disabled={loading}
										>
											<MicrosoftIconIcon />
											<span className='hidden sm:inline'>Continue with Microsoft</span>
										</Button>
									</div>

									{/* Divider */}
									<div className='relative'>
										<div className='absolute inset-0 flex items-center'>
											<div className='w-full border-t border-gray-200'></div>
										</div>
										<div className='relative flex justify-center text-sm'>
											<span className='px-4 bg-white text-gray-500'>
												Or Continue With Your Credentials
											</span>
										</div>
									</div>

									{/* Email Input */}
									<div className='space-y-2'>
										<Label htmlFor='email' className='text-gray-900 font-normal'>
											Email
										</Label>
										<Input
											id='email'
											type='email'
											value={formData.email}
											onChange={(e) => updateFormData('email', e.target.value)}
											placeholder='Enter your email'
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
										<h1 className='text-2xl font-bold text-gray-900 mb-2'>Create a new password</h1>
										<p className='text-sm text-gray-500'>
											Step {currentStep} of {totalSteps} - Password
										</p>
									</div>

									<div className='space-y-2'>
										<Label htmlFor='password'>Password</Label>
										<div className='relative'>
											<Input
												id='password'
												type={isVisible ? 'text' : 'password'}
												value={formData.password}
												onChange={(e) => updateFormData('password', e.target.value)}
												placeholder='Password'
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
											{getStrengthText(strengthScore)}. Must contain:
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
										{errors.password && <p className='text-sm text-red-600'>{errors.password}</p>}
									</div>

									<div className='space-y-2'>
										<Label htmlFor='confirmPassword'>Confirm Password</Label>
										<div className='relative'>
											<Input
												id='confirmPassword'
												type={isConfirmVisible ? 'text' : 'password'}
												value={formData.confirmPassword}
												onChange={(e) => updateFormData('confirmPassword', e.target.value)}
												placeholder='Confirm your password'
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
									{/* Title */}
									<div className='text-center'>
										<h1 className='text-2xl font-bold text-gray-900 mb-2'>Your credentials</h1>
										<p className='text-sm text-gray-500'>
											Step {currentStep} of {totalSteps} - User Details
										</p>
									</div>

									<div className='space-y-2'>
										<Label htmlFor='name' className='text-gray-900 font-normal'>
											Full Name
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
										<Label htmlFor='username' className='text-gray-900 font-normal'>
											Username
										</Label>
										<Input
											id='username'
											type='text'
											value={formData.username}
											onChange={(e) => updateFormData('username', e.target.value)}
											placeholder='Create your username'
										/>
										{errors.username && <p className='text-sm text-red-600'>{errors.username}</p>}
									</div>

									<div className='space-y-2'>
										<Label className='text-gray-900 font-normal'>Select role</Label>
										<div className=''>
											<Select
												value={formData.role}
												onValueChange={(value) => updateFormData('role', value as UserRole)}
											>
												<SelectTrigger className='w-full'>
													<SelectValue placeholder='Select a role' />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value='Student'>Student</SelectItem>
													<SelectItem value='Lecturer'>Lecturer</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</div>
								</div>
							)}

							{/* Step 4: Workspace */}
							{currentStep === 4 && (
								<div className='space-y-6'>
									{/* Title */}
									<div className='text-center'>
										<h1 className='text-2xl font-bold text-gray-900 mb-2'>
											{formData.workspaceMode === 'create'
												? 'Create Your Workspace'
												: 'Join a Workspace'}
										</h1>
										<p className='text-sm text-gray-500'>
											Step {currentStep} of {totalSteps} - Workspace Setup
										</p>
									</div>

									{/* Workspace Mode Radio */}
									<RadioGroup
										className='w-full grid grid-cols-2 gap-3'
										value={formData.workspaceMode}
										onValueChange={(value) =>
											updateFormData('workspaceMode', value as 'create' | 'join')
										}
									>
										<div className='border-input has-data-[state=checked]:bg-teal-500 has-data-[state=checked]:text-white relative flex flex-col gap-2 border p-4 rounded-lg outline-none has-data-[state=checked]:z-10 transition-all'>
											<div className='group flex flex-col gap-2'>
												<div className='flex items-center gap-2'>
													<RadioGroupItem
														id='mode-create'
														value='create'
														aria-label='create-workspace'
														className='text-primary bg-white data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:[&_svg]:fill-teal-500 after:absolute after:inset-0'
													/>
													<Label className='font-semibold cursor-pointer' htmlFor='mode-create'>
														Create New
													</Label>
												</div>
												<p className='text-xs opacity-80 pl-6'>Start your own workspace</p>
											</div>
										</div>
										<div className='border-input has-data-[state=checked]:bg-teal-500 has-data-[state=checked]:text-white relative flex flex-col gap-2 border p-4 rounded-lg outline-none has-data-[state=checked]:z-10 transition-all'>
											<div className='group flex flex-col gap-2'>
												<div className='flex items-center gap-2'>
													<RadioGroupItem
														id='mode-join'
														value='join'
														aria-label='join-workspace'
														className='text-primary bg-white data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:[&_svg]:fill-teal-500 after:absolute after:inset-0'
													/>
													<Label className='font-semibold cursor-pointer' htmlFor='mode-join'>
														Join Existing
													</Label>
												</div>
												<p className='text-xs opacity-80 pl-6'>Use an invitation code</p>
											</div>
										</div>
									</RadioGroup>

									{/* Create Workspace Form */}
									{formData.workspaceMode === 'create' && (
										<>
											<div className='space-y-2'>
												<Label className='text-gray-900 font-normal'>Workspace Icon</Label>
												<div className='grid grid-cols-5 gap-2'>
													{workspaceIcons.map((icon) => (
														<button
															key={icon}
															type='button'
															onClick={() => updateFormData('workspaceIcon', icon)}
															className={`p-3 text-2xl border rounded-lg transition-all hover:scale-105 ${
																formData.workspaceIcon === icon
																	? 'bg-teal-500 border-teal-400'
																	: 'bg-white border-gray-200 hover:border-gray-300'
															}`}
														>
															{icon}
														</button>
													))}
												</div>
											</div>

											<div className='space-y-2'>
												<Label htmlFor='workspaceTitle' className='text-gray-900 font-normal'>
													Workspace Title <span className='text-red-500'>*</span>
												</Label>
												<Input
													id='workspaceTitle'
													type='text'
													value={formData.workspaceTitle}
													onChange={(e) => updateFormData('workspaceTitle', e.target.value)}
													placeholder='My Research Workspace'
												/>
												{errors.workspaceTitle && (
													<p className='text-sm text-red-600'>{errors.workspaceTitle}</p>
												)}
											</div>

											<div className='space-y-2'>
												<Label htmlFor='workspaceDescription' className='text-gray-900 font-normal'>
													Workspace Description (Optional)
												</Label>
												<Textarea
													id='workspaceDescription'
													value={formData.workspaceDescription}
													onChange={(e) => updateFormData('workspaceDescription', e.target.value)}
													placeholder='A workspace for my research papers and projects'
													rows={3}
													className='resize-none'
												/>
											</div>
										</>
									)}

									{/* Join Workspace Form */}
									{formData.workspaceMode === 'join' && (
										<div className='space-y-2'>
											<Label htmlFor='invitationCode' className='text-gray-900 font-normal'>
												Invitation Code <span className='text-red-500'>*</span>
											</Label>
											<Input
												id='invitationCode'
												type='text'
												value={formData.invitationCode}
												onChange={(e) => updateFormData('invitationCode', e.target.value)}
												placeholder='Enter your invitation code'
											/>
											{errors.invitationCode && (
												<p className='text-sm text-red-600'>{errors.invitationCode}</p>
											)}
											<p className='text-xs text-gray-500'>
												Ask your workspace owner for an invitation code to join their workspace.
											</p>
										</div>
									)}
								</div>
							)}
						</motion.div>
					</AnimatePresence>

					{/* Navigation Buttons */}
					<div className='flex items-center gap-3 mt-8'>
						{currentStep > 1 && (
							<Button
								type='button'
								variant='outline'
								onClick={handleBack}
								disabled={loading}
								className='flex-1'
							>
								← Back
							</Button>
						)}
						<Button
							type='button'
							onClick={handleNext}
							disabled={loading || checkingEmail}
							className={`${currentStep === 1 ? 'w-full' : 'flex-1'}`}
						>
							{loading
								? 'Creating account...'
								: checkingEmail
									? 'Checking email...'
									: currentStep === totalSteps
										? 'Finish ✓'
										: 'Continue →'}
						</Button>
					</div>

					{/* Login Link */}
					{currentStep === 1 && (
						<div className='mt-6 text-center text-sm text-gray-600'>
							Have an account?{' '}
							<Link
								href='/login'
								className='text-gray-900 hover:text-gray-700 font-medium underline transition-colors'
							>
								Log in
							</Link>
						</div>
					)}
				</div>
			</div>
			{/* Right Side - Gradient Background with Text */}
			<div className='hidden lg:flex lg:w-1/2 min-h-screen relative'>
				{/* Gradient Background */}
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
				{/* Text Overlay */}
				<div className='absolute inset-0 flex flex-col items-center justify-center z-10 px-8'>
					<p
						className='text-xl text-white text-center mt-4 max-w-sm italic'
						style={{ fontFamily: 'Times New Roman, Times, serif' }}
					>
						"Your all-in-one research workspace for managing papers, projects, and collaboration.
						Sign up now to organize your research like never before!"
					</p>
				</div>
			</div>
		</div>
	)
}
