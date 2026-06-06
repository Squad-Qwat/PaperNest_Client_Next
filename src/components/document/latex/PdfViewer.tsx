'use client'

import { FileText, Loader2, Maximize2, ZoomIn, ZoomOut } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import type React from 'react'
import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import { apiClient } from '@/lib/api/clients/api-client'

pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@5.5.207/build/pdf.worker.min.mjs`

interface PdfViewerProps {
	url: string
	documentId: string
	onSyncToCode?: (file: string, line: number) => void
	pdfViewerRef?: React.RefObject<PdfViewerRefActions | null>
}

export interface PdfViewerRefActions {
	scrollToPosition: (
		page: number,
		x: number,
		y: number,
		widthVal?: number,
		heightVal?: number
	) => void
}

export function PdfViewer({ url, documentId, onSyncToCode, pdfViewerRef }: PdfViewerProps) {
	const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
	const [numPages, setNumPages] = useState<number>(0)
	const [scale, setScale] = useState<number>(1.2)
	const [scaleMode, setScaleMode] = useState<'fit' | 'manual'>('fit')
	const [loading, setLoading] = useState<boolean>(true)
	const containerRef = useRef<HTMLDivElement>(null)
	const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())

	useImperativeHandle(pdfViewerRef, () => ({
		scrollToPosition: async (
			pageNumber: number,
			x: number,
			y: number,
			widthVal?: number,
			heightVal?: number
		) => {
			if (!pdf) return
			const pageDiv = pageRefs.current.get(pageNumber)
			if (pageDiv) {
				pageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' })

				try {
					const page = await pdf.getPage(pageNumber)
					const viewport = page.getViewport({ scale })

					const hasExactBox =
						widthVal !== undefined && heightVal !== undefined && widthVal > 0 && heightVal > 0
					const rectLeft = hasExactBox ? x : 0
					const rectRight = hasExactBox ? x + widthVal! : viewport.viewBox[2]
					const rectTop = y
					const rectBottom = y + (hasExactBox ? heightVal! : 15)

					const viewBoxHeight = viewport.viewBox[3]
					const pdfLeft = rectLeft
					const pdfRight = rectRight
					const pdfBottom = viewBoxHeight - rectBottom
					const pdfTop = viewBoxHeight - rectTop

					const viewportRect = viewport.convertToViewportRectangle([
						pdfLeft,
						pdfBottom,
						pdfRight,
						pdfTop,
					])

					const normalizedRect = [
						Math.min(viewportRect[0], viewportRect[2]),
						Math.min(viewportRect[1], viewportRect[3]),
						Math.max(viewportRect[0], viewportRect[2]),
						Math.max(viewportRect[1], viewportRect[3]),
					]

					const left = Math.max(normalizedRect[0], 0)
					const top = Math.max(normalizedRect[1], 0)
					const width = normalizedRect[2] - normalizedRect[0]
					const height = normalizedRect[3] - normalizedRect[1]

					const indicator = document.createElement('div')
					indicator.className =
						'absolute bg-primary/30 border border-primary rounded pointer-events-none transition-opacity duration-1000 z-10'
					indicator.style.left = `${left}px`
					indicator.style.top = `${top}px`
					indicator.style.width = `${width}px`
					indicator.style.height = `${height}px`

					pageDiv.appendChild(indicator)
					setTimeout(() => {
						indicator.style.opacity = '0'
						setTimeout(() => indicator.remove(), 1000)
					}, 1500)
				} catch (err) {
					console.error('Error rendering highlight:', err)
				}
			}
		},
	}))

	useEffect(() => {
		let isMounted = true
		setLoading(true)

		const loadPdf = async () => {
			try {
				const loadingTask = pdfjsLib.getDocument(url)
				const loadedPdf = await loadingTask.promise
				if (isMounted) {
					setPdf(loadedPdf)
					setNumPages(loadedPdf.numPages)
					setLoading(false)
				}
			} catch (error) {
				console.error('Error loading PDF:', error)
				if (isMounted) setLoading(false)
			}
		}

		loadPdf()
		return () => {
			isMounted = false
		}
	}, [url])

	// Observe container size and fit page to width if scaleMode is 'fit'
	useEffect(() => {
		if (!pdf || scaleMode !== 'fit' || !containerRef.current) return

		const handleResize = async () => {
			try {
				const page = await pdf.getPage(1)
				const viewport = page.getViewport({ scale: 1 })
				const containerWidth = containerRef.current?.clientWidth || 0
				// Subtract padding (p-6 is 24px left + 24px right = 48px total)
				const padding = 48
				if (containerWidth > padding + 20) {
					const calculatedScale = (containerWidth - padding) / viewport.width
					setScale(Math.min(Math.max(calculatedScale, 0.3), 3.0))
				}
			} catch (err) {
				console.error('Error fitting PDF to width:', err)
			}
		}

		handleResize()

		const observer = new ResizeObserver(() => {
			handleResize()
		})
		observer.observe(containerRef.current)

		return () => {
			observer.disconnect()
		}
	}, [pdf, scaleMode])

	const handlePageDoubleClick = async (e: React.MouseEvent<HTMLDivElement>, pageNumber: number) => {
		if (!pdf || !onSyncToCode) return

		const currentTarget = e.currentTarget
		const clientX = e.clientX
		const clientY = e.clientY

		try {
			const _page = await pdf.getPage(pageNumber)
			const rect = currentTarget.getBoundingClientRect()

			const clickX = clientX - rect.left
			const clickY = clientY - rect.top

			const pdfX = clickX / scale
			const pdfY = clickY / scale

			const resJson = await apiClient.get<any>(
				`/latex/sync/code?documentId=${documentId}&page=${pageNumber}&x=${pdfX}&y=${pdfY}`
			)

			if (resJson?.file && resJson.line) {
				const { file, line } = resJson
				onSyncToCode(file, line)
			}
		} catch (error) {
			console.error('Error in syncToCode:', error)
		}
	}

	return (
		<div className='flex flex-col h-full w-full bg-[#525659] overflow-hidden'>
			{/* Toolbar */}
			<div className='flex items-center justify-between px-4 py-2 bg-[#323639] text-white select-none z-10 shadow-md'>
				<div className='flex items-center gap-2 text-xs font-medium text-gray-300'>
					<FileText className='w-4 h-4 text-primary' />
					<span>Document Preview ({numPages} Pages)</span>
				</div>
				<div className='flex items-center gap-2'>
					<button
						type='button'
						onClick={() => {
							setScaleMode('manual')
							setScale((s) => Math.max(s - 0.1, 0.3))
						}}
						className='p-1 rounded hover:bg-white/10 text-gray-300 hover:text-white transition-colors'
						title='Zoom Out'
					>
						<ZoomOut className='w-4 h-4' />
					</button>
					<span className='text-xs font-mono px-2 text-gray-300'>{Math.round(scale * 100)}%</span>
					<button
						type='button'
						onClick={() => {
							setScaleMode('manual')
							setScale((s) => Math.min(s + 0.1, 3.0))
						}}
						className='p-1 rounded hover:bg-white/10 text-gray-300 hover:text-white transition-colors'
						title='Zoom In'
					>
						<ZoomIn className='w-4 h-4' />
					</button>
					<div className='w-px h-4 bg-white/20 mx-1' />
					<button
						type='button'
						onClick={() => setScaleMode('fit')}
						className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
							scaleMode === 'fit'
								? 'bg-primary text-primary-foreground'
								: 'hover:bg-white/10 text-gray-300 hover:text-white'
						}`}
						title='Fit to Width'
					>
						<Maximize2 className='w-3 h-3' />
						<span>Fit Width</span>
					</button>
				</div>
			</div>

			{/* PDF Container */}
			<div ref={containerRef} className='flex-1 overflow-auto p-6 flex flex-col items-center gap-6'>
				{loading ? (
					<div className='flex flex-col items-center justify-center h-full text-white/50 gap-2'>
						<Loader2 className='w-8 h-8 animate-spin text-primary' />
						<span className='text-sm'>Loading PDF document...</span>
					</div>
				) : (
					Array.from({ length: numPages }).map((_, index) => (
						<PdfPage
							// biome-ignore lint/suspicious/noArrayIndexKey: pages list is static after load
							key={index}
							pdf={pdf!}
							pageNumber={index + 1}
							scale={scale}
							onDoubleClick={handlePageDoubleClick}
							registerRef={(el) => {
								if (el) pageRefs.current.set(index + 1, el)
								else pageRefs.current.delete(index + 1)
							}}
						/>
					))
				)}
			</div>
		</div>
	)
}

