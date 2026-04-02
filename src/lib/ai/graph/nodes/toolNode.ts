import { ToolNode as BaseToolNode } from '@langchain/langgraph/prebuilt'
import { createCodeMirrorTools } from '../../tools/schemas'
import { AgentStateType } from '../state'
import { ToolMessage, BaseMessage } from '@langchain/core/messages'

const baseToolNode = new BaseToolNode(createCodeMirrorTools())

/**
 * Custom ToolNode wrapper to sync tool results into state.lastToolResults
 * (required for Reflector to evaluate step success)
 */
export const toolNode = async (state: AgentStateType) => {
    try {
        console.log('[ToolNode] Invoke starting. Current state.lastToolResults:', {
            count: state.lastToolResults?.length ?? 0,
        })

        // Execute tools via base tool node
        const result = await baseToolNode.invoke(state)
        
        console.log('[ToolNode] Invoke completed. Result fields:', {
            hasMessages: !!result.messages,
            messageCount: result.messages?.length ?? 0,
            resultKeys: Object.keys(result),
        })

        // Extract ToolMessage results and sync to state.lastToolResults
        if (result.messages && result.messages.length > 0) {
            console.log('[ToolNode] Processing messages:', {
                messages: result.messages.map((msg: BaseMessage) => ({
                    type: msg._getType?.() ?? 'unknown',
                    content: typeof msg.content === 'string' ? msg.content.substring(0, 50) : typeof msg.content,
                })),
            })

            const toolMessages = result.messages.filter(
                (msg: BaseMessage): msg is ToolMessage => msg._getType?.() === 'tool'
            )
            console.log('[ToolNode] ToolMessages extracted:', {
                count: toolMessages.length,
                tools: toolMessages.map((m: ToolMessage) => ({ name: m.name, hasResult: !!m.content })),
            })

            if (toolMessages.length > 0) {
                const extracted = toolMessages.map((msg: ToolMessage) => ({
                    name: msg.name,
                    result: msg.content,
                    toolCallId: msg.tool_call_id,
                }))
                console.log('[ToolNode] Returning with lastToolResults:', {
                    count: extracted.length,
                    items: extracted.map((x: any) => ({ name: x.name, hasResult: !!x.result })),
                })
                return {
                    ...result,
                    lastToolResults: extracted,
                }
            }
        }

        console.log('[ToolNode] No tool messages found, returning result as-is')
        return result
    } catch (err) {
        console.error('[ToolNode] Error during tool execution:', {
            error: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined,
        })
        throw err
    }
}
