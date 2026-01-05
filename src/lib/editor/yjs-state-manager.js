/**
 * Utility functions for handling Yjs state conversion and management
 * for Firestore persistence and Liveblocks synchronization
 */

import * as Y from 'yjs'

export class YjsStateManager {
	/**
	 * Convert Yjs document state to Uint8Array for Firestore storage
	 * @param {Y.Doc} ydoc - The Yjs document
	 * @returns {Uint8Array} - Binary state data
	 */
	static encodeYjsState(ydoc) {
		return Y.encodeStateAsUpdate(ydoc)
	}

	/**
	 * Apply Yjs state from Firestore to a Yjs document
	 * @param {Y.Doc} ydoc - The Yjs document to update
	 * @param {Uint8Array} state - Binary state data from Firestore
	 */
	static applyYjsState(ydoc, state) {
		Y.applyUpdate(ydoc, state)
	}

	/**
	 * Create a new Yjs document from persisted state
	 * @param {Uint8Array} state - Binary state data
	 * @returns {Y.Doc} - New Yjs document with applied state
	 */
	static createYjsDocFromState(state) {
		const ydoc = new Y.Doc()
		Y.applyUpdate(ydoc, state)
		return ydoc
	}

	/**
	 * Get the current state vector of a Yjs document
	 * @param {Y.Doc} ydoc - The Yjs document
	 * @returns {Uint8Array} - State vector
	 */
	static getStateVector(ydoc) {
		return Y.encodeStateVector(ydoc)
	}

	/**
	 * Get the difference between two Yjs documents
	 * @param {Y.Doc} ydoc - The Yjs document
	 * @param {Uint8Array} stateVector - State vector to compare against
	 * @returns {Uint8Array} - Difference update
	 */
	static getStateDifference(ydoc, stateVector) {
		return Y.encodeStateAsUpdate(ydoc, stateVector)
	}

	/**
	 * Merge updates from multiple sources
	 * @param {Uint8Array[]} updates - Array of update buffers
	 * @returns {Uint8Array} - Merged update
	 */
	static mergeUpdates(updates) {
		return Y.mergeUpdates(updates)
	}

	/**
	 * Convert Yjs document to JSON (for debugging/inspection)
	 * @param {Y.Doc} ydoc - The Yjs document
	 * @returns {any} - JSON representation
	 */
	static yjsDocToJson(ydoc) {
		const content = ydoc.getXmlElement('document')
		return content.toJSON()
	}

	/**
	 * Check if two Yjs states are equal
	 * @param {Uint8Array} state1 - First state
	 * @param {Uint8Array} state2 - Second state
	 * @returns {boolean} - True if states are equal
	 */
	static areStatesEqual(state1, state2) {
		if (state1.length !== state2.length) return false
		return state1.every((byte, index) => byte === state2[index])
	}

	/**
	 * Calculate the size of a Yjs state in bytes
	 * @param {Uint8Array} state - Binary state data
	 * @returns {number} - Size in bytes
	 */
	static getStateSize(state) {
		return state.byteLength
	}

	/**
	 * Convert Uint8Array to Base64 string (for API transmission)
	 * @param {Uint8Array} state - Binary state data
	 * @returns {string} - Base64 encoded string
	 */
	static stateToBase64(state) {
		return Buffer.from(state).toString('base64')
	}

	/**
	 * Convert Base64 string back to Uint8Array
	 * @param {string} base64 - Base64 encoded string
	 * @returns {Uint8Array} - Binary state data
	 */
	static base64ToState(base64) {
		return new Uint8Array(Buffer.from(base64, 'base64'))
	}

	/**
	 * Validate Yjs state integrity
	 * @param {Uint8Array} state - Binary state data
	 * @returns {boolean} - True if state is valid
	 */
	static validateState(state) {
		try {
			const ydoc = new Y.Doc()
			Y.applyUpdate(ydoc, state)
			return true
		} catch (error) {
			console.error('Invalid Yjs state:', error)
			return false
		}
	}

