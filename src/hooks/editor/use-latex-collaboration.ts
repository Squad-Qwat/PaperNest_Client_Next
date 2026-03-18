// @ts-nocheck
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRoom, useSelf } from '@/lib/liveblocks/config'
import { getYjsProviderForRoom } from '@liveblocks/yjs'
import * as Y from 'yjs'
import { getUserColor } from '@/lib/editor/collaboration-cursor-utils'

interface User {
    id: string;
    uid?: string;
    userId?: string;
    name?: string;
    username?: string;
    photoURL?: string;
    avatar?: string;
    email?: string;
}

interface UseLatexCollaborationOptions {
    enabled?: boolean;
    user?: User | null;
}

/**
 * Custom hook untuk mengelola Yjs collaboration dengan Liveblocks (CodeMirror Optimized)
 */
export function useLatexCollaboration({ enabled = false, user = null }: UseLatexCollaborationOptions = {}) {
    const [yProvider, setYProvider] = useState<any>(null)
    const [yDoc, setYDoc] = useState<Y.Doc | null>(null)
    const [isReady, setIsReady] = useState(false)
    const [undoManager, setUndoManager] = useState<Y.UndoManager | null>(null)
    const [isConnected, setIsConnected] = useState(false)

    const room = useRoom()
    const liveblocksUserInfo = useSelf((me) => me?.info) as any

    useEffect(() => {
        if (enabled && room) {
            let mounted = true

            const setupYjs = async () => {
                try {
                    const provider = getYjsProviderForRoom(room, {
                        autoloadSubdocs: false,
                        enablePermanentUserData: true,
                        offlineSupport_experimental: true,
                    })

                    const yjsDoc = provider.getYDoc()
                    const yText = yjsDoc.getText('latex')

                    // Setup UndoManager for the text type
                    const currentUserId = user?.id || user?.uid || 'anonymous'
                    const localOrigin = `user-${currentUserId}`
                    
                    const undoManagerInstance = new Y.UndoManager(yText, {
                        trackedOrigins: new Set([localOrigin, null]),
                        captureTimeout: 500,
                    })

                    if (mounted) {
                        setYProvider(provider)
                        setYDoc(yjsDoc)
                        setUndoManager(undoManagerInstance)
                        setIsReady(true)
                    }

                    const handleSync = (isSynced: boolean) => {
                        setIsConnected(isSynced)
                    }

                    provider.on('sync', handleSync)

                    return () => {
                        provider.off('sync', handleSync)
                        if (undoManagerInstance) undoManagerInstance.destroy()
                    }
                } catch (error) {
                    console.error('Error setting up Yjs provider for LaTeX:', error)
                    if (mounted) setIsReady(false)
                }
            }

            setupYjs()
            return () => { mounted = false }
        }
    }, [enabled, room, user?.id || user?.uid])

    // Sync awareness
    useEffect(() => {
        if (!yProvider || !liveblocksUserInfo || !enabled) return

        yProvider.awareness.setLocalStateField('user', {
            id: user?.userId || user?.id || user?.uid,
            name: liveblocksUserInfo.name || user?.name || 'Anonymous',
            color: liveblocksUserInfo.color || getUserColor(user?.id || 'anonymous'),
            avatar: liveblocksUserInfo.avatar || user?.photoURL || user?.avatar,
        })
    }, [yProvider, liveblocksUserInfo, user, enabled])

    return {
        yProvider,
        yDoc,
        undoManager,
        isReady,
        isConnected,
        awareness: yProvider?.awareness || null,
    }
}
