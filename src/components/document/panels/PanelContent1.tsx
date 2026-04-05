'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { FileText, Upload, Trash2, Loader2, FileCode, FileImage, FileBox, ExternalLink, Wand2 } from 'lucide-react'
import { DocumentService } from '@/lib/firebase/document-service'
import { DocumentFile } from '@/lib/api/types/document.types'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { apiClient } from '@/lib/api/clients/api-client'
import { useDocumentFiles, useAddDocumentFile, DOCUMENT_FILE_KEYS } from '@/lib/api/hooks/use-document-files'
import { useQueryClient } from '@tanstack/react-query'

interface FilesPanelProps {
	documentId?: string | null
	editorView?: any
}

const FilesPanel: React.FC<FilesPanelProps> = ({ documentId, editorView }) => {
	const { data: files = [], isLoading, refetch } = useDocumentFiles(documentId)
	const addDocumentFile = useAddDocumentFile()
	const queryClient = useQueryClient()
	const [isUploading, setIsUploading] = useState(false)
	const { toast } = useToast()

	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file || !documentId) return

		setIsUploading(true)
		try {
			// 1. Get Presigned URL from Backend (using apiClient for auth & base URL)
			const { presignedUrl, publicUrl, key } = await apiClient.post<any>('/upload/presigned-url', {
				filename: file.name,
				contentType: file.type || 'application/octet-stream',
				folder: `documents/${documentId}`
			})

			// 2. Upload directly to R2
			const uploadResponse = await fetch(presignedUrl, {
				method: 'PUT',
				body: file,
				headers: {
					'Content-Type': file.type || 'application/octet-stream'
				}
			})

			if (!uploadResponse.ok) throw new Error('Failed to upload to storage')

			// 3. Save metadata to Firestore using mutation
			await addDocumentFile.mutateAsync({
				documentId: documentId,
				file: {
					name: file.name,
					type: file.type,
					url: publicUrl,
					r2Key: key,
					size: file.size,
					createdAt: new Date() as any // bypass strict typing for now if needed
				}
			})

			toast({
				title: 'Success',
				description: 'File uploaded successfully',
			})

		} catch (error: any) {
			console.error('Upload error:', error)
			toast({
				title: 'Error',
				description: error.message || 'Failed to upload file',
				variant: 'destructive'
			})
		} finally {
			setIsUploading(false)
			// Reset input
			event.target.value = ''
		}
	}

	const handleDeleteFile = async (fileId: string) => {
		if (!documentId || !confirm('Are you sure you want to delete this file from cloud storage?')) return

		try {
			// Call backend to delete from R2 and Firestore
			await apiClient.delete(`/upload/file/${documentId}/${fileId}`);
			
			// Invalidate cache instead of mutating local state directly
			queryClient.invalidateQueries({ queryKey: DOCUMENT_FILE_KEYS.detail(documentId) })
			
			toast({
				title: 'Deleted',
				description: 'File removed from cloud storage and document',
			})
		} catch (error: any) {
			console.error('Delete error:', error)
			toast({
				title: 'Error',
				description: error.message || 'Failed to delete file',
				variant: 'destructive'
			})
		}
	}

	const getFileIcon = (type: string, name: string) => {
		if (type?.startsWith('image/')) return <FileImage className="h-4 w-4 text-blue-500" />
		if (name.endsWith('.tex') || name.endsWith('.sty') || name.endsWith('.cls')) return <FileCode className="h-4 w-4 text-green-500" />
		if (name.endsWith('.bib')) return <FileBox className="h-4 w-4 text-orange-500" />
		return <FileText className="h-4 w-4 text-gray-400" />
	}

	const formatSize = (bytes?: number) => {
		if (!bytes) return '0 B'
		const k = 1024
		const sizes = ['B', 'KB', 'MB', 'GB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
	}

	const handleInsertToEditor = (file: DocumentFile) => {
		if (!editorView) {
			toast({
				title: 'Wait',
				description: 'Editor not ready yet',
			})
			return
		}

		let command = ''
		if (file.type?.startsWith('image/')) {
			command = `\\begin{figure}[h]\n  \\centering\n  \\includegraphics[width=0.7\\textwidth]{${file.name}}\n  \\caption{${file.name}}\n  \\label{fig:${file.name.split('.')[0]}}\n\\end{figure}\n`
		} else if (file.name.endsWith('.bib')) {
			command = `\\bibliography{${file.name.replace('.bib', '')}}\n`
		} else if (file.name.endsWith('.tex') || file.name.endsWith('.sty') || file.name.endsWith('.cls')) {
			command = `\\input{${file.name}}\n`
		} else {
			command = `% Attached file: ${file.name}\n`
		}

		const { state } = editorView
		const { from } = state.selection.main

		editorView.dispatch({
			changes: { from, insert: command },
			selection: { anchor: from + command.length }
		})

		toast({
			title: 'Inserted',
			description: `LaTeX command for ${file.name} added to editor`,
		})
	}

	return (
		<div className='flex flex-col h-full bg-white'>
			<div className='p-4 border-b border-gray-100 flex items-center justify-between'>
				<span className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>Attachments</span>
				<label className='cursor-pointer'>
					<input 
						type="file" 
						className="hidden" 
						onChange={handleFileUpload} 
						disabled={isUploading || !documentId}
					/>
					<div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
						isUploading 
							? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
							: 'bg-primary/10 text-primary hover:bg-primary/20'
					}`}>
						{isUploading ? (
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
						) : (
							<Upload className="h-3.5 w-3.5" />
						)}
						{isUploading ? 'Uploading...' : 'Upload'}
					</div>
				</label>
			</div>

			<div className='flex-1 overflow-y-auto'>
				{isLoading ? (
					<div className='flex flex-col items-center justify-center h-40 gap-2 opacity-50'>
						<Loader2 className='h-6 w-6 animate-spin text-primary' />
						<span className='text-xs text-gray-500'>Loading files...</span>
					</div>
				) : files.length === 0 ? (
					<div className='flex flex-col items-center justify-center p-8 text-center gap-3 opacity-40'>
						<div className='p-3 bg-gray-50 rounded-full'>
							<FileText className='h-8 w-8 text-gray-400' />
						</div>
						<div>
							<p className='text-sm font-medium text-gray-600'>No attachments</p>
							<p className='text-xs text-gray-400 mt-1 uppercase tracking-tighter'>Upload images, .bib, or other source files</p>
						</div>
					</div>
				) : (
					<div className='divide-y divide-gray-50'>
						{files.map((file) => (
							<div key={file.fileId} className='group flex items-center gap-3 p-3 hover:bg-gray-50/80 transition-colors'>
								<div className="flex-shrink-0">
									{getFileIcon(file.type, file.name)}
								</div>
								<div className='flex-1 min-w-0'>
									<p className='text-sm font-medium text-gray-700 truncate' title={file.name}>
										{file.name}
									</p>
									<p className='text-[10px] text-gray-400 mt-0.5'>
										{formatSize(file.size)} • {file.type?.split('/')[1] || 'file'}
									</p>
								</div>
								<div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
									<button 
										onClick={() => handleInsertToEditor(file)}
										className='p-1.5 hover:bg-white hover:text-primary rounded text-gray-400 transition-colors'
										title="Insert LaTeX command"
									>
										<Wand2 className='h-3.5 w-3.5' />
									</button>
									<a 
										href={file.url} 
										target="_blank" 
										rel="noopener noreferrer"
										className='p-1.5 hover:bg-white hover:text-blue-600 rounded text-gray-400 transition-colors'
										title="Open file"
									>
										<ExternalLink className='h-3.5 w-3.5' />
									</a>
									<button 
										onClick={() => handleDeleteFile(file.fileId)}
										className='p-1.5 hover:bg-white hover:text-red-600 rounded text-gray-400 transition-colors'
										title="Delete file"
									>
										<Trash2 className='h-3.5 w-3.5' />
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
			
			<div className='p-3 bg-blue-50/30 border-t border-blue-50'>
				<p className='text-[10px] text-blue-600 font-medium leading-relaxed italic'>
					Tip: Files uploaded here can be used in your LaTeX document. For example, use \includegraphics{'{filename}'} for images.
				</p>
			</div>
		</div>
	)
}

export default FilesPanel
