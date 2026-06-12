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
import { ghostTextExtension } from '@/lib/editor/ghost-text'
import { latexIndentKeymap } from '@/lib/editor/indent-keymap'
import { latexAutocompleteSource } from '@/lib/editor/latex-autocomplete'
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

	const onChangeRef = useRef(onChange)
	const onViewReadyRef = useRef(onViewReady)
	const initialContentRef = useRef(file.content)

	// Keep callbacks updated
	useEffect(() => {
		onChangeRef.current = onChange
		onViewReadyRef.current = onViewReady
	}, [onChange, onViewReady])

	const prevFileIdRef = useRef(file.fileId)
	if (prevFileIdRef.current !== file.fileId) {
		prevFileIdRef.current = file.fileId
		initialContentRef.current = file.content
	}

	// Keep snapshot updated
	useEffect(() => {
		fileSnapshotRef.current = file
	}, [file])

	// Cleanup on unmount or file change
	useEffect(() => {
		return () => {
			if (autoSaveTimerRef.current) {
				clearTimeout(autoSaveTimerRef.current)
			}
		}
	}, [])

	// 1. Initialize CodeMirror view once per fileId or readOnly state
	useEffect(() => {
		if (!containerRef.current) return

		// Reference fileId inside the effect to satisfy dependency checks
		const _currentFileId = file.fileId

		const onUpdate = (content: string) => {
			onChangeRef.current?.(content)

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
			autocompletion({ override: [latexAutocompleteSource] }),
			rectangularSelection(),
			crosshairCursor(),
			highlightActiveLine(),
			highlightSelectionMatches(),
			latexIndentKeymap,
			...ghostTextExtension(),
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
			latex({ enableAutocomplete: false }),
			EditorView.lineWrapping,
			EditorView.updateListener.of((update) => {
				if (update.docChanged) {
					onUpdate(update.state.doc.toString())
				}
			}),
			EditorState.readOnly.of(readOnly),
		]

		const state = EditorState.create({
			doc: initialContentRef.current || '',
			extensions: baseExtensions,
		})

		const view = new EditorView({
			state,
			parent: containerRef.current,
		})

		viewRef.current = view
		onViewReadyRef.current?.(view)

		return () => {
			view.destroy()
			viewRef.current = null
			onViewReadyRef.current?.(null)
		}
	}, [file.fileId, readOnly])

	// 2. Sync content changes from external sources without recreating the editor
	useEffect(() => {
		const view = viewRef.current
		if (!view) return

		const currentContent = view.state.doc.toString()
		if (file.content !== currentContent) {
			view.dispatch({
				changes: { from: 0, to: view.state.doc.length, insert: file.content || '' },
			})
		}
	}, [file.content])

	return (
		<div className='flex-1 min-h-0 w-full relative flex flex-col h-full'>
			<div ref={containerRef} className='flex-1 min-h-0 w-full cm-editor-container' />
			{isSaving && (
				<div className='absolute bottom-3 right-3 bg-popover/90 backdrop-blur border border-border px-2 py-1 rounded shadow-sm flex items-center gap-1.5 text-xs text-muted-foreground z-10'>
					<Loader2 className='w-3.5 h-3.5 animate-spin text-blue-500' />
					Saving...
				</div>
			)}
		</div>
	)
}
