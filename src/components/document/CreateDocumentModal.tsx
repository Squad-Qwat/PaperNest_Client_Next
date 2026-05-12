'use client'

import { useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
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
	const { mutateAsync: createDocument, isPending: isCreating } = useCreateDocument()

	const [newDoc, setNewDoc] = React.useState({
		title: '',
		description: '',
	})

	React.useEffect(() => {
		if (isOpen) {
			const isBlank = !templateId || templateName === 'Blank Document'
			setNewDoc({
				title: isBlank ? '' : `Untitled ${templateName}`,
				description: isBlank ? '' : `Document created from ${templateName} template`,
			})
		}
	}, [isOpen, templateName, templateId])
	const [formErrors, setFormErrors] = React.useState<Record<string, string>>({})

	const handleCreateDocument = async (e?: React.FormEvent) => {
		if (e) e.preventDefault()

		if (!newDoc.title.trim()) {
			setFormErrors({ title: 'Title is required' })
			return
		}

		try {
			await createDocument({
				workspaceId,
				data: {
					title: newDoc.title,
					description: newDoc.description,
					templateId: templateId || undefined,
				},
			})

			handleClose()
		} catch (_error) {}
	}

	const handleClose = () => {
		setNewDoc({ title: '', description: '' })
		setFormErrors({})
		onClose()
	}

	const isTemplate = templateId && templateName !== 'Blank Document'

	return (
		<Modal isOpen={isOpen} onClose={handleClose} title='Create New Document'>
			<form onSubmit={handleCreateDocument} className='space-y-4'>
				{isTemplate && (
					<div className='flex items-center justify-between p-3 bg-transparent border border-primary/20 rounded-lg mb-4'>
						<div className='flex-1'>
							<p className='text-xs font-medium text-primary uppercase tracking-wider'>
								Using Template
							</p>
							<p className='text-sm font-semibold text-gray-900'>{templateName}</p>
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
						Title <span className='text-red-500'>*</span>
					</Label>
					<Input
						id='doc-title'
						value={newDoc.title}
						onChange={(e) => {
							setNewDoc({ ...newDoc, title: e.target.value })
							if (formErrors.title) setFormErrors({})
						}}
						placeholder='Document title...'
						disabled={isCreating}
						autoFocus
					/>
					{formErrors.title && <p className='text-xs text-red-500'>{formErrors.title}</p>}
				</div>

				<div className='space-y-2'>
					<Label htmlFor='doc-description'>Description (Optional)</Label>
					<Textarea
						id='doc-description'
						value={newDoc.description}
						onChange={(e) => setNewDoc({ ...newDoc, description: e.target.value })}
						placeholder='Brief description...'
						rows={3}
						disabled={isCreating}
					/>
				</div>

				<ModalFooter>
					<Button type='button' variant='outline' onClick={handleClose} disabled={isCreating}>
						Cancel
					</Button>
					<Button type='submit' disabled={isCreating} className='bg-primary hover:bg-primary/90'>
						{isCreating ? 'Creating...' : 'Create Document'}
					</Button>
				</ModalFooter>
			</form>
		</Modal>
	)
}
