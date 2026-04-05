'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useLogout } from '@/lib/api/hooks/use-auth'
import { WorkspaceSwitcher } from '@/components/workspace/WorkspaceSwitcher'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { cn } from '@/lib/utils'
import { Slash, Bell, LogOut, User, Settings } from 'lucide-react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface NavbarProps {
	mode?: 'workspace' | 'document'
	documentId?: string
}

export function Navbar({ mode = 'workspace', documentId }: NavbarProps) {
	const pathname = usePathname()
	const router = useRouter()
	const params = useParams()
	const { user } = useAuth()
	const { mutate: logout } = useLogout()
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
	const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

	const workspaceId = params.workspaceid as string

	// Main workspace menu items
	const workspaceMenuItems = [
		{ name: 'Overview', href: `/${workspaceId}` },
		{ name: 'Chatbot', href: `/${workspaceId}/chatbot` },
		{ name: 'Review', href: `/${workspaceId}/reviews` },
		{ name: 'Settings', href: `/${workspaceId}/settings` },
	]

	// Document-specific menu items
	const documentMenuItems = documentId
		? [
			{
				name: 'Citations',
				href: `/${workspaceId}/documents/${documentId}/citations`,
			},
			{
				name: 'Reviews',
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
			<nav className='sticky top-0 z-40 bg-white border-b'>
				<div className='mx-auto pt-3 px-4 sm:px-6 lg:px-8'>
					<div className='flex items-center justify-between'>
						{/* Logo/Brand & Workspace Switcher */}
						<div className=''>
							<div className='flex items-center gap-4'>
								<div className='flex items-center gap-3'>
									<Link
										href='/'
										className='flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-gray-700 transition-colors'
									>
										<span>PaperNest</span>
									</Link>
									<span className='px-2 py-0.5 bg-primary text-white text-xs font-medium rounded'>
										Hobby
									</span>
								</div>
								<Slash className='text-gray-400' />
								<WorkspaceSwitcher currentWorkspaceId={workspaceId} />
							</div>

							{/* Desktop Menu */}
							<div className='hidden md:flex items-center gap-8'>
								{menuItems.map((item) => (
									<Link
										key={item.href}
										href={item.href}
										className={cn(
											'relative px-1 py-2 text-sm font-normal transition-colors',
											isActive(item.href)
												? 'text-gray-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
												: 'text-gray-600 hover:text-gray-900'
										)}
									>
										{item.name}
									</Link>
								))}
							</div>
						</div>

						{/* User Actions */}
						<div className='hidden md:flex items-center gap-3'>
							{/* Notifications Button */}
							<button
								onClick={() => router.push('/notifications')}
								className='p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors'
								aria-label='Notifications'
								title='Notifications'
							>
								<Bell className='w-5 h-5' />
							</button>

							{/* User Menu Dropdown */}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<button
										className='flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors'
										aria-label='User menu'
									>
										<div className='w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium'>
											{user.name.charAt(0).toUpperCase()}
										</div>
									</button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align='end' className='w-56'>
									<div className='px-2 py-1.5'>
										<p className='text-sm font-medium text-gray-900'>{user.name}</p>
										<p className='text-xs text-gray-500 capitalize'>{user.role}</p>
									</div>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={() => router.push('/profile')} className='gap-2 cursor-pointer'>
										<User className='w-4 h-4' />
										<span>Profile</span>
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => router.push('/settings')} className='gap-2 cursor-pointer'>
										<Settings className='w-4 h-4' />
										<span>Settings</span>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() => setShowLogoutConfirm(true)}
										className='gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50'
									>
										<LogOut className='w-4 h-4' />
										<span>Logout</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>

						{/* Mobile Menu Button */}
						<button
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
							className='md:hidden p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors'
							aria-label='Toggle menu'
						>
							{isMobileMenuOpen ? (
								<svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M6 18L18 6M6 6l12 12'
									/>
								</svg>
							) : (
								<svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M4 6h16M4 12h16M4 18h16'
									/>
								</svg>
							)}
						</button>
					</div>

					{/* Mobile Menu */}
					{isMobileMenuOpen && (
						<div className='md:hidden py-4 border-t border-gray-800'>
							<div className='flex flex-col gap-2 mb-4'>
								{menuItems.map((item) => (
									<Link
										key={item.href}
										href={item.href}
										onClick={() => setIsMobileMenuOpen(false)}
										className={cn(
											'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
											isActive(item.href)
												? 'bg-blue-600 text-white'
												: 'text-gray-300 hover:bg-gray-800'
										)}
									>
										{item.name}
									</Link>
								))}
							</div>

							<div className='flex items-center gap-3 px-4 py-3 bg-gray-900 rounded-lg border border-gray-800 mb-3'>
								<button
									onClick={() => {
										setIsMobileMenuOpen(false)
										router.push('/profile')
									}}
									className='w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold'
								>
									{user.name.charAt(0).toUpperCase()}
								</button>
								<div>
									<p className='text-sm font-medium text-gray-200'>{user.name}</p>
									<p className='text-xs text-gray-500'>{user.role}</p>
								</div>
							</div>

							<div className='flex gap-2'>
								<button
									onClick={() => {
										setIsMobileMenuOpen(false)
										router.push('/notifications')
									}}
									className='flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium rounded-lg transition-colors'
								>
									Notifications
								</button>
								<button
									onClick={() => {
										setIsMobileMenuOpen(false)
										setShowLogoutConfirm(true)
									}}
									className='flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors'
								>
									Logout
								</button>
							</div>
						</div>
					)}
				</div>
			</nav>

			{/* Logout Confirmation Dialog */}
			<ConfirmDialog
				isOpen={showLogoutConfirm}
				onClose={() => setShowLogoutConfirm(false)}
				onConfirm={handleLogout}
				title='Confirm Logout'
				message='Are you sure you want to logout?'
				confirmText='Logout'
				variant='danger'
			/>
		</>
	)
}
