'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useEditor } from '@tiptap/react'
import { createEditorExtensions } from '@/lib/editor/extensions'
import { DocumentService } from '@/lib/firebase/document-service'
import YjsStateManager from '@/lib/editor/yjs-state-manager'
import { useYjsCollaboration } from './use-yjs-collaboration'

// Helper function untuk safe focus (moved outside to be stable)
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
		return false
	}
}

/**
 * Custom hook untuk mengelola Tiptap editor dengan konfigurasi modular
 * @param {Object} options - Konfigurasi editor
 * @param {string} options.paperSize - Ukuran kertas (A4, Letter, dll)
 * @param {string} options.defaultFontFamily - Font family default
 * @param {string} options.defaultFontSize - Font size default
 * @param {Object} options.document - Document object dari Firestore
 * @param {string} options.title - Judul dokumen
 * @param {Object} options.user - User object
 * @param {Function} options.setEditorError - Function untuk set error
 * @param {boolean} options.enableLiveblocks - Enable Liveblocks collaboration
 * @param {boolean} options.enableAutoSave - Enable auto-save functionality
 * @param {string} options.initialContent - Initial content untuk editor
 * @param {Function} options.onUpdate - Callback ketika content berubah
 * @param {Function} options.onCreate - Callback ketika editor dibuat
 * @param {Function} options.onDestroy - Callback ketika editor dihancurkan
 */
