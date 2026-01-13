/**
 * LangGraph Agent Nodes - Plan & Execute Architecture
 */

import { AIMessage, HumanMessage, SystemMessage, ToolMessage, isAIMessage } from '@langchain/core/messages'
import { AgentStateType, PlanStep, ToolResult } from './state'
import { createAIModel } from '../config'
import { createDocumentTools } from '../tools'
import type { Editor } from '@tiptap/core'

const PLANNER_PROMPT = `You are the SMART PLANNER for a document editor agent.
Your goal is to break down the user's request into a logical sequence of steps with high precision.

AVAILABLE TOOLS:
- insert_content: Insert HTML content (generic insertion at cursor)
- insert_content_after_text: Insert content AFTER specific text anchor (Best for "Insert after X")
- insert_table: Insert EMPTY table (rows x cols)
- insert_table_with_data: Insert table WITH DATA (headers, rows arrays)
- find_and_replace: Find and replace text
- move_section: Move entire section (heading + content) to start/end - ATOMIC & SAFE
- delete_section: Delete section by heading (DESTRUCTIVE - prefer move_section for rearranging)
- delete_by_text: Delete specific text
- clear_document: Clear all document content
- read_document: Read current document
- perform_tiptap_command: Atomic commands (undo, redo, selectAll, deleteSelection, lift/sinkListItem, joinBackward/Forward)
- get_sections: Get list of all section headings
- get_cursor_info: Get cursor position and selected text
- get_document_stats: Get word/char counts
- apply_format_to_text: Bold, italic, underline
- set_text_align: Align text (left/center/right/justify)
- get_table_content: Read existing table data (headers, rows)
- replace_table: Replace entire table (for modifying existing tables)

CRITICAL - CONFIDENCE SCORING:
- Assign a confidence score (0.0-1.0) to each step.
- Lower confidence (0.3-0.6) for vague requests ("Add a table") without details.
- High confidence (0.9-1.0) for clear requests ("Add a 3x3 table").

SIMPLE INPUTS & GREETINGS:
- If user says "hi", "hello", "thanks": Create 1 step: "Respond to user". No tools. Confidence 1.0.

VAGUE REQUESTS:
- If request is "add table" but no data/size: Step 1: "Ask user for table details". No tools. Confidence 0.5.

PLACEMENT RULES:
- "After X" -> insert_content_after_text
- "Move section X to top" -> move_section with position='start'

TABLE RULES:
- CREATE table WITH DATA -> insert_table_with_data
- MODIFY existing table -> get_table_content, then replace_table

RETURN JSON ARRAY:
[
  {
    "id": "step1",
    "description": "Insert city data table using insert_table_with_data",
    "suggestedTools": ["insert_table_with_data"],
    "confidence": 0.9,
    "acceptanceCriteria": "Table with 3 columns appears in document",
    "dependencies": [] // Indices of steps this depends on
  }
]`


const EXECUTOR_PROMPT = `You are the EXECUTOR for a document editor agent.
Your job is to EXECUTE the current step by CALLING THE APPROPRIATE TOOL.

CRITICAL:
1. If the step requires EDITING or READING the document, you MUST CALL A TOOL.
2. If the step requires ASKING the user or ANSWERING a question, just output the text response without a tool.

AVAILABLE TOOLS:
- insert_content: Insert HTML content.
- insert_content_after_text: Insert content AFTER specific text. Use targetText="Anchor Text".
- insert_table: Insert an EMPTY table.
- insert_table_with_data: Insert table WITH DATA - PREFERRED.
- find_and_replace: Find text and replace with new text.
- delete_section: Delete a section by its heading text.
- delete_by_text: Delete specific text content.
- clear_document: Remove all content from the document.
- read_document: Read the current document content.
- get_document_stats: Get word count, character count, etc.
- apply_format_to_text: Apply formatting (bold, italic, underline) to text.
- set_text_align: Set text alignment (left, center, right, justify).
- get_table_content: Read table data as {headers: [], rows: [[]]}.
- replace_table: Replace entire table. Use for modifying existing tables.

HOW TO CREATE TABLE WITH DATA (PREFERRED METHOD):
Call insert_table_with_data with:
{
  "title": "Data Kota Besar Indonesia",
  "headers": ["City", "Province", "Population"],
  "rows": [
    ["Jakarta", "DKI Jakarta", "10,560,000"],
    ["Surabaya", "East Java", "3,000,000"],
    ["Bandung", "West Java", "2,500,000"]
  ]
}

RULES:
1. For tables with data → ALWAYS use insert_table_with_data, NOT insert_content with HTML
2. If modifying a table:
   - CHECK "PREVIOUS TOOL RESULTS" first!
   - If "get_table_content" data is there, USE IT immediately to call replace_table.
   - DO NOT call get_table_content again if you already have the data.
3. If the step is conversational → Reply naturally WITHOUT tools
4. NEVER describe what tool you would use - ACTUALLY CALL IT

Current Step to Execute: `


