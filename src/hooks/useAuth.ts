/**
 * useAuth Hook
 * Custom hook for authentication operations
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { authService } from '@/lib/api/services/auth.service'
import type {
	RegisterDto,
	LoginDto,
	LoginEmailDto,
	PasswordResetDto,
} from '@/lib/api/types/auth.types'
import type { User } from '@/lib/api/types/user.types'
import { getErrorMessage } from '@/lib/api/utils/error-handler'

interface UseAuthReturn {
	user: User | null
	loading: boolean
	error: string | null
	isAuthenticated: boolean

	// Actions
	register: (data: RegisterDto) => Promise<void>
	login: (data: LoginDto) => Promise<void>
	loginEmail: (data: LoginEmailDto) => Promise<void>
	logout: () => Promise<void>
	forgotPassword: (data: PasswordResetDto) => Promise<void>
	refreshUser: () => Promise<void>
	clearError: () => void
}

export function useAuth(): UseAuthReturn {
	const [user, setUser] = useState<User | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Initialize auth on mount
	useEffect(() => {
		const initAuth = async () => {
			try {
				const { accessToken } = authService.initializeAuth()

				if (accessToken) {
					// Fetch current user
					const currentUser = await authService.getCurrentUser()
					setUser(currentUser)
				}
			} catch (err) {
				console.error('Failed to initialize auth:', err)
				// Clear invalid tokens
				authService.logout()
			} finally {
				setLoading(false)
			}
		}

		initAuth()
	}, [])

	// Register
	const register = useCallback(async (data: RegisterDto) => {
		try {
			setLoading(true)
			setError(null)
			const response = await authService.register(data)
			setUser(response.user)
		} catch (err) {
			const message = getErrorMessage(err)
			setError(message)
			throw err
		} finally {
			setLoading(false)
		}
	}, [])

	// Login with Firebase
	const login = useCallback(async (data: LoginDto) => {
		try {
			setLoading(true)
			setError(null)
			const response = await authService.login(data)
			setUser(response.user)
		} catch (err) {
			const message = getErrorMessage(err)
			setError(message)
			throw err
		} finally {
			setLoading(false)
		}
	}, [])

	// Login with email/password
	const loginEmail = useCallback(async (data: LoginEmailDto) => {
		try {
			setLoading(true)
			setError(null)
			const response = await authService.loginEmail(data)
			setUser(response.user)
		} catch (err) {
			const message = getErrorMessage(err)
			setError(message)
			throw err
		} finally {
			setLoading(false)
		}
	}, [])

	// Logout
	const logout = useCallback(async () => {
		try {
			setLoading(true)
			setError(null)
			await authService.logout()
			setUser(null)
		} catch (err) {
			const message = getErrorMessage(err)
			setError(message)
			throw err
		} finally {
			setLoading(false)
		}
	}, [])

	// Forgot password
	const forgotPassword = useCallback(async (data: PasswordResetDto) => {
		try {
			setLoading(true)
			setError(null)
			await authService.forgotPassword(data)
		} catch (err) {
			const message = getErrorMessage(err)
			setError(message)
			throw err
		} finally {
			setLoading(false)
		}
	}, [])

	// Refresh user data
	const refreshUser = useCallback(async () => {
		try {
			setLoading(true)
			setError(null)
			const currentUser = await authService.getCurrentUser()
			setUser(currentUser)
		} catch (err) {
			const message = getErrorMessage(err)
			setError(message)
			throw err
		} finally {
			setLoading(false)
		}
	}, [])

	// Clear error
	const clearError = useCallback(() => {
		setError(null)
	}, [])

	return {
		user,
		loading,
		error,
		isAuthenticated: !!user,
		register,
		login,
		loginEmail,
		logout,
		forgotPassword,
		refreshUser,
		clearError,
	}
}
