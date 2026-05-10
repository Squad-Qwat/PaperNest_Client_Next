import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/clients/api-client'
import { aiService } from '@/lib/ai/services/ai.service'
import { 
    DOCUMENT_FILE_KEYS, 
    useAddDocumentFile, 
    useRenameDocumentFile 
} from '@/lib/api/hooks/use-document-files'
import type { DocumentFile } from '@/lib/api/types/document.types'

export function useFileOperations(documentId: string | null | undefined, files: DocumentFile[]) {
	const [isUploading, setIsUploading] = useState(false)
	const queryClient = useQueryClient()
	const addDocumentFile = useAddDocumentFile()
	const renameDocumentFile = useRenameDocumentFile()

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
						console.error('[useFileOperations] RAG indexing error:', err)
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

	const handleDeleteFile = useCallback(
		async (fileId: string) => {
			if (!documentId || !confirm('Are you sure you want to delete this file?'))
				return

			try {
				await apiClient.delete(`/upload/file/${documentId}/${fileId}`)
				queryClient.invalidateQueries({ queryKey: DOCUMENT_FILE_KEYS.detail(documentId) })
				toast.success('File removed successfully')
			} catch (error: unknown) {
				console.error('Delete error:', error)
				toast.error('Failed to delete file')
			}
		},
		[documentId, queryClient]
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

	return {
		isUploading,
		processUpload,
		handleDeleteFile,
		handleInternalMove,
	}
}
