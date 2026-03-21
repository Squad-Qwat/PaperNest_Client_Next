'use client'

import React, { useEffect, useRef } from 'react'
import { Extension, EditorState } from '@codemirror/state'
import { EditorView, lineNumbers, highlightActiveLineGutter } from '@codemirror/view'
import { MergeView, unifiedMergeView } from '@codemirror/merge'
import { latex } from 'codemirror-lang-latex'
import { syntaxHighlighting, defaultHighlightStyle, foldGutter } from '@codemirror/language'
import { Button } from '@/components/ui/button'
import { Check, X, Columns, Rows } from 'lucide-react'

interface MergePreviewProps {
    original: string
    modified: string
    queuePosition?: number
    queueTotal?: number
    onAccept: (content: string) => void
    onAcceptAll?: () => void
    onDiscard: () => void
}

export function MergePreview({ original, modified, queuePosition = 0, queueTotal = 0, onAccept, onAcceptAll, onDiscard }: MergePreviewProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const mergeViewRef = useRef<MergeView | null>(null)
    const editorViewRef = useRef<EditorView | null>(null)
    const [viewMode, setViewMode] = React.useState<'side-by-side' | 'unified'>('unified')

    useEffect(() => {
        if (!containerRef.current) return

        const commonExtensions: Extension[] = [
            lineNumbers(),
            highlightActiveLineGutter(),
            foldGutter(),
            syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
            latex(),
            EditorView.lineWrapping,
        ]

        if (viewMode === 'side-by-side') {
            const mergeView = new MergeView({
                a: {
                    doc: original,
                    extensions: [...commonExtensions, EditorView.editable.of(false), EditorView.editorAttributes.of({ class: 'merge-original' })]
                },
                b: {
                    doc: modified,
                    extensions: [...commonExtensions, EditorView.editable.of(false), EditorView.editorAttributes.of({ class: 'merge-modified' })]
                },
                parent: containerRef.current,
                orientation: 'a-b',
                revertControls: 'a-to-b',
                collapseUnchanged: { margin: 3, minSize: 10 },
                highlightChanges: true,
                gutter: true
            })
            mergeViewRef.current = mergeView

            const timer = setTimeout(() => {
                if (!mergeView.b) return
                const docA = original.split('\n'), docB = modified.split('\n')
                let firstChangeLine = -1
                for (let i = 0; i < Math.max(docA.length, docB.length); i++) {
                    if (docA[i] !== docB[i]) { firstChangeLine = i + 1; break; }
                }
                if (firstChangeLine !== -1) {
                    try {
                        const line = mergeView.b.state.doc.line(Math.min(firstChangeLine, mergeView.b.state.doc.lines))
                        mergeView.b.dispatch({ selection: { anchor: line.from }, scrollIntoView: true })
                    } catch (e) { }
                }
            }, 150)

            return () => { clearTimeout(timer); mergeView.destroy(); mergeViewRef.current = null; }
        } else {
            const state = EditorState.create({
                doc: modified,
                extensions: [
                    ...commonExtensions,
                    EditorView.editable.of(false),
                    unifiedMergeView({
                        original,
                        collapseUnchanged: { margin: 3, minSize: 10 },
                        gutter: true,
                        syntaxHighlightDeletions: true,
                        mergeControls: (type, action) => {
                            const btn = document.createElement("button")
                            btn.className = `cm-merge-control cm-merge-control-${type} pb-5`
                            btn.innerHTML = `<span>${type === "accept" ? "Accept" : "Reject"}</span>`
                            btn.onclick = (e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                action(e)
                            }
                            return btn
                        }
                    })
                ]
            })
            const view = new EditorView({
                state,
                parent: containerRef.current
            })
            editorViewRef.current = view

            const timer = setTimeout(() => {
                const docA = original.split('\n'), docB = modified.split('\n')
                let firstChangeLine = -1
                for (let i = 0; i < Math.max(docA.length, docB.length); i++) {
                    if (docA[i] !== docB[i]) { firstChangeLine = i + 1; break; }
                }
                if (firstChangeLine !== -1) {
                    try {
                        const line = view.state.doc.line(Math.min(firstChangeLine, view.state.doc.lines))
                        view.dispatch({ selection: { anchor: line.from }, scrollIntoView: true })
                    } catch (e) {
                        console.warn('Could not scroll to first change:', e)
                    }
                }
            }, 150)

            return () => { clearTimeout(timer); view.destroy(); editorViewRef.current = null; }
        }
    }, [original, modified, viewMode])

    return (
        <div className="flex flex-col h-full w-full bg-white relative overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50 z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-700">Review AI Suggestion</span>
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Merge Preview</span>
                        {queueTotal > 0 && (
                            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">
                                {queuePosition} of {queueTotal}
                            </span>
                        )}
                    </div>

                    <div className="flex bg-gray-200/50 p-0.5 rounded-md border border-gray-200">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('side-by-side')}
                            className={`h-7 px-2 text-[10px] gap-1.5 ${viewMode === 'side-by-side' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Columns className="w-3 h-3" />
                            Side-by-side
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('unified')}
                            className={`h-7 px-2 text-[10px] gap-1.5 ${viewMode === 'unified' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Rows className="w-3 h-3" />
                            Unified
                        </Button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs text-gray-500 hover:text-red-600 gap-1.5"
                        onClick={onDiscard}
                    >
                        <X className="w-3.5 h-3.5" />
                        Discard
                    </Button>
                    <Button
                        size="sm"
                        className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                        onClick={() => onAccept(modified)}
                    >
                        <Check className="w-3.5 h-3.5" />
                        Accept This
                    </Button>
                    {queueTotal > 1 && onAcceptAll && (
                        <Button
                            size="sm"
                            className="h-8 text-xs bg-black hover:bg-gray-800 text-white gap-1.5"
                            onClick={onAcceptAll}
                        >
                            <Check className="w-3.5 h-3.5" />
                            Accept All {queueTotal}
                        </Button>
                    )}
                </div>
            </div>

            <div key={viewMode} ref={containerRef} className="flex-1 overflow-hidden cm-merge-container min-h-0" />

            <style jsx global>{`
                .cm-merge-container {
                    display: flex;
                    flex-direction: column;
                }
                .cm-merge-container .cm-mergeView {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    min-height: 0;
                    height: 100%;
                }
                .cm-merge-container .cm-mergeViewEditors {
                    flex: 1;
                    min-height: 0;
                }
                .cm-merge-container .cm-editor {
                    height: 100% !important;
                }
                .cm-merge-container .cm-scroller {
                    overflow: auto !important;
                }
                
                /* Side-by-side styles */
                .merge-original {
                    background-color: #fffafb !important;
                }
                .merge-modified {
                    background-color: #f6fff8 !important;
                }
                
                /* View Colors */
                .cm-merge-deleted {
                    background-color: rgba(239, 68, 68, 0.08) !important;
                }
                .cm-merge-inserted {
                    background-color: rgba(34, 197, 94, 0.08) !important;
                }
                
                /* Diff text highlighting */
                .cm-deletedText {
                    background-color: rgba(239, 68, 68, 0.25) !important;
                    text-decoration: line-through;
                    color: #991b1b !important;
                }
                .cm-insertedText {
                    background-color: rgba(34, 197, 94, 0.25) !important;
                    color: #166534 !important;
                }
                
                /* Change chunk borders */
                .cm-merge-changed-line {
                    background-color: rgba(59, 130, 246, 0.05);
                }
                
                /* Gutters */
                .cm-merge-container .cm-gutters {
                    background-color: #ffffff !important;
                    border-right: 1px solid #e5e7eb !important;
                    min-width: 30px;
                }
                
                /* Minimalist Shadcn/Vercel merge controls */
                .cm-merge-control {
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    padding: 0 8px !important;
                    height: 20px !important;
                    border-radius: 4px !important;
                    border: 1px solid transparent !important;
                    cursor: pointer !important;
                    margin: 2px 4px !important;
                    font-size: 10px !important;
                    font-weight: 500 !important;
                    font-family: inherit !important;
                    transition: all 0.15s ease !important;
                    outline: none !important;
                }
                .cm-merge-control span {
                    pointer-events: none;
                }
                .cm-merge-control-accept {
                    background-color: #16a34a !important;
                    color: white !important;
                    box-shadow: 0 1px 2px rgba(22, 163, 74, 0.1) !important;
                }
                .cm-merge-control-accept:hover {
                    background-color: #15803d !important;
                    transform: translateY(-0.5px);
                }
                .cm-merge-control-reject {
                    background-color: #ef4444 !important;
                    color: white !important;
                    box-shadow: 0 1px 2px rgba(239, 68, 68, 0.1) !important;
                }
                .cm-merge-control-reject:hover {
                    background-color: #dc2626 !important;
                    transform: translateY(-0.5px);
                }
                
                /* Fix for button container in unified view */
                .cm-unified-merge-controls {
                    display: flex !important;
                    padding-top: 4px !important;
                    padding-bottom: 4px !important;
                    border-bottom: 1px solid #f3f4f6 !important;
                    background-color: #fafafa !important;
                }
            `}</style>
        </div>
    )
}
