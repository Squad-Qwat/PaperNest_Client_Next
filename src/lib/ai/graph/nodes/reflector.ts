import { SystemMessage, HumanMessage } from '@langchain/core/messages'
import { loadPrompts } from '../../promptLoader'
import { createAIModel } from '../../config'
import { AgentStateType } from '../state'

/**
 * Reflector Node (LLM-Driven)
 *
 * Evaluates the result of the last tool execution against the step's acceptance
 * criteria and returns a COMPLETE / CONTINUE / REPLAN verdict from the LLM.
 *
 * Previously: this node auto-marked steps as "completed" without any evaluation.
 */
export const reflectorNode = async (state: AgentStateType) => {
    const prompts = await loadPrompts(['system', 'reflector'])
    const model = createAIModel({
        provider: state.providerId as any,
        model: state.modelId,
    })

    // Find the active step
    const plan = [...state.plan]
    const activeIndex = plan.findIndex(
        (s) => s.status === 'active' || s.status === 'pending'
    )
    const activeStep = activeIndex !== -1 ? plan[activeIndex] : null

    // Get the last tool result
    const lastToolResult = state.lastToolResults?.at(-1)
    const resultText = lastToolResult
        ? JSON.stringify(lastToolResult, null, 2)
        : 'No tool result available'

    const remainingSteps = plan
        .filter((s) => s.status === 'pending' || s.status === 'active')
        .map((s) => `- ${s.description}`)
        .join('\n') || '(none — this may be the last step)'

    // Build the reflector prompt with all placeholders filled
    const reflectorPrompt = (prompts.reflector || '')
        .replace('{step_description}', activeStep?.description || 'Unknown step')
        .replace('{acceptance_criteria}', activeStep?.acceptanceCriteria || 'Step executed without error')
        .replace('{result}', resultText)
        .replace('{remaining_steps}', remainingSteps)

    const sysMsg = new SystemMessage((prompts.system || '') + '\n\n' + reflectorPrompt)

    let pastSteps = [...(state.pastSteps || [])]
    let needsReplanning = false
    let confidence = state.confidence ?? 1.0

    try {
        const response = await model.invoke([
            sysMsg,
            // Gemini requires at least one user turn in 'contents' — SystemMessage alone causes 400
            new HumanMessage('Evaluate the step execution above and provide your COMPLETE/CONTINUE/REPLAN verdict.'),
        ])
        const verdict = response.content.toString().toUpperCase()

        console.log(`[Reflector] Verdict for step "${activeStep?.description}": ${verdict.slice(0, 80)}`)

        if (verdict.startsWith('REPLAN')) {
            // LLM decided something is wrong — trigger replanning
            needsReplanning = true
            confidence = 0.2
        } else {
            // COMPLETE or CONTINUE — mark the current step as completed
            if (activeIndex !== -1) {
                plan[activeIndex] = { ...plan[activeIndex], status: 'completed' }
                pastSteps.push([plan[activeIndex].id, plan[activeIndex].description])
            }
            needsReplanning = false
            confidence = 0.9
        }
    } catch (err) {
        // On LLM error: be optimistic and mark step as completed to avoid infinite loops
        console.error('[Reflector] LLM evaluation failed, optimistically completing step:', err)
        if (activeIndex !== -1) {
            plan[activeIndex] = { ...plan[activeIndex], status: 'completed' }
            pastSteps.push([plan[activeIndex].id, plan[activeIndex].description])
        }
    }

    const remainingAfterReflection = plan.filter(
        (s) => s.status === 'pending' || s.status === 'active'
    )

    return {
        plan,
        pastSteps,
        needsReplanning,
        confidence,
        isComplete: !needsReplanning && remainingAfterReflection.length === 0,
    }
}
