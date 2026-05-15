'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { useAcceptInvitation } from '@/lib/api/hooks/use-workspaces'
import { workspacesService } from '@/lib/api/services/workspaces.service'
import { getErrorMessage } from '@/lib/api/utils/error-handler'

export default function AcceptInvitationPage() {
	const params = useParams()
	const router = useRouter()
	const { token } = params
	const { user, isAuthenticated, loading: authLoading } = useAuth()
	const { mutateAsync: acceptInvite, isPending: isAccepting } = useAcceptInvitation()

	const [invitation, setInvitation] = useState<any>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const fetchInvitationDetails = async () => {
			if (!token) return
			try {
				const response = await workspacesService.getInvitationDetails(token as string)
				setInvitation(response.invitation)
			} catch (err) {
				setError(getErrorMessage(err))
			} finally {
				setLoading(false)
			}
		}

		fetchInvitationDetails()
	}, [token])

	const handleAccept = async () => {
		if (!isAuthenticated) {
			router.push(`/login?callbackUrl=/invitations/accept/${token}`)
			return
		}

		try {
			await acceptInvite(token as string)
			toast.success('Successfully joined workspace')
			router.push('/')
		} catch (err) {
			toast.error(getErrorMessage(err))
		}
	}

	if (loading || authLoading) {
		return (
			<div className='min-h-screen flex items-center justify-center p-4 bg-gray-50'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4'></div>
					<p className='text-gray-500'>Loading invitation details...</p>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className='min-h-screen flex items-center justify-center p-4 bg-gray-50'>
				<Card className='max-w-md w-full'>
					<CardHeader>
						<CardTitle className='text-red-600'>Invitation Error</CardTitle>
						<CardDescription>{error}</CardDescription>
					</CardHeader>
					<CardFooter>
						<Button className='w-full' onClick={() => router.push('/')}>
							Go to Home
						</Button>
					</CardFooter>
				</Card>
			</div>
		)
	}

	return (
		<div className='min-h-screen flex items-center justify-center p-4 bg-gray-50/50'>
			<Card className='max-w-md w-full shadow-sm border-gray-200/60 bg-white rounded-xl overflow-hidden'>
				<CardHeader className='text-center pt-8 pb-4'>
					<div className='w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 ring-1 ring-primary/10'>
						{invitation.workspaceIcon || '📚'}
					</div>
					<CardTitle className='text-xl font-semibold tracking-tight text-gray-900'>
						Workspace Invitation
					</CardTitle>
					<CardDescription className='text-sm mt-1.5'>
						<span className='font-medium text-gray-900'>{invitation.inviterName}</span>
						<span className='text-gray-500'> has invited you to join</span>
					</CardDescription>
				</CardHeader>
				<CardContent className='px-8'>
					<div className='py-4 px-5 bg-gray-50/50 rounded-lg border border-gray-100 text-center mb-2'>
						<h3 className='text-base font-semibold text-gray-900'>{invitation.workspaceTitle}</h3>
						<p className='text-xs text-gray-500 uppercase tracking-wider mt-0.5 font-medium'>
							Role: {invitation.role}
						</p>
					</div>

					{isAuthenticated && user?.email !== invitation.email && (
						<div className='mt-4 p-3 bg-amber-50/50 border border-amber-100 rounded-md text-amber-800 text-[13px] leading-relaxed'>
							<p>
								Warning: You are logged in as <strong>{user?.email}</strong>, but this invitation
								was sent to <strong>{invitation.email}</strong>.
							</p>
						</div>
					)}
				</CardContent>
				<CardFooter className='flex flex-col gap-2 px-8 pb-8 pt-4'>
					<Button
						className='w-full h-9 text-sm font-medium'
						onClick={handleAccept}
						disabled={isAccepting}
					>
						{isAuthenticated
							? isAccepting
								? 'Accepting...'
								: 'Accept Invitation'
							: 'Log in to Join'}
					</Button>
					<Button
						variant='ghost'
						className='w-full h-9 text-sm text-gray-500 font-medium hover:bg-gray-100/50 hover:text-gray-900'
						onClick={() => router.push('/')}
						disabled={isAccepting}
					>
						Decline
					</Button>
				</CardFooter>
			</Card>
		</div>
	)
}
