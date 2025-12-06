// @ts-nocheck
'use client'

import { useState } from 'react'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuShortcut,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
	Bold,
	Italic,
	Underline,
	Strikethrough,
	Copy,
	Clipboard,
	Scissors,
	Trash2,
	Type,
	ArrowUp,
	ArrowDown,
	ArrowLeft,
	ArrowRight,
	Palette,
	Highlighter,
} from 'lucide-react'

const EditorContextMenu = ({ editor, children }) => {
	const [hasSelection, setHasSelection] = useState(false)
	const [inTable, setInTable] = useState(false)

	if (!editor) return <>{children}</>

	const handleCut = () => document.execCommand('cut')
	const handleCopy = () => document.execCommand('copy')
	const handlePaste = () => document.execCommand('paste')

	const handleContextMenuOpen = () => {
		if (!editor) return
		
		const { from, to } = editor.state.selection
		setHasSelection(from !== to)
		
		setInTable(editor.isActive('tableCell') || editor.isActive('tableHeader'))
	}

	const fontFamilies = [
		{ name: 'Times New Roman', value: '"Times New Roman", Times, serif' },
		{ name: 'Arial', value: 'Arial, sans-serif' },
		{ name: 'Calibri', value: 'Calibri, sans-serif' },
		{ name: 'Georgia', value: 'Georgia, serif' },
		{ name: 'Verdana', value: 'Verdana, sans-serif' },
	]

	const fontSizes = ['8pt', '9pt', '10pt', '11pt', '12pt', '14pt', '16pt', '18pt', '24pt', '36pt']

	const textColors = [
		{ name: 'Black', value: '#000000' },
		{ name: 'Red', value: '#ff0000' },
		{ name: 'Blue', value: '#0000ff' },
		{ name: 'Green', value: '#00ff00' },
		{ name: 'Yellow', value: '#ffff00' },
	]

	return (
		<ContextMenu onOpenChange={(open) => open && handleContextMenuOpen()}>
			<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
			<ContextMenuContent className='w-64'>
				{/* Text Formatting - Always show */}
				<ContextMenuItem
					onClick={() => editor.chain().focus().toggleBold().run()}
					disabled={!hasSelection}
				>
					<Bold className='mr-2 h-4 w-4' />
					Bold
					<ContextMenuShortcut>⌘B</ContextMenuShortcut>
				</ContextMenuItem>
				<ContextMenuItem
					onClick={() => editor.chain().focus().toggleItalic().run()}
					disabled={!hasSelection}
				>
					<Italic className='mr-2 h-4 w-4' />
					Italic
					<ContextMenuShortcut>⌘I</ContextMenuShortcut>
				</ContextMenuItem>
				<ContextMenuItem
					onClick={() => editor.chain().focus().toggleUnderline().run()}
					disabled={!hasSelection}
				>
					<Underline className='mr-2 h-4 w-4' />
					Underline
					<ContextMenuShortcut>⌘U</ContextMenuShortcut>
				</ContextMenuItem>
				<ContextMenuItem
					onClick={() => editor.chain().focus().toggleStrike().run()}
					disabled={!hasSelection}
				>
					<Strikethrough className='mr-2 h-4 w-4' />
					Strikethrough
				</ContextMenuItem>

				<ContextMenuSeparator />

				{/* Font Family */}
				<ContextMenuSub>
					<ContextMenuSubTrigger disabled={!hasSelection}>
						<Type className='mr-2 h-4 w-4' />
						Font
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className='w-48'>
						{fontFamilies.map((font) => (
							<ContextMenuItem
								key={font.value}
								onClick={() =>
									editor.chain().focus().setFontFamily(font.value).run()
								}
							>
								<span style={{ fontFamily: font.value }}>{font.name}</span>
							</ContextMenuItem>
						))}
					</ContextMenuSubContent>
				</ContextMenuSub>

				{/* Font Size */}
				<ContextMenuSub>
					<ContextMenuSubTrigger disabled={!hasSelection}>
						<Type className='mr-2 h-4 w-4' />
						Size
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className='w-32'>
						{fontSizes.map((size) => (
							<ContextMenuItem
								key={size}
								onClick={() => editor.chain().focus().setFontSize(size).run()}
							>
								{size}
							</ContextMenuItem>
						))}
					</ContextMenuSubContent>
				</ContextMenuSub>

				{/* Text Color */}
				<ContextMenuSub>
					<ContextMenuSubTrigger disabled={!hasSelection}>
						<Palette className='mr-2 h-4 w-4' />
						Color
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className='w-40'>
						{textColors.map((color) => (
							<ContextMenuItem
								key={color.value}
								onClick={() => editor.chain().focus().setColor(color.value).run()}
							>
								<div
									className='w-4 h-4 mr-2 rounded border'
									style={{ backgroundColor: color.value }}
								/>
								{color.name}
							</ContextMenuItem>
						))}
					</ContextMenuSubContent>
				</ContextMenuSub>

				<ContextMenuSeparator />

				{/* Clipboard Operations */}
				<ContextMenuItem onClick={handleCut} disabled={!hasSelection}>
					<Scissors className='mr-2 h-4 w-4' />
					Cut
					<ContextMenuShortcut>⌘X</ContextMenuShortcut>
				</ContextMenuItem>
				<ContextMenuItem onClick={handleCopy} disabled={!hasSelection}>
					<Copy className='mr-2 h-4 w-4' />
					Copy
					<ContextMenuShortcut>⌘C</ContextMenuShortcut>
				</ContextMenuItem>
				<ContextMenuItem onClick={handlePaste}>
					<Clipboard className='mr-2 h-4 w-4' />
					Paste
					<ContextMenuShortcut>⌘V</ContextMenuShortcut>
				</ContextMenuItem>

				{inTable && (
					<>
						<ContextMenuSeparator />

						{/* Insert Row */}
						<ContextMenuSub>
							<ContextMenuSubTrigger>
								<ArrowUp className='mr-2 h-4 w-4' />
								Insert Row
							</ContextMenuSubTrigger>
							<ContextMenuSubContent>
								<ContextMenuItem
									onClick={() => editor.chain().focus().addRowBefore().run()}
								>
									<ArrowUp className='mr-2 h-4 w-4' />
									Above
								</ContextMenuItem>
								<ContextMenuItem
									onClick={() => editor.chain().focus().addRowAfter().run()}
								>
									<ArrowDown className='mr-2 h-4 w-4' />
									Below
								</ContextMenuItem>
							</ContextMenuSubContent>
						</ContextMenuSub>

						{/* Insert Column */}
						<ContextMenuSub>
							<ContextMenuSubTrigger>
								<ArrowRight className='mr-2 h-4 w-4' />
								Insert Column
							</ContextMenuSubTrigger>
							<ContextMenuSubContent>
								<ContextMenuItem
									onClick={() => editor.chain().focus().addColumnBefore().run()}
								>
									<ArrowLeft className='mr-2 h-4 w-4' />
									Left
								</ContextMenuItem>
								<ContextMenuItem
									onClick={() => editor.chain().focus().addColumnAfter().run()}
								>
									<ArrowRight className='mr-2 h-4 w-4' />
									Right
								</ContextMenuItem>
							</ContextMenuSubContent>
						</ContextMenuSub>

						<ContextMenuSeparator />

						{/* Delete Operations */}
						<ContextMenuItem
							onClick={() => editor.chain().focus().deleteRow().run()}
							className='text-red-600'
						>
							<Trash2 className='mr-2 h-4 w-4' />
							Delete Row
						</ContextMenuItem>
						<ContextMenuItem
							onClick={() => editor.chain().focus().deleteColumn().run()}
							className='text-red-600'
						>
							<Trash2 className='mr-2 h-4 w-4' />
							Delete Column
						</ContextMenuItem>
						<ContextMenuItem
							onClick={() => editor.chain().focus().deleteTable().run()}
							className='text-red-600'
						>
							<Trash2 className='mr-2 h-4 w-4' />
							Delete Table
						</ContextMenuItem>
					</>
				)}
			</ContextMenuContent>
		</ContextMenu>
	)
}

export default EditorContextMenu
