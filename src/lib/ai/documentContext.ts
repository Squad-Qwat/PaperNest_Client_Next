/**
 * Document Context Builder for AI Agent
 *
 * Provides comprehensive document context extraction for AI processing.
 * Builds semantic understanding of document structure, cursor position,
 * and content for intelligent agent operations.
 *
 * @module lib/ai/documentContext
 */

import type { Editor } from '@tiptap/core'
import type {
    DocumentContext,
    DocumentStructure,
    CursorContext,
    DocumentMetadata,
    Section,
    TableInfo,
    ListInfo,
    ImageInfo,
    ContextBuildOptions,
} from './types/editor'

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_MAX_CONTENT_LENGTH = 6000
const DEFAULT_CURSOR_CONTEXT_RADIUS = 100
const CHUNKING_THRESHOLD = 8000

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract text content from a TipTap node recursively
 */
const getNodeText = (node: any): string => {
    if (node.text) return node.text
    if (!node.content) return ''
    return node.content.map((child: any) => getNodeText(child)).join('')
}

/**
 * Check if a paragraph node functions as a heading (bold + caps/large font)
 */
const isPseudoHeading = (node: any): boolean => {
    if (node.type !== 'paragraph' || !node.content) return false

    const text = getNodeText(node)
    if (!text || text.length < 3) return false

    let hasBold = false
    let hasLargeFont = false

    node.content.forEach((child: any) => {
        if (!child.marks) return
        if (child.marks.some((m: any) => m.type === 'bold')) hasBold = true

        const textStyle = child.marks.find((m: any) => m.type === 'textStyle')
        if (textStyle?.attrs?.fontSize) {
            const fs = textStyle.attrs.fontSize
            if ((fs.includes('px') && parseInt(fs) >= 16) || (fs.includes('pt') && parseInt(fs) >= 12)) {
                hasLargeFont = true
            }
        }
    })

    const isAllCaps = text === text.toUpperCase()
    return hasBold && (hasLargeFont || isAllCaps)
}

// ============================================================================
// Structure Extraction
// ============================================================================

/**
 * Extract all sections from document
 */
export const extractSections = (editor: Editor): Section[] => {
    const doc = editor.state.doc
    const sections: Section[] = []
    let currentPos = 0

    doc.content.forEach((node: any, offset: number, index: number) => {
        const nodeStart = currentPos
        const nodeEnd = currentPos + node.nodeSize
        const text = getNodeText(node).trim()

        const isHeading = node.type.name === 'heading'
        const isFakeHeading = isPseudoHeading(node)

        if ((isHeading || isFakeHeading) && text) {
            sections.push({
                name: text,
                level: isHeading ? (node.attrs?.level || 1) : 2,
                type: isHeading ? 'heading' : 'bold-paragraph',
                startPos: nodeStart,
                endPos: nodeEnd, // Will be updated later
                nodeIndex: index,
            })
        }

        currentPos = nodeEnd
    })

    // Update endPos for each section to extend to next section start
    for (let i = 0; i < sections.length; i++) {
        if (i < sections.length - 1) {
            sections[i].endPos = sections[i + 1].startPos
        } else {
            sections[i].endPos = doc.content.size
        }
    }

    return sections
}

/**
 * Extract all tables from document
 */
export const extractTables = (editor: Editor): TableInfo[] => {
    const doc = editor.state.doc
    const tables: TableInfo[] = []

    doc.descendants((node: any, pos: number) => {
        if (node.type.name === 'table') {
            let rows = 0
            let cols = 0
            let textContent = ''
            let hasHeader = false

            node.descendants((child: any) => {
                if (child.type.name === 'tableRow') rows++
                if (child.type.name === 'tableCell' || child.type.name === 'tableHeader') {
                    if (rows === 1) cols++
                    if (child.type.name === 'tableHeader') hasHeader = true
                }
                if (child.isText) textContent += child.text + ' '
            })

            tables.push({
                index: tables.length + 1,
                rows,
                cols,
                startPos: pos,
                endPos: pos + node.nodeSize,
                contentPreview: textContent.trim().substring(0, 100),
                hasHeader,
            })
        }
    })

    return tables
}

