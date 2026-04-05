/**
 * Auth Context Provider
 * Global authentication state management
 */

'use client'

import { usePathname, useRouter } from 'next/navigation'
import type React from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
import { auth } from '@/lib/firebase/config'
import {
	GoogleAuthProvider,
	GithubAuthProvider,
	signInWithPopup,
	signInWithEmailAndPassword,
	signOut,
} from 'firebase/auth'
import { getErrorMessage } from '@/lib/api/utils/error-handler'

interface AuthContextType {
	user: User | null
	loading: boolean
	error: string | null
	isAuthenticated: boolean

	onboardingData: any | null
	setOnboardingData: (data: any) => void
	logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/auth/onboarding']

interface AuthProviderProps {
	children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
	const queryClient = useQueryClient()
	const [onboardingData, setOnboardingData] = useState<any | null>(null)
	
	const { data: user = null, isLoading: isQueryLoading, refetch: refetchUser } = useQuery({
		queryKey: ['currentUser'],
		queryFn: async () => {
			try {
				const { accessToken } = authService.initializeAuth()
				if (accessToken) {
					apiClient.setAuthToken(accessToken)
					const currentUser = await authService.getCurrentUser()
					return currentUser || null
				}
				return null
			} catch (err) {
				console.error('[AuthContext] Failed to initialize auth:', err)
				authService.logout()
				return null
			}
		},
		staleTime: 5 * 60 * 1000,
		retry: false,
	})

	const router = useRouter()
	const pathname = usePathname()

	// Compute final loading state
	const isAppLoading = isQueryLoading

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
					await authService.logout()
					queryClient.setQueryData(['currentUser'], null)
					router.push('/login')
				}
			},
			50 * 60 * 1000
		)

		return () => clearInterval(refreshInterval)
	}, [user])
	
	const logout = async () => {
		try {
			// Sign out from Firebase
			const { signOut } = await import('firebase/auth')
			await signOut(auth)

			await authService.logout()
			queryClient.setQueryData(['currentUser'], null)
			queryClient.clear()
			router.push('/login')
		} catch (err) {
			console.error('[AuthContext] Failed to logout:', err)
			// Still clear local state as a safety measure
			queryClient.setQueryData(['currentUser'], null)
			router.push('/login')
		}
	}

	// Redirect logic based on auth state
	useEffect(() => {
		if (isAppLoading) return

		const isPublicRoute = PUBLIC_ROUTES.includes(pathname)

		// If not authenticated and trying to access protected route
		if (!user && !isPublicRoute) {
			router.push('/login')
		}

		// If authenticated and trying to access login/register
		if (user && (pathname === '/login' || pathname === '/register')) {
			router.push('/')
		}
	}, [user, isAppLoading, pathname, router])

	const value: AuthContextType = {
		user,
		loading: isAppLoading,
		error: null,
		isAuthenticated: !!user,
		onboardingData,
		setOnboardingData,
		logout,
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to use auth context
 */
export function useAuth(): AuthContextType {
	const context = useContext(AuthContext)

	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider')
	}

	return context
}
