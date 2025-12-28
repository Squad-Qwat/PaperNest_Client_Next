/**
 * Invitation Service
 * API service for managing workspace invitations
 */

import { apiClient } from '../clients/api-client';
import type {
  Invitation,
  UpdateInvitationDto,
  InvitationsResponse,
} from '../types/invitation.types';

class InvitationService {
  private readonly basePath = '/invitations';

  /**
   * Get pending invitations for current user
   */
  async getPendingInvitations(): Promise<InvitationsResponse> {
    return apiClient.get<InvitationsResponse>(this.basePath);
  }

  /**
   * Accept or decline an invitation
   */
  async respondToInvitation(
    userWorkspaceId: string,
    data: UpdateInvitationDto
  ): Promise<{ userWorkspace: Invitation }> {
    return apiClient.put<{ userWorkspace: Invitation }>(
      `${this.basePath}/${userWorkspaceId}`,
      data
    );
  }

  /**
   * Accept an invitation (helper method)
   */
  async acceptInvitation(userWorkspaceId: string): Promise<Invitation> {
    const result = await this.respondToInvitation(userWorkspaceId, {
      status: 'accepted',
    });
    return result.userWorkspace;
  }

  /**
   * Decline an invitation (helper method)
   */
  async declineInvitation(userWorkspaceId: string): Promise<Invitation> {
    const result = await this.respondToInvitation(userWorkspaceId, {
      status: 'declined',
    });
    return result.userWorkspace;
  }
}

export const invitationService = new InvitationService();
