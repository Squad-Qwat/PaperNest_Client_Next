'use client'

import React from 'react'
import { BookOpen } from 'lucide-react'

const PanelContent3: React.FC = () => {
	return (
		<div className='flex flex-col h-full'>
			<div className='flex-1 flex flex-col items-center justify-center gap-4 p-4 text-gray-500'>
				<BookOpen className='h-12 w-12 text-gray-300' />
				<div className='text-center'>
					<p className='font-medium text-sm'>References Panel</p>
					<p className='text-xs mt-1'>Manage your references</p>
				</div>
			</div>

			{/* Placeholder content area */}
			<div className='px-4 pb-4'>
				<div className='bg-gray-50 rounded border border-gray-200 p-3 text-xs text-gray-400 space-y-2'>
					<p>• Add bibliography entries</p>
					<p>• Manage citations</p>
					<p>• Link external sources</p>
				</div>
			</div>
		</div>
	)
}

export default PanelContent3
