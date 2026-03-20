import { loadPrompts } from '../../promptLoader'
import { createAIModel } from '../../config'
import { createCodeMirrorTools } from '../../codeMirrorTools'
import { AgentStateType } from '../state'
import { SystemMessage } from '@langchain/core/messages'

/**
 * Executor Node
 * Executes a single step of the plan
 */
export const executorNode = async (state: AgentStateType) => {
	const prompts = await loadPrompts(['system', 'executor'])
	const model = createAIModel()
	const tools = createCodeMirrorTools()
	const modelWithTools = (model as any).bindTools(tools)
	
	const currentStep = state.plan.find(s => s.status === 'active') || state.plan.find(s => s.status === 'pending')
	const planText = state.plan.map(s => `- [${s.status === 'active' ? '/' : s.status === 'completed' ? 'x' : ' '}] ${s.description}`).join('\n')
	
	let executorPrompt = prompts.executor || ''
	executorPrompt = executorPrompt.replace('{current_step}', currentStep ? currentStep.description : 'No active step')
	executorPrompt = executorPrompt.replace('{full_plan}', planText)
	
	const contextContent = `\n[CURRENT DOCUMENT STATE]\n${state.documentContent}\n`
	const sysMsg = new SystemMessage((prompts.system || '') + '\n\n' + executorPrompt + '\n\n' + contextContent)
	
	// Call AI model
	const response = await modelWithTools.invoke([sysMsg, ...state.messages])

	return {
		messages: [response],
		iteration: (state.iteration || 0) + 1,
	}
}
