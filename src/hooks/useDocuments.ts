/**
 * useDocuments Hook
 * Fetch workspace documents from API
 */

'use client'

import { useState, useEffect } from 'react'
import { documentsService } from '@/lib/api/services/documents.service'
import { useAuthContext } from '@/context/AuthContext'
import type { Document } from '@/lib/api/types/document.types'

interface UseDocumentsReturn {
	documents: Document[]
	loading: boolean
	error: string | null
	refetch: () => Promise<void>
}

/**
 * Fetch documents for a specific workspace
 * @param workspaceId - Workspace ID to fetch documents from
 */
export function useDocuments(workspaceId: string | null): UseDocumentsReturn {
	const { user, loading: authLoading } = useAuthContext()
	const [documents, setDocuments] = useState<Document[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchDocuments = async () => {
		if (!workspaceId) {
			setDocuments([])
			setLoading(false)
			return
		}

		if (!user) {
			setDocuments([])
			setLoading(false)
			return
		}

		try {
			setLoading(true)
			setError(null)

			const response = await documentsService.getWorkspaceDocuments(workspaceId)
			setDocuments(response.documents)
		} catch (err) {
			console.error('[useDocuments] Error fetching documents:', err)
			setError(err instanceof Error ? err.message : 'Failed to fetch documents')
			setDocuments([])
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (authLoading) {
			return
		}

		fetchDocuments()
	}, [workspaceId, user, authLoading])

	return {
		documents,
		loading: authLoading || loading,
		error,
		refetch: fetchDocuments,
	}
}
