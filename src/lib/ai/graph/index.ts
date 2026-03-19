

/**
 * LangGraph Agent Definition - Advanced Plan-and-Execute

 *
 * Compiles the StateGraph with Planner, Executor, Tool, and Reflector nodes.
 */

import { StateGraph, END, START, MemorySaver } from '@langchain/langgraph'
import { AgentState, AgentStateType, ToolResult } from './state'
import { plannerNode, executorNode, toolNode, reflectorNode } from './nodes'
import {
    routeAfterPlanner,
    routeAfterExecutor,
    routeAfterTools,
    routeAfterReflector,
    ROUTES
} from './routing'

import { HumanMessage, AIMessage, BaseMessage, ToolMessage } from '@langchain/core/messages'
import { ToolCall } from '@langchain/core/messages/tool'

/**
 * Define the graph architecture
 */
const graphBuilder = new StateGraph(AgentState)
    // Add nodes
    .addNode(ROUTES.PLANNER, plannerNode)
    .addNode(ROUTES.EXECUTOR, executorNode)
    .addNode(ROUTES.TOOLS, toolNode)
    .addNode(ROUTES.REFLECTOR, reflectorNode)

    // Define edges
    .addEdge(START, ROUTES.PLANNER)

    // Planner routing
    .addConditionalEdges(ROUTES.PLANNER, routeAfterPlanner, {
        [ROUTES.EXECUTOR]: ROUTES.EXECUTOR,
        [ROUTES.END]: END,
    })

    // Executor routing (Tool? or Reflector?)
    .addConditionalEdges(ROUTES.EXECUTOR, routeAfterExecutor, {
        [ROUTES.TOOLS]: ROUTES.TOOLS,
        [ROUTES.REFLECTOR]: ROUTES.REFLECTOR, // If no tool call, treating as step done (or fail?)
        [ROUTES.END]: END, // Added to support client-side tool execution pause
    })

    // Tools -> Reflector
    .addEdge(ROUTES.TOOLS, ROUTES.REFLECTOR)

    // Reflector routing (Back loop or End)
    .addConditionalEdges(ROUTES.REFLECTOR, routeAfterReflector, {
        [ROUTES.PLANNER]: ROUTES.PLANNER,   // Replan
        [ROUTES.EXECUTOR]: ROUTES.EXECUTOR, // Next step
        [ROUTES.END]: END,                  // Done
    })

// Compile graph
const checkpointer = new MemorySaver()
export const graph = graphBuilder.compile({ checkpointer })

// Type definitions
export type { AgentStateType, ToolResult }

export interface StreamEvent {
    type: 'content' | 'tool_calls' | 'tool_results' | 'done' | 'error' | 'plan_update'
    content?: string
    toolCalls?: { id: string; name: string; args: Record<string, unknown> }[]
    results?: ToolResult[]
    fullContent?: string
    hasMoreSteps?: boolean
    error?: string
    plan?: any[] // New event for plan updates
}

/**
 * Stream the agent execution
 */
export async function* streamAgent(
    userMessage: string,
    documentContent: string,
    documentHTML: string,
    threadId: string,
    conversationHistory: Array<{ role: string; content: string }> = [],
    existingToolResults?: ToolResult[],
    documentId?: string
): AsyncGenerator<StreamEvent> {
    console.log('[Graph] Starting Plan-and-Execute agent for thread:', threadId)

    try {
        const historyMessages = conversationHistory.map((msg) =>
            msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content)
        )

        const initialState: Partial<AgentStateType> = {
            messages: [...historyMessages, new HumanMessage(userMessage)],
            documentContent,
            documentHTML,
            cursorPosition: 0,
            plan: [],
            pastSteps: [], // Initialize pastSteps for tracking
            needsReplanning: false,
            iteration: 0,
            maxIterations: 15,
            documentId: documentId || '',
        }

        if (existingToolResults && existingToolResults.length > 0) {
            initialState.lastToolResults = existingToolResults

            // Reconstruct the AIMessage that triggered these tools
            // Add placeholder content to avoid Gemini 400 error on empty messages
            const toolCalls = existingToolResults.map(r => ({
                id: r.toolCallId,
                name: r.name,
                args: {}
            }))

            const toolCallMessage = new AIMessage({
                content: 'Executing tool...', // Avoid empty content
                tool_calls: toolCalls
            })

            const toolResultMessages = existingToolResults.map(
                (r) =>
                    new ToolMessage({
                        content: r.result,
                        tool_call_id: r.toolCallId,
                        name: r.name,
                    })
            )

            // Append [AIMessage(Call), ToolMessage(Result)] to history
            initialState.messages = [
                ...(initialState.messages ?? []),
                toolCallMessage,
                ...toolResultMessages,
            ]
        }

        const config = {
            configurable: { thread_id: threadId },
            streamMode: 'updates' as const,
        }

        const contentParts: string[] = []
        let pendingToolCalls: { id: string; name: string; args: Record<string, unknown> }[] = []

        for await (const update of await graph.stream(initialState, config)) {
            const entries = Object.entries(update)

            for (const [nodeName, nodeOutput] of entries) {
                const output = nodeOutput as Partial<AgentStateType>

                // Stream Plan Updates
                if ((nodeName === ROUTES.PLANNER || nodeName === ROUTES.REFLECTOR) && output.plan) {
                    yield { type: 'plan_update', plan: output.plan }
                    console.log(`[Graph] Plan update: ${output.plan.length} steps`)
                    if (output.confidence !== undefined) {
                        console.log(`[Graph] Confidence Score: ${output.confidence}`)
                    }
                }

                // Handle Executor Output (LLM Content)
                if (nodeName === ROUTES.EXECUTOR && output.messages) {
                    const lastMsg = output.messages.at(-1)
                    if (lastMsg) {
                        let textContent = ''
                        if (typeof lastMsg.content === 'string') {
                            textContent = lastMsg.content
                        } else if (Array.isArray(lastMsg.content)) {
                            textContent = lastMsg.content
                                .filter((part: any) => part.type === 'text')
                                .map((part: any) => part.text)
                                .join('')
                        }

                        if (textContent && textContent.trim()) {
                            contentParts.push(textContent)
                            yield { type: 'content', content: textContent }
                        }

                        if ('tool_calls' in lastMsg) {
                            const aiMsg = lastMsg as AIMessage
                            if (aiMsg.tool_calls && aiMsg.tool_calls.length > 0) {
                                pendingToolCalls = aiMsg.tool_calls.map((tc) => ({
                                    id: tc.id ?? `${tc.name}_${Date.now()}`,
                                    name: tc.name,
                                    args: tc.args as Record<string, unknown>,
                                }))
                                yield { type: 'tool_calls', toolCalls: pendingToolCalls }
                            }
                        }
                    }
                }

                if (nodeName === ROUTES.TOOLS && output.lastToolResults) {
                    yield { type: 'tool_results', results: output.lastToolResults }
                }
            }
        }

        yield {
            type: 'done',
            fullContent: contentParts.join(''),
            hasMoreSteps: false, // In this arch, done means truly done
        }
    } catch (error) {
        console.error('[Graph] Error:', error)
        yield {
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
        }
    }
}
