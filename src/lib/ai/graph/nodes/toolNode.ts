import { ToolNode } from '@langchain/langgraph/prebuilt'
import { createCodeMirrorTools } from '../../codeMirrorTools'

/**
 * Tool Node
 * Standard LangGraph ToolNode for executing tools
 */
export const toolNode = new ToolNode(createCodeMirrorTools())
