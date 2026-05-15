export const API_CONFIG = {
	baseURL:
		typeof window !== 'undefined'
			? '/api'
			: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
	directBackendURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
	timeout: 10000,
	retryAttempts: 3,
	headers: {
		'Content-Type': 'application/json',
	},
} as const

export const API_ENDPOINTS = {
	auth: {
		register: '/auth/register',
		finalizeRegistration: '/auth/register/finalize',
		login: '/auth/login',
		loginEmail: '/auth/login/email',
		refresh: '/auth/refresh',
		verify: '/auth/verify',
		me: '/auth/me',
		deleteAccount: '/auth/account',
		updateEmail: '/auth/email',
		passwordReset: '/auth/password/reset',
		checkEmail: '/auth/check-email',
		otpSend: '/auth/otp/send',
		otpVerify: '/auth/otp/verify',
	},
	users: {
		base: '/users',
		search: '/users/search',
		byId: (userId: string) => `/users/${userId}`,
	},
	workspaces: {
		base: '/workspaces',
		byId: (workspaceId: string) => `/workspaces/${workspaceId}`,
		join: (workspaceId: string) => `/workspaces/${workspaceId}/join`,
		members: (workspaceId: string) => `/workspaces/${workspaceId}/members`,
		member: (workspaceId: string, userWorkspaceId: string) =>
			`/workspaces/${workspaceId}/members/${userWorkspaceId}`,
	},
	invitations: {
		base: '/invitations',
		byId: (userWorkspaceId: string) => `/invitations/${userWorkspaceId}`,
	},
	documents: {
		myDocuments: '/documents/my-documents',
		byWorkspace: (workspaceId: string) => `/workspaces/${workspaceId}/documents`,
		search: (workspaceId: string) => `/workspaces/${workspaceId}/documents/search`,
		byId: (workspaceId: string, documentId: string) =>
			`/workspaces/${workspaceId}/documents/${documentId}`,
		content: (workspaceId: string, documentId: string) =>
			`/workspaces/${workspaceId}/documents/${documentId}/content`,
		versions: (documentId: string) => `/documents/${documentId}/versions`,
		currentVersion: (documentId: string) => `/documents/${documentId}/versions/current`,
		withRoomState: (documentId: string) => `/documents/${documentId}/with-room-state`,
		batch: (documentId: string) => `/documents/${documentId}/batch`,
		revert: (documentId: string, versionNumber: number) =>
			`/documents/${documentId}/versions/${versionNumber}/revert`,
	},
	reviews: {
		student: '/reviews',
		lecturer: '/reviews/pending',
		byDocument: (documentId: string) => `/documents/${documentId}/reviews`,
		create: (documentId: string, documentBodyId: string) =>
			`/documents/${documentId}/versions/${documentBodyId}/reviews`,
		approve: (reviewId: string) => `/reviews/${reviewId}/approve`,
		reject: (reviewId: string) => `/reviews/${reviewId}/reject`,
		requestRevision: (reviewId: string) => `/reviews/${reviewId}/request-revision`,
	},
	templates: {
		base: '/templates',
		byId: (templateId: string) => `/templates/${templateId}`,
	},
} as const
