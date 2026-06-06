'use client'

import { X } from 'lucide-react'
import type React from 'react'
import { useCallback, useState } from 'react'
import PanelContent1 from './panels/PanelContent1'
import PanelContent2 from './panels/PanelContent2'
import PanelContent3 from './panels/PanelContent3'
import PanelContent4 from './panels/PanelContent4'

interface DynamicContentPanelProps {
	activePanel: string | null
	onClose: () => void
	onWidthChange?: (width: number) => void
	onResizeStart?: () => void
	onResizeEnd?: () => void
	currentContent?: string | null
	onNavigateToSection?: (heading: string, position: number) => void
	onInsertText?: (text: string) => void
	getCurrentContent?: () => string
	documentId?: string | null
	onOpenFile?: (file: { fileId: string; name: string; content: string; url: string } | null) => void
}

const DynamicContentPanel: React.FC<DynamicContentPanelProps> = ({
	activePanel,
	onClose,
	onWidthChange,
	onResizeStart,
	onResizeEnd,
	currentContent,
	onNavigateToSection,
	onInsertText,
	getCurrentContent,
	documentId,
	onOpenFile,
}) => {
	const [width, setWidth] = useState(320) // Default width 320px
	const [isResizing, setIsResizing] = useState(false)

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault()
			setIsResizing(true)
			if (onResizeStart) onResizeStart()

			const startX = e.clientX
			const startWidth = width

			const handleMouseMove = (moveEvent: MouseEvent) => {
				const deltaX = moveEvent.clientX - startX
				const newWidth = Math.min(Math.max(startWidth + deltaX, 280), 600) // min 280px, max 600px
				setWidth(newWidth)
				if (onWidthChange) {
					onWidthChange(newWidth)
				}
			}

			const handleMouseUp = () => {
				setIsResizing(false)
				if (onResizeEnd) onResizeEnd()
				document.removeEventListener('mousemove', handleMouseMove)
				document.removeEventListener('mouseup', handleMouseUp)
			}

			document.addEventListener('mousemove', handleMouseMove)
			document.addEventListener('mouseup', handleMouseUp)
		},
		[width, onWidthChange, onResizeStart, onResizeEnd]
	)

	if (!activePanel) return null

	const panelLabels: Record<string, string> = {
		panel1: 'Files',
		panel2: 'Table of Contents',
		panel3: 'References',
		panel4: 'Reviews',
	}

	const renderContent = () => {
		switch (activePanel) {
			case 'panel1':
				return (
					<PanelContent1
						documentId={documentId}
						onInsertText={onInsertText}
						onOpenFile={onOpenFile}
					/>
				)
			case 'panel2':
				return (
					<PanelContent2
						currentContent={currentContent}
						onNavigateToSection={onNavigateToSection}
						getCurrentContent={getCurrentContent}
					/>
				)
			case 'panel3':
				return <PanelContent3 onInsertText={onInsertText} />

			case 'panel4':
				return <PanelContent4 documentId={documentId} />
			default:
				return null
		}
	}

	return (
		<div
			className='bg-white border-r border-gray-200 shadow-lg flex shrink-0 relative overflow-hidden'
			style={{
				width: `${width}px`,
				height: '100%',
			}}
		>
			{/* Resize Handle - right edge */}
			<hr
				className={`absolute right-0 top-0 h-full w-1 cursor-ew-resize transition-colors z-10 border-none ${
					isResizing ? 'bg-gray-400' : 'bg-gray-200 hover:bg-gray-300'
				}`}
				onMouseDown={handleMouseDown}
				aria-orientation='vertical'
				aria-valuenow={width}
				aria-valuemin={280}
				aria-valuemax={600}
				tabIndex={0}
			/>

			{/* Content */}
			<div className='flex-1 flex flex-col overflow-hidden'>
				<div className='flex items-center justify-between gap-2 border-b border-gray-100 p-3 shrink-0'>
					<h3 className='text-sm font-semibold text-gray-700 truncate'>
						{panelLabels[activePanel] || 'Panel'}
					</h3>
					<div className='flex items-center gap-2'>
						<div id='panel-header-actions' className='flex items-center' />
						<button
							type='button'
							onClick={onClose}
							className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
							title='Close panel'
						>
							<X className='h-5 w-5 text-gray-500 hover:text-gray-700' />
						</button>
					</div>
				</div>

				{/* Scrollable Content Area */}
				<div className='flex-1 overflow-y-auto'>{renderContent()}</div>
			</div>
		</div>
	)
}

export default DynamicContentPanel
