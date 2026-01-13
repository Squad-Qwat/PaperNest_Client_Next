/**
 * LangGraph Agent State Definitions
 *
 * Defines the state schema for the document editing agent using LangGraph annotations.
 * This state is passed between nodes and persisted via checkpointer.
 */

import { Annotation, messagesStateReducer } from '@langchain/langgraph'
import { BaseMessage } from '@langchain/core/messages'

/**
 * Tool result from execution
 */
export interface ToolResult {
    toolCallId: string
    name: string
    result: string
    success: boolean
}

/**
 * Plan step definition for Plan-and-Execute
 */
export interface PlanStep {
    id: string
    description: string
    status: 'pending' | 'active' | 'completed' | 'failed'
    tool?: string
    args?: any
    result?: string
    // Smart Planning Fields
    confidence?: number
    acceptanceCriteria?: string
    dependencies?: number[]
    suggestedTools?: string[]
}

/**
 * Agent State Annotation
 *
 * Uses LangGraph's Annotation system for proper state management.
 * Each field has a reducer that defines how updates are merged.
 */
export const AgentState = Annotation.Root({
    // ===== MESSAGE HANDLING =====
    messages: Annotation<BaseMessage[]>({
        reducer: messagesStateReducer,
        default: () => [],
    }),

    // ===== DOCUMENT CONTEXT =====
    documentContent: Annotation<string>({
        reducer: (_, newVal) => newVal ?? '',
        default: () => '',
    }),
    documentSections: Annotation<string[]>({
        reducer: (_, newVal) => newVal ?? [],
        default: () => [],
    }),
    documentHTML: Annotation<string>({
        reducer: (_, newVal) => newVal ?? '',
        default: () => '',
    }),
    cursorPosition: Annotation<number>({
        reducer: (_, newVal) => newVal ?? 0,
        default: () => 0,
    }),

    // ===== PLANNING STATE =====
    goal: Annotation<string>({
        reducer: (_, newVal) => newVal ?? '',
        default: () => '',
    }),
    plan: Annotation<PlanStep[]>({
        reducer: (_, newVal) => newVal ?? [],
        default: () => [],
    }),
    currentStepId: Annotation<string>({
        reducer: (_, newVal) => newVal ?? '',
        default: () => '',
    }),
    currentStepDescription: Annotation<string>({
        reducer: (_, newVal) => newVal ?? '',
        default: () => '',
    }),

    // ===== META-COGNITION STATE =====
    confidence: Annotation<number>({
        reducer: (_, newVal) => newVal ?? 1.0,
        default: () => 1.0,
    }),
    progress: Annotation<number>({
        reducer: (_, newVal) => newVal ?? 0,
        default: () => 0,
    }),
    needsReplanning: Annotation<boolean>({
        reducer: (_, newVal) => newVal ?? false,
        default: () => false,
    }),

    // ===== EXECUTION TRACKING =====
    pastSteps: Annotation<Array<[string, string]>>({
        reducer: (_, newVal) => newVal ?? [],
        default: () => [],
    }),

    // ===== LOOP CONTROL =====
    iteration: Annotation<number>({
        reducer: (_, newVal) => newVal ?? 0,
        default: () => 0,
    }),
    maxIterations: Annotation<number>({
        reducer: (_, newVal) => newVal ?? 15,
        default: () => 15, // Increased for multi-step plans
    }),
    recentTools: Annotation<string[]>({
        reducer: (current, newTools) => (newTools ? [...current.slice(-10), ...newTools] : current),
        default: () => [],
    }),
    lastToolResults: Annotation<ToolResult[]>({
        reducer: (_, newVal) => newVal ?? [],
        default: () => [],
    }),

    // ===== ERROR HANDLING =====
    retryCount: Annotation<number>({
        reducer: (_, newVal) => newVal ?? 0,
        default: () => 0,
    }),
    lastError: Annotation<string>({
        reducer: (_, newVal) => newVal ?? '',
        default: () => '',
    }),

    // ===== COMPLETION =====
    isComplete: Annotation<boolean>({
        reducer: (_, newVal) => newVal ?? false,
        default: () => false,
    }),
    taskSummary: Annotation<string>({
        reducer: (_, newVal) => newVal ?? '',
        default: () => '',
    }),
})

/**
 * Type helper for accessing state
 */
export type AgentStateType = typeof AgentState.State
