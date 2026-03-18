import { AgentState, AgentStateType } from '../state'

/**
 * Reflector/Critic Node
 * Evaluates the results of the execution
 */
export const reflectorNode = async (state: AgentStateType) => {
    // If this node is reached, the executor emitted a normal text message without tool calls.
    // This implies the current step is complete.
    const newPlan = state.plan.slice(1)
	return {
        plan: newPlan,
		isComplete: newPlan.length === 0,
	}
}
