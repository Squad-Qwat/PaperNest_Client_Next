import { NextRequest, NextResponse } from 'next/server'
import { Editor } from '@tiptap/core'
import { invokeAgent } from '@/lib/ai/agent'
import { validateAICredentials } from '@/lib/ai/config'
import { createEditorExtensions } from '@/lib/editor/extensions'

// Extend NextRequest to include user info (from middleware or auth)
interface AuthenticatedRequest extends NextRequest {
	user?: {
		uid: string
		email: string
	}
}

/**
 * POST /api/ai-chat
 * Handle AI chat requests (non-streaming)
 */
export async function POST(request: NextRequest) {
	try {
		// 1. Validate AI credentials
		const credentialsCheck = validateAICredentials()
		if (!credentialsCheck.valid) {
			return NextResponse.json(
				{
					error: 'AI service not configured',
					details: credentialsCheck.error,
				},
				{ status: 500 }
			)
		}

		// 2. Authenticate user (optional - can be added later)
		const authHeader = request.headers.get('authorization')
		// TODO: Add Firebase token verification
		// if (!authHeader?.startsWith('Bearer ')) {
		//   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		// }

		// 3. Parse request body
		const body = await request.json()
		const { message, editorState, conversationHistory = [] } = body

		if (!message || typeof message !== 'string') {
			return NextResponse.json(
				{ error: 'Message is required' },
				{ status: 400 }
			)
		}

		// 4. Create temporary editor instance with document state
		const editor = new Editor({
			extensions: createEditorExtensions(),
			content: editorState || {},
			editable: false, // Read-only for AI
		})

		// 5. Invoke AI agent
		const startTime = Date.now()
		const response = await invokeAgent(editor, message, conversationHistory)
		const duration = Date.now() - startTime

		// 6. Cleanup
		editor.destroy()

		// 7. Log (optional)
		console.log('[AI Chat] Request processed', {
			messageLength: message.length,
			duration,
			toolCallsCount: response.toolCalls?.length || 0,
		})

		// 8. Return response
		return NextResponse.json({
			success: true,
			data: {
				content: response.content,
				toolCalls: response.toolCalls,
				toolResults: response.toolResults,
				metadata: {
					duration,
					model: process.env.AI_MODEL,
					provider: process.env.AI_PROVIDER,
				},
			},
		})
	} catch (error) {
		console.error('[AI Chat] Error:', error)

		// Handle specific error types
		if (error instanceof Error) {
			if (error.message.includes('API key')) {
				return NextResponse.json(
					{
						error: 'AI service authentication failed',
						details: 'Please check your API key configuration',
					},
					{ status: 500 }
				)
			}

			if (error.message.includes('quota') || error.message.includes('rate limit')) {
				return NextResponse.json(
					{
						error: 'Rate limit exceeded',
						details: 'Please try again later',
					},
					{ status: 429 }
				)
			}
		}

		return NextResponse.json(
			{
				error: 'Failed to process AI request',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		)
	}
}

/**
 * OPTIONS handler for CORS (if needed)
 */
export async function OPTIONS() {
	return new NextResponse(null, {
		status: 200,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		},
	})
}

// Configure route
export const runtime = 'nodejs' // or 'edge' for edge runtime
export const maxDuration = 60 // 60 seconds timeout
