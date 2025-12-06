'use client'

import React from 'react'
import { MessageSquare } from 'lucide-react'

const PanelContent4: React.FC = () => {
	return (
		<div className='flex flex-col h-full'>
			<div className='flex-1 flex flex-col items-center justify-center gap-4 p-4 text-gray-500'>
				<MessageSquare className='h-12 w-12 text-gray-300' />
				<div className='text-center'>
					<p className='font-medium text-sm'>Reviews Panel</p>
					<p className='text-xs mt-1'>Feedback and reviews</p>
				</div>
			</div>

			{/* Placeholder content area */}
			<div className='px-4 pb-4'>
				<div className='bg-gray-50 rounded border border-gray-200 p-3 text-xs text-gray-400 space-y-2'>
					<p>• View document reviews</p>
					<p>• Add feedback comments</p>
					<p>• Track revision history</p>
				</div>
			</div>
		</div>
	)
}

export default PanelContent4
