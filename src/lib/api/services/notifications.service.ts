import { api } from '../api'

export interface Notification {
	notificationId: string
	userId: string
	type: 'invitation' | 'review_request' | 'review_completed' | 'comment' | string
	title: string
	message: string
	relatedId: string
	isRead: boolean
	createdAt: string
}

export const notificationsService = {
	getAll: async (params?: { type?: string; isRead?: boolean }) => {
		const response = await api.get<{ notifications: Notification[] }>('/notifications', { params })
		return response.data
	},

	getUnread: async () => {
		const response = await api.get<{ notifications: Notification[] }>('/notifications/unread')
		return response.data
	},

	markAsRead: async (notificationId: string) => {
		const response = await api.put<{ notification: Notification }>(
			`/notifications/${notificationId}/read`
		)
		return response.data
	},

	markAllAsRead: async () => {
		const response = await api.put<{ message: string }>('/notifications/read-all')
		return response.data
	},

	delete: async (notificationId: string) => {
		const response = await api.delete<{ message: string }>(`/notifications/${notificationId}`)
		return response.data
	},

	deleteAll: async () => {
		const response = await api.delete<{ message: string }>('/notifications')
		return response.data
	},

	cleanup: async () => {
		const response = await api.delete<{ message: string }>('/notifications/cleanup')
		return response.data
	},
}
