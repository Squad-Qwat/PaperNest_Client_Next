'use client'

import React from 'react'

/**
 * Editor Context Menu Component (Placeholder)
 * This is a placeholder component for the editor context menu
 * Will be implemented in the future
 */
interface ContextMenuProps {
	editor?: any
	visible?: boolean
	x?: number
	y?: number
	onClose?: () => void
}

const ContextMenu: React.FC<ContextMenuProps> = ({
	editor,
	visible = false,
	x = 0,
	y = 0,
	onClose,
}) => {
	if (!visible) return null

	return (
		<div
			className='fixed bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1 min-w-[160px]'
			style={{ top: y, left: x }}
		>
			<div className='px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer'>Cut</div>
			<div className='px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer'>Copy</div>
			<div className='px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer'>Paste</div>
			<div className='border-t border-gray-200 my-1'></div>
			<div className='px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer'>
				Select All
			</div>
		</div>
	)
}

export default ContextMenu
