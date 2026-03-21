'use client'

import React, { useState, useCallback, useRef } from 'react'
import { X } from 'lucide-react'
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
	editorView?: any
	getCurrentContent?: () => string
	documentId?: string | null
}

const DynamicContentPanel: React.FC<DynamicContentPanelProps> = ({
	activePanel,
	onClose,
	onWidthChange,
	onResizeStart,
	onResizeEnd,
	currentContent,
	onNavigateToSection,
	editorView,
	getCurrentContent,
	documentId,
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
				return <PanelContent1 documentId={documentId} editorView={editorView} />
			case 'panel2':
				return (
					<PanelContent2
						currentContent={currentContent}
						onNavigateToSection={onNavigateToSection}
						editorView={editorView}
						getCurrentContent={getCurrentContent}
					/>
				)
			case 'panel3':
				return <PanelContent3 />
			case 'panel4':
				return <PanelContent4 />
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
			<div
				className={`absolute right-0 top-0 h-full w-1 cursor-ew-resize hover:bg-blue-500 transition-colors z-10 ${
					isResizing ? 'bg-blue-500' : 'bg-transparent hover:bg-blue-300'
				}`}
				onMouseDown={handleMouseDown}
			>
				<div className='absolute right-1/2 top-1/2 translate-x-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-gray-300 opacity-0 hover:opacity-100 transition-opacity' />
			</div>

			{/* Content */}
			<div className='flex-1 flex flex-col overflow-hidden'>
				{/* Header */}
				<div className='flex items-center justify-between gap-2 border-b border-gray-100 p-3 flex-shrink-0'>
					<h3 className='text-sm font-semibold text-gray-700 truncate'>
						{panelLabels[activePanel] || 'Panel'}
					</h3>
					<button
						onClick={onClose}
						className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
						title='Close panel'
					>
						<X className='h-5 w-5 text-gray-500 hover:text-gray-700' />
					</button>
				</div>

				{/* Scrollable Content Area */}
				<div className='flex-1 overflow-y-auto'>{renderContent()}</div>
			</div>
		</div>
	)
}

export default DynamicContentPanel
