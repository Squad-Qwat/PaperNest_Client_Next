'use client'

import { LogOut, Menu, Settings, Slash, User, X } from 'lucide-react'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { WorkspaceSwitcher } from '@/components/workspace/WorkspaceSwitcher'
import { useAuth } from '@/context/AuthContext'
import { useLogout } from '@/lib/api/hooks/use-auth'
import { cn } from '@/lib/utils'

interface NavbarProps {
	mode?: 'workspace' | 'document'
	documentId?: string
}

export function Navbar({ mode = 'workspace', documentId }: Readonly<NavbarProps>) {
	const pathname = usePathname()
	const router = useRouter()
	const params = useParams()
	const { user } = useAuth()
	const { mutate: logout } = useLogout()
	const t = useTranslations('Navbar')
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
	const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

	const workspaceId = params.workspaceid as string

	const workspaceMenuItems = [
		{ name: t('overview'), href: `/${workspaceId}` },
		{ name: t('chatbot'), href: `/${workspaceId}/chatbot` },
		{ name: t('review'), href: `/${workspaceId}/reviews` },
		{ name: t('workspaceSettings'), href: `/${workspaceId}/settings` },
	]

	const documentMenuItems = documentId
		? [
				{
					name: t('citations'),
					href: `/${workspaceId}/documents/${documentId}/citations`,
				},
				{
					name: t('reviewsNav'),
					href: `/${workspaceId}/documents/${documentId}/reviews`,
				},
			]
		: []

	const menuItems = mode === 'document' ? documentMenuItems : workspaceMenuItems

	const handleLogout = () => {
		logout()
	}

	const isActive = (href: string) => {
		if (href === `/${workspaceId}`) {
			return pathname === `/${workspaceId}`
		}
		return pathname.startsWith(href)
	}

	if (!user) return null

	return (
		<>
			<nav className='sticky top-0 z-40 bg-background border-b border-border'>
				<div className='mx-auto pt-3 px-4 sm:px-6 lg:px-8'>
					<div className='flex items-center justify-between'>
						<div>
							<div className='flex items-center gap-4'>
								<div className='flex items-center gap-3'>
									<Link
										href='/'
										className='flex items-center gap-2 text-lg font-semibold text-foreground hover:text-muted-foreground transition-colors'
									>
										<span>PaperNest</span>
									</Link>
									<span className='px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded'>
										Hobby
									</span>
								</div>
								<Slash className='text-muted-foreground' />
								<WorkspaceSwitcher currentWorkspaceId={workspaceId} />
							</div>

							<div className='hidden md:flex items-center gap-8'>
								{menuItems.map((item) => (
									<Link
										key={item.href}
										href={item.href}
										className={cn(
											'relative px-1 py-2 text-sm font-normal transition-colors',
											isActive(item.href)
												? 'text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
												: 'text-muted-foreground hover:text-foreground'
										)}
									>
										{item.name}
									</Link>
								))}
							</div>
						</div>

						<div className='hidden md:flex items-center gap-3'>
							<ThemeToggle />

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<button
										type='button'
										className='flex items-center gap-2 p-1.5 hover:bg-accent rounded-lg transition-colors cursor-pointer'
										aria-label='User menu'
									>
										<div className='w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium'>
											{user.name.charAt(0).toUpperCase()}
										</div>
									</button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align='end' className='w-56'>
									<div className='px-2 py-1.5'>
										<p className='text-sm font-medium text-foreground'>{user.name}</p>
										<p className='text-xs text-muted-foreground capitalize'>{user.role}</p>
									</div>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() => router.push('/profile')}
										className='gap-2 cursor-pointer'
									>
										<User className='w-4 h-4' />
										<span>{t('profileSettings')}</span>
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => router.push('/settings')}
										className='gap-2 cursor-pointer'
									>
										<Settings className='w-4 h-4' />
										<span>{t('workspaceSettings')}</span>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() => setShowLogoutConfirm(true)}
										className='gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10'
									>
										<LogOut className='w-4 h-4' />
										<span>{t('logout')}</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>

						<button
							type='button'
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
							className='md:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors'
							aria-label='Toggle menu'
						>
							{isMobileMenuOpen ? <X className='w-6 h-6' /> : <Menu className='w-6 h-6' />}
						</button>
					</div>

					{isMobileMenuOpen && (
						<div className='md:hidden py-4 border-t border-border'>
							<div className='flex flex-col gap-2 mb-4'>
								{menuItems.map((item) => (
									<Link
										key={item.href}
										href={item.href}
										onClick={() => setIsMobileMenuOpen(false)}
										className={cn(
											'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
											isActive(item.href)
												? 'bg-primary text-primary-foreground'
												: 'text-muted-foreground hover:bg-accent hover:text-foreground'
										)}
									>
										{item.name}
									</Link>
								))}
							</div>

							<div className='flex items-center justify-between px-4 py-3 bg-muted rounded-lg border border-border mb-3'>
								<div className='flex items-center gap-3'>
									<button
										type='button'
										onClick={() => {
											setIsMobileMenuOpen(false)
											router.push('/profile')
										}}
										className='w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold'
									>
										{user.name.charAt(0).toUpperCase()}
									</button>
									<div>
										<p className='text-sm font-medium text-foreground'>{user.name}</p>
										<p className='text-xs text-muted-foreground'>{user.role}</p>
									</div>
								</div>
								<ThemeToggle />
							</div>

							<div className='flex gap-2'>
								<button
									type='button'
									onClick={() => {
										setIsMobileMenuOpen(false)
										router.push('/notifications')
									}}
									className='flex-1 px-4 py-2 bg-muted hover:bg-accent text-foreground text-sm font-medium rounded-lg transition-colors'
								>
									{t('notifications')}
								</button>
								<button
									type='button'
									onClick={() => {
										setIsMobileMenuOpen(false)
										setShowLogoutConfirm(true)
									}}
									className='flex-1 px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm font-medium rounded-lg transition-colors'
								>
									{t('logout')}
								</button>
							</div>
						</div>
					)}
				</div>
			</nav>

			<ConfirmDialog
				isOpen={showLogoutConfirm}
				onClose={() => setShowLogoutConfirm(false)}
				onConfirm={handleLogout}
				title={t('confirmLogout')}
				message={t('confirmLogoutMessage')}
				confirmText={t('logout')}
				variant='danger'
			/>
		</>
	)
}
