/**
 * API Configuration
 * Centralized configuration for API client
 */

export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 10000, // 10 seconds
  retryAttempts: 3,
  headers: {
    'Content-Type': 'application/json',
  },
} as const;

/**
 * API Endpoints
 * Centralized endpoint paths
 */
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    loginEmail: '/auth/login/email',
    refresh: '/auth/refresh',
    verify: '/auth/verify',
    me: '/auth/me',
    deleteAccount: '/auth/account',
    updateEmail: '/auth/email',
    passwordReset: '/auth/password/reset',
  },
  
  // Users
  users: {
    base: '/users',
    search: '/users/search',
    byId: (userId: string) => `/users/${userId}`,
  },
  
  // Workspaces
  workspaces: {
    base: '/workspaces',
    byId: (workspaceId: string) => `/workspaces/${workspaceId}`,
    members: (workspaceId: string) => `/workspaces/${workspaceId}/members`,
    member: (workspaceId: string, userWorkspaceId: string) =>
      `/workspaces/${workspaceId}/members/${userWorkspaceId}`,
  },
  
  // Invitations
  invitations: {
    base: '/invitations',
    byId: (userWorkspaceId: string) => `/invitations/${userWorkspaceId}`,
  },
  
  // Documents
  documents: {
    myDocuments: '/documents/my-documents',
    byWorkspace: (workspaceId: string) => `/workspaces/${workspaceId}/documents`,
    search: (workspaceId: string) => `/workspaces/${workspaceId}/documents/search`,
    byId: (workspaceId: string, documentId: string) => 
      `/workspaces/${workspaceId}/documents/${documentId}`,
    content: (workspaceId: string, documentId: string) =>
      `/workspaces/${workspaceId}/documents/${documentId}/content`,
  },
} as const;