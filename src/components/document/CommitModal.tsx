'use client'

import { useState } from 'react'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle } from 'lucide-react'

interface CommitModalProps {
	isOpen: boolean
	onClose: () => void
	onCommit: (data: { title: string; description: string, isInitial?: boolean }) => void
	isFirstVersion: boolean
}

export function CommitModal({ isOpen, onClose, onCommit, isFirstVersion }: CommitModalProps) {
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [isSubmitting, setIsSubmitting] = useState(false)

	const handleSubmit = async () => {
		const newErrors: Record<string, string> = {}

		if (!title.trim()) {
			newErrors.title = 'Title is required'
		}

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors)
			return
		}

		setIsSubmitting(true)
		try {
			await onCommit({ 
				title: isFirstVersion ? "Initial System Version" : title, 
				description,
				isInitial: isFirstVersion
			})
			setTitle(isFirstVersion ? 'Initial System Version' : '')
			setDescription('')
			setErrors({})
			onClose()
		} catch (error) {
			console.error('Commit failed:', error)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={() => {
				onClose()
				setTitle('')
				setDescription('')
				setErrors({})
			}}
			title= {isFirstVersion ? 'Initialize Document' : 'Create New Version'}
			size='lg'
		>
			<div className='space-y-4'>
					{isFirstVersion && (
						<div className='flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm'>
							<AlertCircle className='h-5 w-5 shrink-0'/>
							<p>Creating <strong>Initial Version</strong> by system. This version is permanent, unless deleting the entire document</p>
						</div>
					)}
				<div className='space-y-2'>
					<Label htmlFor='commit-title'>Version Title</Label>
					<Input
						id='commit-title'
						type='text'
						value={isFirstVersion ? 'Initial Version' : title}
						onChange={(e) => {
							setTitle(e.target.value)
							setErrors({ ...errors, title: '' })
						}}
						placeholder='e.g., Initial Draft, v1.0, Review Changes'
						className={errors.title ? 'border-red-500' : ''}
						disabled={isFirstVersion || isSubmitting}
					/>
					{errors.title && <p className='mt-1 text-sm text-red-400'>{errors.title}</p>}
				</div>

				<div className='space-y-2'>
					<Label htmlFor='commit-description'>Description</Label>
					<Textarea
						id='commit-description'
						value={description}
						onChange={(e) => {
							setDescription(e.target.value)
							setErrors({ ...errors, description: '' })
						}}
						placeholder='Brief description of changes in this version'
						rows={3}
						className={`resize-none ${errors.description ? 'border-red-500' : ''}`}
						disabled={isSubmitting}
					/>
					{errors.description && <p className='mt-1 text-sm text-red-400'>{errors.description}</p>}
				</div>
			</div>

			<ModalFooter>
				<Button
					variant='outline'
					onClick={() => {
						onClose()
						setTitle('')
						setDescription('')
						setErrors({})
					}}
					disabled={isSubmitting}
				>
					Cancel
				</Button>
				<Button onClick={handleSubmit} disabled={isSubmitting}>
					{isFirstVersion ? 'Initialize' : isSubmitting ? 'Committing...' : 'Commit Version'}
				</Button>
			</ModalFooter>
		</Modal>
	)
}
