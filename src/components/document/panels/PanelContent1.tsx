'use client'

import { useQueryClient } from '@tanstack/react-query'
import {
	ExternalLink,
	FileBox,
	FileCode,
	FileImage,
	FileText,
	Folder,
	FolderOpen,
	Loader2,
	Trash2,
	Upload,
	Wand2,
} from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { type TreeDataItem, TreeView } from '@/components/tree-view'
import { aiService } from '@/lib/ai/services/ai.service'
import { apiClient } from '@/lib/api/clients/api-client'
import {
	DOCUMENT_FILE_KEYS,
	useAddDocumentFile,
	useDocumentFiles,
	useRenameDocumentFile,
} from '@/lib/api/hooks/use-document-files'
import type { DocumentFile } from '@/lib/api/types/document.types'

// --- Types ---

interface FilesPanelProps {
	documentId?: string | null
	onInsertText?: (text: string) => void
}

interface FileTreeItemProps {
	item: TreeDataItem
	isLeaf: boolean
	isSelected: boolean
	isOpen?: boolean
	draggedItem: any
	setDraggedItem: (item: any) => void
	dragOverFolder: string | null
	setDragOverFolder: (folder: string | null) => void
	onInternalMove: (item: any, targetPath: string | null) => Promise<void>
	onExternalUpload: (file: File, folderPath?: string) => Promise<void>
}

// --- Helper Functions ---

const getFileIcon = (name: string, type?: string) => {
	if (type?.startsWith('image/')) return FileImage
	if (name.endsWith('.tex') || name.endsWith('.sty') || name.endsWith('.cls')) return FileCode
	if (name.endsWith('.bib')) return FileBox
	return FileText
}

// --- Sub-Components ---

const FileTreeItem: React.FC<FileTreeItemProps> = ({
	item,
	isLeaf,
	isSelected,
	isOpen,
	draggedItem,
	setDraggedItem,
	dragOverFolder,
	setDragOverFolder,
	onInternalMove,
	onExternalUpload,
}) => {
	const isFolder = !isLeaf
	const isBeingDraggedOver = dragOverFolder === item.id

	const handleDragStart = (e: React.DragEvent) => {
		e.stopPropagation()
		setDraggedItem({
			id: item.id,
			name: isFolder ? item.id : (item.metadata?.fullName as string) || item.name,
			type: isFolder ? 'folder' : 'file',
		})
	}

	const handleDrop = async (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setDragOverFolder(null)

		let targetPath: string | null = null
		if (isFolder) {
			targetPath = item.id.replace('folder-', '')
		} else {
			// It's a file, get parent folder path from metadata
			const fullName = (item.metadata?.fullName as string) || item.name
			const parts = fullName.split('/')
			parts.pop() // remove filename
			targetPath = parts.length > 0 ? parts.join('/') : null
		}

		// Case 1: Internal Move
		if (draggedItem) {
			await onInternalMove(draggedItem, targetPath)
			setDraggedItem(null)
			return
		}

		// Case 2: External Upload
		const droppedFiles = Array.from(e.dataTransfer.files)
		if (droppedFiles.length > 0) {
			for (const file of droppedFiles) {
				await onExternalUpload(file, targetPath || undefined)
			}
		}
	}

	return (
		<div
			draggable
			role='treeitem'
			tabIndex={0}
			onDragStart={handleDragStart}
			onDragOver={(e) => {
				e.preventDefault()
				e.stopPropagation()
				setDragOverFolder(item.id)
			}}
			onDragLeave={() => setDragOverFolder(null)}
			onDrop={handleDrop}
			className={`group flex items-center gap-2.5 flex-1 min-w-0 transition-all py-1 px-2 rounded-md cursor-pointer ${
				isBeingDraggedOver ? 'bg-primary/10 ring-1 ring-primary/20' : 'hover:bg-gray-50/80'
			}`}
		>
			<div className='flex items-center gap-2 flex-1 min-w-0'>
				{isFolder ? (
					isOpen ? (
						<FolderOpen className='h-4 w-4 shrink-0 text-primary/70' />
					) : (
						<Folder className='h-4 w-4 shrink-0 text-primary/70' />
					)
				) : (
					item.icon && <item.icon className='h-4 w-4 shrink-0 text-gray-400' />
				)}
				<span
					className={`text-sm truncate ${
						isSelected ? 'text-primary font-medium' : 'text-gray-600'
					} ${isBeingDraggedOver ? 'text-primary font-bold' : ''}`}
				>
					{item.name}
				</span>
			</div>

			<div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto'>
				{item.actions}
			</div>
		</div>
	)
}

