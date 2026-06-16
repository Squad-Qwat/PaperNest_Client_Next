'use client'

import { useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'
import { useCreateDocument } from '@/lib/api/hooks/use-documents'

interface CreateDocumentModalProps {
	isOpen: boolean
	onClose: () => void
	workspaceId: string
	templateId?: string
	templateName?: string
	logoUrl?: string
}

export function CreateDocumentModal({
	isOpen,
	onClose,
	workspaceId,
	templateId,
	templateName,
	logoUrl,
}: CreateDocumentModalProps) {
	const _queryClient = useQueryClient()
	const router = useRouter()
	const t = useTranslations('Template')
	const { mutateAsync: createDocument, isPending: isCreating } = useCreateDocument()

	const [newDoc, setNewDoc] = React.useState({
		title: '',
		description: '',
	})

	React.useEffect(() => {
		if (isOpen) {
			const isBlank = !templateId || templateName === 'Blank Document'
			setNewDoc({
				title: isBlank ? '' : t('untitledTemplate', { templateName: templateName ?? '' }),
				description: isBlank ? '' : t('defaultDescription', { templateName: templateName ?? '' }),
			})
		}
	}, [isOpen, templateName, templateId, t])
	const [formErrors, setFormErrors] = React.useState<Record<string, string>>({})

	const handleCreateDocument = async (e?: React.FormEvent) => {
		if (e) e.preventDefault()

		if (!newDoc.title.trim()) {
			setFormErrors({ title: t('titleRequired') })
			return
		}

		try {
			const res = await createDocument({
				workspaceId,
				data: {
					title: newDoc.title,
					description: newDoc.description,
					templateId: templateId || undefined,
				},
			})

			handleClose()

			if (res?.document?.documentId) {
				router.push(`/${workspaceId}/documents/${res.document.documentId}`)
			}
		} catch (_error) {}
	}

	const handleClose = () => {
		setNewDoc({ title: '', description: '' })
		setFormErrors({})
		onClose()
	}

	const isTemplate = templateId && templateName !== 'Blank Document'

	return (
		<Modal isOpen={isOpen} onClose={handleClose} title={t('createTitle')}>
			<form onSubmit={handleCreateDocument} className='space-y-4'>
				{isTemplate && (
					<div className='flex items-center justify-between p-3 bg-transparent border border-primary/20 rounded-lg mb-4'>
						<div className='flex-1'>
							<p className='text-xs font-medium text-primary uppercase tracking-wider'>
								{t('usingTemplate')}
							</p>
							<p className='text-sm font-semibold text-foreground'>{templateName}</p>
						</div>
						<div className='flex items-center gap-3'>
							{logoUrl ? (
								<div className='flex items-center px-3 border-l border-primary/10 ml-3'>
									<Image
										src={logoUrl}
										alt={templateName || 'Template'}
										width={60}
										height={24}
										className='h-6 w-auto opacity-90'
									/>
								</div>
							) : (
								<div className='flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary'>
									<span className='text-xs font-bold'>T</span>
								</div>
							)}
						</div>
					</div>
				)}

				<div className='space-y-2'>
					<Label htmlFor='doc-title'>
						{t('titleLabel')} <span className='text-red-500'>*</span>
					</Label>
					<Input
						id='doc-title'
						value={newDoc.title}
						onChange={(e) => {
							setNewDoc({ ...newDoc, title: e.target.value })
							if (formErrors.title) setFormErrors({})
						}}
						placeholder={t('titlePlaceholder')}
						disabled={isCreating}
						autoFocus
					/>
					{formErrors.title && <p className='text-xs text-red-500'>{formErrors.title}</p>}
				</div>

				<div className='space-y-2'>
					<Label htmlFor='doc-description'>{t('descriptionLabel')}</Label>
					<Textarea
						id='doc-description'
						value={newDoc.description}
						onChange={(e) => setNewDoc({ ...newDoc, description: e.target.value })}
						placeholder={t('descriptionPlaceholder')}
						rows={3}
						disabled={isCreating}
					/>
				</div>

				<ModalFooter>
					<Button type='button' variant='outline' onClick={handleClose} disabled={isCreating}>
						{t('cancel')}
					</Button>
					<Button type='submit' disabled={isCreating} className='bg-primary hover:bg-primary/90'>
						{isCreating ? t('creating') : t('createButton')}
					</Button>
				</ModalFooter>
			</form>
		</Modal>
	)
}
