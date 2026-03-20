/**
 * Common AI Utility Functions
 */

/**
 * Extract text content from a Tiptap node recursively
 */
export const getNodeText = (node: any): string => {
    if (node.text) return node.text
    if (!node.content) return ''
    return node.content.map((child: any) => getNodeText(child)).join('')
}

/**
 * Check if a paragraph node functions as a heading (bold + caps/large font)
 */
export const isPseudoHeading = (node: any): boolean => {
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

/**
 * Extract text content from LangChain message content
 * Handles both string and array of content blocks
 */
export const extractTextContent = (content: any): string => {
	if (typeof content === 'string') {
		return content
	}

	if (Array.isArray(content)) {
		return content
			.filter((block) => block && typeof block === 'object' && (block.type === 'text' || block.text))
			.map((block) => block.text || '')
			.join('')
	}

	// Fallback for unknown types
	try {
		return JSON.stringify(content)
	} catch {
		return String(content)
	}
}
