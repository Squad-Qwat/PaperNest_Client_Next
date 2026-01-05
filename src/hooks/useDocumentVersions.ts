/**
 * useDocumentVersions & useDocumentReviews Hooks
 * Handle document versions and reviews logic
 */

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuthContext } from '@/context/AuthContext'
import { documentsService } from '@/lib/api/services/documents.service'
import type { Version } from '@/lib/api/types/document.types'
import type { Review, ReviewStatus } from '@/lib/api/types/review.types'

// --- Document Versions Hook ---

interface UseDocumentVersionsReturn {
	versions: Version[]
	loading: boolean
	error: string | null
	refetch: () => Promise<void>
	currentVersion: Version | null
	rollbackVersion: (versionNumber: number) => Promise<void>
}

export function useDocumentVersions(documentId: string): UseDocumentVersionsReturn {
	const [versions, setVersions] = useState<Version[]>([])
	const [currentVersion, setCurrentVersion] = useState<Version | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchVersions = useCallback(async () => {
		if (!documentId) {
			setLoading(false)
			return
		}

		try {
			setLoading(true)
			const response = await documentsService.getVersions(documentId)
			
            // Robust handling for versions response
            let versionsData: Version[] = []
            if (response && Array.isArray(response.versions)) {
                versionsData = response.versions
            } else if (Array.isArray(response)) {
                versionsData = response as Version[]
            } else {
                console.warn('[useDocumentVersions] Unexpected versions response format:', response)
            }

			setVersions(versionsData)

			const currentRes = await documentsService.getCurrentVersion(documentId)
			setCurrentVersion(currentRes?.version || null)
		} catch (err: any) {
			console.error('[useDocumentVersions] Error fetching versions:', err)
			if (err?.status === 404) {
				// Initialize with empty if not found/no versions yet
				setVersions([])
				setCurrentVersion(null)
			} else {
				setError(err instanceof Error ? err.message : 'Failed to fetch versions')
			}
		} finally {
			setLoading(false)
		}
	}, [documentId])

	const rollbackVersion = useCallback(
		async (versionNumber: number) => {
			if (!documentId) return

			try {
				setLoading(true)
				await documentsService.revertVersion(documentId, versionNumber)
				await fetchVersions() // Refresh list and current version
			} catch (err: any) {
				console.error('[useDocumentVersions] Error reverting version:', err)
				setError(err instanceof Error ? err.message : 'Failed to revert version')
				throw err
			} finally {
				setLoading(false)
			}
		},
		[documentId, fetchVersions]
	)

	useEffect(() => {
		fetchVersions()
	}, [fetchVersions])

	return {
		versions,
		loading,
		error,
		refetch: fetchVersions,
		currentVersion,
		rollbackVersion,
	}
}

// --- Document Reviews Hook ---

interface UseDocumentReviewsReturn {
	reviews: Review[]
	loading: boolean
	error: string | null
	refetch: () => Promise<void>
	canCommit: boolean
	latestReviewStatus: ReviewStatus | null

	// Student Actions
	requestReview: (documentBodyId: string, lecturerId: string, message?: string) => Promise<void>

	// Lecturer Actions
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
		} catch (err: any) {
			console.error('[useDocumentReviews] Error fetching reviews:', err)
			if (err?.status === 404) {
				setReviews([]) // No reviews yet
			} else {
				setError(err instanceof Error ? err.message : 'Failed to fetch reviews')
			}
		} finally {
			setLoading(false)
		}
	}, [documentId, user])

	useEffect(() => {
		fetchReviews()
	}, [fetchReviews])

	// Computed Properties
	const latestReview = useMemo(() => {
		if (reviews.length === 0) return null
		// Sort by requestedAt desc
		return [...reviews].sort(
			(a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
		)[0]
	}, [reviews])

	const latestReviewStatus = latestReview ? latestReview.status : null

	const canCommit = useMemo(() => {
		if (!user) return false
		if (user.role !== 'Student') return true // Lecturer/Admin can always commit if needed (or restricted by other means)

		// Student restriction: NO pending reviews allowed
		if (latestReviewStatus === 'pending') return false

		return true
	}, [user, latestReviewStatus])

	// --- Actions ---

	const requestReview = async (documentBodyId: string, lecturerId: string, message?: string) => {
		try {
			setLoading(true)
			await documentsService.createReview(documentId, documentBodyId, { lecturerId, message })
			await fetchReviews()
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to request review'
			setError(msg)
			throw new Error(msg)
		} finally {
			setLoading(false)
		}
	}

	const approveReview = async (reviewId: string) => {
		try {
			setLoading(true)
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
		canCommit,
		latestReviewStatus,
		requestReview,
		approveReview,
		rejectReview,
		requestRevision,
	}
}
