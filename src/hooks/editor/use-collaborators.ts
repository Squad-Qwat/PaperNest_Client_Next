import { useOthers } from '@liveblocks/react/suspense'
import { useMemo } from 'react'

export interface Collaborator {
	id: string
	name: string
	avatar?: string
	color: string
}

export function useCollaborators() {
	const others = useOthers()

	const collaborators = useMemo(() => {
		return others.map((other) => {
			const info = other.info as any
			const name =
				info?.name || (typeof info?.email === 'string' ? info.email.split('@')[0] : 'Guest')

			return {
				id: String(other.connectionId),
				name,
				avatar: info?.avatar,
				color: info?.color || '#6b7280',
			}
		})
	}, [others])

	const { visibleCollaborators, hiddenCollaboratorsCount } = useMemo(() => {
		const visible = collaborators.slice(0, 4)
		return {
			visibleCollaborators: visible,
			hiddenCollaboratorsCount: Math.max(collaborators.length - visible.length, 0),
		}
	}, [collaborators])

	return {
		collaborators,
		visibleCollaborators,
		hiddenCollaboratorsCount,
	}
}
