'use client'

import type { Icon } from '@tabler/icons-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import type * as React from 'react'
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar'

export function NavSecondary({
	items,
	...props
}: {
	items: {
		title: string
		url: string
		icon: Icon
		onClick?: () => void
		isActive?: boolean
	}[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
	const pathname = usePathname()
	const locale = useLocale()

	// Strip locale prefix: /en/... → /...
	const normalizedPathname = pathname.startsWith(`/${locale}`)
		? pathname.slice(`/${locale}`.length) || '/'
		: pathname

	const isItemActive = (url: string) => {
		if (!url || url === '#' || url.startsWith('#')) return false
		if (normalizedPathname === url) return true

		const pathParts = normalizedPathname.split('/').filter(Boolean)
		const urlParts = url.split('/').filter(Boolean)

		if (urlParts.length === 1) {
			return (
				pathParts[0] === urlParts[0] && (pathParts.length === 1 || pathParts[1] === 'documents')
			)
		}

		return normalizedPathname.startsWith(url)
	}

	return (
		<SidebarGroup {...props}>
			<SidebarGroupContent>
				<SidebarMenu>
					{items.map((item) => {
						const active = isItemActive(item.url)
						return (
							<SidebarMenuItem key={item.title}>
								<SidebarMenuButton
									onClick={item.onClick}
									asChild={!item.onClick}
									tooltip={item.title}
									isActive={active}
								>
									{item.onClick ? (
										<>
											<item.icon className='size-4 shrink-0' />
											<span>{item.title}</span>
										</>
									) : (
										<Link href={item.url}>
											<item.icon className='size-4 shrink-0' />
											<span>{item.title}</span>
										</Link>
									)}
								</SidebarMenuButton>
							</SidebarMenuItem>
						)
					})}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	)
}
