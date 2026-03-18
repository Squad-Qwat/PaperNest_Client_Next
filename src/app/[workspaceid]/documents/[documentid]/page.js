'use client'

import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import AIAssistant from '@/components/document/AIAssistant'
// UI Components
import DocumentEditor from '@/components/document/DocumentEditor'
import DocumentHeader from '@/components/document/DocumentHeader'
import { Room } from '@/hooks/liveblocks/room'
import { useWorkspace } from '@/hooks/useWorkspace'
import { DocumentService } from '@/lib/firebase/document-service'
import '@/components/document/EditorStyles.css'
import ModalVersions from '@/components/document/ModalVersions'
import { useAuthContext } from '@/context/AuthContext'

export default function DocumentPage() {
	const router = useRouter()
	const params = useParams()
	const workspaceId = params.workspaceid
	const documentId = params.documentid
	const [documentData, setDocumentData] = useState(null)
	const [isLoading, setIsLoading] = useState(true)
	const [isSaving, setIsSaving] = useState(false)
	const [isAutoSaving, setIsAutoSaving] = useState(false)
	const [lastSavedAt, setLastSavedAt] = useState(null)
	const [title, setTitle] = useState('')
	const [aiAssistantOpen, setAiAssistantOpen] = useState(false)
	const [aiAssistantWidth, setAiAssistantWidth] = useState(320)
	const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0 })
	const [editorError, setEditorError] = useState(null)
	const [activeDropdown, setActiveDropdown] = useState(null)
	const [paperSize, setPaperSize] = useState('A4')
	const [paperSizeSubmenuOpen, setPaperSizeSubmenuOpen] = useState(false)
	const [modalVersionsOpen, setModalVersionsOpen] = useState(false)
	const [defaultFontFamily, setDefaultFontFamily] = useState('"Times New Roman", Times, serif')
	const [defaultFontSize, setDefaultFontSize] = useState('11pt')
	const [editorFunctions, setEditorFunctions] = useState(null)
	const [liveblocksAuthReady, setLiveblocksAuthReady] = useState(false)
	const { user, loading } = useAuthContext()

	// Check workspace access first
	const { workspace, loading: workspaceLoading, error: workspaceError } = useWorkspace(workspaceId)

	// Redirect if no workspace access
	useEffect(() => {
		if (!workspaceLoading && !workspace) {
			console.error('No access to workspace or workspace not found')
			router.push('/')
		}
		if (workspaceError) {
			console.error('Workspace error:', workspaceError)
			router.push('/')
		}
	}, [workspace, workspaceLoading, workspaceError, router])

	// Load document
	const fetchDocument = useCallback(async () => {
		// Don't load if still checking workspace or no workspace access
		if (!user || loading || workspaceLoading) return
		if (!workspace) {
			console.error('Cannot load document: No workspace access')
			return
		}

		try {
			setIsLoading(true)
			console.log('📖 Loading document:', documentId)

			const doc = await DocumentService.getDocumentById(documentId)

			if (!doc) {
				console.error('Document not found:', documentId)
				router.push('/documents')
				return
			}

			// Check if document belongs to current workspace
			if (doc.workspaceId !== workspaceId) {
				console.error('Document does not belong to this workspace')
				router.push(`/${workspaceId}`)
				return
			}

			setDocumentData(doc)
			setTitle(doc.title)
			return doc // Return doc for further use
		} catch (error) {
			console.error('❌ Error loading document:', error)
			alert('Failed to load document. Redirecting to documents page.')
			router.push('/documents')
			return null
		} finally {
			setIsLoading(false)
		}
	}, [documentId, user, loading, workspace, workspaceLoading, router, workspaceId])

	useEffect(() => {
		if (documentId && user && !loading && workspace && !workspaceLoading) {
			fetchDocument()
		}
	}, [documentId, user, loading, workspace, workspaceLoading, fetchDocument])

	// Check Liveblocks auth readiness
	useEffect(() => {
		const checkLiveblocksAuth = async () => {
			if (!user || loading) {
				setLiveblocksAuthReady(false)
				return
			}

			try {
				const token = localStorage.getItem('accessToken')
				if (!token) {
					console.error('No access token found for Liveblocks auth')
					setLiveblocksAuthReady(false)
					return
				}

				// Test auth endpoint
				const response = await fetch('/api/liveblocks-auth', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ room: `document-${documentId}` }),
				})

				if (response.ok) {
					console.log('✅ Liveblocks auth ready (status 200)')
					setLiveblocksAuthReady(true)
				} else {
					console.error('❌ Liveblocks auth failed:', response.status)
					setLiveblocksAuthReady(false)
				}
			} catch (error) {
				console.error('❌ Error checking Liveblocks auth:', error)
				setLiveblocksAuthReady(false)
			}
		}

		if (user && !loading) {
			checkLiveblocksAuth()
		}
	}, [user, loading, documentId])

	const handleVersionRestored = useCallback(async () => {
		console.log('Version restored, refreshing document...')
		const newDoc = await fetchDocument()

		if (newDoc && editorFunctions?.editor) {
			console.log('Updating editor content with restored version...')
			// Force update editor content for CodeMirror
			const editor = editorFunctions.editor
			const newContent = newDoc.savedContent || newDoc.content
			
			editor.dispatch({
				changes: {
					from: 0,
					to: editor.state.doc.length,
					insert: newContent || ''
				}
			})
		}
	}, [fetchDocument, editorFunctions])

	// Global event handlers
	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth < 768 && aiAssistantOpen) {
				setAiAssistantOpen(false)
			}
		}

		const handleClick = (event) => {
			if (contextMenu.show) {
				setContextMenu({ show: false, x: 0, y: 0 })
			}
			if (
				activeDropdown &&
				!event.target.closest('.dropdown-menu') &&
				!event.target.closest('.dropdown-trigger')
			) {
				setActiveDropdown(null)
			}
		}

		window.addEventListener('resize', handleResize)
		document.addEventListener('click', handleClick)

		return () => {
			window.removeEventListener('resize', handleResize)
			document.removeEventListener('click', handleClick)
		}
	}, [aiAssistantOpen, contextMenu.show, activeDropdown])

	const handleSave = useCallback(async () => {
		if (!documentData || !user) return

		setIsSaving(true)

		try {
			console.log('💾 Saving document:', documentId)

			// Get current content from editor if available
			let currentContent = null
			if (editorFunctions && editorFunctions.getCurrentContent) {
				currentContent = editorFunctions.getCurrentContent()
				console.log('📄 Got current content from editor:', !!currentContent)
			}

			// Use current editor content if available, otherwise fallback to stored content
			const contentToSave = currentContent || documentData.savedContent

			await DocumentService.updateDocument(documentId, {
				title: title,
				savedContent: contentToSave,
			})

			// Also save using the editor's built-in save function if available
			if (editorFunctions && editorFunctions.saveCurrentContent) {
				await editorFunctions.saveCurrentContent(documentId)
			}

			console.log('✅ Document saved successfully')

			setDocumentData((prev) => ({
				...prev,
				title: title,
				savedContent: contentToSave,
				updatedAt: new Date(),
			}))
		} catch (error) {
			console.error('❌ Error saving document:', error)
			alert('Failed to save document. Please try again.')
		} finally {
			setIsSaving(false)
		}
	}, [documentData, user, documentId, editorFunctions, title])

	const onEditorReady = useCallback((functions) => {
		setEditorFunctions(functions)
	}, [])
	
	// Callback untuk update auto-save state dari DocumentEditor
	const onAutoSaveStateChange = useCallback((saving, savedAt) => {
		setIsAutoSaving(saving)
		setLastSavedAt(savedAt)
	}, [])

	const toggleAiAssistant = () => {
		setAiAssistantOpen(!aiAssistantOpen)
	}

	const toggleDropdown = (dropdownName) => {
		setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName)
	}

	const toggleModalVersions = () => {
		setModalVersionsOpen(!modalVersionsOpen)
	}

	// Show loading until both document and Liveblocks auth are ready
	if (isLoading || !liveblocksAuthReady) {
		return (
			<div className='min-h-screen bg-white flex items-center justify-center'>
				<div className='flex flex-col items-center gap-4'>
					<div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600'></div>
					<p className='text-gray-600 text-sm'>
						{isLoading ? 'Loading document...' : 'Initializing collaboration...'}
					</p>
				</div>
			</div>
		)
	}

	if (editorError) {
		return (
			<div className='min-h-screen bg-white flex items-center justify-center'>
				<div className='text-center p-8'>
					<h2 className='text-xl font-semibold text-red-600 mb-4'>Editor Error</h2>
					<p className='text-gray-600 mb-4'>{editorError}</p>
					<button
						type='button'
						onClick={() => window.location.reload()}
						className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
					>
						Reload Page
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className='h-screen bg-gray-50 flex flex-col overflow-hidden'>
			{/* Header - sticky at top */}
			<DocumentHeader
				title={title}
				setTitle={setTitle}
				aiAssistantOpen={aiAssistantOpen}
				toggleAiAssistant={toggleAiAssistant}
				handleSave={handleSave}
				isSaving={isSaving}
				isAutoSaving={isAutoSaving}
				lastSavedAt={lastSavedAt}
				activeDropdown={activeDropdown}
				toggleDropdown={toggleDropdown}
				paperSize={paperSize}
				setPaperSize={setPaperSize}
				paperSizeSubmenuOpen={paperSizeSubmenuOpen}
				setPaperSizeSubmenuOpen={setPaperSizeSubmenuOpen}
				toggleModalVersions={toggleModalVersions}
				user={user}
				workspaceId={workspaceId}
				documentId={documentId}
				editor={editorFunctions?.editor}
				insertTable={editorFunctions?.insertTable}
				undo={editorFunctions?.undo}
				redo={editorFunctions?.redo}
				canUndo={editorFunctions?.canUndo}
				canRedo={editorFunctions?.canRedo}
				debugContentExtraction={editorFunctions?.debugContentExtraction}
			/>
			
			{/* Main content area - flex container with independent scroll regions */}
			<Room documentId={documentId}>
				<div className='flex flex-1 overflow-hidden relative'>
					{/* Document Editor - scrollable independently */}
					<div className='flex-1 flex flex-col overflow-y-auto overflow-x-hidden min-w-0'>
						<DocumentEditor
							document={documentData}
							title={title}
							setTitle={setTitle}
							paperSize={paperSize}
							defaultFontFamily={defaultFontFamily}
							defaultFontSize={defaultFontSize}
							setEditorError={setEditorError}
							contextMenu={contextMenu}
							setContextMenu={setContextMenu}
							handleSave={handleSave}
							isSaving={isSaving}
							user={user}
							aiAssistantOpen={aiAssistantOpen}
							onEditorReady={onEditorReady}
							onAutoSaveStateChange={onAutoSaveStateChange}
						/>
					</div>

					{/* AI Assistant Panel - sticky, no scroll with document */}
					<AIAssistant
						editor={editorFunctions}
						aiAssistantOpen={aiAssistantOpen}
						toggleAiAssistant={toggleAiAssistant}
						onWidthChange={setAiAssistantWidth}
						documentId={documentId}
					/>

					{/* Version History Panel - Side Panel */}
					<ModalVersions
						isOpen={modalVersionsOpen}
						onClose={() => setModalVersionsOpen(false)}
						documentId={documentId}
						onVersionRestored={handleVersionRestored}
					/>
				</div>
			</Room>
		</div>
	)
}
