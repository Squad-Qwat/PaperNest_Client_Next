'use client'

import { type NodeViewProps, NodeViewWrapper } from '@tiptap/react'
import {
	Code as CodeIcon,
	Columns,
	Eye as EyeIcon,
	FileText,
	Image as ImageIcon,
	Table as TableIcon,
} from 'lucide-react'
import { useParams } from 'next/navigation'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useDocumentFiles } from '@/lib/api/hooks/use-document-files'
import { validateProtectedBlock } from '@/lib/latex/LaTeXProtectedBlockValidator'

// Helper to extract image name from LaTeX figure command
const getFigureImageName = (latex: string): string | null => {
	const marker = '\\includegraphics'
	const idx = latex.indexOf(marker)
	if (idx === -1) return null

	const openBraceIdx = latex.indexOf('{', idx + marker.length)
	if (openBraceIdx === -1) return null

	const intermediate = latex.slice(idx + marker.length, openBraceIdx).trim()
	if (intermediate !== '' && !/^[[].*[\]]$/.test(intermediate)) {
		return null
	}

	const closeBraceIdx = latex.indexOf('}', openBraceIdx)
	if (closeBraceIdx === -1) return null

	return latex.slice(openBraceIdx + 1, closeBraceIdx).trim()
}

// Helper to extract basename from path (e.g. "images/photo.png" -> "photo.png")
const getBasename = (path: string): string => {
	return path.split('/').pop()?.split('\\').pop() || path
}

// Helper to extract caption from figure
const getFigureCaption = (latex: string): string | null => {
	const match = latex.match(/\\caption\s*\{((?:[^{}]|\{[^{}]*\})*)\}/)
	return match ? match[1].trim() : null
}

// Helper to parse tabular environment
interface TabularData {
	spec: string
	rows: string[][]
}

const extractTabularParts = (latex: string) => {
	const beginIdx = latex.indexOf('\\begin{tabular}')
	if (beginIdx === -1) return null

	const specStartIdx = latex.indexOf('{', beginIdx + 15)
	if (specStartIdx === -1) return null

	// Scan to find matching closing brace for the specifier
	let depth = 1
	let specEndIdx = -1
	for (let i = specStartIdx + 1; i < latex.length; i++) {
		if (latex[i] === '{') depth++
		else if (latex[i] === '}') {
			depth--
			if (depth === 0) {
				specEndIdx = i
				break
			}
		}
	}
	if (specEndIdx === -1) return null

	const spec = latex.slice(specStartIdx + 1, specEndIdx)

	// Find corresponding \end{tabular}
	const endIdx = latex.indexOf('\\end{tabular}', specEndIdx)
	if (endIdx === -1) return null

	const body = latex.slice(specEndIdx + 1, endIdx)
	return { spec, body }
}

const cleanTabularBody = (body: string): string => {
	return body
		.replace(/(^|[^\\])%[^\n]*/g, '$1') // remove comments
		.replace(/\\(hline|toprule|midrule|bottomrule|rowcolor|arrayrulewidth)\b/g, '') // remove hlines and booktabs rules
		.replace(/\\cline\s*\{[^}]*\}/g, '') // remove clines
		.replace(/\\\[[^\]]*\]/g, '\\\\') // convert \\[1em] to \\
}

const parseLatexTabular = (latex: string): TabularData | null => {
	const parts = extractTabularParts(latex)
	if (!parts) return null

	const { spec, body } = parts
	const cleanBody = cleanTabularBody(body)

	const rawRows = cleanBody.split(/\\\\/)
	const rows = rawRows
		.map((row) => {
			const trimmed = row.trim()
			if (!trimmed) return null

			// If the row contains only whitespaces or is empty, skip
			if (trimmed.replace(/&/g, '').trim() === '') return null

			const cells = trimmed.split('&').map((cell) => {
				let cellText = cell.trim()
				// strip basic formatting commands
				cellText = cellText
					.replace(/\\textbf\{((?:[^{}]|\{[^{}]*\})*)\}/g, '$1')
					.replace(/\\textit\{((?:[^{}]|\{[^{}]*\})*)\}/g, '$1')
					.replace(/\\underline\{((?:[^{}]|\{[^{}]*\})*)\}/g, '$1')
					.replace(/\\href\{[^{}]*\}\{((?:[^{}]|\{[^{}]*\})*)\}/g, '$1')
					.replace(
						/\\(centering|noindent|small|large|tiny|scriptsize|footnotesize|normalsize|Large|LARGE|huge|Huge)\b\s*/g,
						''
					)
				return cellText
			})
			return cells
		})
		.filter(Boolean) as string[][]

	return { spec, rows }
}

