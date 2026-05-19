import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase/config'
import { citationsService } from '../services/citations.service'
import type { Citation, CreateCitationDto, UpdateCitationDto } from '../types/citation.types'

export const CITATION_KEYS = {
	all: ['citations'] as const,
	workspace: (workspaceId: string) => [...CITATION_KEYS.all, 'workspace', workspaceId] as const,
	document: (documentId: string) => [...CITATION_KEYS.all, 'document', documentId] as const,
	detail: (citationId: string) => [...CITATION_KEYS.all, 'detail', citationId] as const,
	semanticScholar: (q: string) => [...CITATION_KEYS.all, 'semantic-scholar', q] as const,
}

// Helper to map Firestore docs
const mapFirestoreDoc = (docSnap: any, idField: string) => {
	const data = docSnap.data()
	const result = { [idField]: docSnap.id, ...data }
	if (data.createdAt?.toDate) result.createdAt = data.createdAt.toDate()
	else if (data.createdAt) result.createdAt = new Date(data.createdAt)

	if (data.updatedAt?.toDate) result.updatedAt = data.updatedAt.toDate()
	else if (data.updatedAt) result.updatedAt = new Date(data.updatedAt)

	return result
}

// Hook to listen to citations in real-time
function useFirestoreCitations(filterField: 'documentId' | 'workspaceId', value: string) {
	const [data, setData] = useState<Citation[]>([])
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		if (!value) {
			setData([])
			setIsLoading(false)
			return
		}

		const q = query(collection(db, 'citations'), where(filterField, '==', value))
		const unsubscribe = onSnapshot(
			q,
			(snapshot) => {
				const docs = snapshot.docs.map((d) => mapFirestoreDoc(d, 'citationId') as Citation)
				// Sort by createdAt desc in memory
				docs.sort((a, b) => {
					const dateA = new Date(a.createdAt).getTime()
					const dateB = new Date(b.createdAt).getTime()
					return dateB - dateA
				})
				setData(docs)
				setIsLoading(false)
			},
			(error) => {
				console.error(`Error in useFirestoreCitations (${filterField}) listener:`, error)
				setIsLoading(false)
			}
		)

		return () => unsubscribe()
	}, [filterField, value])

	return { data: { citations: data, count: data.length }, isLoading }
}

export function useDocumentCitations(documentId: string) {
	return useFirestoreCitations('documentId', documentId)
}

export function useWorkspaceCitations(workspaceId: string) {
	return useFirestoreCitations('workspaceId', workspaceId)
}

export function useCreateCitation() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			workspaceId,
			documentId,
			data,
		}: {
			workspaceId: string
			documentId?: string
			data: CreateCitationDto
		}) => {
			if (documentId) {
				return citationsService.createDocumentCitation(documentId, data)
			}
			return citationsService.createWorkspaceCitation(workspaceId, data)
		},
		onSuccess: (_, variables) => {
			if (variables.documentId) {
				queryClient.invalidateQueries({ queryKey: CITATION_KEYS.document(variables.documentId) })
			}
			queryClient.invalidateQueries({ queryKey: CITATION_KEYS.workspace(variables.workspaceId) })
		},
	})
}

export function useUpdateCitation() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ citationId, data }: { citationId: string; data: UpdateCitationDto }) =>
			citationsService.updateCitation(citationId, data),
		onSuccess: (response, variables) => {
			const citation = response.data.citation
			queryClient.invalidateQueries({ queryKey: CITATION_KEYS.detail(variables.citationId) })
			if (citation.documentId) {
				queryClient.invalidateQueries({ queryKey: CITATION_KEYS.document(citation.documentId) })
			}
			queryClient.invalidateQueries({ queryKey: CITATION_KEYS.workspace(citation.workspaceId) })
		},
	})
}

export function useDeleteCitation() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({
			citationId,
		}: {
			citationId: string
			workspaceId: string
			documentId?: string
		}) => citationsService.deleteCitation(citationId),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: CITATION_KEYS.detail(variables.citationId) })
			if (variables.documentId) {
				queryClient.invalidateQueries({ queryKey: CITATION_KEYS.document(variables.documentId) })
			}
			queryClient.invalidateQueries({ queryKey: CITATION_KEYS.workspace(variables.workspaceId) })
		},
	})
}

export function useSearchSemanticScholar(q: string, enabled = false, limit = 10, offset = 0) {
	return useQuery({
		queryKey: CITATION_KEYS.semanticScholar(q),
		queryFn: () => citationsService.searchSemanticScholar(q, limit, offset),
		enabled: enabled && !!q,
		staleTime: 5 * 60 * 1000, // 5 minutes
	})
}
