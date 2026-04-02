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
	DocumentWithRoomStateResponse,
} from '../types/document.types'
import type {
	CreateReviewDto,
	Review,
	ReviewsResponse,
	UpdateReviewStatusDto,
} from '../types/review.types'
import type {
	BatchOperationRequest,
	BatchOperationResponse,
} from '../types/batchOperation.types'

class DocumentsService {
	// Request deduplication cache: key -> Promise
	private readonly inFlightRequests = new Map<string, Promise<any>>()

	/**
	 * Deduplicate concurrent identical API requests
	 * If request already in-flight, return same promise
	 */
	private async deduplicateRequest<T>(
		key: string,
		fetcher: () => Promise<T>
	): Promise<T> {
		// Check if request already in-flight
		if (this.inFlightRequests.has(key)) {
			console.log(`♻️ [DocumentsService] Reusing in-flight request: ${key}`)
			return this.inFlightRequests.get(key)!
		}

		// Create new request promise
		const promise = fetcher().finally(() => {
			// Clean up cache after request completes
			this.inFlightRequests.delete(key)
		})

		// Store in cache
		this.inFlightRequests.set(key, promise)
		return promise
	}

	/**
	 * Get reviews for a document
	 */
	async getReviews(documentId: string): Promise<ReviewsResponse> {
		return this.deduplicateRequest(`getReviews:${documentId}`, () =>
			apiClient.get<ReviewsResponse>(API_ENDPOINTS.reviews.byDocument(documentId))
		)
	}

	/**
	 * Create a review request
	 */
	async createReview(
		documentId: string,
		documentBodyId: string,
		data: CreateReviewDto
	): Promise<Review> {
		return apiClient.post<Review>(API_ENDPOINTS.reviews.create(documentId, documentBodyId), data)
	}

	/**
	 * Approve a review
	 */
	async approveReview(reviewId: string, data?: UpdateReviewStatusDto): Promise<void> {
		return apiClient.post<void>(API_ENDPOINTS.reviews.approve(reviewId), data)
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
		return this.deduplicateRequest(`getVersions:${documentId}`, () =>
			apiClient.get<VersionsResponse>(API_ENDPOINTS.documents.versions(documentId))
		)
	}

	/**
	 * Create a new version (Commit)
	 */
	async createVersion(
		documentId: string,
		data: { message: string; content?: string }
	): Promise<VersionResponse> {
		return apiClient.post<VersionResponse>(API_ENDPOINTS.documents.versions(documentId), data)
	}

	/**
	 * Get current version of a document
	 */
	async getCurrentVersion(documentId: string): Promise<VersionResponse> {
		return this.deduplicateRequest(`getCurrentVersion:${documentId}`, () =>
			apiClient.get<VersionResponse>(API_ENDPOINTS.documents.currentVersion(documentId))
		)
	}

	/**
	 * Get document with room state information
	 * Returns document details + active user count in Liveblocks room
	 * Used to determine if initial content should be loaded from Firestore
	 * 
	 * @param documentId - Document ID
	 * @returns Document data with room state (activeUsers count)
	 * @throws - If endpoint fails, throws error (page will fallback to Firestore)
	 */
	async getDocumentWithRoomState(documentId: string): Promise<DocumentWithRoomStateResponse> {
		try {
			console.log('🔀 [DocumentService] Checking room state for document:', documentId)
			const response = await apiClient.get<DocumentWithRoomStateResponse>(
				API_ENDPOINTS.documents.withRoomState(documentId)
			)
			console.log('✅ [DocumentService] Room state fetched:', {
				activeUsers: response.room.activeUsers,
				roomId: response.room.id,
			})
			return response
		} catch (error) {
			console.warn(
				'⚠️ [DocumentService] Failed to fetch room state endpoint - page will use Firestore fallback',
				error
			)
			// Re-throw: let page.js handle fallback to Firestore DocumentService
			throw error
		}
	}

	/**
	 * Revert to a specific version
	 */
	async revertVersion(documentId: string, versionNumber: number): Promise<void> {
		return apiClient.post<void>(API_ENDPOINTS.documents.revert(documentId, versionNumber))
	}

	/**
	 * Execute batch operations (atomic save content + update metadata + create version)
	 * Single API call replaces 3 sequential calls (~60% faster)
	 *
	 * @param documentId - Document ID
	 * @param operations - Array of batch operations to execute
	 * @returns Batch operation response with results per operation
	 */
	async batchUpdateDocument(
		documentId: string,
		request: BatchOperationRequest
	): Promise<BatchOperationResponse> {
		console.log('📦 [DocumentsService] Submitting batch operation:', {
			transactionId: request.transactionId,
			operationCount: request.operations.length,
		})

		const response = await apiClient.post<BatchOperationResponse>(
			API_ENDPOINTS.documents.batch(documentId),
			request
		)

		console.log('✅ [DocumentsService] Batch operation response:', {
			transactionId: response.transactionId,
			allSucceeded: response.allSucceeded,
			totalDuration: response.totalDuration,
		})

		return response
	}

	/**
	 * Get pending reviews for lecturer
	 */
	async getPendingReviews(): Promise<ReviewsResponse> {
		return apiClient.get<ReviewsResponse>(API_ENDPOINTS.reviews.lecturer)
	}

	/**
	 * Get reviews for student
	 */
	async getStudentReviews(): Promise<ReviewsResponse> {
		return apiClient.get<ReviewsResponse>(API_ENDPOINTS.reviews.student)
	}

	/**
	 * Get single review by ID
	 */
	async getReview(reviewId: string): Promise<{ review: Review }> {
		// Since we don't have a strict single review endpoint in docs,
		// we try a standard convention or fallback to filtering pending
		// Try /reviews/:id first
		try {
			const data = await apiClient.get<any>(`/reviews/${reviewId}`)
			return { review: data.review || data }
		} catch (e) {
			console.warn('Direct review fetch failed, trying fallback list lookup', e)
			// Fallback: fetch all reviews (or pending) and find
			// This is inefficient but necessary if no endpoint exists
			const all = await this.getPendingReviews() // or generic /reviews
			const found = all.reviews.find((r) => r.reviewId === reviewId)
			if (found) return { review: found }
			throw new Error('Review not found')
		}
	}
}

// Export singleton instance
export const documentsService = new DocumentsService()
