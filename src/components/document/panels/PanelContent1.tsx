'use client'

import {
	ExternalLink,
	FilePlus,
	FileText,
	Folder,
	FolderOpen,
	FolderPlus,
	Loader2,
	Trash2,
	Upload,
	Wand2,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { type TreeDataItem, TreeView } from '@/components/tree-view'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useFileOperations } from '@/hooks/editor/use-file-operations'
import { useDocumentFiles } from '@/lib/api/hooks/use-document-files'
import type { DocumentFile } from '@/lib/api/types/document.types'
import { useAuthStore } from '@/lib/store/auth-store'
import { buildFileTree } from '@/lib/utils/file-tree-utils'

// --- Types ---

interface FilesPanelProps {
	documentId?: string | null
	onInsertText?: (text: string) => void
	onOpenFile?: (file: { fileId: string; name: string; content: string; url: string } | null) => void
}

interface FileTreeItemProps {
	item: TreeDataItem
	isLeaf: boolean
	isSelected: boolean
	isOpen?: boolean
	draggedItem: { id: string; name: string; type: 'file' | 'folder' } | null
	setDraggedItem: (item: { id: string; name: string; type: 'file' | 'folder' } | null) => void
	dragOverFolder: string | null
	setDragOverFolder: (folder: string | null) => void
	onInternalMove: (item: any, targetPath: string | null) => undefined | Promise<any>
	onExternalUpload: (file: File, folderPath?: string) => undefined | Promise<any>
}

// --- Sub-Components ---

