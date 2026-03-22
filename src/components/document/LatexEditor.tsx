'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useLatexEditor } from '@/hooks/editor/use-latex-editor'
import { laTeXService } from '@/lib/latex/LaTeXService'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Play } from 'lucide-react'
import { undo as cmUndo, redo as cmRedo } from '@codemirror/commands'
import { useOthers } from '@liveblocks/react/suspense'
import { LatexVisualEditor } from './LatexVisualEditor'
import { LaTeXConverter } from '@/lib/latex/LaTeXConverter'
import { MergePreview } from './MergePreview'
import { computeCodeMirrorChanges } from '@/lib/utils/diff'
import { DocumentFile } from '@/lib/api/types/document.types'
import { DocumentService } from '@/lib/firebase/document-service'

interface LatexEditorProps {
    documentId?: string | null;
    user?: any;
    initialContent?: string;
    title?: string;
    onEditorReady?: (functions: any) => void;
    onAutoSaveStateChange?: (isSaving: boolean, lastSavedAt: Date | null) => void;
    isPdfHidden?: boolean;
}

type PendingMergeChange = {
    original: string
    modified: string
    searchBlock?: string[]
    replaceBlock?: string[]
    description?: string
}

export function LatexEditor({
    documentId,
    user,
    initialContent,
    title,
    onEditorReady,
    onAutoSaveStateChange,
    isPdfHidden = false
}: LatexEditorProps) {
    const others = useOthers()
    const [isCompiling, setIsCompiling] = useState(false)
    const [compileResult, setCompileResult] = useState<any>(null)
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)
    const [showLog, setShowLog] = useState(false)
    const [editorPdfSplitWidth, setEditorPdfSplitWidth] = useState(55) // Editor width as percentage
    const [isEditorPdfResizing, setIsEditorPdfResizing] = useState(false)
    const [viewMode, setViewMode] = useState<'source' | 'visual'>('source')
    const [visualEditor, setVisualEditor] = useState<any>(null)
    const [pendingMerges, setPendingMerges] = useState<PendingMergeChange[]>([])
    const [files, setFiles] = useState<DocumentFile[]>([]);
    const containerRef = useRef<HTMLDivElement>(null)
    const activePendingMerge = pendingMerges[0] ?? null

    const enqueuePendingMerge = useCallback((data: PendingMergeChange | null) => {
        if (!data) return
        setPendingMerges(prev => [...prev, data])
    }, [])

    const consumePendingMerge = useCallback(() => {
        setPendingMerges(prev => prev.slice(1))
    }, [])

    const collaborators = useMemo(() => {
        return others.map((other) => {
            const info = other.info as any
            const name = info?.name || (typeof info?.email === 'string' ? info.email.split('@')[0] : 'Guest')

            return {
                id: String(other.connectionId),
                name,
                avatar: info?.avatar,
                color: info?.color || '#6b7280',
            }
        })
    }, [others])

    const visibleCollaborators = collaborators.slice(0, 4)
    const hiddenCollaboratorsCount = Math.max(collaborators.length - visibleCollaborators.length, 0)

    const {
        editorRef,
        view,
        isSaving,
        collaborationReady
    } = useLatexEditor({
        documentId,
        user,
        initialContent
    })

    const applyPendingMerge = useCallback((
        merge: PendingMergeChange,
        fallbackContent?: string
    ): boolean => {
        if (!view) return false

        const currentDoc = view.state.doc.toString()
        const isApplyDiffMerge = Array.isArray(merge.searchBlock) && Array.isArray(merge.replaceBlock)
        let applied = false

        if (isApplyDiffMerge) {
            const searchBlock = merge.searchBlock ?? []
            const replaceBlock = merge.replaceBlock ?? []

            if (searchBlock.length === replaceBlock.length && searchBlock.length > 0) {
                const ranges: Array<{ from: number; to: number; insert: string }> = []
                let searchFrom = 0
                let batchValid = true

                for (let i = 0; i < searchBlock.length; i++) {
                    const search = searchBlock[i]
                    const replace = replaceBlock[i]

                    if (typeof search !== 'string' || typeof replace !== 'string' || search.length === 0) {
                        batchValid = false
                        break
                    }

                    const firstIndex = currentDoc.indexOf(search, searchFrom)
                    if (firstIndex === -1) {
                        batchValid = false
                        break
                    }

                    ranges.push({ from: firstIndex, to: firstIndex + search.length, insert: replace })
                    searchFrom = firstIndex + search.length
                }

                if (batchValid) {
                    ranges.sort((a, b) => b.from - a.from)
                    view.dispatch({
                        changes: ranges,
                        scrollIntoView: false,
                    })
                    applied = true
                }
            }
        }

        // FALLBACK: If surgical replace failed or not applicable, try granular diffing
        if (!applied && typeof fallbackContent === 'string') {
            const changes = computeCodeMirrorChanges(currentDoc, fallbackContent)
            if (changes.length > 0) {
                view.dispatch({
                    changes,
                    scrollIntoView: false,
                })
                applied = true
            }
        }

        return applied
    }, [view])

    // Fetch files when documentId changes
    useEffect(() => {
        if (documentId) {
            DocumentService.getDocumentFiles(documentId).then(setFiles);
        }
    }, [documentId]);

    // Report editor functions back to parent
    useEffect(() => {
        if (view && onEditorReady) {
            onEditorReady({
                getCurrentContent: () => view.state.doc.toString(),
                getCurrentHTML: () => view.state.doc.toString(),
                saveCurrentContent: async () => {
                    // This is usually handled by the hook's auto-save, 
                    // but we expose it for manual saves
                    if (documentId) {
                        const content = view.state.doc.toString()
                        const { DocumentService } = await import('@/lib/firebase/document-service')
                        await DocumentService.updateDocument(documentId, { savedContent: content })
                    }
                },
                editor: view,
                undo: () => cmUndo(view),
                redo: () => cmRedo(view),
                canUndo: true, // CM manages this internally, but we enable the button
                canRedo: true,
                insertTable: () => {
                    const selection = view.state.selection.main
                    view.dispatch({
                        changes: {
                            from: selection.from,
                            to: selection.to,
                            insert: "\\begin{tabular}{|l|l|}\n\\hline\n  $SELECTION$ &  \\\\\n\\hline\n\\end{tabular}"
                        },
                        selection: { anchor: selection.from + 16 }
                    })
                    view.focus()
                },
                handleCompile,
                isCompiling,
                compileResult,
                visibleCollaborators,
                hiddenCollaboratorsCount,
                viewMode,
                visualEditor,
                toggleViewMode: () => {
                    if (viewMode === 'source') {
                        setViewMode('visual');
                    } else {
                        setViewMode('source');
                    }
                },
                setPendingMerge: enqueuePendingMerge
            })
        }
    }, [view, onEditorReady, documentId, isCompiling, visibleCollaborators, hiddenCollaboratorsCount, viewMode, visualEditor, enqueuePendingMerge])

    const handleCompile = async () => {
        if (!view) return

        setIsCompiling(true)
        try {
            // Use modified content if a merge is pending, otherwise use current editor content
            const content = activePendingMerge ? activePendingMerge.modified : view.state.doc.toString()
            
            // Re-fetch files to ensure we have the latest list (in case of recent uploads)
            let currentFiles = files;
            if (documentId) {
                currentFiles = await DocumentService.getDocumentFiles(documentId);
                setFiles(currentFiles);
            }

            const result = await laTeXService.compileWithAssets('main.tex', content, currentFiles)
            setCompileResult(result)

            if (result.pdf) {
                const blob = new Blob([result.pdf as any], { type: 'application/pdf' })
                if (pdfUrl) URL.revokeObjectURL(pdfUrl)
                setPdfUrl(URL.createObjectURL(blob))
                if (result.status !== 0) setShowLog(true)
            } else {
                setShowLog(true)
            }
        } finally {
            setIsCompiling(false)
        }
    }

    // Report auto-save state back to parent
    useEffect(() => {
        if (onAutoSaveStateChange) {
            onAutoSaveStateChange(isSaving, null)
        }
    }, [isSaving, onAutoSaveStateChange])

    // Cleanup PDF URL on unmount
    useEffect(() => {
        return () => {
            if (pdfUrl) URL.revokeObjectURL(pdfUrl)
        }
    }, [pdfUrl])

    // Handle resize between editor and PDF viewer
    const handleSplitMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault()
            setIsEditorPdfResizing(true)

            const startX = e.clientX
            const startWidth = editorPdfSplitWidth
            const containerWidth = containerRef.current?.offsetWidth || 0

            const handleMouseMove = (moveEvent: MouseEvent) => {
                const deltaX = moveEvent.clientX - startX
                const deltaPercent = (deltaX / containerWidth) * 100
                const newWidth = Math.min(Math.max(startWidth + deltaPercent, 30), 70) // 30-70% for editor
                setEditorPdfSplitWidth(newWidth)
            }

            const handleMouseUp = () => {
                setIsEditorPdfResizing(false)
                document.removeEventListener('mousemove', handleMouseMove)
                document.removeEventListener('mouseup', handleMouseUp)
            }

            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
        },
        [editorPdfSplitWidth]
    )

    return (
        <div className="flex flex-col h-full w-full bg-white overflow-hidden">

            <div className="flex flex-1 overflow-hidden" ref={containerRef}>
                {/* Editor Container - Resizable Width */}
                <div
                    className="overflow-hidden relative bg-white border-r border-gray-100"
                    style={{ width: `${editorPdfSplitWidth}%` }}
                >
                    <div
                        ref={editorRef}
                        className={`h-full w-full cm-editor-container ${viewMode !== 'source' || activePendingMerge ? 'hidden' : ''}`}
                    />

                    {activePendingMerge && (
                        <MergePreview
                            original={activePendingMerge.original}
                            modified={activePendingMerge.modified}
                            queuePosition={pendingMerges.length > 0 ? pendingMerges.length - pendingMerges.indexOf(activePendingMerge) : 0}
                            queueTotal={pendingMerges.length}
                            onAccept={(content) => {
                                const mergeToApply = activePendingMerge
                                if (!mergeToApply) return

                                const applied = applyPendingMerge(mergeToApply, content)
                                if (!applied) {
                                    console.warn('Merge preview apply failed: staged apply_diff_edit no longer matches current document.')
                                    return
                                }

                                consumePendingMerge()
                            }}
                            onAcceptAll={() => {
                                if (!view) return

                                let appliedCount = 0
                                for (let index = 0; index < pendingMerges.length; index++) {
                                    const merge = pendingMerges[index]
                                    const applied = applyPendingMerge(merge, merge.modified)

                                    if (!applied) {
                                        console.warn(`Accept All: Merge ${index + 1} failed - search text not found.`)
                                        break
                                    }

                                    appliedCount++
                                }

                                setPendingMerges(prev => prev.slice(appliedCount))
                            }}
                            onDiscard={() => consumePendingMerge()}
                        />
                    )}

                    {viewMode === 'visual' && !activePendingMerge && (
                        <LatexVisualEditor
                            content={view?.state.doc.toString() || initialContent || ''}
                            onEditorReady={setVisualEditor}
                            onChange={(newContent) => {
                                if (view) {
                                    view.dispatch({
                                        changes: {
                                            from: 0,
                                            to: view.state.doc.length,
                                            insert: newContent
                                        }
                                    });
                                }
                            }}
                        />
                    )}

                    {/* Cloud Sync Indicator */}
                    {!isSaving && collaborationReady && (
                        <div className="absolute bottom-3 right-3 text-[10px] font-medium text-gray-400 bg-white/50 px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity">
                            Synced
                        </div>
                    )}
                </div>

                {/* Resize Handle */}
                <div
                    className={`w-1 cursor-col-resize hover:bg-blue-400 transition-colors ${isEditorPdfResizing ? 'bg-blue-500' : 'bg-gray-200 hover:bg-blue-300'
                        }`}
                    onMouseDown={handleSplitMouseDown}
                    style={{
                        userSelect: 'none',
                        flex: '0 0 auto',
                    }}
                    title="Drag to resize editor and PDF viewer"
                />

                {/* Preview Container - Resizable Width */}
                <div
                    className={`overflow-hidden relative transition-all duration-200 ${pdfUrl ? 'bg-[#525659]' : 'bg-gray-50'}`}
                    style={{
                        width: `${100 - editorPdfSplitWidth}%`,
                        display: isEditorPdfResizing || isPdfHidden ? 'none' : 'flex',
                    }}
                >
                    {pdfUrl ? (
                        <div className="w-full h-full flex flex-col">
                            <iframe
                                src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                                className="w-full h-full border-none"
                                title="PDF Preview"
                            />
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-4 text-center text-sm">
                            <FileTextIcon className="w-10 h-10 mb-3 opacity-20" />
                            <p className="font-medium">Ready to compile</p>
                            <p className="text-xs text-gray-500 mt-1">Press "Compile" to see preview</p>
                        </div>
                    )}

                    {/* Logs Toggle */}
                    {compileResult && (
                        <button
                            onClick={() => setShowLog(!showLog)}
                            className={`absolute bottom-3 left-3 z-20 px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${compileResult.status === 0
                                ? 'bg-green-500/90 hover:bg-green-600 text-white'
                                : 'bg-red-500/90 hover:bg-red-600 text-white'
                                }`}
                        >
                            {showLog ? 'Hide' : 'Logs'}
                        </button>
                    )}
                </div>
            </div>

            {/* Compilation Log Overlay - Compact */}
            {compileResult && showLog && (
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-[#0d1117]/95 text-gray-300 p-4 font-mono text-[10px] overflow-auto border-t border-white/10 z-30">
                    <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${compileResult.status === 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="font-bold text-white">Build Output</span>
                        </div>
                        <button onClick={() => setShowLog(false)} className="text-gray-500 hover:text-white">✕</button>
                    </div>
                    <pre className="whitespace-pre-wrap leading-relaxed selection:bg-blue-500/30">
                        {compileResult.log}
                    </pre>
                </div>
            )}
        </div>
    )
}

function FileTextIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
    )
}
