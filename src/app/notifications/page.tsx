'use client'

import { Bell, Check, Clock, Info, MessageSquare, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/button'
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead, useDeleteNotification } from '@/lib/api/hooks/use-notifications'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

export default function NotificationsPage() {
	const router = useRouter()
	const { data: notificationsResponse, isLoading } = useNotifications()
	const { mutate: markAsRead } = useMarkNotificationAsRead()
	const { mutate: markAllAsRead } = useMarkAllNotificationsAsRead()
	const { mutate: deleteNotification } = useDeleteNotification()

	const notifications = notificationsResponse?.notifications || []

	const getIcon = (type: string) => {
		switch (type) {
			case 'review_request':
				return <Clock className="w-5 h-5 text-blue-500" />
			case 'review_completed':
				return <Check className="w-5 h-5 text-green-500" />
			case 'comment':
				return <MessageSquare className="w-5 h-5 text-purple-500" />
			default:
				return <Info className="w-5 h-5 text-gray-500" />
		}
	}

	const handleNotificationClick = (notification: any) => {
		if (!notification.isRead) {
			markAsRead(notification.notificationId)
		}

		// Navigate based on relatedId (usually reviewId)
		// For simplicity, we assume relatedId is a reviewId or documentId
		// You might need more complex logic here if relatedId refers to different types
		if (notification.type === 'review_request' || notification.type === 'review_completed') {
			// Try to find workspaceId from context or just navigate to a general review page
			// For now, let's assume we can navigate to a generic review view or history
			router.push(`/reviews/${notification.relatedId}`)
		}
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />
			<main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between mb-6">
					<div className="flex items-center gap-3">
						<Bell className="w-8 h-8 text-primary" />
						<h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
					</div>
					<div className="flex gap-2">
						<Button 
							variant="outline" 
							size="sm" 
							onClick={() => markAllAsRead()}
							disabled={notifications.length === 0}
						>
							Mark all as read
						</Button>
					</div>
				</div>

				<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
					{isLoading ? (
						<div className="p-8 text-center text-gray-500">Loading notifications...</div>
					) : notifications.length === 0 ? (
						<div className="p-12 text-center">
							<Bell className="w-12 h-12 text-gray-200 mx-auto mb-4" />
							<p className="text-gray-500">No notifications yet</p>
						</div>
					) : (
						<div className="divide-y divide-gray-100">
							{notifications.map((notification) => (
								<div 
									key={notification.notificationId}
									className={cn(
										"p-4 flex items-start gap-4 transition-colors cursor-pointer hover:bg-gray-50",
										!notification.isRead && "bg-blue-50/50"
									)}
									onClick={() => handleNotificationClick(notification)}
								>
									<div className="mt-1">
										{getIcon(notification.type)}
									</div>
									<div className="flex-1">
										<div className="flex items-center justify-between gap-2">
											<p className={cn(
												"text-sm font-semibold text-gray-900",
												!notification.isRead && "text-blue-900"
											)}>
												{notification.title}
											</p>
											<span className="text-xs text-gray-500 whitespace-nowrap">
												{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
											</span>
										</div>
										<p className="text-sm text-gray-600 mt-1">{notification.message}</p>
									</div>
									<button 
										className="p-1 text-gray-400 hover:text-red-500 transition-colors"
										onClick={(e) => {
											e.stopPropagation();
											deleteNotification(notification.notificationId);
										}}
									>
										<Trash2 className="w-4 h-4" />
									</button>
								</div>
							))}
						</div>
					)}
				</div>
			</main>
		</div>
	)
}
