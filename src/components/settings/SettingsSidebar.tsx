'use client'

import { IconCreditCard, IconUser } from '@tabler/icons-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
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

export function SettingsSidebar() {
	const pathname = usePathname()
	const locale = useLocale()
	const { setOpenMobile, isMobile } = useSidebar()
	const t = useTranslations('Settings')

	// Strip locale prefix: /en/settings/profile → /settings/profile
	const normalizedPathname = pathname.startsWith(`/${locale}`)
		? pathname.slice(`/${locale}`.length) || '/'
		: pathname

	const accountItems = [{ title: t('profileSettings'), icon: IconUser, href: '/settings/profile' }]

	const billingItems = [
		{ title: t('billingInformation'), icon: IconCreditCard, href: '/settings/billing' },
	]

	const renderMenuItems = (
		items: { title: string; icon: any; href: string; disabled?: boolean }[]
	) => (
		<SidebarMenu>
			{items.map((item) => {
				const Icon = item.icon
				const isActive = normalizedPathname === item.href
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
			collapsible='none'
			mobileWidth='100%'
			mobileSide='bottom'
			modal={false}
			mobileClassName='z-[80]'
			className='border-r bg-muted/30'
		>
			<SidebarContent className='p-2'>
				<SidebarGroup>
					<SidebarGroupLabel className='px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
						{t('accountSettings')}
					</SidebarGroupLabel>
					<SidebarGroupContent>{renderMenuItems(accountItems)}</SidebarGroupContent>
				</SidebarGroup>

				<SidebarGroup>
					<SidebarGroupLabel className='px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
						{t('billingPayments')}
					</SidebarGroupLabel>
					<SidebarGroupContent>{renderMenuItems(billingItems)}</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	)
}
