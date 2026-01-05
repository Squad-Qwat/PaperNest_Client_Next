import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Heading from '@tiptap/extension-heading'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Strike from '@tiptap/extension-strike'
import Underline from '@tiptap/extension-underline'
import Code from '@tiptap/extension-code'
import CodeBlock from '@tiptap/extension-code-block'
import HardBreak from '@tiptap/extension-hard-break'
import Blockquote from '@tiptap/extension-blockquote'
import { BulletList, OrderedList, ListItem } from '@tiptap/extension-list'
import { TextStyle, FontSize } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import FontFamily from '@tiptap/extension-font-family'
import TextAlign from '@tiptap/extension-text-align'
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Pages } from '@tiptap-pro/extension-pages'
import { ExportDocx } from '@tiptap-pro/extension-export-docx'
import { ImportDocx } from '@tiptap-pro/extension-import-docx'
import { Placeholder, Gapcursor, TrailingNode } from '@tiptap/extensions'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import FileHandler from '@tiptap/extension-file-handler'

// Helper function to compress and resize images
const compressImage = (file, maxWidth = 1200, quality = 0.8) => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.readAsDataURL(file)
		reader.onload = (event) => {
			const img = new Image()
			img.src = event.target.result
			img.onload = () => {
				const canvas = document.createElement('canvas')
				let width = img.width
				let height = img.height

				// Resize if width is larger than maxWidth
				if (width > maxWidth) {
					height = (height * maxWidth) / width
					width = maxWidth
				}

				canvas.width = width
				canvas.height = height

				const ctx = canvas.getContext('2d')
				ctx.drawImage(img, 0, 0, width, height)

				// Convert to blob with compression
				canvas.toBlob(
					(blob) => {
						const compressedReader = new FileReader()
						compressedReader.readAsDataURL(blob)
						compressedReader.onload = () => {
							resolve(compressedReader.result)
						}
						compressedReader.onerror = reject
					},
					file.type,
					quality
				)
			}
			img.onerror = reject
		}
		reader.onerror = reject
	})
}

const FontStylePersistence = Extension.create({
	name: 'fontStylePersistence',

	addKeyboardShortcuts() {
		return {
			Enter: ({ editor }) => {
				// Get current stored marks for font style
				let currentFontFamily = '"Times New Roman", Times, serif'
				let currentFontSize = '11pt'

				// Try to get from stored marks
				if (editor.state.storedMarks) {
					const textStyleMark = editor.state.storedMarks.find(
						(mark) => mark.type.name === 'textStyle'
					)
					if (textStyleMark) {
						if (textStyleMark.attrs.fontFamily) {
							currentFontFamily = textStyleMark.attrs.fontFamily
						}
						if (textStyleMark.attrs.fontSize) {
							currentFontSize = textStyleMark.attrs.fontSize
						}
					}
				}

				// Use default splitBlock behavior which properly handles paragraph creation
				const result = editor.commands.splitBlock()

				// Then preserve the stored marks for the new paragraph
				if (result) {
					setTimeout(() => {
						try {
							const tr = editor.state.tr
							const textStyleMark = editor.schema.marks.textStyle.create({
								fontFamily: currentFontFamily,
								fontSize: currentFontSize,
							})
							tr.addStoredMark(textStyleMark)
							editor.view.dispatch(tr)
						} catch (error) {
							console.warn('Error setting stored marks:', error)
						}
					}, 10)
				}

				return result
			},
		}
	},
})

// Custom extension for line spacing
const LineSpacing = Extension.create({
	name: 'lineSpacing',

	addOptions() {
		return {
			types: ['paragraph', 'heading'],
			defaultValue: '1.0',
		}
	},

	addGlobalAttributes() {
		return [
			{
				types: this.options.types,
				attributes: {
					lineSpacing: {
						default: this.options.defaultValue,
						parseHTML: (element) => element.style.lineHeight || this.options.defaultValue,
						renderHTML: (attributes) => {
							if (!attributes.lineSpacing) {
								return {}
							}
							return {
								style: `line-height: ${attributes.lineSpacing}`,
							}
						},
					},
				},
			},
		]
	},

	addCommands() {
		return {
			setLineSpacing:
				(lineSpacing) =>
				({ commands }) => {
					return this.options.types.every((type) =>
						commands.updateAttributes(type, { lineSpacing })
					)
				},
			unsetLineSpacing:
				() =>
				({ commands }) => {
					return this.options.types.every((type) => commands.resetAttributes(type, 'lineSpacing'))
				},
		}
	},
})

