import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { citationsService } from '../services/citations.service'
import type { CitationData, CitationResponse, CitationsResponse } from '../types/citation.types'

export const CITATION_KEYS = {
	all: ['citations'] as const,
	lists: () => [...CITATION_KEYS.all, 'list'] as const,
	list: (documentId: string, type?: string) => [...CITATION_KEYS.lists(), documentId, { type }] as const,
	details: () => [...CITATION_KEYS.all, 'detail'] as const,
	detail: (documentId: string, citationId: string) => [...CITATION_KEYS.details(), documentId, citationId] as const,
	search: (documentId: string, query: string) => [...CITATION_KEYS.all, 'search', documentId, { query }] as const,
	doi: (documentId: string, doi: string) => [...CITATION_KEYS.all, 'doi', documentId, doi] as const,
}

export function useCitations(documentId: string, type?: string) {
	return useQuery<CitationsResponse>({
		queryKey: CITATION_KEYS.list(documentId, type),
		queryFn: () => citationsService.getDocumentCitations(documentId, type),
		enabled: !!documentId,
		staleTime: 5 * 60 * 1000,
	})
}

export function useCitation(documentId: string, citationId: string) {
	return useQuery<CitationResponse>({
		queryKey: CITATION_KEYS.detail(documentId, citationId),
		queryFn: () => citationsService.getById(documentId, citationId),
		enabled: !!documentId && !!citationId,
		staleTime: 5 * 60 * 1000,
	})
}

export function useCreateCitation() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ documentId, data }: { documentId: string; data: CitationData }) =>
			citationsService.create(documentId, data),
		onSuccess: (response, variables) => {
			queryClient.invalidateQueries({ queryKey: CITATION_KEYS.lists() })
			if (response.data?.citation?.citationId) {
				queryClient.setQueryData(
					CITATION_KEYS.detail(variables.documentId, response.data.citation.citationId),
					response
				)
			}
		},
	})
}

export function useUpdateCitation() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({
			documentId,
			citationId,
			data,
		}: {
			documentId: string
			citationId: string
			data: Partial<CitationData>
		}) => citationsService.update(documentId, citationId, data),
		onSuccess: (response, variables) => {
			queryClient.invalidateQueries({ queryKey: CITATION_KEYS.list(variables.documentId) })
			queryClient.setQueryData(
				CITATION_KEYS.detail(variables.documentId, variables.citationId),
				response
			)
		},
	})
}

export function useDeleteCitation() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ documentId, citationId }: { documentId: string; citationId: string }) =>
			citationsService.delete(documentId, citationId),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: CITATION_KEYS.list(variables.documentId) })
			queryClient.removeQueries({
				queryKey: CITATION_KEYS.detail(variables.documentId, variables.citationId),
			})
		},
	})
}

export function useSearchCitations(documentId: string, query: string) {
	return useQuery<CitationsResponse>({
		queryKey: CITATION_KEYS.search(documentId, query),
		queryFn: () => citationsService.search(documentId, query),
		enabled: !!documentId && query.length > 0,
		staleTime: 60 * 1000, // 1 minute stale time for search results
	})
}

export function useCitationByDoi(documentId: string, doi: string) {
	return useQuery<CitationResponse>({
		queryKey: CITATION_KEYS.doi(documentId, doi),
		queryFn: () => citationsService.getByDoi(documentId, doi),
		enabled: !!documentId && !!doi,
		staleTime: 5 * 60 * 1000,
		retry: false, // Don't retry if not found
	})
}
