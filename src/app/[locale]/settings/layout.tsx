'use client'

import { useEffect } from 'react'
import { SettingsHeader } from '@/components/settings/SettingsHeader'
import { SettingsSidebar } from '@/components/settings/SettingsSidebar'
import { SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		const cleanup = () => {
			document.body.style.pointerEvents = ''
			document.body.style.overflow = ''
			document.body.style.paddingRight = ''
			document.body.style.marginRight = ''

			document.documentElement.style.pointerEvents = ''
			document.documentElement.style.overflow = ''

			document.body.removeAttribute('data-radix-pointer-events-non-interactive')
			document.documentElement.removeAttribute('data-radix-pointer-events-non-interactive')
		}

		cleanup()
		const timer = setTimeout(cleanup, 50)
		return () => clearTimeout(timer)
	}, [])

	return (
		<SidebarProvider key='settings-layout' className='h-svh bg-background flex flex-col font-sans'>
			<SettingsHeader />

			<div className='flex-1 flex overflow-hidden'>
				<SettingsSidebar />

				<main className='flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 lg:p-12'>
					<div className='max-w-7xl mx-auto'>{children}</div>
				</main>
			</div>

			<MobileNavigation />
		</SidebarProvider>
	)
}

function MobileNavigation() {
	const { openMobile, setOpenMobile } = useSidebar()

	return (
		<>
			{/* Custom Modal Overlay - Managed manually to allow persistent floating button interaction */}
			{openMobile && (
				<button
					type='button'
					onClick={() => setOpenMobile(false)}
					className='fixed inset-0 bg-black/50 z-[70] md:hidden animate-in fade-in duration-500 border-none p-0 cursor-default outline-none'
					aria-label='Close menu'
				/>
			)}

			{/* Single Persistent Floating Button - No unmounting, no layout shifts */}
			<div className='fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] md:hidden'>
				<SidebarTrigger className='h-14 w-14 rounded-full shadow-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all border-4 border-background flex items-center justify-center' />
			</div>
		</>
	)
}
