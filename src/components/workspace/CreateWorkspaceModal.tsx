/**
 * Workspace Creation Modal Component
 * Handles creating new workspace via API
 */

'use client'

import { useRouter } from 'next/navigation'
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
			setError('Workspace title is required')
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
		<Modal isOpen={isOpen} onClose={handleClose} title='Create New Workspace'>
			<form onSubmit={handleSubmit} className='space-y-4'>
				{error && (
					<div className='p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm'>
						{error}
					</div>
				)}

				<div className='space-y-2'>
					<Label className='text-gray-900 font-normal'>Workspace Icon</Label>
					<div className='grid grid-cols-5 gap-2'>
						{workspaceIcons.map((iconOption) => (
							<button
								key={iconOption}
								type='button'
								onClick={() => setIcon(iconOption)}
								className={`p-3 text-2xl border rounded-lg transition-all hover:scale-105 ${
									icon === iconOption
										? 'bg-primary/10 border-primary text-primary'
										: 'bg-white border-gray-200 hover:border-gray-300'
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
						Workspace Title <span className='text-red-500'>*</span>
					</Label>
					<Input
						id='workspace-title'
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder='My Research Workspace'
						disabled={loading}
						required
					/>
				</div>

				<div className='space-y-2'>
					<Label htmlFor='workspace-description'>Description (Optional)</Label>
					<Textarea
						id='workspace-description'
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder='A workspace for my research papers...'
						rows={3}
						disabled={loading}
					/>
				</div>

				<ModalFooter>
					<Button type='button' variant='outline' onClick={handleClose} disabled={loading}>
						Cancel
					</Button>
					<Button type='submit' disabled={loading}>
						{loading ? 'Creating...' : 'Create Workspace'}
					</Button>
				</ModalFooter>
			</form>
		</Modal>
	)
}
