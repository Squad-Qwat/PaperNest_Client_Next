'use client'

import * as React from 'react'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateDocument } from '@/lib/api/hooks/use-documents'
import { useQueryClient } from '@tanstack/react-query'

interface CreateDocumentModalProps {
	isOpen: boolean
	onClose: () => void
	workspaceId: string
}

export function CreateDocumentModal({ isOpen, onClose, workspaceId }: CreateDocumentModalProps) {
	const queryClient = useQueryClient()
	const { mutateAsync: createDocument, isPending: isCreating } = useCreateDocument()

	const [newDoc, setNewDoc] = React.useState({
		title: '',
		description: '',
	})
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
				},
			})
			
			handleClose()
		} catch (error) {
			// Error is already handled by global mutation cache toast
		}
	}

	const handleClose = () => {
		setNewDoc({ title: '', description: '' })
		setFormErrors({})
		onClose()
	}

	return (
		<Modal isOpen={isOpen} onClose={handleClose} title="Create New Document">
			<form onSubmit={handleCreateDocument} className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="doc-title">
						Title <span className="text-red-500">*</span>
					</Label>
					<Input
						id="doc-title"
						value={newDoc.title}
						onChange={(e) => {
							setNewDoc({ ...newDoc, title: e.target.value })
							if (formErrors.title) setFormErrors({})
						}}
						placeholder="Document title..."
						disabled={isCreating}
						autoFocus
					/>
					{formErrors.title && (
						<p className="text-xs text-red-500">{formErrors.title}</p>
					)}
				</div>

				<div className="space-y-2">
					<Label htmlFor="doc-description">Description (Optional)</Label>
					<Textarea
						id="doc-description"
						value={newDoc.description}
						onChange={(e) => setNewDoc({ ...newDoc, description: e.target.value })}
						placeholder="Brief description..."
						rows={3}
						disabled={isCreating}
					/>
				</div>

				<ModalFooter>
					<Button
						type="button"
						variant="outline"
						onClick={handleClose}
						disabled={isCreating}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={isCreating} className="bg-primary hover:bg-primary/90">
						{isCreating ? 'Creating...' : 'Create Document'}
					</Button>
				</ModalFooter>
			</form>
		</Modal>
	)
}
