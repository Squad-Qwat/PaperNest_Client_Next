'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usePathname, useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AUTH_KEYS } from '@/lib/api/hooks/use-auth'
import { authService } from '@/lib/api/services/auth.service'
import type { User } from '@/lib/api/types/user.types'
import { auth } from '@/lib/firebase/config'
import { useAuthStore } from '@/lib/store/auth-store'

export interface AuthContextType {
  	currentUser: User | null
	user: User[] | null
	loading: boolean
	isAuthenticated: boolean
	onboardingData: any | null
	setOnboardingData: (data: any) => void
	logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const PUBLIC_ROUTES = [
	'/login',
	'/register',
	'/forgot-password',
	'/auth/onboarding',
	'/auth/verify-email',
]

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const queryClient = useQueryClient()
	const [onboardingData, setOnboardingData] = useState<any | null>(null)
	const { isAuthenticated, clearAuth, _hasHydrated } = useAuthStore()
	const router = useRouter()
	const pathname = usePathname()

	const { data: user = null, isLoading } = useQuery({
		queryKey: AUTH_KEYS.user,
		queryFn: async () => {
			if (!isAuthenticated) return null
			try {
				authService.initializeAuth()
				return await authService.getCurrentUser()
			} catch {
				clearAuth()
				return null
			}
		},
		enabled: _hasHydrated && isAuthenticated,
		staleTime: 5 * 60 * 1000,
		retry: false,
	})

	const logout = async () => {
		try {
			const { signOut } = await import('firebase/auth')
			await signOut(auth)
			await authService.logout()
			queryClient.clear()
			toast.success('Anda telah keluar.')
			router.push('/login')
		} catch {
			clearAuth()
			router.push('/login')
		}
	}

	useEffect(() => {
		if (!_hasHydrated || isLoading) return

		const isPublicRoute = PUBLIC_ROUTES.includes(pathname)

		if (!isAuthenticated && !isPublicRoute) {
			router.push('/login')
		}

		if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
			router.push('/')
		}
	}, [_hasHydrated, isAuthenticated, isLoading, pathname, router])

	const isInitialLoading = !_hasHydrated || (isAuthenticated && isLoading)

	return (
		<AuthContext.Provider
			value={{
				user,
				loading: isInitialLoading,
				isAuthenticated,
				onboardingData,
				setOnboardingData,
				logout,
			}}
		>
			{children}
		</AuthContext.Provider>
	)
}

export function useAuth() {
	const context = useContext(AuthContext)
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}
