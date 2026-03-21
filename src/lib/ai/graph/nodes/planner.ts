import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { loadPrompts } from '../../promptLoader'
import { createAIModel } from '../../config'
import { createCodeMirrorTools } from '../../codeMirrorTools'
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

    // Skip replanning if a valid plan already exists and replanning isn't requested
    if (state.plan && state.plan.length > 0 && !state.needsReplanning) {
        return {}
    }

    const model = createAIModel({
        provider: state.providerId as any,
        model: state.modelId,
    })

    const taskMessage = state.messages.at(-1)?.content?.toString() || ''
    const documentSnippet = state.documentContent?.slice(0, 2000) || '(no document content)'
    const toolDescriptions = getToolDescriptions()

    // Build the planner prompt with all placeholders filled
    const plannerPrompt = (prompts.planner || '')
        .replace('{tool_descriptions}', toolDescriptions)
        .replace('{document_snippet}', documentSnippet)
        .replace('{task}', taskMessage)

    const sysMsg = new SystemMessage((prompts.system || '') + '\n\n' + plannerPrompt)

    try {
        // Use structured output to get a type-safe, validated plan from the LLM
        const modelWithStructure = (model as any).withStructuredOutput(PlanSchema, {
            name: 'plan',
            strict: false,
        })

        const response = await modelWithStructure.invoke([sysMsg])

        const plan = response.steps.map((step: any, idx: number) => ({
            ...step,
            id: step.id || String(idx + 1),
            status: 'pending' as const,
            confidence: step.confidence ?? 0.9,
        }))

        console.log(`[Planner] Generated ${plan.length} steps via LLM. Reasoning: ${response.reasoning || 'N/A'}`)

        return {
            plan,
            needsReplanning: false,
            goal: taskMessage,
        }
    } catch (err) {
        // Fallback: single generic step if structured output fails
        console.error('[Planner] Structured output failed, using fallback plan:', err)
        return {
            plan: [
                {
                    id: '1',
                    description: taskMessage,
                    status: 'pending' as const,
                    confidence: 0.7,
                    acceptanceCriteria: 'Task executed without error',
                },
            ],
            needsReplanning: false,
            goal: taskMessage,
        }
    }
}
