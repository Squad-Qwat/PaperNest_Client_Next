/**
 * Workspaces Service
 * Handles all workspace-related API operations including member management
 */

import { apiClient } from '../clients/api-client'
import { API_ENDPOINTS } from '../config'
import type { Invitation } from '../types/invitation.types'
import type {
	CreateWorkspaceDto,
	InviteMemberDto,
	UpdateMemberRoleDto,
	UpdateWorkspaceDto,
	Workspace,
	WorkspaceMembersResponse,
	WorkspaceWithRole,
} from '../types/workspace.types'

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
	 * Send invitations to multiple emails
	 */
	async sendInvitations(
		workspaceId: string,
		data: { emails: string[]; role: string }
	): Promise<{ results: { email: string; status: string }[] }> {
		return apiClient.post<{ results: { email: string; status: string }[] }>(
			API_ENDPOINTS.workspaces.invitations(workspaceId),
			data
		)
	}

	/**
	 * Get invitation details by token
	 */
	async getInvitationDetails(token: string): Promise<{
		invitation: {
			email: string
			role: string
			workspaceTitle: string
			workspaceIcon?: string
			inviterName: string
		}
	}> {
		return apiClient.get(API_ENDPOINTS.invitations.details(token))
	}

	/**
	 * Accept invitation by token
	 */
	async acceptInvitation(token: string): Promise<void> {
		await apiClient.post(API_ENDPOINTS.invitations.accept(token), {})
	}

	// ============= Member Management =============

	/**
	 * Get workspace members
	 */
	async getMembers(workspaceId: string): Promise<WorkspaceMembersResponse> {
		return apiClient.get<WorkspaceMembersResponse>(API_ENDPOINTS.workspaces.members(workspaceId))
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
