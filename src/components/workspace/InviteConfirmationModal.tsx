'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { useAuth } from '@/context/AuthContext'
import { useAcceptInvitation } from '@/lib/api/hooks/use-workspaces'
import { workspacesService } from '@/lib/api/services/workspaces.service'
import { getErrorMessage } from '@/lib/api/utils/error-handler'

export function InviteConfirmationModal() {
	const searchParams = useSearchParams()
	const inviteToken = searchParams.get('inviteToken')
	const { user, isAuthenticated } = useAuth()
	const { mutateAsync: acceptInvite, isPending: isAccepting } = useAcceptInvitation()

	const [isOpen, setIsOpen] = useState(false)
	const [invitation, setInvitation] = useState<any>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!inviteToken || !isAuthenticated) {
			setIsOpen(false)
			return
		}

		const fetchDetails = async () => {
			setLoading(true)
			setError(null)
			setIsOpen(true)
			try {
				const response = await workspacesService.getInvitationDetails(inviteToken)
				setInvitation(response.invitation)
			} catch (err) {
				setError(getErrorMessage(err))
				toast.error('Failed to load invitation details')
			} finally {
				setLoading(false)
			}
		}

		fetchDetails()
	}, [inviteToken, isAuthenticated])

	const cleanQueryParam = () => {
		setIsOpen(false)
		const url = new URL(window.location.href)
		url.searchParams.delete('inviteToken')
		window.history.replaceState({}, '', url.pathname + url.search)
	}

	const handleAccept = async () => {
		if (!inviteToken) return
		try {
			await acceptInvite(inviteToken)
			toast.success('Successfully joined workspace')
			cleanQueryParam()
		} catch (err) {
			toast.error(getErrorMessage(err))
		}
	}

	const handleDecline = () => {
		cleanQueryParam()
	}

	if (!isOpen) return null

	return (
		<Modal
			isOpen={isOpen}
			onClose={() => {
				if (!isAccepting) {
					handleDecline()
				}
			}}
			title='Workspace Invitation'
			showCloseButton={!isAccepting}
		>
			<div className='space-y-4'>
				{loading ? (
					<div className='py-8 flex flex-col items-center justify-center'>
						<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
						<p className='text-sm text-muted-foreground mt-2'>Loading invitation details...</p>
					</div>
				) : error ? (
					<div className='py-4 text-center'>
						<p className='text-sm text-red-500 font-medium'>{error}</p>
					</div>
				) : invitation ? (
					<div className='space-y-4 pt-2'>
						<div className='flex flex-col items-center justify-center py-4 px-6 bg-muted/30 rounded-xl border border-border/50 text-center'>
							<div className='text-4xl mb-3'>{invitation.workspaceIcon || '📚'}</div>
							<h3 className='text-lg font-semibold text-foreground'>{invitation.workspaceTitle}</h3>
							<p className='text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1'>
								Role: {invitation.role}
							</p>
						</div>

						<p className='text-sm text-muted-foreground text-center'>
							<span className='font-semibold text-foreground'>{invitation.inviterName}</span> has
							invited you to join this workspace.
						</p>

						{user?.email !== invitation.email && (
							<div className='p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg text-xs leading-relaxed'>
								Warning: You are logged in as <strong>{user?.email}</strong>, but this invitation
								was sent to <strong>{invitation.email}</strong>.
							</div>
						)}
					</div>
				) : null}

				{!loading && (
					<ModalFooter className='flex sm:flex-row gap-2 mt-4 pt-2'>
						<Button
							variant='outline'
							className='flex-1'
							onClick={handleDecline}
							disabled={isAccepting}
						>
							Decline
						</Button>
						<Button className='flex-1' onClick={handleAccept} disabled={isAccepting || !!error}>
							{isAccepting ? 'Accepting...' : 'Accept & Join'}
						</Button>
					</ModalFooter>
				)}
			</div>
		</Modal>
	)
}
