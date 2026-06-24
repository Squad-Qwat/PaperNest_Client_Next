import { Notebook } from '@react-symbols/icons'
import { FileIcon as RFileIcon } from '@react-symbols/icons/utils'
import { X } from 'lucide-react'

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
		<div className='flex items-center overflow-x-auto bg-muted/40 border-b border-border select-none custom-scrollbar shrink-0'>
			{/* Main Document Tab */}
			{/* biome-ignore lint/a11y/useSemanticElements: Using div with button role for custom tab layouts */}
			<div
				role='button'
				tabIndex={0}
				className={`flex items-center gap-2 px-4 py-2 border-r border-border cursor-pointer min-w-max transition-colors outline-none focus-visible:bg-muted
					${activeFileId === 'main' ? 'bg-background border-b-2 border-b-primary text-foreground font-medium' : 'hover:bg-muted text-muted-foreground'}`}
				onClick={() => setActiveFileId('main')}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault()
						setActiveFileId('main')
					}
				}}
			>
				<RFileIcon
					fileName='main.tex'
					className='w-4 h-4 shrink-0'
					editFileExtensionData={{
						bib: Notebook,
					}}
				/>
				<span className='text-sm text-foreground'>main.tex</span>
			</div>

			{/* Auxiliary Files Tabs */}
			{openFiles.map((file) => (
				/* biome-ignore lint/a11y/useSemanticElements: Using div with button role for custom tab layouts */
				<div
					key={file.fileId}
					role='button'
					tabIndex={0}
					className={`group flex items-center gap-2 px-3 py-2 border-r border-border cursor-pointer min-w-max transition-colors outline-none focus-visible:bg-muted
						${activeFileId === file.fileId ? 'bg-background border-b-2 border-b-primary text-foreground font-medium' : 'hover:bg-muted text-muted-foreground'}`}
					onClick={() => setActiveFileId(file.fileId)}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault()
							setActiveFileId(file.fileId)
						}
					}}
				>
					<RFileIcon
						fileName={file.name}
						className='w-4 h-4 shrink-0'
						editFileExtensionData={{
							bib: Notebook,
						}}
					/>
					<span className='text-sm'>{file.name}</span>

					{/* Dirty Indicator / Close Button */}
					{/* biome-ignore lint/a11y/useSemanticElements: Using div with button role for nested close button */}
					<div
						role='button'
						tabIndex={0}
						aria-label={`Close ${file.name}`}
						className='flex items-center justify-center w-5 h-5 ml-1 rounded-sm hover:bg-muted transition-colors outline-none focus-visible:bg-muted/80'
						onClick={(e) => {
							e.stopPropagation()
							onCloseFile(file.fileId)
						}}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.stopPropagation()
								e.preventDefault()
								onCloseFile(file.fileId)
							}
						}}
					>
						{file.isDirty ? (
							<div className='w-2 h-2 rounded-full bg-blue-500 group-hover:hidden' />
						) : null}
						<X
							className={`w-3.5 h-3.5 text-muted-foreground ${file.isDirty ? 'hidden group-hover:block' : ''} opacity-0 group-hover:opacity-100 transition-opacity`}
						/>
					</div>
				</div>
			))}
		</div>
	)
}
