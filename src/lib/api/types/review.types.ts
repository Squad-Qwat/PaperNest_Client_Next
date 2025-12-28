export type ReviewStatus = 'pending' | 'approved' | 'revision_required' | 'rejected'

export interface Review {
	reviewId: string
	documentBodyId: string
	documentId: string
	versionNumber?: number
	lecturerUserId: string
	studentUserId: string
	student?: {
		name: string
		photoURL: string | null
	}
	lecturer?: {
		name: string
		photoURL: string | null
	}
	message: string
	lecturerMessage?: string
	status: ReviewStatus
	requestedAt: string
	reviewedAt: string | null
	createdAt: string
	updatedAt: string
}

export interface CreateReviewDto {
	lecturerUserId: string
	message?: string
}

export interface UpdateReviewStatusDto {
	status?: string
	message?: string
}

export interface ReviewsResponse {
	reviews: Review[]
	count: number
}

export interface ReviewResponse {
	review: Review
}
