/**
 * Authentication Types
 * Types for authentication-related API operations
 */

import type { User, UserRole } from './user.types'

/**
 * Register DTO
 */
export interface RegisterDto {
	email: string
	password: string
	name: string
	username: string
	role: UserRole
	workspaceData?: {
		title: string
		description?: string
		icon?: string
		mode: 'create' | 'join'
		invitationCode?: string
	}
}

/**
 * Finalize Registration DTO
 */
export interface FinalizeRegistrationDto {
	firebaseToken: string
}

/**
 * Login with Firebase token DTO
 */
export interface LoginDto {
	firebaseToken: string
}

/**
 * Login with email/password DTO
 */
export interface LoginEmailDto {
	email: string
	password: string
}

/**
 * Authentication response from backend
 */
export interface AuthResponse {
	user?: User
	token?: string // JWT access token
	refreshToken?: string
	firebaseToken?: string // Custom Firebase token (for Firebase Auth)

	isNewUser?: boolean
	isVerificationRequired?: boolean
	firebaseData?: {
		uid: string
		email: string
		name: string
		picture?: string
	}

	// Deprecated: kept for backwards compatibility
	accessToken?: string
}

/**
 * Refresh token DTO
 */
export interface RefreshTokenDto {
	refreshToken: string
}

/**
 * Refresh token response
 */
export interface RefreshTokenResponse {
	accessToken: string
}

/**
 * Password reset request DTO
 */
export interface PasswordResetDto {
	email: string
}

/**
 * Update email DTO
 */
export interface UpdateEmailDto {
	email: string
}

/**
 * Verify Firebase token DTO
 */
export interface VerifyTokenDto {
	firebaseToken: string
}

/**
 * Check email availability response
 */
export interface CheckEmailResponse {
	available: boolean
}
