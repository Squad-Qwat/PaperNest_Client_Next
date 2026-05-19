'use client'

import { type Icon, IconCirclePlusFilled } from '@tabler/icons-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar'

export function NavMain({
	onCreateDocument,
	items,
}: {
	onCreateDocument?: () => void
	items: {
		title: string
		url: string
		icon?: Icon
	}[]
}) {
	const pathname = usePathname()

	const isItemActive = (url: string) => {
		if (!url || url === '#') return false
		if (pathname === url) return true

		const pathParts = pathname.split('/').filter(Boolean)
		const urlParts = url.split('/').filter(Boolean)

		if (urlParts.length === 1) {
			return (
				pathParts[0] === urlParts[0] && (pathParts.length === 1 || pathParts[1] === 'documents')
			)
		}

		return pathname.startsWith(url)
	}

	return (
		<SidebarGroup>
			<SidebarGroupContent className='flex flex-col gap-2'>
				<SidebarMenu>
					<SidebarMenuItem className='flex items-center gap-2'>
						<SidebarMenuButton
							tooltip='Create Document'
							onClick={onCreateDocument}
							className='min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary/10 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground group-data-[collapsible=icon]:justify-center'
						>
							<IconCirclePlusFilled className='shrink-0' />
							<span className='group-data-[collapsible=icon]:hidden'>Create Document</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
				<SidebarMenu>
					{items.map((item) => {
						const active = isItemActive(item.url)
						return (
							<SidebarMenuItem key={item.title}>
								<SidebarMenuButton asChild tooltip={item.title} isActive={active}>
									<Link href={item.url}>
										{item.icon && <item.icon />}
										<span>{item.title}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						)
					})}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	)
}
