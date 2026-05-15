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
			collabCompartment.of([]),
			readOnlyCompartment.of(EditorState.readOnly.of(readOnly)),
		]

		const shouldWaitForCollab = !!documentId && enabled && !readOnly

		const state = EditorState.create({
			doc: !shouldWaitForCollab ? initialContentRef.current || '' : '',
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
	}, [onUpdate, readOnly, documentId, enabled])

	useEffect(() => {
		const view = viewRef.current
		if (!view || !collaborationReady || !yDoc || !awareness) {
			if (view) {
				view.dispatch({
					effects: collabCompartment.reconfigure([]),
				})
			}
			return
		}

		const yText = yDoc.getText('latex')

		// Fix RangeError: Sync CodeMirror doc with yText BEFORE attaching yCollab
		const currentDocString = view.state.doc.toString()
		const yTextString = yText.toString()
		if (currentDocString !== yTextString) {
			view.dispatch({
				changes: { from: 0, to: currentDocString.length, insert: yTextString },
			})
		}

		const extension = yCollab(yText, awareness, { undoManager: undoManager as any })

		view.dispatch({
			effects: collabCompartment.reconfigure(extension),
		})
	}, [collaborationReady, yDoc, awareness, undoManager])

	useEffect(() => {
		const view = viewRef.current
		if (!view) return

		view.dispatch({
			effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(readOnly)),
		})
	}, [readOnly])

	const shouldWaitForCollab = !!documentId && enabled && !readOnly

	useEffect(() => {
		const view = viewRef.current
		if (!view || collaborationReady || shouldWaitForCollab || !initialContent) return

		const currentContent = view.state.doc.toString()
		if (currentContent !== initialContent) {
			view.dispatch({
				changes: { from: 0, to: currentContent.length, insert: initialContent },
			})
		}
	}, [initialContent, collaborationReady, shouldWaitForCollab])

	const seedingAttemptedRef = useRef(false)
	useEffect(() => {
		if (!collaborationReady || !hasSyncedOnce || !yDoc || seedingAttemptedRef.current) return

		const yText = yDoc.getText('latex')
		const configMap = yDoc.getMap('config')

		if (yText.length > 0 || configMap.get('isSeeded')) {
			seedingAttemptedRef.current = true
			return
		}

		const initialText = typeof initialContent === 'string' ? initialContent : ''
		if (initialText && initialText !== 'Start writing here...') {
			yDoc.transact(() => {
				if (!configMap.get('isSeeded') && yText.length === 0) {
					configMap.set('isSeeded', true)
					yText.insert(0, initialText)
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