/**
 * Extract all lists from document
 */
export const extractLists = (editor: Editor): ListInfo[] => {
    const doc = editor.state.doc
    const lists: ListInfo[] = []

    doc.descendants((node: any, pos: number) => {
        const type = node.type.name
        if (type === 'bulletList' || type === 'orderedList' || type === 'taskList') {
            const items: string[] = []
            node.content?.forEach((item: any) => {
                items.push(getNodeText(item))
            })

            lists.push({
                type: type as ListInfo['type'],
                itemCount: items.length,
                startPos: pos,
                endPos: pos + node.nodeSize,
                preview: items.slice(0, 3).join('; ').substring(0, 100),
            })
        }
    })

    return lists
}

/**
 * Extract all images from document
 */
export const extractImages = (editor: Editor): ImageInfo[] => {
    const doc = editor.state.doc
    const images: ImageInfo[] = []

    doc.descendants((node: any, pos: number) => {
        if (node.type.name === 'image') {
            images.push({
                src: node.attrs?.src || '',
                alt: node.attrs?.alt || '',
                position: pos,
            })
        }
    })

    return images
}

/**
 * Build complete document structure
 */
export const buildDocumentStructure = (editor: Editor): DocumentStructure => {
    return {
        sections: extractSections(editor),
        tables: extractTables(editor),
        lists: extractLists(editor),
        images: extractImages(editor),
    }
}

// ============================================================================
// Cursor Context
// ============================================================================

/**
 * Build cursor context from editor state
 */
export const buildCursorContext = (
    editor: Editor,
    sections: Section[],
    radius: number = DEFAULT_CURSOR_CONTEXT_RADIUS
): CursorContext => {
    const { from, to, empty } = editor.state.selection
    const doc = editor.state.doc
    const docSize = doc.content.size

    // Get element hierarchy
    const resolvedPos = doc.resolve(from)
    const hierarchy: string[] = []
    for (let d = resolvedPos.depth; d >= 0; d--) {
        hierarchy.push(resolvedPos.node(d).type.name)
    }

    // Get text around cursor
    const beforeStart = Math.max(0, from - radius)
    const afterEnd = Math.min(docSize, to + radius)
    const textBefore = doc.textBetween(beforeStart, from, ' ')
    const textAfter = doc.textBetween(to, afterEnd, ' ')
    const selectedText = empty ? '' : doc.textBetween(from, to, ' ')

    // Find nearest section
    let nearestSection: string | null = null
    for (const section of sections) {
        if (from >= section.startPos && from < section.endPos) {
            nearestSection = section.name
            break
        }
    }

    return {
        position: from,
        selectionEnd: to,
        hasSelection: !empty,
        selectedText: selectedText.substring(0, 200),
        inElement: hierarchy[0] || 'doc',
        elementHierarchy: hierarchy.reverse(),
        nearestSection,
        textBefore: textBefore.substring(textBefore.length - radius),
        textAfter: textAfter.substring(0, radius),
    }
}

// ============================================================================
// Document Metadata
// ============================================================================

/**
 * Calculate document metadata
 */
export const buildDocumentMetadata = (editor: Editor): DocumentMetadata => {
    const text = editor.getText()
    const json = editor.getJSON()
    const words = text.split(/\s+/).filter(Boolean)
    const wordCount = words.length
    const charCount = text.length
    const nodeCount = json.content?.length || 0

    return {
        wordCount,
        charCount,
        sectionCount: 0, // Will be set from structure
        nodeCount,
        needsChunking: charCount > CHUNKING_THRESHOLD,
        readingTimeMinutes: Math.ceil(wordCount / 200),
    }
}

// ============================================================================
// Main Context Builder
// ============================================================================

