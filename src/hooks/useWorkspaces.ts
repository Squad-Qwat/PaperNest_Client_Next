/**
 * useWorkspaces Hook
 * Fetch user's workspaces from API
 */

'use client';

import { useState, useEffect } from 'react';
import { workspacesService } from '@/lib/api/services/workspaces.service';
import { useAuthContext } from '@/context/AuthContext';
import type { Workspace } from '@/lib/api/types/workspace.types';

interface UseWorkspacesReturn {
  workspaces: Workspace[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Fetch user's workspaces from API
 */
export function useWorkspaces(): UseWorkspacesReturn {
  const { user, loading: authLoading } = useAuthContext();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaces = async () => {
    if (!user) {
      setWorkspaces([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await workspacesService.getAll();
      setWorkspaces(response.workspaces);
    } catch (err) {
      console.error('[useWorkspaces] Error fetching workspaces:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch workspaces');
      setWorkspaces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }

    fetchWorkspaces();
  }, [user, authLoading]);

  return {
    workspaces,
    loading: authLoading || loading,
    error,
    refetch: fetchWorkspaces,
  };
}
