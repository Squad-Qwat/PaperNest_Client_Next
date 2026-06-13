'use client'
import { Check, ChevronsUpDown, GalleryVerticalEnd, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import * as React from 'react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { useWorkspaces } from '@/lib/api/hooks/use-workspaces'
import { CreateWorkspaceModal } from './CreateWorkspaceModal'

interface WorkspaceSwitcherProps {
	currentWorkspaceId?: string
}

export function WorkspaceSwitcher({ currentWorkspaceId }: WorkspaceSwitcherProps) {
	const router = useRouter()
	const { data: workspacesResponse } = useWorkspaces()
	const workspaces = workspacesResponse?.workspaces || []
	const [showCreateModal, setShowCreateModal] = React.useState(false)
	const t = useTranslations('Workspace')

	const currentWorkspace = workspaces.find((w) => w.workspaceId === currentWorkspaceId)

	return (
		<>
			<SidebarMenu>
				<SidebarMenuItem>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<SidebarMenuButton
								size='lg'
								className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
							>
								<div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground'>
									{currentWorkspace?.icon ? (
										<span className='text-sm'>{currentWorkspace.icon}</span>
									) : (
										<GalleryVerticalEnd className='size-4' />
									)}
								</div>
								<div className='flex flex-col gap-0.5 leading-none overflow-hidden'>
									<span className='font-semibold truncate'>
										{currentWorkspace?.title || 'PaperNest'}
									</span>
									<span className='text-xs text-muted-foreground truncate'>{t('label')}</span>
								</div>
								<ChevronsUpDown className='ml-auto size-4 opacity-50' />
							</SidebarMenuButton>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							className='w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg'
							align='start'
							side='bottom'
							sideOffset={4}
						>
							<DropdownMenuLabel className='text-xs text-muted-foreground'>
								{t('workspaces')}
							</DropdownMenuLabel>
							{workspaces.map((workspace) => (
								<DropdownMenuItem
									key={workspace.workspaceId}
									onClick={() => router.push(`/${workspace.workspaceId}`)}
									className='gap-2 p-2 cursor-pointer'
								>
									<div className='flex size-6 items-center justify-center rounded-sm border'>
										<span className='text-xs'>{workspace.icon || '📚'}</span>
									</div>
									<span className='flex-1 truncate'>{workspace.title}</span>
									{workspace.workspaceId === currentWorkspaceId && (
										<Check className='size-4 text-primary' />
									)}
								</DropdownMenuItem>
							))}
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className='gap-2 p-2 cursor-pointer font-medium text-primary'
								onClick={() => setShowCreateModal(true)}
							>
								<div className='flex size-6 items-center justify-center rounded-md border bg-background'>
									<Plus className='size-4' />
								</div>
								<div className='font-medium'>{t('addWorkspace')}</div>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</SidebarMenuItem>
			</SidebarMenu>

			<CreateWorkspaceModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
		</>
	)
}
