import { FileText, Users, X } from 'lucide-react'

export type AuxiliaryFile = {
	fileId: string
	name: string
	content: string
	url: string
	isDirty?: boolean
}

interface EditorTabsProps {
	openFiles: AuxiliaryFile[]
	activeFileId: string
	setActiveFileId: (id: string) => void
	onCloseFile: (id: string) => void
}

export function EditorTabs({
	openFiles,
	activeFileId,
	setActiveFileId,
	onCloseFile,
}: EditorTabsProps) {
	return (
		<div className='flex items-center overflow-x-auto bg-[#F8F9FA] border-b border-gray-200 select-none custom-scrollbar shrink-0'>
			{/* Main Document Tab */}
			<div
				className={`flex items-center gap-2 px-4 py-2 border-r border-gray-200 cursor-pointer min-w-max transition-colors
					${activeFileId === 'main' ? 'bg-white border-b-2 border-b-blue-600 text-gray-900 font-medium' : 'hover:bg-gray-100 text-gray-600'}`}
				onClick={() => setActiveFileId('main')}
			>
				<Users className='w-4 h-4 text-green-600' />
				<span className='text-sm'>main.tex</span>
			</div>

			{/* Auxiliary Files Tabs */}
			{openFiles.map((file) => (
				<div
					key={file.fileId}
					className={`group flex items-center gap-2 px-3 py-2 border-r border-gray-200 cursor-pointer min-w-max transition-colors
						${activeFileId === file.fileId ? 'bg-white border-b-2 border-b-blue-600 text-gray-900 font-medium' : 'hover:bg-gray-100 text-gray-600'}`}
					onClick={() => setActiveFileId(file.fileId)}
				>
					<FileText
						className={`w-4 h-4 ${activeFileId === file.fileId ? 'text-blue-500' : 'text-gray-400'}`}
					/>
					<span className='text-sm'>{file.name}</span>

					{/* Dirty Indicator / Close Button */}
					<div
						className='flex items-center justify-center w-5 h-5 ml-1 rounded-sm hover:bg-gray-200 transition-colors'
						onClick={(e) => {
							e.stopPropagation()
							onCloseFile(file.fileId)
						}}
					>
						{file.isDirty ? (
							<div className='w-2 h-2 rounded-full bg-blue-500 group-hover:hidden' />
						) : null}
						<X
							className={`w-3.5 h-3.5 text-gray-500 ${file.isDirty ? 'hidden group-hover:block' : ''} opacity-0 group-hover:opacity-100 transition-opacity`}
						/>
					</div>
				</div>
			))}
		</div>
	)
}
