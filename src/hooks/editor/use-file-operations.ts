import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { aiService } from '@/lib/ai/services/ai.service'
import { apiClient } from '@/lib/api/clients/api-client'
import {
	DOCUMENT_FILE_KEYS,
	useAddDocumentFile,
	useRenameDocumentFile,
} from '@/lib/api/hooks/use-document-files'
import type { DocumentFile } from '@/lib/api/types/document.types'

export function useFileOperations(documentId: string | null | undefined, files: DocumentFile[]) {
	const queryClient = useQueryClient()
	const addDocumentFile = useAddDocumentFile()
	const renameDocumentFile = useRenameDocumentFile()

	const uploadMutation = useMutation({
		mutationFn: async ({ file, folderPath }: { file: File; folderPath?: string }) => {
			if (!documentId) return
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

			return { fileName }
		},
		onSuccess: (data) => {
			if (data) toast.success(`Uploaded ${data.fileName}`)
		},
		onError: (error: any) => {
			console.error('Upload error:', error)
			toast.error('Failed to upload file')
		},
	})

	const deleteMutation = useMutation({
		mutationFn: async (fileId: string) => {
			if (!documentId) return
			await apiClient.delete(`/upload/file/${documentId}/${fileId}`)
		},
		onSuccess: () => {
			if (documentId) {
				queryClient.invalidateQueries({ queryKey: DOCUMENT_FILE_KEYS.detail(documentId) })
			}
			toast.success('File removed successfully')
		},
		onError: () => {
			toast.error('Failed to delete file')
		},
	})

	const moveMutation = useMutation({
		mutationFn: async ({
			item,
			targetPath,
		}: {
			item: { id: string; name: string; type: 'file' | 'folder' }
			targetPath: string | null
		}) => {
			if (!documentId) return

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
		},
		onSuccess: () => {
			toast.success('Moved successfully')
		},
		onError: () => {
			toast.error('Failed to move item')
		},
	})

	return {
		isUploading: uploadMutation.isPending,
		processUpload: (file: File, folderPath?: string) =>
			uploadMutation.mutateAsync({ file, folderPath }),
		handleDeleteFile: (fileId: string) => {
			if (confirm('Are you sure you want to delete this file?')) {
				deleteMutation.mutate(fileId)
			}
		},
		handleInternalMove: (item: any, targetPath: string | null) =>
			moveMutation.mutate({ item, targetPath }),
	}
}
