/**
 * Common AI Utility Functions
 */


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
