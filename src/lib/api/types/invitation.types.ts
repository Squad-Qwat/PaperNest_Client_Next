/**
 * Invitation Types
 * Types for invitation-related API operations
 */

import type { UserWorkspace } from './workspace.types';
import type { Workspace } from './workspace.types';

/**
 * Invitation (UserWorkspace with workspace details)
 */
export interface Invitation extends UserWorkspace {
  workspace: Workspace;
}

/**
 * Update invitation status DTO
 */
export interface UpdateInvitationDto {
  status: 'accepted' | 'declined';
}

/**
 * Invitations response
 */
export interface InvitationsResponse {
  invitations: Invitation[];
  count: number;
}
