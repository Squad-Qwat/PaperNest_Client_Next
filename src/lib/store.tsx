"use client";

/**
 * Main Application Provider
 * Combines all context providers for the application
 * 
 * Best practices implemented:
 * - Separation of concerns: Each context in its own file
 * - No hardcoded data: Uses API services
 * - Proper TypeScript types from API layer
 * - Loading and error states handled
 * - Clean provider composition pattern
 */

import React from "react";
import { AuthProvider } from "@/context/AuthProvider";
import { WorkspaceProvider } from "@/context/WorkspaceProvider";

/**
 * Root application provider that wraps all context providers
 * Order matters: AuthProvider should be outermost as other providers may depend on auth
 */
export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        {children}
      </WorkspaceProvider>
    </AuthProvider>
  );
}

// Re-export hooks for convenience
export { useAuth } from "@/context/AuthProvider";
export { useWorkspaceContext } from "@/context/WorkspaceProvider";
