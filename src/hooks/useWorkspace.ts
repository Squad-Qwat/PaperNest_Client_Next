/**
 * useWorkspace Hook
 * Fetch single workspace from API
 */

'use client';

import { useState, useEffect } from 'react';
import { workspacesService } from '@/lib/api/services/workspaces.service';
import { useAuthContext } from '@/context/AuthContext';
import type { WorkspaceWithRole } from '@/lib/api/types/workspace.types';

interface UseWorkspaceReturn {
  workspace: WorkspaceWithRole | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Fetch single workspace from API
 * @param workspaceId - Workspace ID to fetch
 */
export function useWorkspace(workspaceId: string | null): UseWorkspaceReturn {
  const { user, loading: authLoading } = useAuthContext();
  const [workspace, setWorkspace] = useState<WorkspaceWithRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspace = async () => {
    if (!workspaceId) {
      setWorkspace(null);
      setLoading(false);
      return;
    }

    if (!user) {
      setWorkspace(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await workspacesService.getById(workspaceId);
      setWorkspace(data);
    } catch (err) {
      console.error('[useWorkspace] Error fetching workspace:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch workspace');
      setWorkspace(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }

    fetchWorkspace();
  }, [workspaceId, user, authLoading]);

  return {
    workspace,
    loading: authLoading || loading,
    error,
    refetch: fetchWorkspace,
  };
}
