'use client'

import { Notebook } from '@react-symbols/icons'
import {
	DefaultFileIcon,
	DefaultFolderIcon,
	FileIcon as RFileIcon,
	FolderIcon as RFolderIcon,
} from '@react-symbols/icons/utils'
import { ExternalLink, FilePlus, FolderPlus, Loader2, Trash2, Upload, Wand2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import {
	FileTree,
	FileTreeActions,
	FileTreeFile,
	FileTreeFolder,
	FileTreeIcon,
	FileTreeName,
} from '@/components/ai-elements/file-tree'
import type { TreeDataItem } from '@/components/tree-view'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useFileOperations } from '@/hooks/editor/use-file-operations'
import { useDocumentFiles } from '@/lib/api/hooks/use-document-files'
import type { DocumentFile } from '@/lib/api/types/document.types'
import { useAuthStore } from '@/lib/store/auth-store'
import { cn } from '@/lib/utils'
import { buildFileTree } from '@/lib/utils/file-tree-utils'

// --- Types ---

interface FilesPanelProps {
	documentId?: string | null
	onInsertText?: (text: string) => void
	onOpenFile?: (file: { fileId: string; name: string; content: string; url: string } | null) => void
}

// --- Sub-Components ---

const hasCustomFolderIcon = (name: string) => {
	const customFolders = [
		'src',
		'components',
		'lib',
		'hooks',
		'public',
		'app',
		'assets',
		'context',
		'api',
		'styles',
		'utils',
		'db',
		'layouts',
		'tests',
		'docs',
		'shared',
	]
	return customFolders.includes(name.toLowerCase())
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

	const [selectedPath, setSelectedPath] = useState<string | undefined>(undefined)
	const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())

	const handleSelect = useCallback(
		(path: string) => {
			setSelectedPath(path)

			if (path.startsWith('folder-')) {
				// It's a folder
				setSelectedFolder(path.replace('folder-', ''))
			} else {
				// It's a file, get its parent folder
				const file = files.find((f) => f.fileId === path)
				if (file) {
					const parts = file.name.split('/')
					parts.pop()
					setSelectedFolder(parts.length > 0 ? parts.join('/') : null)
				} else {
					setSelectedFolder(null)
				}
			}
		},
		[files]
	)

	const handleDragStart = useCallback(
		(e: React.DragEvent, node: TreeDataItem, isFolder: boolean) => {
			e.stopPropagation()
			setDraggedItem({
				id: node.id,
				name: isFolder ? node.id : (node.metadata?.fullName as string) || node.name,
				type: isFolder ? 'folder' : 'file',
			})
		},
		[]
	)

	const handleDragOver = useCallback((e: React.DragEvent, node: TreeDataItem) => {
		e.preventDefault()
		e.stopPropagation()
		setDragOverFolder(node.id)
	}, [])

	const handleDragLeave = useCallback(() => {
		setDragOverFolder(null)
	}, [])

	const handleDrop = useCallback(
		async (e: React.DragEvent, node: TreeDataItem, isFolder: boolean) => {
			e.preventDefault()
			e.stopPropagation()
			setDragOverFolder(null)

			let targetPath: string | null = null
			if (isFolder) {
				targetPath = node.id.replace('folder-', '')
			} else {
				const fullName = (node.metadata?.fullName as string) || node.name
				const parts = fullName.split('/')
				parts.pop()
				targetPath = parts.length > 0 ? parts.join('/') : null
			}

			if (draggedItem) {
				await handleInternalMove(draggedItem, targetPath)
				setDraggedItem(null)
				return
			}

			const droppedFiles = Array.from(e.dataTransfer.files)
			if (droppedFiles.length > 0) {
				for (const file of droppedFiles) {
					await processUpload(file, targetPath || undefined)
				}
			}
		},
		[draggedItem, handleInternalMove, processUpload]
	)

	const handleConfirmDelete = useCallback(() => {
		if (!deleteConfirmFileId) return
		handleDeleteFile(deleteConfirmFileId)
		setDeleteConfirmFileId(null)
	}, [deleteConfirmFileId, handleDeleteFile])

	const handleConfirmCreate = useCallback(
		async (nameToCreate: string) => {
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
		},
		[selectedFolder, isCreating, handleCreateFile]
	)

	const onNewFile = useCallback(() => {
		setIsCreating('file')
		setNewName('')
		if (selectedFolder) {
			setExpandedPaths((prev) => {
				const next = new Set(prev)
				next.add(`folder-${selectedFolder}`)
				return next
			})
		}
	}, [selectedFolder])

	const onNewFolder = useCallback(() => {
		setIsCreating('folder')
		setNewName('')
		if (selectedFolder) {
			setExpandedPaths((prev) => {
				const next = new Set(prev)
				next.add(`folder-${selectedFolder}`)
				return next
			})
		}
	}, [selectedFolder])

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

	const hasInitializedExpanded = React.useRef(false)
	useEffect(() => {
		if (treeData.length > 0 && !hasInitializedExpanded.current) {
			const folders = new Set<string>()
			const collectFolderIds = (items: TreeDataItem[]) => {
				for (const item of items) {
					if (item.children) {
						folders.add(item.id)
						collectFolderIds(item.children)
					}
				}
			}
			collectFolderIds(treeData)
			setExpandedPaths(folders)
			hasInitializedExpanded.current = true
		}
	}, [treeData])

	const handleInputKeyDown = useCallback(
		async (e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === 'Enter') {
				await handleConfirmCreate(newName)
			} else if (e.key === 'Escape') {
				setIsCreating(null)
				setNewName('')
			}
		},
		[newName, handleConfirmCreate]
	)

	const handleInputBlur = useCallback(() => {
		setTimeout(() => {
			setIsCreating(null)
			setNewName('')
		}, 200)
	}, [])

	const renderCreationInput = useCallback(
		(parentFolder: string | null) => {
			const isFolderInput = isCreating === 'folder'

			if (isFolderInput) {
				return (
					<div className='flex w-full items-center gap-1 rounded px-2 py-1 text-left font-sans text-sm'>
						{/* Spacer for chevron button */}
						<span className='size-4 shrink-0' />
						<div className='flex min-w-0 flex-1 items-center gap-1'>
							<FileTreeIcon>
								{hasCustomFolderIcon(newName) ? (
									<RFolderIcon folderName={newName} className='size-4 shrink-0' />
								) : (
									<DefaultFolderIcon className='size-4 shrink-0' />
								)}
							</FileTreeIcon>
							<input
								type='text'
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
								onKeyDown={handleInputKeyDown}
								onBlur={handleInputBlur}
								className='flex-1 bg-background text-sm text-foreground outline-none border border-primary rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary/50 font-sans'
								placeholder={parentFolder ? `${parentFolder}/folder-name` : 'folder-name'}
								onClick={(e) => e.stopPropagation()}
							/>
						</div>
					</div>
				)
			}

			return (
				<FileTreeFile path='creating-file' name='' className='font-sans text-sm'>
					<div className='flex items-center gap-2 flex-1 min-w-0'>
						<span className='size-4 shrink-0' />
						<FileTreeIcon>
							<RFileIcon
								fileName={newName || 'file.tex'}
								className='size-4 shrink-0'
								editFileExtensionData={{
									bib: Notebook,
								}}
							/>
						</FileTreeIcon>
						<input
							type='text'
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							onKeyDown={handleInputKeyDown}
							onBlur={handleInputBlur}
							className='flex-1 bg-background text-sm text-foreground outline-none border border-primary rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary/50 font-sans'
							placeholder={parentFolder ? `${parentFolder}/file-name.tex` : 'file-name.tex'}
							onClick={(e) => e.stopPropagation()}
						/>
					</div>
				</FileTreeFile>
			)
		},
		[isCreating, newName, handleInputKeyDown, handleInputBlur]
	)

	const renderTreeNodes = useCallback(
		(nodes: TreeDataItem[]) => {
			return nodes.map((node) => {
				const isFolder = !!node.children
				const isBeingDraggedOver = dragOverFolder === node.id

				if (isFolder) {
					const isSelectedForCreation =
						isCreating && (selectedFolder ? node.id === `folder-${selectedFolder}` : false)
					return (
						<FileTreeFolder
							key={node.id}
							path={node.id}
							name={node.name}
							headerClassName={cn(
								'group font-sans text-sm',
								isBeingDraggedOver && 'bg-primary/10 ring-1 ring-primary/20'
							)}
							draggable
							onDragStart={(e) => handleDragStart(e, node, true)}
							onDragOver={(e) => handleDragOver(e, node)}
							onDragLeave={handleDragLeave}
							onDrop={(e) => handleDrop(e, node, true)}
						>
							{renderTreeNodes(node.children!)}
							{isSelectedForCreation && renderCreationInput(selectedFolder)}
						</FileTreeFolder>
					)
				}

				const isSelected = selectedPath === node.id

				return (
					<FileTreeFile
						key={node.id}
						path={node.id}
						name={node.name}
						className={cn(
							'group cursor-pointer py-1 px-2 rounded-md transition-colors font-sans text-sm',
							isSelected ? 'text-primary font-medium bg-muted' : 'text-muted-foreground',
							isBeingDraggedOver && 'bg-primary/10 ring-1 ring-primary/20 text-primary font-bold'
						)}
						draggable
						onDragStart={(e) => handleDragStart(e, node, false)}
						onDragOver={(e) => handleDragOver(e, node)}
						onDragLeave={handleDragLeave}
						onDrop={(e) => handleDrop(e, node, false)}
						onDoubleClick={(e) => {
							e.stopPropagation()
							node.onDoubleClick?.()
						}}
					>
						<div className='flex items-center gap-2 flex-1 min-w-0'>
							<span className='size-4 shrink-0' />
							<FileTreeIcon>
								<RFileIcon
									fileName={node.name}
									className='size-4 shrink-0'
									editFileExtensionData={{
										bib: Notebook,
									}}
								/>
							</FileTreeIcon>
							<FileTreeName className='text-sm truncate'>{node.name}</FileTreeName>
						</div>

						<FileTreeActions className='opacity-0 group-hover:opacity-100 transition-opacity ml-auto'>
							{node.actions}
						</FileTreeActions>
					</FileTreeFile>
				)
			})
		},
		[
			dragOverFolder,
			selectedPath,
			handleDragStart,
			handleDragOver,
			handleDragLeave,
			handleDrop,
			isCreating,
			selectedFolder,
			renderCreationInput,
		]
	)

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
				{isLoading ? (
					<div className='flex flex-col items-center justify-center h-40 gap-2 opacity-50'>
						<Loader2 className='h-6 w-6 animate-spin text-primary' />
						<span className='text-xs text-muted-foreground font-medium'>{t('syncing')}</span>
					</div>
				) : treeData.length === 0 && !isCreating ? (
					<div className='flex flex-col items-center justify-center p-8 text-center gap-3 opacity-40'>
						<div className='p-3 bg-muted rounded-full'>
							<DefaultFileIcon className='h-8 w-8 text-muted-foreground' />
						</div>
						<p className='text-sm font-medium text-muted-foreground'>{t('noFiles')}</p>
					</div>
				) : (
					(treeData.length > 0 || isCreating) && (
						<FileTree
							expanded={expandedPaths}
							onExpandedChange={setExpandedPaths}
							onSelect={handleSelect}
							selectedPath={selectedPath}
							className='w-full border-none bg-transparent p-0'
						>
							{renderTreeNodes(treeData)}
							{isCreating && !selectedFolder && renderCreationInput(null)}
						</FileTree>
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
