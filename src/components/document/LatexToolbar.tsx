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
    Sigma
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
    undo?: () => void;
    redo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
    insertTable?: () => void;
}

export default function LatexToolbar({
    editor,
    undo,
    redo,
    canUndo,
    canRedo,
    insertTable
}: LatexToolbarProps) {
    
    const insertSnippet = (snippet: string, selectionOffset: number = 0) => {
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
    }

    const wrapInCommand = (command: string) => {
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
            <div className="flex items-center gap-1 p-1 bg-white/50 backdrop-blur-sm border-b border-gray-200 overflow-x-auto no-scrollbar">
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
            </div>
        </TooltipProvider>
    )
}
