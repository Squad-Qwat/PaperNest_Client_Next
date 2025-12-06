'use client'

import React from 'react'
import { FileText, List, BookOpen, MessageSquare } from 'lucide-react'

interface SidenavPanelProps {
	activePanel: string | null
	onPanelClick: (panelId: string) => void
}

const SidenavPanel: React.FC<SidenavPanelProps> = ({ activePanel, onPanelClick }) => {
	const panels = [
		{ id: 'panel1', icon: FileText, label: 'Files' },
		{ id: 'panel2', icon: List, label: 'Table of Contents' },
		{ id: 'panel3', icon: BookOpen, label: 'References' },
		{ id: 'panel4', icon: MessageSquare, label: 'Reviews' },
	]

	return (
		<div className='w-12 bg-white border-r border-gray-200 flex shrink-0 flex-col items-center gap-2 py-4'>
			{panels.map((panel) => {
				const Icon = panel.icon
				const isActive = activePanel === panel.id
				return (
					<button
						key={panel.id}
						onClick={() => onPanelClick(panel.id)}
						title={panel.label}
						className={`p-2 rounded-lg transition-colors ${
							isActive
								? 'bg-primary/20 text-primary'
								: 'text-gray-600 hover:bg-gray-100'
						}`}
					>
						<Icon className='h-5 w-5' />
					</button>
				)
			})}
		</div>
	)
}

export default SidenavPanel
