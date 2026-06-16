'use client'

import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ButtonSpinner } from '@/components/ui/button-spinner'
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
import Grainient from '@/components/visuals/Grainient/Grainient'
import { useAuth } from '@/context/AuthContext'
import { useCompleteSocialRegistration } from '@/lib/api/hooks/use-auth'
import { useCreateWorkspace } from '@/lib/api/hooks/use-workspaces'
import type { UserRole } from '@/lib/api/types/user.types'
import { getErrorMessage } from '@/lib/api/utils/error-handler'

const workspaceIcons = ['📚', '🎓', '📖', '✍️', '🔬', '💼', '📊', '🎯', '🌟', '💡']

export default function OnboardingPage() {
	const router = useRouter()
	const { onboardingData, setOnboardingData } = useAuth()
	const t = useTranslations('Auth')

	const { mutateAsync: completeSocial, isPending: isCompletePending } =
		useCompleteSocialRegistration({
			clearOnboardingData: () => setOnboardingData(null),
		})
	const { mutateAsync: createWorkspace, isPending: isCreatePending } = useCreateWorkspace()

	const loading = isCompletePending || isCreatePending

	const [currentStep, setCurrentStep] = useState(1)
	const [direction, setDirection] = useState(0)
	const [formData, setFormData] = useState({
		username: '',
		role: 'Student' as UserRole,
		workspaceIcon: '📚',
		workspaceTitle: '',
		workspaceDescription: '',
	})
	const [errors, setErrors] = useState<Record<string, string>>({})

	// Initialize username from email
	useEffect(() => {
		if (onboardingData?.firebaseData?.email && !formData.username) {
			const baseUsername = onboardingData.firebaseData.email.split('@')[0]
			setFormData((prev) => ({ ...prev, username: baseUsername }))
		} else if (!onboardingData) {
			router.push('/login')
		}
	}, [onboardingData, router, formData.username])

	const validateStep1 = () => {
		const newErrors: Record<string, string> = {}
		if (!formData.username) {
			newErrors.username = t('usernameRequired')
		} else if (formData.username.length < 3) {
			newErrors.username = t('usernameMinLength')
		} else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
			newErrors.username = t('usernameFormat')
		}
		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	const validateStep2 = () => {
		const newErrors: Record<string, string> = {}
		if (!formData.workspaceTitle) {
			newErrors.workspaceTitle = t('workspaceTitleRequired')
		} else if (formData.workspaceTitle.length < 3) {
			newErrors.workspaceTitle = t('workspaceTitleMinLength')
		}
		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	const handleNext = () => {
		if (currentStep === 1) {
			if (validateStep1()) {
				setDirection(1)
				setCurrentStep(2)
			}
		} else {
			if (validateStep2()) handleSubmit()
		}
	}

	const handleBack = () => {
		if (currentStep > 1) {
			setDirection(-1)
			setCurrentStep(currentStep - 1)
		}
	}

	const handleSubmit = async () => {
		try {
			// 1. Create User via Backend Onboarding
			await completeSocial({
				firebaseToken: onboardingData.token,
				username: formData.username,
				role: formData.role,
				email: onboardingData.firebaseData.email,
			})

			// 2. Create Workspace
			await createWorkspace({
				title: formData.workspaceTitle,
				description: formData.workspaceDescription || undefined,
				icon: formData.workspaceIcon,
			})

			router.push('/')
		} catch (err) {
			console.error('Onboarding flow failed:', err)
			setErrors({ submit: getErrorMessage(err) })
		}
	}

	const updateField = (field: string, value: any) => {
		setFormData((prev) => ({ ...prev, [field]: value }))
		setErrors((prev) => ({ ...prev, [field]: '' }))
	}

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

	if (!onboardingData) return null

	return (
		<div className='min-h-screen flex min-w-screen bg-background'>
			{/* Left Side - Form Container */}
			<div className='w-full lg:w-1/2 min-h-screen flex flex-col items-center justify-center py-8 px-4 sm:px-6 md:px-8 lg:px-10 relative overflow-y-auto'>
				{/* Logo */}
				<div className='absolute top-8 left-8 lg:left-10'>
					<h1 className='text-3xl font-bold text-primary'>PaperNest</h1>
				</div>

				<div className='w-full max-w-sm space-y-6'>
					<div className='text-center'>
						<h1 className='text-2xl font-bold text-foreground mb-1'>
							{currentStep === 1 ? t('completeProfile') : t('setupWorkspace')}
						</h1>
						<p className='text-sm text-muted-foreground'>
							{t('step', { current: currentStep, total: 2 })}
						</p>
					</div>

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
							{/* Step 1: Profile Details */}
							{currentStep === 1 && (
								<div className='space-y-6'>
									{/* Profile Preview */}
									<div className='flex flex-col items-center gap-3 p-4 bg-muted rounded-xl'>
										{onboardingData.firebaseData.picture ? (
											<div className='relative w-16 h-16'>
												<Image
													src={onboardingData.firebaseData.picture}
													alt='Profile'
													fill
													className='rounded-full border-2 border-primary object-cover'
													unoptimized
												/>
											</div>
										) : (
											<div className='w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold'>
												{onboardingData.firebaseData.name?.[0] || 'U'}
											</div>
										)}
										<div className='text-center'>
											<p className='font-medium text-foreground'>
												{onboardingData.firebaseData.name}
											</p>
											<p className='text-xs text-muted-foreground'>
												{onboardingData.firebaseData.email}
											</p>
										</div>
									</div>

									<div className='space-y-2'>
										<Label htmlFor='username'>{t('username')}</Label>
										<Input
											id='username'
											value={formData.username}
											onChange={(e) => updateField('username', e.target.value)}
											placeholder='your_username'
										/>
										{errors.username && <p className='text-xs text-red-500'>{errors.username}</p>}
									</div>

									<div className='space-y-2'>
										<Label>{t('yourRole')}</Label>
										<Select
											value={formData.role}
											onValueChange={(val) => updateField('role', val as UserRole)}
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

							{/* Step 2: Workspace Setup (Directly from register/page.tsx logic) */}
							{currentStep === 2 && (
								<div className='space-y-6 animate-in fade-in duration-300'>
									<div className='space-y-2'>
										<Label className='text-sm font-medium'>{t('workspaceIcon')}</Label>
										<div className='grid grid-cols-5 gap-2'>
											{workspaceIcons.map((icon) => (
												<button
													key={icon}
													type='button'
													onClick={() => updateField('workspaceIcon', icon)}
													className={`p-2 text-xl border rounded-lg transition-all ${formData.workspaceIcon === icon ? 'bg-teal-500 border-teal-400 text-white' : 'bg-muted/50 border-border hover:border-muted-foreground text-foreground'}`}
												>
													{icon}
												</button>
											))}
										</div>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='workspaceTitle'>{t('workspaceTitle')}</Label>
										<Input
											id='workspaceTitle'
											value={formData.workspaceTitle}
											onChange={(e) => updateField('workspaceTitle', e.target.value)}
											placeholder='My Research Lab'
										/>
										{errors.workspaceTitle && (
											<p className='text-xs text-red-500'>{errors.workspaceTitle}</p>
										)}
									</div>
									<div className='space-y-2'>
										<Label htmlFor='workspaceDescription'>{t('workspaceDescription')}</Label>
										<Textarea
											id='workspaceDescription'
											value={formData.workspaceDescription}
											onChange={(e) => updateField('workspaceDescription', e.target.value)}
											placeholder={t('workspaceDescPlaceholder')}
											rows={2}
										/>
									</div>
								</div>
							)}
						</motion.div>
					</AnimatePresence>

					{errors.submit && (
						<div className='mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm text-center'>
							{errors.submit}
						</div>
					)}

					{/* Navigation */}
					<div className='flex items-center gap-3 pt-4'>
						{currentStep === 2 && (
							<Button variant='outline' onClick={handleBack} disabled={loading} className='flex-1'>
								{t('back')}
							</Button>
						)}
						<Button onClick={handleNext} disabled={loading} className='flex-1'>
							{loading ? (
								<>
									<ButtonSpinner />
									{currentStep === 1 ? t('continue') : t('finish')}
								</>
							) : currentStep === 1 ? (
								t('continue')
							) : (
								t('finish')
							)}
						</Button>
					</div>
				</div>
			</div>

			{/* Right Side - Visual */}
			<div className='hidden lg:flex lg:w-1/2 min-h-screen relative'>
				<div className='absolute inset-0 w-full h-full p-6'>
					<Grainient
						color1='#009689'
						color2='#F5A623'
						color3='#009689'
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
						{t('onboardingSubtitle')}
					</p>
				</div>
			</div>
		</div>
	)
}
