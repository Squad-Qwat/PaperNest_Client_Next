'use client'

import { SettingsHeader } from '../../components/settings/SettingsHeader'
import { SettingsSidebar } from '../../components/settings/SettingsSidebar'
import { SidebarProvider } from '../../components/ui/sidebar'

export default function SettingsLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<div className='h-screen bg-background flex flex-col font-sans'>
			<SettingsHeader />
			
			<div className='flex-1 flex overflow-hidden'>
				<SidebarProvider className='items-stretch'>
					<SettingsSidebar />
					
					<main className='flex-1 overflow-y-auto p-6 md:p-10 lg:p-12'>
						<div className='max-w-7xl mx-auto'>
							{children}
						</div>
					</main>
				</SidebarProvider>
			</div>
		</div>
	)
}
