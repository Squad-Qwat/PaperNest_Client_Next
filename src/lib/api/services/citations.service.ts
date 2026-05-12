import { apiClient } from '../clients/api-client'
import { API_ENDPOINTS } from '../config'
import type { 
	CitationData, 
	CitationResponse, 
	CitationsResponse 
} from '../types/citation.types'

export const citationsService = {
	/**
	 * Get all citations for a document
	 */
	getDocumentCitations: async (documentId: string, type?: string): Promise<CitationsResponse> => {
		const url = type 
			? `${API_ENDPOINTS.citations.base(documentId)}?type=${type}`
			: API_ENDPOINTS.citations.base(documentId)
		return apiClient.get<CitationsResponse>(url)
	},

	/**
	 * Get all citations for a workspace
	 */
	getWorkspaceCitations: async (workspaceId: string): Promise<CitationsResponse> => {
		return apiClient.get<CitationsResponse>(API_ENDPOINTS.citations.workspace(workspaceId))
	},

	/**
	 * Get citation by ID
	 */
	getById: async (citationId: string): Promise<CitationResponse> => {
		return apiClient.get<CitationResponse>(API_ENDPOINTS.citations.directById(citationId))
	},

	/**
	 * Create a new citation
	 * Can be document-specific or workspace-wide
	 */
	create: async (data: CitationData & { workspaceId?: string; documentId?: string }): Promise<CitationResponse> => {
		if (data.documentId) {
			return apiClient.post<CitationResponse>(API_ENDPOINTS.citations.base(data.documentId), data)
		}
		if (data.workspaceId) {
			return apiClient.post<CitationResponse>(API_ENDPOINTS.citations.workspace(data.workspaceId), data)
		}
		throw new Error('Either documentId or workspaceId is required to create a citation')
	},

	/**
	 * Update an existing citation
	 */
	update: async (citationId: string, data: Partial<CitationData>): Promise<CitationResponse> => {
		return apiClient.put<CitationResponse>(API_ENDPOINTS.citations.directById(citationId), data)
	},

	/**
	 * Delete a citation
	 */
	delete: async (citationId: string): Promise<void> => {
		return apiClient.delete(API_ENDPOINTS.citations.directById(citationId))
	},

	/**
	 * Search citations by title or author
	 */
	search: async (documentId: string, query: string): Promise<CitationsResponse> => {
		return apiClient.get<CitationsResponse>(`${API_ENDPOINTS.citations.search(documentId)}?q=${encodeURIComponent(query)}`)
	},

	/**
	 * Find citation by DOI
	 */
	getByDoi: async (documentId: string, doi: string): Promise<CitationResponse> => {
		return apiClient.get<CitationResponse>(API_ENDPOINTS.citations.byDoi(documentId, encodeURIComponent(doi)))
	},
}
