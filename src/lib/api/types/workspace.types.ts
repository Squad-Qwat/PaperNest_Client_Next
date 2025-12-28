/**
 * Workspace Types
 * Types for workspace-related API operations
 */

import type { User } from './user.types';

/**
 * Workspace role enum
 */
export type WorkspaceRole = 'owner' | 'editor' | 'reviewer' | 'viewer';

/**
 * Workspace entity
 */
export interface Workspace {
  workspaceId: string;
  title: string;
  description?: string | null;
  icon?: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Workspace with user role
 */
export interface WorkspaceWithRole extends Workspace {
  userRole: WorkspaceRole;
}

/**
 * Create workspace DTO
 */
export interface CreateWorkspaceDto {
  title: string;
  description?: string;
  icon?: string;
}

/**
 * Update workspace DTO
 */
export interface UpdateWorkspaceDto {
  title?: string;
  description?: string;
  icon?: string;
}

/**
 * User-Workspace relationship
 */
export interface UserWorkspace {
  userWorkspaceId: string;
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt: string;
}

/**
 * Workspace member (UserWorkspace with user details)
 */
export interface WorkspaceMember extends UserWorkspace {
  user: User;
}

/**
 * Invite member DTO
 */
export interface InviteMemberDto {
  userId: string;
  role: Exclude<WorkspaceRole, 'owner'>; // Cannot invite as owner
}

/**
 * Update member role DTO
 */
export interface UpdateMemberRoleDto {
  role: WorkspaceRole;
}

/**
 * Workspace members response
 */
export interface WorkspaceMembersResponse {
  members: WorkspaceMember[];
  count: number;
}
