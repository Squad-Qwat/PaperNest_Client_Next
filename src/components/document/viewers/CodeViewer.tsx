'use client'

import {
	autocompletion,
	closeBrackets,
	closeBracketsKeymap,
	completionKeymap,
} from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { bracketMatching, foldGutter, foldKeymap, indentOnInput } from '@codemirror/language'
import { lintKeymap } from '@codemirror/lint'
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search'
import { EditorState, type Extension } from '@codemirror/state'
import {
	crosshairCursor,
	drawSelection,
	dropCursor,
	EditorView,
	highlightActiveLine,
	highlightActiveLineGutter,
	keymap,
	lineNumbers,
	rectangularSelection,
} from '@codemirror/view'
import { latex } from 'codemirror-lang-latex'
import { Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { apiClient } from '@/lib/api/clients/api-client'
import { paperNestThemeExtension } from '@/lib/editor/latex-theme'

interface CodeViewerProps {
	file: {
		fileId: string
		name: string
		content: string
		url: string
	}
	readOnly?: boolean
	onChange?: (newContent: string) => void
	onViewReady?: (view: EditorView | null) => void
}

export function CodeViewer({ file, readOnly = false, onChange, onViewReady }: CodeViewerProps) {
	const containerRef = useRef<HTMLDivElement>(null)
	const viewRef = useRef<EditorView | null>(null)
	const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
	const [isSaving, setIsSaving] = useState(false)
	const fileSnapshotRef = useRef(file)

	// Keep snapshot updated
	useEffect(() => {
		fileSnapshotRef.current = file
	}, [file])

	// Cleanup on unmount or file change
	useEffect(() => {
		if (autoSaveTimerRef.current) {
			clearTimeout(autoSaveTimerRef.current)
		}
	}, [])

	useEffect(() => {
		if (!containerRef.current) return

		const onUpdate = (content: string) => {
			onChange?.(content)

			if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
			const fileSnapshot = fileSnapshotRef.current

			autoSaveTimerRef.current = setTimeout(async () => {
				setIsSaving(true)
				try {
					const urlObj = new URL(fileSnapshot.url)
					const r2Key = urlObj.pathname.replace(/^\//, '')

					const presignedRes = await apiClient.post<{ presignedUrl: string; key: string }>(
						'/upload/overwrite-url',
						{
							r2Key,
							contentType: 'text/plain',
						}
					)

					const uploadRes = await fetch(presignedRes.presignedUrl, {
						method: 'PUT',
						headers: { 'Content-Type': 'text/plain' },
						body: content,
					})

					if (uploadRes.ok) {
						window.dispatchEvent(
							new CustomEvent('aux-file-autosaved', {
								detail: { fileId: fileSnapshot.fileId, content },
							})
						)
					}
				} catch (err) {
					console.error('[CodeViewer] Aux file autosave failed:', err)
				} finally {
					setIsSaving(false)
				}
			}, 3000)
		}

		const baseExtensions: Extension[] = [
			lineNumbers(),
			highlightActiveLineGutter(),
			history(),
			foldGutter(),
			drawSelection(),
			dropCursor(),
			EditorState.allowMultipleSelections.of(true),
			indentOnInput(),
			...paperNestThemeExtension,
			bracketMatching(),
			closeBrackets(),
			autocompletion(),
			rectangularSelection(),
			crosshairCursor(),
			highlightActiveLine(),
			highlightSelectionMatches(),
			keymap.of([
				indentWithTab,
				...closeBracketsKeymap,
				...defaultKeymap,
				...searchKeymap,
				...historyKeymap,
				...foldKeymap,
				...completionKeymap,
				...lintKeymap,
			]),
			latex(),
			EditorView.lineWrapping,
			EditorView.updateListener.of((update) => {
				if (update.docChanged) {
					onUpdate(update.state.doc.toString())
				}
			}),
			EditorState.readOnly.of(readOnly),
		]

		const state = EditorState.create({
			doc: file.content || '',
			extensions: baseExtensions,
		})

		const view = new EditorView({
			state,
			parent: containerRef.current,
		})

		viewRef.current = view
		onViewReady?.(view)

		return () => {
			view.destroy()
			viewRef.current = null
			onViewReady?.(null)
		}
	}, [readOnly, file.content, onChange, onViewReady])

	return (
		<div className='flex-1 min-h-0 w-full relative flex flex-col h-full'>
			<div ref={containerRef} className='flex-1 min-h-0 w-full cm-editor-container' />
			{isSaving && (
				<div className='absolute bottom-3 right-3 bg-white/90 backdrop-blur border border-gray-200 px-2 py-1 rounded shadow-sm flex items-center gap-1.5 text-xs text-gray-500 z-10'>
					<Loader2 className='w-3.5 h-3.5 animate-spin text-blue-500' />
					Saving...
				</div>
			)}
		</div>
	)
}
