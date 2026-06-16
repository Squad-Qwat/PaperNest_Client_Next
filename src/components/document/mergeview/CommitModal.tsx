'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ButtonSpinner } from '@/components/ui/button-spinner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal, ModalFooter } from '@/components/ui/modal'

interface CommitModalProps {
	isOpen: boolean
	onClose: () => void
	onCommit: (data: { message: string }) => void
}

export function CommitModal({ isOpen, onClose, onCommit }: CommitModalProps) {
	const t = useTranslations('Document')
	const [message, setMessage] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!message.trim()) {
			setError(t('messageRequired'))
			return
		}

		setLoading(true)
		setError(null)

		try {
			await onCommit({ message })
			setMessage('')
			onClose()
		} catch (err: any) {
			console.error('Commit failed:', err)
			setError(err.message || err.response?.data?.message || 'Failed to create version')
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
		<Modal isOpen={isOpen} onClose={handleClose} title={t('createNewVersion')} size='lg'>
			<form onSubmit={handleSubmit} className='space-y-4'>
				{error && (
					<div className='p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm'>
						{error}
					</div>
				)}

				<div className='space-y-2'>
					<Label htmlFor='commit-message'>{t('message')}</Label>
					<Input
						id='commit-message'
						type='text'
						value={message}
						onChange={(e) => {
							setMessage(e.target.value)
							if (error) setError(null)
						}}
						placeholder={t('commitPlaceholder')}
						disabled={loading}
					/>
				</div>

				<ModalFooter>
					<Button type='button' variant='outline' onClick={handleClose} disabled={loading}>
						{t('cancel')}
					</Button>
					<Button type='submit' disabled={loading}>
						{loading ? (
							<>
								<ButtonSpinner />
								{t('commitVersionButton')}
							</>
						) : (
							t('commitVersionButton')
						)}
					</Button>
				</ModalFooter>
			</form>
		</Modal>
	)
}