// Custom extension to handle heading backspace issues with pagination
const HeadingBackspaceHandler = Extension.create({
	name: 'headingBackspaceHandler',

	addKeyboardShortcuts() {
		return {
			Backspace: ({ editor }) => {
				const { state } = editor
				const { selection } = state
				const { $from } = selection

				// Check if we're at the start of a heading
				if (selection.empty && $from.parentOffset === 0) {
					const parentNode = $from.parent

					// If it's a heading node and it's empty or has minimal content
					if (
						parentNode.type.name === 'heading' &&
						(parentNode.textContent.length === 0 ||
							(parentNode.textContent.length <= 1 && $from.parentOffset === 0))
					) {
						try {
							// Safely convert heading to paragraph instead of letting default behavior
							// This prevents pagination extension from getting confused
							return editor.chain().setNode('paragraph').run()
						} catch (error) {
							console.warn('Error converting heading to paragraph:', error)
							// If conversion fails, just return false to allow default behavior
							return false
						}
					}
				}

				// For all other cases, return false to allow default backspace behavior
				return false
			},
		}
	},
})

// Custom extension untuk auto focus di editor
const SmartFocus = Extension.create({
	name: 'smartFocus',

	addOptions() {
		return {
			autoFocus: true,
			delay: 100,
		}
	},

	onCreate() {
		if (!this.options.autoFocus) return

		// Set focus setelah editor selesai render
		setTimeout(() => {
			try {
				const { editor } = this
				if (!editor || !editor.view) return

				// Simple focus to start of document
				editor.commands.focus('start')
			} catch (error) {
				console.warn('Smart focus failed:', error)
			}
		}, this.options.delay)
	},

	addCommands() {
		return {
			smartFocus:
				() =>
				({ editor, commands }) => {
					try {
						return commands.focus('start')
					} catch (error) {
						console.warn('Smart focus command failed:', error)
						return false
					}
				},
		}
	},
})

// Custom extension untuk handle undo/redo keyboard shortcuts with collaboration
const CollaborationUndoRedo = Extension.create({
	name: 'collaborationUndoRedo',

	addOptions() {
		return {
			undoHandler: null,
			redoHandler: null,
			userOrigin: null,
		}
	},

	addCommands() {
		return {
			safeFocusAfterUndo:
				() =>
				({ commands }) => {
					// Helper command untuk safe focus setelah undo/redo
					try {
						if (commands.smartFocus) {
							return commands.smartFocus()
						}
						return commands.focus('start')
					} catch (error) {
						console.warn('Safe focus after undo failed:', error)
						return false
					}
				},
		}
	},

	addKeyboardShortcuts() {
		return {
			'Mod-z': () => {
				// Try collaboration undo first, fallback to default
				if (this.options.undoHandler) {
					try {
						const result = this.options.undoHandler()
						// Apply safe focus setelah undo
						if (result) {
							setTimeout(() => {
								try {
									if (this.editor && this.editor.commands && this.editor.commands.smartFocus) {
										this.editor.commands.smartFocus()
									} else if (this.editor && this.editor.commands) {
										this.editor.commands.focus('start')
									}
								} catch (focusError) {
									console.warn('Focus after undo failed:', focusError)
								}
							}, 50)
						}
						return result
					} catch (error) {
						console.error('Undo handler error:', error)
						return false
					}
				}
				return false // Let default history handle it
			},
			'Mod-y': () => {
				// Try collaboration redo first, fallback to default
				if (this.options.redoHandler) {
					try {
						const result = this.options.redoHandler()
						// Apply safe focus setelah redo
						if (result) {
							setTimeout(() => {
								try {
									if (this.editor && this.editor.commands && this.editor.commands.smartFocus) {
										this.editor.commands.smartFocus()
									} else if (this.editor && this.editor.commands) {
										this.editor.commands.focus('start')
									}
								} catch (focusError) {
									console.warn('Focus after redo failed:', focusError)
								}
							}, 50)
						}
						return result
					} catch (error) {
						console.error('Redo handler error:', error)
						return false
					}
				}
				return false // Let default history handle it
			},
			'Mod-Shift-z': () => {
				// Try collaboration redo first, fallback to default
				if (this.options.redoHandler) {
					try {
						const result = this.options.redoHandler()
						// Apply safe focus setelah redo
						if (result) {
							setTimeout(() => {
								try {
									if (this.editor && this.editor.commands && this.editor.commands.smartFocus) {
										this.editor.commands.smartFocus()
									} else if (this.editor && this.editor.commands) {
										this.editor.commands.focus('start')
									}
								} catch (focusError) {
									console.warn('Focus after redo failed:', focusError)
								}
							}, 50)
						}
						return result
					} catch (error) {
						console.error('Redo handler error:', error)
						return false
					}
				}
				return false // Let default history handle it
			},
		}
	},
})

