'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ReviewRequestModalProps {
	isOpen: boolean
	onClose: () => void
	onSubmit: (data: { lecturerId: string; message: string }) => Promise<void>
}

export function ReviewRequestModal({ isOpen, onClose, onSubmit }: ReviewRequestModalProps) {
	const [lecturerId, setLecturerId] = useState('')
	const [message, setMessage] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!lecturerId.trim()) {
			setError('Lecturer ID is required')
			return
		}

		setLoading(true)
		setError(null)

		try {
			await onSubmit({ lecturerId, message })
			handleClose()
		} catch (err: any) {
			console.error('Submit review error:', err)
			setError(err.message || err.response?.data?.message || 'Failed to submit request')
		} finally {
			setLoading(false)
		}
	}

	const handleClose = () => {
		setLecturerId('')
		setMessage('')
		setError(null)
		onClose()
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className='sm:max-w-[425px] z-[70]'>
				<DialogHeader>
					<DialogTitle>Request Review</DialogTitle>
					<DialogDescription>
						Ask a lecturer to review this version of your document.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className='grid gap-4 py-4'>
					{error && (
						<div className='p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm'>
							{error}
						</div>
					)}
					<div className='grid gap-2'>
						<Label htmlFor='lecturerId'>Lecturer ID</Label>
						<Input
							id='lecturerId'
							value={lecturerId}
							onChange={(e) => setLecturerId(e.target.value)}
							placeholder='e.g., user_lecturer_123'
							disabled={loading}
						/>
						<p className='text-xs text-gray-400'>
							Enter the ID of the lecturer you want to notify.
						</p>
					</div>
					<div className='grid gap-2'>
						<Label htmlFor='message'>Message (Optional)</Label>
						<Textarea
							id='message'
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							placeholder='e.g., Please check the introduction section...'
							disabled={loading}
						/>
					</div>
					<DialogFooter>
						<Button type='button' variant='outline' onClick={handleClose} disabled={loading}>
							Cancel
						</Button>
						<Button type='submit' disabled={loading}>
							{loading ? 'Sending...' : 'Send API Request'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
