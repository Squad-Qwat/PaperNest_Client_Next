import { useCallback, useEffect, useState } from 'react'
import { laTeXService } from '@/lib/latex/LaTeXService'

export function useCompilePdf(documentId: string, files: any[]) {
	const [pdfUrl, setPdfUrl] = useState<string | null>(null)
	const [isCompiling, setIsCompiling] = useState(false)
	const [compileError, setCompileError] = useState<string | null>(null)

	const handleCompile = useCallback(
		async (content: string) => {
			if (!content || !documentId) return
			setIsCompiling(true)
			setCompileError(null)
			try {
				const result = await laTeXService.compileWithAssets(
					'main.tex',
					content,
					files,
					undefined,
					documentId
				)
				if (result.status === 0 && result.pdf) {
					const blob = new Blob([result.pdf as any], { type: 'application/pdf' })
					const url = URL.createObjectURL(blob)
					setPdfUrl((prev) => {
						if (prev) URL.revokeObjectURL(prev)
						return url
					})
				} else {
					setCompileError(result.log || 'Kompilasi PDF gagal.')
				}
			} catch (error: any) {
				setCompileError(error.message || 'Error saat mengompilasi PDF')
			} finally {
				setIsCompiling(false)
			}
		},
		[files, documentId]
	)

	useEffect(() => {
		return () => {
			if (pdfUrl) URL.revokeObjectURL(pdfUrl)
		}
	}, [pdfUrl])

	return {
		pdfUrl,
		isCompiling,
		compileError,
		handleCompile,
	}
}
