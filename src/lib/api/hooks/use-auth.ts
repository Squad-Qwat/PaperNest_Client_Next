import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { authService } from '../services/auth.service'
import { apiClient } from '../clients/api-client'
import { getErrorMessage } from '../utils/error-handler'
import type { LoginDto, RegisterDto, LoginEmailDto, PasswordResetDto } from '../types/auth.types'
import { auth } from '../../firebase/config'
import {
	signInWithPopup,
	signInWithEmailAndPassword,
	fetchSignInMethodsForEmail,
	linkWithCredential,
} from 'firebase/auth'
import { getAuthProvider, type SocialProviderName } from '../../firebase/auth-providers'

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

/**
 * Clean Code: Logic extraction for Social Sign In
 */
async function performSocialSignIn(providerName: SocialProviderName) {
	const config = getAuthProvider(providerName)
	const provider = config.create()

	try {
		const result = await signInWithPopup(auth, provider)
		const idToken = await result.user.getIdToken()
		const accessToken = config.getAccessToken ? config.getAccessToken(result) : undefined

		const response = await authService.loginSocial({ firebaseToken: idToken, accessToken })
		return { response, idToken }
	} catch (error: any) {
		if (error.code === 'auth/account-exists-with-different-credential') {
			const email = error.customData?.email
			if (!email) throw error

			const pendingCred = config.getCredentialFromError(error)
			const methods = await fetchSignInMethodsForEmail(auth, email)
			const socialMethod = methods.find(m => m !== 'password' && m !== 'emailLink')
			const targetMethod = socialMethod || (methods.length === 0 ? 'google.com' : null)

			if (!targetMethod) throw new Error('PASSWORD_CONFLICT')

			// Throw custom error with metadata for the hook to catch and store in state
			const conflictError = new Error('ACCOUNT_EXISTS_CONFLICT') as any
			conflictError.payload = { email, pendingCred, targetMethod, providerName }
			throw conflictError
		}
		throw error
	}
}

/**
 * Clean Code: Logic extraction for Account Linking
 */
async function performAccountLinking(linkingSession: any) {
	const targetConfig = getAuthProvider(linkingSession.targetMethod)
	const providerConfig = getAuthProvider(linkingSession.providerName)

	const existingProvider = targetConfig.create()
	const existingResult = await signInWithPopup(auth, existingProvider)
	const result: any = await linkWithCredential(existingResult.user, linkingSession.pendingCred)

	const idToken = await result.user.getIdToken()
	const accessToken = providerConfig.getAccessToken ? providerConfig.getAccessToken(result) : undefined

	const response = await authService.loginSocial({ firebaseToken: idToken, accessToken })
	return { response, idToken }
}

export function useSignInWithSocial({ setOnboardingData }: { setOnboardingData?: (data: any) => void } = {}) {
	const queryClient = useQueryClient()
	const router = useRouter()
	const [linkingSession, setLinkingSession] = useState<any>(null)

	const socialSignin = useMutation({
		mutationFn: (providerName: SocialProviderName) => performSocialSignIn(providerName),
		onError: (error: any) => {
			if (error.message === 'ACCOUNT_EXISTS_CONFLICT' && error.payload) {
				setLinkingSession(error.payload)
			}
		},
		onSuccess: ({ response, idToken }) => {
			if (response.isNewUser) {
				setOnboardingData?.({ token: idToken, firebaseData: response.firebaseData })
				router.push('/auth/onboarding')
				return
			}
			handleAuthSuccess(queryClient, response)
			router.push('/')
		},
	})

	const linkMutation = useMutation({
		mutationFn: () => {
			if (!linkingSession) throw new Error('No linking session')
			return performAccountLinking(linkingSession)
		},
		onSuccess: ({ response, idToken }) => {
			setLinkingSession(null)
			handleAuthSuccess(queryClient, response)
			router.push('/')
		},
	})

	return {
		...socialSignin,
		linkingSession,
		linkMutation,
		resetLinking: () => setLinkingSession(null)
	}
}

export function useCompleteSocialRegistration({ clearOnboardingData }: { clearOnboardingData?: () => void } = {}) {
	const queryClient = useQueryClient()
	const router = useRouter()

	return useMutation({
		mutationFn: (data: { firebaseToken: string; username: string; role: string; email?: string }) =>
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
