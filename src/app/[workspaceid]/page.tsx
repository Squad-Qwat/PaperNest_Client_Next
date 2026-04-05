'use client'

import { useParams, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Plus, Settings, Trash2, FileText, MoreVertical } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { SearchInput } from '@/components/ui/search-input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { WorkspaceSettingsModal } from '@/components/workspace/WorkspaceSettingsModal'
import { useAuthContext } from '@/context/AuthContext'
import { useWorkspaceDocuments, useCreateDocument, useDeleteDocument } from '@/lib/api/hooks/use-documents'
import { useWorkspace } from '@/lib/api/hooks/use-workspaces'
import { format, id } from '@/lib/date'

export default function WorkspacePage() {
	const params = useParams()
	const router = useRouter()
	const { user } = useAuthContext()
	const workspaceId = params.workspaceid as string
	const {
		data: workspace,
		isLoading: workspaceLoading,
		error: workspaceErrorObj,
	} = useWorkspace(workspaceId)
	const workspaceError = workspaceErrorObj ? (workspaceErrorObj as Error).message : null

	const {
		data: documentsResponse,
		isLoading: documentsLoading,
	} = useWorkspaceDocuments(workspaceId)
	const documents = documentsResponse?.documents || []

	const { mutateAsync: createDocMutate, isPending: isCreating } = useCreateDocument()
	const { mutateAsync: deleteDocMutate, isPending: isDeleting } = useDeleteDocument()

	const [searchQuery, setSearchQuery] = useState('')
	const [showCreateModal, setShowCreateModal] = useState(false)
	const [showSettingsModal, setShowSettingsModal] = useState(false)
	const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
	const [newDoc, setNewDoc] = useState({
		title: '',
		description: '',
	})
	const [formErrors, setFormErrors] = useState<Record<string, string>>({})

	const filteredDocuments = useMemo(() => {
		if (!searchQuery) return documents

		const query = searchQuery.toLowerCase()
		return documents.filter(
			(doc) =>
				doc.title.toLowerCase().includes(query) ||
				(doc.description && doc.description.toLowerCase().includes(query))
		)
	}, [documents, searchQuery])

	const handleCreateDocument = async () => {
		const errors: Record<string, string> = {}

		if (!newDoc.title.trim()) {
			errors.title = 'Title is required'
		}

		if (Object.keys(errors).length > 0) {
			setFormErrors(errors)
			return
		}

		if (!workspaceId) return

		try {
			await createDocMutate({
				workspaceId,
				data: { title: newDoc.title.trim() }
			})

			setNewDoc({ title: '', description: '' })
			setFormErrors({})
			setShowCreateModal(false)
		} catch (err) {
			console.error('Error creating document:', err)
			setFormErrors({ submit: err instanceof Error ? err.message : 'Failed to create document' })
		}
	}

	const handleDeleteDocument = async (docId: string) => {
		if (!workspaceId) return

		try {
			await deleteDocMutate({ workspaceId, documentId: docId })
			setDeleteConfirm(null)
		} catch (err) {
			console.error('Error deleting document:', err)
			alert(err instanceof Error ? err.message : 'Failed to delete document')
		}
	}

	const handleOpenDocument = (docId: string) => {
		router.push(`/${workspaceId}/documents/${docId}`)
	}

	if (!user) {
		return null
	}

	if (workspaceLoading || documentsLoading) {
		return (
			<div className='min-h-screen bg-white'>
				<Navbar mode='workspace' />
				<main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
					<div className='mb-8'>
						<Skeleton className='h-10 w-48 mb-4' />
						<Skeleton className='h-6 w-96' />
					</div>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
						{[...Array(6)].map((_, i) => (
							<Skeleton key={i} className='h-48 rounded-lg' />
						))}
					</div>
				</main>
			</div>
		)
	}

	// If there's an error (like 403 Forbidden or 404 Not Found), redirect to home
	if (workspaceError) {
		return (
			<div className='min-h-screen bg-white flex items-center justify-center'>
				<div className='text-center'>
					<p className='text-red-600 mb-4'>{workspaceError}</p>
					<p className='text-gray-600 mb-4'>You don't have access to this workspace</p>
					<Button onClick={() => router.push('/')}>Go to Home</Button>
				</div>
			</div>
		)
	}

	if (!workspace) {
		return (
			<div className='min-h-screen bg-white flex items-center justify-center'>
				<div className='text-center'>
					<p className='text-gray-600 mb-4'>Workspace not found</p>
					<Button onClick={() => router.push('/')}>Go to Home</Button>
				</div>
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-white'>
			<Navbar mode='workspace' />

			<main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
				{/* Header */}
				<div className='mb-8 flex items-center justify-between'>
					<h2 className='text-2xl font-bold text-gray-900'>Dokumen Terbaru</h2>
					<div className='flex items-center justify-between mb-2'>
						<div className='flex items-center gap-3'>
							{/* <span className='text-4xl'>{workspace.icon || '📚'}</span> */}
							{/* <h1 className='text-3xl font-bold text-gray-900'>{workspace.title}</h1> */}
						</div>
						<Button variant='outline' size='sm' onClick={() => setShowSettingsModal(true)} className='gap-2'>
							<Settings className='h-4 w-4' />
							Settings
						</Button>
					</div>
					{/* {workspace.description && <p className='text-gray-600'>{workspace.description}</p>} */}
				</div>

				{/* Section Title */}
				<div className='mb-8'>
				</div>

				{/* Search and Create */}
				<div className='flex flex-col sm:flex-row gap-4 mb-6'>
					<div className='flex-1'>
						<SearchInput
							value={searchQuery}
							onChange={setSearchQuery}
							placeholder='Cari dokumen...'
						/>
					</div>
					<Button onClick={() => setShowCreateModal(true)} className='gap-2'>
						<Plus className='h-4 w-4' />
						Dokumen Baru
					</Button>
				</div>

				{/* Documents Grid */}
				{filteredDocuments.length === 0 ? (
					<div className='text-center py-16'>
						<FileText className='h-16 w-16 mx-auto text-gray-400 mb-4 opacity-50' />
						<p className='text-gray-600 text-lg mb-2'>
							{searchQuery ? 'No documents found' : 'No documents yet'}
						</p>
						<p className='text-gray-500 text-sm'>
							{searchQuery
								? 'Try a different search term'
								: 'Create your first document to get started'}
						</p>
					</div>
				) : (
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
						{filteredDocuments.map((doc) => (
							<div
								key={doc.documentId}
								className='bg-white border rounded-lg p-6 hover:border-teal-600 hover:shadow-lg transition-all group cursor-pointer'
								onClick={() => handleOpenDocument(doc.documentId)}
							>
								<div className='flex items-start justify-between mb-3'>
									<h3 className='text-lg font-semibold text-gray-900 group-hover:text-teal-600 transition-colors line-clamp-2 flex-1'>
										{doc.title}
									</h3>
								</div>

								<p className='text-gray-600 text-sm mb-4 line-clamp-2'>
									{doc.description || 'No description'}
								</p>

								<div className='flex items-center justify-between text-xs text-gray-500 mb-4'>
									<span>
										{format(doc.updatedAt || doc.createdAt, 'd MMMM yyyy', { locale: id })}
									</span>
								</div>

								<div className='flex gap-2 items-center'>
									<Button
										onClick={(e) => {
											e.stopPropagation()
											handleOpenDocument(doc.documentId)
										}}
										className='flex-1'
									>
										Buka
									</Button>
									<button
										onClick={(e) => {
											e.stopPropagation()
											setDeleteConfirm(doc.documentId)
										}}
										disabled={isDeleting}
										className='inline-flex items-center justify-center h-9 w-9 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:pointer-events-none'
										title='More options'
									>
										<MoreVertical className='h-4 w-4' />
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</main>

			{/* Create Document Modal */}
			<Modal
				isOpen={showCreateModal}
				onClose={() => {
					setShowCreateModal(false)
					setNewDoc({ title: '', description: '' })
					setFormErrors({})
				}}
				title='Create New Document'
				size='lg'
			>
				<div className='space-y-4'>
					<div className='space-y-2'>
						<Label htmlFor='title'>Title</Label>
						<Input
							id='title'
							type='text'
							value={newDoc.title}
							onChange={(e) => {
								setNewDoc({ ...newDoc, title: e.target.value })
								setFormErrors({ ...formErrors, title: '' })
							}}
							placeholder='Document title'
							className={formErrors.title ? 'border-red-500' : ''}
							disabled={isCreating}
						/>
						{formErrors.title && <p className='mt-1 text-sm text-red-400'>{formErrors.title}</p>}
					</div>

					<div className='space-y-2'>
						<Label htmlFor='description'>Description</Label>
						<Textarea
							id='description'
							value={newDoc.description}
							onChange={(e) => {
								setNewDoc({ ...newDoc, description: e.target.value })
								setFormErrors({ ...formErrors, description: '' })
							}}
							placeholder='Brief description of your document'
							rows={3}
							className={`resize-none ${formErrors.description ? 'border-red-500' : ''}`}
							disabled={isCreating}
						/>
						{formErrors.description && (
							<p className='mt-1 text-sm text-red-400'>{formErrors.description}</p>
						)}
					</div>

					{formErrors.submit && <p className='text-sm text-red-400'>{formErrors.submit}</p>}
				</div>

				<ModalFooter>
					<Button
						variant='outline'
						onClick={() => {
							setShowCreateModal(false)
							setNewDoc({ title: '', description: '' })
							setFormErrors({})
						}}
						disabled={isCreating}
					>
						Cancel
					</Button>
					<Button onClick={handleCreateDocument} disabled={isCreating}>
						{isCreating ? 'Creating...' : 'Create Document'}
					</Button>
				</ModalFooter>
			</Modal>

			{/* Delete Confirmation */}
			<ConfirmDialog
				isOpen={deleteConfirm !== null}
				onClose={() => setDeleteConfirm(null)}
				onConfirm={() => deleteConfirm && handleDeleteDocument(deleteConfirm)}
				title='Delete Document'
				message='Are you sure you want to delete this document? This action cannot be undone.'
				confirmText='Delete'
				variant='danger'
			/>

			{/* Workspace Settings Modal */}
			{workspace && (
				<WorkspaceSettingsModal
					isOpen={showSettingsModal}
					onClose={() => setShowSettingsModal(false)}
					workspace={workspace}
				/>
			)}
		</div>
	)
}
