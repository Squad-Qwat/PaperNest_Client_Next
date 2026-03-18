/**
 * useDocumentVersions & useDocumentReviews Hooks
 * Handle document versions and reviews logic
 */

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

	// Track in-flight request to prevent duplicate concurrent calls
	const inFlightRef = useRef<boolean>(false)

	const fetchVersions = useCallback(async () => {
		if (!documentId) {
			setLoading(false)
			return
		}

		// Skip if already fetching (prevent duplicate concurrent requests)
		if (inFlightRef.current) {
			console.log('[useDocumentVersions] 🚫 Request already in-flight, skipping duplicate')
			return
		}

		inFlightRef.current = true

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
			inFlightRef.current = false
		}
	}, [documentId])

	const rollbackVersion = useCallback(
		async (versionNumber: number) => {
			if (!documentId) return

			try {
				setLoading(true)
				await documentsService.revertVersion(documentId, versionNumber)
				inFlightRef.current = false // Reset flag before refetch
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

	// Fix: Depend on documentId, not fetchVersions callback (callback recreated on each render)
	useEffect(() => {
		fetchVersions()
	}, [documentId])

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
	commitBlockReason: string | null
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
	// Keep versions hook but it won't fetch extra due to our effect dependency fix
	const { versions } = useDocumentVersions(documentId)
	const [reviews, setReviews] = useState<Review[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Track in-flight request to prevent duplicate concurrent calls
	const inFlightRef = useRef<boolean>(false)

	const fetchReviews = useCallback(async () => {
		if (!documentId || !user) return

		// Skip if already fetching
		if (inFlightRef.current) {
			console.log('[useDocumentReviews] 🚫 Request already in-flight, skipping duplicate')
			return
		}

		inFlightRef.current = true

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
			inFlightRef.current = false
		}
	}, [documentId, user])

	// Fix: Depend on documentId + user, not fetchReviews callback
	useEffect(() => {
		fetchReviews()
	}, [documentId, user])

	// Computed Properties
	const latestReview = useMemo(() => {
		if (reviews.length === 0) return null
		// Sort by requestedAt desc
		return [...reviews].sort(
			(a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
		)[0]
	}, [reviews])

	const latestReviewStatus = latestReview ? latestReview.status : null

	// Determine if Student can commit (Strict Logic)
	const { allowed: canCommit, reason: commitBlockReason } = useMemo(() => {
		if (!user) return { allowed: false, reason: 'Not authenticated' }
		if (user.role?.toLowerCase() !== 'student') return { allowed: true, reason: null }

		// Need versions loaded to check latest
		if (versions.length === 0) return { allowed: true, reason: null } // First commit always allowed if no versions (though usually 1 exists)

		// Find latest version
		const sortedVersions = [...versions].sort(
			(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		)
		const latestVersion = sortedVersions[0]

		// "version paling pertama tidak perlu minta review"
		// Allow creating V2 even if V1 is not reviewed.
		if (latestVersion.versionNumber === 1) {
			return { allowed: true, reason: null }
		}

		// Find review for latest version
		const reviewForLatest = reviews.find((r) => r.documentBodyId === latestVersion.documentBodyId)

		if (!reviewForLatest) {
			// "If commit/versions are not reviewed ... user can't make another"
			// Strict: Must have a review record (even if rejected/approved)
			// But wait, if I JUST created it, I need to REQUEST it.
			// If I haven't requested it, implies I am working on it?
			// "if needs review > assign commit".
			// Let's assume: Block if NO review exists (means needs to request) OR if review is PENDING.
			return { allowed: false, reason: 'Waiting for review request or action' }
		}

		if (reviewForLatest.status === 'pending') {
			return { allowed: false, reason: 'Waiting for pending review' }
		}

		// If Approved, Rejected, Revision Required -> Allowed to proceed (create new version to fix/continue)
		return { allowed: true, reason: null }
	}, [user, versions, reviews])

	// --- Actions ---
	const requestReview = async (documentBodyId: string, lecturerId: string, message?: string) => {
		try {
			setLoading(true)
			await documentsService.createReview(documentId, documentBodyId, {
				lecturerUserId: lecturerId,
				message,
			})
			inFlightRef.current = false // Reset flag before refetch
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
			inFlightRef.current = false // Reset flag before refetch
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
			inFlightRef.current = false // Reset flag before refetch
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
			inFlightRef.current = false // Reset flag before refetch
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
		commitBlockReason,
		latestReviewStatus,
		requestReview,
		approveReview,
		rejectReview,
		requestRevision,
	}
}
