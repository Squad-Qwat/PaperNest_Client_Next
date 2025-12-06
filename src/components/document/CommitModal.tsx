'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal, ModalFooter } from '@/components/ui/modal'

interface CommitModalProps {
	isOpen: boolean
	onClose: () => void
	onCommit: (data: { message: string }) => void
}

export function CommitModal({ isOpen, onClose, onCommit }: CommitModalProps) {
	const [message, setMessage] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!message.trim()) {
			setError('Message is required')
			return
		}

		setLoading(true)
		setError(null)

		try {
			await onCommit({ message })
			setMessage('')
			onClose()
		} catch (err) {
			console.error('Commit failed:', err)
			setError('Failed to create version')
		} finally {
			setLoading(false)
		}
	}

	const handleClose = () => {
		if (!loading) {
			setMessage('')
			setError(null)
			onClose()
		}
	}

	return (
		<Modal isOpen={isOpen} onClose={handleClose} title='Create New Version' size='lg'>
			<form onSubmit={handleSubmit} className='space-y-4'>
				{error && (
					<div className='p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm'>
						{error}
					</div>
				)}

				<div className='space-y-2'>
					<Label htmlFor='commit-message'>Message</Label>
					<Input
						id='commit-message'
						type='text'
						value={message}
						onChange={(e) => {
							setMessage(e.target.value)
							if (error) setError(null)
						}}
						placeholder='e.g., Initial Draft, v1.0, Review Changes'
						disabled={loading}
					/>
				</div>

				<ModalFooter>
					<Button type='button' variant='outline' onClick={handleClose} disabled={loading}>
						Cancel
					</Button>
					<Button type='submit' disabled={loading}>
						{loading ? 'Committing...' : 'Commit Version'}
					</Button>
				</ModalFooter>
			</form>
		</Modal>
	)
}
