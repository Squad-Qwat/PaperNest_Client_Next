import { ToolNode } from '@langchain/langgraph/prebuilt'
import { createDocumentTools } from '../../tools'

/**
 * Tool Node
 * Standard LangGraph ToolNode for executing tools
 */
export const toolNode = new ToolNode(createDocumentTools(null as any))
