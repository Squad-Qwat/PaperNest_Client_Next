import type { SSEEvent } from '../types/chat'

/**
 * useAIStream - Hook/Utility to parse SSE (Server-Sent Events) from a ReadableStream
 * 
 * Provides an async generator that yields parsed SSEEvent objects.
 */

export async function* parseSSEStream(stream: ReadableStream): AsyncGenerator<SSEEvent> {
	const reader = stream.getReader()
	const decoder = new TextDecoder()
	let buffer = ''

	try {
		while (true) {
			const { done, value } = await reader.read()
			
			if (done) {
				// Handle any remaining text in the buffer
				if (buffer.trim()) {
					yield* processLines(buffer)
				}
				break
			}

			const chunk = decoder.decode(value, { stream: true })
			buffer += chunk
			
			const lines = buffer.split('\n')
			// Keep the last partial line (if any) in the buffer
			buffer = lines.pop() || ''

			yield* processLines(lines)
		}
	} catch (error: any) {
		// Specific handling for AbortError (common in Next.js streaming when request is interrupted)
		if (error.name === 'AbortError') {
			console.log('[SSEParser] Stream reading aborted (expected cancellation)')
			// Gracefully end the generator instead of throwing to avoid crashing the call stack
			return
		}
		console.error('[SSEParser] Stream reading error:', error)
		throw error
	} finally {
		// Ensure we always release lock and cancel to notify server to stop sending
		try {
			await reader.cancel()
		} catch {
			// Ignore errors during cancel (e.g. if already closed)
		}
		reader.releaseLock()
	}
}

/**
 * Processes complete lines of text, looking for 'data: ' prefix
 */
function* processLines(lines: string | string[]): Generator<SSEEvent> {
	const linesArray = Array.isArray(lines) ? lines : [lines]
	
	for (const line of linesArray) {
		const trimmedLine = line.trim()
		if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue

		const dataStr = trimmedLine.slice(6)
		if (dataStr === '[DONE]') continue

		try {
			const data = JSON.parse(dataStr) as SSEEvent
			yield data
		} catch (e) {
			// Specific logging for parse errors (fixing the swallow from audit)
			console.warn('[SSEParser] Failed to parse JSON from line:', dataStr.slice(0, 100) + '...', e)
		}
	}
}
