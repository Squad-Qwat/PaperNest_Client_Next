'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { EditorContent } from '@tiptap/react'
import { useDocumentEditor } from '@/hooks/editor/use-document-editor'

// UI Components
import DocumentHeader from '@/components/document/DocumentHeader'
import AIAssistant from '@/components/document/AIAssistant'
import '@/components/document/EditorStyles.css'
import EditorContextMenu from '@/components/document/EditorContextMenu'

// Komponen Editor yang ada di dalam Room
export default function DocumentEditor({
	document,
	title,
	setTitle,
	paperSize,
	defaultFontFamily,
	defaultFontSize,
	setEditorError,
	contextMenu,
	setContextMenu,
	handleSave,
	isSaving,
	user,
	aiAssistantOpen,
	// Expose editor functions
	onEditorReady,
	onAutoSaveStateChange,
}) {
	// Menggunakan custom hook untuk editor dengan Yjs collaboration
	const {
		editor,
		insertTable,
		// Content management
		getCurrentContent,
		getCurrentHTML,
		saveCurrentContent,
		// Auto-save state
		isSaving: isAutoSaving,
		lastSavedAt,
		// Debug functions
		debugContentExtraction,
		// Undo/Redo operations
		undo,
		redo,
		canUndo,
		canRedo,
		// Collaboration features
		yProvider,
		yDoc,
		undoManager,
		awareness,
		isConnected,
		collaborationReady,
		getAwarenessStates,
		setLocalAwarenessState,
		setAwarenessField,
	} = useDocumentEditor({
		paperSize,
		defaultFontFamily,
		defaultFontSize,
		document,
		title,
		user,
		setEditorError,
		enableLiveblocks: true, // Karena DocumentEditor ada di dalam Room
		enableAutoSave: true,
		autoSaveInterval: 2000, // Auto-save 2 seconds after user stops typing
	})

	// Debug collaboration status
	useEffect(() => {
		if (collaborationReady) {
			console.log('🤝 Collaboration ready:', {
				isConnected,
				awarenessStates: getAwarenessStates().size,
				yDocExists: !!yDoc,
			})
		}
	}, [collaborationReady, isConnected, getAwarenessStates, yDoc])
	
	// Notify parent about auto-save state changes
	useEffect(() => {
		if (onAutoSaveStateChange) {
			onAutoSaveStateChange(isAutoSaving, lastSavedAt)
		}
	}, [isAutoSaving, lastSavedAt, onAutoSaveStateChange])

	// Expose editor functions to parent component
	useEffect(() => {
		if (editor && onEditorReady && getCurrentContent && getCurrentHTML && saveCurrentContent) {
			onEditorReady({
				getCurrentContent,
				getCurrentHTML,
				saveCurrentContent,
				editor,
				insertTable,
				undo,
				redo,
				canUndo,
				canRedo,
				debugContentExtraction,
			})
		}
	}, [
		editor,
		onEditorReady,
		getCurrentContent,
		getCurrentHTML,
		saveCurrentContent,
		insertTable,
		undo,
		redo,
		canUndo,
		canRedo,
		debugContentExtraction,
	])

	return (
		<div className='flex-1 overflow-auto transition-all duration-300 w-full' style={{ backgroundColor: '#F5F5F5' }}>
			<div className='pt-6'>
				<div className='max-w-[850px] mx-auto my-12 bg-transparent shadow-sm min-h-[1100px]'>
					<EditorContextMenu editor={editor}>
						<div className=''>
							<EditorContent
								editor={editor}
								className='prose max-w-none focus:outline-none min-h-[800px]'
							/>
						</div>
					</EditorContextMenu>
				</div>
			</div>
		</div>
	)
}