interface PdfPageProps {
	pdf: pdfjsLib.PDFDocumentProxy
	pageNumber: number
	scale: number
	onDoubleClick: (e: React.MouseEvent<HTMLDivElement>, pageNumber: number) => void
	registerRef: (el: HTMLDivElement | null) => void
}

function PdfPage({ pdf, pageNumber, scale, onDoubleClick, registerRef }: PdfPageProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const textLayerRef = useRef<HTMLDivElement>(null)
	const [_rendered, setRendered] = useState<boolean>(false)
	const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)

	useEffect(() => {
		let isCurrent = true
		let renderTask: any = null

		const renderPage = async () => {
			try {
				const page = await pdf.getPage(pageNumber)
				const viewport = page.getViewport({ scale })

				if (!isCurrent) return
				setDimensions({ width: viewport.width, height: viewport.height })

				const canvas = canvasRef.current
				if (!canvas) return
				const context = canvas.getContext('2d')
				if (!context) return

				const devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 1
				const outputScale = Math.max(devicePixelRatio, 1)

				canvas.width = Math.floor(viewport.width * outputScale)
				canvas.height = Math.floor(viewport.height * outputScale)
				canvas.style.width = `${viewport.width}px`
				canvas.style.height = `${viewport.height}px`

				const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined

				const renderContext = {
					canvasContext: context,
					viewport,
					transform,
					canvas: canvas,
				}

				renderTask = page.render(renderContext)
				await renderTask.promise

				// Render Text Layer
				if (textLayerRef.current) {
					textLayerRef.current.innerHTML = ''
					const textContent = await page.getTextContent()

					const textLayer = new pdfjsLib.TextLayer({
						textContentSource: textContent,
						container: textLayerRef.current,
						viewport,
					})
					await textLayer.render()
				}

				if (isCurrent) {
					setRendered(true)
				}
			} catch (error: any) {
				// PDF.js throws a RenderingCancelledException when cancelled, which is safe to ignore
				if (
					error?.name !== 'RenderingCancelledException' &&
					error?.message !== 'Rendering cancelled'
				) {
					console.error('Error rendering page:', error)
				}
			}
		}

		renderPage()

		return () => {
			isCurrent = false
			if (renderTask) {
				try {
					renderTask.cancel()
				} catch (_e) {
					// Ignore sync errors during cancel
				}
			}
		}
	}, [pdf, pageNumber, scale])

	return (
		<div
			ref={registerRef}
			className='relative bg-white shadow-2xl rounded-md border border-gray-400 select-text overflow-hidden shrink-0'
			style={{
				width: dimensions ? `${dimensions.width}px` : 'auto',
				height: dimensions ? `${dimensions.height}px` : 'auto',
			}}
		>
			<canvas ref={canvasRef} className='block' />
			{/* biome-ignore lint/a11y/noStaticElementInteractions: text layer double click is used for SyncTeX coordinate mapping */}
			<div
				ref={textLayerRef}
				onDoubleClick={(e) => onDoubleClick(e, pageNumber)}
				className='absolute inset-0 text-transparent opacity-30 select-text pointer-events-auto leading-none text-layer cursor-text'
				style={{
					width: dimensions ? `${dimensions.width}px` : '100%',
					height: dimensions ? `${dimensions.height}px` : '100%',
				}}
			/>
			<style jsx>{`
				.text-layer :global(span) {
					position: absolute;
					transform-origin: 0% 0%;
				}
			`}</style>
		</div>
	)
}