const CRITIC_PROMPT = `You are the CRITIC for a document editor agent.
Your job is to analyze the execution result of the last step and evaluate progress toward the goal.

CONTEXT:
- ORIGINAL GOAL: The user's original request
- EXECUTED STEP: What was just done
- STEP RESULT: The outcome of that step (often JSON from tool execution)
- REMAINING PLAN: Steps still to execute
- PAST STEPS: What has been completed so far

CRITICAL RULES FOR EVALUATING STEP RESULTS:
1. If STEP RESULT contains JSON data (e.g., {"headers":...} or {"action":...}) → The tool SUCCEEDED
2. If STEP RESULT says "Inserted content" or "Replaced table" → The step SUCCEEDED
3. Only mark success=false if there's an explicit "Error:" message
4. IF THE AGENT ASKED A QUESTION (e.g. "Please provide details..."):
   - success: true
   - isComplete: true (We must stop and wait for user)
   - needsReplanning: false

BE CONSERVATIVE WITH REPLANNING:
- needsReplanning should almost ALWAYS be false
- Only set needsReplanning=true if the step COMPLETELY failed with an error
- Partial success or imperfect results do NOT need replanning
- If tools are working and producing output, let the plan continue
- HOWEVER: If REMAINING PLAN is EMPTY, check if the ORIGINAL GOAL is achieved.
  - If Goal NOT achieved (e.g. Read table but didn't add data) -> needsReplanning: true
  - If Goal achieved -> isComplete: true

RETURN JSON:
{
  "success": true/false,           // Tool produced output = true
  "confidence": 0.0-1.0,           // 0.8+ if tool returned data
  "progress": 0-100,               // Estimate based on steps done vs remaining
  "isComplete": true/false,        // Only true if goal fully achieved AND no more steps
  "needsReplanning": false,        // Almost always false unless error
  "analysis": "Brief explanation"
}

IMPORTANT: If the REMAINING PLAN still has steps, let them execute! Don't trigger replanning.`



const REPLAN_PROMPT = `You are a SMART PLANNER tasked with REVISING a failed or insufficient plan.

ORIGINAL GOAL: {goal}

COMPLETED STEPS SO FAR:
{past_steps}

THE PLAN FAILED BECAUSE:
The original plan did not fully achieve the goal. The user's request is still unsatisfied.

YOUR TASK:
1. Analyze what went wrong (why was the goal not met?)
2. Create a REVISED plan that addresses the missing parts
3. Only include NEW steps (do not repeat successful completed steps unless necessary for context)
4. Be specific about tools to use

AVAILABLE TOOLS:
- insert_content, insert_content_after_text
- get_table_content, replace_table, insert_table_with_data
- insert_image, etc.
- move_section (Atomic cut & paste)

Return JSON array of steps:
[
  {
    "id": "stepN",
    "description": "...",
    "suggestedTools": ["..."],
    "confidence": 0.8,
    "acceptanceCriteria": "...",
    "dependencies": []
  }
]`

/**
 * Planner Node: Generates or updates the plan
 */
