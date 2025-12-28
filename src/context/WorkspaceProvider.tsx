"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { workspacesService } from "@/lib/api/services/workspaces.service";
import type { 
  Workspace, 
  WorkspaceWithRole, 
  CreateWorkspaceDto, 
  UpdateWorkspaceDto,
  WorkspaceMember 
} from "@/lib/api/types/workspace.types";

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: WorkspaceWithRole | null;
  members: WorkspaceMember[];
  isLoading: boolean;
  error: string | null;
  
  // Workspace operations
  fetchWorkspaces: () => Promise<void>;
  fetchWorkspaceById: (workspaceId: string) => Promise<void>;
  createWorkspace: (data: CreateWorkspaceDto) => Promise<Workspace>;
  updateWorkspace: (workspaceId: string, data: UpdateWorkspaceDto) => Promise<void>;
  deleteWorkspace: (workspaceId: string) => Promise<void>;
  setCurrentWorkspace: (workspace: WorkspaceWithRole | null) => void;
  
  // Member operations
  fetchMembers: (workspaceId: string) => Promise<void>;
  
  clearError: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceWithRole | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaces = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await workspacesService.getAll();
      setWorkspaces(response.workspaces);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat workspaces";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchWorkspaceById = useCallback(async (workspaceId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const workspace = await workspacesService.getById(workspaceId);
      setCurrentWorkspace(workspace);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat workspace";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createWorkspace = useCallback(async (data: CreateWorkspaceDto) => {
    setIsLoading(true);
    setError(null);
    try {
      const newWorkspace = await workspacesService.create(data);
      setWorkspaces(prev => [...prev, newWorkspace]);
      return newWorkspace;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal membuat workspace";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateWorkspace = useCallback(async (workspaceId: string, data: UpdateWorkspaceDto) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedWorkspace = await workspacesService.update(workspaceId, data);
      setWorkspaces(prev => 
        prev.map(w => w.workspaceId === workspaceId ? updatedWorkspace : w)
      );
      if (currentWorkspace?.workspaceId === workspaceId) {
        setCurrentWorkspace(prev => prev ? { ...prev, ...updatedWorkspace } : null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal mengupdate workspace";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace]);

  const deleteWorkspace = useCallback(async (workspaceId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await workspacesService.delete(workspaceId);
      setWorkspaces(prev => prev.filter(w => w.workspaceId !== workspaceId));
      if (currentWorkspace?.workspaceId === workspaceId) {
        setCurrentWorkspace(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menghapus workspace";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace]);

  const fetchMembers = useCallback(async (workspaceId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await workspacesService.getMembers(workspaceId);
      setMembers(response.members);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat members";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: WorkspaceContextType = {
    workspaces,
    currentWorkspace,
    members,
    isLoading,
    error,
    fetchWorkspaces,
    fetchWorkspaceById,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    setCurrentWorkspace,
    fetchMembers,
    clearError,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceContext() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspaceContext must be used within a WorkspaceProvider");
  }
  return context;
}
