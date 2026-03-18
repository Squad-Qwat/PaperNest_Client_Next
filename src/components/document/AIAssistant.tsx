'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { AIChatPanel } from './AIChatPanel'

/**
 * AI Assistant Component with Resizable Panel
 * Features a resizable sidebar for AI chat functionality
 */
interface EditorFunctions {
	editor?: any
	getCurrentContent?: () => any
	getCurrentHTML?: () => string
	saveCurrentContent?: () => Promise<void>
	insertTable?: (rows: number, cols: number) => void
	undo?: () => void
	redo?: () => void
	canUndo?: boolean
	canRedo?: boolean
	debugContentExtraction?: () => void
}

interface AIAssistantProps {
	editor?: EditorFunctions
	aiAssistantOpen?: boolean
	toggleAiAssistant?: () => void
	onWidthChange?: (width: number) => void
	documentId?: string
}

const AIAssistant: React.FC<AIAssistantProps> = ({
	editor,
	aiAssistantOpen = false,
	toggleAiAssistant,
	onWidthChange,
	documentId,
}) => {
	const [width, setWidth] = useState(320) // Default width 320px
	const [isResizing, setIsResizing] = useState(false)
	const indexingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

	// Sync document to vector store when updated
	useEffect(() => {
		const tiptapEditor = editor?.editor
		if (!tiptapEditor || !documentId) return

		const handleUpdate = () => {
			if (indexingTimeoutRef.current) clearTimeout(indexingTimeoutRef.current)
			
			// Debounce 5 seconds without typing before indexing
			indexingTimeoutRef.current = setTimeout(async () => {
				try {
					const content = tiptapEditor.getText()
					// Only index if there is substantial text
					if (!content || content.length < 50) return
					
					// Find the title (usually in the first heading)
					let title = 'Untitled'
					const json = tiptapEditor.getJSON()
					json.content?.find((node: any) => {
						if (node.type === 'heading' && node.content) {
							title = node.content.map((c: any) => c.text || '').join('')
							return true
						}
						return false
					})

					await fetch('/api/ai-rag-index', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							documentId,
							content,
							title,
						}),
					})
				} catch (err) {
					console.error('[AI] Failed to index document:', err)
				}
			}, 5000)
		}

		tiptapEditor.on('update', handleUpdate)

		return () => {
			tiptapEditor.off('update', handleUpdate)
			if (indexingTimeoutRef.current) clearTimeout(indexingTimeoutRef.current)
		}
	}, [editor?.editor, documentId])

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault()
			setIsResizing(true)

			const startX = e.clientX
			const startWidth = width

			const handleMouseMove = (moveEvent: MouseEvent) => {
				const deltaX = startX - moveEvent.clientX
				const newWidth = Math.min(Math.max(startWidth + deltaX, 280), 600) // min 280px, max 600px
				setWidth(newWidth)
				if (onWidthChange) {
					onWidthChange(newWidth)
				}
			}

			const handleMouseUp = () => {
				setIsResizing(false)
				document.removeEventListener('mousemove', handleMouseMove)
				document.removeEventListener('mouseup', handleMouseUp)
			}

			document.addEventListener('mousemove', handleMouseMove)
			document.addEventListener('mouseup', handleMouseUp)
		},
		[width, onWidthChange]
	)

	if (!aiAssistantOpen) return null

	return (
		<div
			className='bg-white border-l border-gray-200 shadow-lg flex shrink-0 relative overflow-hidden'
			style={{ 
				width: `${width}px`,
				height: '100%', // Full height of parent container
				position: 'sticky',
				top: 0,
				right: 0,
				maxHeight: '100%',
			}}
		>
			{/* Resize Handle */}
			<div
				className={`absolute left-0 top-0 h-full w-1 cursor-ew-resize hover:bg-blue-500 transition-colors z-10 ${
					isResizing ? 'bg-blue-500' : 'bg-transparent hover:bg-blue-300'
				}`}
				onMouseDown={handleMouseDown}
			>
				<div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-gray-300 opacity-0 hover:opacity-100 transition-opacity' />
			</div>

			{/* Content - with independent scroll */}
			<div className='flex-1 flex flex-col overflow-hidden'>
				{/* AI Chat Panel Content - scrollable independently */}
				<AIChatPanel editor={editor} onClose={toggleAiAssistant} documentId={documentId} />
			</div>
		</div>
	)
}

export default AIAssistant
