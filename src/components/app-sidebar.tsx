'use client'

import {
	IconBook,
	IconFileDescription,
	IconHelp,
	IconInbox,
	IconMessage2,
	IconQuote,
	IconSettings,
	IconUserPlus,
} from '@tabler/icons-react'
import { useParams } from 'next/navigation'
import * as React from 'react'
import { CreateDocumentModal } from '@/components/document/CreateDocumentModal'
import { SidebarSkeleton } from '@/components/layout/DashboardSkeleton'
import { NavMain } from '@/components/nav-main'
import { NavSecondary } from '@/components/nav-secondary'
import { NavUser } from '@/components/nav-user'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar'
import { InviteMembersModal } from '@/components/workspace/InviteMembersModal'
import { WorkspaceSwitcher } from '@/components/workspace/WorkspaceSwitcher'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/context/NotificationContext'
import { useWorkspace, useWorkspaces } from '@/lib/api/hooks/use-workspaces'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { user, loading: authLoading } = useAuth()
	const { unreadCount } = useNotifications()
	const params = useParams()
	const workspaceId = params.workspaceid as string
	const { data: workspace, isLoading: workspaceLoading } = useWorkspace(workspaceId)
	const { isLoading: workspacesLoading } = useWorkspaces()
	const [showCreateModal, setShowCreateModal] = React.useState(false)
	const [showInviteModal, setShowInviteModal] = React.useState(false)

	if (authLoading || (workspaceId && workspaceLoading) || workspacesLoading) {
		return <SidebarSkeleton />
	}

	const isOwner = user?.userId === workspace?.ownerId

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
				isActive: true,
			},
			{
				title: 'Inbox',
				url: `/${workspaceId}/inbox`,
				icon: IconInbox,
				badge: unreadCount > 0 ? unreadCount : undefined,
			},
			{
				title: 'Reviews',
				url: `/${workspaceId}/reviews`,
				icon: IconMessage2,
			},
			{
				title: 'Citations',
				url: `/${workspaceId}/citations`,
				icon: IconQuote,
			},
		],
		navSecondary: [
			...(isOwner
				? [
						{
							title: 'Invite Members',
							url: '#',
							icon: IconUserPlus,
							onClick: () => setShowInviteModal(true),
						},
					]
				: []),
			{
				title: 'Settings',
				url: `/${workspaceId}/settings`,
				icon: IconSettings,
			},
			{
				title: 'Guide',
				url: '/guide',
				icon: IconBook,
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
			<CreateDocumentModal
				isOpen={showCreateModal}
				onClose={() => setShowCreateModal(false)}
				workspaceId={workspaceId}
			/>
			{workspace && (
				<InviteMembersModal
					isOpen={showInviteModal}
					onClose={() => setShowInviteModal(false)}
					workspaceId={workspaceId}
					workspaceName={workspace.title}
				/>
			)}
		</Sidebar>
	)
}
