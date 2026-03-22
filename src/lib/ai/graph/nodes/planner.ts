import { SystemMessage, HumanMessage } from '@langchain/core/messages'
import { loadPrompts } from '../../promptLoader'
import { createAIModel } from '../../config'
import { createCodeMirrorTools } from '../../tools/schemas'
import { AgentStateType } from '../state'
import { PlanSchema } from '../schemas/planSchema'

/**
 * Returns a formatted list of tool names and descriptions to inject into prompts.
 */
function getToolDescriptions(): string {
    const tools = createCodeMirrorTools()
    return tools
        .map((t) => `- **${t.name}**: ${t.description}`)
        .join('\n')
}

/**
 * Planner Node (LLM-Driven)
 *
 * Calls the LLM with structured output to generate a typed, validated plan.
 * Replaces the previous heuristic (keyword-matching) implementation.
 */
export const plannerNode = async (state: AgentStateType) => {
    const prompts = await loadPrompts(['system', 'planner'])

    // Early exit: validate we have the required prompts
    if (!prompts.system || !prompts.planner) {
        console.error('[Planner] Missing required prompts (system or planner)')
        return {
            plan: [{
                id: '1',
                description: 'ERROR: System prompts not loaded',
                status: 'failed' as const,
                confidence: 0,
                acceptanceCriteria: 'Prompt loading failed',
            }],
            goal: state.goal, // Preserve existing goal
        }
    }

    // Skip replanning if a valid plan already exists and replanning isn't requested
    if (state.plan && state.plan.length > 0 && !state.needsReplanning) {
        return { goal: state.goal } // Return early but preserve goal
    }

    const model = createAIModel({
        provider: state.providerId as any,
        model: state.modelId,
    })

    // Extract task: use goal if replanning, otherwise extract from messages
    const taskMessage = state.goal && state.goal.trim()
        ? state.goal
        : (state.messages.at(-1)?.content && typeof state.messages.at(-1)!.content === 'string')
            ? (state.messages.at(-1)!.content as string).trim()
            : ''

    // Early exit: no task provided
    if (!taskMessage) {
        console.warn('[Planner] No task message provided, cannot create plan')
        return {
            plan: [{
                id: '1',
                description: 'No task provided',
                status: 'failed' as const,
                confidence: 0,
                acceptanceCriteria: 'Task required to create plan',
            }],
        }
    }

    const documentSnippet = state.documentContent?.slice(0, 2000) || '(no document content)'
    const toolDescriptions = getToolDescriptions()

    // Build the planner prompt with all placeholders filled
    const plannerPrompt = prompts.planner
        .replace('{tool_descriptions}', toolDescriptions)
        .replace('{document_snippet}', documentSnippet)
        .replace('{task}', taskMessage)

    // Validate prompt is not empty
    if (!plannerPrompt.trim()) {
        console.error('[Planner] Planner prompt is empty after substitution')
        return {
            plan: [{
                id: '1',
                description: taskMessage,
                status: 'pending' as const,
                confidence: 0.5,
                acceptanceCriteria: 'Prompt substitution failed, using fallback',
            }],
        }
    }

    const sysMsg = new SystemMessage(prompts.system + '\n\n' + plannerPrompt)

    try {
        // Use structured output to get a type-safe, validated plan from the LLM
        const modelWithStructure = (model as any).withStructuredOutput(PlanSchema, {
            name: 'plan',
            strict: false,
        })

        console.log('[Planner] Invoking structured output with:', {
            messageCount: 2,
            taskMessage: taskMessage.substring(0, 50),
        })

        // Always include HumanMessage to satisfy Gemini 'contents' requirement
        const response = await modelWithStructure.invoke([
            sysMsg,
            new HumanMessage(`Plan this task: ${taskMessage}`),
        ])

        console.log('[Planner] Structured output succeeded:', {
            stepsCount: response.steps?.length,
            firstStepTool: response.steps?.[0]?.tool,
        })

        const plan = response.steps.map((step: any, idx: number) => ({
            ...step,
            id: step.id || String(idx + 1),
            status: 'pending' as const,
            confidence: step.confidence ?? 0.9,
        }))

        console.log(`[Planner] Generated ${plan.length} steps via LLM. Reasoning: ${response.reasoning || 'N/A'}`)
        console.log('[Planner] Plan details:', {
            steps: plan.map((s: any) => ({
                id: s.id,
                description: s.description?.substring(0, 40),
                tool: s.tool,
                status: s.status,
            })),
        })

        return {
            plan,
            needsReplanning: false,
            consecutiveNoExecutionCycles: 0,
            goal: taskMessage,
        }
    } catch (err) {
        // Fallback: single generic step if structured output fails
        console.error('[Planner] Structured output failed, using fallback plan:', err instanceof Error ? err.message : String(err))
        const fallbackPlan = [
            {
                id: '1',
                description: taskMessage,
                status: 'pending' as const,
                confidence: 0.7,
                acceptanceCriteria: 'Task executed without error',
                tool: undefined, // Explicitly note that fallback has no tool
            },
        ]
        console.warn('[Planner] Fallback plan created (no tool field!):', {
            steps: fallbackPlan.map(s => ({
                id: s.id,
                tool: s.tool,
                status: s.status,
            })),
        })
        return {
            plan: fallbackPlan,
            needsReplanning: false,
            consecutiveNoExecutionCycles: 0,
            goal: taskMessage,
        }
    }
}
