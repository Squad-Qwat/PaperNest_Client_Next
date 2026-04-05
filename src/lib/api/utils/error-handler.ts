/**
 * Centralized error handling utilities
 */

import { ApiError } from '../clients/http-client'

export interface ErrorResponse {
	message: string
	status: number
	errors?: Record<string, string[]>
}

/**
 * Parse error object into user-friendly message
 */
export function parseError(error: unknown): ErrorResponse {
	if (error instanceof ApiError) {
		return {
			message: error.message,
			status: error.status,
			errors: error.errors,
		}
	}

	if (error instanceof Error) {
		return {
			message: error.message,
			status: 500,
		}
	}

	return {
		message: 'An unexpected error occurred',
		status: 500,
	}
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
	// Handle Firebase/Auth specific error codes
	const errorCode = (error as any)?.code
	if (errorCode) {
		switch (errorCode) {
			case 'auth/popup-closed-by-user':
				return 'Proses login dibatalkan karena jendela ditutup. Silakan coba lagi.'
			case 'auth/network-request-failed':
				return 'Gagal menghubungi server. Periksa koneksi internet Anda.'
			case 'auth/user-disabled':
				return 'Akun Anda telah dinonaktifkan. Silakan hubungi dukungan.'
			case 'auth/invalid-credential':
				return 'Email atau kata sandi salah. Silakan periksa kembali.'
			case 'auth/too-many-requests':
				return 'Terlalu banyak percobaan login. Silakan coba lagi nanti.'
			case 'auth/operation-not-allowed':
				return 'Metode login ini belum diaktifkan. Silakan hubungi admin.'
		}
	}

	const parsed = parseError(error)

	// If there are validation errors, return the first one
	if (parsed.errors) {
		// Handle array of objects (our backend format)
		if (Array.isArray(parsed.errors)) {
			const firstError = parsed.errors[0]
			if (firstError && firstError.message) {
				return firstError.field ? `${firstError.field}: ${firstError.message}` : firstError.message
			}
		}

		// Handle record of string arrays (standard format)
		const errorValues = Object.values(parsed.errors)
		if (errorValues.length > 0) {
			const firstErrorList = errorValues[0]
			if (Array.isArray(firstErrorList) && firstErrorList.length > 0) {
				return firstErrorList[0]
			}
		}
	}

	return parsed.message
}

/**
 * Check if error is a specific status code
 */
export function isErrorStatus(error: unknown, status: number): boolean {
	const parsed = parseError(error)
	return parsed.status === status
}

/**
 * Check if error is authentication related
 */
export function isAuthError(error: unknown): boolean {
	return isErrorStatus(error, 401) || isErrorStatus(error, 403)
}

/**
 * Check if error is validation error
 */
export function isValidationError(error: unknown): boolean {
	return isErrorStatus(error, 422) || isErrorStatus(error, 400)
}
