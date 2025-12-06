/**
 * Workspaces Service
 * Handles all workspace-related API operations including member management
 */

import { apiClient } from '../clients/api-client'
import { API_ENDPOINTS } from '../config'
import type {
	Workspace,
	WorkspaceWithRole,
	CreateWorkspaceDto,
	UpdateWorkspaceDto,
	InviteMemberDto,
	UpdateMemberRoleDto,
	WorkspaceMembersResponse,
} from '../types/workspace.types'
import type { Invitation, UpdateInvitationDto } from '../types/invitation.types'

class WorkspacesService {
	/**
	 * Create new workspace
	 */
	async create(data: CreateWorkspaceDto): Promise<Workspace> {
		return apiClient.post<Workspace>(API_ENDPOINTS.workspaces.base, data)
	}

	/**
	 * Get all workspaces for current user
	 */
	async getAll(): Promise<{ workspaces: Workspace[]; count: number }> {
		return apiClient.get<{ workspaces: Workspace[]; count: number }>(API_ENDPOINTS.workspaces.base)
	}

	/**
	 * Get workspace by ID
	 */
	async getById(workspaceId: string): Promise<WorkspaceWithRole> {
		const response = await apiClient.get<{ workspace: WorkspaceWithRole }>(
			API_ENDPOINTS.workspaces.byId(workspaceId)
		)
		return response.workspace
	}

	/**
	 * Update workspace
	 */
	async update(workspaceId: string, data: UpdateWorkspaceDto): Promise<Workspace> {
		return apiClient.put<Workspace>(API_ENDPOINTS.workspaces.byId(workspaceId), data)
	}

	/**
	 * Delete workspace
	 */
	async delete(workspaceId: string): Promise<void> {
		await apiClient.delete<void>(API_ENDPOINTS.workspaces.byId(workspaceId))
	}

	/**
	 * Join workspace by workspace ID
	 */
	async joinByWorkspaceId(workspaceId: string): Promise<Invitation> {
		const response = await apiClient.post<{ userWorkspace: Invitation }>(
			API_ENDPOINTS.workspaces.join(workspaceId),
			{}
		)
		return response.userWorkspace
	}

	// ============= Member Management =============

	/**
	 * Get workspace members
	 */
	async getMembers(workspaceId: string): Promise<WorkspaceMembersResponse> {
		return apiClient.get<WorkspaceMembersResponse>(API_ENDPOINTS.workspaces.members(workspaceId))
	}

	/**
	 * Invite member to workspace
	 */
	async inviteMember(workspaceId: string, data: InviteMemberDto): Promise<Invitation> {
		const response = await apiClient.post<{ userWorkspace: Invitation }>(
			API_ENDPOINTS.workspaces.members(workspaceId),
			data
		)
		return response.userWorkspace
	}

	/**
	 * Update member role
	 */
	async updateMemberRole(
		workspaceId: string,
		userWorkspaceId: string,
		data: UpdateMemberRoleDto
	): Promise<Invitation> {
		const response = await apiClient.put<{ userWorkspace: Invitation }>(
			API_ENDPOINTS.workspaces.member(workspaceId, userWorkspaceId),
			data
		)
		return response.userWorkspace
	}

	/**
	 * Remove member from workspace
	 */
	async removeMember(workspaceId: string, userWorkspaceId: string): Promise<void> {
		await apiClient.delete<void>(API_ENDPOINTS.workspaces.member(workspaceId, userWorkspaceId))
	}
}

// Export singleton instance
export const workspacesService = new WorkspacesService()
