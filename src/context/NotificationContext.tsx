'use client'

import {
	collection,
	deleteDoc,
	doc,
	onSnapshot,
	orderBy,
	query,
	updateDoc,
	where,
	writeBatch,
} from 'firebase/firestore'
import type React from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import type { Notification } from '@/lib/api/types/notification.types'
import { db } from '@/lib/firebase/config'
import { useAuth } from './AuthContext'

interface NotificationContextType {
	notifications: Notification[]
	unreadCount: number
	isLoading: boolean
	markAsRead: (notificationId: string) => Promise<void>
	markAllAsRead: () => Promise<void>
	deleteNotification: (notificationId: string) => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { user } = useAuth()
	const [notifications, setNotifications] = useState<Notification[]>([])
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		if (!user) {
			setNotifications([])
			setIsLoading(false)
			return
		}

		const q = query(
			collection(db, 'notifications'),
			where('userId', '==', user.userId),
			orderBy('createdAt', 'desc')
		)

		const unsubscribe = onSnapshot(
			q,
			(snapshot) => {
				const notifList = snapshot.docs.map((doc) => ({
					notificationId: doc.id,
					...doc.data(),
					createdAt: doc.data().createdAt?.toDate() || new Date(),
				})) as Notification[]

				setNotifications(notifList)
				setIsLoading(false)
			},
			(error) => {
				console.error('Error listening to notifications:', error)
				setIsLoading(false)
			}
		)

		return () => unsubscribe()
	}, [user])

	const unreadCount = notifications.filter((n) => !n.isRead).length

	const markAsRead = async (notificationId: string) => {
		try {
			const notifRef = doc(db, 'notifications', notificationId)
			await updateDoc(notifRef, { isRead: true })
		} catch (error) {
			console.error('Failed to mark notification as read:', error)
		}
	}

	const markAllAsRead = async () => {
		try {
			const batch = writeBatch(db)
			const unreadNotifs = notifications.filter((n) => !n.isRead)

			for (const notif of unreadNotifs) {
				const notifRef = doc(db, 'notifications', notif.notificationId)
				batch.update(notifRef, { isRead: true })
			}

			await batch.commit()
		} catch (error) {
			console.error('Failed to mark all notifications as read:', error)
		}
	}

	const deleteNotification = async (notificationId: string) => {
		try {
			await deleteDoc(doc(db, 'notifications', notificationId))
		} catch (error) {
			console.error('Failed to delete notification:', error)
		}
	}

	return (
		<NotificationContext.Provider
			value={{
				notifications,
				unreadCount,
				isLoading,
				markAsRead,
				markAllAsRead,
				deleteNotification,
			}}
		>
			{children}
		</NotificationContext.Provider>
	)
}

export const useNotifications = () => {
	const context = useContext(NotificationContext)
	if (context === undefined) {
		throw new Error('useNotifications must be used within a NotificationProvider')
	}
	return context
}