// Custom extension untuk menambah origin pada setiap transaction
const UserOriginExtension = Extension.create({
	name: 'userOrigin',

	addOptions() {
		return {
			userOrigin: 'anonymous-user',
		}
	},

	addProseMirrorPlugins() {
		const userOrigin = this.options.userOrigin

		return [
			new Plugin({
				key: new PluginKey('userOrigin'),

				// Filter transactions to add origin before they're applied
				filterTransaction: (transaction, state) => {
					// Only add origin to user-generated transactions that change the document
					// Don't interfere with YJS or other system transactions
					if (
						transaction.docChanged &&
						!transaction.getMeta('origin') &&
						!transaction.getMeta('y-sync$') && // Don't touch YJS sync transactions
						transaction.getMeta('addToHistory') !== false // Only touch history transactions
					) {
						try {
							transaction.setMeta('origin', userOrigin)
						} catch (error) {
							// Silently fail if we can't set meta - transaction might be frozen
							console.debug('Could not set origin meta:', error)
						}
					}
					return true // Always allow the transaction
				},
			}),
		]
	},
})

const createEditorExtensions = (paperSize, undoRedoOptions = {}) => [
	// Core document structure - must come first
	Document,
	Paragraph,
	Text,

	// Custom extensions for better UX
	FontStylePersistence,
	LineSpacing,
	HeadingBackspaceHandler,
	SmartFocus.configure({
		autoFocus: true,
		delay: 150,
	}),

	// Collaboration-aware undo/redo
	CollaborationUndoRedo.configure({
		undoHandler: undoRedoOptions.undoHandler,
		redoHandler: undoRedoOptions.redoHandler,
		userOrigin: undoRedoOptions.userOrigin,
	}),

	// User origin tracking untuk setiap transaction
	UserOriginExtension.configure({
		userOrigin: undoRedoOptions.userOrigin || 'anonymous-user',
	}),

	// TipTap Pro Pages extension
	Pages.configure({
		pageFormat: paperSize || 'A4',
		headerHeight: 60,
		footerHeight: 50,
	pageGap: 40,
	header: '',
	footer: (page, total) => `Page ${page} of ${total}`,
	pageBreakBackground: '#f5f5f5',
}),

// Export DOCX extension (no auth required)
ExportDocx.configure({
	exportType: 'blob',
	onCompleteExport: (result) => {
		// This callback will be overridden by the exportDocx command call
		// We provide a default no-op function to satisfy the extension requirement
		console.log('DOCX export completed', result)
	},
}),

// Import DOCX extension (requires Tiptap Cloud subscription)
ImportDocx.configure({
	appId: process.env.NEXT_PUBLIC_TIPTAP_APP_ID,
	token: process.env.NEXT_PUBLIC_TIPTAP_JWT_TOKEN,
}),

	// Text formatting
	TextStyle.configure({
		HTMLAttributes: {
			style: 'font-family: "Times New Roman", Times, serif; font-size: 11pt;',
		},
	}),
	FontFamily.configure({
		types: ['textStyle'],
		defaultValue: '"Times New Roman", Times, serif',
	}),
	FontSize.configure({
		types: ['textStyle'],
		defaultValue: '11pt',
	}),
	Color.configure({
		types: ['textStyle'],
	}),
	Highlight.configure({
		multicolor: true,
	}),
	Heading.configure({
		levels: [1, 2, 3, 4],
	}),
	Bold,
	Italic,
	Strike,
	Underline,
	Code,
	CodeBlock,
	Blockquote,

	// Link with auto-link detection
	Link.configure({
		openOnClick: false,
		autolink: true,
		defaultProtocol: 'https',
		HTMLAttributes: {
			class: 'text-blue-600 underline cursor-pointer hover:text-blue-800',
		},
	}),

	// Image support
	Image.configure({
		inline: true,
		allowBase64: true,
		HTMLAttributes: {
			class: 'max-w-full h-auto rounded',
		},
	}),

	// Horizontal rule for visual separation
	HorizontalRule,

	// Text alignment
	TextAlign.configure({
		types: ['heading', 'paragraph'],
		alignments: ['left', 'center', 'right', 'justify'],
		defaultAlignment: 'left',
	}),

	// Lists - configure with proper options
	BulletList.configure({
		itemTypeName: 'listItem',
		HTMLAttributes: {
			class: 'bullet-list',
		},
	}),
	OrderedList.configure({
		itemTypeName: 'listItem',
		HTMLAttributes: {
			class: 'ordered-list',
		},
	}),
	ListItem.configure({
		HTMLAttributes: {
			class: 'list-item',
		},
	}),

	// Table extensions - must be in this order
	Table.configure({
		resizable: true,
	}),
	TableRow,
	TableHeader,
	TableCell,

	// Other utilities
	HardBreak,
	Gapcursor,
	TrailingNode.configure({
		node: 'paragraph',
		notAfter: ['paragraph'],
	}),
	Placeholder.configure({
		placeholder: 'Start typing or use the AI assistant to generate content...',
		emptyEditorClass: 'is-editor-empty',
		emptyNodeClass: 'is-node-empty',
	}),

	// File handler for drag & drop
	FileHandler.configure({
		allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
		onDrop: async (currentEditor, files, pos) => {
			for (const file of files) {
				try {
					// Check file size (max 5MB before compression)
					if (file.size > 5 * 1024 * 1024) {
						console.warn('Image file too large (>5MB):', file.name)
						// You can show a toast notification here
						continue
					}

					// Compress image before inserting
					const compressedDataUrl = await compressImage(file, 1200, 0.8)

					// Check compressed size (base64 adds ~33% overhead)
					// Liveblocks has ~100KB limit for websocket messages
					const estimatedSize = (compressedDataUrl.length * 3) / 4 / 1024 // KB
					if (estimatedSize > 80) {
						console.warn(
							`Compressed image still too large (~${estimatedSize.toFixed(0)}KB). Consider uploading to server.`
						)
						// You can show a toast notification here
						// For now, we'll still try to insert it
					}

					currentEditor
						.chain()
						.insertContentAt(pos, {
							type: 'image',
							attrs: {
								src: compressedDataUrl,
							},
						})
						.focus()
						.run()
				} catch (error) {
					console.error('Error processing image:', error)
				}
			}
		},
		onPaste: async (currentEditor, files, htmlContent) => {
			if (htmlContent) {
				// if there is htmlContent, stop manual insertion & let other extensions handle insertion via inputRule
				// you could extract the pasted file from this url string and upload it to a server for example
				return false
			}

			for (const file of files) {
				try {
					// Check file size
					if (file.size > 5 * 1024 * 1024) {
						console.warn('Image file too large (>5MB):', file.name)
						continue
					}

					// Compress image before inserting
					const compressedDataUrl = await compressImage(file, 1200, 0.8)

					// Check compressed size
					const estimatedSize = (compressedDataUrl.length * 3) / 4 / 1024 // KB
					if (estimatedSize > 80) {
						console.warn(
							`Compressed image still too large (~${estimatedSize.toFixed(0)}KB). Consider uploading to server.`
						)
					}

					currentEditor
						.chain()
						.insertContentAt(currentEditor.state.selection.anchor, {
							type: 'image',
							attrs: {
								src: compressedDataUrl,
							},
						})
						.focus()
						.run()
				} catch (error) {
					console.error('Error processing image:', error)
				}
			}
		},
	}),
]

export {
	createEditorExtensions,
	HeadingBackspaceHandler,
	FontStylePersistence,
	LineSpacing,
	CollaborationUndoRedo,
	UserOriginExtension,
	SmartFocus,
}
