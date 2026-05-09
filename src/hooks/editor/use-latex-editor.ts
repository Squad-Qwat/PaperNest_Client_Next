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
import { Compartment, EditorState, type Extension } from '@codemirror/state'
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
	readOnly?: boolean
}

// Compartments for dynamic configuration
const collabCompartment = new Compartment()
const readOnlyCompartment = new Compartment()

export function useLatexEditor({
	documentId = null,
	user = null,
	initialContent = '',
	enabled = true,
	autoSaveInterval = 2000,
	readOnly = false,
}: UseLatexEditorOptions = {}) {
	const editorRef = useRef<HTMLDivElement>(null)
	const viewRef = useRef<EditorView | null>(null)
	const [isReady, setIsReady] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
	const initialContentRef = useRef(initialContent)

	const { mutateAsync: batchUpdate } = useBatchUpdateDocument()

	const {
		yDoc,
		undoManager,
		isReady: collaborationReady,
		hasSyncedOnce,
		awareness,
	} = useLatexCollaboration({
		enabled: !!documentId && enabled && !readOnly,
		user,
		documentId,
	})

	const onUpdate = useCallback(
		(update: ViewUpdate) => {
			if (update.docChanged && documentId && !collaborationReady) {
				// Only auto-save to Firestore manually if NOT in collaboration mode
				// (In collaboration mode, the provider handles persistence or we have other sync logic)
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
		[documentId, autoSaveInterval, batchUpdate, collaborationReady]
	)

	// Effect 1: Initialize Editor once
	useEffect(() => {
		if (!editorRef.current || viewRef.current) return

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
			// Initial dynamic extensions
			collabCompartment.of([]),
			readOnlyCompartment.of(EditorState.readOnly.of(readOnly)),
		]

		const shouldWaitForCollab = !!documentId && enabled && !readOnly

		const state = EditorState.create({
			// Start with initial content ONLY if NOT in collaboration mode.
			// If collab is enabled, start EMPTY and let Yjs sync the content to avoid duplication.
			doc: !shouldWaitForCollab ? (initialContentRef.current || '') : '',
			extensions: baseExtensions,
		})

		const view = new EditorView({
			state,
			parent: editorRef.current,
		})

		viewRef.current = view
		setIsReady(true)

		return () => {
			view.destroy()
			viewRef.current = null
			setIsReady(false)
		}
	}, [onUpdate, readOnly])

	// Effect 2: Update Collaboration Extension dynamically
	useEffect(() => {
		const view = viewRef.current
		if (!view || !collaborationReady || !yDoc || !awareness) {
			// Clear collaboration if not ready
			if (view) {
				view.dispatch({
					effects: collabCompartment.reconfigure([]),
				})
			}
			return
		}

		const yText = yDoc.getText('latex')
		const extension = yCollab(yText, awareness, { undoManager: undoManager as any })

		view.dispatch({
			effects: collabCompartment.reconfigure(extension),
		})
	}, [collaborationReady, yDoc, awareness, undoManager])

	// Effect 3: Update ReadOnly state dynamically
	useEffect(() => {
		const view = viewRef.current
		if (!view) return

		view.dispatch({
			effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(readOnly)),
		})
	}, [readOnly])

	// Effect 4: Update content if collaboration is NOT being used and initialContent changes
	// CRITICAL: We only do this manual update if collaboration is disabled.
	// If collaboration is enabled, we MUST wait for Yjs to sync to avoid duplication.
	const shouldWaitForCollab = !!documentId && enabled && !readOnly

	useEffect(() => {
		const view = viewRef.current
		if (!view || collaborationReady || shouldWaitForCollab || !initialContent) return

		// Only update if the current content is different to avoid cursor jumps
		const currentContent = view.state.doc.toString()
		if (currentContent !== initialContent) {
			view.dispatch({
				changes: { from: 0, to: currentContent.length, insert: initialContent },
			})
		}
	}, [initialContent, collaborationReady, shouldWaitForCollab])

	// Effect 5: Handle Seeding (Only once per document lifecycle when collaboration is active)
	const seedingAttemptedRef = useRef(false)
	useEffect(() => {
		if (!collaborationReady || !hasSyncedOnce || !yDoc || seedingAttemptedRef.current) return

		const yText = yDoc.getText('latex')
		const configMap = yDoc.getMap('config')
		
		// If there is already content or it's marked as seeded in the shared map, don't seed
		if (yText.length > 0 || configMap.get('isSeeded')) {
			seedingAttemptedRef.current = true
			return
		}

		const initialText = typeof initialContent === 'string' ? initialContent : ''
		// If it's a new document and we have a template/initial content
		if (initialText && initialText !== 'Start writing here...') {
			yDoc.transact(() => {
				// Re-check inside transaction to be safer
				if (!configMap.get('isSeeded') && yText.length === 0) {
					configMap.set('isSeeded', true)
					yText.insert(0, initialText)
					console.log('📝 [LaTeX] Seeding template content successful')
				}
			})
			seedingAttemptedRef.current = true
		}
	}, [collaborationReady, hasSyncedOnce, yDoc, initialContent])

	return {
		editorRef,
		view: viewRef.current,
		isReady,
		isSaving,
		collaborationReady,
	}
}
