'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/context/AuthContext'
import { motion, AnimatePresence } from 'motion/react'
import { useCompleteSocialRegistration } from '@/lib/api/hooks/use-auth'
import { useCreateWorkspace, useJoinWorkspace } from '@/lib/api/hooks/use-workspaces'
import { getErrorMessage } from '@/lib/api/utils/error-handler'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import Grainient from '@/components/visuals/Grainient/Grainient'
import type { UserRole } from '@/lib/api/types/user.types'

const workspaceIcons = ['📚', '🎓', '📖', '✍️', '🔬', '💼', '📊', '🎯', '🌟', '💡']

export default function OnboardingPage() {
	const router = useRouter()
	const { onboardingData, setOnboardingData, error: authError } = useAuthContext()
	
	const { mutateAsync: completeSocial, isPending: isCompletePending } = useCompleteSocialRegistration({
		clearOnboardingData: () => setOnboardingData(null)
	})
	const { mutateAsync: createWorkspace, isPending: isCreatePending } = useCreateWorkspace()
	const { mutateAsync: joinWorkspace, isPending: isJoinPending } = useJoinWorkspace()

	const loading = isCompletePending || isCreatePending || isJoinPending
	
	const [currentStep, setCurrentStep] = useState(1)
	const [direction, setDirection] = useState(0)
	const [formData, setFormData] = useState({
		username: '',
		role: 'Student' as UserRole,
		workspaceMode: 'create' as 'create' | 'join',
		workspaceIcon: '📚',
		workspaceTitle: '',
		workspaceDescription: '',
		invitationCode: '',
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
	}, [onboardingData, router])

	const validateStep1 = () => {
		const newErrors: Record<string, string> = {}
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

	const validateStep2 = () => {
		const newErrors: Record<string, string> = {}
		if (formData.workspaceMode === 'create') {
			if (!formData.workspaceTitle) {
				newErrors.workspaceTitle = 'Workspace title is required'
			} else if (formData.workspaceTitle.length < 3) {
				newErrors.workspaceTitle = 'Workspace title must be at least 3 characters'
			}
		} else {
			if (!formData.invitationCode) {
				newErrors.invitationCode = 'Invitation code is required'
			}
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
			})

			// 2. Create or Join Workspace
			if (formData.workspaceMode === 'create') {
				await createWorkspace({
					title: formData.workspaceTitle,
					description: formData.workspaceDescription || undefined,
					icon: formData.workspaceIcon,
				})
			} else {
				await joinWorkspace(formData.invitationCode)
			}

			router.push('/')
		} catch (err) {
			console.error('Onboarding flow failed:', err)
			setErrors({ submit: getErrorMessage(err) })
		}
	}

	const updateField = (field: string, value: any) => {
		setFormData(prev => ({ ...prev, [field]: value }))
		setErrors(prev => ({ ...prev, [field]: '' }))
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
						<h1 className='text-2xl font-bold text-gray-900 mb-1'>
							{currentStep === 1 ? 'Complete Your Profile' : 'Setup Your Workspace'}
						</h1>
						<p className='text-sm text-gray-500'>
							Step {currentStep} of 2
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
									<div className='flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-xl'>
										{onboardingData.firebaseData.picture ? (
											<img
												src={onboardingData.firebaseData.picture}
												alt='Profile'
												className='w-16 h-16 rounded-full border-2 border-primary'
											/>
										) : (
											<div className='w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold'>
												{onboardingData.firebaseData.name?.[0] || 'U'}
											</div>
										)}
										<div className='text-center'>
											<p className='font-medium text-gray-900'>{onboardingData.firebaseData.name}</p>
											<p className='text-xs text-gray-500'>{onboardingData.firebaseData.email}</p>
										</div>
									</div>

									<div className='space-y-2'>
										<Label htmlFor='username'>Username</Label>
										<Input
											id='username'
											value={formData.username}
											onChange={(e) => updateField('username', e.target.value)}
											placeholder='your_username'
										/>
										{errors.username && <p className='text-xs text-red-500'>{errors.username}</p>}
									</div>

									<div className='space-y-2'>
										<Label>Your Role</Label>
										<Select
											value={formData.role}
											onValueChange={(val) => updateField('role', val as UserRole)}
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
							)}

							{/* Step 2: Workspace Setup (Directly from register/page.tsx logic) */}
							{currentStep === 2 && (
								<div className='space-y-6 animate-in fade-in duration-300'>
									<RadioGroup
										className='w-full grid grid-cols-2 gap-3'
										value={formData.workspaceMode}
										onValueChange={(value) => updateField('workspaceMode', value)}
									>
										<div className='border-input has-data-[state=checked]:bg-teal-500 has-data-[state=checked]:text-white relative flex flex-col gap-2 border p-4 rounded-lg outline-none has-data-[state=checked]:z-10 transition-all'>
											<div className='group flex flex-col gap-2'>
												<div className='flex items-center gap-2'>
													<RadioGroupItem id='mode-create' value='create' className='bg-white data-[state=checked]:border-white data-[state=checked]:[&_svg]:fill-teal-500 after:absolute after:inset-0' />
													<Label className='font-semibold cursor-pointer' htmlFor='mode-create'>Create New</Label>
												</div>
												<p className='text-[10px] opacity-80 pl-6'>Start your own research space</p>
											</div>
										</div>
										<div className='border-input has-data-[state=checked]:bg-teal-500 has-data-[state=checked]:text-white relative flex flex-col gap-2 border p-4 rounded-lg outline-none has-data-[state=checked]:z-10 transition-all'>
											<div className='group flex flex-col gap-2'>
												<div className='flex items-center gap-2'>
													<RadioGroupItem id='mode-join' value='join' className='bg-white data-[state=checked]:border-white data-[state=checked]:[&_svg]:fill-teal-500 after:absolute after:inset-0' />
													<Label className='font-semibold cursor-pointer' htmlFor='mode-join'>Join Existing</Label>
												</div>
												<p className='text-[10px] opacity-80 pl-6'>Use an invitation code</p>
											</div>
										</div>
									</RadioGroup>

									{formData.workspaceMode === 'create' ? (
										<>
											<div className='space-y-2'>
												<Label className='text-sm font-medium'>Workspace Icon</Label>
												<div className='grid grid-cols-5 gap-2'>
													{workspaceIcons.map((icon) => (
														<button
															key={icon}
															type='button'
															onClick={() => updateField('workspaceIcon', icon)}
															className={`p-2 text-xl border rounded-lg transition-all ${formData.workspaceIcon === icon ? 'bg-teal-500 border-teal-400' : 'bg-white border-gray-200 hover:border-gray-300'}`}
														>
															{icon}
														</button>
													))}
												</div>
											</div>
											<div className='space-y-2'>
												<Label htmlFor='workspaceTitle'>Workspace Title *</Label>
												<Input
													id='workspaceTitle'
													value={formData.workspaceTitle}
													onChange={(e) => updateField('workspaceTitle', e.target.value)}
													placeholder='My Research Lab'
												/>
												{errors.workspaceTitle && <p className='text-xs text-red-500'>{errors.workspaceTitle}</p>}
											</div>
											<div className='space-y-2'>
												<Label htmlFor='workspaceDescription'>Description (Optional)</Label>
												<Textarea
													id='workspaceDescription'
													value={formData.workspaceDescription}
													onChange={(e) => updateField('workspaceDescription', e.target.value)}
													placeholder='Briefly describe your workspace...'
													rows={2}
												/>
											</div>
										</>
									) : (
										<div className='space-y-2'>
											<Label htmlFor='invitationCode'>Invitation Code *</Label>
											<Input
												id='invitationCode'
												value={formData.invitationCode}
												onChange={(e) => updateField('invitationCode', e.target.value)}
												placeholder='Enter workspace code'
											/>
											{errors.invitationCode && <p className='text-xs text-red-500'>{errors.invitationCode}</p>}
										</div>
									)}
								</div>
							)}
						</motion.div>
					</AnimatePresence>

					{authError && (
						<div className='p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs'>
							{authError}
						</div>
					)}
					{errors.submit && (
						<div className='p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs'>
							{errors.submit}
						</div>
					)}

					{/* Navigation */}
					<div className='flex items-center gap-3 pt-4'>
						{currentStep === 2 && (
							<Button variant='outline' onClick={handleBack} disabled={loading} className='flex-1'>
								← Back
							</Button>
						)}
						<Button onClick={handleNext} disabled={loading} className='flex-1'>
							{loading ? 'Processing...' : currentStep === 1 ? 'Continue →' : 'Finish ✓'}
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
					<p className='text-xl text-white text-center mt-4 max-w-sm italic' style={{ fontFamily: 'Times New Roman, Times, serif' }}>
						"Your all-in-one research workspace for managing papers, projects, and collaboration. Start your journey today."
					</p>
				</div>
			</div>
		</div>
	)
}

