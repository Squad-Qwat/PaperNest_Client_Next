"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRoom } from '@/lib/liveblocks/config'
import { getYjsProviderForRoom } from '@liveblocks/yjs'
import { Collaboration } from '@tiptap/extension-collaboration'
import { CollaborationCursor } from '@tiptap/extension-collaboration-cursor'
import * as Y from 'yjs'
import { DocumentService } from '@/lib/firebase/document-service'
import YjsStateManager from '@/lib/editor/yjs-state-manager'
import { getUserColor, createCustomCursor } from '@/lib/editor/collaboration-cursor-utils'

/**
 * Custom hook untuk mengelola Yjs collaboration dengan Liveblocks
 * @param {Object} options - Konfigurasi collaboration
 * @param {boolean} options.enabled - Enable collaboration
 * @param {Object} options.user - User object
 * @param {Function} options.onSync - Callback ketika sync selesai
 */
export function useYjsCollaboration({
  enabled = false,
  user = null,
  onSync = () => {}
} = {}) {
  const [yProvider, setYProvider] = useState(null)
  const [yDoc, setYDoc] = useState(null)
  const [collaborationExtensions, setCollaborationExtensions] = useState([])
  const [isReady, setIsReady] = useState(false)
  const [undoManager, setUndoManager] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  
  // Track if initial content has been loaded from Firestore
  const hasInitialContentLoaded = useRef(false)
  
  // Hook Liveblocks room - always call the hook, but only use if enabled
  const room = useRoom()
  
  // Get room ID for Firestore operations only if collaboration is enabled
  const roomId = enabled ? room?.id : null
  
  // Function to load initial content from Firestore into Yjs if the document is empty
  const loadInitialContentFromFirestore = useCallback(async (yjsDoc, documentId) => {
    if (!documentId) return
    
    try {
      console.log('🔄 Loading initial content from Firestore for document:', documentId)
      
      // Get document from Firestore  
      const document = await DocumentService.getDocumentById(documentId)
      
      if (!document || !document.savedContent) {
        console.log('📄 No initial content found in Firestore')
        return
      }
      
      // Double-check if Yjs document is still empty before loading
      const fragment = yjsDoc.getXmlFragment('default')
      const config = yjsDoc.getMap('config')
      
      if (fragment.length > 0 || config.get('initialContentLoaded')) {
        console.log('📄 Yjs document already has content or loading in progress, skipping Firestore load')
        return
      }
      
      console.log('📥 Loading Firestore content into Yjs document...')
      
      // Load savedContent into Yjs using YjsStateManager
      await YjsStateManager.loadContentIntoYjs(yjsDoc, document.savedContent)
      
      // Mark as loaded in config map (following TipTap best practices)
      config.set('initialContentLoaded', true)
      config.set('loadedFromFirestore', true)
      config.set('loadedAt', Date.now())
      
      console.log('✅ Initial content loaded from Firestore into Yjs')
      
    } catch (error) {
      console.error('❌ Error loading initial content from Firestore:', error)
      
      // Reset the loading flag on error so it can be retried
      const config = yjsDoc.getMap('config')
      config.set('initialContentLoaded', false)
    }
  }, [])
  
  // Setup Yjs provider dan document
  useEffect(() => {
    if (enabled && room) {
      let mounted = true
      
      const setupYjs = async () => {
        try {
          console.log('Setting up Yjs provider for collaboration...')
          
          // Buat Yjs provider menggunakan getYjsProviderForRoom
          const provider = getYjsProviderForRoom(room, {
            autoloadSubdocs: false,
            enablePermanentUserData: true,
            offlineSupport_experimental: true
          })
          
          const yjsDoc = provider.getYDoc()
          
          // Setup UndoManager dengan proper trackedOrigins untuk collaboration
          // IMPORTANT: Hanya track LOCAL user changes, bukan remote collaboration changes
          const currentUserId = user?.id || user?.uid || 'anonymous'
          const localOrigin = `user-${currentUserId}` // Unique origin untuk setiap user
          
          const trackedOrigins = new Set([localOrigin, null]) // Track hanya local user dan null origins
          
          // Override has method untuk HANYA track changes dari current user
          trackedOrigins.has = function (origin) {
            // JANGAN track y-sync$ origin dari Liveblocks (ini adalah remote changes)
            if (origin && origin.key === 'y-sync$') {
              return false // IMPORTANT: Remote changes tidak boleh di-track untuk undo
            }
            
            // JANGAN track changes dari user lain
            if (origin && typeof origin === 'string' && origin.startsWith('user-') && origin !== localOrigin) {
              return false // Changes dari user lain tidak di-track
            }
            
            // Track hanya null origin (default TipTap) dan local user origin
            if (origin === null || origin === localOrigin) {
              return true
            }
            
            return Set.prototype.has.call(this, origin)
          }
          
          // Buat UndoManager untuk XML Fragment yang digunakan oleh TipTap
          const xmlFragment = yjsDoc.getXmlFragment('default')
          const undoManagerInstance = new Y.UndoManager(xmlFragment, {
            trackedOrigins: trackedOrigins,
            captureTimeout: 500, // Merge changes dalam 500ms
            deleteFilter: function(item) {
              // Filter items yang tidak perlu di-track untuk undo
              return true // Track semua perubahan secara default
            }
          })
          
          // Event listeners untuk UndoManager
          undoManagerInstance.on('stack-item-added', event => {
            console.log('Undo stack item added:', event.type)
            // Bisa ditambahkan metadata seperti cursor position
            if (event.stackItem && event.stackItem.meta) {
              event.stackItem.meta.set('timestamp', Date.now())
            }
          })
          
          undoManagerInstance.on('stack-item-popped', event => {
            console.log('Undo stack item popped:', event.type)
            // Restore metadata jika diperlukan
          })
          
          undoManagerInstance.on('stack-cleared', event => {
            console.log('Undo stack cleared:', event)
          })
          
          // Set awareness user info jika user tersedia
          if (user && provider.awareness) {
            provider.awareness.setLocalState({
              user: {
                id: user.id || user.uid,
                name: user.displayName || user.name || 'Anonymous',
                avatar: user.photoURL || user.avatar || '',
                email: user.email || ''
              }
            })
          }
          
          // Setup collaboration extensions dengan kustomisasi yang lebih baik
          const userColor = getUserColor(user?.id || user?.uid || 'anonymous');
          const extensions = [
            Collaboration.configure({
              document: yjsDoc,
            }),
            CollaborationCursor.configure({
              provider: provider,
              user: user ? {
                id: user.id || user.uid,
                name: user.displayName || user.name || 'Anonymous',
                color: userColor, // Consistent color per user
                // Additional user styling options
                avatar: user.photoURL || user.avatar,
                email: user.email,
              } : undefined,
              render: user => {
                // Use custom cursor creation with enhanced styling
                return createCustomCursor(user, {
                  fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
                  fontSize: '11px',
                  fontWeight: '500',
                  showAvatar: false // Set to true if you want to show user avatars
                })
              }
            })
          ]
          
          if (mounted) {
            setYProvider(provider)
            setYDoc(yjsDoc)
            setCollaborationExtensions(extensions)
            setUndoManager(undoManagerInstance)
            setIsReady(true)
            
            console.log('Yjs provider setup complete with UndoManager')
          }
          
          // Event listeners
          const handleSync = (isSynced) => {
            console.log('Yjs sync status:', isSynced)
            setIsConnected(isSynced)
            onSync(isSynced)
            
            // Prevent repetitive content loading using TipTap's best practice pattern
            // Only load initial content once when synced and if not already loaded
            if (isSynced && !hasInitialContentLoaded.current) {
              const fragment = yjsDoc.getXmlFragment('default')
              
              // Use Yjs config map to track initial content loading (TipTap pattern)
              const config = yjsDoc.getMap('config')
              const alreadyLoaded = config.get('initialContentLoaded')
              
              // Check if Yjs document is empty AND we haven't loaded initial content yet
              if (fragment.length === 0 && !alreadyLoaded) {
                console.log('🔄 Yjs document is empty, loading initial content from Firestore...')
                
                // Mark as loaded BEFORE loading to prevent race conditions
                config.set('initialContentLoaded', true)
                hasInitialContentLoaded.current = true
                
                loadInitialContentFromFirestore(yjsDoc, roomId)
              } else {
                console.log('📄 Yjs document already has content or initial load completed, skipping Firestore load')
                hasInitialContentLoaded.current = true
              }
            }
          }
          
          provider.on('sync', handleSync)
          
          return () => {
            provider.off('sync', handleSync)
            // Cleanup UndoManager
            if (undoManagerInstance) {
              undoManagerInstance.destroy()
            }
            // Cleanup akan dilakukan otomatis oleh getYjsProviderForRoom
            console.log('Yjs provider cleanup...')
          }
        } catch (error) {
          console.error('Error setting up Yjs provider:', error)
          if (mounted) {
            setIsReady(false)
          }
        }
      }
      
      setupYjs()
      
      return () => {
        mounted = false
      }
    } else {
      // Reset jika collaboration dinonaktifkan
      setYProvider(null)
      setYDoc(null)
      setCollaborationExtensions([])
      setUndoManager(null)
      setIsReady(false)
    }
  }, [enabled, room, user?.id || user?.uid])
  
  // Helper function untuk mendapatkan awareness states
  const getAwarenessStates = useCallback(() => {
    if (!yProvider || !yProvider.awareness) return new Map()
    return yProvider.awareness.getStates()
  }, [yProvider])
  
  // Helper function untuk set local awareness state
  const setLocalAwarenessState = useCallback((state) => {
    if (yProvider && yProvider.awareness) {
      yProvider.awareness.setLocalState(state)
    }
  }, [yProvider])
  
  // Helper function untuk set awareness field
  const setAwarenessField = useCallback((field, value) => {
    if (yProvider && yProvider.awareness) {
      yProvider.awareness.setLocalStateField(field, value)
    }
  }, [yProvider])
  
  // Helper function untuk undo/redo operations
  const undo = useCallback(() => {
    if (undoManager && undoManager.canUndo()) {
      undoManager.undo()
      return true
    }
    return false
  }, [undoManager])
  
  const redo = useCallback(() => {
    if (undoManager && undoManager.canRedo()) {
      undoManager.redo()
      return true
    }
    return false
  }, [undoManager])
  
  const canUndo = useCallback(() => {
    return undoManager ? undoManager.canUndo() : false
  }, [undoManager])
  
  const canRedo = useCallback(() => {
    return undoManager ? undoManager.canRedo() : false
  }, [undoManager])
  
  const stopCapturing = useCallback(() => {
    if (undoManager) {
      undoManager.stopCapturing()
    }
  }, [undoManager])
  
  const clearUndoStack = useCallback(() => {
    if (undoManager) {
      undoManager.clear()
    }
  }, [undoManager])
  
  return {
    yProvider,
    yDoc,
    collaborationExtensions,
    undoManager,
    isReady,
    isConnected,
    // Helper functions
    getAwarenessStates,
    setLocalAwarenessState,
    setAwarenessField,
    // Undo/Redo operations
    undo,
    redo,
    canUndo,
    canRedo,
    stopCapturing,
    clearUndoStack,
    // States
    awareness: yProvider?.awareness || null
  }
}
