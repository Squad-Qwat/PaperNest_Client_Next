'use client'

import {
	ExternalLink,
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
import { useFileOperations } from '@/hooks/editor/use-file-operations'
import { useDocumentFiles } from '@/lib/api/hooks/use-document-files'
import type { DocumentFile } from '@/lib/api/types/document.types'
import { buildFileTree } from '@/lib/utils/file-tree-utils'

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
	draggedItem: { id: string; name: string; type: 'file' | 'folder' } | null
	setDraggedItem: (item: { id: string; name: string; type: 'file' | 'folder' } | null) => void
	dragOverFolder: string | null
	setDragOverFolder: (folder: string | null) => void
	onInternalMove: (item: any, targetPath: string | null) => undefined | Promise<any>
	onExternalUpload: (file: File, folderPath?: string) => undefined | Promise<any>
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
	const { isUploading, processUpload, handleDeleteFile, handleInternalMove } = useFileOperations(
		documentId,
		files
	)

	const scrollContainerRef = React.useRef<HTMLDivElement>(null)
	const [isDragging, setIsDragging] = useState(false)
	const [dragOverFolder, setDragOverFolder] = useState<string | null>(null)
	const [draggedItem, setDraggedItem] = useState<{
		id: string
		name: string
		type: 'file' | 'folder'
	} | null>(null)
	const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)

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

	const treeData = useMemo(() => {
		return buildFileTree(files, (file) => (
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
		))
	}, [files, handleDeleteFile, handleInsertToEditor])

	return (
		<section
			aria-label='File explorer drop zone'
			className={`flex flex-col h-full bg-white transition-all relative ${
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
							<FileText className='h-8 w-8 text-gray-400' />
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
								onInternalMove={handleInternalMove as any}
								onExternalUpload={processUpload as any}
							/>
						)}
					/>
				)}
			</div>
		</section>
	)
}

export default FilesPanel
