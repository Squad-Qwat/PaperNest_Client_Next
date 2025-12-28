/**
 * useDocumentReviews Hook (Updated)
 * Handle document reviews for BOTH Student (Request) and Lecturer (Approve/Reject)
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuthContext } from '@/context/AuthContext'
import { documentsService } from '@/lib/api/services/documents.service'
import type { Review } from '@/lib/api/types/review.types'

interface UseDocumentReviewsReturn {
	reviews: Review[]
	loading: boolean
	error: string | null
	refetch: () => Promise<void>

	// Aksi Mahasiswa
	requestReview: (documentBodyId: string, lecturerId: string, message?: string) => Promise<void>

	// Aksi Dosen (Lecturer)
	approveReview: (reviewId: string) => Promise<void>
	rejectReview: (reviewId: string, feedback: string) => Promise<void>
	requestRevision: (reviewId: string, feedback: string) => Promise<void>
}

export function useDocumentReviews(documentId: string): UseDocumentReviewsReturn {
	const { user } = useAuthContext()
	const [reviews, setReviews] = useState<Review[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchReviews = useCallback(async () => {
		if (!documentId || !user) return

		try {
			setLoading(true)
			const response = await documentsService.getReviews(documentId)
			setReviews(response.reviews)
		} catch (err) {
			console.error('[useDocumentReviews] Error fetching reviews:', err)
			setError(err instanceof Error ? err.message : 'Failed to fetch reviews')
		} finally {
			setLoading(false)
		}
	}, [documentId, user])

	useEffect(() => {
		fetchReviews()
	}, [fetchReviews])

	// --- STUDENT ACTIONS ---

	const requestReview = async (documentBodyId: string, lecturerId: string, message?: string) => {
		try {
			setLoading(true)
			await documentsService.createReview(documentId, documentBodyId, { lecturerId, message })
			await fetchReviews() // Refresh list
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to request review'
			setError(msg)
			throw new Error(msg)
		} finally {
			setLoading(false)
		}
	}

	// --- LECTURER ACTIONS ---

	const approveReview = async (reviewId: string) => {
		try {
			setLoading(true)
			// Endpoint: POST /api/reviews/:id/approve
			await documentsService.approveReview(reviewId)
			await fetchReviews()
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to approve review'
			setError(msg)
			throw new Error(msg)
		} finally {
			setLoading(false)
		}
	}

	const rejectReview = async (reviewId: string, feedback: string) => {
		try {
			setLoading(true)
			// Endpoint: POST /api/reviews/:id/reject
			await documentsService.rejectReview(reviewId, { message: feedback })
			await fetchReviews()
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to reject review'
			setError(msg)
			throw new Error(msg)
		} finally {
			setLoading(false)
		}
	}

	const requestRevision = async (reviewId: string, feedback: string) => {
		try {
			setLoading(true)
			// Endpoint: POST /api/reviews/:id/request-revision
			await documentsService.requestRevision(reviewId, { message: feedback })
			await fetchReviews()
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to request revision'
			setError(msg)
			throw new Error(msg)
		} finally {
			setLoading(false)
		}
	}

	return {
		reviews,
		loading,
		error,
		refetch: fetchReviews,
		requestReview,
		approveReview,
		rejectReview,
		requestRevision,
	}
}
