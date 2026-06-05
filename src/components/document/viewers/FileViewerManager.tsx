'use client'

import { CodeViewer } from './CodeViewer'
import { ImageViewer } from './ImageViewer'

interface FileViewerManagerProps {
	file: {
		fileId: string
		name: string
		content: string
		url: string
	}
	readOnly?: boolean
	onChange?: (newContent: string) => void
}

export function FileViewerManager({ file, readOnly = false, onChange }: FileViewerManagerProps) {
	const ext = file.name.split('.').pop()?.toLowerCase() || ''

	// Image extensions
	if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
		return <ImageViewer file={file} />
	}

	// Default/fallback: treat as code/text
	return <CodeViewer file={file} readOnly={readOnly} onChange={onChange} />
}
