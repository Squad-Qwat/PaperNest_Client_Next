'use client'

import React, { useEffect, useRef } from 'react'
import { Extension } from '@codemirror/state'
import { EditorView, lineNumbers, highlightActiveLineGutter } from '@codemirror/view'
import { MergeView } from '@codemirror/merge'
import { latex } from 'codemirror-lang-latex'
import { syntaxHighlighting, defaultHighlightStyle, foldGutter } from '@codemirror/language'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'

interface MergePreviewProps {
    original: string
    modified: string
    onAccept: (content: string) => void
    onDiscard: () => void
}

export function MergePreview({ original, modified, onAccept, onDiscard }: MergePreviewProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const mergeViewRef = useRef<MergeView | null>(null)

    useEffect(() => {
        if (!containerRef.current) return

        const commonExtensions: Extension[] = [
            lineNumbers(),
            highlightActiveLineGutter(),
            foldGutter(),
            syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
            latex(),
            EditorView.lineWrapping,
            EditorView.editable.of(false)
        ]

        const mergeView = new MergeView({
            a: {
                doc: original,
                extensions: [...commonExtensions, EditorView.editorAttributes.of({ class: 'merge-original' })]
            },
            b: {
                doc: modified,
                extensions: [...commonExtensions, EditorView.editorAttributes.of({ class: 'merge-modified' })]
            },
            parent: containerRef.current,
            orientation: 'a-b',
            revertControls: 'a-to-b',
            collapseUnchanged: { margin: 3, minSize: 10 },
            highlightChanges: true,
            gutter: true
        })

        mergeViewRef.current = mergeView

        // Auto-scroll to the first change in the modified document (side b)
        const timer = setTimeout(() => {
            if (!mergeView.b) return
            
            const docA = original.split('\n')
            const docB = modified.split('\n')
            let firstChangeLine = -1
            
            for (let i = 0; i < Math.max(docA.length, docB.length); i++) {
                if (docA[i] !== docB[i]) {
                    firstChangeLine = i + 1
                    break
                }
            }
            
            if (firstChangeLine !== -1) {
                try {
                    const line = mergeView.b.state.doc.line(Math.min(firstChangeLine, mergeView.b.state.doc.lines))
                    mergeView.b.dispatch({
                        selection: { anchor: line.from },
                        scrollIntoView: true
                    })
                } catch (e) {
                    console.warn('Could not scroll to first change:', e)
                }
            }
        }, 150)

        return () => {
            clearTimeout(timer)
            mergeView.destroy()
        }
    }, [original, modified])

    return (
        <div className="flex flex-col h-full w-full bg-white relative overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50 z-10 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">Review AI Suggestion</span>
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Merge Preview</span>
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
                        className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white gap-1.5"
                        onClick={() => onAccept(modified)}
                    >
                        <Check className="w-3.5 h-3.5" />
                        Accept Changes
                    </Button>
                </div>
            </div>
            
            <div ref={containerRef} className="flex-1 overflow-hidden cm-merge-container min-h-0" />

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
                
                /* Styling for original and modified sides */
                .merge-original {
                    background-color: #fffafb !important;
                }
                .merge-modified {
                    background-color: #f6fff8 !important;
                }
                /* Custom diff colors */
                .cm-merge-container .cm-deletedText {
                    background-color: rgba(239, 68, 68, 0.2) !important;
                    text-decoration: line-through;
                    color: #b91c1c !important;
                }
                .cm-merge-container .cm-insertedText {
                    background-color: rgba(34, 197, 94, 0.2) !important;
                    color: #15803d !important;
                }
                /* Change chunk borders */
                .cm-merge-container .cm-merge-changed-line {
                    background-color: rgba(59, 130, 246, 0.05);
                }
                /* Ensure fold gutters and line numbers are visible */
                .cm-merge-container .cm-gutters {
                    background-color: #f9fafb !important;
                    border-right: 1px solid #e5e7eb !important;
                    min-width: 30px;
                }
            `}</style>
        </div>
    )
}