export async function plannerNode(state: AgentStateType) {
    const isReplan = state.needsReplanning

    const llm = createAIModel({ model: 'gemini-2.5-flash' })

    // Extract user request (Must get the LATEST request, not the first one)
    const reversedMessages = [...state.messages].reverse()
    const lastMsg = reversedMessages.find(m => m._getType() === 'human')
    let userRequest = 'No request'
    if (lastMsg) {
        userRequest = typeof lastMsg.content === 'string'
            ? lastMsg.content
            : Array.isArray(lastMsg.content)
                ? lastMsg.content.map(c => (c as any).text || '').join(' ')
                : JSON.stringify(lastMsg.content)
    }
    const currentGoal = state.goal || userRequest

    let systemInstruction
    let userContextMessageContent

    // Use REPLAN PROMPT only if we are in Replan Mode (triggered by Critic)
    if (isReplan && state.pastSteps.length > 0) {
        // REPLAN MODE: Use Smart Replan Prompt
        const pastStepsStr = state.pastSteps.map((s, i) => `${i + 1}. ${s[0]}: ${s[1]}`).join('\n')
        const filledPrompt = REPLAN_PROMPT
            .replace('{goal}', currentGoal)
            .replace('{past_steps}', pastStepsStr)

        systemInstruction = new SystemMessage(filledPrompt)
        userContextMessageContent = `REPLAN REQUEST: The previous plan failed to fully achieve the goal: "${currentGoal}".\nDOCUMENT CONTEXT: ${state.documentContent.substring(0, 3000)}...`
    } else {
        // NORMAL PLAN MODE: Use Standard Planner Prompt (And reset pastSteps logic implicitly via return)
        systemInstruction = new SystemMessage(PLANNER_PROMPT)
        userContextMessageContent = `USER REQUEST: ${userRequest}\nDOCUMENT CONTEXT: ${state.documentContent.substring(0, 3000)}...\nGOAL: ${currentGoal}`
    }

    const userContextMessage = new HumanMessage(userContextMessageContent)

    const response = await llm.invoke([systemInstruction, userContextMessage])
    const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content)

    let newPlan: PlanStep[] = []

    try {
        const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim()
        const parsed = JSON.parse(jsonString)

        if (Array.isArray(parsed)) {
            newPlan = parsed.map((item: any, idx: number) => ({
                id: item.id || `step-${idx + 1}`,
                description: item.description || 'Unknown step',
                status: 'pending' as const,
                confidence: item.confidence,
                acceptanceCriteria: item.acceptanceCriteria,
                dependencies: item.dependencies || [],
                suggestedTools: item.suggestedTools || []
            }))
        } else {
            throw new Error('Parsed plan is not an array')
        }
    } catch (e) {
        console.warn('[Planner] Failed to parse plan JSON:', e)
        newPlan = [{
            id: 'step-1',
            description: `Address user request: ${userRequest}`,
            status: 'pending'
        }]
    }

    console.log(`[Planner] Created ${newPlan.length} step plan`)

    return {
        plan: newPlan,
        goal: currentGoal,
        needsReplanning: false,
        confidence: 1.0,
        iteration: 0, // Reset iteration on new plan
        // CRITICAL: If this is a NEW plan (not replan), we MUST clear past steps from previous tasks.
        // If it IS a replan, we keep them (by not including the key, or passing explicit).
        // Since reducer is Replace, passing [] clears it.
        ...(!isReplan ? { pastSteps: [] } : {})
    }
}

/**
 * Executor Node: Executes the current step and removes it from plan
 * Following LangGraph Plan-and-Execute pattern: slice off executed step
 */
export async function executorNode(state: AgentStateType) {
    // Get first step from plan (plan is managed as a queue)
    const currentStep = state.plan[0]

    if (!currentStep) {
        console.log('[Executor] No more steps in plan')
        return { isComplete: true }
    }

    console.log(`[Executor] Executing step: ${currentStep.description}`)

    const llm = createAIModel()
    const tools = createDocumentTools(null as unknown as Editor, state.documentHTML || state.documentContent)
    const llmWithTools = llm.bindTools?.(tools) ?? llm

    const systemPrompt = EXECUTOR_PROMPT

    // Build context from previous tool results (crucial for multi-step operations like table modification)
    const toolResultsContext = state.lastToolResults.length > 0
        ? `\n=== PREVIOUS TOOL RESULTS (CRITICAL: USE THIS DATA) ===
${state.lastToolResults.map(r => `TOOL [${r.name}]:\n${r.result}`).join('\n\n')}
=======================================================\n`
        : ''

    if (state.lastToolResults.length > 0) {
        console.log(`[Executor] Injected ${state.lastToolResults.length} tool results into prompt`)
    }

    const userInstruction = `Execute this step: "${currentStep.description}"
${currentStep.acceptanceCriteria ? `\nACCEPTANCE CRITERIA: ${currentStep.acceptanceCriteria}` : ''}
${currentStep.suggestedTools && currentStep.suggestedTools.length > 0 ? `\nSUGGESTED TOOLS: ${currentStep.suggestedTools.join(', ')}` : ''}

DOCUMENT CONTEXT:
${state.documentContent.substring(0, 3000)}...

${toolResultsContext}
Remember: CALL the appropriate tool function to execute this step. Do not just describe what you would do.`

    // For Gemini, we only send SystemMessage + HumanMessage
    // This ensures proper turn sequencing
    const response = await llmWithTools.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userInstruction)
    ])

    // Remove the executed step from plan (slice pattern)
    const remainingPlan = state.plan.slice(1)

    return {
        messages: [response],
        currentStepId: currentStep.id,
        currentStepDescription: currentStep.description, // Pass description for reflector
        plan: remainingPlan, // Remove executed step
        iteration: state.iteration + 1, // Increment iteration counter
    }
}

/**
 * Tool Node: (Same as before, executes tools)
 */