	/**
	 * Create empty Yjs document with TipTap structure
	 * @returns {Y.Doc} - Empty Yjs document with TipTap structure
	 */
	static createEmptyTipTapDocument() {
		const ydoc = new Y.Doc()

		// Initialize with empty TipTap document structure
		const xmlFragment = ydoc.getXmlElement('document')

		// Create initial paragraph
		const paragraph = new Y.XmlElement('paragraph')
		xmlFragment.insert(0, [paragraph])

		return ydoc
	}

	/**
	 * Extract text content from Yjs document (for search indexing)
	 * @param {Y.Doc} ydoc - The Yjs document
	 * @returns {string} - Plain text content
	 */
	static extractTextContent(ydoc) {
		try {
			const content = ydoc.getXmlElement('document')
			return this.xmlToText(content)
		} catch (error) {
			console.error('Error extracting text content:', error)
			return ''
		}
	}

	/**
	 * Helper method to convert XML element to plain text
	 * @param {Y.XmlElement} element - XML element to convert
	 * @returns {string} - Plain text content
	 */
	static xmlToText(element) {
		let text = ''

		for (let i = 0; i < element.length; i++) {
			const child = element.get(i)

			if (typeof child === 'string') {
				text += child
			} else if (child instanceof Y.XmlElement) {
				text += this.xmlToText(child)
			} else if (child instanceof Y.XmlText) {
				text += child.toString()
			}
		}

		return text
	}

	/**
	 * Log Yjs document statistics
	 * @param {Y.Doc} ydoc - The Yjs document
	 * @param {string} label - Label for the log message
	 */
	static logDocumentStats(ydoc, label = 'Document') {
		const state = this.encodeYjsState(ydoc)
		const size = this.getStateSize(state)
		const textContent = this.extractTextContent(ydoc)

		console.log(`📊 ${label} Stats:`, {
			stateSize: `${(size / 1024).toFixed(2)} KB`,
			textLength: textContent.length,
			clientId: ydoc.clientID,
		})
	}

	/**
	 * Extract TipTap JSON content from Yjs document for traditional storage
	 * @param {Y.Doc} ydoc - The Yjs document
	 * @returns {Object|null} - TipTap JSON content
	 */
	static extractTipTapContent(ydoc) {
		try {
			// TipTap Collaboration extension uses 'default' fragment by default
			const xmlFragment = ydoc.getXmlFragment('default')

			console.log('🔍 Extracting TipTap content from Yjs document')
			console.log('📋 Fragment length:', xmlFragment.length)
			console.log('📋 Available fragments:', Object.keys(ydoc.share || {}))

			// Return empty document if fragment is empty
			if (xmlFragment.length === 0) {
				console.log('⚠️ XML fragment is empty, returning default content')
				return {
					type: 'doc',
					content: [{ type: 'paragraph', content: [] }],
				}
			}

			// Convert XML fragment to TipTap JSON
			const content = xmlFragment.toJSON()
			console.log('✅ Successfully extracted TipTap content, length:', content?.length || 0)

			return {
				type: 'doc',
				content: content || [],
			}
		} catch (error) {
			console.error('❌ Error extracting TipTap content from Yjs:', error)
			return null
		}
	}

	/**
	 * Update document content in Firestore (simplified for new structure)
	 * @param {string} documentId - Document ID
	 * @param {Y.Doc} ydoc - The Yjs document
	 * @returns {Promise<void>}
	 */
	static async syncCompleteDocumentState(documentId, ydoc) {
		try {
			const tipTapContent = this.extractTipTapContent(ydoc)
			const textContent = this.extractTextContent(ydoc)

			console.log('🔄 Syncing document content:', {
				documentId,
				hasContent: !!tipTapContent,
				textLength: textContent.length,
			})

			// Import DocumentService here to avoid circular dependency
			const { DocumentService } = await import('@/lib/firebase/document-service')

			// Update savedContent field with TipTap JSON
			await DocumentService.updateDocument(documentId, {
				savedContent: tipTapContent, // TipTap JSON content
			})

			console.log('✅ Document content synced successfully')
			return true
		} catch (error) {
			console.error('❌ Error syncing document content:', error)
			throw error
		}
	}

