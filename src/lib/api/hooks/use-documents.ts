import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuth } from '@/context/AuthContext'
import { documentsService } from '../services/documents.service'
import type { BatchOperationRequest } from '../types/batchOperation.types'
import type {
	CreateDocumentDto,
	DocumentSearchParams,
	UpdateDocumentContentDto,
	UpdateDocumentDto,
} from '../types/document.types'
import type { CreateReviewDto, UpdateReviewStatusDto } from '../types/review.types'

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
	const [documents, setDocuments] = useState<any[]>([])
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		if (!workspaceId) return

		const documentsRef = collection(db, 'documents')
		const q = query(
			documentsRef,
			where('workspaceId', '==', workspaceId)
		)

		const unsubscribe = onSnapshot(q, (snapshot) => {
			const docs = snapshot.docs.map((doc) => ({
				documentId: doc.id,
				...doc.data(),
				createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
				updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
			}))
			// Sort by updatedAt descending in frontend
			docs.sort((a, b) => {
				const dateA = new Date(a.updatedAt).getTime()
				const dateB = new Date(b.updatedAt).getTime()
				return dateB - dateA
			})
			setDocuments(docs)
			setIsLoading(false)
		})

		return () => unsubscribe()
	}, [workspaceId])

	return { data: { documents, count: documents.length }, isLoading }
}

export function useDocument(workspaceId: string, documentId: string) {
	const [document, setDocument] = useState<any>(null)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		if (!documentId) return

		const unsubscribe = onSnapshot(doc(db, 'documents', documentId), (snapshot) => {
			if (snapshot.exists()) {
				setDocument({
					documentId: snapshot.id,
					...snapshot.data(),
					createdAt: snapshot.data().createdAt?.toDate?.() || snapshot.data().createdAt,
					updatedAt: snapshot.data().updatedAt?.toDate?.() || snapshot.data().updatedAt,
				})
			} else {
				setDocument(null)
			}
			setIsLoading(false)
		})

		return () => unsubscribe()
	}, [documentId])

	return { data: document, isLoading }
}

export function useSearchDocuments(workspaceId: string, params: DocumentSearchParams) {
	return useQuery({
		queryKey: DOCUMENT_KEYS.search(workspaceId, params.q || ''),
		queryFn: () => documentsService.searchDocuments(workspaceId, params),
		enabled: !!workspaceId && !!params.q,
	})
}

export function useDocumentVersions(documentId: string) {
	const [versions, setVersions] = useState<any[]>([])
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		if (!documentId) return

		const versionsRef = collection(db, 'documentBodies')
		const q = query(
			versionsRef,
			where('documentId', '==', documentId)
		)

		const unsubscribe = onSnapshot(q, (snapshot) => {
			const docs = snapshot.docs.map((doc) => ({
				documentBodyId: doc.id,
				...doc.data(),
				createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
				updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
			}))
			// Sort by versionNumber descending
			docs.sort((a, b) => (b.versionNumber || 0) - (a.versionNumber || 0))
			setVersions(docs)
			setIsLoading(false)
		})

		return () => unsubscribe()
	}, [documentId])

	return { data: { versions }, isLoading }
}

export function useDocumentReviews(documentId: string) {
	const [reviews, setReviews] = useState<any[]>([])
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		if (!documentId) return

		const reviewsRef = collection(db, 'reviews')
		const q = query(
			reviewsRef,
			where('documentId', '==', documentId)
		)

		const unsubscribe = onSnapshot(q, (snapshot) => {
			const docs = snapshot.docs.map((doc) => ({
				reviewId: doc.id,
				...doc.data(),
				requestedAt: doc.data().requestedAt?.toDate?.() || doc.data().requestedAt,
				reviewedAt: doc.data().reviewedAt?.toDate?.() || doc.data().reviewedAt,
			}))
			// Sort by requestedAt descending
			docs.sort((a, b) => {
				const dateA = new Date(a.requestedAt).getTime()
				const dateB = new Date(b.requestedAt).getTime()
				return dateB - dateA
			})
			setReviews(docs)
			setIsLoading(false)
		})

		return () => unsubscribe()
	}, [documentId])

	return { data: { reviews }, isLoading }
}

export function useLecturerPendingReviews() {
	const { user } = useAuth()
	const [reviews, setReviews] = useState<any[]>([])
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		if (!user?.uid || user?.role !== 'Lecturer') return

		const reviewsRef = collection(db, 'reviews')
		const q = query(
			reviewsRef,
			where('lecturerUserId', '==', user.uid),
			where('status', '==', 'pending')
		)

		const unsubscribe = onSnapshot(q, (snapshot) => {
			const docs = snapshot.docs.map((doc) => ({
				reviewId: doc.id,
				...doc.data(),
				requestedAt: doc.data().requestedAt?.toDate?.() || doc.data().requestedAt,
				reviewedAt: doc.data().reviewedAt?.toDate?.() || doc.data().reviewedAt,
			}))
			// Sort by requestedAt descending
			docs.sort((a, b) => {
				const dateA = new Date(a.requestedAt).getTime()
				const dateB = new Date(b.requestedAt).getTime()
				return dateB - dateA
			})
			setReviews(docs)
			setIsLoading(false)
		})

		return () => unsubscribe()
	}, [user?.uid, user?.role])

	return { data: { reviews, count: reviews.length }, isLoading }
}

export function useStudentReviews() {
	const { user } = useAuth()
	const [reviews, setReviews] = useState<any[]>([])
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		if (!user?.uid) return

		const reviewsRef = collection(db, 'reviews')
		const q = query(
			reviewsRef,
			where('studentUserId', '==', user.uid)
		)

		const unsubscribe = onSnapshot(q, (snapshot) => {
			const docs = snapshot.docs.map((doc) => ({
				reviewId: doc.id,
				...doc.data(),
				requestedAt: doc.data().requestedAt?.toDate?.() || doc.data().requestedAt,
				reviewedAt: doc.data().reviewedAt?.toDate?.() || doc.data().reviewedAt,
			}))
			// Sort by requestedAt descending
			docs.sort((a, b) => {
				const dateA = new Date(a.requestedAt).getTime()
				const dateB = new Date(b.requestedAt).getTime()
				return dateB - dateA
			})
			setReviews(docs)
			setIsLoading(false)
		})

		return () => unsubscribe()
	}, [user?.uid])

	return { data: { reviews, count: reviews.length }, isLoading }
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