const cleanBodyText = (latex: string): string => {
	return latex
		.replace(/\\begin\{[^}]+\}/g, '')
		.replace(/\\end\{[^}]+\}/g, '')
		.replace(/\\[a-zA-Z]+\s*(\[[^\]]*\])?(\{([^{}]*)\})?/g, '$3')
		.replace(/%.*/g, '')
		.replace(/\s+/g, ' ')
		.trim()
}

export function ProtectedBlockView({ node, updateAttributes, selected }: NodeViewProps) {
	const blockType = (node.attrs.blockType || 'block') as string
	const committedLatex = (node.attrs.latex || '') as string
	const [draftLatex, setDraftLatex] = useState(committedLatex)
	const [activeTab, setActiveTab] = useState<'preview' | 'source'>('preview')

	const params = useParams()
	const documentId = params?.documentid as string | undefined

	// Fetch files in the workspace via Tanstack Query
	const { data: files = [] } = useDocumentFiles(documentId)

	useEffect(() => {
		if (committedLatex !== draftLatex) {
			setDraftLatex(committedLatex)
		}
	}, [committedLatex, draftLatex])

	const validation = useMemo(
		() => validateProtectedBlock(draftLatex, blockType),
		[draftLatex, blockType]
	)

	const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		const nextValue = event.target.value
		setDraftLatex(nextValue)

		const nextValidation = validateProtectedBlock(nextValue, blockType)
		if (nextValidation.valid) {
			updateAttributes({ latex: nextValue })
		}
	}

	// Resolve the block icon based on blockType
	const BlockIcon = useMemo(() => {
		switch (blockType.toLowerCase()) {
			case 'figure':
				return ImageIcon
			case 'table':
			case 'tabular':
				return TableIcon
			case 'twocolumn':
				return Columns
			case 'abstract':
				return FileText
			default:
				return FileText
		}
	}, [blockType])

	// Figure Preview Renderer
	const renderFigurePreview = () => {
		const imageName = getFigureImageName(draftLatex)
		const caption = getFigureCaption(draftLatex)

		if (!imageName) {
			return (
				<div className='flex flex-col items-center justify-center p-6 bg-gray-50/50 rounded-lg border border-gray-100 min-h-[140px] text-gray-400 text-xs'>
					<ImageIcon className='w-8 h-8 opacity-30 mb-2' />
					<p>No `\includegraphics` found in figure block.</p>
				</div>
			)
		}

		const baseImageName = getBasename(imageName)

		// Find image file matching the filename (with or without extension)
		const matchedFile = files.find((f) => {
			const nameWithoutExt = f.name.replace(/\.[^/.]+$/, '')
			const baseNameWithoutExt = baseImageName.replace(/\.[^/.]+$/, '')
			return (
				f.name.toLowerCase() === baseImageName.toLowerCase() ||
				nameWithoutExt.toLowerCase() === baseNameWithoutExt.toLowerCase()
			)
		})

		return (
			<div className='flex flex-col items-center justify-center p-6 bg-gray-50/50 rounded-lg border border-gray-200/55 min-h-[200px]'>
				{matchedFile ? (
					<img
						src={matchedFile.url}
						alt={imageName}
						className='max-h-56 max-w-full object-contain rounded-md shadow-sm border border-gray-100 bg-white p-1'
					/>
				) : (
					<div className='flex flex-col items-center p-4 text-center max-w-sm text-gray-500'>
						<div className='w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 mb-2'>
							<ImageIcon className='w-6 h-6' />
						</div>
						<p className='font-semibold text-xs text-gray-700'>Image Not Found</p>
						<p className='text-[10px] text-gray-400 mt-0.5'>
							Filename: "{imageName}" (Upload to documents list to preview)
						</p>
					</div>
				)}
				{caption && (
					<p className='text-xs italic text-gray-500 mt-4 text-center border-t border-gray-100 pt-2 w-full max-w-md'>
						Figure: {caption}
					</p>
				)}
			</div>
		)
	}

	// Table/Tabular Preview Renderer
	const renderTablePreview = () => {
		const tabularData = parseLatexTabular(draftLatex)

		if (!tabularData || tabularData.rows.length === 0) {
			return (
				<div className='flex flex-col items-center justify-center p-6 bg-gray-50/50 rounded-lg border border-gray-100 min-h-[140px] text-gray-400 text-xs'>
					<TableIcon className='w-8 h-8 opacity-30 mb-2' />
					<p>Could not parse tabular rows. Switch to source tab to edit.</p>
				</div>
			)
		}

		const maxCols = Math.max(...tabularData.rows.map((r) => r.length), 0)

		return (
			<div className='overflow-x-auto w-full border border-gray-200/60 rounded-lg bg-white shadow-sm'>
				<table className='w-full text-xs text-left text-gray-700 border-collapse'>
					<thead>
						<tr className='bg-gray-50 border-b border-gray-200/70 font-semibold text-gray-600'>
							{Array.from({ length: maxCols }).map((_, colIdx) => (
								<th key={colIdx} className='px-4 py-2 border-r border-gray-200/60 last:border-0'>
									Col {colIdx + 1}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{tabularData.rows.map((row, rowIdx) => (
							<tr key={rowIdx} className='border-b border-gray-100 hover:bg-gray-50 last:border-0'>
								{row.map((cell, cellIdx) => (
									<td
										key={cellIdx}
										className='px-4 py-2.5 border-r border-gray-200/60 last:border-0 font-medium text-gray-800'
									>
										{cell}
									</td>
								))}
								{row.length < maxCols &&
									Array.from({ length: maxCols - row.length }).map((_, emptyIdx) => (
										<td
											key={`empty-${emptyIdx}`}
											className='px-4 py-2.5 border-r border-gray-200/60 last:border-0'
										/>
									))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		)
	}

	// Abstract / Twocolumn / Bib preview card
	const renderDefaultPreview = () => {
		const plainText = cleanBodyText(draftLatex)
		return (
			<div
				className='p-4 bg-gray-50/20 text-gray-800 text-[13px] leading-relaxed max-h-48 overflow-y-auto no-scrollbar'
				style={{ fontFamily: "'Noto Serif', 'Palatino Linotype', 'Book Antiqua', Palatino, serif" }}
			>
				<p className='italic'>
					{plainText.slice(0, 320)}
					{plainText.length > 320 ? '...' : ''}
				</p>
			</div>
		)
	}

	const renderPreviewContent = () => {
		switch (blockType.toLowerCase()) {
			case 'figure':
				return renderFigurePreview()
			case 'table':
			case 'tabular':
				return renderTablePreview()
			default:
				return renderDefaultPreview()
		}
	}

	return (
		<NodeViewWrapper
			className='latex-protected-block group my-6 overflow-hidden transition-all duration-300'
			data-type='latex-protected'
			data-block-type={blockType}
			style={{
				border: validation.valid
					? '1px solid rgba(125, 125, 125, 0.15)'
					: '1px solid rgba(239, 68, 68, 0.3)',
				background: validation.valid ? 'rgba(125, 125, 125, 0.02)' : '#fef2f2',
				borderRadius: '8px',
				boxShadow: selected ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : '0 1px 3px rgba(0,0,0,0.02)',
			}}
		>
			{/* Top Header/Toolbar */}
			<div className='flex items-center justify-between px-4 py-2.5 bg-gray-50/50 border-b border-gray-200/40 select-none'>
				<div className='flex items-center gap-2'>
					<BlockIcon className='w-4 h-4 text-gray-500/80' />
					<div className='flex items-center gap-2'>
						<span className='text-[10px] font-bold text-gray-600 tracking-wider uppercase font-mono'>
							{blockType}
						</span>
						<span className='w-[3px] h-[3px] rounded-full bg-gray-300' />
						<div className='flex items-center gap-1'>
							{validation.valid ? (
								<span className='text-[9px] font-semibold text-green-600/80 font-mono'>READY</span>
							) : (
								<span className='text-[9px] font-semibold text-red-500/90 font-mono'>ERROR</span>
							)}
						</div>
					</div>
				</div>

				{/* Switcher Tab buttons */}
				<div className='flex p-0.5 rounded bg-gray-200/50 border border-gray-200/30'>
					<button
						type='button'
						onClick={() => setActiveTab('preview')}
						className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase transition-all ${
							activeTab === 'preview'
								? 'bg-white text-gray-800 shadow-sm'
								: 'text-gray-500 hover:text-gray-800'
						}`}
					>
						<EyeIcon className='w-2.5 h-2.5' />
						Preview
					</button>
					<button
						type='button'
						onClick={() => setActiveTab('source')}
						className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase transition-all ${
							activeTab === 'source'
								? 'bg-white text-gray-800 shadow-sm'
								: 'text-gray-500 hover:text-gray-800'
						}`}
					>
						<CodeIcon className='w-2.5 h-2.5' />
						LaTeX
					</button>
				</div>
			</div>

			{/* Body Content */}
			<div className='p-3'>
				{activeTab === 'preview' ? (
					renderPreviewContent()
				) : (
					<div className='relative'>
						<textarea
							value={draftLatex}
							onChange={handleChange}
							spellCheck={false}
							className='no-scrollbar w-full min-h-[140px] resize-y border border-gray-200/70 rounded p-3 bg-gray-50 text-gray-800 font-mono text-[11px] leading-relaxed outline-none focus:border-gray-300 transition-colors shadow-inner'
						/>
						{!validation.valid && (
							<div className='absolute bottom-3 left-3 right-3 px-3 py-1.5 bg-red-50 text-red-700 text-[10px] rounded border border-red-200 font-sans'>
								{validation.error || 'Perubahan belum disimpan karena sintaks blok belum valid.'}
							</div>
						)}
					</div>
				)}
			</div>
		</NodeViewWrapper>
	)
}
