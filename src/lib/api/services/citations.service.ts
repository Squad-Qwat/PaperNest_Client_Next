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
	UpdateCitationDto,
	SemanticScholarPaperResponse,
	SemanticScholarSearchResponse,
} from '../types/citation.types'
import { RequestDeduplicator } from '../utils/deduplicator'

class CitationsService {
	/**
	 * Get all citations for a workspace
	 */
	async getWorkspaceCitations(workspaceId: string): Promise<CitationsResponse> {
		return RequestDeduplicator.deduplicate(`getWorkspaceCitations:${workspaceId}`, () =>
			apiClient.get<CitationsResponse>(API_ENDPOINTS.citations.byWorkspace(workspaceId))
		)
	}

	/**
	 * Get all citations for a document
	 */
	async getDocumentCitations(documentId: string, type?: string): Promise<CitationsResponse> {
		return RequestDeduplicator.deduplicate(`getDocumentCitations:${documentId}:${type || ''}`, () => {
			const baseUrl = API_ENDPOINTS.citations.byDocument(documentId)
			const url = type ? `${baseUrl}?type=${encodeURIComponent(type)}` : baseUrl
			return apiClient.get<CitationsResponse>(url)
		})
	}

	/**
	 * Create a citation in a workspace
	 */
	async createWorkspaceCitation(
		workspaceId: string,
		data: CreateCitationDto
	): Promise<CitationResponse> {
		const normalized = this.normalizePayload(data)
		return apiClient.post<CitationResponse>(API_ENDPOINTS.citations.byWorkspace(workspaceId), normalized)
	}

	/**
	 * Create a citation in a document
	 */
	async createDocumentCitation(
		documentId: string,
		data: CreateCitationDto
	): Promise<CitationResponse> {
		const normalized = this.normalizePayload(data)
		return apiClient.post<CitationResponse>(API_ENDPOINTS.citations.byDocument(documentId), normalized)
	}

	/**
	 * Create a citation (supporting either workspace or document context)
	 */
	async create(
		data: CreateCitationDto & { workspaceId?: string; documentId?: string }
	): Promise<CitationResponse> {
		const normalized = this.normalizePayload(data)
		if (normalized.documentId) {
			return this.createDocumentCitation(normalized.documentId, normalized)
		}
		if (normalized.workspaceId) {
			return this.createWorkspaceCitation(normalized.workspaceId, normalized)
		}
		throw new Error('Either documentId or workspaceId must be provided to create a citation')
	}

	/**
	 * Get a citation by ID
	 */
	async getById(citationId: string, documentId?: string): Promise<CitationResponse> {
		return RequestDeduplicator.deduplicate(`getById:${citationId}:${documentId || ''}`, () =>
			apiClient.get<CitationResponse>(API_ENDPOINTS.citations.byId(citationId, documentId))
		)
	}

	/**
	 * Get a citation by ID (alias)
	 */
	async getCitationById(citationId: string, documentId?: string): Promise<CitationResponse> {
		return this.getById(citationId, documentId)
	}

	/**
	 * Update an existing citation
	 */
	async update(
		citationId: string,
		data: Partial<UpdateCitationDto>,
		documentId?: string
	): Promise<CitationResponse> {
		const normalized = this.normalizePayload(data)
		return apiClient.put<CitationResponse>(
			API_ENDPOINTS.citations.byId(citationId, documentId),
			normalized
		)
	}

	private normalizeUrl(url: string | null | undefined): string | null {
		if (url === null || url === undefined) return null
		const trimmed = url.trim()
		if (!trimmed) return null
		if (/^https?:\/\//i.test(trimmed)) {
			return trimmed
		}
		return `https://${trimmed}`
	}

	private normalizePayload<T extends { url?: string | null }>(data: T): T {
		if ('url' in data) {
			return {
				...data,
				url: this.normalizeUrl(data.url)
			}
		}
		return data
	}

	/**
	 * Delete a citation
	 */
	async delete(citationId: string, documentId?: string): Promise<void> {
		return apiClient.delete(API_ENDPOINTS.citations.byId(citationId, documentId))
	}

	/**
	 * Search citations by title or author
	 */
	async search(documentId: string, query: string): Promise<CitationsResponse> {
		return apiClient.get<CitationsResponse>(
			`${API_ENDPOINTS.citations.search(documentId)}?q=${encodeURIComponent(query)}`
		)
	}

	/**
	 * Find citation by DOI
	 */
	async getByDoi(documentId: string, doi: string): Promise<CitationResponse> {
		return apiClient.get<CitationResponse>(
			API_ENDPOINTS.citations.doi(documentId, encodeURIComponent(doi))
		)
	}

	/**
	 * Search papers on Semantic Scholar
	 */
	async searchSemanticScholar(
		query: string,
		limit: number = 10,
		offset: number = 0
	): Promise<SemanticScholarSearchResponse> {
		return RequestDeduplicator.deduplicate(`searchSemanticScholar:${query}:${limit}:${offset}`, () =>
			apiClient.get<SemanticScholarSearchResponse>(
				`${API_ENDPOINTS.citations.semanticScholarSearch}?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`
			)
		)
	}

	/**
	 * Get paper details from Semantic Scholar
	 */
	async getSemanticScholarPaper(paperId: string): Promise<SemanticScholarPaperResponse> {
		return RequestDeduplicator.deduplicate(`getSemanticScholarPaper:${paperId}`, () =>
			apiClient.get<SemanticScholarPaperResponse>(
				API_ENDPOINTS.citations.semanticScholarDetails(paperId)
			)
		)
	}
}

export const citationsService = new CitationsService()
