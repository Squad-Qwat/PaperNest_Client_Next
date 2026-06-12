'use client'

import { BookOpen, FileText, List, MessageSquare } from 'lucide-react'
import type React from 'react'

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
		<div className='w-12 bg-card border-r border-border flex shrink-0 flex-col items-center gap-2 py-4'>
			{panels.map((panel) => {
				const Icon = panel.icon
				const isActive = activePanel === panel.id
				return (
					<button
						type='button'
						key={panel.id}
						onClick={() => onPanelClick(panel.id)}
						title={panel.label}
						className={`p-2 rounded-lg transition-colors ${
							isActive ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted'
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
