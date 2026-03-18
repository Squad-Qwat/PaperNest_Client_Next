'use client'

import React, { useState, useEffect } from 'react'
import { useLatexEditor } from '@/hooks/editor/use-latex-editor'
import { laTeXService } from '@/lib/latex/LaTeXService'
import { Button } from '@/components/ui/button'
import { Loader2, Play } from 'lucide-react'
import { undo as cmUndo, redo as cmRedo } from '@codemirror/commands'
import { EditorView } from '@codemirror/view'

interface LatexEditorProps {
    documentId?: string | null;
    user?: any;
    initialContent?: string;
    title?: string;
    onEditorReady?: (functions: any) => void;
    onAutoSaveStateChange?: (isSaving: boolean, lastSavedAt: Date | null) => void;
}

export function LatexEditor({
    documentId,
    user,
    initialContent,
    title,
    onEditorReady,
    onAutoSaveStateChange
}: LatexEditorProps) {
    const [isCompiling, setIsCompiling] = useState(false)
    const [compileResult, setCompileResult] = useState<any>(null)
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)
    const [showLog, setShowLog] = useState(false)

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
                }
            })
        }
    }, [view, onEditorReady, documentId])

    const handleCompile = async () => {
        if (!view) return
        
        setIsCompiling(true)
        try {
            const content = view.state.doc.toString()
            const result = await laTeXService.compileSingleFile('main.tex', content)
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

    return (
        <div className="flex flex-col h-full w-full bg-[#fbfbfb] shadow-2xl border border-gray-200/50 rounded-xl overflow-hidden backdrop-blur-sm">
            {/* Premium Toolbar with Glassmorphism */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200/60 bg-white/70 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-blue-500/10 rounded-md">
                        <Play className="w-4 h-4 text-blue-600 fill-blue-600/20" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-800 tracking-tight truncate max-w-[300px]">
                            {title || 'Untitled Document'}.tex
                        </span>
                        <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${collaborationReady ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                                {collaborationReady ? 'Live Sync Active' : 'Connecting...'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {isSaving && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100/50 rounded-full">
                            <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                            <span className="text-[10px] font-medium text-gray-500">Saving...</span>
                        </div>
                    )}
                    <div className="h-6 w-[1px] bg-gray-200 mx-1" />
                    <Button 
                        variant="default" 
                        size="sm" 
                        onClick={handleCompile}
                        disabled={isCompiling || !collaborationReady}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all duration-200 active:scale-95 flex items-center gap-2 px-4"
                    >
                        {isCompiling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        <span className="font-semibold tracking-wide">Compile</span>
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Editor Container with refined shadows */}
                <div className="flex-1 overflow-hidden relative border-r border-gray-200/50 bg-white group">
                    <div ref={editorRef} className="h-full w-full cm-editor-container transition-all duration-300" />
                    
                    {/* Floating Save Indicator */}
                    {!isSaving && collaborationReady && (
                        <div className="absolute bottom-4 right-6 text-[11px] font-medium text-gray-400 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                            Cloud Synced
                        </div>
                    )}
                </div>

                {/* Preview Container - Multi-pane with smooth transitions */}
                <div className={`flex-1 overflow-hidden relative transition-all duration-500 ease-in-out ${pdfUrl ? 'bg-[#525659]' : 'bg-gray-50'}`}>
                    {pdfUrl ? (
                        <div className="w-full h-full flex flex-col">
                             <iframe 
                                src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} 
                                className="w-full h-full border-none shadow-inner"
                                title="PDF Preview"
                            />
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-8 text-center italic">
                            <FileTextIcon className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-sm font-medium">No preview available.</p>
                            <p className="text-xs mt-1">Press "Compile" to generate your document.</p>
                        </div>
                    )}

                    {/* Quick Logs Toggle */}
                    {compileResult && (
                        <button 
                            onClick={() => setShowLog(!showLog)}
                            className={`absolute bottom-4 left-4 z-20 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all shadow-lg ${
                                compileResult.status === 0 
                                ? 'bg-green-500/90 hover:bg-green-600 text-white' 
                                : 'bg-red-500/90 hover:bg-red-600 text-white'
                            }`}
                        >
                            {showLog ? 'Hide Logs' : 'Show Logs'}
                        </button>
                    )}
                </div>
            </div>

            {/* Premium Compilation Log Overlay */}
            {compileResult && showLog && (
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-[#0d1117]/95 backdrop-blur-xl text-gray-300 p-6 font-mono text-[11px] overflow-auto border-t border-white/10 shadow-2xl animate-in slide-in-from-bottom duration-300 z-30">
                    <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${compileResult.status === 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="font-bold tracking-widest text-white uppercase">Build Output</span>
                        </div>
                        <button onClick={() => setShowLog(false)} className="text-gray-500 hover:text-white transition-colors">
                            Close
                        </button>
                    </div>
                    <pre className="whitespace-pre-wrap leading-relaxed selection:bg-blue-500/30">
                        {compileResult.log}
                    </pre>
                </div>
            )}

            <style jsx global>{`
                .cm-editor-container .cm-editor {
                    height: 100%;
                    outline: none !important;
                }
                .cm-editor-container .cm-scroller {
                    font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', monospace !important;
                    font-size: 14px !important;
                    padding-top: 20px;
                    line-height: 1.6;
                }
                .cm-editor-container .cm-gutters {
                    background-color: transparent !important;
                    border-right: 1px solid #f0f0f0 !important;
                    color: #a0a0a0 !important;
                }
                .cm-editor-container .cm-activeLine {
                    background-color: #f8fafc !important;
                }
                .cm-editor-container .cm-activeLineGutter {
                    background-color: #f1f5f9 !important;
                    color: #3b82f6 !important;
                }
            `}</style>
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
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <line x1="10" y1="9" x2="8" y2="9"/>
        </svg>
    )
}
