'use client'

import React, { createContext, useContext, useMemo } from 'react'
import { parseLatexSections, TableOfContentsEntry } from '@/lib/utils/latex-toc'

interface EditorContextValue {
	content: string | null
	editorView: any | null
	getCurrentContent: (() => string) | null
	tocEntries: TableOfContentsEntry[]
	navigateToSection: (heading: string) => void
}

const EditorContext = createContext<EditorContextValue | null>(null)

interface EditorContextProviderProps {
	children: React.ReactNode
	content: string | null
	editorView: any | null
	getCurrentContent?: () => string
	onNavigateToSection?: (heading: string, position: number) => void
}

export function EditorContextProvider({
	children,
	content,
	editorView,
	getCurrentContent,
	onNavigateToSection,
}: EditorContextProviderProps) {
	const tocEntries = useMemo(() => {
		// Use getCurrentContent if available, otherwise use passed content
		const currentContent = getCurrentContent ? getCurrentContent() : content
		return parseLatexSections(currentContent || '')
	}, [content, getCurrentContent])

	const navigateToSection = (heading: string) => {
		if (!editorView) return

		// Find position in content
		const currentContent = getCurrentContent ? getCurrentContent() : content
		if (!currentContent) return

		// Find section command matching this heading
		const pattern = new RegExp(`\\\\(chapter|section|subsection|subsubsection)\\{${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}`)
		const match = currentContent.match(pattern)

		if (match && match.index !== undefined) {
			const position = match.index
			if (onNavigateToSection) {
				onNavigateToSection(heading, position)
			}
		}
	}

	const value: EditorContextValue = {
		content: getCurrentContent ? getCurrentContent() : content,
		editorView,
		getCurrentContent: getCurrentContent || null,
		tocEntries,
		navigateToSection,
	}

	return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
}

export function useEditorContext() {
	const context = useContext(EditorContext)
	if (!context) {
		throw new Error('useEditorContext must be used within EditorContextProvider')
	}
	return context
}
