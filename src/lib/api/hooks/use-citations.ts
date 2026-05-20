import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { citationsService } from '../services/citations.service'
import type {
	CitationData,
	CitationResponse,
	CitationsResponse,
	SemanticScholarSearchResponse,
	CreateCitationDto,
	UpdateCitationDto,
} from '../types/citation.types'

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

export const useDocumentCitations = useCitations

export function useWorkspaceCitations(workspaceId: string) {
	return useQuery<CitationsResponse>({
		queryKey: CITATION_KEYS.workspaceList(workspaceId),
		queryFn: () => citationsService.getWorkspaceCitations(workspaceId),
		enabled: !!workspaceId,
		staleTime: 5 * 60 * 1000,
	})
}

export function useCitation(citationId: string, documentId?: string) {
	return useQuery<CitationResponse>({
		queryKey: CITATION_KEYS.detail(citationId),
		queryFn: () => citationsService.getById(citationId, documentId),
		enabled: !!citationId,
		staleTime: 5 * 60 * 1000,
	})
}

export function useCreateCitation() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (data: CreateCitationDto) =>
			citationsService.create(data),
		onSuccess: (response) => {
			queryClient.invalidateQueries({ queryKey: CITATION_KEYS.lists() })
			if (response.data?.citation?.citationId) {
				queryClient.setQueryData(
					CITATION_KEYS.detail(response.data.citation.citationId),
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
			documentId,
			data,
		}: {
			citationId: string
			documentId?: string
			data: UpdateCitationDto
		}) => citationsService.update(citationId, data, documentId),
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
		mutationFn: (variables: string | { citationId: string; documentId?: string }) => {
			if (typeof variables === 'string') {
				return citationsService.delete(variables)
			}
			return citationsService.delete(variables.citationId, variables.documentId)
		},
		onSuccess: (_, variables) => {
			const citationId = typeof variables === 'string' ? variables : variables.citationId
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
		staleTime: 60 * 1000,
	})
}

export function useCitationByDoi(documentId: string, doi: string) {
	return useQuery<CitationResponse>({
		queryKey: CITATION_KEYS.doi(documentId, doi),
		queryFn: () => citationsService.getByDoi(documentId, doi),
		enabled: !!documentId && !!doi,
		staleTime: 5 * 60 * 1000,
		retry: false,
	})
}

export function useSearchSemanticScholar(query: string, enabled: boolean = true, limit: number = 8) {
	return useQuery<SemanticScholarSearchResponse>({
		queryKey: ['semantic-scholar', 'search', query, limit],
		queryFn: () => citationsService.searchSemanticScholar(query, limit),
		enabled: enabled && query.trim().length > 0,
		staleTime: 10 * 60 * 1000,
	})
}
