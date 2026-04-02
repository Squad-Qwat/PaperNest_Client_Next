'use client'

import { LatexEditor } from '@/components/document/latex/LatexEditor'

// Komponen Editor yang ada di dalam Room
export default function DocumentEditor(props) {
	const {
		document,
		title,
		user,
		onEditorReady,
		isPdfHidden,
		shouldInitializeFromFirestore,
	} = props
	
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
