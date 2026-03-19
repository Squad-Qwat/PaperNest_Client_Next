import { AgentState, AgentStateType } from '../state'

/**
 * Planner Node
 * Generates a step-by-step plan for the task
 */
export const plannerNode = async (state: AgentStateType) => {
    // If plan already exists, don't overwrite it unless replanning is needed
    if (state.plan && state.plan.length > 0 && !state.needsReplanning) {
        return {}
    }

    const lastMessage = state.messages.at(-1)?.content?.toString() || ''
    
    // Simple heuristic-based planner for multi-step LaTeX tasks
    // In a real scenario, this would call an LLM to generate the plan
    const plan: any[] = []
    
    if (lastMessage.toLowerCase().includes('fix') || lastMessage.toLowerCase().includes('perbaiki')) {
        plan.push({ id: '1', description: 'Analyze logs and document content', status: 'active' })
        plan.push({ id: '2', description: 'Apply fix and verify with compilation', status: 'pending' })
    } else {
        plan.push({ id: '1', description: 'Analyze and execute user request', status: 'active' })
        plan.push({ id: '2', description: 'Verify changes with LaTeX compilation', status: 'pending' })
    }

	return {
		plan,
        needsReplanning: false
	}
}
