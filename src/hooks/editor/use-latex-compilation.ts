import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { laTeXService } from '@/lib/latex/LaTeXService'

interface UseLatexCompilationProps {
	documentId?: string | null
	files: any[]
	refetchFiles: () => Promise<any>
}

export function useLatexCompilation({ documentId, files, refetchFiles }: UseLatexCompilationProps) {
	const [pdfUrl, setPdfUrl] = useState<string | null>(null)
	const [showLog, setShowLog] = useState(false)

	const compileMutation = useMutation({
		mutationFn: async (content: string) => {
			let currentFiles = files
			if (documentId) {
				const refreshed = await refetchFiles()
				if (refreshed.data) currentFiles = refreshed.data
			}

			return await laTeXService.compileWithAssets(
				'main.tex',
				content,
				currentFiles,
				undefined,
				documentId ?? undefined
			)
		},
		onSuccess: (result) => {
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
		},
		onError: (error: any) => {
			console.error('Compilation error:', error)
			toast.error(`Kompilasi gagal: ${error.message || 'Terjadi kesalahan internal'}`)
		},
	})
	useEffect(() => {
		return () => {
			if (pdfUrl) URL.revokeObjectURL(pdfUrl)
		}
	}, [pdfUrl])
	return {
		isCompiling: compileMutation.isPending,
		compileResult: compileMutation.data,
		pdfUrl,
		showLog,
		setShowLog,
		handleCompile: compileMutation.mutateAsync,
	}
}
