import type { AIStreamPayload } from '../types/chat'

/**
 * AI Service
 * Handles SSE streaming requests to the backend.
 * 
 * NOTE: This service bypasses the standard apiClient/HttpClient because:
 * 1. SSE streaming requires direct access to the ReadableStream.
 * 2. Next.js local API proxy (/api) may buffer responses, breaking realtime streaming.
 * 3. Standard HttpClient has set timeouts (e.g., 10s) which are too short for AI reasoning.
 */

const getBackendUrl = () => {
	// Consistently resolve backend URL from environment variables
	const url = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '')
	if (!url) {
		console.warn('[AIService] NEXT_PUBLIC_API_URL not set, falling back to localhost:3000')
		return 'http://localhost:3000/api'
	}
	return url
}

export const aiService = {
	/**
	 * Initiates a streaming chat request to the AI backend
	 */
	async streamChat(payload: AIStreamPayload, signal: AbortSignal): Promise<ReadableStream> {
		const backendUrl = getBackendUrl()
		
		console.log(`[AIService] Starting stream request to ${backendUrl}/ai/stream`)
		
		const response = await fetch(`${backendUrl}/ai/stream`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				// Support for ngrok if applicable (matches HttpClient pattern)
				'ngrok-skip-browser-warning': 'true',
			},
			body: JSON.stringify(payload),
			signal,
		})

		if (!response.ok) {
			// Try to parse error message if available
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
	}
}
