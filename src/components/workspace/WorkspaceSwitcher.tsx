/**
 * Workspace Switcher Component
 * Dropdown to switch between workspaces and create new ones
 */

'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthContext } from '@/context/AuthContext'
import { useWorkspaces } from '@/lib/api/hooks/use-workspaces'
import { CreateWorkspaceModal } from './CreateWorkspaceModal'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface WorkspaceSwitcherProps {
	currentWorkspaceId?: string
}

export function WorkspaceSwitcher({ currentWorkspaceId }: WorkspaceSwitcherProps) {
	const router = useRouter()
	const pathname = usePathname()
	const { user } = useAuthContext()
	const { data: workspacesResponse, isLoading: loading, refetch } = useWorkspaces()
	const workspaces = workspacesResponse?.workspaces || []
	const [showCreateModal, setShowCreateModal] = useState(false)

	const currentWorkspace = workspaces.find((w) => w.workspaceId === currentWorkspaceId)

	const handleSwitchWorkspace = (workspaceId: string) => {
		// If we're on a workspace page, navigate to the new workspace
		// Otherwise, just navigate to the workspace
		if (pathname?.startsWith('/') && currentWorkspaceId) {
			const newPath = pathname.replace(currentWorkspaceId, workspaceId)
			router.push(newPath)
		} else {
			router.push(`/${workspaceId}`)
		}
	}

	const handleWorkspaceCreated = async () => {
		// Refetch workspaces after creation
		await refetch()
	}

	if (!user || loading) {
		return (
			<Button variant='outline' disabled>
				<span className='text-sm'>Loading...</span>
			</Button>
		)
	}

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant='outline' className='gap-2'>
						<span className='text-lg'>
							{currentWorkspace ? currentWorkspace.icon || '📚' : '🏠'}
						</span>
						<span className='hidden sm:inline text-sm font-medium'>
							{currentWorkspace?.title || 'Select Workspace'}
						</span>
						<svg
							className='w-4 h-4 opacity-50'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M19 9l-7 7-7-7'
							/>
						</svg>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='start' className='w-56'>
					<DropdownMenuLabel>Your Workspaces</DropdownMenuLabel>
					<DropdownMenuSeparator />

					{workspaces.length === 0 ? (
						<div className='px-2 py-6 text-center text-sm text-gray-500'>No workspaces yet</div>
					) : (
						workspaces.map((workspace) => (
							<DropdownMenuItem
								key={workspace.workspaceId}
								onClick={() => handleSwitchWorkspace(workspace.workspaceId)}
								className={`cursor-pointer ${
									workspace.workspaceId === currentWorkspaceId ? 'bg-blue-50 text-teal-700' : ''
								}`}
							>
								<span className='mr-2'>{workspace.icon || '📚'}</span>
								<div className='flex-1 min-w-0'>
									<div className='font-medium truncate'>{workspace.title}</div>
									{workspace.description && (
										<div className='text-xs text-gray-500 truncate'>{workspace.description}</div>
									)}
								</div>
								{workspace.workspaceId === currentWorkspaceId && (
									<span className='ml-2 text-teal-600'>✓</span>
								)}
							</DropdownMenuItem>
						))
					)}

					<DropdownMenuSeparator />
					<DropdownMenuItem
						onClick={() => setShowCreateModal(true)}
						className='cursor-pointer font-medium text-teal-600'
					>
						<Plus className='mr-2 h-4 w-4 text-teal-600' />
						Create New Workspace
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<CreateWorkspaceModal
				isOpen={showCreateModal}
				onClose={() => setShowCreateModal(false)}
				onSuccess={handleWorkspaceCreated}
			/>
		</>
	)
}
