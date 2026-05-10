'use client'

import { redo as cmRedo, undo as cmUndo } from '@codemirror/commands'
import { FileText } from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCollaborators } from '@/hooks/editor/use-collaborators'
import { useLatexCompilation } from '@/hooks/editor/use-latex-compilation'
import { useLatexEditor } from '@/hooks/editor/use-latex-editor'
import { useDocumentFiles } from '@/lib/api/hooks/use-document-files'
import { laTeXService } from '@/lib/latex/LaTeXService'
import { computeCodeMirrorChanges } from '@/lib/utils/diff'
import { applyRangesToText, getMergeSignature, normalizeText } from '@/lib/utils/latex-merge-utils'
import { MergePreview } from '../mergeview/MergePreview'
import { LatexVisualEditor } from './LatexVisualEditor'

interface LatexEditorProps {
	documentId?: string | null
	user?: any
	initialContent?: string
	title?: string
	onEditorReady?: (functions: any) => void
	onAutoSaveStateChange?: (isSaving: boolean, lastSavedAt: Date | null) => void
	isPdfHidden?: boolean
}

type PendingMergeChange = {
	id?: string
	createdAt?: number
	operationType?: string
	original: string
	modified: string
	searchBlock?: string[]
	replaceBlock?: string[]
	description?: string
}

const MAX_PENDING_MERGES = 50

