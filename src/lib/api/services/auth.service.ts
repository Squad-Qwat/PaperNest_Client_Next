/**
 * Authentication Service
 * Handles all authentication-related API operations
 */

import { apiClient } from '../clients/api-client'
import { API_ENDPOINTS } from '../config'
import type {
	RegisterDto,
	LoginDto,
	LoginEmailDto,
	AuthResponse,
	RefreshTokenDto,
	RefreshTokenResponse,
	PasswordResetDto,
	UpdateEmailDto,
	VerifyTokenDto,
	CheckEmailResponse,
} from '../types/auth.types'
import type { User } from '../types/user.types'

class AuthService {
	/**
	 * Check email availability
	 */
	async checkEmail(email: string): Promise<CheckEmailResponse> {
		return apiClient.post<CheckEmailResponse>('/auth/check-email', { email })
	}

	/**
	 * Register new user (Tiered Registration)
	 */
	async register(data: RegisterDto): Promise<AuthResponse> {
		const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.auth.register, data)

		// Access tokens only exist if verification was NOT required (e.g. some config)
		// but in our tiered flow, we usually wait for finalizeRegistration
		const accessToken = response.token || response.accessToken
		if (accessToken && response.refreshToken) {
			apiClient.setAuthToken(accessToken)
			this.saveTokens(accessToken, response.refreshToken)
		}

		return response
	}

	/**
	 * Finalize registration after email verification
	 */
	async finalizeRegistration(data: { firebaseToken: string }): Promise<AuthResponse> {
		const response = await apiClient.post<AuthResponse>('/auth/register/finalize', data)

		const accessToken = response.token || response.accessToken
		if (accessToken && response.refreshToken) {
			apiClient.setAuthToken(accessToken)
			this.saveTokens(accessToken, response.refreshToken)
		}

		return response
	}

	/**
	 * Login with Firebase token
	 */
	async login(data: LoginDto): Promise<AuthResponse> {
		const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.auth.login, data)

		const accessToken = response.token || response.accessToken
		if (accessToken && response.refreshToken) {
			apiClient.setAuthToken(accessToken)
			this.saveTokens(accessToken, response.refreshToken)
		}

		return response
	}

	/**
	 * Login with Social Auth (Google, GitHub, etc.)
	 */
	async loginSocial(data: { firebaseToken: string; accessToken?: string }): Promise<AuthResponse> {
		const response = await apiClient.post<AuthResponse>('/auth/social', data)

		const accessToken = response.token || response.accessToken
		if (accessToken && response.refreshToken) {
			apiClient.setAuthToken(accessToken)
			this.saveTokens(accessToken, response.refreshToken)
		}

		return response
	}

	/**
	 * Refresh access token
	 */
	async refresh(data: RefreshTokenDto): Promise<RefreshTokenResponse> {
		const response = await apiClient.post<RefreshTokenResponse>(API_ENDPOINTS.auth.refresh, data)

		// Update token
		if (response.accessToken) {
			apiClient.setAuthToken(response.accessToken)
			if (typeof window !== 'undefined') {
				localStorage.setItem('accessToken', response.accessToken)
			}
		}

		return response
	}

	/**
	 * Verify Firebase token
	 */
	async verify(data: VerifyTokenDto): Promise<User> {
		return apiClient.post<User>(API_ENDPOINTS.auth.verify, data)
	}

	/**
	 * Get current authenticated user
	 */
	async getCurrentUser(): Promise<User> {
		const response = await apiClient.get<{ user: User }>(API_ENDPOINTS.auth.me)
		return response.user
	}

	/**
	 * Logout user
	 */
	async logout(): Promise<void> {
		try {
			// Call logout endpoint (if backend has one)
			// await apiClient.post<void>('/auth/logout');
		} finally {
			// Always clear local storage and token
			apiClient.removeAuthToken()
			this.clearTokens()
		}
	}

	/**
	 * Delete user account
	 */
	async deleteAccount(): Promise<void> {
		await apiClient.delete<void>(API_ENDPOINTS.auth.deleteAccount)
		// Clear tokens after deletion
		apiClient.removeAuthToken()
		this.clearTokens()
	}

	/**
	 * Update user email
	 */
	async updateEmail(data: UpdateEmailDto): Promise<User> {
		return apiClient.put<User>(API_ENDPOINTS.auth.updateEmail, data)
	}

	/**
	 * Request password reset
	 */
	async forgotPassword(data: PasswordResetDto): Promise<void> {
		await apiClient.post<void>(API_ENDPOINTS.auth.passwordReset, data)
	}

	/**
	 * Initialize auth from stored tokens
	 * Call this on app startup
	 */
	initializeAuth(): { accessToken: string | null; refreshToken: string | null } {
		if (typeof window === 'undefined') {
			return { accessToken: null, refreshToken: null }
		}

		const accessToken = localStorage.getItem('accessToken')
		const refreshToken = localStorage.getItem('refreshToken')

		if (accessToken) {
			apiClient.setAuthToken(accessToken)
		}

		return { accessToken, refreshToken }
	}

	/**
	 * Save tokens to local storage
	 */
	private saveTokens(accessToken: string, refreshToken: string): void {
		if (typeof window !== 'undefined') {
			localStorage.setItem('accessToken', accessToken)
			localStorage.setItem('refreshToken', refreshToken)
		}
	}

	/**
	 * Clear tokens from local storage
	 */
	private clearTokens(): void {
		if (typeof window !== 'undefined') {
			localStorage.removeItem('accessToken')
			localStorage.removeItem('refreshToken')
		}
	}

	/**
	 * Get stored refresh token
	 */
	getRefreshToken(): string | null {
		if (typeof window === 'undefined') return null
		return localStorage.getItem('refreshToken')
	}

	/**
	 * Complete social registration (Onboarding)
	 */
	async completeSocialRegistration(data: {
		firebaseToken: string
		username: string
		role: string
		email?: string
	}): Promise<AuthResponse> {
		const response = await apiClient.post<AuthResponse>('/auth/social/complete', data)

		const accessToken = response.token || response.accessToken
		if (accessToken && response.refreshToken) {
			apiClient.setAuthToken(accessToken)
			this.saveTokens(accessToken, response.refreshToken)
		}

		return response
	}
}

// Export singleton instance
export const authService = new AuthService()
