'use client'

import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import AIAssistant from '@/components/document/AIAssistant'
// UI Components
import DocumentEditor from '@/components/document/DocumentEditor'
import DocumentHeader from '@/components/document/DocumentHeader'
import EditorToolbar from '@/components/document/EditorToolbar'
import { Room } from '@/hooks/liveblocks/room'
import { useWorkspace } from '@/hooks/useWorkspace'
import { createEditorExtensions } from '@/lib/editor/extensions'
import { DocumentService } from '@/lib/firebase/document-service'
import '@/components/document/EditorStyles.css'
import ModalVersions from '@/components/document/ModalVersions'
import { ModalAddCitations } from '@/components/document/ModalCitations'
import { ModalListCitations } from '@/components/document/ViewCitations'
import ContextMenu from '@/components/editor/context-menu'
import { useAuthContext } from '@/context/AuthContext'

export default function DocumentPage() {
	const router = useRouter()
	const params = useParams()
	const workspaceId = params.workspaceid
	const documentId = params.documentid
	const [documentData, setDocumentData] = useState(null)
	const [isLoading, setIsLoading] = useState(true)
	const [isSaving, setIsSaving] = useState(false)
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
	const { user, loading } = useAuthContext()

	// Check workspace access first
	const { workspace, loading: workspaceLoading, error: workspaceError } = useWorkspace(workspaceId)
	const [isAddCitationOpen, setIsAddCitationOpen] = useState(false)
	const [isViewCitationsOpen, setIsViewCitationsOpen] = useState(false)
    const [citations, setCitations] = useState([])

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
	useEffect(() => {
		const loadDocument = async () => {
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
				if (doc.citations) {
					setCitations(doc.citations)
				}
			} catch (error) {
				console.error('❌ Error loading document:', error)
				alert('Failed to load document. Redirecting to documents page.')
				router.push('/documents')
			} finally {
				setIsLoading(false)
			}
		}

		if (documentId && user && !loading && workspace && !workspaceLoading) {
			loadDocument()
		}
	}, [documentId, user, loading, workspace, workspaceLoading, router, workspaceId])

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
			const contentToSave = currentContent || documentData.content

			await DocumentService.updateDocument(documentId, {
				title: title,
				content: contentToSave,
				citations: citations
			})

			// Also save using the editor's built-in save function if available
			if (editorFunctions && editorFunctions.saveCurrentContent) {
				await editorFunctions.saveCurrentContent(documentId)
			}

			console.log('✅ Document saved successfully')

			setDocumentData((prev) => ({
				...prev,
				title: title,
				content: contentToSave,
				citations: citations,
				updatedAt: new Date(),
			}))
		} catch (error) {
			console.error('❌ Error saving document:', error)
			alert('Failed to save document. Please try again.')
		} finally {
			setIsSaving(false)
		}
	}, [documentData, user, documentId, editorFunctions, title])

	useEffect(() => {
        if (documentData?.citations) {
            setCitations(documentData.citations)
        }
    }, [documentData])

	const onEditorReady = useCallback((functions) => {
		setEditorFunctions(functions)
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

	const toggleCitations = useCallback(() => {
        setIsViewCitationsOpen(prev => !prev)
    }, [])

	const handleAddCitation = async (newCit) => {
		const citationEntry = {
			...newCit,
			id: `cit_${Date.now()}`,
			addedBy: user?.displayName || 'User',
			createdAt: new Date().toISOString()
		}

		const updatedCitations = [citationEntry, ...citations]
		
		// Update local state so it appears in ViewCitations immediately
		setCitations(updatedCitations)
		
		// Persist to database
		try {
			await DocumentService.updateDocument(documentId, { citations: updatedCitations })
			setIsAddCitationOpen(false)
		} catch (error) {
			console.error('Failed to save citation:', error)
		}
	}

	const handleDeleteCitation = async (id) => {
		const updatedCitations = citations.filter(c => c.id !== id)
		setCitations(updatedCitations)
		await DocumentService.updateDocument(documentId, { citations: updatedCitations })
	}

	const handleInsertCitation = (cit) => {
		if (editorFunctions?.editor) {
			const text = `(${cit.author}, ${cit.year})`
			editorFunctions.editor.chain().focus().insertContent(`${text} `).run()
			setIsViewCitationsOpen(false) 
		}
	}

	if (isLoading) {
		return (
			<div className='min-h-screen bg-white flex items-center justify-center'>
				<div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600'></div>
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
		<div className='min-h-screen bg-gray-50 flex flex-col'>
			{/* Header */}
			<DocumentHeader
				title={title}
				setTitle={setTitle}
				aiAssistantOpen={aiAssistantOpen}
				toggleAiAssistant={toggleAiAssistant}
				handleSave={handleSave}
				isSaving={isSaving}
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
				toggleCitations={() => setIsViewCitationsOpen(true)}
				openAddCitation={() => setIsAddCitationOpen(true)}
			/>
			<Room documentId={documentId}>
				<div className='flex flex-1 overflow-hidden'>
					{/* Document Editor - akan shrink saat AI Assistant open */}
					<div className='flex-1 flex flex-col overflow-hidden min-w-0'>
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
						/>
					</div>

					{/* AI Assistant Panel - flex item, bukan fixed overlay */}
					<AIAssistant
						editor={editorFunctions}
						aiAssistantOpen={aiAssistantOpen}
						toggleAiAssistant={toggleAiAssistant}
						onWidthChange={setAiAssistantWidth}
					/>

					{/* Version History Panel - Side Panel */}
					<ModalVersions isOpen={modalVersionsOpen} onClose={() => setModalVersionsOpen(false)} />
				</div>
			</Room>

			{/* Modal for adding new citations */}
			<ModalAddCitations 
				isOpen={isAddCitationOpen}
				onClose={() => setIsAddCitationOpen(false)}
				onAdd={handleAddCitation}
			/>

			{/* Modal for viewing and inserting citations */}
			<ModalListCitations 
				isOpen={isViewCitationsOpen}
				onClose={() => setIsViewCitationsOpen(false)}
				citations={citations}
				onDelete={handleDeleteCitation}
				onInsert={handleInsertCitation}
			/>

			<ModalVersions isOpen={modalVersionsOpen} onClose={() => setModalVersionsOpen(false)} />
		</div>
	)
}