export function useDocumentEditor({
	paperSize = 'A4',
	defaultFontFamily = '"Times New Roman", Times, serif',
	defaultFontSize = '11pt',
	document = null,
	title = '',
	user = null,
	setEditorError = () => {},
	enableLiveblocks = false,
	enableAutoSave = true,
	initialContent = null,
	onUpdate = () => {},
	onCreate = () => {},
	onDestroy = () => {},
} = {}) {
	const [savedContent, setSavedContent] = useState(null)

	// Hook untuk Yjs collaboration
	const {
		yProvider,
		yDoc,
		collaborationExtensions,
		undoManager,
		isReady: collaborationReady,
		getAwarenessStates,
		setLocalAwarenessState,
		setAwarenessField,
		isConnected,
		awareness,
		// Undo/Redo functions
		undo: yjsUndo,
		redo: yjsRedo,
		canUndo: yjsCanUndo,
		canRedo: yjsCanRedo,
		stopCapturing,
		clearUndoStack,
	} = useYjsCollaboration({
		enabled: enableLiveblocks,
		user,
		onSync: (isSynced) => {
			console.log('Collaboration sync status:', isSynced)
		},
	})

	// Function untuk set default font styles
	const setDefaultEditorStyles = useCallback(
		(editor) => {
			if (!editor || !editor.state || !editor.view || !editor.schema) return

			try {
				if (editor.isEmpty) {
					const tr = editor.state.tr
					const textStyleMark = editor.schema.marks.textStyle.create({
						fontFamily: defaultFontFamily,
						fontSize: defaultFontSize,
					})
					tr.addStoredMark(textStyleMark)
					editor.view.dispatch(tr)
					console.log('Default font styles set:', {
						fontFamily: defaultFontFamily,
						fontSize: defaultFontSize,
					})
				}
			} catch (error) {
				console.warn('Error setting default font styles:', error)
			}
		},
		[defaultFontFamily, defaultFontSize]
	)

	// Create editor extensions dengan atau tanpa Yjs collaboration
	const editorExtensions = useMemo(() => {
		// Buat unique origin untuk setiap user
		const currentUserId = user?.id || user?.uid || 'anonymous'
		const userOrigin = `user-${currentUserId}`

		const undoRedoOptions = {
			undoHandler: enableLiveblocks && undoManager ? yjsUndo : null,
			redoHandler: enableLiveblocks && undoManager ? yjsRedo : null,
			userOrigin: userOrigin, // Pass user origin untuk keyboard shortcuts
		}

		const extensions = createEditorExtensions(paperSize, undoRedoOptions)

		// Jika collaboration diaktifkan dan ready, tambahkan Yjs extensions
		if (enableLiveblocks && collaborationReady && collaborationExtensions.length > 0) {
			extensions.push(...collaborationExtensions)
			console.log('Added collaboration extensions to editor')
		}

		return extensions
	}, [
		paperSize,
		enableLiveblocks,
		collaborationReady,
		collaborationExtensions,
		undoManager,
		yjsUndo,
		yjsRedo,
		user?.id || user?.uid,
	])

	// Default content generator
	const defaultContent = useMemo(() => {
		if (initialContent) return initialContent

		return `<p style="font-family: ${defaultFontFamily}; font-size: ${defaultFontSize};">Start writing here...</p>`
	}, [initialContent, defaultFontFamily, defaultFontSize])

	const editor = useEditor(
		{
			extensions: editorExtensions,
			content: defaultContent,
			autofocus: false, // Disable autofocus untuk mencegah cursor jump

			onUpdate: ({ editor }) => {
				try {
					console.log('Content updated:', editor.getHTML())
					onUpdate({ editor })
				} catch (error) {
					console.warn('Error getting editor content:', error)
				}
			},

			onCreate: ({ editor }) => {
				console.log('Editor created successfully')

				try {
					// Set default font style untuk future typing
					if (editor && editor.schema) {
						const tr = editor.state.tr
						const textStyleMark = editor.schema.marks.textStyle.create({
							fontFamily: defaultFontFamily,
							fontSize: defaultFontSize,
						})
						tr.addStoredMark(textStyleMark)
						editor.view.dispatch(tr)
						console.log('Default font styles set as stored marks')
					}

					// Delayed initialization untuk menghindari cursor jump
					setTimeout(() => {
						try {
							if (editor && editor.chain) {
								// Fix tables first tanpa focus
								editor.chain().fixTables().run()
								console.log('Tables fixed on initialization')

								// Apply smart focus setelah semua operasi selesai
								setTimeout(() => {
									if (editor.commands.smartFocus) {
										editor.commands.smartFocus()
									} else {
										// Fallback untuk focus yang aman
										safeFocus(editor)
									}
								}, 100)
							}
						} catch (error) {
							console.warn('Could not complete initialization:', error)
						}
					}, 500)

					onCreate({ editor })
				} catch (error) {
					console.warn('Error during editor initialization:', error)
				}
			},

			onDestroy: (params) => {
				if (params && params.editor) {
					console.log('Editor destroyed')
				} else {
					console.log('Editor destroyed (no params)')
				}
				onDestroy(params)
			},

			onError: ({ error }) => {
				console.error('Editor error:', error)

				// Handle pagination-related errors gracefully
				if (error.message && error.message.includes('Could not find node of type page')) {
					console.warn('Pagination error detected, attempting recovery...')

					setTimeout(() => {
						try {
							if (editor && editor.commands) {
								const currentContent = editor.getHTML()
								editor.commands.setContent(currentContent)
								console.log('Editor content refreshed after pagination error')
							}
						} catch (recoveryError) {
							console.error('Failed to recover from pagination error:', recoveryError)
							setEditorError('Editor encountered an error and needs to be refreshed')
						}
					}, 100)
				} else {
					setEditorError(error.message || 'An editor error occurred')
				}
			},
		},
		[paperSize, defaultFontFamily, defaultFontSize, collaborationReady, collaborationExtensions]
	) // Update dependencies

	// Undo/Redo operations yang mengintegrasikan Yjs dan TipTap dengan safe focus
	const undo = useCallback(() => {
		let result = false

		if (enableLiveblocks && undoManager) {
			// Gunakan Yjs UndoManager untuk collaboration
			result = yjsUndo()
		} else if (editor) {
			// Gunakan TipTap history untuk non-collaboration
			result = editor.commands.undo()
		}

		// Apply safe focus setelah undo operation
		if (result && editor) {
			setTimeout(() => safeFocus(editor), 50)
		}

		return result
	}, [enableLiveblocks, undoManager, yjsUndo, editor])

	const redo = useCallback(() => {
		let result = false

		if (enableLiveblocks && undoManager) {
			// Gunakan Yjs UndoManager untuk collaboration
			result = yjsRedo()
		} else if (editor) {
			// Gunakan TipTap history untuk non-collaboration
			result = editor.commands.redo()
		}

		// Apply safe focus setelah redo operation
		if (result && editor) {
			setTimeout(() => safeFocus(editor), 50)
		}

		return result
	}, [enableLiveblocks, undoManager, yjsRedo, editor])

	const canUndo = useCallback(() => {
		if (enableLiveblocks && undoManager) {
			return yjsCanUndo()
		} else if (editor) {
			return editor.can().undo()
		}
		return false
	}, [enableLiveblocks, undoManager, yjsCanUndo, editor])

	const canRedo = useCallback(() => {
		if (enableLiveblocks && undoManager) {
			return yjsCanRedo()
		} else if (editor) {
			return editor.can().redo()
		}
		return false
	}, [enableLiveblocks, undoManager, yjsCanRedo, editor])

	// Re-apply default font styles after editor recreation
	useEffect(() => {
		if (editor) {
			setDefaultEditorStyles(editor)
		}
	}, [editor, setDefaultEditorStyles])

	// Load document content (hanya jika document tersedia dan tidak menggunakan collaboration)
	useEffect(() => {
		if (!document || !editor) return

		// PENTING: Jika collaboration mode aktif, jangan load content dari Firestore
		// karena Yjs/Liveblocks akan menangani sinkronisasi konten
		if (enableLiveblocks && yDoc) {
			console.log(
				'🤝 Collaboration mode active - skipping Firestore content load, letting Yjs handle synchronization'
			)
			return
		}

		try {
			let content = document.savedContent

			// Regular content loading untuk non-collaboration mode
			if (!content) {
				content = {
					type: 'doc',
					content: [
						{
							type: 'paragraph',
							attrs: {
								style: `font-family: ${defaultFontFamily}; font-size: ${defaultFontSize};`,
							},
							content: [
								{
									type: 'text',
									text: 'Start writing here...',
								},
							],
						},
					],
				}
			} else if (typeof content === 'string') {
				content = {
					type: 'doc',
					content: [
						{
							type: 'paragraph',
							attrs: {
								style: `font-family: ${defaultFontFamily}; font-size: ${defaultFontSize};`,
							},
							content: [
								{
									type: 'text',
									text: 'Start writing here...',
								},
							],
						},
					],
				}
			}

			editor.commands.setContent(content)

			// Apply default font styles after content load
			setTimeout(() => {
				try {
					const tr = editor.state.tr
					const textStyleMark = editor.schema.marks.textStyle.create({
						fontFamily: defaultFontFamily,
						fontSize: defaultFontSize,
					})
					tr.addStoredMark(textStyleMark)
					editor.view.dispatch(tr)

					if (editor.isEmpty) {
						const { doc } = editor.state
						let foundParagraph = false

						doc.descendants((node, pos) => {
							if (!foundParagraph && node.type.name === 'paragraph') {
								foundParagraph = true
								const from = pos
								const to = pos + node.nodeSize

								editor
									.chain()
									.setTextSelection({ from, to })
									.setFontFamily(defaultFontFamily)
									.setFontSize(defaultFontSize)
									.run()

								return false
							}
							return true
						})
					}
				} catch (error) {
					console.warn('Error applying font styles after content load:', error)
				}
			}, 100)
		} catch (error) {
			console.error('Error loading document content:', error)
		}
	}, [document, editor, defaultFontFamily, defaultFontSize, yDoc, enableLiveblocks])

	// Preserve content when paper size changes
	useEffect(() => {
		if (editor) {
			const currentContent = editor.getJSON()
			setSavedContent(currentContent)
			console.log('Paper size changed to:', paperSize, 'Content saved')
		}
	}, [paperSize])

	// Restore content after editor is recreated
	useEffect(() => {
		if (editor && savedContent) {
			editor.commands.setContent(savedContent)
			setSavedContent(null)
			console.log('Content restored after editor recreation')
		}
	}, [editor, savedContent])

	// Auto-save functionality (hanya jika diaktifkan dan document tersedia)
	useEffect(() => {
		if (!enableAutoSave || !editor || !document || !user) return

		const autoSave = async () => {
			try {
				let contentToSave

				// For collaboration mode, get the current editor content directly
				// (the webhook will handle Yjs state sync)
				if (enableLiveblocks && editor) {
					contentToSave = editor.getJSON()
					console.log('🔄 Auto-saving current editor content (collaboration mode)')
				} else {
					// Simpan content biasa
					contentToSave = editor.getJSON()
					console.log('🔄 Auto-saving regular document')
				}

				if (contentToSave) {
					await DocumentService.updateDocument(document.documentId, {
						title,
						savedContent: contentToSave,
					})
					console.log('✅ Auto-saved document successfully')
				} else {
					console.log('⚠️ No content to auto-save')
				}
			} catch (error) {
				console.warn('⚠️ Auto-save failed:', error)
			}
		}

		const autoSaveTimer = setTimeout(autoSave, 2000)
		return () => clearTimeout(autoSaveTimer)
	}, [enableAutoSave, title, document, user, yDoc, enableLiveblocks, editor])

	// Helper functions
	const insertTable = useCallback(
		(rows = 3, cols = 3, withHeaderRow = true) => {
			if (!editor) return false

			try {
				editor.chain().insertTable({ rows, cols, withHeaderRow }).run()
				console.log('Table inserted successfully')

				// Apply safe focus setelah insert table
				setTimeout(() => safeFocus(editor), 50)
				return true
			} catch (error) {
				console.error('Error inserting table:', error)
				return false
			}
		},
		[editor]
	)

	const setContent = useCallback(
		(content) => {
			if (!editor) return false

			try {
				editor.commands.setContent(content)
				return true
			} catch (error) {
				console.error('Error setting content:', error)
				return false
			}
		},
		[editor]
	)

	const getContent = useCallback(
		(format = 'json') => {
			if (!editor) return null

			try {
				return format === 'html' ? editor.getHTML() : editor.getJSON()
			} catch (error) {
				console.error('Error getting content:', error)
				return null
			}
		},
		[editor]
	)

	const isEmpty = useCallback(() => {
		return editor ? editor.isEmpty : true
	}, [editor])

	const focus = useCallback(() => {
		if (editor) {
			safeFocus(editor)
		}
	}, [editor])

	// Function untuk mendapatkan current content sebagai TipTap JSON
	const getCurrentContent = useCallback(() => {
		if (!editor) return null
		return editor.getJSON()
	}, [editor])

	// Function untuk mendapatkan current content sebagai HTML
	const getCurrentHTML = useCallback(() => {
		if (!editor) return ''
		return editor.getHTML()
	}, [editor])

	// Function untuk sync current editor content ke Firestore
	const saveCurrentContent = useCallback(
		async (documentId) => {
			if (!editor || !documentId) return false

			try {
				const content = getCurrentContent()
				if (!content) return false

				console.log('💾 Saving current editor content to Firestore')

				await DocumentService.updateDocument(documentId, {
					savedContent: content,
				})

				console.log('✅ Content saved successfully')
				return true
			} catch (error) {
				console.error('❌ Error saving content:', error)
				return false
			}
		},
		[editor, getCurrentContent]
	)

	// Debug functions (only in development)
	const debugContentExtraction = useCallback(() => {
		if (process.env.NODE_ENV !== 'development') return

		console.log('🐛 Debug: Testing content extraction...')

		if (editor) {
			// Test direct editor content extraction
			const editorContent = YjsStateManager.extractContentFromEditor(editor)
			console.log('📄 Direct editor content:', editorContent)

			// Debug editor and Yjs state
			YjsStateManager.debugEditorState(editor, yDoc)

			// Test current hook function
			const hookContent = getCurrentContent()
			console.log('🎣 Hook getCurrentContent():', hookContent)
		}
	}, [editor, yDoc, getCurrentContent])

	return {
		editor,
		// Helper functions
		insertTable,
		setContent,
		getContent,
		isEmpty,
		focus,
		setDefaultEditorStyles,
		// Content management
		getCurrentContent,
		getCurrentHTML,
		saveCurrentContent,
		// Undo/Redo operations
		undo,
		redo,
		canUndo,
		canRedo,
		stopCapturing,
		clearUndoStack,
		// Collaboration features
		yProvider,
		yDoc,
		undoManager,
		awareness,
		isConnected,
		collaborationReady,
		getAwarenessStates,
		setLocalAwarenessState,
		setAwarenessField,
		// States
		savedContent,
		debugContentExtraction, // Expose debug function
	}
}
