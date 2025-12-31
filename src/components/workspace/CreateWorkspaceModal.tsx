/**
 * Workspace Creation Modal Component
 * Handles creating new workspace via API
 */

'use client'

import { useState } from 'react'
import { workspacesService } from '@/lib/api/services/workspaces.service'
import { apiClient } from '@/lib/api/clients/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { getErrorMessage } from '@/lib/api/utils/error-handler'

interface CreateWorkspaceModalProps {
	isOpen: boolean
	onClose: () => void
	onSuccess?: () => void
}

const workspaceIcons = ['📚', '🎓', '📖', '✍️', '🔬', '💼', '📊', '🎯', '🌟', '💡']

export function CreateWorkspaceModal({ isOpen, onClose, onSuccess }: CreateWorkspaceModalProps) {
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
			// Debug: Check token in localStorage
			const token = localStorage.getItem('accessToken')
			console.log(
				'[CreateWorkspace] Token from localStorage:',
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

			if (mode === 'create') {
				console.log('[CreateWorkspace] Creating workspace with title:', title)
				await workspacesService.create({
					title: title.trim(),
					description: description.trim() || undefined,
					icon: icon,
				})
				console.log('[CreateWorkspace] Workspace created successfully')
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
		<Modal
			isOpen={isOpen}
			onClose={handleClose}
			title={mode === 'create' ? 'Create New Workspace' : 'Join Workspace'}
		>
			<form onSubmit={handleSubmit} className='space-y-4'>
				{error && (
					<div className='p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm'>
						{error}
					</div>
				)}

				{/* Mode Selection */}
				<div className='space-y-2'>
					<Label className='text-gray-900 font-normal'>Select Action</Label>
					<RadioGroup
						className='w-full grid grid-cols-2 gap-3'
						value={mode}
						onValueChange={(value) => setMode(value as 'create' | 'join')}
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
								<p className='text-xs opacity-80 pl-6'>Use a workspace ID</p>
							</div>
						</div>
					</RadioGroup>
				</div>

				{/* Create Workspace Form */}
				{mode === 'create' && (
					<>
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
												? 'bg-teal-500 border-teal-400'
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
					</>
				)}

				{/* Join Workspace Form */}
				{mode === 'join' && (
					<div className='space-y-2'>
						<Label htmlFor='workspace-id'>
							Workspace ID <span className='text-red-500'>*</span>
						</Label>
						<Input
							id='workspace-id'
							value={workspaceId}
							onChange={(e) => setWorkspaceId(e.target.value)}
							placeholder='Enter workspace ID'
							disabled={loading}
							required
						/>
						<p className='text-xs text-gray-500'>
							Ask your workspace owner for the workspace ID to join.
						</p>
					</div>
				)}

				<ModalFooter>
					<Button type='button' variant='outline' onClick={handleClose} disabled={loading}>
						Cancel
					</Button>
					<Button type='submit' disabled={loading}>
						{loading
							? mode === 'create'
								? 'Creating...'
								: 'Joining...'
							: mode === 'create'
								? 'Create Workspace'
								: 'Join Workspace'}
					</Button>
				</ModalFooter>
			</form>
		</Modal>
	)
}