export function LatexEditor({
	documentId,
	user,
	initialContent,
	onEditorReady,
	onAutoSaveStateChange,
	isPdfHidden = false,
}: LatexEditorProps) {
	const [editorPdfSplitWidth, setEditorPdfSplitWidth] = useState(55)
	const [isEditorPdfResizing, setIsEditorPdfResizing] = useState(false)
	const [viewMode, setViewMode] = useState<'source' | 'visual'>('source')
	const [compilerMode, setCompilerMode] = useState<'client' | 'server' | 'server_pdflatex'>(
		laTeXService.getCompilerMode()
	)
	const [visualEditor, setVisualEditor] = useState<any>(null)
	const [pendingMerges, setPendingMerges] = useState<PendingMergeChange[]>([])
	const [lastBatchSummary, setLastBatchSummary] = useState<{
		applied: number
		failed: number
	} | null>(null)

	const { data: files = [], refetch: refetchFiles } = useDocumentFiles(documentId)
	const { visibleCollaborators, hiddenCollaboratorsCount } = useCollaborators()
	const { isCompiling, compileResult, pdfUrl, showLog, setShowLog, handleCompile } =
		useLatexCompilation({ documentId, files, refetchFiles })

	const containerRef = useRef<HTMLDivElement>(null)
	const activePendingMerge = pendingMerges[0] ?? null

	const enqueuePendingMerge = useCallback((data: PendingMergeChange | null) => {
		if (!data) return

		setPendingMerges((prev) => {
			if (prev.length >= MAX_PENDING_MERGES) return prev

			const incomingSignature = getMergeSignature(data)
			const hasDuplicate = prev.some((item) => getMergeSignature(item) === incomingSignature)
			if (hasDuplicate) return prev

			setLastBatchSummary(null)
			return [...prev, data]
		})
	}, [])

	const consumePendingMerge = useCallback(() => {
		setPendingMerges((prev) => prev.slice(1))
	}, [])

	const { editorRef, view, isSaving } = useLatexEditor({
		documentId,
		user,
		initialContent,
	})

	const getRebasedPreview = useCallback(
		(merge: PendingMergeChange): { modified: string; isRebased: boolean; reason?: string } => {
			if (!view) {
				return { modified: merge.modified, isRebased: false, reason: 'editor_not_ready' }
			}
			const currentDoc = view.state.doc.toString()
			const normalizedCurrent = normalizeText(currentDoc)
			const normalizedOriginal = normalizeText(merge.original)

			const searchBlock = Array.isArray(merge.searchBlock) ? merge.searchBlock : []
			const replaceBlock = Array.isArray(merge.replaceBlock) ? merge.replaceBlock : []
			const hasAtomicBlocks = searchBlock.length > 0 && searchBlock.length === replaceBlock.length

			if (!hasAtomicBlocks) {
				if (normalizedOriginal === normalizedCurrent) {
					return { modified: merge.modified, isRebased: true, reason: undefined }
				}
				return { modified: merge.modified, isRebased: false, reason: 'missing_anchors' }
			}

			const ranges: Array<{ from: number; to: number; insert: string }> = []
			let searchFrom = 0

			for (let i = 0; i < searchBlock.length; i++) {
				const search = searchBlock[i]
				const replace = replaceBlock[i]
				if (typeof search !== 'string' || typeof replace !== 'string' || search.length === 0) {
					return { modified: merge.modified, isRebased: false, reason: 'invalid_anchor' }
				}

				let index = currentDoc.indexOf(search, searchFrom)
				let matchedLength = search.length

				if (index === -1) {
					const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
					const fuzzyPattern = escaped.replace(/\s+/g, '[\\s\\r\\n]+')
					const regex = new RegExp(fuzzyPattern, 'g')
					regex.lastIndex = searchFrom
					const match = regex.exec(currentDoc)

					if (match) {
						index = match.index
						matchedLength = match[0].length
					}
				}

				if (index === -1) {
					if (normalizedOriginal === normalizedCurrent) {
						return { modified: merge.modified, isRebased: true, reason: undefined }
					}
					return { modified: merge.modified, isRebased: false, reason: 'anchor_not_found' }
				}

				ranges.push({ from: index, to: index + matchedLength, insert: replace })
				searchFrom = index + matchedLength
			}

			return {
				modified: applyRangesToText(currentDoc, ranges),
				isRebased: true,
				reason: undefined,
			}
		},
		[view]
	)

	const activeMergePreview = useMemo(() => {
		if (!activePendingMerge) return null
		return getRebasedPreview(activePendingMerge)
	}, [activePendingMerge, getRebasedPreview])

	const applyPendingMerge = useCallback(
		(
			merge: PendingMergeChange,
			fallbackContent?: string,
			options?: { allowFallback?: boolean }
		): boolean => {
			if (!view) return false

			const currentDoc = view.state.doc.toString()
			const allowFallback = options?.allowFallback !== false
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
						view.dispatch({ changes: ranges, scrollIntoView: false })
						applied = true
					}
				}
			}

			if (!applied && allowFallback && typeof fallbackContent === 'string') {
				const changes = computeCodeMirrorChanges(currentDoc, fallbackContent)
				if (changes.length > 0) {
					view.dispatch({ changes, scrollIntoView: false })
					applied = true
				}
			}

			return applied
		},
		[view]
	)

	const handleInsertSnippet = useCallback(
		(snippet: string, selectionOffset: number = 0) => {
			if (!view) return

			const selection = view.state.selection.main
			const text = view.state.doc.toString()
			const selectedText = text.slice(selection.from, selection.to)
			const insertText = snippet.replace('$SELECTION$', selectedText)

			view.dispatch({
				changes: { from: selection.from, to: selection.to, insert: insertText },
				selection: {
					anchor: selection.from + selectionOffset + (selectedText ? selectedText.length : 0),
				},
				scrollIntoView: true,
			})

			view.focus()
		},
		[view]
	)

	useEffect(() => {
		const unsubscribe = laTeXService.addStatusListener(() => {
			setCompilerMode(laTeXService.getCompilerMode())
		})
		return unsubscribe
	}, [])

	const onCompile = useCallback(() => {
		if (!view) return
		const content = activePendingMerge ? activePendingMerge.modified : view.state.doc.toString()
		handleCompile(content)
	}, [view, activePendingMerge, handleCompile])

	useEffect(() => {
		if (view && onEditorReady) {
			onEditorReady({
				getCurrentContent: () => view.state.doc.toString(),
				undo: () => cmUndo(view),
				redo: () => cmRedo(view),
				insertSnippet: handleInsertSnippet,
				handleCompile: onCompile,
				isCompiling,
				compileResult,
				visibleCollaborators,
				hiddenCollaboratorsCount,
				viewMode,
				toggleViewMode: () => setViewMode((v) => (v === 'source' ? 'visual' : 'source')),
				setCompilerMode: (mode: any) => {
					laTeXService.setCompilerMode(mode)
					setCompilerMode(mode)
				},
				compilerMode,
				setPendingMerge: enqueuePendingMerge,
				getInternalView: () => view,
				visualEditor,
			})
		}
	}, [
		view,
		onEditorReady,
		isCompiling,
		visibleCollaborators,
		hiddenCollaboratorsCount,
		viewMode,
		enqueuePendingMerge,
		compilerMode,
		onCompile,
		compileResult,
		handleInsertSnippet,
		visualEditor,
	])

	useEffect(() => {
		if (onAutoSaveStateChange) onAutoSaveStateChange(isSaving, null)
	}, [isSaving, onAutoSaveStateChange])

	const handleSplitMouseDown = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault()
			setIsEditorPdfResizing(true)
			const startX = e.clientX
			const startWidth = editorPdfSplitWidth
			const containerWidth = containerRef.current?.offsetWidth || 1

			const handleMouseMove = (moveEvent: MouseEvent) => {
				const deltaPercent = ((moveEvent.clientX - startX) / containerWidth) * 100
				setEditorPdfSplitWidth(Math.min(Math.max(startWidth + deltaPercent, 30), 70))
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
		<div className='flex flex-col h-full w-full bg-white overflow-hidden'>
			<div className='flex flex-1 overflow-hidden' ref={containerRef}>
				<div
					className='overflow-hidden relative bg-white border-r border-gray-100'
					style={{ width: `${editorPdfSplitWidth}%` }}
				>
					<div
						ref={editorRef}
						className={`h-full w-full cm-editor-container ${viewMode !== 'source' || activePendingMerge ? 'hidden' : ''}`}
					/>

					{activePendingMerge && (
						<MergePreview
							original={activePendingMerge.original}
							modified={activeMergePreview?.modified ?? activePendingMerge.modified}
							queuePosition={pendingMerges.length > 0 ? 1 : 0}
							queueTotal={pendingMerges.length}
							onAccept={() => {
								if (activeMergePreview?.isRebased !== true) return
								const applied = applyPendingMerge(activePendingMerge, activeMergePreview.modified)
								if (applied) consumePendingMerge()
							}}
							onAcceptAll={() => {
								let appliedCount = 0
								const failedItems: PendingMergeChange[] = []
								for (const merge of pendingMerges) {
									const applied = applyPendingMerge(merge, undefined, { allowFallback: false })
									if (applied) appliedCount++
									else failedItems.push(merge)
								}
								setPendingMerges(failedItems)
								setLastBatchSummary({ applied: appliedCount, failed: failedItems.length })
							}}
							onDiscard={consumePendingMerge}
							batchSummary={lastBatchSummary}
							rebaseStatus={{
								isRebased: activeMergePreview?.isRebased === true,
								reason: activeMergePreview?.reason,
							}}
						/>
					)}

					{viewMode === 'visual' && !activePendingMerge && (
						<LatexVisualEditor
							content={view?.state.doc.toString() || initialContent || ''}
							onEditorReady={setVisualEditor}
							onChange={(newContent) => {
								if (view) {
									view.dispatch({
										changes: { from: 0, to: view.state.doc.length, insert: newContent },
									})
								}
							}}
						/>
					)}
				</div>

				<hr
					className={`w-1 cursor-col-resize hover:bg-blue-400 transition-colors border-none ${
						isEditorPdfResizing ? 'bg-blue-500' : 'bg-gray-200'
					}`}
					onMouseDown={handleSplitMouseDown}
				/>

				<div
					className={`overflow-hidden relative transition-all duration-200 ${pdfUrl ? 'bg-[#525659]' : 'bg-gray-50'}`}
					style={{
						width: `${100 - editorPdfSplitWidth}%`,
						display: isEditorPdfResizing || isPdfHidden ? 'none' : 'flex',
					}}
				>
					{pdfUrl ? (
						<iframe
							src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
							className='w-full h-full border-none'
							title='PDF Preview'
						/>
					) : (
						<div className='absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-4 text-center text-sm'>
							<FileText className='w-10 h-10 mb-3 opacity-20' />
							<p className='font-medium'>Ready to compile</p>
						</div>
					)}

					{compileResult && (
						<button
							type='button'
							onClick={() => setShowLog(!showLog)}
							className={`absolute bottom-3 left-3 z-20 px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${
								compileResult.status === 0 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
							}`}
						>
							{showLog ? 'Hide' : 'Logs'}
						</button>
					)}
				</div>
			</div>

			{compileResult && showLog && (
				<div className='absolute bottom-0 left-0 right-0 h-1/3 bg-[#0d1117]/95 text-gray-300 p-4 font-mono text-[10px] overflow-auto border-t border-white/10 z-30'>
					<div className='flex items-center justify-between mb-3 border-b border-white/10 pb-2'>
						<span className='font-bold text-white'>Build Output</span>
						<button type='button' onClick={() => setShowLog(false)} className='text-gray-500'>
							✕
						</button>
					</div>
					<pre className='whitespace-pre-wrap'>{compileResult.log}</pre>
				</div>
			)}
		</div>
	)
}
