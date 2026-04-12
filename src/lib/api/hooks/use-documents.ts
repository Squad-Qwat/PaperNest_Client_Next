import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { documentsService } from '../services/documents.service'
import type {
	CreateDocumentDto,
	UpdateDocumentDto,
	UpdateDocumentContentDto,
	DocumentSearchParams,
} from '../types/document.types'
import type { CreateReviewDto, UpdateReviewStatusDto } from '../types/review.types'
import type { BatchOperationRequest } from '../types/batchOperation.types'

export const DOCUMENT_KEYS = {
	all: ['documents'] as const,
	myDocuments: () => [...DOCUMENT_KEYS.all, 'mine'] as const,
	workspace: (workspaceId: string) => [...DOCUMENT_KEYS.all, 'workspace', workspaceId] as const,
	detail: (documentId: string) => [...DOCUMENT_KEYS.all, 'detail', documentId] as const,
	search: (workspaceId: string, q: string) =>
		[...DOCUMENT_KEYS.workspace(workspaceId), 'search', q] as const,
	versions: (documentId: string) => [...DOCUMENT_KEYS.detail(documentId), 'versions'] as const,
	currentVersion: (documentId: string) =>
		[...DOCUMENT_KEYS.detail(documentId), 'currentVersion'] as const,
	reviews: (documentId: string) => [...DOCUMENT_KEYS.detail(documentId), 'reviews'] as const,
	pendingReviews: () => ['reviews', 'pending'] as const,
	studentReviews: () => ['reviews', 'student'] as const,
	reviewDetail: (reviewId: string) => ['reviews', 'detail', reviewId] as const,
}

// Queries
export function useMyDocuments() {
	return useQuery({
		queryKey: DOCUMENT_KEYS.myDocuments(),
		queryFn: () => documentsService.getMyDocuments(),
	})
}

export function useWorkspaceDocuments(workspaceId: string) {
	return useQuery({
		queryKey: DOCUMENT_KEYS.workspace(workspaceId),
		queryFn: () => documentsService.getWorkspaceDocuments(workspaceId),
		enabled: !!workspaceId,
	})
}

export function useDocument(workspaceId: string, documentId: string) {
	return useQuery({
		queryKey: DOCUMENT_KEYS.detail(documentId),
		queryFn: () => documentsService.getById(workspaceId, documentId),
		enabled: !!workspaceId && !!documentId,
	})
}

export function useSearchDocuments(workspaceId: string, params: DocumentSearchParams) {
	return useQuery({
		queryKey: DOCUMENT_KEYS.search(workspaceId, params.q || ''),
		queryFn: () => documentsService.searchDocuments(workspaceId, params),
		enabled: !!workspaceId && !!params.q,
	})
}

export function useDocumentVersions(documentId: string) {
	return useQuery({
		queryKey: DOCUMENT_KEYS.versions(documentId),
		queryFn: () => documentsService.getVersions(documentId),
		enabled: !!documentId,
	})
}

export function useDocumentReviews(documentId: string) {
	return useQuery({
		queryKey: DOCUMENT_KEYS.reviews(documentId),
		queryFn: () => documentsService.getReviews(documentId),
		enabled: !!documentId,
	})
}

export function useLecturerPendingReviews() {
	return useQuery({
		queryKey: DOCUMENT_KEYS.pendingReviews(),
		queryFn: () => documentsService.getPendingReviews(),
	})
}

export function useStudentReviews() {
	return useQuery({
		queryKey: DOCUMENT_KEYS.studentReviews(),
		queryFn: () => documentsService.getStudentReviews(),
	})
}

// Mutations
export function useCreateDocument() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ workspaceId, data }: { workspaceId: string; data: CreateDocumentDto }) =>
			documentsService.create(workspaceId, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.workspace(variables.workspaceId) })
			queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.myDocuments() })
			toast.success('Dokumen berhasil dibuat!')
		},
	})
}

export function useUpdateDocument() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({
			workspaceId,
			documentId,
			data,
		}: {
			workspaceId: string
			documentId: string
			data: UpdateDocumentDto
		}) => documentsService.update(workspaceId, documentId, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.detail(variables.documentId) })
			queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.workspace(variables.workspaceId) })
			toast.success('Perubahan dokumen berhasil disimpan.')
		},
	})
}

export function useUpdateDocumentContent() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({
			workspaceId,
			documentId,
			data,
		}: {
			workspaceId: string
			documentId: string
			data: UpdateDocumentContentDto
		}) => documentsService.updateContent(workspaceId, documentId, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.detail(variables.documentId) })
			queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.versions(variables.documentId) })
		},
	})
}

export function useDeleteDocument() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ workspaceId, documentId }: { workspaceId: string; documentId: string }) =>
			documentsService.delete(workspaceId, documentId),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.workspace(variables.workspaceId) })
			queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.myDocuments() })
			queryClient.removeQueries({ queryKey: DOCUMENT_KEYS.detail(variables.documentId) })
			toast.success('Dokumen berhasil dihapus.')
		},
	})
}

export function useRevertVersion() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ documentId, versionNumber }: { documentId: string; versionNumber: number }) =>
			documentsService.revertVersion(documentId, versionNumber),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.detail(variables.documentId) })
			queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.versions(variables.documentId) })
			toast.success(`Berhasil mengembalikan ke versi ${variables.versionNumber}.`)
		},
	})
}

export function useBatchUpdateDocument() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({
			documentId,
			request,
		}: {
			documentId: string
			request: BatchOperationRequest
		}) => documentsService.batchUpdateDocument(documentId, request),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.detail(variables.documentId) })
			queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.versions(variables.documentId) })
		},
	})
}

// Review Mutations
export function useCreateReview() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({
			documentId,
			documentBodyId,
			data,
		}: {
			documentId: string
			documentBodyId: string
			data: CreateReviewDto
		}) => documentsService.createReview(documentId, documentBodyId, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.reviews(variables.documentId) })
			queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.studentReviews() })
		},
	})
}

export function useReviewAction() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({
			action,
			reviewId,
			data,
		}: {
			action: 'approve' | 'reject' | 'requestRevision'
			reviewId: string
			data?: UpdateReviewStatusDto
		}) => {
			if (action === 'approve') return documentsService.approveReview(reviewId, data)
			if (action === 'reject') return documentsService.rejectReview(reviewId, data!)
			return documentsService.requestRevision(reviewId, data!)
		},
	onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.pendingReviews() })
			queryClient.invalidateQueries({ queryKey: ['reviews'] }) 
		},
	})
}

export function useDocumentWithRoomState(documentId: string) {
	return useQuery({
		queryKey: [...DOCUMENT_KEYS.detail(documentId), 'room-state'] as const,
		queryFn: () => documentsService.getDocumentWithRoomState(documentId),
		enabled: !!documentId,
		retry: 1,
	})
}

