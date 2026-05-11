'use client'

import {
	IconBook,
	IconFileDescription,
	IconHelp,
	IconMessage2,
	IconQuote,
	IconSettings,
} from '@tabler/icons-react'
import { useParams, usePathname } from 'next/navigation'
import * as React from 'react'
import { CreateDocumentModal } from '@/components/document/CreateDocumentModal'
import { NavMain } from '@/components/nav-main'
import { NavSecondary } from '@/components/nav-secondary'
import { NavUser } from '@/components/nav-user'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar'
import { WorkspaceSettingsModal } from '@/components/workspace/WorkspaceSettingsModal'
import { WorkspaceSwitcher } from '@/components/workspace/WorkspaceSwitcher'
import { useAuth } from '@/context/AuthContext'
import { useWorkspace } from '@/lib/api/hooks/use-workspaces'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { user } = useAuth()
	const params = useParams()
	const workspaceId = (params.workspaceid as string) || ''
	const { data: workspace } = useWorkspace(workspaceId)
	const [showSettingsModal, setShowSettingsModal] = React.useState(false)
	const [showCreateModal, setShowCreateModal] = React.useState(false)

	const pathname = usePathname()
	const data = {
		user: {
			name: user?.name || user?.email?.split('@')[0] || 'User',
			email: user?.email || '',
			avatar: user?.photoURL || '',
		},
		navMain: [
			{
				title: 'Documents',
				url: `/${workspaceId}`,
				icon: IconFileDescription,
				isActive: pathname === `/${workspaceId}`,
			},
			{
				title: 'Reviews',
				url: `/${workspaceId}/reviews`,
				icon: IconMessage2,
				isActive: pathname === `/${workspaceId}/reviews`,
			},
			{
				title: 'Citations',
				url: `/${workspaceId}/citations`,
				icon: IconQuote,
				isActive: pathname === `/${workspaceId}/citations`,
			},
		],
		navSecondary: [
			{
				title: 'Settings',
				url: '#',
				icon: IconSettings,
				onClick: () => setShowSettingsModal(true),
			},
			{
				title: 'Guide',
				url: '/guide',
				icon: IconBook,
				isActive: pathname === '/guide',
			},
			{
				title: 'Help',
				url: '#',
				icon: IconHelp,
			},
		],
	}

	return (
		<Sidebar variant='inset' collapsible='icon' {...props}>
			<SidebarHeader>
				<WorkspaceSwitcher currentWorkspaceId={workspaceId} />
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.navMain} onCreateDocument={() => setShowCreateModal(true)} />
				<NavSecondary items={data.navSecondary} className='mt-auto' />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={data.user} />
			</SidebarFooter>
			{workspace && (
				<WorkspaceSettingsModal
					isOpen={showSettingsModal}
					onClose={() => setShowSettingsModal(false)}
					workspace={workspace}
				/>
			)}
			<CreateDocumentModal
				isOpen={showCreateModal}
				onClose={() => setShowCreateModal(false)}
				workspaceId={workspaceId}
			/>
		</Sidebar>
	)
}
