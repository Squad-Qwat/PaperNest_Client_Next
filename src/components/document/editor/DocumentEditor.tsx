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
	shouldInitializeFromFirestore?: boolean
}

// Komponen Editor yang ada di dalam Room
export default function DocumentEditor({
	document,
	title,
	user,
	onEditorReady,
	isPdfHidden,
	shouldInitializeFromFirestore,
}: DocumentEditorProps) {
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
