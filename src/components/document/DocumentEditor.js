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
	return (
		<div className='flex-1 overflow-visible transition-all duration-300 w-full bg-gray-100 p-4 md:p-8'>
			<div className='max-w-[1200px] mx-auto h-[calc(100vh-140px)]'>
				<LatexEditor 
					documentId={document?.documentId}
					user={user}
					initialContent={document?.savedContent}
					title={title}
					onEditorReady={onEditorReady}
				/>
			</div>
		</div>
	)
}
