import { loadPrompts } from '../../promptLoader'
import { createAIModel } from '../../config'
import { createDocumentTools } from '../../tools'
import { AgentState, AgentStateType } from '../state'
import { SystemMessage } from '@langchain/core/messages'

/**
 * Executor Node
 * Executes a single step of the plan
 */
export const executorNode = async (state: AgentStateType) => {
	const prompts = await loadPrompts(['system', 'executor'])
	const model = createAIModel()
    const tools = createDocumentTools(null as any) // Backend cannot access Tiptap Editor
    const modelWithTools = (model as any).bindTools(tools)
	
	const contextContent = `\n[CURRENT DOCUMENT STATE]\n${state.documentContent}\n`
    const sysMsg = new SystemMessage((prompts.system || '') + '\n\n' + (prompts.executor || '') + '\n\n' + contextContent)
    
    // Call AI model
    const response = await modelWithTools.invoke([sysMsg, ...state.messages])
	
	return {
        messages: [response],
		iteration: (state.iteration || 0) + 1,
	}
}