/**
 * Build complete document context for AI agent
 *
 * @param editor - TipTap editor instance
 * @param options - Context building options
 * @returns Complete document context
 *
 * @example
 * ```typescript
 * const context = buildDocumentContext(editor);
 * console.log(context.cursor.nearestSection);
 * console.log(context.structure.tables.length);
 * ```
 */
export const buildDocumentContext = (
    editor: Editor,
    options: ContextBuildOptions = {}
): DocumentContext => {
    const {
        maxContentLength = DEFAULT_MAX_CONTENT_LENGTH,
        cursorContextRadius = DEFAULT_CURSOR_CONTEXT_RADIUS,
        includeStructure = true,
    } = options

    // Build structure first (needed for cursor context)
    const structure = includeStructure
        ? buildDocumentStructure(editor)
        : { sections: [], tables: [], lists: [], images: [] }

    // Build cursor context
    const cursor = buildCursorContext(editor, structure.sections, cursorContextRadius)

    // Build metadata
    const metadata = buildDocumentMetadata(editor)
    metadata.sectionCount = structure.sections.length

    // Get text content (potentially truncated)
    let textContent = editor.getText()
    if (textContent.length > maxContentLength) {
        textContent = textContent.substring(0, maxContentLength) + '\n...[truncated]'
    }

    return {
        structure,
        cursor,
        metadata,
        textContent,
        timestamp: new Date(),
    }
}

// ============================================================================
// Context Formatting for AI Prompt
// ============================================================================

/**
 * Format document context as a string for AI prompt injection
 *
 * @param context - Document context object
 * @returns Formatted string for system/user prompt
 */
export const formatContextForPrompt = (context: DocumentContext): string => {
    const { structure, cursor, metadata, textContent } = context

    const sectionsStr =
        structure.sections.length > 0
            ? structure.sections.map((s) => `[H${s.level}] ${s.name}`).join(' → ')
            : '(No sections)'

    const structureInfo = [
        `📊 Tables: ${structure.tables.length}`,
        `📝 Lists: ${structure.lists.length}`,
        `🖼️ Images: ${structure.images.length}`,
    ].join(' | ')

    const cursorInfo = cursor.hasSelection
        ? `Position ${cursor.position}-${cursor.selectionEnd} (selected: "${cursor.selectedText.substring(0, 50)}...")`
        : `Position ${cursor.position} in ${cursor.inElement}${cursor.nearestSection ? ` [Section: ${cursor.nearestSection}]` : ''}`

    return `[📄 DOCUMENT CONTEXT]

## Structure
Sections: ${sectionsStr}
${structureInfo}

## Cursor
${cursorInfo}

## Stats
Words: ${metadata.wordCount} | Chars: ${metadata.charCount} | Reading: ~${metadata.readingTimeMinutes} min
${metadata.needsChunking ? '⚠️ Large document - use chunk tools for full content' : ''}

## Content
---
${textContent}
---
[END CONTEXT]`
}

/**
 * Get local context around a specific position
 *
 * @param editor - TipTap editor instance
 * @param position - Position to get context around
 * @param radius - Characters before/after to include
 * @returns Local text context
 */
export const getLocalContext = (
    editor: Editor,
    position: number,
    radius: number = 200
): string => {
    const doc = editor.state.doc
    const docSize = doc.content.size

    const start = Math.max(0, position - radius)
    const end = Math.min(docSize, position + radius)

    return doc.textBetween(start, end, ' ')
}

/**
 * Get complete content for a specific section
 *
 * @param editor - TipTap editor instance
 * @param sectionName - Name of section to get (fuzzy match)
 * @returns Section content or null if not found
 */
export const getSectionContent = (
    editor: Editor,
    sectionName: string
): { name: string; content: string } | null => {
    const sections = extractSections(editor)
    const doc = editor.state.doc
    const searchLower = sectionName.toLowerCase()

    const section = sections.find(
        (s) =>
            s.name.toLowerCase().includes(searchLower) || searchLower.includes(s.name.toLowerCase())
    )

    if (!section) return null

    const content = doc.textBetween(section.startPos, section.endPos, '\n')

    return {
        name: section.name,
        content,
    }
}
