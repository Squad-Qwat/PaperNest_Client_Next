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
	 * Get citation by ID
	 */
	getById: async (documentId: string, citationId: string): Promise<CitationResponse> => {
		return apiClient.get<CitationResponse>(API_ENDPOINTS.citations.byId(documentId, citationId))
	},

	/**
	 * Create a new citation
	 */
	create: async (documentId: string, data: CitationData): Promise<CitationResponse> => {
		return apiClient.post<CitationResponse>(API_ENDPOINTS.citations.base(documentId), data)
	},

	/**
	 * Update an existing citation
	 */
	update: async (documentId: string, citationId: string, data: Partial<CitationData>): Promise<CitationResponse> => {
		return apiClient.put<CitationResponse>(API_ENDPOINTS.citations.byId(documentId, citationId), data)
	},

	/**
	 * Delete a citation
	 */
	delete: async (documentId: string, citationId: string): Promise<void> => {
		return apiClient.delete(API_ENDPOINTS.citations.byId(documentId, citationId))
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
