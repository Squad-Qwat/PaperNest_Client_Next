'use client'

import type { Icon } from '@tabler/icons-react'
import Link from 'next/link'
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
	}[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
	return (
		<SidebarGroup {...props}>
			<SidebarGroupContent>
				<SidebarMenu>
					{items.map((item) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton onClick={item.onClick} asChild={!item.onClick}>
								{item.onClick ? (
									<div className='flex items-center gap-2 w-full cursor-pointer'>
										<item.icon className='size-4' />
										<span>{item.title}</span>
									</div>
								) : (
									<Link href={item.url}>
										<item.icon className='size-4' />
										<span>{item.title}</span>
									</Link>
								)}
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	)
}
