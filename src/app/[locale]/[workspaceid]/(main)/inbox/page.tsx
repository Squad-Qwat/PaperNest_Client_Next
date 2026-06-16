'use client'

import {
	IconBell,
	IconCheck,
	IconChecks,
	IconCircleCheck,
	IconClipboardCheck,
	IconMessage,
	IconTrash,
	IconUserPlus,
} from '@tabler/icons-react'
import { formatDistanceToNow } from 'date-fns'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Badge } from '@/components/ui/badge'
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNotifications } from '@/context/NotificationContext'
import { useWorkspace } from '@/lib/api/hooks/use-workspaces'
import { cn } from '@/lib/utils'

export default function InboxPage() {
	const params = useParams()
	const router = useRouter()
	const workspaceId = params.workspaceid as string
	const t = useTranslations('Inbox')
	const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, deleteNotification } =
		useNotifications()
	const { data: workspace } = useWorkspace(workspaceId)

	const handleNotificationClick = async (notification: any) => {
		if (notification.isRead) return

		if (!notification.isRead) {
			await markAsRead(notification.notificationId)
		}

		if (notification.type === 'comment' || notification.type === 'comment_reply') {
			if (notification.relatedId) {
				router.push(`/${workspaceId}/documents/${notification.relatedId}`)
			}
		} else if (notification.type === 'invitation') {
			router.push(`/${workspaceId}/invitations`)
		} else if (notification.type === 'review_request' || notification.type === 'review_completed') {
			if (notification.relatedId) {
				router.push(`/${workspaceId}/reviews/${notification.relatedId}`)
			}
		}
	}

	const renderNotificationIcon = (type: string) => {
		switch (type) {
			case 'comment':
			case 'comment_reply':
				return <IconMessage className='h-5 w-5 text-teal-600' />
			case 'invitation':
				return <IconUserPlus className='h-5 w-5 text-blue-600' />
			case 'review_request':
				return <IconClipboardCheck className='h-5 w-5 text-amber-600' />
			case 'review_completed':
				return <IconCircleCheck className='h-5 w-5 text-green-600' />
			default:
				return <IconBell className='h-5 w-5 text-muted-foreground' />
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
		<>
			<header className='flex h-16 shrink-0 items-center justify-between gap-2 px-4 bg-background border-b border-border sticky top-0 z-30 rounded-t-2xl'>
				<div className='flex items-center gap-2'>
					<SidebarTrigger className='-ml-1' />
					<Separator orientation='vertical' className='mr-2 h-4' />
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem className='hidden md:block'>
								<BreadcrumbLink href='#'>PaperNest</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className='hidden md:block' />
							<BreadcrumbItem>
								<BreadcrumbLink href={`/${workspaceId}`}>{workspace?.title}</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className='hidden md:block' />
							<BreadcrumbItem>
								<BreadcrumbPage>{t('breadcrumb')}</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
				<div className='ml-auto'>
					<ThemeToggle />
				</div>
			</header>

			<div className='flex-1 p-6 flex flex-col min-h-0 overflow-hidden'>
				<div className='mb-8 flex items-center justify-between'>
					<div>
						<h2 className='text-2xl font-bold text-foreground'>{t('title')}</h2>
						<p className='text-sm text-muted-foreground mt-1'>
							{t('subtitle', { name: workspace?.title ?? '' })}
						</p>
					</div>
					<div className='flex gap-2'>
						{unreadCount > 0 && (
							<Button variant='outline' size='sm' onClick={markAllAsRead}>
								<IconChecks className='mr-2 h-4 w-4' />
								{t('markAllRead')}
							</Button>
						)}
					</div>
				</div>

				<Tabs defaultValue='all' className='flex-1 flex flex-col min-h-0'>
					<TabsList className='mb-4'>
						<TabsTrigger value='all' className='gap-2'>
							{t('tabAll')}
							{notifications.length > 0 && (
								<Badge variant='secondary' className='h-5 px-1.5'>
									{notifications.length}
								</Badge>
							)}
						</TabsTrigger>
						<TabsTrigger value='unread' className='gap-2'>
							{t('tabUnread')}
							{unreadCount > 0 && (
								<Badge className='h-5 px-1.5 bg-primary text-primary-foreground'>
									{unreadCount}
								</Badge>
							)}
						</TabsTrigger>
						<TabsTrigger value='comments'>{t('tabComments')}</TabsTrigger>
						<TabsTrigger value='reviews'>{t('tabReviews')}</TabsTrigger>
						<TabsTrigger value='invitations'>{t('tabInvitations')}</TabsTrigger>
					</TabsList>

					<ScrollArea className='flex-1'>
						<div className='space-y-4 pr-4'>
							<TabsContent value='all' className='m-0 space-y-4'>
								{notifications.length === 0 ? (
									<EmptyState
										message={t('allCaughtUp')}
										notificationsDesc={t('notificationsDesc')}
									/>
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
									<EmptyState message={t('noUnread')} notificationsDesc={t('notificationsDesc')} />
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
									<EmptyState
										message={t('noComments')}
										notificationsDesc={t('notificationsDesc')}
									/>
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

							<TabsContent value='reviews' className='m-0 space-y-4'>
								{notifications.filter((n) => n.type.includes('review')).length === 0 ? (
									<EmptyState message={t('noReviews')} notificationsDesc={t('notificationsDesc')} />
								) : (
									notifications
										.filter((n) => n.type.includes('review'))
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
									<EmptyState
										message={t('noInvitations')}
										notificationsDesc={t('notificationsDesc')}
									/>
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
		</>
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
	const isRead = !!notification.isRead
	return (
		<Card
			className={cn(
				'transition-colors relative overflow-hidden group',
				isRead ? 'cursor-default' : 'cursor-pointer hover:bg-muted/50',
				!isRead && 'border-l-4 border-l-primary bg-primary/5'
			)}
			onClick={isRead ? undefined : onClick}
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

function EmptyState({
	message,
	notificationsDesc,
}: {
	message: string
	notificationsDesc: string
}) {
	return (
		<div className='flex flex-col items-center justify-center py-20 text-center'>
			<div className='rounded-full bg-muted p-6 mb-4'>
				<IconBell className='h-10 w-10 text-muted-foreground/50' />
			</div>
			<h3 className='text-lg font-medium'>{message}</h3>
			<p className='text-muted-foreground text-sm max-w-xs mt-1'>{notificationsDesc}</p>
		</div>
	)
}
