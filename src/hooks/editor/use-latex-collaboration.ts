// @ts-nocheck
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRoom, useSelf } from '@liveblocks/react/suspense'
import { getYjsProviderForRoom } from '@liveblocks/yjs'
import * as Y from 'yjs'
import { getUserColor } from '@/lib/editor/collaboration-cursor-utils'

function getSelectionColorLight(baseColor: string): string {
    if (/^#[0-9A-Fa-f]{6}$/.test(baseColor)) {
        return `${baseColor}33`
    }

    if (/^#[0-9A-Fa-f]{8}$/.test(baseColor)) {
        return baseColor
    }

    return '#30bced33'
}

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
    documentId?: string | null;
}

/**
 * Custom hook untuk mengelola Yjs collaboration dengan Liveblocks (CodeMirror Optimized)
 * Dengan integrated Firestore fallback loading untuk consistency dengan Tiptap
 */
export function useLatexCollaboration({ enabled = false, user = null, documentId = null }: UseLatexCollaborationOptions = {}) {
    const [yProvider, setYProvider] = useState<any>(null)
    const [yDoc, setYDoc] = useState<Y.Doc | null>(null)
    const [isReady, setIsReady] = useState(false)
    const [undoManager, setUndoManager] = useState<Y.UndoManager | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [hasSyncedOnce, setHasSyncedOnce] = useState(false)

    const room = useRoom()
    const liveblocksUserInfo = useSelf((me) => me?.info) as any
    
    // Track if initial content has been loaded from Firestore (prevent duplicate loads)
    const hasInitialContentLoaded = useRef(false)

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
                        console.log('[LaTeX] Yjs sync status:', isSynced)
                        setIsConnected(isSynced)

                        // Mark sync completion so editor can safely decide fallback seeding timing
                        if (isSynced && !hasInitialContentLoaded.current) {
                            hasInitialContentLoaded.current = true
                            setHasSyncedOnce(true)
                            console.log('[LaTeX] Sync complete - room content is authoritative')
                        }
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
    }, [enabled, room, user?.id || user?.uid, documentId])

    // Sync awareness
    useEffect(() => {
        if (!yProvider || !enabled) return

        const fallbackColor = getUserColor(user?.id || user?.uid || 'anonymous')
        const baseColor = liveblocksUserInfo.color || fallbackColor
        const colorLight = liveblocksUserInfo.colorLight || getSelectionColorLight(baseColor)

        yProvider.awareness.setLocalStateField('user', {
            id: user?.userId || user?.id || user?.uid,
            name: liveblocksUserInfo.name || user?.name || 'Anonymous',
            color: baseColor,
            colorLight,
            avatar: liveblocksUserInfo.avatar || user?.photoURL || user?.avatar,
        })
    }, [yProvider, liveblocksUserInfo, user, enabled])

    return {
        yProvider,
        yDoc,
        undoManager,
        isReady,
        isConnected,
        hasSyncedOnce,
        awareness: yProvider?.awareness || null,
        hasInitialContentLoaded: hasInitialContentLoaded.current,
    }
}
