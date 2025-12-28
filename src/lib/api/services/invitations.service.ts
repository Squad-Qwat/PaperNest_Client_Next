/**
 * Invitations Service
 * Handles invitation-related API operations
 */

import { apiClient } from '../clients/api-client';
import { API_ENDPOINTS } from '../config';
import type {
  Invitation,
  UpdateInvitationDto,
  InvitationsResponse,
} from '../types/invitation.types';

class InvitationsService {
  /**
   * Get all pending invitations for current user
   */
  async getAll(): Promise<Invitation[]> {
    return apiClient.get<Invitation[]>(API_ENDPOINTS.invitations.base);
  }

  /**
   * Accept or decline invitation
   */
  async updateStatus(
    userWorkspaceId: string,
    data: UpdateInvitationDto
  ): Promise<Invitation> {
    return apiClient.put<Invitation>(
      API_ENDPOINTS.invitations.byId(userWorkspaceId),
      data
    );
  }

  /**
   * Accept invitation (convenience method)
   */
  async accept(userWorkspaceId: string): Promise<Invitation> {
    return this.updateStatus(userWorkspaceId, { status: 'accepted' });
  }

  /**
   * Decline invitation (convenience method)
   */
  async decline(userWorkspaceId: string): Promise<Invitation> {
    return this.updateStatus(userWorkspaceId, { status: 'declined' });
  }
}

// Export singleton instance
export const invitationsService = new InvitationsService();
