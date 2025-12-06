'use client'

/**
 * Main Application Provider
 * Combines all context providers for the application
 *
 * Best practices implemented:
 * - Separation of concerns: Each context in its own file
 * - No hardcoded data: Uses API services
 * - Proper TypeScript types from API layer
 * - Loading and error states handled
 * - Clean provider composition pattern
 */

import React from 'react'
import { WorkspaceProvider } from '@/context/WorkspaceProvider'

/**
 * Root application provider that wraps all context providers
 * AuthProvider is now at the layout level, so we only wrap with WorkspaceProvider here
 */
export function AppProvider({ children }: { children: React.ReactNode }) {
	return (
		<WorkspaceProvider>{children}</WorkspaceProvider>
	)
}

// Re-export hooks for convenience
export { useAuth } from '@/context/AuthContext'
export { useWorkspaceContext } from '@/context/WorkspaceProvider'
