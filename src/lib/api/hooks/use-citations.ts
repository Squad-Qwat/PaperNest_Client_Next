import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { citationsService } from '../services/citations.service'
import type { CitationData, CitationResponse, CitationsResponse } from '../types/citation.types'

export const CITATION_KEYS = {
	all: ['citations'] as const,
	lists: () => [...CITATION_KEYS.all, 'list'] as const,
	workspaceList: (workspaceId: string) => [...CITATION_KEYS.lists(), 'workspace', workspaceId] as const,
	list: (documentId: string, type?: string) => [...CITATION_KEYS.lists(), 'document', documentId, { type }] as const,
	details: () => [...CITATION_KEYS.all, 'detail'] as const,
	detail: (citationId: string) => [...CITATION_KEYS.details(), citationId] as const,
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

export function useWorkspaceCitations(workspaceId: string) {
	return useQuery<CitationsResponse>({
		queryKey: CITATION_KEYS.workspaceList(workspaceId),
		queryFn: () => citationsService.getWorkspaceCitations(workspaceId),
		enabled: !!workspaceId,
		staleTime: 5 * 60 * 1000,
	})
}

export function useCitation(citationId: string) {
	return useQuery<CitationResponse>({
		queryKey: CITATION_KEYS.detail(citationId),
		queryFn: () => citationsService.getById(citationId),
		enabled: !!citationId,
		staleTime: 5 * 60 * 1000,
	})
}

export function useCreateCitation() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (data: CitationData & { workspaceId?: string; documentId?: string }) =>
			citationsService.create(data),
		onSuccess: (response) => {
			queryClient.invalidateQueries({ queryKey: CITATION_KEYS.lists() })
			if (response.citation?.citationId) {
				queryClient.setQueryData(
					CITATION_KEYS.detail(response.citation.citationId),
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
			citationId,
			data,
		}: {
			citationId: string
			data: Partial<CitationData>
		}) => citationsService.update(citationId, data),
		onSuccess: (response, variables) => {
			queryClient.invalidateQueries({ queryKey: CITATION_KEYS.lists() })
			queryClient.setQueryData(
				CITATION_KEYS.detail(variables.citationId),
				response
			)
		},
	})
}

export function useDeleteCitation() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (citationId: string) => citationsService.delete(citationId),
		onSuccess: (_, citationId) => {
			queryClient.invalidateQueries({ queryKey: CITATION_KEYS.lists() })
			queryClient.removeQueries({
				queryKey: CITATION_KEYS.detail(citationId),
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
