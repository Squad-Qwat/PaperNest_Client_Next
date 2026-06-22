import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface AuthState {
	accessToken: string | null
	refreshToken: string | null
	isAuthenticated: boolean
	isInitializing: boolean
	_hasHydrated: boolean
	setTokens: (accessToken: string, refreshToken: string) => void
	setAccessToken: (token: string) => void
	clearAuth: () => void
	setInitializing: (state: boolean) => void
	setHasHydrated: (state: boolean) => void
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			accessToken: null,
			refreshToken: null,
			isAuthenticated: false,
			isInitializing: true,
			_hasHydrated: false,
			setTokens: (accessToken, refreshToken) =>
				set({ accessToken, refreshToken, isAuthenticated: true }),
			setAccessToken: (accessToken) => set({ accessToken }),
			clearAuth: () => {
				if (typeof window !== 'undefined') {
					localStorage.removeItem('texlyre-current-user')
					localStorage.removeItem('lastVisitedWorkspaceId')
				}
				set({ accessToken: null, refreshToken: null, isAuthenticated: false })
			},
			setInitializing: (state) => set({ isInitializing: state }),
			setHasHydrated: (state) => set({ _hasHydrated: state }),
		}),
		{
			name: 'papernest-auth',
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({
				accessToken: state.accessToken,
				refreshToken: state.refreshToken,
				isAuthenticated: state.isAuthenticated,
			}),
			onRehydrateStorage: (state) => {
				return () => state?.setHasHydrated(true)
			},
		}
	)
)
