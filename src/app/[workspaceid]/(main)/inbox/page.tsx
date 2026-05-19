'use client'

import {
	IconBell,
	IconCheck,
	IconChecks,
	IconMessage,
	IconTrash,
	IconUserPlus,
} from '@tabler/icons-react'
import { formatDistanceToNow } from 'date-fns'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNotifications } from '@/context/NotificationContext'
import { cn } from '@/lib/utils'

export default function InboxPage() {
	const params = useParams()
	const router = useRouter()
	const workspaceId = params.workspaceid as string
	const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, deleteNotification } =
		useNotifications()

	const handleNotificationClick = async (notification: any) => {
		if (!notification.isRead) {
			await markAsRead(notification.notificationId)
		}

		// Routing logic based on type
		if (notification.type === 'comment' || notification.type === 'comment_reply') {
			// Assuming relatedId is commentId, we might need documentId.
			// In our current implementation, we might need to fetch the documentId related to the comment.
			// For now, let's assume we can navigate somewhere.
			// If relatedId is an ID but we don't know the exact path, we'll need to improve the notification schema.
			// For invitations, it's easier.
		} else if (notification.type === 'invitation') {
			router.push(`/${workspaceId}/invitations`)
		}
	}

	const renderNotificationIcon = (type: string) => {
		switch (type) {
			case 'comment':
			case 'comment_reply':
				return <IconMessage className='h-5 w-5 text-teal-600' />
			case 'invitation':
				return <IconUserPlus className='h-5 w-5 text-blue-600' />
			default:
				return <IconBell className='h-5 w-5 text-gray-600' />
		}
	}

	if (isLoading) {
		return (
			<div className='flex h-full items-center justify-center'>
				<div className='h-32 w-32 animate-pulse rounded-full bg-primary/10' />
			</div>
		)
	}

	return (
		<div className='flex h-full flex-col p-6 overflow-hidden'>
			<div className='mb-6 flex items-center justify-between'>
				<div>
					<h1 className='text-3xl font-bold tracking-tight'>Inbox</h1>
					<p className='text-muted-foreground'>Manage your notifications and alerts</p>
				</div>
				<div className='flex gap-2'>
					{unreadCount > 0 && (
						<Button variant='outline' size='sm' onClick={markAllAsRead}>
							<IconChecks className='mr-2 h-4 w-4' />
							Mark all as read
						</Button>
					)}
				</div>
			</div>

			<Tabs defaultValue='all' className='flex-1 flex flex-col min-h-0'>
				<TabsList className='mb-4'>
					<TabsTrigger value='all' className='gap-2'>
						All
						{notifications.length > 0 && (
							<Badge variant='secondary' className='h-5 px-1.5'>
								{notifications.length}
							</Badge>
						)}
					</TabsTrigger>
					<TabsTrigger value='unread' className='gap-2'>
						Unread
						{unreadCount > 0 && (
							<Badge className='h-5 px-1.5 bg-primary text-primary-foreground'>{unreadCount}</Badge>
						)}
					</TabsTrigger>
					<TabsTrigger value='comments'>Comments</TabsTrigger>
					<TabsTrigger value='invitations'>Invitations</TabsTrigger>
				</TabsList>

				<ScrollArea className='flex-1'>
					<div className='space-y-4 pr-4'>
						<TabsContent value='all' className='m-0 space-y-4'>
							{notifications.length === 0 ? (
								<EmptyState />
							) : (
								notifications.map((n) => (
									<NotificationCard
										key={n.notificationId}
										notification={n}
										onClick={() => handleNotificationClick(n)}
										onMarkRead={() => markAsRead(n.notificationId)}
										onDelete={() => deleteNotification(n.notificationId)}
										renderIcon={renderNotificationIcon}
									/>
								))
							)}
						</TabsContent>

						<TabsContent value='unread' className='m-0 space-y-4'>
							{notifications.filter((n) => !n.isRead).length === 0 ? (
								<EmptyState message='No unread notifications' />
							) : (
								notifications
									.filter((n) => !n.isRead)
									.map((n) => (
										<NotificationCard
											key={n.notificationId}
											notification={n}
											onClick={() => handleNotificationClick(n)}
											onMarkRead={() => markAsRead(n.notificationId)}
											onDelete={() => deleteNotification(n.notificationId)}
											renderIcon={renderNotificationIcon}
										/>
									))
							)}
						</TabsContent>

						<TabsContent value='comments' className='m-0 space-y-4'>
							{notifications.filter((n) => n.type.includes('comment')).length === 0 ? (
								<EmptyState message='No comment notifications' />
							) : (
								notifications
									.filter((n) => n.type.includes('comment'))
									.map((n) => (
										<NotificationCard
											key={n.notificationId}
											notification={n}
											onClick={() => handleNotificationClick(n)}
											onMarkRead={() => markAsRead(n.notificationId)}
											onDelete={() => deleteNotification(n.notificationId)}
											renderIcon={renderNotificationIcon}
										/>
									))
							)}
						</TabsContent>

						<TabsContent value='invitations' className='m-0 space-y-4'>
							{notifications.filter((n) => n.type === 'invitation').length === 0 ? (
								<EmptyState message='No invitations' />
							) : (
								notifications
									.filter((n) => n.type === 'invitation')
									.map((n) => (
										<NotificationCard
											key={n.notificationId}
											notification={n}
											onClick={() => handleNotificationClick(n)}
											onMarkRead={() => markAsRead(n.notificationId)}
											onDelete={() => deleteNotification(n.notificationId)}
											renderIcon={renderNotificationIcon}
										/>
									))
							)}
						</TabsContent>
					</div>
				</ScrollArea>
			</Tabs>
		</div>
	)
}

