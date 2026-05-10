import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { laTeXService } from '@/lib/latex/LaTeXService'

interface UseLatexCompilationProps {
	documentId?: string | null
	files: any[]
	refetchFiles: () => Promise<any>
}

export function useLatexCompilation({ documentId, files, refetchFiles }: UseLatexCompilationProps) {
	const [isCompiling, setIsCompiling] = useState(false)
	const [compileResult, setCompileResult] = useState<any>(null)
	const [pdfUrl, setPdfUrl] = useState<string | null>(null)
	const [showLog, setShowLog] = useState(false)

	const handleCompile = useCallback(
		async (content: string) => {
			setIsCompiling(true)
			try {
				let currentFiles = files
				if (documentId) {
					const refreshed = await refetchFiles()
					if (refreshed.data) currentFiles = refreshed.data
				}

				const result = await laTeXService.compileWithAssets(
					'main.tex',
					content,
					currentFiles,
					undefined,
					documentId ?? undefined
				)
				setCompileResult(result)

				if (result.pdf) {
					const blob = new Blob([result.pdf as any], { type: 'application/pdf' })
					setPdfUrl((prev) => {
						if (prev) URL.revokeObjectURL(prev)
						return URL.createObjectURL(blob)
					})

					if (result.status !== 0) {
						toast.warning('Kompilasi selesai dengan peringatan.')
						setShowLog(true)
					} else {
						setShowLog(false)
					}
				} else {
					toast.error('Gagal membuat PDF. Periksa log untuk detailnya.')
					setShowLog(true)
				}
			} catch (error: any) {
				console.error('Compilation error:', error)
				toast.error(`Kompilasi gagal: ${error.message || 'Terjadi kesalahan internal'}`)
			} finally {
				setIsCompiling(false)
			}
		},
		[files, documentId, refetchFiles]
	)

	// Cleanup PDF URL on unmount
	useEffect(() => {
		return () => {
			if (pdfUrl) URL.revokeObjectURL(pdfUrl)
		}
	}, [pdfUrl])

	return {
		isCompiling,
		compileResult,
		pdfUrl,
		showLog,
		setShowLog,
		handleCompile,
	}
}
