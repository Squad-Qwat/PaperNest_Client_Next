import { create } from 'zustand'

interface UserStore {
	isProfileUpdating: boolean
	setIsProfileUpdating: (updating: boolean) => void
	lastUpdated: Date | null
	setLastUpdated: (date: Date) => void
}

export const useUserStore = create<UserStore>((set) => ({
	isProfileUpdating: false,
	setIsProfileUpdating: (updating) => set({ isProfileUpdating: updating }),
	lastUpdated: null,
	setLastUpdated: (date) => set({ lastUpdated: date }),
}))
