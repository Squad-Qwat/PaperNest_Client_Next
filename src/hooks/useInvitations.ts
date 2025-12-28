/**
 * useInvitations Hook
 * Custom hook for managing workspace invitations
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { invitationService } from '@/lib/api/services/invitation.service';
import type { Invitation } from '@/lib/api/types/invitation.types';
import { getErrorMessage } from '@/lib/api/utils/error-handler';

interface UseInvitationsReturn {
  invitations: Invitation[];
  loading: boolean;
  error: string | null;
  count: number;
  fetchInvitations: () => Promise<void>;
  refetch: () => Promise<void>;
  acceptInvitation: (userWorkspaceId: string) => Promise<void>;
  declineInvitation: (userWorkspaceId: string) => Promise<void>;
  clearError: () => void;
}

export function useInvitations(): UseInvitationsReturn {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const fetchInvitations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await invitationService.getPendingInvitations();
      setInvitations(data.invitations);
      setCount(data.count);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptInvitation = useCallback(
    async (userWorkspaceId: string) => {
      try {
        setLoading(true);
        setError(null);
        await invitationService.acceptInvitation(userWorkspaceId);
        // Remove accepted invitation from list
        setInvitations((prev) =>
          prev.filter((inv) => inv.userWorkspaceId !== userWorkspaceId)
        );
        setCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        const message = getErrorMessage(err);
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const declineInvitation = useCallback(
    async (userWorkspaceId: string) => {
      try {
        setLoading(true);
        setError(null);
        await invitationService.declineInvitation(userWorkspaceId);
        // Remove declined invitation from list
        setInvitations((prev) =>
          prev.filter((inv) => inv.userWorkspaceId !== userWorkspaceId)
        );
        setCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        const message = getErrorMessage(err);
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  return {
    invitations,
    loading,
    error,
    count,
    fetchInvitations,
    refetch: fetchInvitations,
    acceptInvitation,
    declineInvitation,
    clearError,
  };
}
