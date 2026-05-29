'use client'

import { IconCreditCard, IconKey, IconReceipt, IconUser } from '@tabler/icons-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

const accountItems = [{ title: 'Profile', icon: IconUser, href: '/settings/profile' }]

const billingItems = [
	{ title: 'Billing Information', icon: IconCreditCard, href: '/settings/billing' },
	{ title: 'Invoices', icon: IconReceipt, href: '/settings/invoices', disabled: true },
	{ title: 'Tokens', icon: IconKey, href: '/settings/tokens', disabled: true },
]

export function SettingsSidebar() {
	const pathname = usePathname()
	const { setOpenMobile, isMobile } = useSidebar()

	const renderMenuItems = (
		items: { title: string; icon: any; href: string; disabled?: boolean }[]
	) => (
		<SidebarMenu>
			{items.map((item) => {
				const Icon = item.icon
				const isActive = pathname === item.href
				const isDisabled = !!item.disabled

				return (
					<SidebarMenuItem key={item.title}>
						<SidebarMenuButton
							asChild
							isActive={isActive}
							tooltip={item.title}
							disabled={isDisabled}
							onClick={() => {
								if (isMobile) setOpenMobile(false)
							}}
							className={cn(
								isActive &&
									'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
								isDisabled && 'pointer-events-none'
							)}
						>
							<Link href={isDisabled ? '#' : item.href}>
								<Icon className='size-4' />
								<span>{item.title}</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				)
			})}
		</SidebarMenu>
	)

	return (
		<Sidebar
			mobileWidth='100%'
			mobileSide='bottom'
			modal={false}
			mobileClassName='z-[80]'
			className='border-r bg-muted/30'
		>
			<SidebarContent className='p-2'>
				<SidebarGroup>
					<SidebarGroupLabel className='px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
						Account Settings
					</SidebarGroupLabel>
					<SidebarGroupContent>{renderMenuItems(accountItems)}</SidebarGroupContent>
				</SidebarGroup>

				<SidebarGroup>
					<SidebarGroupLabel className='px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
						Billing & Payments
					</SidebarGroupLabel>
					<SidebarGroupContent>{renderMenuItems(billingItems)}</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	)
}
