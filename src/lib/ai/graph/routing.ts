/**
 * LangGraph Routing Functions - Advanced Architecture
 *
 * Controls flow between Planner, Executor, Tools, and Reflector
 */

import { isAIMessage, AIMessage } from '@langchain/core/messages'
import { AgentStateType } from './state'

/**
 * Routing destinations
 */
export const ROUTES = {
    PLANNER: 'planner',
    EXECUTOR: 'executor',
    TOOLS: 'tools',
    REFLECTOR: 'reflector',
    END: '__end__',
} as const

export type RouteType = (typeof ROUTES)[keyof typeof ROUTES]

/**
 * routeAfterPlanner: Always go to executor to start first step
 */
export function routeAfterPlanner(state: AgentStateType): RouteType {
    // If no steps generated, end
    if (!state.plan || state.plan.length === 0) {
        return ROUTES.END
    }
    return ROUTES.EXECUTOR
}

/**
 * routeAfterExecutor: Check for tool calls
 */
export function routeAfterExecutor(state: AgentStateType): RouteType {
    const lastMessage = state.messages.at(-1)

    // Check for tool calls
    if (lastMessage && isAIMessage(lastMessage)) {
        const aiMessage = lastMessage as AIMessage
        const toolCalls = aiMessage.tool_calls ?? []

        if (toolCalls.length > 0) {
            // End graph execution so client can process tool calls
            return ROUTES.END
        }
    }

    // No tool calls means step failed or skipped? 
    // For now, treat as completion of step logic (e.g. just talking)
    return ROUTES.REFLECTOR
}

/**
 * routeAfterTools: Back to Reflector to check success
 */
export function routeAfterTools(state: AgentStateType): RouteType {
    // In this simple version, 1 tool execution = 1 step attempt
    // Real world might allow multiple tool uses per step
    return ROUTES.REFLECTOR
}

/**
 * routeAfterReflector: Decide next move
 * Priority order:
 * 1. Iteration limit exceeded -> End (safety)
 * 2. Low confidence + needs replanning -> Planner
 * 3. Task complete -> End
 * 4. More steps in plan -> Executor
 * 5. No more steps -> End
 */
export function routeAfterReflector(state: AgentStateType): RouteType {
    // Safety: Check iteration limit first
    if (state.iteration >= state.maxIterations) {
        console.warn(`[Router] Max iterations (${state.maxIterations}) reached, forcing end`)
        return ROUTES.END
    }

    // Low confidence should trigger replanning
    if (state.needsReplanning || (state.confidence < 0.3 && !state.isComplete)) {
        console.log(`[Router] Replanning triggered (confidence: ${state.confidence}, needsReplanning: ${state.needsReplanning})`)
        return ROUTES.PLANNER
    }

    // Check if complete
    if (state.isComplete) {
        console.log('[Router] Task complete, ending')
        return ROUTES.END
    }

    // Check if more steps remain in plan (queue model)
    if (state.plan.length > 0) {
        console.log(`[Router] ${state.plan.length} steps remaining, continuing execution`)
        return ROUTES.EXECUTOR
    }

    // No more steps in plan = done
    console.log('[Router] No more steps in plan, ending')
    return ROUTES.END
}

// Deprecated functions kept for compatibility during migration if needed
export function shouldContinue(state: AgentStateType): RouteType {
    return ROUTES.END
}
export function afterTools(state: AgentStateType): RouteType {
    return ROUTES.REFLECTOR
}
export function afterError(state: AgentStateType): RouteType {
    return ROUTES.END
}
