'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ButtonSpinner } from '@/components/ui/button-spinner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { ModalErrorAlert } from '@/components/ui/modal-error-alert'
import { useModalForm } from '@/hooks/use-modal-form'

interface CommitModalProps {
	isOpen: boolean
	onClose: () => void
	onCommit: (data: { message: string }) => void
}

export function CommitModal({ isOpen, onClose, onCommit }: CommitModalProps) {
	const t = useTranslations('Document')
	const [message, setMessage] = useState('')
	const { loading, setLoading, error, setError, clearError, handleClose } = useModalForm(() => {
		setMessage('')
		onClose()
	})

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!message.trim()) {
			setError(t('messageRequired'))
			return
		}

		setLoading(true)
		clearError()

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

	return (
		<Modal isOpen={isOpen} onClose={handleClose} title={t('createNewVersion')} size='lg'>
			<form onSubmit={handleSubmit} className='space-y-4'>
				<ModalErrorAlert message={error} />

				<div className='space-y-2'>
					<Label htmlFor='commit-message'>{t('message')}</Label>
					<Input
						id='commit-message'
						type='text'
						value={message}
						onChange={(e) => {
							setMessage(e.target.value)
							if (error) clearError()
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