	/**
	 * Extract content directly from TipTap editor instance
	 * @param {Object} editor - TipTap editor instance
	 * @returns {Object|null} - TipTap JSON content
	 */
	static extractContentFromEditor(editor) {
		try {
			if (!editor) {
				console.log('❌ No editor instance provided')
				return null
			}

			const content = editor.getJSON()
			console.log('📄 Extracted content from editor:', content)

			return content
		} catch (error) {
			console.error('❌ Error extracting content from editor:', error)
			return null
		}
	}

	/**
	 * Debug function to check editor state and content
	 * @param {Object} editor - TipTap editor instance
	 * @param {Y.Doc} ydoc - Optional Yjs document
	 */
	static debugEditorState(editor, ydoc = null) {
		console.log('🐛 Debug Editor State:')

		if (editor) {
			console.log('📝 Editor exists:', {
				isEmpty: editor.isEmpty,
				isEditable: editor.isEditable,
				hasContent: !editor.isEmpty,
			})

			const content = editor.getJSON()
			console.log('📄 Editor JSON:', content)

			const html = editor.getHTML()
			console.log('🌐 Editor HTML:', html)
		} else {
			console.log('❌ No editor instance')
		}

		if (ydoc) {
			console.log('🔄 Yjs Document:')
			const fragment = ydoc.getXmlFragment('default')
			console.log('📋 Fragment length:', fragment.length)
			console.log('📋 Fragment content:', fragment.toJSON())

			this.logDocumentStats(ydoc, 'Debug')
		} else {
			console.log('❌ No Yjs document')
		}
	}

	/**
	 * Load TipTap content into Yjs document for collaboration
	 * This is used when initializing collaboration with existing content from Firestore
	 * @param {Y.Doc} ydoc - The Yjs document
	 * @param {Object|string} content - TipTap JSON content or HTML string
	 */
	static async loadContentIntoYjs(ydoc, content) {
		if (!ydoc || !content) {
			console.log('⚠️ Missing ydoc or content for Yjs loading')
			return
		}

		try {
			console.log('📥 Loading content into Yjs document...', {
				contentType: typeof content,
				isObject: typeof content === 'object',
				hasType: content?.type,
			})

			// Get the XML fragment that TipTap collaboration uses
			const fragment = ydoc.getXmlFragment('default')

			// Check if fragment is already populated
			if (fragment.length > 0) {
				console.log('📄 Yjs document already has content, skipping load')
				return
			}

			// Convert content to TipTap JSON if it's a string
			let tipTapContent = content
			if (typeof content === 'string') {
				// Try to parse as JSON first
				try {
					tipTapContent = JSON.parse(content)
				} catch {
					// If not JSON, treat as HTML and convert to basic TipTap structure
					tipTapContent = {
						type: 'doc',
						content: [
							{
								type: 'paragraph',
								content: [
									{
										type: 'text',
										text: content,
									},
								],
							},
						],
					}
				}
			}

			console.log('📋 Processing TipTap content:', {
				type: tipTapContent?.type,
				hasContent: !!(tipTapContent?.content && tipTapContent.content.length > 0),
				contentLength: tipTapContent?.content?.length || 0,
			})

			// Use a temporary TipTap editor to convert JSON to Yjs
			// This requires using the TipTap editor's prosemirror-to-yjs conversion
			const { Editor } = await import('@tiptap/core')
			const { Collaboration } = await import('@tiptap/extension-collaboration')
			const StarterKit = await import('@tiptap/starter-kit')

			console.log('🔧 Creating temporary editor for content conversion...')

			// Create a temporary editor with Yjs collaboration
			const tempEditor = new Editor({
				extensions: [
					StarterKit.default,
					Collaboration.configure({
						document: ydoc,
					}),
				],
				content: tipTapContent,
			})

			// The content is now in the Yjs document via the collaboration extension
			console.log('✅ Content loaded into Yjs document successfully', {
				fragmentLength: fragment.length,
				yjsClientId: ydoc.clientID,
			})

			// Clean up the temporary editor
			tempEditor.destroy()
		} catch (error) {
			console.error('❌ Error loading content into Yjs:', error)
			throw error
		}
	}
}

export default YjsStateManager
