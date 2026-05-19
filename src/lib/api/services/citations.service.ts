/**
 * Citations Service
 * Handles all citation and academic paper-related API operations
 */

import { apiClient } from '../clients/api-client'
import { API_ENDPOINTS } from '../config'
import type {
	CitationResponse,
	CitationsResponse,
	CreateCitationDto,
	SemanticScholarPaperResponse,
	SemanticScholarSearchResponse,
	UpdateCitationDto,
} from '../types/citation.types'

class CitationsService {
	private readonly inFlightRequests = new Map<string, Promise<any>>()

	private async deduplicateRequest<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
		if (this.inFlightRequests.has(key)) {
			console.log(`♻️ [CitationsService] Reusing in-flight request: ${key}`)
			return this.inFlightRequests.get(key)!
		}

		const promise = fetcher().finally(() => {
			this.inFlightRequests.delete(key)
		})

		this.inFlightRequests.set(key, promise)
		return promise
	}

	/**
	 * Get all citations for a workspace
	 */
	async getWorkspaceCitations(workspaceId: string): Promise<CitationsResponse> {
		return this.deduplicateRequest(`getWorkspaceCitations:${workspaceId}`, () =>
			apiClient.get<CitationsResponse>(API_ENDPOINTS.citations.byWorkspace(workspaceId))
		)
	}

	/**
	 * Get all citations for a document
	 */
	async getDocumentCitations(documentId: string): Promise<CitationsResponse> {
		return this.deduplicateRequest(`getDocumentCitations:${documentId}`, () =>
			apiClient.get<CitationsResponse>(API_ENDPOINTS.citations.byDocument(documentId))
		)
	}

	/**
	 * Create a citation in a workspace
	 */
	async createWorkspaceCitation(
		workspaceId: string,
		data: CreateCitationDto
	): Promise<CitationResponse> {
		return apiClient.post<CitationResponse>(API_ENDPOINTS.citations.byWorkspace(workspaceId), data)
	}

	/**
	 * Create a citation in a document
	 */
	async createDocumentCitation(
		documentId: string,
		data: CreateCitationDto
	): Promise<CitationResponse> {
		return apiClient.post<CitationResponse>(API_ENDPOINTS.citations.byDocument(documentId), data)
	}

	/**
	 * Get a citation by ID
	 */
	async getCitationById(citationId: string): Promise<CitationResponse> {
		return this.deduplicateRequest(`getCitationById:${citationId}`, () =>
			apiClient.get<CitationResponse>(API_ENDPOINTS.citations.byId(citationId))
		)
	}

	/**
	 * Update an existing citation
	 */
	async updateCitation(citationId: string, data: UpdateCitationDto): Promise<CitationResponse> {
		return apiClient.put<CitationResponse>(API_ENDPOINTS.citations.byId(citationId), data)
	}

	/**
	 * Delete a citation
	 */
	async deleteCitation(citationId: string): Promise<void> {
		return apiClient.delete<void>(API_ENDPOINTS.citations.byId(citationId))
	}

	/**
	 * Search local document citations
	 */
	async searchCitations(documentId: string, q: string): Promise<CitationsResponse> {
		const queryStr = new URLSearchParams({ q }).toString()
		return apiClient.get<CitationsResponse>(
			`${API_ENDPOINTS.citations.search(documentId)}?${queryStr}`
		)
	}

	/**
	 * Find a citation by DOI
	 */
	async getCitationByDoi(documentId: string, doi: string): Promise<CitationResponse> {
		const encodedDoi = encodeURIComponent(doi)
		return apiClient.get<CitationResponse>(API_ENDPOINTS.citations.doi(documentId, encodedDoi))
	}

	/**
	 * Search for academic papers on Semantic Scholar
	 */
	async searchSemanticScholar(
		q: string,
		limit: number = 10,
		offset: number = 0
	): Promise<SemanticScholarSearchResponse> {
		const queryParams = new URLSearchParams({
			q,
			limit: limit.toString(),
			offset: offset.toString(),
		}).toString()
		return this.deduplicateRequest(`searchSemanticScholar:${q}:${limit}:${offset}`, () =>
			apiClient.get<SemanticScholarSearchResponse>(
				`${API_ENDPOINTS.citations.semanticScholarSearch}?${queryParams}`
			)
		)
	}

	/**
	 * Get paper details from Semantic Scholar
	 */
	async getSemanticScholarPaperDetails(paperId: string): Promise<SemanticScholarPaperResponse> {
		return this.deduplicateRequest(`getSemanticScholarPaperDetails:${paperId}`, () =>
			apiClient.get<SemanticScholarPaperResponse>(
				API_ENDPOINTS.citations.semanticScholarDetails(paperId)
			)
		)
	}
}

export const citationsService = new CitationsService()
