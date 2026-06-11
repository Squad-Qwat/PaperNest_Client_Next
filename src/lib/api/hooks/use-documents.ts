import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore'
import { useEffect } from 'react'
import { db } from '@/lib/firebase/config'
import { documentsService } from '../services/documents.service'
import type { BatchOperationRequest } from '../types/batchOperation.types'
import type {
	CreateDocumentDto,
	Document,
	DocumentSearchParams,
	DocumentsResponse,
	DocumentWithRoomStateResponse,
	UpdateDocumentContentDto,
	UpdateDocumentDto,
	VersionsResponse,
} from '../types/document.types'
import type {
	CreateReviewDto,
	Review,
	ReviewsResponse,
	UpdateReviewStatusDto,
} from '../types/review.types'

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

const mapFirestoreDoc = (docSnap: any, idField: string) => {
	const data = docSnap.data()
	const result = { [idField]: docSnap.id, ...data }
	const dateFields = ['createdAt', 'updatedAt', 'requestedAt', 'reviewedAt']
	dateFields.forEach((field) => {
		if (data[field]?.toDate) result[field] = data[field].toDate()
	})
	return result
}

const useFirestoreQuery = <T>(
	queryKey: readonly any[],
	queryRef: any,
	idField: string,
	dataKey = 'documents',
	sortFn?: (a: any, b: any) => number
) => {
	const queryClient = useQueryClient()

	const query = useQuery({
		queryKey,
		queryFn: () => {
			return queryClient.getQueryData<T>(queryKey) || null
		},
		enabled: !!queryRef,
		staleTime: Number.POSITIVE_INFINITY, // We rely on real-time updates
	})

	useEffect(() => {
		if (!queryRef) return

		const unsubscribe = onSnapshot(
			queryRef,
			(snapshot: any) => {
				let docs: any[]
				if (snapshot.docs) {
					docs = snapshot.docs.map((d: any) => mapFirestoreDoc(d, idField))
					if (sortFn) docs = [...docs].sort(sortFn)
					queryClient.setQueryData(queryKey, { [dataKey]: docs, count: docs.length })
				} else if (snapshot.exists()) {
					const docData = mapFirestoreDoc(snapshot, idField)
					queryClient.setQueryData(queryKey, docData)
				} else {
					queryClient.setQueryData(queryKey, null)
				}
			},
			(error) => {
				console.error(`Error in firestore listener (${idField}):`, error)
			}
		)
		return () => unsubscribe()
	}, [idField, queryRef, sortFn, queryKey, queryClient, dataKey])

	return query
}

export function useMyDocuments() {
	return useQuery({
		queryKey: DOCUMENT_KEYS.myDocuments(),
		queryFn: () => documentsService.getMyDocuments(),
	})
}

export function useWorkspaceDocuments(workspaceId: string) {
	const q = workspaceId
		? query(collection(db, 'documents'), where('workspaceId', '==', workspaceId))
		: null

	return useFirestoreQuery<DocumentsResponse>(
		DOCUMENT_KEYS.workspace(workspaceId),
		q,
		'documentId',
		'documents',
		(a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
	)
}

export function useDocument(_workspaceId: string, documentId: string) {
	const q = documentId ? doc(db, 'documents', documentId) : null
	return useFirestoreQuery<Document>(DOCUMENT_KEYS.detail(documentId), q, 'documentId')
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

export function useReviewDetail(reviewId: string) {
	return useQuery({
		queryKey: DOCUMENT_KEYS.reviewDetail(reviewId),
		queryFn: async () => {
			const res = await documentsService.getReview(reviewId)
			return res.review
		},
		enabled: !!reviewId,
	})
}

export function useLecturerPendingReviews(enabled = true) {
	return useQuery({
		queryKey: DOCUMENT_KEYS.pendingReviews(),
		queryFn: () => documentsService.getPendingReviews(),
		enabled,
	})
}

export function useStudentReviews(enabled = true) {
	return useQuery({
		queryKey: DOCUMENT_KEYS.studentReviews(),
		queryFn: () => documentsService.getStudentReviews(),
		enabled,
	})
}

export function useCreateDocument() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ workspaceId, data }: { workspaceId: string; data: CreateDocumentDto }) =>
			documentsService.create(workspaceId, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.workspace(variables.workspaceId) })
			queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.myDocuments() })
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
			queryClient.invalidateQueries({ queryKey: ['reviews'] })
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
		},
	})
}

export function useBatchUpdateDocument() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ documentId, request }: { documentId: string; request: BatchOperationRequest }) =>
			documentsService.batchUpdateDocument(documentId, request),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.detail(variables.documentId) })
			queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.versions(variables.documentId) })
		},
	})
}

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

export function useUpdateReviewStatus() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({
			reviewId,
			data,
		}: {
			reviewId: string
			data: UpdateReviewStatusDto & { status: 'approved' | 'rejected' | 'revision_required' }
		}) => {
			const { status, ...rest } = data
			if (status === 'approved') return documentsService.approveReview(reviewId, rest)
			if (status === 'rejected') return documentsService.rejectReview(reviewId, rest)
			return documentsService.requestRevision(reviewId, rest)
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.pendingReviews() })
			queryClient.invalidateQueries({ queryKey: ['reviews'] })
			queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.reviewDetail(variables.reviewId) })
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
		queryFn: () =>
			documentsService.getDocumentWithRoomState(
				documentId
			) as Promise<DocumentWithRoomStateResponse>,
		enabled: !!documentId,
		retry: 1,
	})
}
