'use client'

import React, { createContext, useContext, useMemo, useEffect } from 'react'
import { 
	useWorkspaces, 
	useWorkspace, 
	useWorkspaceMembers,
	useCreateWorkspace,
	useUpdateWorkspace,
	useDeleteWorkspace
} from '@/lib/api/hooks/use-workspaces'
import type {
	Workspace,
	WorkspaceWithRole,
	CreateWorkspaceDto,
	UpdateWorkspaceDto,
	WorkspaceMember,
} from '@/lib/api/types/workspace.types'
import { useWorkspaceStore } from '@/lib/store/workspace-store'

interface WorkspaceContextType {
	workspaces: Workspace[]
	currentWorkspace: WorkspaceWithRole | null
	members: WorkspaceMember[]
	isLoading: boolean
	error: string | null

	// Workspace operations
	fetchWorkspaces: () => Promise<void>
	fetchWorkspaceById: (workspaceId: string) => Promise<void>
	createWorkspace: (data: CreateWorkspaceDto) => Promise<Workspace>
	updateWorkspace: (workspaceId: string, data: UpdateWorkspaceDto) => Promise<void>
	deleteWorkspace: (workspaceId: string) => Promise<void>
	setCurrentWorkspace: (workspace: WorkspaceWithRole | null) => void

	// Member operations
	fetchMembers: (workspaceId: string) => Promise<void>

	clearError: () => void
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
	const { lastWorkspaceId, setLastWorkspaceId } = useWorkspaceStore()
	
	// Use TanStack Query hooks as the source of truth
	const { 
		data: workspacesData, 
		isLoading: workspacesLoading, 
		error: workspacesError,
		refetch: refetchWorkspaces
	} = useWorkspaces()

	const {
		data: currentWorkspaceData,
		isLoading: workspaceLoading,
		error: workspaceError,
		refetch: refetchWorkspace
	} = useWorkspace(lastWorkspaceId || '')

	const {
		data: membersData,
		isLoading: membersLoading,
		error: membersError,
		refetch: refetchMembers
	} = useWorkspaceMembers(lastWorkspaceId || '')

	// Mutations
	const createMutation = useCreateWorkspace()
	const updateMutation = useUpdateWorkspace()
	const deleteMutation = useDeleteWorkspace()

	// Derived states
	const workspaces = useMemo(() => workspacesData?.workspaces || [], [workspacesData])
	const currentWorkspace = (currentWorkspaceData as WorkspaceWithRole) || null
	const members = useMemo(() => membersData?.members || [], [membersData])
	
	const isLoading = workspacesLoading || workspaceLoading || membersLoading || 
					createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
	
	const error = useMemo(() => {
		const err = workspacesError || workspaceError || membersError || 
					createMutation.error || updateMutation.error || deleteMutation.error
		return err ? (err as Error).message : null
	}, [workspacesError, workspaceError, membersError, createMutation.error, updateMutation.error, deleteMutation.error])

	// Legacy method implementations using TanStack Query
	const fetchWorkspaces = async () => {
		await refetchWorkspaces()
	}

	const fetchWorkspaceById = async (workspaceId: string) => {
		setLastWorkspaceId(workspaceId)
		// No need to manually refetch, useWorkspace(lastWorkspaceId) will react
	}

	const createWorkspace = async (data: CreateWorkspaceDto) => {
		return await createMutation.mutateAsync(data)
	}

	const updateWorkspace = async (workspaceId: string, data: UpdateWorkspaceDto) => {
		await updateMutation.mutateAsync({ id: workspaceId, data })
	}

	const deleteWorkspace = async (workspaceId: string) => {
		await deleteMutation.mutateAsync(workspaceId)
		if (lastWorkspaceId === workspaceId) {
			setLastWorkspaceId(null)
		}
	}

	const fetchMembers = async (workspaceId: string) => {
		setLastWorkspaceId(workspaceId)
		await refetchMembers()
	}

	const clearError = () => {
		// Error handling is now mostly automatic via TanStack Query's state,
		// but we can provide a no-op or specific logic if needed.
	}

	const value: WorkspaceContextType = {
		workspaces,
		currentWorkspace,
		members,
		isLoading,
		error,
		fetchWorkspaces,
		fetchWorkspaceById,
		createWorkspace,
		updateWorkspace,
		deleteWorkspace,
		setCurrentWorkspace: (workspace) => setLastWorkspaceId(workspace?.workspaceId || null),
		fetchMembers,
		clearError,
	}

	return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspaceContext() {
	const context = useContext(WorkspaceContext)
	if (context === undefined) {
		throw new Error('useWorkspaceContext must be used within a WorkspaceProvider')
	}
	return context
}

