import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DocumentService } from '@/lib/firebase/document-service'
import type { DocumentFile } from '@/lib/api/types/document.types'

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
		mutationFn: ({
			documentId,
			file,
		}: {
			documentId: string
			file: Partial<DocumentFile>
		}) => DocumentService.addDocumentFile(documentId, file as DocumentFile),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: DOCUMENT_FILE_KEYS.detail(variables.documentId) })
		},
	})
}
