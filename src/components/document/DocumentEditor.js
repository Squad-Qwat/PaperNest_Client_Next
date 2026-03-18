'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useLatexEditor } from '@/hooks/editor/use-latex-editor'
import { LatexEditor } from '@/components/document/LatexEditor'
import { DocumentService } from '@/lib/firebase/document-service'

// UI Components
import DocumentHeader from '@/components/document/DocumentHeader'
import AIAssistant from '@/components/document/AIAssistant'
// import '@/components/document/EditorStyles.css' // Not needed for LaTeX
import EditorContextMenu from '@/components/document/EditorContextMenu'

// Komponen Editor yang ada di dalam Room
export default function DocumentEditor(props) {
	const {
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
		onEditorReady,
		onAutoSaveStateChange,
		isPdfHidden,
		shouldInitializeFromFirestore,
	} = props
	
	// Default to true if not specified (safe to load from Firestore)
	const shouldLoad = shouldInitializeFromFirestore !== false
	
	return (
		<div className='w-full h-full flex-1 overflow-hidden bg-white'>
			<LatexEditor 
				documentId={document?.documentId}
				user={user}
				initialContent={shouldLoad ? document?.savedContent : undefined}
				title={title}
				onEditorReady={onEditorReady}
				isPdfHidden={isPdfHidden}
			/>
		</div>
	)
}
