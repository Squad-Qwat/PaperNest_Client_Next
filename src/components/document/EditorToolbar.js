'use client'

import { Button } from '@/components/ui/button'
import {
	Bold as BoldIcon,
	Italic as ItalicIcon,
	Underline as UnderlineIcon,
	Strikethrough,
	Code as CodeIcon,
	Quote,
	List,
	ListOrdered,
	Heading1,
	Heading2,
	Heading3,
	Undo,
	Redo,
	ChevronDown,
	Plus,
	Minus,
	ChevronRight,
	Check,
	AlignLeft,
	AlignCenter,
	AlignRight,
	AlignJustify,
	FileText,
	Download,
	FileDown,
	FileUp,
	Upload,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

const EditorToolbar = ({
	editor,
	insertTable,
	aiAssistantOpen,
	// Undo/Redo functions (collaboration-aware)
	undo,
	redo,
	canUndo,
	canRedo,
	// Debug function (development only)
	debugContentExtraction,
}) => {
	const [fontFamilyOpen, setFontFamilyOpen] = useState(false)
	const [textStyleOpen, setTextStyleOpen] = useState(false)
	const [lineSpacingOpen, setLineSpacingOpen] = useState(false)
	const [activeTextStyle, setActiveTextStyle] = useState('Normal Text')
	const [hoveredStyle, setHoveredStyle] = useState(null)
	const [mounted, setMounted] = useState(false)
	const [updateTrigger, setUpdateTrigger] = useState(0)
	const fontFamilyRef = useRef(null)
	const textStyleRef = useRef(null)
	const lineSpacingRef = useRef(null)

	// Helper function untuk safe focus yang menghindari cursor jump ke footer
	const safeFocus = (editor) => {
		if (!editor) return false

		try {
			// Gunakan smartFocus jika tersedia
			if (editor.commands.smartFocus) {
				return editor.commands.smartFocus()
			}

			// Fallback: cari posisi yang aman dalam body
			const { doc } = editor.state
			let safePos = null

			doc.descendants((node, pos) => {
				// Skip header/footer, fokus pada body content
				if (node.type.name === 'body' || (node.type.name === 'paragraph' && !safePos)) {
					safePos = pos + 1
					return false
				}
				return true
			})

			if (safePos) {
				const tr = editor.state.tr.setSelection(
					editor.state.selection.constructor.near(editor.state.doc.resolve(safePos))
				)
				editor.view.dispatch(tr)
				return true
			}

			// Final fallback
			return editor.commands.focus('start')
		} catch (error) {
			console.warn('Safe focus failed:', error)
			return editor.commands.focus('start')
		}
	}

	// Store style definitions for each text style type with validation
	const [styleDefinitions, setStyleDefinitions] = useState(() => {
		const defaultStyles = {
			'Normal Text': {
				fontFamily: '"Times New Roman", Times, serif',
				fontSize: '11pt',
				bold: false,
				italic: false,
				underline: false,
				strike: false,
			},
			'Heading 1': {
				fontFamily: '"Times New Roman", Times, serif',
				fontSize: '24pt',
				bold: true,
				italic: false,
				underline: false,
				strike: false,
			},
			'Heading 2': {
				fontFamily: '"Times New Roman", Times, serif',
				fontSize: '18pt',
				bold: true,
				italic: false,
				underline: false,
				strike: false,
			},
			'Heading 3': {
				fontFamily: '"Times New Roman", Times, serif',
				fontSize: '14pt',
				bold: true,
				italic: false,
				underline: false,
				strike: false,
			},
			'Heading 4': {
				fontFamily: '"Times New Roman", Times, serif',
				fontSize: '12pt',
				bold: true,
				italic: false,
				underline: false,
				strike: false,
			},
		}

		// Validate and return styles
		return defaultStyles
	})

	useEffect(() => {
		setMounted(true)

		// Update toolbar when cursor position changes
		const updateHandler = () => {
			// Force re-render to update font size display
			setUpdateTrigger((prev) => prev + 1)

			// Update active text style based on current selection
			if (editor && !editor.isDestroyed) {
				try {
					if (editor.isActive('heading', { level: 1 })) {
						setActiveTextStyle('Heading 1')
					} else if (editor.isActive('heading', { level: 2 })) {
						setActiveTextStyle('Heading 2')
					} else if (editor.isActive('heading', { level: 3 })) {
						setActiveTextStyle('Heading 3')
					} else if (editor.isActive('heading', { level: 4 })) {
						setActiveTextStyle('Heading 4')
					} else {
						setActiveTextStyle('Normal Text')
					}

					// Update list item bold classes for marker styling
					updateListItemBoldClasses()
				} catch (error) {
					console.warn('Error updating active text style:', error)
				}
			}
		}

		if (editor && !editor.isDestroyed) {
			editor.on('selectionUpdate', updateHandler)
			editor.on('transaction', updateHandler)

			// Also update list item classes when content changes
			editor.on('update', updateListItemBoldClasses)

			// Initialize with default font family and size if editor is empty
			const initTimer = setTimeout(() => {
				if (editor && !editor.isDestroyed) {
					try {
						// Set stored marks for future typing
						const tr = editor.state.tr
						const textStyleMark = editor.schema.marks.textStyle.create({
							fontFamily: '"Times New Roman", Times, serif',
							fontSize: '11pt',
						})
						tr.addStoredMark(textStyleMark)
						editor.view.dispatch(tr)

						// Initial update of list item classes
						updateListItemBoldClasses()
					} catch (error) {
						console.warn('Error setting default font styles:', error)
					}
				}
			}, 100)

			// Cleanup timer on unmount
			return () => {
				clearTimeout(initTimer)
				if (editor && !editor.isDestroyed) {
					editor.off('selectionUpdate', updateHandler)
					editor.off('transaction', updateHandler)
					editor.off('update', updateListItemBoldClasses)
				}
			}
		}

		return () => {}
	}, [editor])

	const getDropdownPosition = (ref) => {
		if (!ref.current) return { top: 0, left: 0 }
		const rect = ref.current.getBoundingClientRect()
		return {
			top: rect.bottom + 4,
			left: rect.left,
			width: rect.width,
		}
	}

	const fontFamilies = [
		{ name: 'Times New Roman', value: '"Times New Roman", Times, serif' },
		{ name: 'Arial', value: 'Arial, sans-serif' },
		{ name: 'Sans Serif', value: 'sans-serif' },
		{ name: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
		{ name: 'Georgia', value: 'Georgia, serif' },
		{ name: 'Courier New', value: '"Courier New", Courier, monospace' },
	]

	const lineSpacingOptions = [
		{ name: 'Single', value: '1.0' },
		{ name: '1.15', value: '1.15' },
		{ name: '1.5', value: '1.5' },
		{ name: 'Double', value: '2.0' },
		{ name: '2.5', value: '2.5' },
		{ name: '3.0', value: '3.0' },
	]

	const textStyles = [
		{
			name: 'Normal Text',
			apply: () => {
				if (!editor || editor.isDestroyed) return false
				try {
					// Use setParagraph instead of toggleHeading for better compatibility
					return editor.chain().focus().setParagraph().run()
				} catch (error) {
					console.error('Error applying Normal Text:', error)
					return false
				}
			},
		},
		{
			name: 'Heading 1',
			apply: () => {
				if (!editor || editor.isDestroyed) return false
				try {
					return editor.chain().focus().setHeading({ level: 1 }).run()
				} catch (error) {
					console.error('Error applying Heading 1:', error)
					return false
				}
			},
		},
		{
			name: 'Heading 2',
			apply: () => {
				if (!editor || editor.isDestroyed) return false
				try {
					return editor.chain().focus().setHeading({ level: 2 }).run()
				} catch (error) {
					console.error('Error applying Heading 2:', error)
					return false
				}
			},
		},
		{
			name: 'Heading 3',
			apply: () => {
				if (!editor || editor.isDestroyed) return false
				try {
					return editor.chain().focus().setHeading({ level: 3 }).run()
				} catch (error) {
					console.error('Error applying Heading 3:', error)
					return false
				}
			},
		},
		{
			name: 'Heading 4',
			apply: () => {
				if (!editor || editor.isDestroyed) return false
				try {
					return editor.chain().focus().setHeading({ level: 4 }).run()
				} catch (error) {
					console.error('Error applying Heading 4:', error)
					return false
				}
			},
		},
	]

	// Apply style to current paragraph and set as default for future paragraphs
	const applyStyleToCurrentAndFutureParagraphs = (fontFamily, fontSize) => {
		if (!editor) return

		const { state } = editor
		const { selection } = state
		const { $from } = selection

		// Get the current paragraph boundaries
		let paragraphStart = $from.start($from.depth)
		let paragraphEnd = $from.end($from.depth)

		// Find the paragraph node boundaries more accurately
		for (let i = $from.depth; i >= 0; i--) {
			const node = $from.node(i)
			if (node.type.name === 'paragraph') {
				paragraphStart = $from.start(i)
				paragraphEnd = $from.end(i)
				break
			}
		}

		// Apply style to the entire current paragraph (even if empty)
		editor
			.chain()
			.focus()
			.setTextSelection({ from: paragraphStart, to: paragraphEnd })
			.setFontFamily(fontFamily)
			.setFontSize(`${fontSize}pt`)
			.run()

		// Set the cursor back to original position
		editor.chain().focus().setTextSelection(selection.from).run()

		// Set stored marks for future typing and new paragraphs
		const tr = editor.state.tr
		const textStyleMark = editor.schema.marks.textStyle.create({
			fontFamily: fontFamily,
			fontSize: `${fontSize}pt`,
		})
		tr.addStoredMark(textStyleMark)
		editor.view.dispatch(tr)
	}

	// Apply text style (normal or heading) to current paragraph
	const applyTextStyle = async (style, action) => {
		if (!editor || editor.isDestroyed) return

		// Find the style in our array
		const styleConfig = textStyles.find((s) => s.name === style)
		if (!styleConfig) return

		try {
			// Get current selection
			const { state } = editor
			const { selection } = state
			const { $from } = selection

			// Get the current paragraph boundaries
			let paragraphStart = $from.start($from.depth)
			let paragraphEnd = $from.end($from.depth)

			// Find paragraph boundaries more accurately
			for (let i = $from.depth; i >= 0; i--) {
				const node = $from.node(i)
				if (node && (node.type.name === 'paragraph' || node.type.name === 'heading')) {
					paragraphStart = $from.start(i)
					paragraphEnd = $from.end(i)
					break
				}
			}

			// Store original selection position
			const originalFrom = selection.from

			if (action === 'apply') {
				// Select the entire paragraph
				editor.chain().setTextSelection({ from: paragraphStart, to: paragraphEnd }).run()

				// Apply the style
				styleConfig.apply()

				// Apply stored style definition if available
				const styleDef = styleDefinitions[style]
				if (styleDef) {
					const chain = editor.chain()

					// Apply font family and size
					chain.setFontFamily(styleDef.fontFamily).setFontSize(styleDef.fontSize)

					// Apply text decorations
					if (styleDef.bold) chain.setBold()
					else chain.unsetBold()

					if (styleDef.italic) chain.setItalic()
					else chain.unsetItalic()

					if (styleDef.underline) chain.setUnderline()
					else chain.unsetUnderline()

					if (styleDef.strike) chain.setStrike()
					else chain.unsetStrike()
					chain.run()

					// Use safe focus setelah semua operasi selesai
					setTimeout(() => safeFocus(editor), 50)
				}
			} else if (action === 'update') {
				// Get current font attributes
				const currentFontFamily = getCurrentFontFamily()
				const currentFontSize = getCurrentFontSize()
				const fontFamilyValue =
					fontFamilies.find((f) => f.name === currentFontFamily)?.value ||
					'"Times New Roman", Times, serif'

				// Get current text decorations
				const isBold = editor.isActive('bold')
				const isItalic = editor.isActive('italic')
				const isUnderline = editor.isActive('underline')
				const isStrike = editor.isActive('strike')

				// Update the style definition for this style type with validation
				const newStyleDef = {
					fontFamily: fontFamilyValue || '"Times New Roman", Times, serif',
					fontSize: `${currentFontSize || 11}pt`,
					bold: !!isBold,
					italic: !!isItalic,
					underline: !!isUnderline,
					strike: !!isStrike,
				}

				// Update the stored style definition with validation
				setStyleDefinitions((prev) => {
					const updated = { ...prev }
					if (style && newStyleDef.fontFamily && newStyleDef.fontSize) {
						updated[style] = newStyleDef
					}
					return updated
				})

				console.log(`Updating all instances of "${style}" with:`, newStyleDef)

				// Show user feedback
				const originalText = `Update "${style}" to match`

				try {
					// Update all instances of this style type in the document
					await updateAllInstancesOfStyle(style, newStyleDef)
					console.log(`Successfully updated all "${style}" instances`)
				} catch (error) {
					console.error(`Failed to update all "${style}" instances:`, error)
				}
			}

			// Restore cursor position
			if (editor && !editor.isDestroyed) {
				editor.chain().focus().setTextSelection(originalFrom).run()
			}
		} catch (error) {
			console.error('Error in applyTextStyle:', error)
		} finally {
			// Close the dropdown
			setTextStyleOpen(false)
			setHoveredStyle(null)
		}
	}

	// Update all instances of a specific style type in the document (SAFER VERSION)
	const updateAllInstancesOfStyle = async (styleName, styleDef) => {
		if (!editor || editor.isDestroyed) return

		try {
			console.log(`Starting update of all ${styleName} instances...`)

			// Get the current document state
			const { doc } = editor.state

			// Determine node type and attributes to look for
			let targetNodeTypes = []

			if (styleName === 'Normal Text') {
				// Normal text includes paragraphs AND paragraphs inside list items
				targetNodeTypes = ['paragraph']
			} else if (styleName.startsWith('Heading ')) {
				targetNodeTypes = ['heading']
			} else {
				return // Unknown style
			}

			const positions = []

			// Collect positions more safely - avoid pagination extension conflicts
			doc.descendants((node, pos) => {
				// Check if this node is one of our target types
				const isTargetNode = targetNodeTypes.includes(node.type.name)

				if (isTargetNode) {
					// For headings, check the level
					if (node.type.name === 'heading' && styleName.startsWith('Heading ')) {
						const level = parseInt(styleName.split(' ')[1])
						if (node.attrs.level !== level) {
							return true // Continue if not the right heading level
						}
					}

					// Check if we're inside a table (which we want to skip)
					let isInsideTable = false

					try {
						// Use document resolution to check parent context
						const $pos = doc.resolve(pos)

						// Check all parent nodes up the tree
						for (let depth = 0; depth <= $pos.depth; depth++) {
							const parentNode = $pos.node(depth)
							if (
								parentNode &&
								(parentNode.type.name === 'table' ||
									parentNode.type.name === 'tableRow' ||
									parentNode.type.name === 'tableCell' ||
									parentNode.type.name === 'tableHeader')
							) {
								isInsideTable = true
								break
							}
						}
					} catch (e) {
						// If resolution fails, err on the side of caution
						console.warn('Could not resolve position for table check:', e)
					}

					// Skip table content to preserve table styling
					if (isInsideTable) {
						return true // Skip table content
					}

					// Check if this position is within the document bounds
					if (pos >= 0 && pos + node.nodeSize <= doc.content.size) {
						// Add debugging info for list detection
						let contextInfo = 'standalone'
						try {
							const $pos = doc.resolve(pos)
							for (let depth = 0; depth <= $pos.depth; depth++) {
								const parentNode = $pos.node(depth)
								if (
									parentNode &&
									(parentNode.type.name === 'listItem' ||
										parentNode.type.name === 'bulletList' ||
										parentNode.type.name === 'orderedList')
								) {
									contextInfo = 'inside-list'
									break
								}
							}
						} catch (e) {
							contextInfo = 'unknown-context'
						}

						console.log(`Adding ${node.type.name} at pos ${pos} (${contextInfo}) for ${styleName}`)

						// Only update text formatting, not structure for safety
						positions.push({
							from: pos + 1, // Start after opening tag
							to: pos + node.nodeSize - 1, // End before closing tag
							node,
							context: contextInfo,
						})
					}
				}
				return true // Continue traversal
			})

			console.log(
				`Found ${positions.length} instances of ${styleName} (including list content for Normal Text)`
			)

			if (positions.length === 0) {
				console.log('No instances found to update')
				return
			}

			// Process positions one by one with safer approach
			for (let i = 0; i < positions.length; i++) {
				const { from, to } = positions[i]

				if (editor.isDestroyed) {
					console.log('Editor destroyed, stopping update')
					break
				}

				try {
					// Verify position is still valid after previous operations
					const currentDoc = editor.state.doc
					if (from >= 0 && to <= currentDoc.content.size && from < to) {
						// Double-check we're not accidentally selecting table content
						const $from = currentDoc.resolve(from)
						const $to = currentDoc.resolve(to)
						let insideTable = false

						// Check if we're inside a table
						for (let depth = 0; depth <= $from.depth; depth++) {
							const node = $from.node(depth)
							if (
								node &&
								(node.type.name === 'table' ||
									node.type.name === 'tableRow' ||
									node.type.name === 'tableCell' ||
									node.type.name === 'tableHeader')
							) {
								insideTable = true
								break
							}
						}

						if (insideTable) {
							console.log(`Skipping position ${from}-${to} (inside table)`)
							continue
						}

						// Only apply text styles, avoid structural changes
						const chain = editor.chain().focus()

						// Select the content inside the node (not the node itself)
						chain.setTextSelection({ from, to })

						// Apply only text formatting (not node type changes)
						if (styleDef.fontFamily) {
							chain.setFontFamily(styleDef.fontFamily)
						}
						if (styleDef.fontSize) {
							chain.setFontSize(styleDef.fontSize)
						}

						// Apply text decorations
						if (styleDef.bold) chain.setBold()
						else chain.unsetBold()

						if (styleDef.italic) chain.setItalic()
						else chain.unsetItalic()

						if (styleDef.underline) chain.setUnderline()
						else chain.unsetUnderline()

						if (styleDef.strike) chain.setStrike()
						else chain.unsetStrike()

						// Execute the chain
						const success = chain.run()

						if (!success) {
							console.warn(`Failed to apply styles to position ${from}-${to}`)
						}

						// Add delay to prevent overwhelming the pagination extension
						await new Promise((resolve) => setTimeout(resolve, 30))
					}
				} catch (error) {
					console.warn(`Error updating style for position ${from}-${to}:`, error)
					// Continue with next position instead of breaking
				}
			}

			console.log(`Completed updating ${styleName} instances`)
		} catch (error) {
			console.error('Error in updateAllInstancesOfStyle:', error)
		}
	}

	const getCurrentFontFamily = () => {
		if (!editor || editor.isDestroyed) return 'Times New Roman'

		try {
			// First try to get from current selection
			let currentFontFamily = editor.getAttributes('textStyle').fontFamily

			// If not found in selection, try to get from stored marks
			if (!currentFontFamily && editor.state.storedMarks) {
				const textStyleMark = editor.state.storedMarks.find(
					(mark) => mark.type.name === 'textStyle'
				)
				if (textStyleMark && textStyleMark.attrs.fontFamily) {
					currentFontFamily = textStyleMark.attrs.fontFamily
				}
			}

			const family = fontFamilies.find((f) => f.value === currentFontFamily)
			return family ? family.name : 'Times New Roman'
		} catch (error) {
			console.warn('Error getting current font family:', error)
			return 'Times New Roman'
		}
	}

	const getCurrentFontSize = () => {
		if (!editor || editor.isDestroyed) return 11

		try {
			// First try to get from current selection
			let currentFontSize = editor.getAttributes('textStyle').fontSize

			// If not found in selection, try to get from stored marks
			if (!currentFontSize && editor.state.storedMarks) {
				const textStyleMark = editor.state.storedMarks.find(
					(mark) => mark.type.name === 'textStyle'
				)
				if (textStyleMark && textStyleMark.attrs.fontSize) {
					currentFontSize = textStyleMark.attrs.fontSize
				}
			}

			if (!currentFontSize) return 11

			// Handle both pt and px units, convert px to pt if necessary
			if (currentFontSize.includes('px')) {
				// Convert px to pt (1px ≈ 0.75pt, so 1pt ≈ 1.33px)
				const pxValue = parseInt(currentFontSize.replace('px', ''))
				return Math.round(pxValue * 0.75)
			} else if (currentFontSize.includes('pt')) {
				return parseInt(currentFontSize.replace('pt', ''))
			}

			// If no unit specified, assume it's pt
			return parseInt(currentFontSize) || 11
		} catch (error) {
			console.warn('Error getting current font size:', error)
			return 11
		}
	}

	const increaseFontSize = () => {
		if (!editor || editor.isDestroyed) return

		try {
			const currentSize = getCurrentFontSize()
			const newSize = Math.min(currentSize + 2, 72) // Max 72pt
			const { from, to, empty } = editor.state.selection

			// Only apply if text is selected
			if (!empty) {
				editor.chain().focus().setTextSelection({ from, to }).setFontSize(`${newSize}pt`).run()
			}

			// Always update stored marks for future typing
			const currentFontFamily = getCurrentFontFamily()
			const fontFamilyValue =
				fontFamilies.find((f) => f.name === currentFontFamily)?.value ||
				'"Times New Roman", Times, serif'
			const tr = editor.state.tr
			const textStyleMark = editor.schema.marks.textStyle.create({
				fontFamily: fontFamilyValue,
				fontSize: `${newSize}pt`,
			})
			tr.addStoredMark(textStyleMark)
			editor.view.dispatch(tr)
		} catch (error) {
			console.error('Error increasing font size:', error)
		}
	}

	const decreaseFontSize = () => {
		if (!editor || editor.isDestroyed) return

		try {
			const currentSize = getCurrentFontSize()
			const newSize = Math.max(currentSize - 2, 8) // Min 8pt
			const { from, to, empty } = editor.state.selection

			// Only apply if text is selected
			if (!empty) {
				editor.chain().focus().setTextSelection({ from, to }).setFontSize(`${newSize}pt`).run()
			}

			// Always update stored marks for future typing
			const currentFontFamily = getCurrentFontFamily()
			const fontFamilyValue =
				fontFamilies.find((f) => f.name === currentFontFamily)?.value ||
				'"Times New Roman", Times, serif'
			const tr = editor.state.tr
			const textStyleMark = editor.schema.marks.textStyle.create({
				fontFamily: fontFamilyValue,
				fontSize: `${newSize}pt`,
			})
			tr.addStoredMark(textStyleMark)
			editor.view.dispatch(tr)
		} catch (error) {
			console.error('Error decreasing font size:', error)
		}
	}

	const setFontFamily = (fontValue) => {
		if (!editor || editor.isDestroyed) return

		try {
			const { from, to, empty } = editor.state.selection

			// Only apply if text is selected
			if (!empty) {
				editor.chain().setTextSelection({ from, to }).setFontFamily(fontValue).run()
			}

			// Always update stored marks for future typing
			const currentFontSize = getCurrentFontSize()
			const tr = editor.state.tr
			const textStyleMark = editor.schema.marks.textStyle.create({
				fontFamily: fontValue,
				fontSize: `${currentFontSize}pt`,
			})
			tr.addStoredMark(textStyleMark)
			editor.view.dispatch(tr)

			// Use safe focus setelah operasi selesai
			setTimeout(() => safeFocus(editor), 50)
		} catch (error) {
			console.error('Error setting font family:', error)
		}
	}

	// Set stored marks for future typing without affecting existing text
	const setStoredMarksForTyping = () => {
		if (!editor || editor.isDestroyed) return

		try {
			const currentFontFamily = getCurrentFontFamily()
			const currentFontSize = getCurrentFontSize()
			const fontFamilyValue =
				fontFamilies.find((f) => f.name === currentFontFamily)?.value ||
				'"Times New Roman", Times, serif'

			// Only set stored marks for future typing
			const tr = editor.state.tr
			const textStyleMark = editor.schema.marks.textStyle.create({
				fontFamily: fontFamilyValue,
				fontSize: `${currentFontSize}pt`,
			})
			tr.addStoredMark(textStyleMark)
			editor.view.dispatch(tr)
		} catch (error) {
			console.warn('Error setting stored marks:', error)
		}
	}

	// Get font size for text style preview with fallback
	const getStyleFontSize = (styleName) => {
		try {
			const styleDef = styleDefinitions[styleName]
			if (styleDef && styleDef.fontSize) {
				return styleDef.fontSize
			}

			// Default values if not defined
			switch (styleName) {
				case 'Heading 1':
					return '24pt'
				case 'Heading 2':
					return '18pt'
				case 'Heading 3':
					return '14pt'
				case 'Heading 4':
					return '12pt'
				default:
					return '11pt'
			}
		} catch (error) {
			console.warn('Error getting style font size:', error)
			return '11pt'
		}
	}

	// Get font weight for text style preview with fallback
	const getStyleFontWeight = (styleName) => {
		try {
			const styleDef = styleDefinitions[styleName]
			if (styleDef && typeof styleDef.bold === 'boolean') {
				return styleDef.bold ? 'bold' : 'normal'
			}
			return styleName.includes('Heading') ? 'bold' : 'normal'
		} catch (error) {
			console.warn('Error getting style font weight:', error)
			return 'normal'
		}
	}

	// Get font family for text style preview with fallback
	const getStyleFontFamily = (styleName) => {
		try {
			const styleDef = styleDefinitions[styleName]
			return styleDef?.fontFamily || '"Times New Roman", Times, serif'
		} catch (error) {
			console.warn('Error getting style font family:', error)
			return '"Times New Roman", Times, serif'
		}
	}

	// Function to update list item classes based on bold content
	const updateListItemBoldClasses = () => {
		if (!editor || editor.isDestroyed) return

		try {
			// Get the editor DOM element
			const editorElement = editor.view.dom
			if (!editorElement) return

			// Find all list items in the editor
			const listItems = editorElement.querySelectorAll('li')

			listItems.forEach((li) => {
				// Check if the list item contains bold content
				const hasBoldContent =
					li.querySelector('strong') ||
					li.querySelector('b') ||
					li.querySelector('[style*="font-weight: bold"]') ||
					li.querySelector('[style*="font-weight:bold"]') ||
					// Check if the paragraph inside has bold styling
					li.querySelector('p[style*="font-weight: bold"]') ||
					li.querySelector('p[style*="font-weight:bold"]')

				// Add or remove the bold-content class based on content
				if (hasBoldContent) {
					li.classList.add('bold-content')
				} else {
					li.classList.remove('bold-content')
				}
			})
		} catch (error) {
			console.warn('Error updating list item bold classes:', error)
		}
	}

	// Get current line spacing
	const getCurrentLineSpacing = () => {
		if (!editor || editor.isDestroyed) return '1.0'

		try {
			const { state } = editor
			const { selection } = state
			const { $from } = selection

			// Get attributes from the current paragraph or heading
			const parentNode = $from.parent
			if (parentNode && parentNode.attrs && parentNode.attrs.lineSpacing) {
				return parentNode.attrs.lineSpacing
			}

			return '1.0' // Default line spacing
		} catch (error) {
			console.warn('Error getting current line spacing:', error)
			return '1.0'
		}
	}

	// Set line spacing for current paragraph or selection
	const setLineSpacing = (spacing) => {
		if (!editor || editor.isDestroyed) return

		try {
			editor.chain().setLineSpacing(spacing).run()
			setLineSpacingOpen(false)

			// Use safe focus setelah operasi
			setTimeout(() => safeFocus(editor), 50)
		} catch (error) {
			console.error('Error setting line spacing:', error)
		}
	}

	// Set text alignment
	const setTextAlignment = (alignment) => {
		if (!editor || editor.isDestroyed) return

		try {
			editor.chain().setTextAlign(alignment).run()

			// Use safe focus setelah operasi
			setTimeout(() => safeFocus(editor), 50)
		} catch (error) {
			console.error('Error setting text alignment:', error)
		}
	}

	return (
		<div className='bg-white border-t border-gray-200 px-11 py-1 sticky top-0 z-30 transition-all duration-300'>
			<div className='flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide min-h-[40px]'>
				{/* Text Style Dropdown */}
				<div className='relative' ref={textStyleRef}>
					<Button
						variant='ghost'
						size='sm'
						onClick={() => setTextStyleOpen(!textStyleOpen)}
						className='text-xs flex items-center gap-1 min-w-[100px] justify-between'
						disabled={!editor}
					>
						<span className='truncate'>{activeTextStyle}</span>
						<ChevronDown className='h-3 w-3' />
					</Button>
					{textStyleOpen &&
						mounted &&
						createPortal(
							<>
								<div
									className='fixed inset-0 z-[9998]'
									onClick={() => {
										setTextStyleOpen(false)
										setHoveredStyle(null)
									}}
								></div>
								<div
									className='fixed bg-white border border-gray-200 rounded-md shadow-xl z-[9999] min-w-[170px]'
									style={getDropdownPosition(textStyleRef)}
								>
									{textStyles.map((style) => (
										<div
											key={style.name}
											className='relative'
											onMouseEnter={() => setHoveredStyle(style.name)}
											onMouseLeave={() => setHoveredStyle(null)}
										>
											<button
												onClick={() => {
													if (!editor || editor.isDestroyed) return
													try {
														applyTextStyle(style.name, 'apply')
													} catch (error) {
														console.error('Error applying style:', error)
													}
												}}
												className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 flex items-center justify-between ${
													activeTextStyle === style.name ? 'bg-blue-50 text-blue-600' : ''
												}`}
												style={{
													fontSize: getStyleFontSize(style.name),
													fontWeight: getStyleFontWeight(style.name),
													fontFamily: getStyleFontFamily(style.name),
												}}
											>
												<span>{style.name}</span>
												<div className='flex items-center'>
													{activeTextStyle === style.name && <Check className='h-3 w-3 mr-1' />}
													{hoveredStyle === style.name && <ChevronRight className='h-3 w-3' />}
												</div>
											</button>

											{/* Submenu for apply/update */}
											{hoveredStyle === style.name && (
												<div className='absolute left-full top-0 bg-white border border-gray-200 rounded-md shadow-md min-w-[200px] z-[10000]'>
													<button
														onClick={() => {
															if (!editor || editor.isDestroyed) return
															try {
																applyTextStyle(style.name, 'apply')
															} catch (error) {
																console.error('Error applying style:', error)
															}
														}}
														className='w-full text-left px-3 py-2 text-xs hover:bg-gray-100 border-b border-gray-100'
													>
														<div className='font-medium'>Apply &quot;{style.name}&quot;</div>
														<div className='text-gray-500 text-[10px]'>
															Change current paragraph to this style
														</div>
													</button>
													<button
														onClick={() => {
															if (!editor || editor.isDestroyed) return
															try {
																applyTextStyle(style.name, 'update')
															} catch (error) {
																console.error('Error updating style:', error)
															}
														}}
														className='w-full text-left px-3 py-2 text-xs hover:bg-gray-100'
													>
														<div className='font-medium'>
															Update &quot;{style.name}&quot; to match
														</div>
														<div className='text-gray-500 text-[10px]'>
															Update all instances in document
														</div>
													</button>
												</div>
											)}
										</div>
									))}
								</div>
							</>,
							document.body
						)}
				</div>

				{/* Font Family Dropdown */}
				<div className='relative' ref={fontFamilyRef}>
					<Button
						variant='ghost'
						size='sm'
						onClick={() => setFontFamilyOpen(!fontFamilyOpen)}
						className='text-xs flex items-center gap-1 min-w-[100px] justify-between'
						disabled={!editor}
					>
						<span className='truncate'>{getCurrentFontFamily()}</span>
						<ChevronDown className='h-3 w-3' />
					</Button>
					{fontFamilyOpen &&
						mounted &&
						createPortal(
							<>
								<div
									className='fixed inset-0 z-[9998]'
									onClick={() => setFontFamilyOpen(false)}
								></div>
								<div
									className='fixed bg-white border border-gray-200 rounded-md shadow-xl z-[9999] min-w-[140px]'
									style={getDropdownPosition(fontFamilyRef)}
								>
									{fontFamilies.map((font) => (
										<button
											key={font.value}
											onClick={() => {
												if (!editor || editor.isDestroyed) return
												try {
													setFontFamily(font.value)
													setFontFamilyOpen(false)
												} catch (error) {
													console.error('Error setting font family:', error)
												}
											}}
											className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 first:rounded-t-md last:rounded-b-md ${
												editor?.isActive('textStyle', { fontFamily: font.value })
													? 'bg-blue-50 text-blue-600'
													: ''
											}`}
											style={{ fontFamily: font.value }}
										>
											{font.name}
										</button>
									))}
								</div>
							</>,
							document.body
						)}
				</div>

				{/* Font Size Controls */}
				<div className='flex items-center border border-gray-200 rounded-md'>
					<Button
						variant='ghost'
						size='icon'
						onClick={decreaseFontSize}
						className='h-7 w-7 rounded-r-none border-r border-gray-200'
						disabled={!editor || getCurrentFontSize() <= 8}
						title='Decrease font size'
					>
						<Minus className='h-3 w-3' />
					</Button>
					<div className='px-2 text-xs min-w-[30px] text-center'>{getCurrentFontSize()}pt</div>
					<Button
						variant='ghost'
						size='icon'
						onClick={increaseFontSize}
						className='h-7 w-7 rounded-l-none border-l border-gray-200'
						disabled={!editor || getCurrentFontSize() >= 72}
						title='Increase font size'
					>
						<Plus className='h-3 w-3' />
					</Button>
				</div>

				{/* Line Spacing Dropdown */}
				<div className='relative' ref={lineSpacingRef}>
					<Button
						variant='ghost'
						size='sm'
						onClick={() => setLineSpacingOpen(!lineSpacingOpen)}
						className='text-xs flex items-center gap-1 min-w-[60px] justify-between'
						disabled={!editor}
						title='Line Spacing'
					>
						<FileText className='h-3 w-3' />
						<span className='truncate'>{getCurrentLineSpacing()}</span>
						<ChevronDown className='h-3 w-3' />
					</Button>
					{lineSpacingOpen &&
						mounted &&
						createPortal(
							<>
								<div
									className='fixed inset-0 z-[9998]'
									onClick={() => setLineSpacingOpen(false)}
								></div>
								<div
									className='fixed bg-white border border-gray-200 rounded-md shadow-xl z-[9999] min-w-[100px]'
									style={getDropdownPosition(lineSpacingRef)}
								>
									{lineSpacingOptions.map((option) => (
										<button
											key={option.value}
											onClick={() => setLineSpacing(option.value)}
											className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 first:rounded-t-md last:rounded-b-md ${
												getCurrentLineSpacing() === option.value ? 'bg-blue-50 text-blue-600' : ''
											}`}
										>
											{option.name}
										</button>
									))}
								</div>
							</>,
							document.body
						)}
				</div>

				{/* Text Alignment Buttons */}
				<div className='flex items-center border border-gray-200 rounded-md'>
					<Button
						variant='ghost'
						size='icon'
						onClick={() => setTextAlignment('left')}
						className={`h-7 w-7 rounded-r-none border-r border-gray-200 ${
							editor?.isActive({ textAlign: 'left' }) ||
							(
								!editor?.isActive({ textAlign: 'center' }) &&
									!editor?.isActive({ textAlign: 'right' }) &&
									!editor?.isActive({ textAlign: 'justify' })
							)
								? 'bg-gray-200'
								: ''
						}`}
						disabled={!editor}
						title='Align Left'
					>
						<AlignLeft className='h-3 w-3' />
					</Button>
					<Button
						variant='ghost'
						size='icon'
						onClick={() => setTextAlignment('center')}
						className={`h-7 w-7 rounded-none border-r border-gray-200 ${
							editor?.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''
						}`}
						disabled={!editor}
						title='Align Center'
					>
						<AlignCenter className='h-3 w-3' />
					</Button>
					<Button
						variant='ghost'
						size='icon'
						onClick={() => setTextAlignment('right')}
						className={`h-7 w-7 rounded-none border-r border-gray-200 ${
							editor?.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''
						}`}
						disabled={!editor}
						title='Align Right'
					>
						<AlignRight className='h-3 w-3' />
					</Button>
					<Button
						variant='ghost'
						size='icon'
						onClick={() => setTextAlignment('justify')}
						className={`h-7 w-7 rounded-l-none ${
							editor?.isActive({ textAlign: 'justify' }) ? 'bg-gray-200' : ''
						}`}
						disabled={!editor}
						title='Justify'
					>
						<AlignJustify className='h-3 w-3' />
					</Button>
				</div>

				<span className='w-px h-6 bg-gray-300 mx-1'></span>
				<Button
					variant='ghost'
					size='icon'
					onClick={() => editor?.chain().focus().toggleBold().run()}
					className={`${editor?.isActive('bold') ? 'bg-gray-200' : ''}`}
					disabled={!editor}
				>
					<BoldIcon className='h-4 w-4' />
				</Button>
				<Button
					variant='ghost'
					size='icon'
					onClick={() => editor?.chain().focus().toggleItalic().run()}
					className={`${editor?.isActive('italic') ? 'bg-gray-200' : ''}`}
					disabled={!editor}
				>
					<ItalicIcon className='h-4 w-4' />
				</Button>
				<Button
					variant='ghost'
					size='icon'
					onClick={() => editor?.chain().focus().toggleUnderline().run()}
					className={`${editor?.isActive('underline') ? 'bg-gray-200' : ''}`}
					disabled={!editor}
				>
					<UnderlineIcon className='h-4 w-4' />
				</Button>
				<Button
					variant='ghost'
					size='icon'
					onClick={() => editor?.chain().focus().toggleStrike().run()}
					className={`${editor?.isActive('strike') ? 'bg-gray-200' : ''}`}
					disabled={!editor}
				>
					<Strikethrough className='h-4 w-4' />
				</Button>
				<span className='w-px h-6 bg-gray-300 mx-1'></span>
				<Button
					variant='ghost'
					size='icon'
					onClick={() => editor?.chain().focus().toggleBulletList().run()}
					className={`${editor?.isActive('bulletList') ? 'bg-gray-200' : ''}`}
					disabled={!editor}
				>
					<List className='h-4 w-4' />
				</Button>
				<Button
					variant='ghost'
					size='icon'
					onClick={() => editor?.chain().focus().toggleOrderedList().run()}
					className={`${editor?.isActive('orderedList') ? 'bg-gray-200' : ''}`}
					disabled={!editor}
				>
					<ListOrdered className='h-4 w-4' />
				</Button>
				<Button
					variant='ghost'
					size='icon'
					onClick={() => editor?.chain().focus().toggleBlockquote().run()}
					className={`${editor?.isActive('blockquote') ? 'bg-gray-200' : ''}`}
					disabled={!editor}
				>
					<Quote className='h-4 w-4' />
				</Button>
				<Button
					variant='ghost'
					size='icon'
					onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
					className={`${editor?.isActive('codeBlock') ? 'bg-gray-200' : ''}`}
					disabled={!editor}
				>
					<CodeIcon className='h-4 w-4' />
				</Button>
				<span className='w-px h-6 bg-gray-300 mx-1'></span>
				<Button
					variant='ghost'
					size='icon'
					onClick={() => {
						if (undo) {
							// Use collaboration-aware undo if available (sudah ada safeFocus di dalamnya)
							undo()
						} else {
							// Fallback to editor undo dengan safe focus
							editor?.chain().undo().run()
							setTimeout(() => safeFocus(editor), 50)
						}
					}}
					disabled={canUndo ? !canUndo() : !editor?.can().undo()}
				>
					<Undo className='h-4 w-4' />
				</Button>
				<Button
					variant='ghost'
					size='icon'
					onClick={() => {
						if (redo) {
							// Use collaboration-aware redo if available (sudah ada safeFocus di dalamnya)
							redo()
						} else {
							// Fallback to editor redo dengan safe focus
							editor?.chain().redo().run()
							setTimeout(() => safeFocus(editor), 50)
						}
					}}
					disabled={canRedo ? !canRedo() : !editor?.can().redo()}
				>
					<Redo className='h-4 w-4' />
				</Button>

				<span className='w-px h-6 bg-gray-300 mx-1'></span>
				<Button
					variant='ghost'
					size='sm'
					onClick={() => insertTable(3, 3, true)}
					className='text-xs flex items-center gap-1'
					title='Insert Table (3x3)'
					disabled={!editor}
				>
					<svg
						className='h-4 w-4'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='2'
					>
						<rect x='3' y='3' width='18' height='18' rx='2' ry='2'></rect>
						<line x1='3' y1='9' x2='21' y2='9'></line>
						<line x1='3' y1='15' x2='21' y2='15'></line>
						<line x1='9' y1='3' x2='9' y2='21'></line>
						<line x1='15' y1='3' x2='15' y2='21'></line>
					</svg>
					Table
				</Button>

				<span className='w-px h-6 bg-gray-300 mx-1'></span>
				<Button
					variant='ghost'
					size='sm'
					onClick={() => {
						if (!editor) return
						try {
							const input = document.createElement('input')
							input.type = 'file'
							input.accept = '.docx'
							input.onchange = async (e) => {
								const file = e.target.files?.[0]
								if (!file) return
								try {
									await editor.chain().focus().importDocx({ file }).run()
								} catch (error) {
									console.error('Import DOCX failed:', error)
									alert('Failed to import document. Please check your Tiptap Cloud credentials.')
								}
							}
							input.click()
						} catch (error) {
							console.error('Import DOCX failed:', error)
							alert('Failed to import document. Please try again.')
						}
					}}
					className='text-xs flex items-center gap-1'
					title='Import from DOCX'
					disabled={!editor}
				>
					<Upload className='h-4 w-4' />
					Import DOCX
				</Button>
				<Button
					variant='ghost'
					size='sm'
					onClick={async () => {
						if (!editor) return
						try {
							// Call exportDocx with onCompleteExport callback to handle the blob
							await editor
								.chain()
								.exportDocx({
									onCompleteExport: (blob) => {
										// Create download link
										const url = URL.createObjectURL(blob)
										const link = document.createElement('a')
										link.href = url
										link.download = `document-${new Date().toISOString().split('T')[0]}.docx`
										document.body.appendChild(link)
										link.click()
										document.body.removeChild(link)
										URL.revokeObjectURL(url)
									},
								})
								.run()
						} catch (error) {
							console.error('Export DOCX failed:', error)
							alert('Failed to export document. Please try again.')
						}
					}}
					className='text-xs flex items-center gap-1'
					title='Export to DOCX'
					disabled={!editor}
				>
					<FileDown className='h-4 w-4' />
					Export DOCX
				</Button>
			</div>
		</div>
	)
}

export default EditorToolbar
