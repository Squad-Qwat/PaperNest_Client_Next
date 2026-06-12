'use client'

import { List } from 'lucide-react'
import type React from 'react'
import { useMemo } from 'react'
import { parseLatexSections, type TableOfContentsEntry } from '@/lib/utils/latex-toc'

interface PanelContent2Props {
	currentContent?: string | null
	onNavigateToSection?: (heading: string, position: number) => void
	getCurrentContent?: () => string
}

const PanelContent2: React.FC<PanelContent2Props> = ({
	currentContent,
	onNavigateToSection,
	getCurrentContent,
}) => {
	const content = useMemo(() => {
		if (getCurrentContent) {
			return getCurrentContent()
		}
		return currentContent || ''
	}, [currentContent, getCurrentContent])

	const tocEntries = useMemo(() => {
		return parseLatexSections(content)
	}, [content])

	const handleNavigateToSection = (entry: TableOfContentsEntry) => {
		if (onNavigateToSection) {
			onNavigateToSection(entry.heading, entry.position)
		}
	}

	const getLevelIndent = (level: number): string => {
		switch (level) {
			case 0:
				return 'pl-0'
			case 1:
				return 'pl-3'
			case 2:
				return 'pl-6'
			case 3:
				return 'pl-9'
			default:
				return 'pl-12'
		}
	}

	const getLevelColor = (_level: number): string => {
		return 'text-muted-foreground hover:text-foreground'
	}

	if (tocEntries.length === 0) {
		return (
			<div className='flex flex-col h-full'>
				<div className='flex-1 flex flex-col items-center justify-center gap-4 p-4 text-muted-foreground'>
					<List className='h-12 w-12 text-muted' />
					<div className='text-center'>
						<p className='font-medium text-sm'>Table of Contents</p>
						<p className='text-xs mt-1'>No sections found in document</p>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className='flex flex-col h-full text-foreground'>
			{/* Header info */}
			<div className='border-b border-border p-3 flex-shrink-0'>
				<p className='text-xs text-muted-foreground'>
					{tocEntries.length} section{tocEntries.length !== 1 ? 's' : ''}
				</p>
			</div>

			{/* Scrollable TOC entries */}
			<div className='flex-1 overflow-y-auto'>
				<nav className='space-y-1 p-2'>
					{tocEntries.map((entry, index) => (
						<button
							type='button'
							key={`${entry.position}-${entry.heading}-${index}`}
							onClick={() => handleNavigateToSection(entry)}
							className={`w-full text-left px-2 py-2 rounded hover:bg-muted active:bg-muted/80 transition-colors text-sm ${getLevelColor(entry.level)} ${getLevelIndent(entry.level)}`}
							title={entry.heading}
						>
							<span className='line-clamp-2'>{entry.heading}</span>
						</button>
					))}
				</nav>
			</div>
		</div>
	)
}

export default PanelContent2
