'use client'

import React from 'react'
import {
    Bold,
    Italic,
    Underline,
    Type,
    List,
    ListOrdered,
    Undo,
    Redo,
    Heading1,
    Heading2,
    Code,
    Table as TableIcon,
    Sigma,
    Loader2,
    Play
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface LatexToolbarProps {
    editor: any; // CodeMirror EditorView
    visualEditor?: any; // Tiptap editor
    viewMode?: 'source' | 'visual';
    toggleViewMode?: () => void;
    undo?: () => void;
    redo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
    insertTable?: () => void;
    handleCompile?: () => void;
    isCompiling?: boolean;
}

export default function LatexToolbar({
    editor,
    visualEditor,
    viewMode = 'source',
    toggleViewMode,
    undo,
    redo,
    canUndo,
    canRedo,
    insertTable,
    handleCompile,
    isCompiling
}: LatexToolbarProps) {

    const insertSnippet = (snippet: string, selectionOffset: number = 0) => {
        if (viewMode === 'source') {
            if (!editor) return

            const selection = editor.state.selection.main
            const text = editor.state.doc.toString()
            const selectedText = text.slice(selection.from, selection.to)

            let insertText = snippet.replace('$SELECTION$', selectedText)

            editor.dispatch({
                changes: {
                    from: selection.from,
                    to: selection.to,
                    insert: insertText
                },
                selection: {
                    anchor: selection.from + selectionOffset + (selectedText ? selectedText.length : 0)
                },
                scrollIntoView: true
            })

            editor.focus()
        } else if (visualEditor) {
            // Very basic Tiptap snippet insertion - could be improved with custom commands
            // For now, we mainly rely on Tiptap's built-in formatting for the toolbar
            visualEditor.chain().focus().insertContent(snippet.replace('$SELECTION$', '')).run()
        }
    }

    const wrapInCommand = (command: string) => {
        if (viewMode === 'visual' && visualEditor) {
            if (command === 'textbf') visualEditor.chain().focus().toggleBold().run();
            else if (command === 'textit') visualEditor.chain().focus().toggleItalic().run();
            else if (command === 'underline') visualEditor.chain().focus().toggleUnderline().run();
            else if (command === 'section') visualEditor.chain().focus().toggleHeading({ level: 1 }).run();
            else if (command === 'subsection') visualEditor.chain().focus().toggleHeading({ level: 2 }).run();
            return;
        }
        insertSnippet(`\\${command}{$SELECTION$}`, command.length + 2)
    }

    const toolbarGroups = [
        {
            name: 'History',
            actions: [
                { icon: <Undo className="w-4 h-4" />, label: 'Undo', onClick: undo, disabled: !canUndo },
                { icon: <Redo className="w-4 h-4" />, label: 'Redo', onClick: redo, disabled: !canRedo },
            ]
        },
        {
            name: 'Basic Formatting',
            actions: [
                { icon: <Bold className="w-4 h-4" />, label: 'Bold', onClick: () => wrapInCommand('textbf'), disabled: false },
                { icon: <Italic className="w-4 h-4" />, label: 'Italic', onClick: () => wrapInCommand('textit'), disabled: false },
                { icon: <Underline className="w-4 h-4" />, label: 'Underline', onClick: () => wrapInCommand('underline'), disabled: false },
            ]
        },
        {
            name: 'Structure',
            actions: [
                { icon: <Heading1 className="w-4 h-4" />, label: 'Section', onClick: () => wrapInCommand('section'), disabled: false },
                { icon: <Heading2 className="w-4 h-4" />, label: 'Subsection', onClick: () => wrapInCommand('subsection'), disabled: false },
                { icon: <Type className="w-4 h-4" />, label: 'Environment', onClick: () => insertSnippet('\\begin{$SELECTION$}\n\n\\end{$SELECTION$}', 7), disabled: false },
            ]
        },
        {
            name: 'Math',
            actions: [
                { icon: <Sigma className="w-4 h-4" />, label: 'Inline Math', onClick: () => insertSnippet('$$SELECTION$$', 1), disabled: false },
                { icon: <Code className="w-4 h-4" />, label: 'Block Math', onClick: () => insertSnippet('\\[\n  $SELECTION$\n\\]', 4), disabled: false },
            ]
        },
        {
            name: 'Lists',
            actions: [
                { icon: <List className="w-4 h-4" />, label: 'Itemize', onClick: () => insertSnippet('\\begin{itemize}\n  \\item $SELECTION$\n\\end{itemize}', 19), disabled: false },
                { icon: <ListOrdered className="w-4 h-4" />, label: 'Enumerate', onClick: () => insertSnippet('\\begin{enumerate}\n  \\item $SELECTION$\n\\end{enumerate}', 21), disabled: false },
            ]
        },
        {
            name: 'Insert',
            actions: [
                { icon: <TableIcon className="w-4 h-4" />, label: 'Table', onClick: insertTable, disabled: false },
            ]
        }
    ]

    return (
        <TooltipProvider delayDuration={400}>
            <div className="flex items-center gap-1 px-4 py-1 bg-white/50 backdrop-blur-sm border-b border-gray-200 overflow-x-auto no-scrollbar">
                {toolbarGroups.map((group, groupIdx) => (
                    <React.Fragment key={group.name}>
                        {groupIdx > 0 && <div className="h-4 w-[1px] bg-gray-300 mx-1 flex-shrink-0" />}
                        <div className="flex items-center gap-0.5">
                            {group.actions.map((action, actionIdx) => (
                                <Tooltip key={`${group.name}-${actionIdx}`}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="w-8 h-8 hover:bg-gray-100 text-gray-600 flex-shrink-0"
                                            onClick={action.onClick}
                                            disabled={action.disabled}
                                        >
                                            {action.icon}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="text-[10px] font-bold uppercase tracking-widest bg-gray-900 border-gray-800">
                                        {action.label}
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                    </React.Fragment>
                ))}

                {handleCompile && (
                    <>
                        <div className="h-4 w-[1px] bg-gray-300 mx-1 flex-shrink-0" />
                        <div className="flex items-center ml-auto pr-2 gap-2">
                            {/* Mode Toggle */}
                            <div className="flex items-center bg-gray-100 rounded-md p-1">
                                <Button
                                    variant={viewMode === 'source' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className={`h-7 px-3 text-[10px] uppercase font-bold tracking-wider ${viewMode === 'source' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => viewMode !== 'source' && toggleViewMode?.()}
                                >
                                    Source
                                </Button>
                                <Button
                                    variant={viewMode === 'visual' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className={`h-7 px-3 text-[10px] uppercase font-bold tracking-wider ${viewMode === 'visual' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => viewMode !== 'visual' && toggleViewMode?.()}
                                >
                                    Visual
                                </Button>
                            </div>

                            <Button
                                variant="default"
                                size="sm"
                                onClick={handleCompile}
                                disabled={isCompiling}
                                className="h-8 transition-all duration-200 active:scale-95 flex items-center gap-2 px-3"
                            >
                                {isCompiling ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Play className="w-3 h-3 fill-current" />
                                )}
                                <span className="text-xs font-bold uppercase tracking-wide">Compile</span>
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </TooltipProvider>
    )
}