const getFileIconColor = (name: string) => {
	const ext = name.split('.').pop()?.toLowerCase() || ''
	if (ext === 'tex') return 'text-orange-500 dark:text-orange-400'
	if (ext === 'bib') return 'text-sky-500 dark:text-sky-400'
	if (['sty', 'cls'].includes(ext)) return 'text-violet-500 dark:text-violet-400'
	if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext))
		return 'text-emerald-500 dark:text-emerald-400'
	return 'text-gray-400'
}

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
			const fullName = (item.metadata?.fullName as string) || item.name
			const parts = fullName.split('/')
			parts.pop() // remove filename
			targetPath = parts.length > 0 ? parts.join('/') : null
		}

		if (draggedItem) {
			await onInternalMove(draggedItem, targetPath)
			setDraggedItem(null)
			return
		}

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
				isBeingDraggedOver ? 'bg-primary/10 ring-1 ring-primary/20' : 'hover:bg-muted/50'
			}`}
		>
			<div className='flex items-center gap-2 flex-1 min-w-0'>
				{isFolder ? (
					isOpen ? (
						<FolderOpen className='h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400 fill-amber-500/10' />
					) : (
						<Folder className='h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400 fill-amber-500/10' />
					)
				) : (
					item.icon && <item.icon className={`h-4 w-4 shrink-0 ${getFileIconColor(item.name)}`} />
				)}
				<span
					className={`text-sm truncate ${
						isSelected ? 'text-primary font-medium' : 'text-muted-foreground'
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

const FilesPanel: React.FC<FilesPanelProps> = ({ documentId, onInsertText, onOpenFile }) => {
	const { data: files = [], isLoading } = useDocumentFiles(documentId)
	const { isUploading, processUpload, handleDeleteFile, handleInternalMove, handleCreateFile } =
		useFileOperations(documentId, files)
	const t = useTranslations('Panel')

	const scrollContainerRef = React.useRef<HTMLDivElement>(null)
	const [isDragging, setIsDragging] = useState(false)
	const [dragOverFolder, setDragOverFolder] = useState<string | null>(null)
	const [draggedItem, setDraggedItem] = useState<{
		id: string
		name: string
		type: 'file' | 'folder'
	} | null>(null)
	const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)

	const [isCreating, setIsCreating] = useState<'file' | 'folder' | null>(null)
	const [newName, setNewName] = useState('')
	const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
	const [deleteConfirmFileId, setDeleteConfirmFileId] = useState<string | null>(null)

	const handleConfirmDelete = useCallback(() => {
		if (!deleteConfirmFileId) return
		handleDeleteFile(deleteConfirmFileId)
		setDeleteConfirmFileId(null)
	}, [deleteConfirmFileId, handleDeleteFile])

	const handleConfirmCreate = async (nameToCreate: string) => {
		let name = nameToCreate.trim()
		if (!name) {
			setIsCreating(null)
			return
		}

		// Prefix with selected folder if not already prefixed
		if (selectedFolder && !name.startsWith(`${selectedFolder}/`)) {
			name = `${selectedFolder}/${name}`
		}

		try {
			if (isCreating === 'file') {
				await handleCreateFile(name, `% New file: ${name}`)
			} else {
				const folderPath = `${name.replace(/\/$/, '')}/.gitkeep`
				await handleCreateFile(folderPath, `% Placeholder file for folder: ${name}`)
			}
		} catch (err) {
			console.error(err)
		} finally {
			setIsCreating(null)
			setNewName('')
		}
	}

	const onNewFile = useCallback(() => {
		setIsCreating('file')
		setNewName('')
	}, [])

	const onNewFolder = useCallback(() => {
		setIsCreating('folder')
		setNewName('')
	}, [])

	useEffect(() => {
		setPortalTarget(document.getElementById('panel-header-actions'))
	}, [])

	const handleDragOverGlobal = useCallback((e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setIsDragging(true)

		if (scrollContainerRef.current) {
			const container = scrollContainerRef.current
			const { top, bottom } = container.getBoundingClientRect()
			const threshold = 60
			const speed = 15

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

	const handleEditFile = useCallback(
		async (file: DocumentFile) => {
			if (!onOpenFile) return

			const isImage =
				file.type?.startsWith('image/') || file.name.match(/\.(png|jpe?g|gif|webp|svg)$/i)

			try {
				toast.loading(isImage ? 'Loading image...' : 'Loading file...', { id: 'load-file' })

				const { accessToken } = useAuthStore.getState()
				const proxyUrl = `${process.env.NEXT_PUBLIC_API_URL}/upload/download?url=${encodeURIComponent(file.url)}&t=${Date.now()}`

				const response = await fetch(proxyUrl, {
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				})

				if (!response.ok)
					throw new Error(
						isImage ? 'Failed to fetch image content' : 'Failed to fetch file content'
					)

				let content = ''
				if (isImage) {
					let blob = await response.blob()
					if (blob.type === 'application/octet-stream' || !blob.type) {
						let mimeType = 'image/png'
						const ext = file.name.split('.').pop()?.toLowerCase()
						if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg'
						else if (ext === 'gif') mimeType = 'image/gif'
						else if (ext === 'webp') mimeType = 'image/webp'
						else if (ext === 'svg') mimeType = 'image/svg+xml'

						blob = new Blob([blob], { type: mimeType })
					}
					content = URL.createObjectURL(blob)
				} else {
					content = await response.text()
				}

				onOpenFile({
					fileId: file.fileId,
					name: file.name,
					content: content,
					url: file.url,
				})
				toast.dismiss('load-file')
			} catch (error) {
				console.error(error)
				toast.dismiss('load-file')
				toast.error(isImage ? 'Failed to open image' : 'Failed to open file for editing')
			}
		},
		[onOpenFile]
	)

	const treeData = useMemo(() => {
		return buildFileTree(
			files,
			(file) => (
				<div className='flex items-center gap-1'>
					<button
						type='button'
						onClick={(e) => {
							e.stopPropagation()
							handleInsertToEditor(file)
						}}
						className='p-1 hover:bg-muted hover:text-primary rounded text-muted-foreground'
					>
						<Wand2 className='h-3.5 w-3.5' />
					</button>
					{!file.name.toLowerCase().endsWith('.bib') && (
						<a
							href={file.url}
							target='_blank'
							rel='noopener noreferrer'
							onClick={(e) => e.stopPropagation()}
							className='p-1 hover:bg-muted hover:text-blue-600 rounded text-muted-foreground'
						>
							<ExternalLink className='h-3.5 w-3.5' />
						</a>
					)}
					<button
						type='button'
						onClick={(e) => {
							e.stopPropagation()
							setDeleteConfirmFileId(file.fileId)
						}}
						className='p-1 hover:bg-muted hover:text-red-600 rounded text-muted-foreground'
					>
						<Trash2 className='h-3.5 w-3.5' />
					</button>
				</div>
			),
			(file) => {
				const isEditable = file.name.match(/\.(bib|sty|cls|tex|txt)$/i)
				const isImage =
					file.type?.startsWith('image/') || file.name.match(/\.(png|jpe?g|gif|webp|svg)$/i)
				if (isEditable || isImage) {
					handleEditFile(file)
				}
			}
		)
	}, [files, handleInsertToEditor, handleEditFile])

	return (
		<section
			aria-label='File explorer drop zone'
			className={`flex flex-col h-full bg-background transition-all relative ${
				isDragging ? 'bg-primary/5' : ''
			}`}
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
					<div className='absolute inset-0 bg-background/60 backdrop-blur-[2px]' />
					<div className='relative w-full h-full border-2 border-dashed border-primary/30 rounded-lg flex flex-col items-center justify-center gap-2 bg-primary/[0.02]'>
						<Upload className='h-6 w-6 text-primary animate-bounce mb-2' />
						<p className='text-xs font-semibold text-primary uppercase tracking-widest'>
							{t('dropToUpload')}
						</p>
					</div>
				</div>
			)}

			{portalTarget &&
				createPortal(
					<div className='flex items-center gap-1'>
						<button
							type='button'
							onClick={onNewFile}
							disabled={isUploading || !documentId}
							className='flex items-center justify-center p-1.5 rounded-md text-primary hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer'
							title={t('newFile')}
						>
							<FilePlus className='h-4 w-4' />
						</button>
						<button
							type='button'
							onClick={onNewFolder}
							disabled={isUploading || !documentId}
							className='flex items-center justify-center p-1.5 rounded-md text-primary hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer'
							title={t('newFolder')}
						>
							<FolderPlus className='h-4 w-4' />
						</button>
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
										? 'text-muted-foreground cursor-not-allowed'
										: 'text-primary hover:bg-primary/10'
								}`}
							>
								{isUploading ? (
									<Loader2 className='h-3.5 w-3.5 animate-spin' />
								) : (
									<Upload className='h-3.5 w-3.5' />
								)}
								<span className='hidden sm:inline'>
									{isUploading ? t('uploading') : t('upload')}
								</span>
							</div>
						</label>
					</div>,
					portalTarget
				)}

			<div
				className='flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1'
				ref={scrollContainerRef}
			>
				{isCreating && (
					<div className='flex items-center gap-2.5 py-1 px-2 pl-4 rounded-md min-w-0 w-full'>
						<div className='flex items-center gap-2 flex-1 min-w-0'>
							<div className='w-4 mr-1 shrink-0' />
							{isCreating === 'folder' ? (
								<FolderOpen className='h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400 fill-amber-500/10' />
							) : (
								<FileText className='h-4 w-4 shrink-0 text-gray-400' />
							)}
							<input
								type='text'
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
								onKeyDown={async (e) => {
									if (e.key === 'Enter') {
										await handleConfirmCreate(newName)
									} else if (e.key === 'Escape') {
										setIsCreating(null)
										setNewName('')
									}
								}}
								onBlur={() => {
									setTimeout(() => {
										setIsCreating(null)
										setNewName('')
									}, 200)
								}}
								className='flex-1 bg-background text-sm text-foreground outline-none border border-blue-500 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-blue-500/50'
								placeholder={
									isCreating === 'folder'
										? `${selectedFolder ? `${selectedFolder}/` : ''}folder-name`
										: `${selectedFolder ? `${selectedFolder}/` : ''}file-name.tex`
								}
							/>
						</div>
					</div>
				)}

				{isLoading ? (
					<div className='flex flex-col items-center justify-center h-40 gap-2 opacity-50'>
						<Loader2 className='h-6 w-6 animate-spin text-primary' />
						<span className='text-xs text-muted-foreground font-medium'>{t('syncing')}</span>
					</div>
				) : treeData.length === 0 && !isCreating ? (
					<div className='flex flex-col items-center justify-center p-8 text-center gap-3 opacity-40'>
						<div className='p-3 bg-muted rounded-full'>
							<FileText className='h-8 w-8 text-muted-foreground' />
						</div>
						<p className='text-sm font-medium text-muted-foreground'>{t('noFiles')}</p>
					</div>
				) : (
					(treeData.length > 0 || isCreating) && (
						<TreeView
							data={treeData}
							className='w-full'
							expandAll={true}
							onSelectChange={(item) => {
								if (item) {
									if (item.children) {
										// It's a folder
										setSelectedFolder(item.id.replace('folder-', ''))
									} else {
										// It's a file, get its parent folder
										const fullName = (item.metadata?.fullName as string) || item.name
										const parts = fullName.split('/')
										parts.pop()
										setSelectedFolder(parts.length > 0 ? parts.join('/') : null)
									}
								} else {
									setSelectedFolder(null)
								}
							}}
							renderItem={(params) => (
								<FileTreeItem
									{...params}
									draggedItem={draggedItem}
									setDraggedItem={setDraggedItem}
									dragOverFolder={dragOverFolder}
									setDragOverFolder={setDragOverFolder}
									onInternalMove={handleInternalMove as any}
									onExternalUpload={processUpload as any}
								/>
							)}
						/>
					)
				)}
			</div>

			<ConfirmDialog
				isOpen={deleteConfirmFileId !== null}
				onClose={() => setDeleteConfirmFileId(null)}
				onConfirm={handleConfirmDelete}
				title={t('deleteFile')}
				message={t('deleteFileMessage')}
				confirmText={t('delete')}
				cancelText={t('cancel')}
				variant='danger'
			/>
		</section>
	)
}

export default FilesPanel
