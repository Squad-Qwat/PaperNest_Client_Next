'use client'

interface ImageViewerProps {
	file: {
		fileId: string
		name: string
		content: string // holds blob: url
		url: string // holds raw url
	}
}

export function ImageViewer({ file }: ImageViewerProps) {
	const displayName = file.name.split('/').pop() || file.name

	return (
		<div className='flex-1 overflow-auto bg-muted/40 flex items-center justify-center p-8 w-full h-full min-h-0'>
			<div className='flex flex-col items-center gap-4 max-w-full'>
				{/* biome-ignore lint/performance/noImgElement: Rendering dynamic external/blob images */}
				<img
					src={file.content || file.url}
					alt={file.name}
					className='max-w-full max-h-[65vh] object-contain rounded-lg shadow-md bg-background border border-border'
				/>
				<div className='text-xs text-muted-foreground font-medium bg-muted px-3 py-1.5 rounded-full border border-border'>
					{displayName}
				</div>
			</div>
		</div>
	)
}
