import { NextRequest } from 'next/server'
import { streamAgent, type ToolResult } from '@/lib/ai/langgraph-agent'
import { validateAICredentials } from '@/lib/ai/config'

export async function POST(request: NextRequest) {
	try {
		const credentialsCheck = validateAICredentials()
		if (!credentialsCheck.valid) {
			return new Response(
				JSON.stringify({ error: 'AI service not configured', details: credentialsCheck.error }),
				{ status: 500, headers: { 'Content-Type': 'application/json' } }
			)
		}

		const body = await request.json()
		const {
			message,
			documentContent = '',
			documentHTML = '',
			documentSections = [],
			conversationHistory = [],
			toolResults,
			documentId,
			threadId: bodyThreadId, // Extract threadId from body
		} = body

		if (!message || typeof message !== 'string') {
			return new Response(
				JSON.stringify({ error: 'Message is required' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			)
		}

		const encoder = new TextEncoder()

		const stream = new ReadableStream({
			async start(controller) {
				try {
					controller.enqueue(
						encoder.encode(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`)
					)

					// Use provided threadId or generate new one
					const threadId = bodyThreadId || Date.now().toString()

					for await (const chunk of streamAgent(
						message,
						documentContent,
						documentHTML, // Pass HTML for tools
						threadId,
						conversationHistory,
						toolResults as ToolResult[] | undefined,
						documentId
					)) {
						controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
						await new Promise(resolve => setTimeout(resolve, 5))
					}


					controller.enqueue(
						encoder.encode(`data: ${JSON.stringify({ type: 'stream_end', timestamp: Date.now() })}\n\n`)
					)
					controller.close()
				} catch (error) {
					console.error('[AI Stream] Error:', error)
					controller.enqueue(
						encoder.encode(`data: ${JSON.stringify({
							type: 'error',
							error: error instanceof Error ? error.message : 'Unknown error',
						})}\n\n`)
					)
					controller.close()
				}
			},
			cancel() {
				console.log('[AI Stream] Client disconnected')
			},
		})

		return new Response(stream, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache, no-transform',
				'Connection': 'keep-alive',
				'X-Accel-Buffering': 'no',
			},
		})
	} catch (error) {
		console.error('[AI Stream] Fatal error:', error)
		return new Response(
			JSON.stringify({
				error: 'Failed to initialize streaming',
				details: error instanceof Error ? error.message : 'Unknown error',
			}),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		)
	}
}

export async function OPTIONS() {
	return new Response(null, {
		status: 200,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		},
	})
}

export const runtime = 'nodejs'
export const maxDuration = 300
