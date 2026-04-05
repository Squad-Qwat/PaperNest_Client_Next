import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { authService } from '../services/auth.service'
import { apiClient } from '../clients/api-client'
import { getErrorMessage } from '../utils/error-handler'
import type { LoginDto, RegisterDto, LoginEmailDto, PasswordResetDto } from '../types/auth.types'
import { auth } from '../../firebase/config'
import {
	GoogleAuthProvider,
	GithubAuthProvider,
	signInWithPopup,
	signInWithEmailAndPassword,
} from 'firebase/auth'

export const AUTH_KEYS = {
	user: ['currentUser'] as const,
}

// Ensure token is set on API client and react-query is updated
const handleAuthSuccess = (queryClient: any, response: any) => {
	const accessToken = response.token || response.accessToken
	if (accessToken) {
		apiClient.setAuthToken(accessToken)
	}
	if (response.user) {
		queryClient.setQueryData(AUTH_KEYS.user, response.user)
	}
}

export function useCurrentUser() {
	return useQuery({
		queryKey: AUTH_KEYS.user,
		queryFn: () => authService.getCurrentUser(),
		retry: false,
		staleTime: 5 * 60 * 1000,
	})
}

export function useLogin() {
	const queryClient = useQueryClient()
	const router = useRouter()

	return useMutation({
		mutationFn: (data: LoginDto) => authService.login(data),
		onSuccess: (response) => {
			handleAuthSuccess(queryClient, response)
			router.push('/')
		},
	})
}

export function useRegister() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (data: RegisterDto) => authService.register(data),
		onSuccess: (response) => {
			handleAuthSuccess(queryClient, response)
		},
	})
}

export function useLoginEmail() {
	const queryClient = useQueryClient()
	const router = useRouter()

	return useMutation({
		mutationFn: async (data: LoginEmailDto) => {
			const result = await signInWithEmailAndPassword(auth, data.email, data.password)
			const idToken = await result.user.getIdToken()
			return authService.login({ firebaseToken: idToken })
		},
		onSuccess: (response) => {
			handleAuthSuccess(queryClient, response)
			router.push('/')
		},
	})
}

export function useSignInWithSocial({ setOnboardingData }: { setOnboardingData?: (data: any) => void } = {}) {
	const queryClient = useQueryClient()
	const router = useRouter()

	return useMutation({
		mutationFn: async (providerName: 'google' | 'github') => {
			const provider = providerName === 'google' ? new GoogleAuthProvider() : new GithubAuthProvider()

			if (provider instanceof GoogleAuthProvider) {
				provider.setCustomParameters({
					prompt: 'select_account'
				});
			}

			const result = await signInWithPopup(auth, provider)
			const idToken = await result.user.getIdToken()
			const response = await authService.loginSocial({ firebaseToken: idToken })
			return { response, idToken }
		},
		onSuccess: ({ response, idToken }) => {
			if (response.isNewUser) {
				if (setOnboardingData) {
					setOnboardingData({
						token: idToken,
						firebaseData: response.firebaseData,
					})
				}
				router.push('/auth/onboarding')
				return
			}

			handleAuthSuccess(queryClient, response)
			router.push('/')
		},
	})
}

export function useCompleteSocialRegistration({ clearOnboardingData }: { clearOnboardingData?: () => void } = {}) {
	const queryClient = useQueryClient()
	const router = useRouter()

	return useMutation({
		mutationFn: (data: { firebaseToken: string; username: string; role: string }) =>
			authService.completeSocialRegistration(data),
		onSuccess: (response) => {
			handleAuthSuccess(queryClient, response)
			if (clearOnboardingData) clearOnboardingData()
		},
	})
}

export function useLogout() {
	const queryClient = useQueryClient()
	const router = useRouter()

	return useMutation({
		mutationFn: async () => {
			const { signOut } = await import('firebase/auth')
			await signOut(auth)
			return authService.logout()
		},
		onSettled: () => {
			apiClient.removeAuthToken()
			queryClient.setQueryData(AUTH_KEYS.user, null)
			queryClient.clear()
			router.push('/login')
		},
	})
}

export function useForgotPassword() {
	return useMutation({
		mutationFn: (data: PasswordResetDto) => authService.forgotPassword(data),
	})
}
