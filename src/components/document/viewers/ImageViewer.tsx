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
		<div className='flex-1 overflow-auto bg-gray-50/50 flex items-center justify-center p-8 w-full h-full min-h-0'>
			<div className='flex flex-col items-center gap-4 max-w-full'>
				<img
					src={file.content || file.url}
					alt={file.name}
					className='max-w-full max-h-[65vh] object-contain rounded-lg shadow-md bg-white border border-gray-200'
				/>
				<div className='text-xs text-gray-500 font-medium bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200/50'>
					{displayName}
				</div>
			</div>
		</div>
	)
}
