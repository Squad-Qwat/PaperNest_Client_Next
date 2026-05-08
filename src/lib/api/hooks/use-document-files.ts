import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { DocumentFile } from '@/lib/api/types/document.types'
import { DocumentService } from '@/lib/firebase/document-service'

export const DOCUMENT_FILE_KEYS = {
	all: ['documentFiles'] as const,
	detail: (documentId: string) => [...DOCUMENT_FILE_KEYS.all, documentId] as const,
}

export function useDocumentFiles(documentId: string | null | undefined) {
	return useQuery({
		queryKey: DOCUMENT_FILE_KEYS.detail(documentId as string),
		queryFn: () => DocumentService.getDocumentFiles(documentId as string),
		enabled: !!documentId,
	})
}

export function useAddDocumentFile() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ documentId, file }: { documentId: string; file: Partial<DocumentFile> }) =>
			DocumentService.addDocumentFile(documentId, file as DocumentFile),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: DOCUMENT_FILE_KEYS.detail(variables.documentId) })
		},
	})
}
export function useRenameDocumentFile() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({
			documentId,
			fileId,
			newName,
		}: {
			documentId: string
			fileId: string
			newName: string
		}) => DocumentService.renameDocumentFile(documentId, fileId, newName),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: DOCUMENT_FILE_KEYS.detail(variables.documentId) })
		},
	})
}
