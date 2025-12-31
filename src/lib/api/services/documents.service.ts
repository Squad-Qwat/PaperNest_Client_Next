/**
 * Documents Service
 * Handles all document-related API operations
 */

import { apiClient } from '../clients/api-client'
import { API_ENDPOINTS } from '../config'
import type {
	Document,
	CreateDocumentDto,
	UpdateDocumentDto,
	UpdateDocumentContentDto,
	DocumentSearchParams,
	DocumentsResponse,
} from '../types/document.types'

class DocumentsService {
	/**
	 * Get user's documents across all workspaces
	 */
	async getMyDocuments(): Promise<DocumentsResponse> {
		return apiClient.get<DocumentsResponse>(API_ENDPOINTS.documents.myDocuments)
	}

	/**
	 * Get all documents in a workspace
	 */
	async getWorkspaceDocuments(workspaceId: string): Promise<DocumentsResponse> {
		return apiClient.get<DocumentsResponse>(API_ENDPOINTS.documents.byWorkspace(workspaceId))
	}

	/**
	 * Search documents in a workspace
	 */
	async searchDocuments(
		workspaceId: string,
		params: DocumentSearchParams
	): Promise<DocumentsResponse> {
		const queryString = new URLSearchParams({ q: params.q }).toString()
		return apiClient.get<DocumentsResponse>(
			`${API_ENDPOINTS.documents.search(workspaceId)}?${queryString}`
		)
	}

	/**
	 * Get document by ID
	 */
	async getById(workspaceId: string, documentId: string): Promise<Document> {
		return apiClient.get<Document>(API_ENDPOINTS.documents.byId(workspaceId, documentId))
	}

	/**
	 * Create new document
	 */
	async create(workspaceId: string, data: CreateDocumentDto): Promise<Document> {
		return apiClient.post<Document>(API_ENDPOINTS.documents.byWorkspace(workspaceId), data)
	}

	/**
	 * Update document metadata
	 */
	async update(
		workspaceId: string,
		documentId: string,
		data: UpdateDocumentDto
	): Promise<Document> {
		return apiClient.put<Document>(API_ENDPOINTS.documents.byId(workspaceId, documentId), data)
	}

	/**
	 * Update document content (creates new version)
	 */
	async updateContent(
		workspaceId: string,
		documentId: string,
		data: UpdateDocumentContentDto
	): Promise<Document> {
		return apiClient.put<Document>(API_ENDPOINTS.documents.content(workspaceId, documentId), data)
	}

	/**
	 * Delete document
	 */
	async delete(workspaceId: string, documentId: string): Promise<void> {
		await apiClient.delete<void>(API_ENDPOINTS.documents.byId(workspaceId, documentId))
	}
}

// Export singleton instance
export const documentsService = new DocumentsService()
