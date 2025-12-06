import { NextRequest } from 'next/server'
import { searchDocumentContext } from '@/lib/ai/rag/indexer'

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { documentId, query, k } = body

		if (!documentId || !query) {
			return new Response(
				JSON.stringify({ error: 'documentId and query are required' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			)
		}

		const result = await searchDocumentContext(documentId, query, k)

		return new Response(
			JSON.stringify({ context: result }),
			{ status: 200, headers: { 'Content-Type': 'application/json' } }
		)
	} catch (error) {
		console.error('[AI RAG Query] Error:', error)
		return new Response(
			JSON.stringify({
				error: 'Failed to search document context',
				details: error instanceof Error ? error.message : 'Unknown error',
			}),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		)
	}
}

export const runtime = 'nodejs'
export const maxDuration = 300
