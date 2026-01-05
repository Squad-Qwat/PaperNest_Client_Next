'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Modal, ModalFooter } from '@/components/ui/modal'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface CreateReviewModalProps {
	isOpen: boolean
	onClose: () => void
	onSubmit: (data: { content: string; status: string }) => void
}

export default function CreateReviewModal({ isOpen, onClose, onSubmit }: CreateReviewModalProps) {
	const [content, setContent] = useState('')
	const [status, setStatus] = useState('approved')
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [isSubmitting, setIsSubmitting] = useState(false)

	const handleSubmit = async () => {
		const newErrors: Record<string, string> = {}

		if (!content.trim()) {
			newErrors.content = 'Review content is required'
		}

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors)
			return
		}

		setIsSubmitting(true)
		try {
			await onSubmit({ content, status })
			setContent('')
			setStatus('approved')
			setErrors({})
			onClose()
		} catch (error) {
			console.error('Submit failed:', error)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={() => {
				onClose()
				setContent('')
				setStatus('approved')
				setErrors({})
			}}
			title='Review Decision'
			size='lg'
		>
			<div className='space-y-4'>
				<div className='space-y-2'>
					<Label htmlFor='status'>Decision</Label>
					<Select value={status} onValueChange={setStatus} disabled={isSubmitting}>
						<SelectTrigger className='w-full'>
							<SelectValue placeholder='Select decision' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='approved'>Approved</SelectItem>
							<SelectItem value='revision'>Revision Required</SelectItem>
							<SelectItem value='rejected'>Rejected</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className='space-y-2'>
					<Label htmlFor='content'>Review Content</Label>
					<Textarea
						id='content'
						value={content}
						onChange={(e) => {
							setContent(e.target.value)
							setErrors({ ...errors, content: '' })
						}}
						placeholder='Write your review here...'
						rows={5}
						className={`resize-none ${errors.content ? 'border-red-500' : ''}`}
						disabled={isSubmitting}
					/>
					{errors.content && <p className='mt-1 text-sm text-red-400'>{errors.content}</p>}
				</div>
			</div>

		<ModalFooter>
				<Button
					variant='outline'
					onClick={() => {
						onClose()
						setContent('')
						setStatus('approved')
						setErrors({})
					}}
					disabled={isSubmitting}
				>
					Cancel
				</Button>
				<Button onClick={handleSubmit} disabled={isSubmitting}>
					{isSubmitting ? 'Submitting...' : 'Submit Decision'}
				</Button>
			</ModalFooter>
		</Modal>
	)
}
