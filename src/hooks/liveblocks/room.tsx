'use client'

import { ReactNode, useCallback } from 'react'
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from '@liveblocks/react/suspense'
import { getDocumentRoomId } from '@/lib/liveblocks/config'

type RoomProps = {
	readonly documentId: string
	readonly children: ReactNode
}

export function Room({ documentId, children }: RoomProps) {
	const roomId = getDocumentRoomId(documentId)

	const authEndpoint = useCallback(async (room?: string) => {
		const token = localStorage.getItem('accessToken')

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
	}, [])

	return (
		<LiveblocksProvider authEndpoint={authEndpoint}>
			<RoomProvider id={roomId}>
				<ClientSideSuspense fallback={<div>Loading…</div>}>{children}</ClientSideSuspense>
			</RoomProvider>
		</LiveblocksProvider>
	)
}
