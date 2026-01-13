/**
 * Advanced Cursor Navigation for AI Agent
 *
 * Provides enhanced cursor control and navigation tools for AI-powered
 * document editing. Enables semantic navigation by section, element type,
 * and relative positioning.
 *
 * @module lib/ai/cursorNavigation
 */

import type { Editor } from '@tiptap/core'
import type {
    NavigationResult,
    PositionInfoResult,
    MoveToSectionOptions,
    MoveToElementOptions,
    MoveRelativeOptions,
    SelectBlockOptions,
    Section,
    NavigableElement,
} from './types/editor'
import { extractSections, extractTables, extractLists } from './documentContext'

// ============================================================================
// Section Navigation
// ============================================================================

/**
 * Move cursor to a specific section
 *
 * @param editor - TipTap editor instance
 * @param options - Section navigation options
 * @returns Navigation result with success status and new position
 */
export const moveToSection = (
    editor: Editor,
    options: MoveToSectionOptions
): NavigationResult => {
    const { sectionName, position = 'start' } = options
    const sections = extractSections(editor)
    const searchLower = sectionName.toLowerCase()

    // Find matching section (fuzzy match)
    const section = sections.find(
        (s) =>
            s.name.toLowerCase().includes(searchLower) ||
            searchLower.includes(s.name.toLowerCase())
    )

    if (!section) {
        return {
            success: false,
            message: `Section "${sectionName}" not found. Available sections: ${sections.map((s) => s.name).join(', ') || 'None'}`,
        }
    }

    const previousPosition = editor.state.selection.from

    // Determine target position based on requested position
    let targetPos: number
    switch (position) {
        case 'start':
            targetPos = section.startPos + 1 // Inside the heading
            break
        case 'end':
            targetPos = section.endPos - 1 // End of section content
            break
        case 'after_heading':
            // Find end of heading node, move to next node
            const doc = editor.state.doc
            let headingEnd = section.startPos
            doc.nodeAt(section.startPos)
            // Move to position after the heading node
            targetPos = section.startPos + (doc.nodeAt(section.startPos)?.nodeSize || 1)
            break
        default:
            targetPos = section.startPos + 1
    }

    // Ensure position is valid
    const docSize = editor.state.doc.content.size
    targetPos = Math.max(1, Math.min(targetPos, docSize - 1))

    editor.chain().focus().setTextSelection(targetPos).run()

    return {
        success: true,
        message: `Moved to section "${section.name}" (${position})`,
        newPosition: targetPos,
        previousPosition,
    }
}

// ============================================================================
// Element Navigation
// ============================================================================

/**
 * Move cursor to a specific element by type and index
 *
 * @param editor - TipTap editor instance
 * @param options - Element navigation options
 * @returns Navigation result
 */
export const moveToElement = (
    editor: Editor,
    options: MoveToElementOptions
): NavigationResult => {
    const { elementType, index = 1, position = 'start' } = options

    if (index < 1) {
        return { success: false, message: 'Index must be at least 1' }
    }

    const previousPosition = editor.state.selection.from
    let targetPos: number | null = null
    let elementEndPos: number | null = null
    let currentIndex = 0

    const doc = editor.state.doc

    // Map elementType to actual node types
    const nodeTypeMatches: Record<NavigableElement, string[]> = {
        heading: ['heading'],
        paragraph: ['paragraph'],
        table: ['table'],
        list: ['bulletList', 'orderedList', 'taskList'],
        image: ['image'],
        codeBlock: ['codeBlock'],
        blockquote: ['blockquote'],
    }

    const matchTypes = nodeTypeMatches[elementType] || [elementType]

    doc.descendants((node: any, pos: number) => {
        if (targetPos !== null) return false // Already found

        if (matchTypes.includes(node.type.name)) {
            currentIndex++
            if (currentIndex === index) {
                targetPos = pos
                elementEndPos = pos + node.nodeSize
                return false
            }
        }
    })

    if (targetPos === null) {
        return {
            success: false,
            message: `${elementType} #${index} not found. Document has ${currentIndex} ${elementType}(s).`,
        }
    }

    // Calculate final position based on requested position
    let finalPos: number
    switch (position) {
        case 'start':
            finalPos = targetPos + 1
            break
        case 'end':
            finalPos = (elementEndPos || targetPos) - 1
            break
        case 'inside':
            // For tables, move into first cell
            if (elementType === 'table') {
                finalPos = targetPos + 3 // Inside first cell
            } else {
                finalPos = targetPos + 1
            }
            break
        default:
            finalPos = targetPos + 1
    }

    // Ensure valid position
    const docSize = doc.content.size
    finalPos = Math.max(1, Math.min(finalPos, docSize - 1))

    editor.chain().focus().setTextSelection(finalPos).run()

    return {
        success: true,
        message: `Moved to ${elementType} #${index} (${position})`,
        newPosition: finalPos,
        previousPosition,
    }
}

