import { NextRequest } from 'next/server'
import { indexDocument } from '@/lib/ai/rag/indexer'

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { documentId, content, title } = body

		if (!documentId || !content) {
			return new Response(
				JSON.stringify({ error: 'documentId and content are required' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			)
		}

		const chunksCount = await indexDocument({
			id: documentId,
			content,
			title,
		})

		return new Response(
			JSON.stringify({ success: true, chunksCount }),
			{ status: 200, headers: { 'Content-Type': 'application/json' } }
		)
	} catch (error) {
		console.error('[AI RAG Index] Fatal error:', error)
		return new Response(
			JSON.stringify({
				error: 'Failed to index document',
				details: error instanceof Error ? error.message : 'Unknown error',
			}),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		)
	}
}

export const runtime = 'nodejs'
export const maxDuration = 300
