

/**
 * Document Context Builder for AI Agent

 *
 * Provides comprehensive document context extraction for AI processing.
 * Builds semantic understanding of document structure, cursor position,
 * and content for intelligent agent operations.
 *
 * @module lib/ai/documentContext
 */

import type { EditorView } from '@codemirror/view'

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
// Structure Extraction (LaTeX/CodeMirror Text-Based)
// ============================================================================

/**
 * Extract all sections from LaTeX document
 */
export const extractSections = (editor: EditorView): Section[] => {
    const doc = editor.state.doc
    const text = doc.toString()
    const sections: Section[] = []
    const lines = text.split('\n')
    let currentPos = 0

    lines.forEach((line, lineIndex) => {
        // Match LaTeX sections: \section{...}, \subsection{...}, etc.
        const sectionMatch = line.match(/\\(section|subsection|subsubsection|chapter)\{([^}]+)\}/)
        if (sectionMatch) {
            const [, level, name] = sectionMatch
            const levelMap: Record<string, number> = {
                chapter: 0,
                section: 1,
                subsection: 2,
                subsubsection: 3,
            }
            sections.push({
                name: name.trim(),
                level: levelMap[level] || 1,
                type: 'heading',
                startPos: currentPos,
                endPos: currentPos + line.length,
                nodeIndex: lineIndex,
            })
        }
        currentPos += line.length + 1 // +1 for newline
    })

    // Update endPos for each section
    for (let i = 0; i < sections.length; i++) {
        if (i < sections.length - 1) {
            sections[i].endPos = sections[i + 1].startPos
        } else {
            sections[i].endPos = text.length
        }
    }

    return sections
}

/**
 * Extract tables from LaTeX document (basic detection)
 */
export const extractTables = (editor: EditorView): TableInfo[] => {
    const doc = editor.state.doc
    const text = doc.toString()
    const tables: TableInfo[] = []
    const tableMatches = text.matchAll(/\\begin\{tabular\}[\s\S]*?\\end\{tabular\}/g)

    for (const match of tableMatches) {
        const content = match[0]
        // Simple row/col estimation from tabular format
        const colsMatch = content.match(/\{(\|?[lcr|]+\|?)\}/)
        const cols = colsMatch ? colsMatch[1].replace(/[|]/g, '').length : 0
        const rows = (content.match(/\\\\/g) || []).length + 1

        tables.push({
            index: tables.length + 1,
            rows,
            cols,
            startPos: match.index || 0,
            endPos: (match.index || 0) + content.length,
            contentPreview: content.substring(0, 100),
            hasHeader: false,
        })
    }

    return tables
}

/**
 * Extract lists from LaTeX document
 */
export const extractLists = (editor: EditorView): ListInfo[] => {
    const doc = editor.state.doc
    const text = doc.toString()
    const lists: ListInfo[] = []

    // Match itemize and enumerate environments
    const listMatches = text.matchAll(/\\begin\{(itemize|enumerate)\}[\s\S]*?\\end\{\1\}/g)

    for (const match of listMatches) {
        const content = match[0]
        const type = match[1] as 'itemize' | 'enumerate'
        const itemCount = (content.match(/\\item/g) || []).length

        lists.push({
            type: type === 'itemize' ? 'bulletList' : 'orderedList',
            itemCount,
            startPos: match.index || 0,
            endPos: (match.index || 0) + content.length,
            preview: content.substring(0, 100),
        })
    }

    return lists
}

/**
 * Extract images from LaTeX document
 */
export const extractImages = (editor: EditorView): ImageInfo[] => {
    const doc = editor.state.doc
    const text = doc.toString()
    const images: ImageInfo[] = []

    // Match includegraphics commands
    const imageMatches = text.matchAll(/\\includegraphics(?:\[[^\]]*\])?\{([^}]+)\}/g)

    for (const match of imageMatches) {
        images.push({
            src: match[1],
            alt: match[1],
            position: match.index || 0,
        })
    }

    return images
}

/**
 * Build complete document structure
 */
export const buildDocumentStructure = (editor: EditorView): DocumentStructure => {
    const sections = extractSections(editor)
    const tables = extractTables(editor)
    const lists = extractLists(editor)
    const images = extractImages(editor)

    return {
        sections,
        tables,
        lists,
        images,
    }
}

// ============================================================================
// Cursor Context
// ============================================================================

/**
 * Build cursor context from editor state
 */
export const buildCursorContext = (
    editor: EditorView,
    sections: Section[],
    radius: number = DEFAULT_CURSOR_CONTEXT_RADIUS
): CursorContext => {
    const { from, to } = editor.state.selection.main
    const doc = editor.state.doc
    const docSize = doc.length
    const text = doc.toString()

    // Get text around cursor
    const beforeStart = Math.max(0, from - radius)
    const afterEnd = Math.min(docSize, to + radius)
    const textBefore = text.substring(beforeStart, from)
    const textAfter = text.substring(to, afterEnd)
    const selectedText = from === to ? '' : text.substring(from, to)

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
        hasSelection: from !== to,
        selectedText: selectedText.substring(0, 200),
        inElement: 'LaTeX',
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
export const buildDocumentMetadata = (editor: EditorView): DocumentMetadata => {
    const text = editor.state.doc.toString()
    const words = text.split(/\s+/).filter(Boolean)
    const wordCount = words.length
    const charCount = text.length

    return {
        wordCount,
        charCount,
        sectionCount: 0, // Will be set from structure
        nodeCount: 0, // CodeMirror documents don't have discrete nodes like ProseMirror
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
 * @param editor - CodeMirror editor instance
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
    editor: EditorView,
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
    let textContent = editor.state.doc.toString()
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
 * @param editor - CodeMirror editor instance
 * @param position - Position to get context around
 * @param radius - Characters before/after to include
 * @returns Local text context
 */
export const getLocalContext = (
    editor: EditorView,
    position: number,
    radius: number = 200
): string => {
    const docSize = editor.state.doc.length

    const start = Math.max(0, position - radius)
    const end = Math.min(docSize, position + radius)

    return editor.state.sliceDoc(start, end)
}

/**
 * Get complete content for a specific section
 *
 * @param editor - CodeMirror editor instance
 * @param sectionName - Name of section to get (fuzzy match)
 * @returns Section content or null if not found
 */
export const getSectionContent = (
    editor: EditorView,
    sectionName: string
): { name: string; content: string } | null => {
    const sections = extractSections(editor)
    const searchLower = sectionName.toLowerCase()

    const section = sections.find(
        (s) =>
            s.name.toLowerCase().includes(searchLower) || searchLower.includes(s.name.toLowerCase())
    )

    if (!section) return null

    const content = editor.state.sliceDoc(section.startPos, section.endPos)

    return {
        name: section.name,
        content,
    }
}
