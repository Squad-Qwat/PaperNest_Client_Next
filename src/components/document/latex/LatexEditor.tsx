'use client'

import { redo as cmRedo, undo as cmUndo } from '@codemirror/commands'
import { EditorView } from '@codemirror/view'
import { FileText, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useCollaborators } from '@/hooks/editor/use-collaborators'
import { useLatexCompilation } from '@/hooks/editor/use-latex-compilation'
import { useLatexEditor } from '@/hooks/editor/use-latex-editor'
import { apiClient } from '@/lib/api/clients/api-client'
import { useDocumentFiles } from '@/lib/api/hooks/use-document-files'
import { laTeXService } from '@/lib/latex/LaTeXService'
import { computeCodeMirrorChanges } from '@/lib/utils/diff'
import {
	applyRangesToText,
	fuzzyDiff3WayMerge,
	getMergeSignature,
	normalizeText,
} from '@/lib/utils/latex-merge-utils'
import { EditorTabs } from '../editor/EditorTabs'
import { MergePreview } from '../mergeview/MergePreview'
import { FileViewerManager } from '../viewers/FileViewerManager'
import { LatexVisualEditor } from './LatexVisualEditor'
import type { PdfViewerRefActions } from './PdfViewer'

const PdfViewer = dynamic(() => import('./PdfViewer').then((mod) => mod.PdfViewer), { ssr: false })

interface LatexEditorProps {
	documentId?: string | null
	user?: any
	initialContent?: string
	title?: string
	onEditorReady?: (functions: any) => void
	onAutoSaveStateChange?: (isSaving: boolean, lastSavedAt: Date | null) => void
	isPdfHidden?: boolean
	readOnly?: boolean
	activeAuxiliaryFile?: {
		fileId: string
		name: string
		content: string
		url: string
		isDirty?: boolean
	} | null
	openAuxiliaryFiles?: {
		fileId: string
		name: string
		content: string
		url: string
		isDirty?: boolean
	}[]
	activeFileId?: string
	setActiveFileId?: (id: string) => void
	onCloseAuxiliaryFile?: (id: string) => void
	onAuxiliaryFileChange?: (id: string, newContent: string) => void
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
	targetFileId?: string
}

const MAX_PENDING_MERGES = 50

/**
 * Lightweight document version token — cheap change detector.
 * Not cryptographically secure; only used to detect if document changed
 * between an LLM snapshot and a subsequent tool call.
 */
const computeDocToken = (content: string): string => {
	const len = content.length
	const head = content.slice(0, 64)
	const tail = content.slice(-64)
	return `${len}:${head}|${tail}`
}

