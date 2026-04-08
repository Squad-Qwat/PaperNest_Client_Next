/**
 * AI Chat Type Definitions
 * 
 * Shared TypeScript types for AI chat conversations, messages, 
 * tool calls, and streaming communication.
 */

export type MessageRole = 'user' | 'assistant'

/**
 * Parts of a message to support mixed content (text + tool calls)
 */
export interface TextPart {
	id: string
	type: 'text'
	content: string
}

export interface ToolPart {
	id: string
	type: 'tool'
	tool: ToolCall
}

export type MessagePart = TextPart | ToolPart

/**
 * Support for message versioning (retry/edit)
 */
export interface MessageVersion {
	id: string
	parts: MessagePart[]
}

/**
 * Main chat message structure
 */
export interface ChatMessage {
	key: string
	from: MessageRole
	versions: MessageVersion[]
	activeVersionIndex: number
	timestamp: Date
	reasoning?: {
		content: string
		duration?: number
	}
	sources?: {
		href: string
		title: string
	}[]
}

/**
 * Status of an AI tool execution
 */
export type ToolStatus = 'executing' | 'complete' | 'error'

/**
 * Information about a tool call from the AI
 */
export interface ToolCall {
	id: string
	name: string
	args: any
	result?: any
	status: ToolStatus
}

/**
 * Step in an AI-generated plan
 */
export interface PlanStep {
	title: string
	status: 'pending' | 'active' | 'completed' | 'failed'
}

/**
 * Payload sent to the backend AI streaming endpoint
 */
export interface AIStreamPayload {
	message: string
	documentContent: string
	conversationHistory: { role: MessageRole; content: string }[]
	toolResults?: {
		toolCallId: string
		name: string
		result: string
	}[]
	threadId: string
	documentId?: string
	reasoningEnabled: boolean
	plan?: PlanStep[]
	providerId: string
	modelId: string
}

/**
 * Events received from the SSE backend
 */
export type SSEEvent =
	| { type: 'content'; content: string }
	| { type: 'tool_calls'; toolCalls: { id: string; name: string; args: any }[] }
	| { type: 'plan_update'; plan: PlanStep[] }
	| { type: 'reasoning'; content: string; duration?: number }
	| { type: 'done'; hasMoreSteps: boolean }
	| { type: 'stream_end' }
