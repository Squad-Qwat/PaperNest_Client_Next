/**
 * Review Types
 * Types for review-related API operations
 */

// Import jika perlu, misal: import type { User } from './user.types'

/**
 * Review Status Type
 */
export type ReviewStatus = 'pending' | 'approved' | 'revision_required' | 'rejected'

/**
 * Review Interface
 * (Matches Backend Schema)
 */
export interface Review {
	reviewId: string
	documentBodyId: string // Connected Version ID
	documentId: string
	lecturerUserId: string
	studentUserId: string
	message: string
	status: ReviewStatus
	requestedAt: string // ISO Date String
	reviewedAt: string | null // ISO Date String
	createdAt: string
	updatedAt: string
}

/**
 * Create Review Request DTO
 * Payload for POST /api/documents/:docId/versions/:verId/reviews
 */
export interface CreateReviewDto {
	lecturerUserId: string
	message?: string
}

/**
 * Update Review Status DTO
 * Payload for POST approve/reject/request-revision
 */
export interface UpdateReviewStatusDto {
	message?: string // Optional feedback message
}

/**
 * Reviews Response
 * Standard response for list endpoints
 */
export interface ReviewsResponse {
	reviews: Review[]
	count: number
}

/**
 * Single Review Response
 */
export interface ReviewResponse {
	review: Review
}
