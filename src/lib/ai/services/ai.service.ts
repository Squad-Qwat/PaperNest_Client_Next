import { API_CONFIG } from '../../api/config'
import type { AIStreamPayload } from '../types/chat'

/**
 * AI Service
 * Handles SSE streaming requests and RAG operations.
 */
export const aiService = {
	/**
	 * Initiates a streaming chat request to the AI backend
	 */
	async streamChat(payload: AIStreamPayload, signal: AbortSignal): Promise<ReadableStream> {
		const backendUrl = API_CONFIG.directBackendURL

		console.log(`[AIService] Starting stream request to ${backendUrl}/ai/stream`)

		const response = await fetch(`${backendUrl}/ai/stream`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'ngrok-skip-browser-warning': 'true',
			},
			body: JSON.stringify({
				...payload,
				agentId: payload.agentId,
			}),
			signal,
		})

		if (!response.ok) {
			let errorMsg = `AI Stream Request failed: ${response.status} ${response.statusText}`
			try {
				const errorData = await response.json()
				errorMsg = errorData.error || errorData.message || errorMsg
			} catch {
				// Fallback to status text
			}
			throw new Error(errorMsg)
		}

		if (!response.body) {
			throw new Error('AI Stream response has no body')
		}

		return response.body
	},

	/**
	 * Trigger PDF indexing for RAG
	 */
	async indexPDF(documentId: string, fileKey: string) {
		const backendUrl = API_CONFIG.baseURL
		try {
			const response = await fetch(`${backendUrl}/ai/rag/index`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ documentId, fileKey }),
			})
			
			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || 'Failed to index PDF')
			}

			const result = await response.json()
			// SSOT: Always unwrap .data from backend responses
			return result.data || result
		} catch (error: any) {
			console.error('[AIService] Indexing error:', error)
			throw error
		}
	},
}