export function LatexEditor({
	documentId,
	user,
	initialContent,
	title: _title,
	onEditorReady,
	onAutoSaveStateChange,
	isPdfHidden = false,
	readOnly = false,
	activeAuxiliaryFile = null,
	openAuxiliaryFiles = [],
	activeFileId = 'main',
	setActiveFileId,
	onCloseAuxiliaryFile,
	onAuxiliaryFileChange,
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

	const [autoCompile, setAutoCompile] = useState(false)
	const autoCompileTimerRef = useRef<NodeJS.Timeout | null>(null)

	const { data: files = [], refetch: refetchFiles } = useDocumentFiles(documentId)
	const { visibleCollaborators, hiddenCollaboratorsCount } = useCollaborators()
	const { isCompiling, compileResult, pdfUrl, showLog, setShowLog, handleCompile } =
		useLatexCompilation({ documentId, files, refetchFiles })

	const containerRef = useRef<HTMLDivElement>(null)
	const activePendingMerge = pendingMerges[0] ?? null
	const pdfViewerRef = useRef<PdfViewerRefActions | null>(null)
	const auxViewRef = useRef<EditorView | null>(null)

	const handleDocChange = useCallback(
		(content: string) => {
			if (!autoCompile) return
			if (!content || !content.trim()) return
			if (autoCompileTimerRef.current) clearTimeout(autoCompileTimerRef.current)
			autoCompileTimerRef.current = setTimeout(() => {
				handleCompile(content)
			}, 3000)
		},
		[autoCompile, handleCompile]
	)

	const enqueuePendingMerge = useCallback(
		(data: PendingMergeChange | null) => {
			if (!data) return

			const mergeData = {
				...data,
				targetFileId: data.targetFileId || activeFileId,
			}

			setPendingMerges((prev) => {
				if (prev.length >= MAX_PENDING_MERGES) return prev

				const incomingSignature = getMergeSignature(mergeData)
				const hasDuplicate = prev.some((item) => getMergeSignature(item) === incomingSignature)
				if (hasDuplicate) return prev

				setLastBatchSummary(null)
				return [...prev, mergeData]
			})
		},
		[activeFileId]
	)

	const consumePendingMerge = useCallback(() => {
		setPendingMerges((prev) => prev.slice(1))
	}, [])

	useEffect(() => {
		if (
			activePendingMerge?.targetFileId &&
			setActiveFileId &&
			activeFileId !== activePendingMerge.targetFileId
		) {
			setActiveFileId(activePendingMerge.targetFileId)
		}
	}, [activePendingMerge, activeFileId, setActiveFileId])

	const { editorRef, view, isSaving } = useLatexEditor({
		documentId,
		user,
		initialContent,
		enabled: activeFileId === 'main',
		readOnly,
		onDocChange: handleDocChange,
	})

	const handleSyncToCode = useCallback(
		(_file: string, line: number) => {
			if (!view) return
			try {
				const lineInfo = view.state.doc.line(line)
				view.dispatch({
					selection: { anchor: lineInfo.from },
					effects: EditorView.scrollIntoView(lineInfo.from, { y: 'center' }),
				})
				view.focus()
			} catch (e) {
				console.error('[LatexEditor] Could not sync to line:', line, e)
			}
		},
		[view]
	)

	const handleSyncToPdf = useCallback(async () => {
		if (!view || !documentId) return
		const state = view.state
		const cursor = state.selection.main.head
		const line = state.doc.lineAt(cursor)
		const lineNum = line.number
		const colNum = cursor - line.from

		try {
			const file = 'main.tex'
			const resJson = await apiClient.get<any>(
				`/latex/sync/pdf?documentId=${documentId}&file=${file}&line=${lineNum}&column=${colNum}`
			)
			if (resJson && resJson.page !== undefined) {
				const { page, x, y, width, height } = resJson
				pdfViewerRef.current?.scrollToPosition(page, x, y, width, height)
			}
		} catch (error: any) {
			console.error('Error in syncToPdf:', error)
			toast.warning(
				'Tidak dapat melakukan sync pada baris ini. Pastikan baris memiliki teks/konten dokumen yang terkompilasi.'
			)
		}
	}, [view, documentId])

	const getRebasedPreview = useCallback(
		(merge: PendingMergeChange): { modified: string; isRebased: boolean; reason?: string } => {
			const targetFileId = merge.targetFileId || 'main'
			const targetView = targetFileId === 'main' ? view : auxViewRef.current

			if (!targetView) {
				return { modified: merge.modified, isRebased: false, reason: 'editor_not_ready' }
			}
			const currentDoc = targetView.state.doc.toString()
			const normalizedCurrent = normalizeText(currentDoc)
			const normalizedOriginal = normalizeText(merge.original)

			const searchBlock = Array.isArray(merge.searchBlock) ? merge.searchBlock : []
			const replaceBlock = Array.isArray(merge.replaceBlock) ? merge.replaceBlock : []
			const hasAtomicBlocks = searchBlock.length > 0 && searchBlock.length === replaceBlock.length

			// 1. Try exact/fuzzy regex matching first if we have atomic blocks
			if (hasAtomicBlocks) {
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
						batchValid = false
						break
					}

					ranges.push({ from: index, to: index + matchedLength, insert: replace })
					searchFrom = index + matchedLength
				}

				if (batchValid) {
					return {
						modified: applyRangesToText(currentDoc, ranges),
						isRebased: true,
						reason: undefined,
					}
				}
			}

			// 2. Fallback to advanced Google Diff-Match-Patch (3-way merge)
			const mergeResult = fuzzyDiff3WayMerge(merge.original, merge.modified, currentDoc)
			if (mergeResult.success) {
				return {
					modified: mergeResult.result,
					isRebased: true,
					reason: undefined,
				}
			}

			// 3. Fallback to full document match comparison
			if (normalizedOriginal === normalizedCurrent) {
				return {
					modified: merge.modified,
					isRebased: true,
					reason: undefined,
				}
			}

			// If all else fails, return best-effort merge with warning
			return {
				modified: mergeResult.result || merge.modified,
				isRebased: false,
				reason: mergeResult.reason || 'conflict_detected',
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
			const targetFileId = merge.targetFileId || 'main'
			const targetView = targetFileId === 'main' ? view : auxViewRef.current
			if (!targetView) return false

			const currentDoc = targetView.state.doc.toString()
			const allowFallback = options?.allowFallback !== false
			const isApplyDiffMerge = Array.isArray(merge.searchBlock) && Array.isArray(merge.replaceBlock)
			let applied = false
			let mergedText = ''
			let rebaseSuccess = false

			// 1. Try exact atomic match first if blocks are present
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
						targetView.dispatch({ changes: ranges, scrollIntoView: false })
						applied = true
					}
				}
			}

			// 2. Try Google Diff-Match-Patch (3-way merge) if exact match fails or wasn't applicable
			if (!applied) {
				const mergeResult = fuzzyDiff3WayMerge(merge.original, merge.modified, currentDoc)
				if (mergeResult.success) {
					mergedText = mergeResult.result
					rebaseSuccess = true
				}
			}

			// 3. Dispatch surgical changes computed from the fuzzy merge result
			if (!applied && rebaseSuccess && mergedText) {
				const changes = computeCodeMirrorChanges(currentDoc, mergedText)
				if (changes.length > 0) {
					targetView.dispatch({ changes, scrollIntoView: false })
					applied = true
				} else {
					applied = true // Document is already in the merged state
				}
			}

			// 4. Ultimate fallback replacement
			if (!applied && allowFallback && typeof fallbackContent === 'string') {
				const changes = computeCodeMirrorChanges(currentDoc, fallbackContent)
				if (changes.length > 0) {
					targetView.dispatch({ changes, scrollIntoView: false })
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
		if (activeAuxiliaryFile) {
			toast.info(
				'Cannot compile while editing an auxiliary file. Switch back to the main document.'
			)
			return
		}
		const content = activePendingMerge ? activePendingMerge.modified : view.state.doc.toString()
		if (!content || !content.trim()) {
			toast.error('LaTeX content cannot be empty.')
			return
		}
		handleCompile(content)
	}, [view, activePendingMerge, handleCompile, activeAuxiliaryFile])

	const getActiveView = useCallback(() => {
		return activeFileId === 'main' ? view : auxViewRef.current
	}, [activeFileId, view])

	useEffect(() => {
		if (onEditorReady) {
			onEditorReady({
				getCurrentContent: () => getActiveView()?.state.doc.toString() ?? '',
				getDocVersionToken: () => {
					const content = getActiveView()?.state.doc.toString() ?? ''
					return computeDocToken(content)
				},
				undo: () => {
					const activeView = getActiveView()
					if (activeView) cmUndo(activeView)
				},
				redo: () => {
					const activeView = getActiveView()
					if (activeView) cmRedo(activeView)
				},
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
				getInternalView: () => getActiveView(),
				visualEditor,
				syncToPdf: handleSyncToPdf,
				autoCompile,
				toggleAutoCompile: () => setAutoCompile((a) => !a),
				getActiveFileName: () =>
					activeFileId === 'main' ? 'main.tex' : (activeAuxiliaryFile?.name ?? 'unknown'),
			})
		}
	}, [
		getActiveView,
		onEditorReady,
		isCompiling,
		compileResult,
		visibleCollaborators,
		hiddenCollaboratorsCount,
		viewMode,
		enqueuePendingMerge,
		compilerMode,
		onCompile,
		handleInsertSnippet,
		visualEditor,
		handleSyncToPdf,
		autoCompile,
		activeFileId,
		activeAuxiliaryFile,
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
				moveEvent.preventDefault()
				const deltaPercent = ((moveEvent.clientX - startX) / containerWidth) * 100
				setEditorPdfSplitWidth(Math.min(Math.max(startWidth + deltaPercent, 20), 80))
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
			<div
				className={`flex flex-1 overflow-hidden relative ${isEditorPdfResizing ? 'select-none' : ''}`}
				ref={containerRef}
			>
				{isEditorPdfResizing && <div className='absolute inset-0 z-50 cursor-ew-resize' />}
				<div
					className='relative bg-white flex flex-col min-h-0 shrink-0'
					style={{ width: `${editorPdfSplitWidth}%` }}
				>
					{openAuxiliaryFiles.length > 0 && setActiveFileId && onCloseAuxiliaryFile && (
						<EditorTabs
							openFiles={openAuxiliaryFiles}
							activeFileId={activeFileId}
							setActiveFileId={setActiveFileId}
							onCloseFile={onCloseAuxiliaryFile}
						/>
					)}
					<div
						ref={editorRef}
						style={{
							display:
								viewMode !== 'source' || activePendingMerge || activeFileId !== 'main'
									? 'none'
									: 'block',
						}}
						className='flex-1 min-h-0 w-full cm-editor-container'
					/>

					<div
						style={{
							display:
								activeFileId !== 'main' && activeAuxiliaryFile && !activePendingMerge
									? 'block'
									: 'none',
						}}
						className='flex-1 min-h-0 w-full flex flex-col'
					>
						{activeFileId !== 'main' && activeAuxiliaryFile && (
							<FileViewerManager
								file={activeAuxiliaryFile}
								readOnly={readOnly}
								onChange={(newContent) => {
									onAuxiliaryFileChange?.(activeAuxiliaryFile.fileId, newContent)
								}}
								onViewReady={(v) => {
									auxViewRef.current = v
								}}
							/>
						)}
					</div>

					{activePendingMerge && (
						<MergePreview
							original={activePendingMerge.original}
							modified={activeMergePreview?.modified ?? activePendingMerge.modified}
							queuePosition={pendingMerges.length > 0 ? 1 : 0}
							queueTotal={pendingMerges.length}
							onAccept={(reviewedContent) => {
								if (activeMergePreview?.isRebased !== true) return

								const targetFileId = activePendingMerge.targetFileId || 'main'
								const targetView = targetFileId === 'main' ? view : auxViewRef.current

								if (targetView) {
									const currentDoc = targetView.state.doc.toString()
									const changes = computeCodeMirrorChanges(currentDoc, reviewedContent)
									if (changes.length > 0) {
										targetView.dispatch({ changes, scrollIntoView: false })
									}
									consumePendingMerge()
								}
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

					{viewMode === 'visual' && !activePendingMerge && activeFileId === 'main' && (
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
					className={`w-1 h-full cursor-ew-resize transition-colors border-none relative z-30 shrink-0 ${
						isEditorPdfResizing ? 'bg-gray-400' : 'bg-gray-200 hover:bg-gray-300'
					}`}
					onMouseDown={handleSplitMouseDown}
				/>

				<div
					className={`overflow-hidden relative flex-1 min-w-0 ${isEditorPdfResizing ? 'pointer-events-none' : 'transition-all duration-200'} ${pdfUrl ? 'bg-[#525659]' : 'bg-gray-50'}`}
					style={{
						display: isPdfHidden ? 'none' : 'flex',
					}}
				>
					{isEditorPdfResizing && (
						<div className='absolute inset-0 flex flex-col items-center justify-center text-gray-200 bg-[#323639] p-4 text-center text-sm z-10'>
							<Loader2 className='w-6 h-6 animate-spin text-primary mb-2' />
							<p className='font-medium text-xs'>Release to update preview...</p>
						</div>
					)}

					{pdfUrl ? (
						<div
							className='w-full h-full'
							style={{ display: isEditorPdfResizing ? 'none' : 'block' }}
						>
							<PdfViewer
								url={pdfUrl}
								documentId={documentId || ''}
								onSyncToCode={handleSyncToCode}
								pdfViewerRef={pdfViewerRef}
							/>
						</div>
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
