import { set } from 'zod'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WorkspaceState {
	lastWorkspaceId: string | null
	setLastWorkspaceId: (id: string | null) => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
	persist(
		(set) => ({
			lastWorkspaceId: null,
			setLastWorkspaceId: (id) => set({ lastWorkspaceId: id }),
		}),
		{
			name: 'workspace-storage',
			version: 1, // bump this whenever you want to wipe old persisted state
			migrate: () => ({lastWorkspaceId: null}), // reset on version mismatch
		}
	)
)
