/**
 * Document Chunking Utility for AI Agent
 * 
 * Splits large documents into manageable chunks for AI processing.
 * Preserves HTML structure and provides navigation between chunks.
 * 
 * @module ai/chunkDocument
 */

import type { Editor } from '@tiptap/core'

export interface DocumentChunk {
    index: number
    content: string // Plain text content
    htmlContent: string // HTML content for this chunk
    sections: string[] // Section headings in this chunk
    nodeCount: number // Number of top-level nodes
    startNodeIndex: number // First node index in full document
    endNodeIndex: number // Last node index in full document
    wordCount: number
    charCount: number
}

export interface ChunkingResult {
    chunks: DocumentChunk[]
    totalChunks: number
    totalWords: number
    totalChars: number
    allSections: string[]
}

/**
 * Extract text content from a Tiptap node
 */
const getNodeText = (node: any): string => {
    if (node.text) return node.text
    if (!node.content) return ''
    return node.content.map((child: any) => getNodeText(child)).join('')
}

/**
 * Convert Tiptap node to simple HTML
 */
const nodeToHtml = (node: any): string => {
    const text = getNodeText(node)

    switch (node.type) {
        case 'heading':
            const level = node.attrs?.level || 1
            return `<h${level}>${text}</h${level}>`
        case 'paragraph':
            return `<p>${text}</p>`
        case 'bulletList':
            const bullets = node.content?.map((li: any) => `<li>${getNodeText(li)}</li>`).join('') || ''
            return `<ul>${bullets}</ul>`
        case 'orderedList':
            const items = node.content?.map((li: any) => `<li>${getNodeText(li)}</li>`).join('') || ''
            return `<ol>${items}</ol>`
        case 'blockquote':
            return `<blockquote>${text}</blockquote>`
        case 'codeBlock':
            return `<pre><code>${text}</code></pre>`
        case 'table':
            return `<table>[Table with ${node.content?.length || 0} rows]</table>`
        case 'horizontalRule':
            return '<hr/>'
        default:
            return text ? `<p>${text}</p>` : ''
    }
}

/**
 * Check if a node represents a section heading
 */
const isSectionHeading = (node: any): boolean => {
    if (node.type === 'heading') return true

    // Check for "fake headings" - bold paragraphs that act as headings
    if (node.type === 'paragraph' && node.content) {
        const text = getNodeText(node)
        if (!text || text.length < 2) return false

        // Check if it has bold marks
        let hasBold = false
        node.content.forEach((child: any) => {
            if (child.marks?.some((m: any) => m.type === 'bold')) {
                hasBold = true
            }
        })

        // All caps + bold = likely a section heading
        const isAllCaps = text === text.toUpperCase() && text.length > 3
        if (hasBold && isAllCaps) return true
    }

    return false
}

/**
 * Get section name from a node
 */
const getSectionName = (node: any): string | null => {
    if (!isSectionHeading(node)) return null
    return getNodeText(node).trim()
}

/**
 * Chunk a document by character limit while preserving node boundaries
 * 
 * @param editor - Tiptap editor instance
 * @param chunkSize - Maximum characters per chunk (default: 8000)
 * @returns ChunkingResult with array of chunks and metadata
 */
