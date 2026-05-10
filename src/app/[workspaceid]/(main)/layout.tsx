'use client'

import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default function WorkspaceMainLayout({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider className='h-svh overflow-hidden bg-sidebar'>
			<AppSidebar />
			<SidebarInset className='flex flex-col min-h-0 overflow-hidden border border-gray-200/50 transition-all duration-300 isolate rounded-2xl m-2'>
				{children}
			</SidebarInset>
		</SidebarProvider>
	)
}
