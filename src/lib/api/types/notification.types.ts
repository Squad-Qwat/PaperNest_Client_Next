export interface Notification {
	notificationId: string
	userId: string
	type: 'invitation' | 'review_request' | 'review_completed' | 'comment' | 'comment_reply' | string
	title: string
	message: string
	relatedId: string
	isRead: boolean
	createdAt: Date
}
