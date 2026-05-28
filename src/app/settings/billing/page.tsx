'use client'

import { ArrowRight, Check, CreditCard, Loader2, Sparkles } from 'lucide-react'
import Script from 'next/script'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/context/AuthContext'
import { useCreateCheckoutSession, useGetCustomerPortal } from '@/lib/api/hooks/use-billing'

declare global {
	interface Window {
		createLemonSqueezy?: () => void
		LemonSqueezy?: {
			Url: {
				Open: (url: string) => void
			}
			Setup: (options: { eventHandler: (event: any) => void }) => void
		}
	}
}

export default function BillingSettingsPage() {
	const { user, loading } = useAuth()
	const createCheckoutSession = useCreateCheckoutSession()
	const getCustomerPortal = useGetCustomerPortal()

	const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)
	const [isPortalLoading, setIsPortalLoading] = useState(false)

	const proVariantId = process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_ID_PRO || '1698870'
	const enterpriseVariantId = process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_ID_ENTERPRISE || '1698909'

	const isPro = user?.subscriptionPlan === 'pro'
	const isEnterprise = user?.subscriptionPlan === 'enterprise'
	const hasActiveSubscription = isPro || isEnterprise

	const handleUpgrade = async (variantId: string) => {
		setIsCheckoutLoading(true)
		try {
			const response = await createCheckoutSession.mutateAsync(variantId)
			if (response?.url) {
				if (window.LemonSqueezy?.Url?.Open) {
					window.LemonSqueezy.Url.Open(response.url)
				} else {
					// Fallback to standard redirect if SDK is not ready yet
					window.location.href = response.url
				}
			} else {
				throw new Error('Failed to retrieve checkout URL')
			}
		} catch (error: any) {
			loggerError('Upgrade Error:', error)
			toast.error(error?.message || 'Failed to initiate checkout. Please try again.')
		} finally {
			setIsCheckoutLoading(false)
		}
	}

	const handleManageBilling = async () => {
		setIsPortalLoading(true)
		try {
			const response = await getCustomerPortal.mutateAsync()
			if (response?.portalUrl) {
				window.location.href = response.portalUrl
			} else {
				throw new Error('Customer portal URL not returned')
			}
		} catch (error: any) {
			loggerError('Portal Error:', error)
			toast.error(error?.message || 'Failed to open customer portal. Please try again.')
		} finally {
			setIsPortalLoading(false)
		}
	}

	const loggerError = (message: string, err: any) => {
		console.error(message, err)
	}

	if (loading) {
		return (
			<div className='space-y-6'>
				<div>
					<Skeleton className='h-8 w-48 mb-2' />
					<Skeleton className='h-4 w-64' />
				</div>
				<div className='space-y-4'>
					<Skeleton className='h-48 w-full' />
					<Skeleton className='h-32 w-full' />
				</div>
			</div>
		)
	}

	if (!user) return null

	const formattedEndDate = user.billingPeriodEnd
		? new Date(user.billingPeriodEnd).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			})
		: null

	return (
		<div className='space-y-8 text-left'>
			{/* Lemon.js Script Loader */}
			<Script
				src='https://app.lemonsqueezy.com/js/lemon.js'
				strategy='afterInteractive'
				onLoad={() => {
					window.createLemonSqueezy?.()
					window.LemonSqueezy?.Setup({
						eventHandler: (event) => {
							if (event.event === 'Checkout.Success') {
								toast.success('Your payment was successful! Upgrading account...')
								// Optionally refresh page or auth state
								setTimeout(() => window.location.reload(), 2500)
							}
						},
					})
				}}
			/>

			<div>
				<h2 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>Billing Settings</h2>
				<p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
					Manage your plan, check resource usage, and update payment methods.
				</p>
			</div>

			{/* Current Subscription Status */}
			<Card className='border border-muted/50 bg-card shadow-md overflow-hidden relative'>
				{hasActiveSubscription && (
					<div className={`absolute top-0 right-0 left-0 h-1.5 ${isEnterprise ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500' : 'bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-500'}`} />
				)}
				<CardHeader className='pb-4'>
					<div className='flex items-center justify-between flex-wrap gap-4'>
						<div>
							<CardDescription className='text-xs uppercase tracking-wider font-semibold text-muted-foreground'>
								Current Plan
							</CardDescription>
							<CardTitle className='text-2xl font-bold flex items-center gap-2 mt-1'>
								{isEnterprise ? 'Enterprise Member' : isPro ? 'Pro Member' : 'Free Account'}
								<Badge
									variant={hasActiveSubscription ? 'default' : 'secondary'}
									className={
										isEnterprise
											? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0'
											: isPro
												? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0'
												: ''
									}
								>
									{isEnterprise ? 'Enterprise' : isPro ? 'Pro' : 'Free'}
								</Badge>
							</CardTitle>
						</div>
						<div className='flex items-center gap-2'>
							{hasActiveSubscription ? (
								<Button
									variant='outline'
									size='sm'
									disabled={isPortalLoading}
									onClick={handleManageBilling}
									className='flex items-center gap-1.5'
								>
									{isPortalLoading ? (
										<Loader2 className='size-4 animate-spin' />
									) : (
										<CreditCard className='size-4' />
									)}
									Manage Subscription
								</Button>
							) : (
								<Button
									size='sm'
									disabled={isCheckoutLoading}
									onClick={() => handleUpgrade(proVariantId)}
									className='bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg flex items-center gap-1.5'
								>
									{isCheckoutLoading ? (
										<Loader2 className='size-4 animate-spin' />
									) : (
										<Sparkles className='size-4' />
									)}
									Upgrade to Pro
								</Button>
							)}
						</div>
					</div>
				</CardHeader>

				<CardContent className='border-t border-muted/30 pt-6 space-y-6'>
					{/* Plan details info */}
					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						<div className='space-y-2'>
							<h4 className='text-sm font-semibold text-gray-700 dark:text-gray-300'>Plan Perks</h4>
							<ul className='space-y-1.5 text-sm text-muted-foreground'>
								<li className='flex items-center gap-2'>
									<Check className='size-4 text-emerald-500 shrink-0' />
									{hasActiveSubscription ? 'Unlimited collaborative documents' : 'Up to 3 active documents'}
								</li>
								<li className='flex items-center gap-2'>
									<Check className='size-4 text-emerald-500 shrink-0' />
									{hasActiveSubscription ? 'Unlimited LaTeX compiles' : '5 LaTeX compiles per day'}
								</li>
								<li className='flex items-center gap-2'>
									<Check className='size-4 text-emerald-500 shrink-0' />
									{isEnterprise ? '200k AI tokens daily' : isPro ? '50k AI tokens daily' : '1,000 AI tokens daily'}
								</li>
							</ul>
						</div>

						<div className='space-y-2'>
							<h4 className='text-sm font-semibold text-gray-700 dark:text-gray-300'>
								Billing Details
							</h4>
							{hasActiveSubscription ? (
								<p className='text-sm text-muted-foreground'>
									Your subscription is active.{' '}
									{formattedEndDate && `Next renewal date: ${formattedEndDate}.`}
								</p>
							) : (
								<p className='text-sm text-muted-foreground'>
									You are on the free plan. Upgrade to remove resource restrictions and collaborate
									with larger teams.
								</p>
							)}
						</div>
					</div>

					{/* Quotas and Limits usage visualizer (Mock visual for Free / Real stats indicator) */}
					{!hasActiveSubscription && (
						<div className='border-t border-muted/30 pt-6 space-y-4'>
							<h4 className='text-sm font-semibold text-gray-700 dark:text-gray-300'>
								Resource Usage (Free Tier)
							</h4>

							<div className='grid grid-cols-1 sm:grid-cols-3 gap-6'>
								<div className='space-y-1.5'>
									<div className='flex justify-between text-xs font-medium'>
										<span>Documents</span>
										<span className='text-muted-foreground'>1 / 3</span>
									</div>
									<Progress value={33} className='h-1.5' />
								</div>

								<div className='space-y-1.5'>
									<div className='flex justify-between text-xs font-medium'>
										<span>Daily LaTeX Compiles</span>
										<span className='text-muted-foreground'>2 / 5</span>
									</div>
									<Progress value={40} className='h-1.5' />
								</div>

								<div className='space-y-1.5'>
									<div className='flex justify-between text-xs font-medium'>
										<span>Daily AI Tokens</span>
										<span className='text-muted-foreground'>350 / 1,000</span>
									</div>
									<Progress value={35} className='h-1.5' />
								</div>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Pricing Plans Overview */}
			{(!isEnterprise) && (
				<div className='space-y-6 pt-4'>
					<div>
						<h3 className='text-lg font-bold text-gray-900 dark:text-gray-100'>Available Plans</h3>
						<p className='text-sm text-gray-500 dark:text-gray-400'>
							Choose the plan that fits your writing and research workflow.
						</p>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl'>
						{/* Free Plan Card */}
						<Card className='border border-muted/50 flex flex-col justify-between h-full bg-card shadow-sm'>
							<CardHeader>
								<CardTitle className='text-xl font-bold'>Free Plan</CardTitle>
								<CardDescription>Get started with basic features</CardDescription>
								<div className='mt-4 flex items-baseline gap-1'>
									<span className='text-3xl font-extrabold'>$0</span>
									<span className='text-muted-foreground text-sm'>/ month</span>
								</div>
							</CardHeader>
							<CardContent className='flex-1 py-4 space-y-4'>
								<ul className='space-y-2.5 text-sm'>
									<li className='flex items-center gap-2'>
										<Check className='size-4 text-emerald-500' />3 collaborative documents
									</li>
									<li className='flex items-center gap-2'>
										<Check className='size-4 text-emerald-500' />5 LaTeX compilations daily
									</li>
									<li className='flex items-center gap-2'>
										<Check className='size-4 text-emerald-500' />
										1,000 AI tokens daily
									</li>
									<li className='flex items-center gap-2'>
										<Check className='size-4 text-emerald-500' />
										Standard formatting tools
									</li>
								</ul>
							</CardContent>
							<CardFooter className='pt-4'>
								<Button className='w-full' variant='outline' disabled={!hasActiveSubscription}>
									{!hasActiveSubscription ? 'Current Plan' : 'Free Tier'}
								</Button>
							</CardFooter>
						</Card>

						{/* Pro Plan Card */}
						<Card className={`border-2 flex flex-col justify-between h-full bg-card shadow-md relative ${isPro ? 'border-violet-500 dark:border-violet-600' : 'border-muted/50'}`}>
							{isPro && (
								<div className='absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-violet-600 text-white text-[10px] uppercase font-bold tracking-wider rounded-full'>
									Current Plan
								</div>
							)}
							<CardHeader>
								<div className='flex justify-between items-start'>
									<div>
										<CardTitle className='text-xl font-bold'>Pro Plan</CardTitle>
										<CardDescription>Unleash maximum productivity</CardDescription>
									</div>
									<Sparkles className='size-5 text-violet-500 animate-pulse' />
								</div>
								<div className='mt-4 flex items-baseline gap-1'>
									<span className='text-3xl font-extrabold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent'>
										$10
									</span>
									<span className='text-muted-foreground text-sm'>/ month</span>
								</div>
							</CardHeader>
							<CardContent className='flex-1 py-4 space-y-4'>
								<ul className='space-y-2.5 text-sm'>
									<li className='flex items-center gap-2 font-medium text-gray-800 dark:text-gray-200'>
										<Check className='size-4 text-violet-500' />
										Unlimited documents
									</li>
									<li className='flex items-center gap-2 font-medium text-gray-800 dark:text-gray-200'>
										<Check className='size-4 text-violet-500' />
										Unlimited LaTeX compiles
									</li>
									<li className='flex items-center gap-2 font-medium text-gray-800 dark:text-gray-200'>
										<Check className='size-4 text-violet-500' />
										50,000 AI tokens daily
									</li>
									<li className='flex items-center gap-2'>
										<Check className='size-4 text-violet-500' />
										Priority compilation & support
									</li>
									<li className='flex items-center gap-2'>
										<Check className='size-4 text-violet-500' />
										Advanced project templates
									</li>
								</ul>
							</CardContent>
							<CardFooter className='pt-4'>
								{isPro ? (
									<Button className='w-full' variant='outline' disabled>
										Current Plan
									</Button>
								) : (
									<Button
										onClick={() => handleUpgrade(proVariantId)}
										disabled={isCheckoutLoading}
										className='w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white flex items-center justify-center gap-2'
									>
										{isCheckoutLoading ? (
											<Loader2 className='size-4 animate-spin' />
										) : (
											<>
												Upgrade to Pro <ArrowRight className='size-4' />
											</>
										)}
									</Button>
								)}
							</CardFooter>
						</Card>

						{/* Enterprise Plan Card */}
						<Card className='border-2 border-amber-500 dark:border-amber-600 flex flex-col justify-between h-full bg-card shadow-lg relative overflow-hidden'>
							<div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-400/20 to-orange-500/0 rounded-full blur-xl pointer-events-none' />
							<div className='absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] uppercase font-bold tracking-wider rounded-full shadow-sm'>
								Enterprise
							</div>
							<CardHeader>
								<div className='flex justify-between items-start'>
									<div>
										<CardTitle className='text-xl font-bold text-gray-900 dark:text-gray-100'>Enterprise</CardTitle>
										<CardDescription>For power users and teams</CardDescription>
									</div>
									<Sparkles className='size-5 text-amber-500 animate-pulse' />
								</div>
								<div className='mt-4 flex items-baseline gap-1'>
									<span className='text-3xl font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent'>
										$29
									</span>
									<span className='text-muted-foreground text-sm'>/ month</span>
								</div>
							</CardHeader>
							<CardContent className='flex-1 py-4 space-y-4'>
								<ul className='space-y-2.5 text-sm'>
									<li className='flex items-center gap-2 font-medium text-gray-800 dark:text-gray-200'>
										<Check className='size-4 text-amber-500' />
										Everything in Pro plan
									</li>
									<li className='flex items-center gap-2 font-medium text-gray-800 dark:text-gray-200'>
										<Check className='size-4 text-amber-500' />
										200,000 AI tokens daily
									</li>
									<li className='flex items-center gap-2 font-medium text-gray-800 dark:text-gray-200'>
										<Check className='size-4 text-amber-500' />
										Dedicated workspace channels
									</li>
									<li className='flex items-center gap-2'>
										<Check className='size-4 text-amber-500' />
										Shared team workspace options
									</li>
									<li className='flex items-center gap-2'>
										<Check className='size-4 text-amber-500' />
										24/7 Premium SLA Support
									</li>
								</ul>
							</CardContent>
							<CardFooter className='pt-4'>
								<Button
									onClick={() => handleUpgrade(enterpriseVariantId)}
									disabled={isCheckoutLoading}
									className='w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white flex items-center justify-center gap-2'
								>
									{isCheckoutLoading ? (
										<Loader2 className='size-4 animate-spin' />
									) : (
										<>
											Upgrade to Enterprise <ArrowRight className='size-4' />
										</>
									)}
								</Button>
							</CardFooter>
						</Card>
					</div>
				</div>
			)}
		</div>
	)
}
