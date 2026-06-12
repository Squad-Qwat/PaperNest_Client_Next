'use client'

import { LatexEditor } from '@/components/document/latex/LatexEditor'
import type { Document } from '@/lib/api/types/document.types'
import type { User } from '@/lib/api/types/user.types'

interface DocumentEditorProps {
	document: Document | null
	title: string
	user: User | null
	onEditorReady: (functions: any) => void
	isPdfHidden?: boolean
	initialContent?: string
	readOnly?: boolean
	activeAuxiliaryFile?: {
		fileId: string
		name: string
		content: string
		url: string
		isDirty?: boolean
	} | null
	openAuxiliaryFiles?: {
		fileId: string
		name: string
		content: string
		url: string
		isDirty?: boolean
	}[]
	activeFileId?: string
	setActiveFileId?: (id: string) => void
	onCloseAuxiliaryFile?: (id: string) => void
	onAuxiliaryFileChange?: (id: string, newContent: string) => void
}

// Komponen Editor yang ada di dalam Room
export default function DocumentEditor({
	document,
	title,
	user,
	onEditorReady,
	isPdfHidden,
	initialContent,
	readOnly,
	activeAuxiliaryFile,
	openAuxiliaryFiles = [],
	activeFileId = 'main',
	setActiveFileId,
	onCloseAuxiliaryFile,
	onAuxiliaryFileChange,
}: DocumentEditorProps) {
	return (
		<div className='w-full h-full flex-1 overflow-hidden bg-background'>
			<LatexEditor
				documentId={document?.documentId}
				user={user}
				initialContent={initialContent}
				title={title}
				onEditorReady={onEditorReady}
				isPdfHidden={isPdfHidden}
				readOnly={readOnly}
				activeAuxiliaryFile={activeAuxiliaryFile}
				openAuxiliaryFiles={openAuxiliaryFiles}
				activeFileId={activeFileId}
				setActiveFileId={setActiveFileId}
				onCloseAuxiliaryFile={onCloseAuxiliaryFile}
				onAuxiliaryFileChange={onAuxiliaryFileChange}
			/>
		</div>
	)
}
