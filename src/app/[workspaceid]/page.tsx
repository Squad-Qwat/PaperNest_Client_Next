'use client'

import { FileText, Trash2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AppSidebar } from '@/components/app-sidebar'
import { DashboardSkeleton } from '@/components/layout/DashboardSkeleton'
import { TemplateGallery } from '@/components/templates/TemplateGallery'
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { SearchInput } from '@/components/ui/search-input'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { useAuth } from '@/context/AuthContext'
import { useDeleteDocument, useWorkspaceDocuments } from '@/lib/api/hooks/use-documents'
import { useWorkspace } from '@/lib/api/hooks/use-workspaces'
import { format, id } from '@/lib/date'

export default function WorkspacePage() {
	const params = useParams()
	const router = useRouter()
	const { user } = useAuth()
	const workspaceId = params.workspaceid as string
	const {
		data: workspace,
		isLoading: workspaceLoading,
		error: workspaceErrorObj,
	} = useWorkspace(workspaceId)
	const workspaceError = workspaceErrorObj ? (workspaceErrorObj as Error).message : null

	const { data: documentsResponse, isLoading: documentsLoading } =
		useWorkspaceDocuments(workspaceId)
	const documents = documentsResponse?.documents || []

	const { mutateAsync: deleteDocMutate, isPending: isDeleting } = useDeleteDocument()

	const [searchQuery, setSearchQuery] = useState('')
	const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

	const filteredDocuments = useMemo(() => {
		if (!searchQuery) return documents

		const query = searchQuery.toLowerCase()
		return documents.filter(
			(doc) =>
				doc.title.toLowerCase().includes(query) || doc.description?.toLowerCase().includes(query)
		)
	}, [documents, searchQuery])

	const handleDeleteDocument = async (docId: string) => {
		if (!workspaceId) return

		toast.promise(deleteDocMutate({ workspaceId, documentId: docId }), {
			loading: 'Deleting document...',
			success: () => {
				setDeleteConfirm(null)
				return 'Document deleted successfully'
			},
			error: (err) => (err instanceof Error ? err.message : 'Failed to delete document'),
		})
	}

	const handleOpenDocument = (docId: string, title?: string) => {
		toast.promise(
			new Promise((resolve) => {
				router.push(`/${workspaceId}/documents/${docId}`)
				setTimeout(resolve, 800) // Small delay for visual feedback
			}),
			{
				loading: `Opening ${title || 'document'}...`,
				success: 'Redirecting to editor...',
				error: 'Failed to open document',
			}
		)
	}

	if (!user) {
		return null
	}

	if (workspaceLoading || documentsLoading) {
		return <DashboardSkeleton />
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
		<SidebarProvider className='h-svh overflow-hidden bg-sidebar'>
			<AppSidebar />
			<SidebarInset className='flex flex-col min-h-0 overflow-hidden border border-gray-200/50 transition-all duration-300 isolate rounded-2xl m-2'>
				<header className='flex h-16 shrink-0 items-center gap-2 px-4 bg-white border-b sticky top-0 z-30 rounded-t-2xl'>
					<SidebarTrigger className='-ml-1' />
					<Separator orientation='vertical' className='mr-2 h-4' />
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem className='hidden md:block'>
								<BreadcrumbLink href='#'>PaperNest</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className='hidden md:block' />
							<BreadcrumbItem>
								<BreadcrumbPage>{workspace?.title}</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</header>

				<main className='flex-1 p-6 w-full overflow-y-auto'>
					{/* Header Content */}
					<div className='mb-8 flex items-center justify-between'>
						<div>
							<h2 className='text-2xl font-bold text-gray-900'>Dokumen</h2>
							<p className='text-sm text-gray-500 mt-1'>
								Kelola dokumen Anda di workspace {workspace?.title}
							</p>
						</div>
					</div>

					{/* Search */}
					<div className='flex flex-col sm:flex-row gap-4 mb-8'>
						<div className='flex-1'>
							<SearchInput
								value={searchQuery}
								onChange={setSearchQuery}
								placeholder='Cari dokumen...'
							/>
						</div>
					</div>

					<div className='mb-12'>
						<TemplateGallery workspaceId={workspaceId} />
					</div>

					<div className='mb-6'>
						<h3 className='text-lg font-semibold flex items-center gap-2'>Kelola Dokumen</h3>
					</div>
					{filteredDocuments.length === 0 ? (
						<div className='text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200'>
							<FileText className='h-16 w-16 mx-auto text-gray-400 mb-4 opacity-50' />
							<p className='text-gray-600 text-lg mb-2'>
								{searchQuery ? 'No documents found' : 'No documents yet'}
							</p>
							<p className='text-gray-500 text-sm'>
								{searchQuery
									? 'Try a different search term'
									: 'No documents available in this workspace'}
							</p>
						</div>
					) : (
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
							{filteredDocuments.map((doc) => {
								return (
									// biome-ignore lint/a11y/useSemanticElements: Card needs to be clickable but cannot be a button because it contains other buttons
									<div
										key={doc.documentId}
										className='bg-white border rounded-lg p-6 hover:border-primary transition-all group relative text-left w-full'
									>
										<div className='flex items-start justify-between mb-3'>
											<h3 className='text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 flex-1'>
												{doc.title}
											</h3>
										</div>

										<p className='text-gray-600 text-sm mb-6 line-clamp-2 min-h-[40px]'>
											{doc.description || 'No description'}
										</p>

										<div className='flex items-center justify-between text-xs text-gray-500 mb-6'>
											<span>
												{format(doc.updatedAt || doc.createdAt, 'd MMMM yyyy', { locale: id })}
											</span>
										</div>

										<div className='flex gap-2 items-center'>
											<Button
												onClick={(e) => {
													e.stopPropagation()
													handleOpenDocument(doc.documentId, doc.title)
												}}
												className='flex-1 bg-primary hover:bg-primary/90'
											>
												Buka
											</Button>
											<button
												type='button'
												onClick={(e) => {
													e.stopPropagation()
													setDeleteConfirm(doc.documentId)
												}}
												disabled={isDeleting}
												className='inline-flex items-center justify-center h-9 w-9 rounded-md border border-gray-300 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-50'
												title='Hapus Dokumen'
											>
												<Trash2 className='h-4 w-4' />
											</button>
										</div>
									</div>
								)
							})}
						</div>
					)}
				</main>
			</SidebarInset>

			<ConfirmDialog
				isOpen={deleteConfirm !== null}
				onClose={() => setDeleteConfirm(null)}
				onConfirm={() => deleteConfirm && handleDeleteDocument(deleteConfirm)}
				title='Delete Document'
				message='Are you sure you want to delete this document? This action cannot be undone.'
				confirmText='Delete'
				variant='danger'
			/>
		</SidebarProvider>
	)
}
