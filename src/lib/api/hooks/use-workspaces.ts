import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { workspacesService } from '../services/workspaces.service'
import type {
	CreateWorkspaceDto,
	UpdateWorkspaceDto,
	InviteMemberDto,
	UpdateMemberRoleDto,
} from '../types/workspace.types'

// Centralized query keys for workspaces
export const WORKSPACE_KEYS = {
	all: ['workspaces'] as const,
	detail: (id: string) => ['workspaces', id] as const,
	members: (id: string) => ['workspace-members', id] as const,
}

// Queries
export function useWorkspaces() {
	return useQuery({
		queryKey: WORKSPACE_KEYS.all,
		queryFn: () => workspacesService.getAll(),
	})
}

export function useWorkspace(workspaceId: string) {
	return useQuery({
		queryKey: WORKSPACE_KEYS.detail(workspaceId),
		queryFn: () => workspacesService.getById(workspaceId),
		enabled: !!workspaceId,
	})
}

export function useWorkspaceMembers(workspaceId: string) {
	return useQuery({
		queryKey: WORKSPACE_KEYS.members(workspaceId),
		queryFn: () => workspacesService.getMembers(workspaceId),
		enabled: !!workspaceId,
	})
}

// Mutations
export function useCreateWorkspace() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (data: CreateWorkspaceDto) => workspacesService.create(data),
		onSuccess: () => {
			// Invalidate all workspaces to refetch the list
			queryClient.invalidateQueries({ queryKey: WORKSPACE_KEYS.all })
		},
	})
}

export function useUpdateWorkspace() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateWorkspaceDto }) =>
			workspacesService.update(id, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: WORKSPACE_KEYS.all })
			queryClient.invalidateQueries({ queryKey: WORKSPACE_KEYS.detail(variables.id) })
		},
	})
}

export function useDeleteWorkspace() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (workspaceId: string) => workspacesService.delete(workspaceId),
		onSuccess: (_, workspaceId) => {
			queryClient.invalidateQueries({ queryKey: WORKSPACE_KEYS.all })
			// Optionally remove specific workspace from cache
			queryClient.removeQueries({ queryKey: WORKSPACE_KEYS.detail(workspaceId) })
		},
	})
}

export function useJoinWorkspace() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (workspaceId: string) => workspacesService.joinByWorkspaceId(workspaceId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: WORKSPACE_KEYS.all })
		},
	})
}

// Member Management Mutations
export function useInviteMember() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({
			workspaceId,
			data,
		}: {
			workspaceId: string
			data: InviteMemberDto
		}) => workspacesService.inviteMember(workspaceId, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: WORKSPACE_KEYS.members(variables.workspaceId) })
		},
	})
}

export function useUpdateMemberRole() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({
			workspaceId,
			userWorkspaceId,
			data,
		}: {
			workspaceId: string
			userWorkspaceId: string
			data: UpdateMemberRoleDto
		}) => workspacesService.updateMemberRole(workspaceId, userWorkspaceId, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: WORKSPACE_KEYS.members(variables.workspaceId) })
		},
	})
}

export function useRemoveMember() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({
			workspaceId,
			userWorkspaceId,
		}: {
			workspaceId: string
			userWorkspaceId: string
		}) => workspacesService.removeMember(workspaceId, userWorkspaceId),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: WORKSPACE_KEYS.members(variables.workspaceId) })
		},
	})
}