function NotificationCard({
	notification,
	onClick,
	onMarkRead,
	onDelete,
	renderIcon,
}: {
	notification: any
	onClick: () => void
	onMarkRead: () => void
	onDelete: () => void
	renderIcon: (type: string) => React.ReactNode
}) {
	return (
		<Card
			className={cn(
				'cursor-pointer transition-colors hover:bg-muted/50 relative overflow-hidden',
				!notification.isRead && 'border-l-4 border-l-primary bg-primary/5'
			)}
			onClick={onClick}
		>
			{!notification.isRead && (
				<div className='absolute top-4 right-4 h-2 w-2 rounded-full bg-primary' />
			)}
			<CardHeader className='flex flex-row items-start gap-4 space-y-0 p-4'>
				<div className='mt-1 rounded-full bg-background p-2 shadow-sm border'>
					{renderIcon(notification.type)}
				</div>
				<div className='flex-1 space-y-1'>
					<div className='flex items-center justify-between'>
						<CardTitle className='text-base font-semibold'>{notification.title}</CardTitle>
						<span className='text-xs text-muted-foreground'>
							{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
						</span>
					</div>
					<CardDescription className='text-sm text-foreground/90'>
						{notification.message}
					</CardDescription>
				</div>
				<div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
					{!notification.isRead && (
						<Button
							variant='ghost'
							size='icon'
							className='h-8 w-8 text-muted-foreground hover:text-primary'
							onClick={(e) => {
								e.stopPropagation()
								onMarkRead()
							}}
						>
							<IconCheck className='h-4 w-4' />
						</Button>
					)}
					<Button
						variant='ghost'
						size='icon'
						className='h-8 w-8 text-muted-foreground hover:text-destructive'
						onClick={(e) => {
							e.stopPropagation()
							onDelete()
						}}
					>
						<IconTrash className='h-4 w-4' />
					</Button>
				</div>
			</CardHeader>
		</Card>
	)
}

function EmptyState({ message = "You're all caught up!" }: { message?: string }) {
	return (
		<div className='flex flex-col items-center justify-center py-20 text-center'>
			<div className='rounded-full bg-muted p-6 mb-4'>
				<IconBell className='h-10 w-10 text-muted-foreground/50' />
			</div>
			<h3 className='text-lg font-medium'>{message}</h3>
			<p className='text-muted-foreground text-sm max-w-xs mt-1'>
				Notifications about comments, reviews, and invitations will appear here.
			</p>
		</div>
	)
}
