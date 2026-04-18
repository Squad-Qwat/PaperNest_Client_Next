'use client'

import React, { useMemo } from 'react'
import { List } from 'lucide-react'
import { parseLatexSections, TableOfContentsEntry } from '@/lib/utils/latex-toc'

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

	const getLevelColor = (level: number): string => {
		// All levels use gray color
		return 'text-gray-600'
	}

	if (tocEntries.length === 0) {
		return (
			<div className='flex flex-col h-full'>
				<div className='flex-1 flex flex-col items-center justify-center gap-4 p-4 text-gray-500'>
					<List className='h-12 w-12 text-gray-300' />
					<div className='text-center'>
						<p className='font-medium text-sm'>Table of Contents</p>
						<p className='text-xs mt-1'>No sections found in document</p>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className='flex flex-col h-full'>
			{/* Header info */}
			<div className='border-b border-gray-100 p-3 flex-shrink-0'>
				<p className='text-xs text-gray-500'>
					{tocEntries.length} section{tocEntries.length !== 1 ? 's' : ''}
				</p>
			</div>

			{/* Scrollable TOC entries */}
			<div className='flex-1 overflow-y-auto'>
				<nav className='space-y-1 p-2'>
					{tocEntries.map((entry, index) => (
						<button
							key={`${entry.position}-${index}`}
							onClick={() => handleNavigateToSection(entry)}
							className={`w-full text-left px-2 py-2 rounded hover:bg-blue-50 active:bg-blue-100 transition-colors text-sm ${getLevelColor(entry.level)} ${getLevelIndent(entry.level)}`}
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
