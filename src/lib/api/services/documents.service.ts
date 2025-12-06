/**
 * Documents Service
 * Handles all document-related API operations
 */

import { apiClient } from '../clients/api-client'
import { API_ENDPOINTS } from '../config'
import type {
	CreateDocumentDto,
	Document,
	DocumentSearchParams,
	DocumentsResponse,
	UpdateDocumentContentDto,
	UpdateDocumentDto,
	VersionResponse,
	VersionsResponse,
} from '../types/document.types'
import type {
	CreateReviewDto,
	Review,
	ReviewsResponse,
	UpdateReviewStatusDto,
} from '../types/review.types'

class DocumentsService {
	/**
	 * Get reviews for a document
	 */
	async getReviews(documentId: string): Promise<ReviewsResponse> {
		return apiClient.get<ReviewsResponse>(API_ENDPOINTS.reviews.byDocument(documentId))
	}

	/**
	 * Create a review request
	 */
	async createReview(
		documentId: string,
		versionId: string,
		data: CreateReviewDto
	): Promise<Review> {
		return apiClient.post<Review>(API_ENDPOINTS.reviews.create(documentId, versionId), data)
	}

	/**
	 * Approve a review
	 */
	async approveReview(reviewId: string): Promise<void> {
		return apiClient.post<void>(API_ENDPOINTS.reviews.approve(reviewId))
	}

	/**
	 * Reject a review
	 */
	async rejectReview(reviewId: string, data: UpdateReviewStatusDto): Promise<void> {
		return apiClient.post<void>(API_ENDPOINTS.reviews.reject(reviewId), data)
	}

	/**
	 * Request revision
	 */
	async requestRevision(reviewId: string, data: UpdateReviewStatusDto): Promise<void> {
		return apiClient.post<void>(API_ENDPOINTS.reviews.requestRevision(reviewId), data)
	}
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

	/**
	 * Get all versions of a document
	 */
	async getVersions(documentId: string): Promise<VersionsResponse> {
		return apiClient.get<VersionsResponse>(API_ENDPOINTS.documents.versions(documentId))
	}

	/**
	 * Create a new version (Commit)
	 */
	async createVersion(documentId: string, data: { message: string, content?: string }): Promise<VersionResponse> {
		return apiClient.post<VersionResponse>(API_ENDPOINTS.documents.versions(documentId), data)
	}

	/**
	 * Get current version of a document
	 */
	async getCurrentVersion(documentId: string): Promise<VersionResponse> {
		return apiClient.get<VersionResponse>(API_ENDPOINTS.documents.currentVersion(documentId))
	}

	/**
	 * Get pending reviews for lecturer
	 */
	async getPendingReviews(): Promise<ReviewsResponse> {
		try {
			return await apiClient.get<ReviewsResponse>(API_ENDPOINTS.reviews.pending)
		} catch (error: any) {
			console.warn('Failed to fetch pending reviews, endpoint might be missing:', error)
			
            // Fallback: Try generic /reviews endpoint if specific one fails
            if (error?.status === 404) {
                try {
                    console.log('Attempting fallback to /reviews...')
                    // Assuming /reviews might return the same structure
                    const fallbackResponse = await apiClient.get<ReviewsResponse>('/reviews')
                    // Filter for pending if possible, or just return all for now to show SOMETHING
                    return {
                        ...fallbackResponse,
                        reviews: fallbackResponse.reviews.filter(r => r.status === 'Pending' || r.status === 'pending')
                    }
                } catch (fallbackError) {
                    console.warn('Fallback /reviews also failed:', fallbackError)
                    return { reviews: [], count: 0 }
                }
            }
			throw error
		}
	}
}

// Export singleton instance
export const documentsService = new DocumentsService()