// ============================================================================
// Relative Navigation
// ============================================================================

/**
 * Move cursor relative to current position
 *
 * @param editor - TipTap editor instance
 * @param options - Relative movement options
 * @returns Navigation result
 */
export const moveRelative = (
    editor: Editor,
    options: MoveRelativeOptions
): NavigationResult => {
    const { direction, units, unitType } = options
    const doc = editor.state.doc
    const { from } = editor.state.selection
    const previousPosition = from
    const docSize = doc.content.size

    let newPos = from
    const isForward = direction === 'forward'

    switch (unitType) {
        case 'character':
            newPos = isForward ? from + units : from - units
            break

        case 'word':
            // Move by words
            const text = doc.textBetween(0, docSize, ' ')
            const words = text.split(/\s+/)
            // Simplified word navigation - move roughly by word length * units
            const avgWordLength = 6
            newPos = isForward ? from + units * avgWordLength : from - units * avgWordLength
            break

        case 'paragraph':
        case 'block':
            // Find paragraph boundaries
            let blocksToMove = units
            let currentPos = from

            if (isForward) {
                doc.nodesBetween(from, docSize, (node, pos) => {
                    if (blocksToMove <= 0) return false
                    if (
                        node.type.name === 'paragraph' ||
                        node.type.name === 'heading' ||
                        node.isBlock
                    ) {
                        if (pos > currentPos) {
                            blocksToMove--
                            if (blocksToMove === 0) {
                                newPos = pos + 1
                                return false
                            }
                        }
                    }
                })
            } else {
                // Going backward - collect positions then pick the right one
                const positions: number[] = []
                doc.nodesBetween(0, from, (node, pos) => {
                    if (node.isBlock && pos < from) {
                        positions.push(pos)
                    }
                })
                const targetIndex = Math.max(0, positions.length - units)
                if (positions[targetIndex] !== undefined) {
                    newPos = positions[targetIndex] + 1
                }
            }
            break

        case 'section':
            const sections = extractSections(editor)
            // Find current section index
            let currentSectionIdx = sections.findIndex(
                (s) => from >= s.startPos && from < s.endPos
            )
            if (currentSectionIdx === -1) currentSectionIdx = 0

            const targetSectionIdx = isForward
                ? Math.min(sections.length - 1, currentSectionIdx + units)
                : Math.max(0, currentSectionIdx - units)

            if (sections[targetSectionIdx]) {
                newPos = sections[targetSectionIdx].startPos + 1
            }
            break

        case 'line':
            // Lines are tricky in rich text - approximate with fixed character count
            const lineLength = 80
            newPos = isForward ? from + units * lineLength : from - units * lineLength
            break
    }

    // Clamp to valid range
    newPos = Math.max(1, Math.min(newPos, docSize - 1))

    editor.chain().focus().setTextSelection(newPos).run()

    return {
        success: true,
        message: `Moved ${direction} ${units} ${unitType}(s)`,
        newPosition: newPos,
        previousPosition,
    }
}

// ============================================================================
// Block Selection
// ============================================================================

/**
 * Select an entire block at or near cursor
 *
 * @param editor - TipTap editor instance
 * @param options - Block selection options
 * @returns Navigation result
 */
export const selectBlock = (
    editor: Editor,
    options: SelectBlockOptions
): NavigationResult => {
    const { blockType } = options
    const { from } = editor.state.selection
    const doc = editor.state.doc
    const previousPosition = from

    // Resolve current position to find containing blocks
    const resolvedPos = doc.resolve(from)

    let blockStart: number | null = null
    let blockEnd: number | null = null

    switch (blockType) {
        case 'current':
        case 'paragraph':
            // Find immediate block parent
            for (let d = resolvedPos.depth; d >= 1; d--) {
                const node = resolvedPos.node(d)
                if (node.isBlock) {
                    blockStart = resolvedPos.start(d)
                    blockEnd = resolvedPos.end(d)
                    break
                }
            }
            break

        case 'section':
            const sections = extractSections(editor)
            const section = sections.find((s) => from >= s.startPos && from < s.endPos)
            if (section) {
                blockStart = section.startPos
                blockEnd = section.endPos
            }
            break

        case 'list':
            // Find containing list
            for (let d = resolvedPos.depth; d >= 1; d--) {
                const node = resolvedPos.node(d)
                if (
                    node.type.name === 'bulletList' ||
                    node.type.name === 'orderedList' ||
                    node.type.name === 'taskList'
                ) {
                    blockStart = resolvedPos.start(d) - 1
                    blockEnd = resolvedPos.end(d) + 1
                    break
                }
            }
            break

        case 'table':
            // Find containing table
            for (let d = resolvedPos.depth; d >= 1; d--) {
                const node = resolvedPos.node(d)
                if (node.type.name === 'table') {
                    blockStart = resolvedPos.start(d) - 1
                    blockEnd = resolvedPos.end(d) + 1
                    break
                }
            }
            break
    }

    if (blockStart === null || blockEnd === null) {
        return {
            success: false,
            message: `No ${blockType} block found at cursor position`,
        }
    }

    editor.chain().focus().setTextSelection({ from: blockStart, to: blockEnd }).run()

    return {
        success: true,
        message: `Selected ${blockType} block`,
        newPosition: blockStart,
        previousPosition,
    }
}

