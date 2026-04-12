'use client'

import React, { useEffect, useMemo, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Highlight from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { 
    Bold, 
    Italic, 
    Type, 
    Heading1, 
    Heading2, 
    List, 
    Sigma,
    Quote
} from 'lucide-react'
import { MathLiveNode, MathLiveBlockNode } from '../tiptap/MathLiveExtension'
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
} from '../tiptap/LaTeXExtensions'
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
    }, []);

    const isInternalUpdate = useRef(false);
    const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Underline,
            Link,
            Highlight,
            Placeholder.configure({
                placeholder: 'Start writing your LaTeX body here...',
                emptyEditorClass: 'is-editor-empty',
            }),
            CharacterCount,
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
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none min-h-[600px] p-12 bg-white shadow-xl ring-1 ring-gray-100 rounded-xl transition-all duration-300',
            },
        },
    });

    // Handle external content changes (e.g. from Source mode)
    useEffect(() => {
        if (!editor) return;
        
        // Report editor to parent if callback exists
        if (onEditorReady) {
            onEditorReady(editor);
        }

        const parts = LaTeXConverter.splitDocument(content);
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
        <div className="h-full w-full overflow-auto bg-gray-50/30 p-8 flex flex-col items-center">
            <div className="w-full max-w-4xl relative group">
                {/* Bubble Menu for text selection */}
                {editor && (
                    <BubbleMenu editor={editor} className="flex bg-white shadow-xl border border-gray-100 rounded-lg p-1 gap-0.5 overflow-hidden ring-1 ring-black/5">
                        <MenuButton 
                            onClick={() => editor.chain().focus().toggleBold().run()} 
                            active={editor.isActive('bold')}
                            icon={<Bold className="w-4 h-4" />}
                        />
                        <MenuButton 
                            onClick={() => editor.chain().focus().toggleItalic().run()} 
                            active={editor.isActive('italic')}
                            icon={<Italic className="w-4 h-4" />}
                        />
                        <div className="w-[1px] h-4 bg-gray-200 mx-1 self-center" />
                        <MenuButton 
                            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
                            active={editor.isActive('heading', { level: 1 })}
                            icon={<Heading1 className="w-4 h-4" />}
                        />
                        <MenuButton 
                            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
                            active={editor.isActive('heading', { level: 2 })}
                            icon={<Heading2 className="w-4 h-4" />}
                        />
                        <div className="w-[1px] h-4 bg-gray-200 mx-1 self-center" />
                        <MenuButton 
                            onClick={() => editor.chain().focus().toggleBulletList().run()} 
                            active={editor.isActive('bulletList')}
                            icon={<List className="w-4 h-4" />}
                        />
                        <MenuButton 
                            onClick={() => editor.chain().focus().toggleBlockquote().run()} 
                            active={editor.isActive('blockquote')}
                            icon={<Quote className="w-4 h-4" />}
                        />
                    </BubbleMenu>
                )}

                {/* Floating Menu for empty lines */}
                {editor && (
                    <FloatingMenu editor={editor} className="flex bg-white shadow-lg border border-gray-100 rounded-full p-1.5 gap-1 ring-1 ring-black/5 ml-[-60px]">
                         <MenuButton 
                            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
                            icon={<Heading1 className="w-3.5 h-3.5" />}
                            round
                        />
                        <MenuButton 
                            onClick={() => editor.chain().focus().toggleBulletList().run()} 
                            icon={<List className="w-3.5 h-3.5" />}
                            round
                        />
                         <MenuButton 
                            onClick={() => editor.chain().focus().insertContent('<span data-type="math" data-latex="">$$</span>').run()} 
                            icon={<Sigma className="w-3.5 h-3.5" />}
                            round
                        />
                    </FloatingMenu>
                )}

                <EditorContent editor={editor} className="min-h-full" />

                {/* Character Count Indicator */}
                <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-white/50 backdrop-blur-md rounded-full border border-gray-100 text-[10px] font-mono text-gray-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="font-bold text-primary">{editor.storage.characterCount.characters()}</span>
                    <span className="opacity-50">/</span>
                    <span className="opacity-50 font-medium whitespace-nowrap">Characters</span>
                </div>
            </div>
            
            <style jsx global>{`
                .ProseMirror {
                    min-height: 500px;
                    font-family: var(--font-sans, 'Inter', system-ui, sans-serif);
                    line-height: 1.6;
                    color: var(--foreground, #1a202c);
                    transition: all 0.2s ease;
                }
                .ProseMirror:focus {
                    outline: none;
                }
                .ProseMirror p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: oklch(0.709 0.01 56.259);
                    pointer-events: none;
                    height: 0;
                    font-style: italic;
                }
                .ProseMirror h1 { font-size: 2.25rem; font-weight: 800; margin-top: 2.5rem; margin-bottom: 1.5rem; border-bottom: 2px solid var(--border); padding-bottom: 0.75rem; letter-spacing: -0.02em; }
                .ProseMirror h2 { font-size: 1.75rem; font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; letter-spacing: -0.01em; }
                .ProseMirror h3 { font-size: 1.35rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem; }
                .ProseMirror p { margin-bottom: 1.5rem; }
                .ProseMirror ul, .ProseMirror ol { margin-bottom: 1.5rem; padding-left: 2rem; }
                .ProseMirror li { margin-bottom: 0.75rem; }
                .ProseMirror blockquote { border-left: 4px solid var(--primary-subtle); padding-left: 1.25rem; color: var(--muted-foreground); font-style: italic; margin: 2rem 0; }
                .ProseMirror pre { background: var(--muted); padding: 1.25rem; border-radius: var(--radius-md); font-family: var(--font-mono); font-size: 0.875rem; overflow-x: auto; border: 1px solid var(--border); }
                
                /* MathLive styling in Tiptap */
                math-field {
                    font-size: 1.1em;
                }
                [data-type="math-block"] {
                    display: block;
                    text-align: center;
                    margin: 2.5rem auto;
                    padding: 1.5rem;
                    background: var(--info-subtle, #f8fafc);
                    border: 1px dashed var(--primary-subtle, #cbd5e1);
                    border-radius: var(--radius-lg, 1rem);
                    transition: all 0.2s ease;
                    max-width: fit-content;
                    min-width: 200px;
                }
                [data-type="math-block"]:hover {
                    border-color: var(--primary);
                    background: var(--background);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }

                /* Table styling */
                .ProseMirror table {
                    border-collapse: collapse;
                    margin: 2rem 0;
                    overflow: hidden;
                    table-layout: fixed;
                    width: 100%;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border);
                }
                .ProseMirror td, .ProseMirror th {
                    border: 1px solid var(--border);
                    box-sizing: border-box;
                    min-width: 1em;
                    padding: 8px 12px;
                    position: relative;
                    vertical-align: top;
                }
                .ProseMirror th {
                    background-color: var(--muted);
                    font-weight: bold;
                    text-align: left;
                }
                .ProseMirror .selectedCell:after {
                    background: var(--primary-subtle);
                    content: "";
                    left: 0;
                    right: 0;
                    top: 0;
                    bottom: 0;
                    pointer-events: none;
                    position: absolute;
                    z-index: 2;
                }
                
                /* Selection & Focus */
                .ProseMirror *::selection {
                    background-color: var(--primary-subtle);
                }

                /* LaTeX specific styling */
                .latex-caption {
                    font-size: 0.9em;
                    color: var(--muted-foreground) !important;
                    margin-top: 0.75rem;
                    text-align: center;
                    font-style: italic;
                }
            `}</style>
        </div>
    )
}

function MenuButton({ onClick, active, icon, round }: { onClick: () => void, active?: boolean, icon: React.ReactNode, round?: boolean }) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center justify-center transition-all duration-200
                ${round ? 'w-8 h-8 rounded-full' : 'w-9 h-9 rounded-md'}
                ${active 
                    ? 'bg-primary text-white shadow-md scale-105' 
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}
            `}
        >
            {icon}
        </button>
    )
}