export const chunkDocument = (editor: Editor, chunkSize = 8000): ChunkingResult => {
    const json = editor.getJSON()
    const nodes = json.content || []

    const chunks: DocumentChunk[] = []
    const allSections: string[] = []

    let currentChunk: {
        nodes: any[]
        text: string
        html: string
        sections: string[]
        startIndex: number
    } = {
        nodes: [],
        text: '',
        html: '',
        sections: [],
        startIndex: 0,
    }

    let totalWords = 0
    let totalChars = 0

    nodes.forEach((node: any, index: number) => {
        const nodeText = getNodeText(node)
        const nodeHtml = nodeToHtml(node)
        const sectionName = getSectionName(node)

        // Track all sections
        if (sectionName) {
            allSections.push(sectionName)
        }

        // Check if adding this node would exceed chunk size
        const wouldExceed = (currentChunk.text + nodeText).length > chunkSize

        // If current chunk is not empty and adding would exceed, finalize current chunk
        if (wouldExceed && currentChunk.nodes.length > 0) {
            const chunkText = currentChunk.text
            chunks.push({
                index: chunks.length,
                content: chunkText,
                htmlContent: currentChunk.html,
                sections: currentChunk.sections,
                nodeCount: currentChunk.nodes.length,
                startNodeIndex: currentChunk.startIndex,
                endNodeIndex: index - 1,
                wordCount: chunkText.split(/\s+/).filter(Boolean).length,
                charCount: chunkText.length,
            })

            // Start new chunk
            currentChunk = {
                nodes: [],
                text: '',
                html: '',
                sections: [],
                startIndex: index,
            }
        }

        // Add node to current chunk
        currentChunk.nodes.push(node)
        currentChunk.text += (currentChunk.text ? '\n' : '') + nodeText
        currentChunk.html += nodeHtml
        if (sectionName) {
            currentChunk.sections.push(sectionName)
        }

        totalChars += nodeText.length
        totalWords += nodeText.split(/\s+/).filter(Boolean).length
    })

    // Add final chunk if it has content
    if (currentChunk.nodes.length > 0) {
        const chunkText = currentChunk.text
        chunks.push({
            index: chunks.length,
            content: chunkText,
            htmlContent: currentChunk.html,
            sections: currentChunk.sections,
            nodeCount: currentChunk.nodes.length,
            startNodeIndex: currentChunk.startIndex,
            endNodeIndex: nodes.length - 1,
            wordCount: chunkText.split(/\s+/).filter(Boolean).length,
            charCount: chunkText.length,
        })
    }

    return {
        chunks,
        totalChunks: chunks.length,
        totalWords,
        totalChars,
        allSections,
    }
}

/**
 * Get the chunk that contains a specific section
 * 
 * @param chunks - Array of document chunks
 * @param sectionName - Name of the section to find
 * @returns The chunk containing the section, or null if not found
 */
export const getChunkForSection = (
    chunks: DocumentChunk[],
    sectionName: string
): DocumentChunk | null => {
    const searchLower = sectionName.toLowerCase()

    for (const chunk of chunks) {
        const found = chunk.sections.some(
            (s) => s.toLowerCase().includes(searchLower) || searchLower.includes(s.toLowerCase())
        )
        if (found) return chunk
    }

    return null
}

/**
 * Get chunk by index with bounds checking
 * 
 * @param chunks - Array of document chunks
 * @param index - Index of chunk to retrieve
 * @returns The chunk at the index, or null if out of bounds
 */
export const getChunkByIndex = (
    chunks: DocumentChunk[],
    index: number
): DocumentChunk | null => {
    if (index < 0 || index >= chunks.length) return null
    return chunks[index]
}

/**
 * Get a summary of all chunks for AI context
 * 
 * @param result - ChunkingResult from chunkDocument
 * @returns Summary string for AI context
 */
export const getChunkSummary = (result: ChunkingResult): string => {
    if (result.totalChunks <= 1) {
        return `Document has ${result.totalWords} words, ${result.totalChars} characters. Sections: ${result.allSections.join(', ') || 'None'}`
    }

    const chunkInfo = result.chunks.map((c) =>
        `[Chunk ${c.index + 1}]: ${c.wordCount} words, sections: ${c.sections.join(', ') || 'None'}`
    ).join('\n')

    return `Document split into ${result.totalChunks} chunks (${result.totalWords} total words).

Sections: ${result.allSections.join(', ') || 'None'}

Chunk Overview:
${chunkInfo}

Use read_chunk({ index }) to read a specific chunk, or read_chunk_by_section({ sectionName }) to read the chunk containing a section.`
}
