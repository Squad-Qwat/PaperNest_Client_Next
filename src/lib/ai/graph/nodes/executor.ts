import { loadPrompts } from '../../promptLoader'
import { createAIModel } from '../../config'
import { createCodeMirrorTools } from '../../codeMirrorTools'
import { AgentStateType } from '../state'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'

const contentToText = (content: unknown): string => {
    if (typeof content === 'string') return content
    if (Array.isArray(content)) {
        return content
            .map((part: any) => (part?.type === 'text' ? part.text : ''))
            .filter(Boolean)
            .join('')
    }
    if (content === null || content === undefined) return ''
    try {
        return JSON.stringify(content)
    } catch {
        return '[unserializable-content]'
    }
}

/**
 * Returns a formatted tool description list for prompt injection.
 */
function getToolDescriptions(): string {
    const tools = createCodeMirrorTools()
    return tools
        .map((t) => `- **${t.name}**: ${t.description}`)
        .join('\n')
}

/**
 * Executor Node
 * Executes a single step of the plan using the LLM with tool bindings.
 */
export const executorNode = async (state: AgentStateType) => {
    const prompts = await loadPrompts(['system', 'executor'])
    const model = createAIModel({
        provider: state.providerId as any,
        model: state.modelId,
    })
    const tools = createCodeMirrorTools()
    const modelWithTools = (model as any).bindTools(tools)

    const currentStep =
        state.plan.find((s) => s.status === 'active') ||
        state.plan.find((s) => s.status === 'pending')

    const planText = state.plan
        .map((s) => {
            const marker =
                s.status === 'active' ? '/' : s.status === 'completed' ? 'x' : ' '
            return `- [${marker}] ${s.description}`
        })
        .join('\n')

    const toolDescriptions = getToolDescriptions()

    // Fill all executor prompt placeholders
    const executorPrompt = (prompts.executor || '')
        .replace('{tool_descriptions}', toolDescriptions)
        .replace('{current_step}', currentStep ? currentStep.description : 'No active step')
        .replace('{full_plan}', planText)

    const contextContent = `\n[CURRENT DOCUMENT STATE]\n${state.documentContent}\n`
    const sysMsg = new SystemMessage(
        (prompts.system || '') + '\n\n' + executorPrompt + '\n\n' + contextContent
    )

    const fullInput = [sysMsg, ...state.messages]

    let response
    try {
        response = await modelWithTools.invoke(fullInput)
    } catch (error) {
        console.error('[Executor] invoke failed with full history, retrying with minimal context:', {
            messageCount: state.messages.length,
            error: error instanceof Error ? error.message : String(error),
        })

        const lastUserText = [...state.messages]
            .reverse()
            .map((message: any) => {
                const type = typeof message?._getType === 'function' ? message._getType() : ''
                return type === 'human' ? contentToText(message.content).trim() : ''
            })
            .find((text) => text.length > 0)

        const fallbackHuman = new HumanMessage(
            lastUserText || currentStep?.description || state.goal || 'Continue with the current plan.'
        )

        response = await modelWithTools.invoke([sysMsg, fallbackHuman])
    }

    // Mark the current step as 'active' in the plan update
    const updatedPlan = state.plan.map((s) => {
        if (s.id === currentStep?.id && s.status === 'pending') {
            return { ...s, status: 'active' as const }
        }
        return s
    })

    return {
        messages: [response],
        plan: updatedPlan,
        iteration: (state.iteration || 0) + 1,
    }
}
