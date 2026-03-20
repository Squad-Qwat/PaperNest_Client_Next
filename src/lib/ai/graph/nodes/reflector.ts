import { AgentState, AgentStateType } from '../state'

/**
 * Reflector/Critic Node
 * Evaluates the results of the execution
 */
export const reflectorNode = async (state: AgentStateType) => {
    const plan = [...state.plan]
    const activeIndex = plan.findIndex(s => s.status === 'active' || s.status === 'pending')
    
    let pastSteps = [...(state.pastSteps || [])]
    
    if (activeIndex !== -1) {
        const completedStep = plan[activeIndex]
        plan[activeIndex] = { ...completedStep, status: 'completed' }
        pastSteps.push([completedStep.id, completedStep.description])
    }
    
    const remainingSteps = plan.filter(s => s.status === 'pending' || s.status === 'active')
    
	return {
        plan,
        pastSteps,
		isComplete: remainingSteps.length === 0,
	}
}