export async function toolNode(state: AgentStateType) {
    const lastMessage = state.messages.at(-1)

    if (!lastMessage || !isAIMessage(lastMessage)) {
        return { messages: [], lastToolResults: [] }
    }

    const toolCalls = (lastMessage as AIMessage).tool_calls ?? []

    if (toolCalls.length === 0) {
        return { messages: [], lastToolResults: [] }
    }

    const toolMessages: ToolMessage[] = []
    const results: ToolResult[] = []

    for (const call of toolCalls) {
        const actionJson = JSON.stringify({
            action: call.name,
            ...call.args,
        })

        toolMessages.push(
            new ToolMessage({
                content: actionJson,
                tool_call_id: call.id ?? `${call.name}_${Date.now()}`,
                name: call.name,
            })
        )

        results.push({
            toolCallId: call.id ?? `${call.name}_${Date.now()}`,
            name: call.name,
            result: actionJson,
            success: true,
        })
    }

    return {
        messages: toolMessages,
        lastToolResults: results,
    }
}

/**
 * Critic/Reflector Node: LLM-based evaluation of step execution
 * Uses LLM to analyze results and determine confidence, progress, and replanning needs
 */
export async function reflectorNode(state: AgentStateType) {
    const lastResult = state.lastToolResults[0]

    // Get the step that was just executed - use description from state
    const lastAIMessage = state.messages.findLast(m => m._getType() === 'ai')
    const stepDescription = state.currentStepDescription || state.currentStepId || 'Unknown step'
    const stepResultStr = lastResult?.result || (lastAIMessage?.content as string) || 'Completed'


    // Check iteration limit first - use heuristic for safety
    if (state.iteration >= state.maxIterations) {
        console.warn(`[Critic] Max iterations (${state.maxIterations}) reached`)
        return {
            isComplete: true,
            confidence: 0.5,
            needsReplanning: false,
            progress: 100,
            pastSteps: [...state.pastSteps, [stepDescription, stepResultStr]],
        }
    }

    // Build context for LLM critic
    const originalGoal = state.goal || state.messages.find(m => m._getType() === 'human')?.content || 'Unknown'
    const remainingSteps = state.plan.map(s => s.description).join('\n- ') || 'None'
    const pastStepsContext = state.pastSteps.length > 0
        ? state.pastSteps.map(([step, result]) => `- ${step}: ${result}`).join('\n')
        : 'None'

    const userContext = `
ORIGINAL GOAL: ${originalGoal}

EXECUTED STEP: ${stepDescription}

STEP RESULT: ${stepResultStr}

REMAINING PLAN:
- ${remainingSteps}

PAST STEPS COMPLETED:
${pastStepsContext}

Analyze and return JSON evaluation.`

    try {
        // Use fast model for critic to minimize latency
        const llm = createAIModel({ model: 'gemini-2.5-flash' })

        const response = await llm.invoke([
            new SystemMessage(CRITIC_PROMPT),
            new HumanMessage(userContext)
        ])

        const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content)

        // Parse LLM response
        let evaluation = {
            success: true,
            confidence: 0.8,
            progress: 50,
            isComplete: false,
            needsReplanning: false,
            analysis: 'Step completed'
        }

        try {
            const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim()
            const parsed = JSON.parse(jsonString)
            evaluation = {
                success: parsed.success ?? true,
                confidence: Math.min(1, Math.max(0, parsed.confidence ?? 0.8)),
                progress: Math.min(100, Math.max(0, parsed.progress ?? 50)),
                isComplete: parsed.isComplete ?? false,
                needsReplanning: parsed.needsReplanning ?? false,
                analysis: parsed.analysis || 'Evaluation complete'
            }
        } catch (parseError) {
            console.warn('[Critic] Failed to parse LLM evaluation, using defaults:', parseError)
        }

        // Override isComplete if no more steps and success
        const isPlanComplete = state.plan.length === 0
        if (isPlanComplete && evaluation.success) {
            evaluation.isComplete = true
            evaluation.progress = 100
        }

        console.log(`[Critic] Step "${stepDescription}" - Success: ${evaluation.success}, Confidence: ${evaluation.confidence.toFixed(2)}, Progress: ${evaluation.progress}%, Replan: ${evaluation.needsReplanning}`)
        console.log(`[Critic] Analysis: ${evaluation.analysis}`)

        return {
            isComplete: evaluation.isComplete,
            progress: evaluation.progress,
            confidence: evaluation.confidence,
            needsReplanning: evaluation.needsReplanning,
            pastSteps: [...state.pastSteps, [stepDescription, stepResultStr]],
        }
    } catch (error) {
        console.error('[Critic] LLM evaluation failed, falling back to heuristic:', error)

        // Fallback to simple heuristic if LLM fails
        const isPlanComplete = state.plan.length === 0
        const hasToolResults = state.lastToolResults.length > 0

        return {
            isComplete: isPlanComplete,
            progress: isPlanComplete ? 100 : Math.min(99, state.progress + 25),
            confidence: hasToolResults ? 0.85 : 0.7,
            needsReplanning: false,
            pastSteps: [...state.pastSteps, [stepDescription, stepResultStr]],
        }
    }
}

// Re-export contextNode for compatibility or remove if unused in new flow
export async function contextNode(state: AgentStateType) {
    return {}
}
