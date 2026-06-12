'use client'

import {
	IconFileDescription,
	IconInbox,
	IconMessage2,
	IconQuote,
	IconSettings,
	IconUserPlus,
} from '@tabler/icons-react'
import { useParams, usePathname } from 'next/navigation'
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
import { getMediaUrl } from '@/lib/utils'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { user, loading: authLoading } = useAuth()
	const { unreadCount } = useNotifications()
	const params = useParams()
	const pathname = usePathname()
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
			avatar: getMediaUrl(user?.photoURL) || '',
		},
		navMain: [
			{
				title: 'Documents',
				url: `/${workspaceId}`,
				icon: IconFileDescription,
				isActive: pathname === `/${workspaceId}`,
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
				title: 'Workspace Settings',
				url: `/${workspaceId}/settings`,
				icon: IconSettings,
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
