/**
 * Workspace Creation Modal Component
 * Handles creating new workspace via API
 */

'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'
import { apiClient } from '@/lib/api/clients/api-client'
import { useCreateWorkspace } from '@/lib/api/hooks/use-workspaces'
import { workspacesService } from '@/lib/api/services/workspaces.service'
import { getErrorMessage } from '@/lib/api/utils/error-handler'
import { useAuthStore } from '@/lib/store/auth-store'

interface CreateWorkspaceModalProps {
	isOpen: boolean
	onClose: () => void
	onSuccess?: () => void
}

const workspaceIcons = ['📚', '🎓', '📖', '✍️', '🔬', '💼', '📊', '🎯', '🌟', '💡']

export function CreateWorkspaceModal({ isOpen, onClose, onSuccess }: CreateWorkspaceModalProps) {
	const router = useRouter()
	const createWorkspaceMutation = useCreateWorkspace()
	const t = useTranslations('Workspace')
	const [mode, setMode] = useState<'create' | 'join'>('create')
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [icon, setIcon] = useState('📚')
	const [workspaceId, setWorkspaceId] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (mode === 'create' && !title.trim()) {
			setError(t('titleRequired'))
			return
		}

		if (mode === 'join' && !workspaceId.trim()) {
			setError('Workspace ID is required')
			return
		}

		setLoading(true)
		setError(null)

		try {
			// Debug: Check token in Zustand store
			const token = useAuthStore.getState().accessToken
			console.log(
				'[CreateWorkspace] Token from Zustand store:',
				token ? `${token.substring(0, 20)}...` : 'NOT FOUND'
			)

			// Ensure token is set in apiClient before making request
			if (token) {
				apiClient.setAuthToken(token)
				console.log('[CreateWorkspace] Token re-set in apiClient')
			} else {
				throw new Error('No authentication token found. Please login again.')
			}

			console.log('[CreateWorkspace] API client headers:', apiClient.getHeaders())

			let newWorkspaceId = ''

			if (mode === 'create') {
				console.log('[CreateWorkspace] Creating workspace with title:', title)
				const newWorkspace = await createWorkspaceMutation.mutateAsync({
					title: title.trim(),
					description: description.trim() || undefined,
					icon: icon,
				})
				console.log('[CreateWorkspace] Workspace created successfully:', newWorkspace)
				newWorkspaceId = newWorkspace.workspaceId
			} else {
				console.log('[CreateWorkspace] Joining workspace with ID:', workspaceId)
				await workspacesService.joinByWorkspaceId(workspaceId.trim())
				console.log('[CreateWorkspace] Joined workspace successfully')
			}

			// Reset form
			setMode('create')
			setTitle('')
			setDescription('')
			setIcon('📚')
			setWorkspaceId('')

			// Notify parent
			if (onSuccess) {
				onSuccess()
			}

			onClose()

			// Redirect if new workspace was created
			if (newWorkspaceId) {
				router.push(`/${newWorkspaceId}`)
			}
		} catch (err) {
			setError(getErrorMessage(err))
		} finally {
			setLoading(false)
		}
	}

	const handleClose = () => {
		if (!loading) {
			setMode('create')
			setTitle('')
			setDescription('')
			setIcon('📚')
			setWorkspaceId('')
			setError(null)
			onClose()
		}
	}

	return (
		<Modal isOpen={isOpen} onClose={handleClose} title={t('createTitle')}>
			<form onSubmit={handleSubmit} className='space-y-4'>
				{error && (
					<div className='p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm'>
						{error}
					</div>
				)}

				<div className='space-y-2'>
					<Label className='text-foreground font-normal'>{t('icon')}</Label>
					<div className='grid grid-cols-5 gap-2'>
						{workspaceIcons.map((iconOption) => (
							<button
								key={iconOption}
								type='button'
								onClick={() => setIcon(iconOption)}
								className={`p-3 text-2xl border rounded-lg transition-all hover:scale-105 ${
									icon === iconOption
										? 'bg-primary/10 border-primary text-primary'
										: 'bg-card border-border hover:border-muted-foreground text-foreground'
								}`}
								disabled={loading}
							>
								{iconOption}
							</button>
						))}
					</div>
				</div>

				<div className='space-y-2'>
					<Label htmlFor='workspace-title'>
						{t('titleLabel')} <span className='text-red-500'>*</span>
					</Label>
					<Input
						id='workspace-title'
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder={t('titlePlaceholder')}
						disabled={loading}
						required
					/>
				</div>

				<div className='space-y-2'>
					<Label htmlFor='workspace-description'>{t('descriptionLabel')}</Label>
					<Textarea
						id='workspace-description'
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder={t('descriptionPlaceholder')}
						rows={3}
						disabled={loading}
					/>
				</div>

				<ModalFooter>
					<Button type='button' variant='outline' onClick={handleClose} disabled={loading}>
						{t('cancel')}
					</Button>
					<Button type='submit' disabled={loading}>
						{loading ? t('creating') : t('createButton')}
					</Button>
				</ModalFooter>
			</form>
		</Modal>
	)
}
