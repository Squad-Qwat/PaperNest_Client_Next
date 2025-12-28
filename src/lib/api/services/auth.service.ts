import { useAuthStore } from '@/lib/store/auth-store'
import { apiClient } from '../clients/api-client'
import { API_ENDPOINTS } from '../config'
import type {
	AuthResponse,
	CheckEmailResponse,
	LoginDto,
	PasswordResetDto,
	RefreshTokenDto,
	RefreshTokenResponse,
	RegisterDto,
	UpdateEmailDto,
	VerifyTokenDto,
} from '../types/auth.types'
import type { User } from '../types/user.types'

class AuthService {
	async checkEmail(email: string): Promise<CheckEmailResponse> {
		return apiClient.post<CheckEmailResponse>(API_ENDPOINTS.auth.checkEmail, { email })
	}

	async register(data: RegisterDto): Promise<AuthResponse> {
		const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.auth.register, data)
		this.handleAuthResponse(response)
		return response
	}

	async finalizeRegistration(
		data: { firebaseToken: string },
		token?: string
	): Promise<AuthResponse> {
		const headers = token ? { Authorization: `Bearer ${token}` } : undefined
		const response = await apiClient.request<AuthResponse>(
			API_ENDPOINTS.auth.finalizeRegistration,
			{
				method: 'POST',
				body: JSON.stringify(data),
				headers,
			}
		)
		this.handleAuthResponse(response)
		return response
	}

	async login(data: LoginDto): Promise<AuthResponse> {
		const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.auth.login, data)
		this.handleAuthResponse(response)
		return response
	}

	async loginSocial(data: {
		firebaseToken: string
		accessToken?: string
		// turnstileToken?: string
	}): Promise<AuthResponse> {
		const response = await apiClient.post<AuthResponse>('/auth/social', data)
		this.handleAuthResponse(response)
		return response
	}

	async refresh(data: RefreshTokenDto): Promise<RefreshTokenResponse> {
		const response = await apiClient.post<RefreshTokenResponse>(API_ENDPOINTS.auth.refresh, data)
		const newToken = response.token || response.accessToken
		if (newToken) {
			apiClient.setAuthToken(newToken)
			useAuthStore.getState().setAccessToken(newToken)
		}
		return response
	}

	async verify(data: VerifyTokenDto): Promise<User> {
		return apiClient.post<User>(API_ENDPOINTS.auth.verify, data)
	}

	async getCurrentUser(): Promise<User> {
		const response = await apiClient.get<{ user: User }>(API_ENDPOINTS.auth.me)
		return response.user
	}

	async logout(): Promise<void> {
		apiClient.removeAuthToken()
		useAuthStore.getState().clearAuth()
	}

	async deleteAccount(): Promise<void> {
		await apiClient.delete<void>(API_ENDPOINTS.auth.deleteAccount)
		this.logout()
	}

	async updateEmail(data: UpdateEmailDto): Promise<User> {
		return apiClient.put<User>(API_ENDPOINTS.auth.updateEmail, data)
	}

	async forgotPassword(data: PasswordResetDto): Promise<void> {
		await apiClient.post<void>(API_ENDPOINTS.auth.passwordReset, data)
	}

	async sendOTP(token?: string): Promise<void> {
		const headers = token ? { Authorization: `Bearer ${token}` } : undefined
		await apiClient.request(API_ENDPOINTS.auth.otpSend, {
			method: 'POST',
			headers,
		})
	}

	async verifyOTP(otp: string, token?: string): Promise<void> {
		const headers = token ? { Authorization: `Bearer ${token}` } : undefined
		await apiClient.request(API_ENDPOINTS.auth.otpVerify, {
			method: 'POST',
			body: JSON.stringify({ otp }),
			headers,
		})
	}

	initializeAuth(): string | null {
		const { accessToken } = useAuthStore.getState()
		if (accessToken) {
			apiClient.setAuthToken(accessToken)
		}
		return accessToken
	}

	private handleAuthResponse(response: AuthResponse) {
		const accessToken = response.token || response.accessToken
		if (accessToken && response.refreshToken) {
			apiClient.setAuthToken(accessToken)
			useAuthStore.getState().setTokens(accessToken, response.refreshToken)
		}
	}

	async completeSocialRegistration(data: {
		firebaseToken: string
		username: string
		role: string
		email?: string
	}): Promise<AuthResponse> {
		const response = await apiClient.post<AuthResponse>('/auth/social/complete', data)
		this.handleAuthResponse(response)
		return response
	}
}

export const authService = new AuthService()
