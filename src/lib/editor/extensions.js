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
import Blockquote from '@tiptap/extension-blockquote'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import HardBreak from '@tiptap/extension-hard-break'
import History from '@tiptap/extension-history'
import Placeholder from '@tiptap/extension-placeholder'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Gapcursor from '@tiptap/extension-gapcursor'
import TextStyle from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'
import FontSize from 'tiptap-extension-font-size'
import TextAlign from '@tiptap/extension-text-align'
import { Extension } from '@tiptap/core'
import PaginationExtension, { PageNode, HeaderFooterNode, BodyNode } from 'tiptap-extension-pagination'

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
          const textStyleMark = editor.state.storedMarks.find(mark => mark.type.name === 'textStyle')
          if (textStyleMark) {
            if (textStyleMark.attrs.fontFamily) {
              currentFontFamily = textStyleMark.attrs.fontFamily
            }
            if (textStyleMark.attrs.fontSize) {
              currentFontSize = textStyleMark.attrs.fontSize
            }
          }
        }
        
        // Create new paragraph with default behavior first
        const result = editor.chain().insertContent('\n').run()
        
        // Then preserve the stored marks for the new paragraph
        setTimeout(() => {
          const tr = editor.state.tr
          const textStyleMark = editor.schema.marks.textStyle.create({
            fontFamily: currentFontFamily,
            fontSize: currentFontSize
          })
          tr.addStoredMark(textStyleMark)
          editor.view.dispatch(tr)
        }, 10)
        
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
            parseHTML: element => element.style.lineHeight || this.options.defaultValue,
            renderHTML: attributes => {
              if (!attributes.lineSpacing) {
                return {}
              }
              return {
                style: `line-height: ${attributes.lineSpacing}`
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setLineSpacing: lineSpacing => ({ commands }) => {
        return this.options.types.every(type => commands.updateAttributes(type, { lineSpacing }))
      },
      unsetLineSpacing: () => ({ commands }) => {
        return this.options.types.every(type => commands.resetAttributes(type, 'lineSpacing'))
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
          if (parentNode.type.name === 'heading' && 
              (parentNode.textContent.length === 0 || 
               (parentNode.textContent.length <= 1 && $from.parentOffset === 0))) {
            
            try {
              // Safely convert heading to paragraph instead of letting default behavior
              // This prevents pagination extension from getting confused
              return editor.chain()
                .setNode('paragraph')
                .run()
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

// Custom extension untuk mengatasi cursor jump ke footer dengan pagination
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
    
    // Set smart focus setelah pagination extension selesai render
    setTimeout(() => {
      try {
        const { editor } = this
        if (!editor || !editor.view) return
        
        this.smartFocusToBody()
      } catch (error) {
        console.warn('Smart focus failed:', error)
        // Final fallback
        this.editor.commands.focus('start')
      }
    }, this.options.delay)
  },
  
  smartFocusToBody() {
    const { editor } = this
    
    // Cari first paragraph dalam body (bukan header/footer)
    const { doc } = editor.state
    let targetPos = null
    
    doc.descendants((node, pos) => {
      // Skip header dan footer nodes
      if (node.type.name === 'headerFooter' || 
          node.type.name === 'page-header' || 
          node.type.name === 'page-footer') return false
      
      // Cari paragraph pertama dalam body
      if ((node.type.name === 'paragraph' || node.type.name === 'body') && !targetPos) {
        targetPos = node.type.name === 'body' ? pos + 1 : pos + 1
        return false // Stop searching
      }
      
      return true
    })
    
    // Set cursor position dengan aman
    if (targetPos !== null && targetPos < doc.content.size) {
      try {
        const resolvedPos = doc.resolve(targetPos)
        const tr = editor.state.tr.setSelection(
          editor.state.selection.constructor.near(resolvedPos)
        )
        editor.view.dispatch(tr)
        console.log('Smart focus applied at position:', targetPos)
      } catch (error) {
        console.warn('Error applying smart focus position:', error)
        // Fallback to start
        editor.commands.focus('start')
      }
    } else {
      // Fallback: focus start of document body
      editor.commands.focus('start')
      console.log('Fallback focus applied')
    }
  },
  
  addCommands() {
    return {
      smartFocus: () => ({ editor, commands }) => {
        try {
          this.smartFocusToBody()
          return true
        } catch (error) {
          console.warn('Smart focus command failed:', error)
          return commands.focus('start')
        }
      }
    }
  }
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
      safeFocusAfterUndo: () => ({ commands }) => {
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
      }
    }
  },
  
  addKeyboardShortcuts() {
    return {
      'Mod-z': () => {
        // Try collaboration undo first, fallback to default
        if (this.options.undoHandler) {
          const result = this.options.undoHandler()
          // Apply safe focus setelah undo
          if (result) {
            setTimeout(() => {
              if (this.editor.commands.smartFocus) {
                this.editor.commands.smartFocus()
              } else {
                this.editor.commands.focus('start')
              }
            }, 50)
          }
          return result
        }
        return false // Let default history handle it
      },
      'Mod-y': () => {
        // Try collaboration redo first, fallback to default
        if (this.options.redoHandler) {
          const result = this.options.redoHandler()
          // Apply safe focus setelah redo
          if (result) {
            setTimeout(() => {
              if (this.editor.commands.smartFocus) {
                this.editor.commands.smartFocus()
              } else {
                this.editor.commands.focus('start')
              }
            }, 50)
          }
          return result
        }
        return false // Let default history handle it
      },
      'Mod-Shift-z': () => {
        // Try collaboration redo first, fallback to default
        if (this.options.redoHandler) {
          const result = this.options.redoHandler()
          // Apply safe focus setelah redo
          if (result) {
            setTimeout(() => {
              if (this.editor.commands.smartFocus) {
                this.editor.commands.smartFocus()
              } else {
                this.editor.commands.focus('start')
              }
            }, 50)
          }
          return result
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
  
  onCreate() {
    // Store original dispatch method
    const originalDispatch = this.editor.view.dispatch
    
    // Override dispatch untuk menambahkan origin pada setiap transaction
    this.editor.view.dispatch = (transaction) => {
      // Hanya tambahkan origin jika belum ada dan transaction mengubah dokumen
      if (!transaction.getMeta('origin') && transaction.docChanged) {
        transaction.setMeta('origin', this.options.userOrigin)
        console.log(`Transaction with origin: ${this.options.userOrigin}`)
      }
      
      return originalDispatch.call(this.editor.view, transaction)
    }
  },
  
  onDestroy() {
    // Restore original dispatch method if needed
    // This will be handled automatically when editor is destroyed
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
    delay: 150, // Delay lebih lama untuk memastikan pagination selesai
  }),
  SmartFocus,
  
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
  
  // Pagination extensions
  PaginationExtension.configure({
    defaultPaperSize: paperSize,
    defaultPaperColour: "#ffffff",
    defaultPaperOrientation: "portrait",
    defaultPageBorders: { top: 0, right: 0, bottom: 0, left: 0 },
    pageAmendmentOptions: {
      enableHeader: true,
      enableFooter: true,
      headerOptions: {
        showPageNumber: true,
        pageNumberPosition: 'right',
        differentFirstPage: true,
      },
      footerOptions: {
        showPageNumber: true,
        pageNumberPosition: 'center',
        differentFirstPage: true,
      }
    },
  }),

  PageNode,
  HeaderFooterNode,
  BodyNode,
  
  // Text formatting
  TextStyle.configure({
    HTMLAttributes: {
      style: 'font-family: "Times New Roman", Times, serif; font-size: 11pt;'
    }
  }),
  FontFamily.configure({
    types: ['textStyle'],
    defaultValue: '"Times New Roman", Times, serif'
  }),
  FontSize.configure({
    types: ['textStyle'],
    defaultValue: '11pt'
  }),
  Heading.configure({
    levels: [1, 2, 3, 4]
  }),
  Bold,
  Italic,
  Strike,
  Underline,
  Code,
  CodeBlock,
  Blockquote,
  
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
  Gapcursor, // Move Gapcursor after table extensions
  Placeholder.configure({
    placeholder: 'Start typing or use the AI assistant to generate content...',
    emptyEditorClass: 'is-editor-empty',
    emptyNodeClass: 'is-node-empty',
  }),
]

export { createEditorExtensions, HeadingBackspaceHandler, FontStylePersistence, LineSpacing, CollaborationUndoRedo, UserOriginExtension, SmartFocus }