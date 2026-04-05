'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useLoginEmail, useSignInWithSocial } from '@/lib/api/hooks/use-auth'
import { getErrorMessage } from '@/lib/api/utils/error-handler'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"

import Grainient from '@/components/visuals/Grainient/Grainient';
import { FcGoogle } from 'react-icons/fc'
import { FaGithub } from 'react-icons/fa'
import { Link2 } from 'lucide-react'

export default function LoginPage() {
	const router = useRouter()
	const { setOnboardingData } = useAuth()

	const { mutateAsync: loginEmailMutate, isPending: isEmailPending } = useLoginEmail()
	const { 
		mutateAsync: socialMutate, 
		isPending: isSocialPending, 
		linkingSession, 
		linkMutation, 
		resetLinking 
	} = useSignInWithSocial({ setOnboardingData })

	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [localError, setLocalError] = useState('')

	const isLinking = linkMutation.isPending
	const loading = isEmailPending || isSocialPending || isLinking

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLocalError('')

		// Validation
		if (!email || !password) {
			setLocalError('Please fill in all fields')
			return
		}

		if (!email.includes('@')) {
			setLocalError('Please enter a valid email address')
			return
		}

		try {
			await loginEmailMutate({ email, password })
		} catch (err) {
			setLocalError(getErrorMessage(err))
		}
	}

	const handleSocialLogin = async (provider: 'google' | 'github') => {
		setLocalError('')
		resetLinking()
		try {
			await socialMutate(provider)
		} catch (err: any) {
			if (err.message === 'ACCOUNT_EXISTS_CONFLICT') {
				return // Handled by linkingSession UI
			}
			if (err.message === 'PASSWORD_CONFLICT') {
				setLocalError('Email ini sudah terdaftar menggunakan password. Silakan login menggunakan form email & password.')
				return
			}
			setLocalError(getErrorMessage(err))
		}
	}

	const displayError = localError

	return (
		<div className='min-h-screen flex min-w-screen bg-background'>
			{/* Left Side - Form Container */}
			<div className='w-full lg:w-1/2 min-h-screen flex flex-col items-center justify-center py-8 px-4 sm:px-6 md:px-8 lg:px-10 relative'>
				{/* Logo - Top Left */}
				<div className='absolute top-6 left-6 lg:left-8'>
					<h1 className='text-3xl font-bold text-primary'>PaperNest</h1>
				</div>
				{/* Login Card */}
				<div className='w-full max-w-sm space-y-6'>
					{/* Title */}
					<div className='text-center'>
						<h1 className='text-2xl font-bold text-gray-900 mb-2'>
							Log in to your account
						</h1>
						<p className='text-sm text-gray-500'>Welcome back to PaperNest</p>
					</div>

					{/* Error Message */}
					{displayError && (
						<div className='mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center font-medium'>
							{displayError}
						</div>
					)}

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
									Hubungkan Akun Anda
								</DialogTitle>
								<DialogDescription className='text-center text-sm'>
									Email <strong>{linkingSession?.email}</strong> sudah terdaftar melalui 
									<span className='capitalize font-medium'> {linkingSession?.targetMethod.split('.')[0]}</span>. 
									Hubungkan dengan {linkingSession?.providerName} untuk akses ke akun yang sama.
								</DialogDescription>
							</DialogHeader>
							<div className='grid gap-2 mt-4'>
								<Button 
									className='w-full'
									onClick={() => linkMutation.mutate()}
									disabled={isLinking}
								>
									{isLinking ? 'Sedang Menghubungkan...' : `Hubungkan Sekarang`}
								</Button>
								<Button 
									variant='outline' 
									className='w-full'
									onClick={resetLinking}
									disabled={isLinking}
								>
									Batal
								</Button>
							</div>
						</DialogContent>
					</Dialog>

					{/* Social Sign Up */}
					<div className='grid gap-3'>
						<Button
							type='button'
							variant='outline'
							onClick={() => handleSocialLogin('google')}
							disabled={loading}
						>
							<FcGoogle />
							Login using Google
						</Button>
						<Button
							type='button'
							variant='outline'
							onClick={() => handleSocialLogin('github')}
							disabled={loading}
						>
							<FaGithub />
							Login using GitHub
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

					{/* Login Form */}
					<form onSubmit={handleSubmit} className='space-y-6'>
						{/* Email */}
						<div className='space-y-2'>
							<Label htmlFor='email' className='text-gray-900 font-normal'>
								Email
							</Label>
							<Input
								id='email'
								type='email'
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder='Enter your Email'
								disabled={loading}
							/>
						</div>

						{/* Password */}
						<div className='space-y-2'>
							<Label htmlFor='password' className='text-gray-900 font-normal'>
								Password
							</Label>
							<Input
								id='password'
								type='password'
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder='Password'
								disabled={loading}
							/>
							<div className='text-right'>
								<Link
									href='#'
									className='text-sm text-teal-500 hover:text-teal-600 transition-colors'
								>
									Forgot your password?
								</Link>
							</div>
						</div>

						{/* Login Button */}
						<Button type='submit' className='w-full' disabled={loading}>
							{loading ? 'Logging in...' : 'Log In'}
						</Button>
					</form>

					{/* Sign Up Link */}
					<div className='mt-6 text-center text-sm text-gray-600'>
						Don't have an account?{' '}
						<Link
							href='/register'
							className='text-gray-900 hover:text-gray-700 font-medium underline transition-colors'
						>
							Join PaperNest
						</Link>
					</div>
				</div>
			</div>
			{/* Right Side - Gradient Background with Text */}
			<div className='hidden lg:flex lg:w-1/2 min-h-screen relative'>
				{/* Gradient Background */}
				<div className='absolute inset-0 w-full h-full p-6'>
					<Grainient
						color1="#009689"
						color2="#F5A623"
						color3="#009689"
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
					<p className='text-xl text-white text-center mt-4 max-w-sm italic' style={{ fontFamily: 'Times New Roman, Times, serif' }}>
						"Organize your research like never before. Login to continue your work."
					</p>
				</div>
			</div>
		</div>
	)
}

