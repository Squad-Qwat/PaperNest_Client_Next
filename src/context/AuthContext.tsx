/**
 * Auth Context Provider
 * Global authentication state management
 */

'use client'

import { usePathname, useRouter } from 'next/navigation'
import type React from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import { apiClient } from '@/lib/api/clients/api-client'
import { authService } from '@/lib/api/services/auth.service'
import type {
	AuthResponse,
	LoginDto,
	LoginEmailDto,
	PasswordResetDto,
	RegisterDto,
} from '@/lib/api/types/auth.types'
import type { User } from '@/lib/api/types/user.types'
import { getErrorMessage } from '@/lib/api/utils/error-handler'

interface AuthContextType {
	user: User | null
	loading: boolean
	error: string | null
	isAuthenticated: boolean

	// Actions
	register: (data: RegisterDto) => Promise<AuthResponse>
	login: (data: LoginDto) => Promise<void>
	loginEmail: (data: LoginEmailDto) => Promise<void>
	logout: () => Promise<void>
	forgotPassword: (data: PasswordResetDto) => Promise<void>
	refreshUser: () => Promise<void>
	clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password']

interface AuthProviderProps {
	children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
	const [user, setUser] = useState<User | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const router = useRouter()
	const pathname = usePathname()

	// Initialize auth on mount
	useEffect(() => {
		const initAuth = async () => {
			try {
				const { accessToken } = authService.initializeAuth()

				if (accessToken) {
					apiClient.setAuthToken(accessToken)
					const currentUser = await authService.getCurrentUser()
					setUser(currentUser)
				}
			} catch (err) {
				console.error('[AuthContext] Failed to initialize auth:', err)
				authService.logout()
			} finally {
				setLoading(false)
			}
		}

		initAuth()
	}, [])

	// Auto-refresh token before expiry (every 50 minutes if token expires in 60 minutes)
	useEffect(() => {
		if (!user) return

		const refreshInterval = setInterval(
			async () => {
				try {
					const refreshToken = authService.getRefreshToken()
					if (refreshToken) {
						await authService.refresh({ refreshToken })
					}
				} catch (err) {
					console.error('Failed to refresh token:', err)
					await logout()
				}
			},
			50 * 60 * 1000
		)

		return () => clearInterval(refreshInterval)
	}, [user])

	// Redirect logic based on auth state
	useEffect(() => {
		if (loading) return

		const isPublicRoute = PUBLIC_ROUTES.includes(pathname)

		// If not authenticated and trying to access protected route
		if (!user && !isPublicRoute) {
			router.push('/login')
		}
	}, [user, loading, pathname, router])

	const register = async (data: RegisterDto) => {
		try {
			setLoading(true)
			setError(null)
			const response = await authService.register(data)

			const accessToken = response.token || response.accessToken
			if (accessToken) {
				apiClient.setAuthToken(accessToken)
			}

			setUser(response.user)
			return response
		} catch (err) {
			const message = getErrorMessage(err)
			setError(message)
			throw err
		} finally {
			setLoading(false)
		}
	}

	const login = async (data: LoginDto) => {
		try {
			setLoading(true)
			setError(null)
			const response = await authService.login(data)

			const accessToken = response.token || response.accessToken
			if (accessToken) {
				apiClient.setAuthToken(accessToken)
			}

			setUser(response.user)
			router.push('/')
		} catch (err) {
			const message = getErrorMessage(err)
			setError(message)
			throw err
		} finally {
			setLoading(false)
		}
	}

	// Login with email/password
	const loginEmail = async (data: LoginEmailDto) => {
		try {
			setLoading(true)
			setError(null)
			const response = await authService.loginEmail(data)

			const accessToken = response.token || response.accessToken
			console.log('[AuthContext] LoginEmail response received:', {
				hasUser: !!response.user,
				hasToken: !!accessToken,
			})

			// Ensure token is set in apiClient
			if (accessToken) {
				apiClient.setAuthToken(accessToken)
				console.log('[AuthContext] Token explicitly set in apiClient after email login')
			}

			setUser(response.user)
			router.push('/') // Redirect to home after login
		} catch (err) {
			const message = getErrorMessage(err)
			setError(message)
			throw err
		} finally {
			setLoading(false)
		}
	}

	// Logout
	const logout = async () => {
		try {
			setLoading(true)
			setError(null)
			await authService.logout()
			setUser(null)
			router.push('/login')
		} catch (err) {
			const message = getErrorMessage(err)
			setError(message)
			throw err
		} finally {
			setLoading(false)
		}
	}

	// Forgot password
	const forgotPassword = async (data: PasswordResetDto) => {
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
	}

	// Refresh user data
	const refreshUser = async () => {
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
	}

	// Clear error
	const clearError = () => {
		setError(null)
	}

	const value: AuthContextType = {
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

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to use auth context
 */
export function useAuthContext(): AuthContextType {
	const context = useContext(AuthContext)

	if (context === undefined) {
		throw new Error('useAuthContext must be used within an AuthProvider')
	}

	return context
}
