import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuth } from '@/context/AuthContext'
import { Notification, notificationsService } from '../services/notifications.service'
import { toast } from 'sonner'

export function useNotifications(params?: { type?: string; isRead?: boolean; limit?: number }) {
	const { user } = useAuth()
	const [notifications, setNotifications] = useState<Notification[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const isFirstLoad = useRef(true)

	useEffect(() => {
		if (!user?.uid) return

		const notificationsRef = collection(db, 'notifications')
		let q = query(
			notificationsRef,
			where('userId', '==', user.uid),
			orderBy('createdAt', 'desc')
		)

		if (params?.limit) {
			q = query(q, limit(params.limit))
		}

		const unsubscribe = onSnapshot(q, (snapshot) => {
			const docs = snapshot.docs.map(doc => ({
				notificationId: doc.id,
				...doc.data(),
				createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
			} as Notification))

			// Show toast for new unread notifications (but not on first load)
			if (!isFirstLoad.current && snapshot.docChanges().some(change => change.type === 'added')) {
				snapshot.docChanges().forEach(change => {
					if (change.type === 'added') {
						const newNotif = change.doc.data() as Notification
						if (!newNotif.isRead) {
							toast.info(newNotif.title, {
								description: newNotif.message,
								action: {
									label: 'View',
									onClick: () => {
										// Navigation would ideally happen here, 
										// but hooks can't easily navigate without router.
										// We rely on the user clicking the notification list/dropdown.
									}
								}
							})
						}
					}
				})
			}
			
			setNotifications(docs)
			setIsLoading(false)
			isFirstLoad.current = false
		})

		return () => unsubscribe()
	}, [user?.uid, params?.limit])

	return { data: { notifications }, isLoading }
}

export function useUnreadNotifications() {
	const { user } = useAuth()
	const [notifications, setNotifications] = useState<Notification[]>([])
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		if (!user?.uid) return

		const notificationsRef = collection(db, 'notifications')
		const q = query(
			notificationsRef,
			where('userId', '==', user.uid),
			where('isRead', '==', false),
			orderBy('createdAt', 'desc')
		)

		const unsubscribe = onSnapshot(q, (snapshot) => {
			const docs = snapshot.docs.map(doc => ({
				notificationId: doc.id,
				...doc.data(),
				createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
			} as Notification))
			
			setNotifications(docs)
			setIsLoading(false)
		})

		return () => unsubscribe()
	}, [user?.uid])

	return { data: { notifications }, isLoading }
}

export function useMarkNotificationAsRead() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (notificationId: string) => notificationsService.markAsRead(notificationId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['notifications'] })
		},
	})
}

export function useMarkAllNotificationsAsRead() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: () => notificationsService.markAllAsRead(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['notifications'] })
		},
	})
}

export function useDeleteNotification() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (notificationId: string) => notificationsService.delete(notificationId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['notifications'] })
		},
	})
}
