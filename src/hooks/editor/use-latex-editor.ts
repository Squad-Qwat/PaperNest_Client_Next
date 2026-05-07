// @ts-nocheck
'use client'

import {
	autocompletion,
	closeBrackets,
	closeBracketsKeymap,
	completionKeymap,
} from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
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
	type ViewUpdate,
} from '@codemirror/view'
import { latex } from 'codemirror-lang-latex'
import { useCallback, useEffect, useRef, useState } from 'react'
import { yCollab } from 'y-codemirror.next'
import { useBatchUpdateDocument } from '@/lib/api/hooks/use-documents'
import { paperNestThemeExtension } from '@/lib/editor/latex-theme'
import { useLatexCollaboration } from './use-latex-collaboration'

interface UseLatexEditorOptions {
	documentId?: string | null
	user?: any
	initialContent?: string
	enabled?: boolean
	autoSaveInterval?: number
}

export function useLatexEditor({
	documentId = null,
	user = null,
	initialContent = '',
	enabled = true,
	autoSaveInterval = 2000,
}: UseLatexEditorOptions = {}) {
	const editorRef = useRef<HTMLDivElement>(null)
	const viewRef = useRef<EditorView | null>(null)
	const [isReady, setIsReady] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
	const { mutateAsync: batchUpdate } = useBatchUpdateDocument()

	const {
		yDoc,
		undoManager,
		isReady: collaborationReady,
		hasSyncedOnce,
		awareness,
	} = useLatexCollaboration({
		enabled: !!documentId && enabled,
		user,
		documentId,
	})

	const onUpdate = useCallback(
		(update: ViewUpdate) => {
			if (update.docChanged && documentId) {
				if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
				autoSaveTimerRef.current = setTimeout(async () => {
					const content = update.state.doc.toString()
					setIsSaving(true)
					try {
						await batchUpdate({
							documentId,
							request: {
								operations: [
									{
										operationType: 'save-content',
										payload: { content },
									},
								],
							},
						})
					} catch (err) {
						console.error('Auto-save failed:', err)
					} finally {
						setIsSaving(false)
					}
				}, autoSaveInterval)
			}
		},
		[documentId, autoSaveInterval, batchUpdate]
	)

	// Track if seeding has been attempted to avoid duplicate inserts
	const seedingAttemptedRef = useRef(false)

	// Effect 1: Handle Initial Content Seeding (Firestore -> Yjs)
	useEffect(() => {
		if (!enabled || !collaborationReady || !hasSyncedOnce || !yDoc) return
		if (seedingAttemptedRef.current) return

		const initialText = typeof initialContent === 'string' ? initialContent : ''
		const yText = yDoc.getText('latex')
		const configMap = yDoc.getMap('config')
		const isSeeded = configMap.get('isSeeded')

		if (yText.length > 0 || isSeeded) {
			seedingAttemptedRef.current = true
			return
		}

		if (initialText !== 'Start writing here...' && initialText.trim().length > 0) {
			yDoc.transact(() => {
				configMap.set('isSeeded', true)
				yText.insert(0, initialText)
				console.log('📝 [LaTeX] Seeding template content successful')
			})
			seedingAttemptedRef.current = true
		}
	}, [enabled, collaborationReady, hasSyncedOnce, yDoc, initialContent])

	// Effect 2: EditorView Lifecycle
	useEffect(() => {
		if (!editorRef.current || (enabled && !collaborationReady)) return
		if (viewRef.current) return // Prevent duplicate initialization

		const yText = yDoc ? yDoc.getText('latex') : null

		const extensions: Extension[] = [
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
			EditorView.updateListener.of(onUpdate),
		]

		if (yText && awareness) {
			extensions.push(yCollab(yText, awareness, { undoManager: undoManager as any }))
		}

		// Always start with empty string if collaboration is active, yCollab will sync.
		// If not enabled, use initialContent.
		const state = EditorState.create({
			doc: enabled && collaborationReady ? '' : (initialContent || ''),
			extensions,
		})

		const newView = new EditorView({
			state,
			parent: editorRef.current,
		})

		viewRef.current = newView
		setIsReady(true)

		return () => {
			newView.destroy()
			viewRef.current = null
			setIsReady(false)
			if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
		}
	}, [
		collaborationReady,
		enabled,
		awareness,
		onUpdate,
		undoManager,
		yDoc,
		// initialContent removed to prevent recreation
	])

	return {
		editorRef,
		view: viewRef.current,
		isReady,
		isSaving,
		collaborationReady,
	}
}
