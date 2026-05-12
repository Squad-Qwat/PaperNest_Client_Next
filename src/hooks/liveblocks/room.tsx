'use client'

import { ClientSideSuspense, LiveblocksProvider, RoomProvider } from '@liveblocks/react/suspense'
import { type ReactNode, useCallback } from 'react'
import { getDocumentRoomId } from '@/lib/liveblocks/config'
import { useAuthStore } from '@/lib/store/auth-store'

type RoomProps = {
	readonly documentId: string
	readonly children: ReactNode
	readonly fallback?: ReactNode
}

export function Room({ documentId, children, fallback }: RoomProps) {
	const roomId = getDocumentRoomId(documentId)

	const authEndpoint = useCallback(
		async (room?: string) => {
			const token = useAuthStore.getState().accessToken

			if (!token) {
				throw new Error('No authentication token found')
			}

			const response = await fetch('/api/liveblocks-auth', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ room: room ?? roomId }),
			})

			if (!response.ok) {
				throw new Error('Authentication failed')
			}

			return await response.json()
		},
		[roomId]
	)

	return (
		<LiveblocksProvider authEndpoint={authEndpoint}>
			<RoomProvider id={roomId}>
				<ClientSideSuspense fallback={fallback || <div>Loading…</div>}>
					{children}
				</ClientSideSuspense>
			</RoomProvider>
		</LiveblocksProvider>
	)
}
