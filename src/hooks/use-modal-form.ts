'use client'

import { useState } from 'react'

/**
 * Shared state dan handler untuk form modal yang memiliki
 * loading state, error state, dan guard handleClose.
 */
export function useModalForm(onClose: () => void) {
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleClose = () => {
		if (!loading) {
			setError(null)
			onClose()
		}
	}

	const clearError = () => setError(null)

	return { loading, setLoading, error, setError, clearError, handleClose }
}
