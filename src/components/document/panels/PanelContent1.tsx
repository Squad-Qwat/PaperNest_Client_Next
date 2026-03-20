'use client'

import React from 'react'
import { FileText } from 'lucide-react'

const PanelContent1: React.FC = () => {
	return (
		<div className='flex flex-col h-full'>
			<div className='flex-1 flex flex-col items-center justify-center gap-4 p-4 text-gray-500'>
				<FileText className='h-12 w-12 text-gray-300' />
				<div className='text-center'>
					<p className='font-medium text-sm'>Files Panel</p>
					<p className='text-xs mt-1'>Access your document files</p>
				</div>
			</div>

			{/* Placeholder content area */}
			<div className='px-4 pb-4'>
				<div className='bg-gray-50 rounded border border-gray-200 p-3 text-xs text-gray-400 space-y-2'>
					<p>• View all files in your workspace</p>
					<p>• Quick file navigation</p>
					<p>• File organization tools</p>
				</div>
			</div>
		</div>
	)
}

export default PanelContent1
