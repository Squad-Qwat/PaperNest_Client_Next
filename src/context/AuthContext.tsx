'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { createContext, Suspense, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { InviteConfirmationModal } from '@/components/workspace/InviteConfirmationModal'
import { AUTH_KEYS } from '@/lib/api/hooks/use-auth'
import { authService } from '@/lib/api/services/auth.service'
import type { User } from '@/lib/api/types/user.types'
import { auth } from '@/lib/firebase/config'
import { useAuthStore } from '@/lib/store/auth-store'

interface AuthContextType {
	user: User | null
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
	'/reset-password',
	'/auth/onboarding',
	'/auth/verify-email',
]

// Strip locale prefix dari pathname sebelum cek route
function stripLocale(path: string): string {
	// Match /en/... atau /id/...
	const match = path.match(/^\/[a-z]{2}(\/.*|$)/)
	return match ? match[1] || '/' : path
}

function AuthProviderInner({ children }: { children: React.ReactNode }) {
	const queryClient = useQueryClient()
	const [onboardingData, setOnboardingData] = useState<any | null>(null)
	const { isAuthenticated, clearAuth, _hasHydrated, isInitializing, setInitializing } =
		useAuthStore()
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const callbackUrl = searchParams.get('callbackUrl')

	useEffect(() => {
		const unsubscribe = auth.onAuthStateChanged(() => {
			setInitializing(false)
		})
		return () => unsubscribe()
	}, [setInitializing])

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
		enabled: _hasHydrated && isAuthenticated && !isInitializing,
		staleTime: 5 * 60 * 1000,
		retry: false,
	})

	const logout = async () => {
		try {
			const { signOut } = await import('firebase/auth')
			await signOut(auth)
			await authService.logout()
			queryClient.clear()
			toast.success('You have been logged out.')
			router.push('/login')
		} catch {
			clearAuth()
			router.push('/login')
		}
	}

	useEffect(() => {
		if (!_hasHydrated || isLoading || isInitializing) return

		const strippedPathname = stripLocale(pathname)

		const isPublicRoute =
			PUBLIC_ROUTES.includes(strippedPathname) ||
			strippedPathname.startsWith('/invitations/accept/')
		const firebaseUser = auth.currentUser

		if (strippedPathname === '/auth/verify-email') {
			if (isAuthenticated || firebaseUser?.emailVerified) {
				router.push('/')
				return
			}
			if (!firebaseUser) {
				router.push('/login')
				return
			}
		}

		if (!isAuthenticated && !isPublicRoute) {
			router.push('/login')
		}

		if (isAuthenticated && (strippedPathname === '/login' || strippedPathname === '/register')) {
			router.push(callbackUrl || '/')
		}
	}, [_hasHydrated, isAuthenticated, isLoading, isInitializing, pathname, router, callbackUrl])

	useEffect(() => {
		// Clean up Radix UI scroll locks and pointer events on route transitions.
		// We use a small timeout to ensure it runs after the old components have finished unmounting.
		const timer = setTimeout(() => {
			document.body.style.pointerEvents = ''
			document.body.style.overflow = ''
			document.body.style.paddingRight = ''
			document.body.style.marginRight = ''

			document.documentElement.style.pointerEvents = ''
			document.documentElement.style.overflow = ''

			document.body.removeAttribute('data-radix-pointer-events-non-interactive')
			document.documentElement.removeAttribute('data-radix-pointer-events-non-interactive')
		}, 100)

		return () => clearTimeout(timer)
	}, [])

	const isInitialLoading = !_hasHydrated || isInitializing || (isAuthenticated && isLoading)

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
			<InviteConfirmationModal />
		</AuthContext.Provider>
	)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	return (
		<Suspense fallback={null}>
			<AuthProviderInner>{children}</AuthProviderInner>
		</Suspense>
	)
}

export function useAuth() {
	const context = useContext(AuthContext)
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}