// ============================================================================
// Detailed Position Info
// ============================================================================

/**
 * Get detailed information about current cursor position
 *
 * @param editor - TipTap editor instance
 * @returns Comprehensive position information
 */
export const getPositionInfoDetailed = (editor: Editor): PositionInfoResult => {
    const { from } = editor.state.selection
    const doc = editor.state.doc
    const docSize = doc.content.size
    const resolvedPos = doc.resolve(from)

    // Build parent chain
    const parentChain: string[] = []
    for (let d = resolvedPos.depth; d >= 0; d--) {
        parentChain.push(resolvedPos.node(d).type.name)
    }

    // Get current node info
    const currentNode = resolvedPos.parent
    const currentNodeContent = currentNode.textContent.substring(0, 100)
    const marks = currentNode.marks?.map((m: any) => m.type.name) || []

    // Find section context
    const sections = extractSections(editor)
    const sectionContext = sections.find((s) => from >= s.startPos && from < s.endPos)

    // Determine movement possibilities
    const canMoveUp = from > 1
    const canMoveDown = from < docSize - 1
    const canMoveLeft = from > 1
    const canMoveRight = from < docSize - 1

    return {
        absolutePosition: from,
        percentageThrough: ((from / docSize) * 100).toFixed(1),
        currentNode: {
            type: currentNode.type.name,
            content: currentNodeContent,
            marks,
        },
        parentChain: parentChain.reverse(),
        sectionContext: sectionContext
            ? {
                name: sectionContext.name,
                startPos: sectionContext.startPos,
                endPos: sectionContext.endPos,
            }
            : null,
        canMove: {
            up: canMoveUp,
            down: canMoveDown,
            left: canMoveLeft,
            right: canMoveRight,
        },
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Find position of text in document
 *
 * @param editor - TipTap editor instance
 * @param searchText - Text to find
 * @param caseSensitive - Whether search is case sensitive
 * @returns Position of first match or null
 */
export const findTextPosition = (
    editor: Editor,
    searchText: string,
    caseSensitive: boolean = false
): number | null => {
    const doc = editor.state.doc
    let foundPos: number | null = null

    doc.descendants((node: any, pos: number) => {
        if (foundPos !== null) return false
        if (node.isText && node.text) {
            const nodeText = caseSensitive ? node.text : node.text.toLowerCase()
            const search = caseSensitive ? searchText : searchText.toLowerCase()
            const idx = nodeText.indexOf(search)
            if (idx !== -1) {
                foundPos = pos + idx
                return false
            }
        }
    })

    return foundPos
}

/**
 * Get all navigable elements summary
 *
 * @param editor - TipTap editor instance
 * @returns Summary of navigable elements in document
 */
export const getNavigableElementsSummary = (
    editor: Editor
): Record<NavigableElement, number> => {
    const doc = editor.state.doc
    const counts: Record<string, number> = {
        heading: 0,
        paragraph: 0,
        table: 0,
        list: 0,
        image: 0,
        codeBlock: 0,
        blockquote: 0,
    }

    doc.descendants((node: any) => {
        const type = node.type.name
        switch (type) {
            case 'heading':
                counts.heading++
                break
            case 'paragraph':
                counts.paragraph++
                break
            case 'table':
                counts.table++
                break
            case 'bulletList':
            case 'orderedList':
            case 'taskList':
                counts.list++
                break
            case 'image':
                counts.image++
                break
            case 'codeBlock':
                counts.codeBlock++
                break
            case 'blockquote':
                counts.blockquote++
                break
        }
    })

    return counts as Record<NavigableElement, number>
}