// --- Main Component ---

const FilesPanel: React.FC<FilesPanelProps> = ({ documentId, onInsertText }) => {
	const { data: files = [], isLoading } = useDocumentFiles(documentId)
	const addDocumentFile = useAddDocumentFile()
	const renameDocumentFile = useRenameDocumentFile()
	const queryClient = useQueryClient()
	const scrollContainerRef = React.useRef<HTMLDivElement>(null)

	const [isDragging, setIsDragging] = useState(false)
	const [dragOverFolder, setDragOverFolder] = useState<string | null>(null)
	const [draggedItem, setDraggedItem] = useState<{
		id: string
		name: string
		type: 'file' | 'folder'
	} | null>(null)
	const [isUploading, setIsUploading] = useState(false)
	const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)

	useEffect(() => {
		setPortalTarget(document.getElementById('panel-header-actions'))
	}, [])

	const handleDragOverGlobal = useCallback((e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setIsDragging(true)

		// Auto-scroll logic
		if (scrollContainerRef.current) {
			const container = scrollContainerRef.current
			const { top, bottom } = container.getBoundingClientRect()
			const threshold = 60 // distance from edge in px
			const speed = 15 // scroll speed

			if (e.clientY < top + threshold) {
				container.scrollTop -= speed
			} else if (e.clientY > bottom - threshold) {
				container.scrollTop += speed
			}
		}
	}, [])

	const handleInsertToEditor = useCallback(
		(file: DocumentFile) => {
			if (!onInsertText) {
				toast.warning('Editor not ready yet')
				return
			}

			let command = ''
			if (file.type?.startsWith('image/')) {
				command = `\\begin{figure}[h]\n  \\centering\n  \\includegraphics[width=0.7\\textwidth]{${file.name}}\n  \\caption{${file.name}}\n  \\label{fig:${file.name.split('.')[0]}}\n\\end{figure}\n`
			} else if (file.name.endsWith('.bib')) {
				command = `\\bibliography{${file.name.replace('.bib', '')}}\n`
			} else if (
				file.name.endsWith('.tex') ||
				file.name.endsWith('.sty') ||
				file.name.endsWith('.cls')
			) {
				command = `\\input{${file.name}}\n`
			} else {
				command = `% Attached file: ${file.name}\n`
			}

			onInsertText(command)
			toast.success(`LaTeX command for ${file.name} added`)
		},
		[onInsertText]
	)

	const handleDeleteFile = useCallback(
		async (fileId: string) => {
			if (!documentId || !confirm('Are you sure you want to delete this file from cloud storage?'))
				return

			try {
				await apiClient.delete(`/upload/file/${documentId}/${fileId}`)
				queryClient.invalidateQueries({ queryKey: DOCUMENT_FILE_KEYS.detail(documentId) })
				toast.success('File removed from cloud storage')
			} catch (error: unknown) {
				console.error('Delete error:', error)
				toast.error('Failed to delete file')
			}
		},
		[documentId, queryClient]
	)

	const processUpload = useCallback(
		async (file: File, folderPath?: string) => {
			if (!documentId) return
			setIsUploading(true)
			try {
				const fileName = folderPath
					? `${folderPath.replace(/^folder-/, '')}/${file.name}`
					: file.name

				const { presignedUrl, publicUrl, key } = await apiClient.post<{
					presignedUrl: string
					publicUrl: string
					key: string
				}>('/upload/presigned-url', {
					filename: fileName,
					contentType: file.type || 'application/octet-stream',
					folder: `documents/${documentId}`,
				})

				const uploadResponse = await fetch(presignedUrl, {
					method: 'PUT',
					body: file,
					headers: { 'Content-Type': file.type || 'application/octet-stream' },
				})

				if (!uploadResponse.ok) throw new Error('Failed to upload to storage')

				await addDocumentFile.mutateAsync({
					documentId,
					file: {
						name: fileName,
						type: file.type,
						url: publicUrl,
						r2Key: key,
						size: file.size,
						createdAt: new Date() as unknown as Date,
					},
				})

				if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
					aiService.indexPDF(documentId, key).catch((err) => {
						console.error('[FilesPanel] RAG indexing error:', err)
					})
				}

				toast.success(`Uploaded ${file.name}`)
			} catch (error: unknown) {
				console.error('Upload error:', error)
				toast.error(`Failed to upload ${file.name}`)
			} finally {
				setIsUploading(false)
			}
		},
		[documentId, addDocumentFile]
	)

	const handleInternalMove = useCallback(
		async (
			item: { id: string; name: string; type: 'file' | 'folder' },
			targetPath: string | null
		) => {
			if (!documentId) return

			try {
				if (item.type === 'file') {
					const fileNameOnly = item.name.split('/').pop()!
					const newName = targetPath ? `${targetPath}/${fileNameOnly}` : fileNameOnly
					if (newName === item.name) return

					await renameDocumentFile.mutateAsync({ documentId, fileId: item.id, newName })
				} else {
					const sourcePath = item.id.replace('folder-', '')
					const targetFolderPrefix = targetPath ? `${targetPath}/` : ''
					const sourceFolderName = sourcePath.split('/').pop()!
					const newFolderPath = `${targetFolderPrefix}${sourceFolderName}`

					if (newFolderPath === sourcePath) return

					const folderFiles = files.filter(
						(f) => f.name.startsWith(`${sourcePath}/`) || f.name === sourcePath
					)

					for (const f of folderFiles) {
						const relativePath = f.name.substring(sourcePath.length)
						const newName = `${newFolderPath}${relativePath}`
						await renameDocumentFile.mutateAsync({ documentId, fileId: f.fileId, newName })
					}
				}
				toast.success(`Moved ${item.type} successfully`)
			} catch (error) {
				console.error('Move error:', error)
				toast.error('Failed to move item')
			}
		},
		[documentId, renameDocumentFile, files]
	)

	const treeData = useMemo(() => {
		const root: TreeDataItem[] = []
		const folderMap: Record<string, TreeDataItem> = {}

		// Helper to sort tree items: Folders first, then Files, both alphabetically
		const sortTreeItems = (items: TreeDataItem[]) => {
			items.sort((a, b) => {
				const aIsFolder = !!a.children
				const bIsFolder = !!b.children

				if (aIsFolder && !bIsFolder) return -1
				if (!aIsFolder && bIsFolder) return 1
				return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
			})

			for (const item of items) {
				if (item.children) {
					sortTreeItems(item.children)
				}
			}
		}

		files.forEach((file) => {
			const parts = file.name.split('/')
			let currentLevel = root

			parts.forEach((part, index) => {
				const isLast = index === parts.length - 1
				const pathSoFar = parts.slice(0, index + 1).join('/')

				if (isLast) {
					currentLevel.push({
						id: file.fileId,
						name: part,
						icon: getFileIcon(file.name, file.type),
						metadata: { fullName: file.name },
						actions: (
							<div className='flex items-center gap-1'>
								<button
									type='button'
									onClick={(e) => {
										e.stopPropagation()
										handleInsertToEditor(file)
									}}
									className='p-1 hover:bg-white hover:text-primary rounded text-gray-400'
								>
									<Wand2 className='h-3.5 w-3.5' />
								</button>
								<a
									href={file.url}
									target='_blank'
									rel='noopener noreferrer'
									onClick={(e) => e.stopPropagation()}
									className='p-1 hover:bg-white hover:text-blue-600 rounded text-gray-400'
								>
									<ExternalLink className='h-3.5 w-3.5' />
								</a>
								<button
									type='button'
									onClick={(e) => {
										e.stopPropagation()
										handleDeleteFile(file.fileId)
									}}
									className='p-1 hover:bg-white hover:text-red-600 rounded text-gray-400'
								>
									<Trash2 className='h-3.5 w-3.5' />
								</button>
							</div>
						),
					})
				} else {
					if (!folderMap[pathSoFar]) {
						const newFolder: TreeDataItem = {
							id: `folder-${pathSoFar}`,
							name: part,
							icon: Folder,
							openIcon: FolderOpen,
							children: [],
						}
						folderMap[pathSoFar] = newFolder
						currentLevel.push(newFolder)
					}
					currentLevel = folderMap[pathSoFar].children!
				}
			})
		})

		sortTreeItems(root)
		return root
	}, [files, handleDeleteFile, handleInsertToEditor])

	return (
		<section
			className={`flex flex-col h-full bg-white transition-all relative ${
				isDragging ? 'bg-primary/5' : ''
			}`}
			aria-label='File explorer drop zone'
			onDragOver={handleDragOverGlobal}
			onDragLeave={() => setIsDragging(false)}
			onDrop={async (e) => {
				e.preventDefault()
				e.stopPropagation()
				setIsDragging(false)
				if (draggedItem) {
					await handleInternalMove(draggedItem, null)
					setDraggedItem(null)
				} else {
					const droppedFiles = Array.from(e.dataTransfer.files)
					for (const file of droppedFiles) {
						await processUpload(file)
					}
				}
			}}
		>
			{isDragging && !draggedItem && (
				<div className='absolute inset-0 z-50 flex items-center justify-center p-4 pointer-events-none'>
					<div className='absolute inset-0 bg-white/60 backdrop-blur-[2px]' />
					<div className='relative w-full h-full border-2 border-dashed border-primary/30 rounded-lg flex flex-col items-center justify-center gap-2 bg-primary/[0.02]'>
						<Upload className='h-6 w-6 text-primary animate-bounce mb-2' />
						<p className='text-xs font-semibold text-primary uppercase tracking-widest'>
							Drop to upload
						</p>
					</div>
				</div>
			)}

			{portalTarget &&
				createPortal(
					<label className='cursor-pointer'>
						<input
							type='file'
							className='hidden'
							onChange={async (e) => {
								const file = e.target.files?.[0]
								if (file) await processUpload(file)
								e.target.value = ''
							}}
							disabled={isUploading || !documentId}
							multiple
						/>
						<div
							className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-semibold transition-all ${
								isUploading
									? 'text-gray-400 cursor-not-allowed'
									: 'text-primary hover:bg-primary/10'
							}`}
						>
							{isUploading ? (
								<Loader2 className='h-3.5 w-3.5 animate-spin' />
							) : (
								<Upload className='h-3.5 w-3.5' />
							)}
							<span className='hidden sm:inline'>{isUploading ? 'Uploading...' : 'Upload'}</span>
						</div>
					</label>,
					portalTarget
				)}

			<div className='flex-1 overflow-y-auto custom-scrollbar' ref={scrollContainerRef}>
				{isLoading ? (
					<div className='flex flex-col items-center justify-center h-40 gap-2 opacity-50'>
						<Loader2 className='h-6 w-6 animate-spin text-primary' />
						<span className='text-xs text-gray-500 font-medium'>Syncing...</span>
					</div>
				) : treeData.length === 0 ? (
					<div className='flex flex-col items-center justify-center p-8 text-center gap-3 opacity-40'>
						<div className='p-3 bg-gray-50 rounded-full'>
							<Folder className='h-8 w-8 text-gray-400' />
						</div>
						<p className='text-sm font-medium text-gray-600'>No files yet</p>
					</div>
				) : (
					<TreeView
						data={treeData}
						className='w-full'
						expandAll={true}
						renderItem={(params) => (
							<FileTreeItem
								{...params}
								draggedItem={draggedItem}
								setDraggedItem={setDraggedItem}
								dragOverFolder={dragOverFolder}
								setDragOverFolder={setDragOverFolder}
								onInternalMove={handleInternalMove}
								onExternalUpload={processUpload}
							/>
						)}
					/>
				)}
			</div>
		</section>
	)
}

export default FilesPanel
