'use client'

import { Loader2, Mail } from 'lucide-react'
import { motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp'
import Grainient from '@/components/visuals/Grainient/Grainient'
import { useAuth } from '@/context/AuthContext'
import { useSendOTP, useVerifyOTP } from '@/lib/api/hooks/use-auth'
import { getErrorMessage } from '@/lib/api/utils/error-handler'

export default function VerifyEmailPage() {
	const t = useTranslations('Auth')
	const [otp, setOtp] = useState('')
	const { loading } = useAuth()
	const { mutate: verify, isPending: isVerifying, error: verifyError } = useVerifyOTP()
	const { mutate: resend, isPending: isResending } = useSendOTP()

	const handleVerify = (value: string) => {
		if (value.length === 6) {
			verify(value)
		}
	}

	const displayError = verifyError ? getErrorMessage(verifyError) : null

	if (loading) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-background'>
				<Loader2 className='w-10 h-10 animate-spin text-primary/40' />
			</div>
		)
	}

	return (
		<div className='min-h-screen flex min-w-screen bg-background relative overflow-hidden'>
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

			<div className='w-full lg:w-1/2 min-h-screen flex flex-col items-center justify-center py-4 px-4 sm:px-6 md:px-8 lg:px-10 relative'>
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className='w-full max-w-sm space-y-8 text-center'
				>
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

					<div className='space-y-2'>
						<h1 className='text-2xl font-bold tracking-tight text-foreground'>
							{t('verifyEmail')}
						</h1>
						<p className='text-sm text-muted-foreground leading-relaxed max-w-[280px] mx-auto'>
							{t('verificationSent')}
						</p>
					</div>

					<div className='space-y-6 flex flex-col items-center'>
						<div className='flex flex-col items-center space-y-4'>
							<InputOTP
								maxLength={6}
								value={otp}
								onChange={setOtp}
								onComplete={handleVerify}
								disabled={isVerifying}
							>
								<InputOTPGroup>
									<InputOTPSlot index={0} />
									<InputOTPSlot index={1} />
									<InputOTPSlot index={2} />
								</InputOTPGroup>
								<InputOTPSeparator />
								<InputOTPGroup>
									<InputOTPSlot index={3} />
									<InputOTPSlot index={4} />
									<InputOTPSlot index={5} />
								</InputOTPGroup>
							</InputOTP>

							{displayError && (
								<motion.p
									initial={{ opacity: 0, y: -5 }}
									animate={{ opacity: 1, y: 0 }}
									className='text-xs text-red-500 font-medium'
								>
									{displayError}
								</motion.p>
							)}
						</div>

						<div className='w-full space-y-4'>
							<Button
								className='w-full h-9'
								onClick={() => handleVerify(otp)}
								disabled={isVerifying || otp.length !== 6}
							>
								{isVerifying ? <Loader2 className='w-4 h-4 animate-spin' /> : t('verifyAccount')}
							</Button>

							<div className='flex flex-col gap-3 items-center w-full text-muted-foreground'>
								<Button
									variant='outline'
									className='w-full h-9 text-sm font-medium transition-colors'
									onClick={() => {
										setOtp('')
										resend()
									}}
									disabled={isResending || isVerifying}
								>
									{isResending ? <Loader2 className='w-4 h-4 animate-spin mr-2' /> : null}
									{t('resendCode')}
								</Button>

								<div className='flex items-center gap-2 text-sm opacity-70 mt-2'>
									<span>{t('wrongEmail')}</span>
									<a
										href='/login'
										className='text-foreground hover:text-primary underline transition-colors font-medium'
									>
										{t('signInAgain')}
									</a>
								</div>
							</div>
						</div>
					</div>
				</motion.div>
			</div>

			<div className='hidden lg:flex lg:w-1/2 min-h-screen relative'>
				<div className='absolute inset-0 w-full h-full p-6'>
					<Grainient
						color1='#009689'
						color2='#F5A623'
						color3='#009689'
						timeSpeed={0.25}
						zoom={0.8}
					/>
				</div>
				<div className='absolute inset-0 flex flex-col items-center justify-center z-10 px-8'>
					<p
						className='text-xl text-white text-center mt-4 max-w-sm italic'
						style={{ fontFamily: 'Times New Roman, Times, serif' }}
					>
						"Your security is our priority. Verifying your email ensures your research data remains
						protected and private."
					</p>
				</div>
			</div>
		</div>
	)
}
