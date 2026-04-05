// @ts-nocheck
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { EditorState, Extension } from '@codemirror/state'
import {
    EditorView, keymap, drawSelection, highlightActiveLine, dropCursor,
    rectangularSelection, crosshairCursor, lineNumbers, highlightActiveLineGutter, ViewUpdate
} from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { indentOnInput, syntaxHighlighting, bracketMatching, foldGutter, foldKeymap } from '@codemirror/language'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { lintKeymap } from '@codemirror/lint'
import { latex } from 'codemirror-lang-latex'
import { yCollab } from 'y-codemirror.next'

import { useLatexCollaboration } from './use-latex-collaboration'
import { paperNestThemeExtension } from '@/lib/editor/latex-theme'
import { useBatchUpdateDocument } from '@/lib/api/hooks/use-documents'

interface UseLatexEditorOptions {
    documentId?: string | null;
    user?: any;
    initialContent?: string;
    enabled?: boolean;
    autoSaveInterval?: number;
}

export function useLatexEditor({
    documentId = null,
    user = null,
    initialContent = '',
    enabled = true,
    autoSaveInterval = 2000
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
        awareness
    } = useLatexCollaboration({
        enabled: !!documentId && enabled,
        user,
        documentId
    })

    const onUpdate = useCallback((update: ViewUpdate) => {
        if (update.docChanged && documentId) {
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
            autoSaveTimerRef.current = setTimeout(async () => {
                const content = update.state.doc.toString()
                setIsSaving(true)
                try {
                    await batchUpdate({
                        documentId,
                        request: {
                            operations: [{
                                operationType: 'save-content',
                                payload: { content }
                            }]
                        }
                    })
                } catch (err) {
                    console.error('Auto-save failed:', err)
                } finally {
                    setIsSaving(false)
                }
            }, autoSaveInterval)
        }
    }, [documentId, autoSaveInterval])

    useEffect(() => {
        if (!editorRef.current || (enabled && (!collaborationReady || !hasSyncedOnce))) return

        const yText = yDoc ? yDoc.getText('latex') : null

        // If Yjs is ready and empty, but we have initial content, seed it
        if (yText?.length === 0 && initialContent && initialContent !== 'Start writing here...') {
            yText.insert(0, initialContent)
            console.log('📝 [LaTeX] Loaded initial content from Firestore')
        } else if (yText?.length === 0 && !initialContent) {
            console.log('🔄 [LaTeX] Skipping Firestore init - relying on Yjs sync from existing room')
        }

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
                ...lintKeymap
            ]),
            latex(),
            EditorView.lineWrapping,
            EditorView.updateListener.of(onUpdate)
        ]

        if (yText && awareness) {
            extensions.push(yCollab(yText, awareness, { undoManager: undoManager as any }))
        }

        const state = EditorState.create({
            doc: yText ? yText.toJSON() : initialContent,
            extensions
        })

        const newView = new EditorView({
            state,
            parent: editorRef.current
        })

        viewRef.current = newView
        setIsReady(true)

        return () => {
            newView.destroy()
            viewRef.current = null
            setIsReady(false)
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
        }
    }, [collaborationReady, hasSyncedOnce, enabled]) // Removed initialContent from dependencies

    return {
        editorRef,
        view: viewRef.current,
        isReady,
        isSaving,
        collaborationReady
    }
}
