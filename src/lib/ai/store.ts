import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { nanoid } from 'nanoid'
import type { 
	ChatMessage, 
	PlanStep, 
	ToolCall, 
	MessageRole,
	ToolStatus
} from './types/chat'

interface AIChatState {
	messages: ChatMessage[]
	currentPlan: PlanStep[]
	isStreaming: boolean
	model: string
	reasoningEnabled: boolean
	threadId: string
	agentId: string
}

interface AIChatActions {
	addUserMessage: (text: string) => void
	initAssistantMessage: (key: string) => void
	appendContent: (key: string, content: string) => void
	addToolPart: (key: string, tool: ToolCall) => void
	updateToolResult: (key: string, toolId: string, result: any, status: ToolStatus) => void
	appendReasoning: (key: string, content: string, duration?: number) => void
	setPlan: (plan: PlanStep[]) => void
	setStreaming: (value: boolean) => void
	setModel: (model: string) => void
	setAgentId: (id: string) => void
	setReasoningEnabled: (value: boolean) => void
	clearChat: () => void
	resetThreadId: () => void
	updateMessageVersion: (messageKey: string, versionIndex: number) => void
}

export const useAIChatStore = create<AIChatState & AIChatActions>()(
	immer((set) => ({
		messages: [],
		currentPlan: [],
		isStreaming: false,
		model: 'google-genai:gemma-4-31b-it', // Default model
		reasoningEnabled: false,
		threadId: `thread_${Date.now()}_${nanoid(6)}`,
		agentId: 'manual_graph',

		addUserMessage: (text: string) => 
			set((state) => {
				const message: ChatMessage = {
					key: nanoid(),
					from: 'user',
					versions: [{
						id: nanoid(),
						parts: [{ id: nanoid(), type: 'text', content: text.trim() }]
					}],
					activeVersionIndex: 0,
					timestamp: new Date(),
				}
				state.messages.push(message)
			}),

		initAssistantMessage: (key: string) =>
			set((state) => {
				const message: ChatMessage = {
					key,
					from: 'assistant',
					versions: [{ id: nanoid(), parts: [] }],
					activeVersionIndex: 0,
					timestamp: new Date(),
				}
				state.messages.push(message)
			}),

		appendContent: (key: string, content: string) =>
			set((state) => {
				const msg = state.messages.find((m) => m.key === key)
				if (!msg) return

				const version = msg.versions[msg.activeVersionIndex]
				const lastPart = version.parts[version.parts.length - 1]

				if (lastPart?.type === 'text') {
					lastPart.content += content
				} else {
					version.parts.push({ id: nanoid(), type: 'text', content })
				}
			}),

		addToolPart: (key: string, tool: ToolCall) =>
			set((state) => {
				const msg = state.messages.find((m) => m.key === key)
				if (!msg) return
				msg.versions[msg.activeVersionIndex].parts.push({
					id: nanoid(),
					type: 'tool',
					tool
				})
			}),

		updateToolResult: (key: string, toolId: string, result: any, status: ToolStatus) =>
			set((state) => {
				const msg = state.messages.find((m) => m.key === key)
				if (!msg) return
				const version = msg.versions[msg.activeVersionIndex]
				const part = version.parts.find(p => p.type === 'tool' && p.tool.id === toolId)
				if (part && part.type === 'tool') {
					part.tool.result = result
					part.tool.status = status
				}
			}),

		appendReasoning: (key: string, content: string, duration?: number) =>
			set((state) => {
				const msg = state.messages.find((m) => m.key === key)
				if (!msg) return
				
				const existing = msg.reasoning?.content || ''
				const incoming = typeof content === 'string' ? content.trim() : ''
				if (!incoming) return

				// Deduplication logic (same as in original implementation)
				const existingLines = new Set(existing.split('\n').map(l => l.trim()))
				const incomingLines = incoming.split('\n')
				const filteredIncoming = incomingLines
					.filter((line: string) => line.trim() && !existingLines.has(line.trim()))
					.join('\n')
				
				if (!filteredIncoming && existing) return

				const combined = existing ? `${existing}\n\n${filteredIncoming}` : filteredIncoming
				
				msg.reasoning = {
					content: combined,
					duration: duration !== undefined ? duration : msg.reasoning?.duration
				}
			}),

		setPlan: (plan: PlanStep[]) => set({ currentPlan: plan }),

		setStreaming: (value: boolean) => set({ isStreaming: value }),

		setModel: (model: string) => set({ model }),

		setAgentId: (id: string) => set({ agentId: id }),

		setReasoningEnabled: (value: boolean) => set({ reasoningEnabled: value }),

		clearChat: () => 
			set((state) => {
				state.messages = []
				state.currentPlan = []
			}),

		resetThreadId: () => 
			set({ threadId: `thread_${Date.now()}_${nanoid(6)}` }),

		updateMessageVersion: (messageKey: string, versionIndex: number) =>
			set((state) => {
				const msg = state.messages.find(m => m.key === messageKey)
				if (msg) {
					msg.activeVersionIndex = versionIndex
				}
			})
	}))
)
