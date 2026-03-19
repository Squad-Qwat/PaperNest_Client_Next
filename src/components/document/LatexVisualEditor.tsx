'use client'

import React, { useEffect, useMemo, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Highlight from '@tiptap/extension-highlight'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { MathLiveNode, MathLiveBlockNode } from './tiptap/MathLiveExtension'
import {
    LaTeXFontSize,
    LaTeXFontStyle,
    LaTeXColor,
    LaTeXLayoutCommand,
    LaTeXDocumentCommand,
    LaTeXComment,
    LaTeXEnvironment,
    LaTeXTwocolumn,
    LaTeXBrace,
    LaTeXProtectedBlock,
    LaTeXInlineCommand,
    LaTeXNewline
} from './tiptap/LaTeXExtensions'
import { LaTeXConverter } from '@/lib/latex/LaTeXConverter'

interface LatexVisualEditorProps {
    content: string;
    onChange: (latex: string) => void;
    onEditorReady?: (editor: any) => void;
}

export function LatexVisualEditor({
    content,
    onChange,
    onEditorReady
}: LatexVisualEditorProps) {
    const docParts = useRef<any>({ preamble: '', body: '', postamble: '' });

    // Initial split and memoize HTML
    const htmlContent = useMemo(() => {
        const parts = LaTeXConverter.splitDocument(content);
        docParts.current = parts;
        return LaTeXConverter.toHTML(parts.body);
    }, [content]); // Re-renders if content changes significantly

    const isInternalUpdate = useRef(false);
    const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link,
            Highlight,
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            MathLiveNode,
            MathLiveBlockNode,
            // LaTeX-specific extensions
            LaTeXFontSize,
            LaTeXFontStyle,
            LaTeXColor,
            LaTeXLayoutCommand,
            LaTeXDocumentCommand,
            LaTeXComment,
            LaTeXEnvironment,
            LaTeXTwocolumn,
            LaTeXBrace,
            LaTeXProtectedBlock,
            LaTeXInlineCommand,
            LaTeXNewline
        ],
        content: htmlContent,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            isInternalUpdate.current = true;
            
            if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
            
            syncTimerRef.current = setTimeout(() => {
                const html = editor.getHTML();
                const bodyLatex = LaTeXConverter.toLaTeX(html);
                
                // Merge modified body with original preamble and postamble
                const fullLatex = LaTeXConverter.joinDocument({
                    ...docParts.current,
                    body: bodyLatex
                });
                
                onChange(fullLatex);
            }, 400); 
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-full p-8 bg-white shadow-sm ring-1 ring-gray-200 rounded-lg',
            },
        },
    });

    // Handle external content changes (e.g. from Source mode)
    useEffect(() => {
        if (!editor) return;

        const parts = LaTeXConverter.splitDocument(content);
        // Update stored parts (preamble/postamble might have changed in Source Mode)
        docParts.current = parts;

        if (isInternalUpdate.current) {
            isInternalUpdate.current = false;
            return;
        }

        const currentBodyLatex = LaTeXConverter.toLaTeX(editor.getHTML());
        const normalize = (s: string) => s.trim().replace(/\n+/g, '\n');
        
        if (normalize(parts.body) !== normalize(currentBodyLatex)) {
            editor.commands.setContent(LaTeXConverter.toHTML(parts.body));
        }
    }, [content, editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className="h-full w-full overflow-auto bg-gray-50/50 p-4 flex justify-center">
            <div className="w-full max-w-4xl h-fit">
                <EditorContent editor={editor} className="h-full" />
            </div>
            
            <style jsx global>{`
                .ProseMirror {
                    min-height: 500px;
                    font-family: 'Inter', system-ui, sans-serif;
                    line-height: 1.6;
                    color: #1a202c;
                }
                .ProseMirror h1 { font-size: 2rem; font-weight: 800; margin-top: 2rem; margin-bottom: 1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; }
                .ProseMirror h2 { font-size: 1.5rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.75rem; }
                .ProseMirror h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.5rem; }
                .ProseMirror p { margin-bottom: 1.25rem; }
                .ProseMirror ul, .ProseMirror ol { margin-bottom: 1.25rem; padding-left: 1.5rem; }
                .ProseMirror li { margin-bottom: 0.5rem; }
                .ProseMirror blockquote { border-left: 4px solid #e2e8f0; padding-left: 1rem; color: #4a5568; italic: true; }
                .ProseMirror pre { background: #f7fafc; padding: 1rem; border-radius: 0.5rem; font-family: monospace; font-size: 0.875rem; overflow-x: auto; }
                
                /* MathLive styling in Tiptap */
                math-field {
                    font-size: 1.1em;
                }
                [data-type="math-block"] {
                    display: block;
                    text-align: center;
                    margin: 1.5rem 0;
                    padding: 1rem;
                    background: #f8fafc;
                    border: 1px dashed #cbd5e1;
                    border-radius: 0.5rem;
                }

                /* Table styling */
                .ProseMirror table {
                    border-collapse: collapse;
                    margin: 0;
                    overflow: hidden;
                    table-layout: fixed;
                    width: 100%;
                }
                .ProseMirror td, .ProseMirror th {
                    border: 2px solid #ced4da;
                    box-sizing: border-box;
                    min-width: 1em;
                    padding: 3px 5px;
                    position: relative;
                    vertical-align: top;
                }
                .ProseMirror th {
                    background-color: #f1f3f5;
                    font-weight: bold;
                    text-align: left;
                }
                .ProseMirror .selectedCell:after {
                    background: rgba(200, 200, 255, 0.4);
                    content: "";
                    left: 0;
                    right: 0;
                    top: 0;
                    bottom: 0;
                    pointer-events: none;
                    position: absolute;
                    z-index: 2;
                }
                .ProseMirror .column-resize-handle {
                    background-color: #adf;
                    bottom: -2px;
                    position: absolute;
                    right: -2px;
                    pointer-events: none;
                    top: 0;
                    width: 4px;
                }
                .tableWrapper {
                    overflow-x: auto;
                }
                .resize-cursor {
                    cursor: ew-resize;
                    cursor: col-resize;
                }

                /* LaTeX specific styling */
                .latex-caption {
                    font-size: 0.9em;
                    color: #4a5568 !important;
                    margin-top: 0.5rem;
                    text-align: center;
                }
                [data-type="latex-table-wrapper"] {
                    margin: 2rem 0;
                    padding: 1.5rem;
                    background: #f8fafc;
                    border: 1px dashed #cbd5e1;
                    border-radius: 0.5rem;
                    box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
                }
            `}</style>
        </div>
    )
}
