import type { User, UserRole } from './user.types'

export interface RegisterDto {
	email: string
	password: string
	name: string
	username: string
	role: UserRole
	turnstileToken?: string
	workspaceData?: {
		title: string
		description?: string
		icon?: string
		mode: 'create' | 'join'
		invitationCode?: string
	}
}

export interface FinalizeRegistrationDto {
	firebaseToken: string
}

export interface LoginDto {
	firebaseToken: string
	turnstileToken?: string
}

export interface LoginEmailDto {
	email: string
	password: string
}

export interface AuthResponse {
	user?: User
	token?: string
	refreshToken?: string
	firebaseToken?: string
	isNewUser?: boolean
	isVerificationRequired?: boolean
	firebaseData?: {
		uid: string
		email: string
		name: string
		picture?: string
	}
	accessToken?: string
}

export interface RefreshTokenDto {
	refreshToken: string
}

export interface RefreshTokenResponse {
	token?: string
	accessToken?: string
}

export interface PasswordResetDto {
	email: string
}

export interface UpdateEmailDto {
	email: string
}

export interface VerifyTokenDto {
	firebaseToken: string
}

export interface CheckEmailResponse {
	available: boolean
}
