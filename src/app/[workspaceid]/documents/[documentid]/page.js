'use client'

import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import AIAssistant from '@/components/document/ai/AIAssistant'
import SidenavPanel from '@/components/document/SidenavPanel'
import DynamicContentPanel from '@/components/document/DynamicContentPanel'
// UI Components
import DocumentEditor from '@/components/document/editor/DocumentEditor'
import DocumentHeader from '@/components/document/editor/DocumentHeader'
import { Room } from '@/hooks/liveblocks/room'
import { useWorkspace } from '@/lib/api/hooks/use-workspaces'
import { DocumentService } from '@/lib/firebase/document-service'
import { documentsService } from '@/lib/api/services/documents.service'
import '@/components/document/editor/EditorStyles.css'
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
	const [activePanel, setActivePanel] = useState(null)
	const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0 })
	const [editorError, setEditorError] = useState(null)
	const [activeDropdown, setActiveDropdown] = useState(null)
	const [paperSize, setPaperSize] = useState('A4')
	const [paperSizeSubmenuOpen, setPaperSizeSubmenuOpen] = useState(false)
	const [modalVersionsOpen, setModalVersionsOpen] = useState(false)
	const defaultFontFamily = '"Times New Roman", Times, serif'
	const defaultFontSize = '11pt'
	const [editorFunctions, setEditorFunctions] = useState(null)
	const [isPdfHidden, setIsPdfHidden] = useState(false)
	const [activeUsersInRoom, setActiveUsersInRoom] = useState(0)
	const { user, loading } = useAuthContext()

	// Check workspace access first
	const { data: workspace, isLoading: workspaceLoading, error: workspaceErrorObj } = useWorkspace(workspaceId)
	const workspaceError = workspaceErrorObj ? workspaceErrorObj.message : null

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

			let doc
			let activeUsers = 0

			// Try fetching with room state (API endpoint)
			try {
				const roomStateData = await documentsService.getDocumentWithRoomState(documentId)
				doc = roomStateData.document
				activeUsers = roomStateData.room.activeUsers
				console.log(`📊 Users in room for this document: ${activeUsers}`)
			} catch (roomStateError) {
				// Fallback: get document from Firestore if API endpoint unavailable
				console.warn(
					'⚠️ Room state endpoint unavailable, fetching from Firestore fallback',
					roomStateError
				)
				doc = await DocumentService.getDocumentById(documentId)
				activeUsers = 0 // Assume no active users (safe - will load from Firestore)
				console.log('📖 Document loaded via Firestore fallback (activeUsers: 0)')
			}

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
			setActiveUsersInRoom(activeUsers)
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
			console.log('💾 Saving document with batch operation:', documentId)

			// Get current content from editor if available
			let currentContent = null
			if (editorFunctions?.getCurrentContent) {
				currentContent = editorFunctions.getCurrentContent()
				console.log('📄 Got current content from editor:', !!currentContent)
			}

			// Use current editor content if available, otherwise fallback to stored content
			const contentToSave = currentContent || documentData.savedContent

			// Optimistic update - update UI immediately
			setDocumentData((prev) => ({
				...prev,
				title: title,
				savedContent: contentToSave,
				updatedAt: new Date(),
			}))
			setLastSavedAt(new Date())

			// Build batch operations
			const batchOperations = [
				{
					operationType: 'save-content',
					payload: {
						content: contentToSave || '',
					},
				},
				{
					operationType: 'update-metadata',
					payload: {
						title: title,
						defaultFont: defaultFontFamily,
						defaultFontSize: defaultFontSize,
						paperSize: paperSize,
					},
				},
				{
					operationType: 'create-checkpoint',
					payload: {
						message: 'Auto-save checkpoint',
						userId: user.userId,
					},
				},
			]

			// Execute batch operation
			const response = await documentsService.batchUpdateDocument(documentId, {
				operations: batchOperations,
			})

			if (response.allSucceeded) {
				console.log('✅ All batch operations completed successfully')
				console.log('📊 Batch stats:', {
					transactionId: response.transactionId,
					totalDuration: response.totalDuration,
					operationCount: response.results.length,
				})
			} else {
				// Some operations failed
				const failedOps = response.results.filter((r) => !r.success)
				console.warn('⚠️ Some batch operations failed:', failedOps)
				const failedOpsList = failedOps.map((op) => `${op.operationType} failed`).join(', ')
				alert(`Save completed with issues: ${failedOpsList}`)
			}

			// Also save using the editor's built-in save function if available (for Liveblocks sync)
			if (editorFunctions?.saveCurrentContent) {
				await editorFunctions.saveCurrentContent(documentId)
			}
		} catch (error) {
			console.error('❌ Error saving document:', error)
			alert('Failed to save document. Please try again.')
			// Revert optimistic update on error
			setDocumentData((prev) => ({
				...prev,
				title: documentData.title,
				savedContent: documentData.savedContent,
				updatedAt: documentData.updatedAt,
			}))
		} finally {
			setIsSaving(false)
		}
	}, [documentData, user, documentId, editorFunctions, title, defaultFontFamily, defaultFontSize, paperSize])

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

	const handlePanelIconClick = (panelId) => {
		// Toggle: if same panel clicked, close it; otherwise open/switch to new panel
		setActivePanel(activePanel === panelId ? null : panelId)
	}

	const handleClosePanel = () => {
		setActivePanel(null)
	}

	const handleDynamicPanelWidthChange = (width) => {
		// Note: width parameter available for future use if needed for resize constraints
		// For now, just update active state if needed
	}

	const handleNavigateToSection = (heading, position) => {
		if (!editorFunctions?.editor) return

		const editor = editorFunctions.editor

		// Navigate to position and scroll into view
		editor.dispatch({
			selection: { anchor: position },
			scrollIntoView: true,
		})

		// Optionally highlight the line (add visual feedback)
		console.log(`Navigated to section: ${heading}`)
	}

	const handleResizeStart = useCallback(() => {
		setIsPdfHidden(true)
	}, [])

	const handleResizeEnd = useCallback(() => {
		setIsPdfHidden(false)
	}, [])

	const toggleDropdown = (dropdownName) => {
		setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName)
	}

	const toggleModalVersions = () => {
		setModalVersionsOpen(!modalVersionsOpen)
	}

	// Show loading until document is ready
	// Room component handles Liveblocks auth internally
	if (isLoading) {
		return (
			<div className='min-h-screen bg-white flex items-center justify-center'>
				<div className='flex flex-col items-center gap-4'>
					<div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600'></div>
					<p className='text-gray-600 text-sm'>Loading document...</p>
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
						onClick={() => globalThis.location.reload()}
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
				handleCompile={editorFunctions?.handleCompile}
				isCompiling={editorFunctions?.isCompiling}
				visibleCollaborators={editorFunctions?.visibleCollaborators}
				hiddenCollaboratorsCount={editorFunctions?.hiddenCollaboratorsCount}
				viewMode={editorFunctions?.viewMode}
				toggleViewMode={editorFunctions?.toggleViewMode}
				visualEditor={editorFunctions?.visualEditor}
				debugContentExtraction={editorFunctions?.debugContentExtraction}
			/>

			{/* Main content area - flex container with independent scroll regions */}
			<Room documentId={documentId}>
				<div className='flex flex-1 overflow-hidden'>
					{/* Sidenav Panel - Fixed width 48px */}
					<SidenavPanel
						activePanel={activePanel}
						onPanelClick={handlePanelIconClick}
					/>

					{/* Dynamic Content Panel - Resizable 280-600px */}
					<DynamicContentPanel
						activePanel={activePanel}
						onClose={handleClosePanel}
						onWidthChange={handleDynamicPanelWidthChange}
						onResizeStart={handleResizeStart}
						onResizeEnd={handleResizeEnd}
						currentContent={documentData?.savedContent}
						onNavigateToSection={handleNavigateToSection}
						documentId={documentId}
						editorView={editorFunctions?.editor}
						getCurrentContent={editorFunctions?.getCurrentContent}
					/>

					{/* Document Editor - Full flex-1 width */}
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
						shouldInitializeFromFirestore={activeUsersInRoom === 0}
						onAutoSaveStateChange={onAutoSaveStateChange}
						isPdfHidden={isPdfHidden}
					/>

					{/* AI Assistant Panel - sticky, no scroll with document */}
					<AIAssistant
						editor={editorFunctions}
						aiAssistantOpen={aiAssistantOpen}
						toggleAiAssistant={toggleAiAssistant} documentId={documentId}
						onResizeStart={handleResizeStart}
						onResizeEnd={handleResizeEnd}
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
