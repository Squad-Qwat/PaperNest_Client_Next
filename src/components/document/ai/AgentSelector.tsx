'use client'

import React from 'react'
import { useAIChatStore } from '@/lib/ai/store'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BrainCircuit, Cpu } from 'lucide-react'

/**
 * Agent Selector Component
 * Allows users to choose between Manual LangGraph and DeepAgent
 */
export const AgentSelector: React.FC = () => {
    const { agentId, setAgentId } = useAIChatStore()

    return (
        <div className="flex items-center gap-2">
            <Select value={agentId} onValueChange={setAgentId}>
                <SelectTrigger className="h-8 w-[140px] bg-transparent border-none focus:ring-0 text-xs font-medium">
                    <SelectValue placeholder="Select Agent" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="manual_graph">
                        <div className="flex items-center gap-2">
                            <BrainCircuit className="h-3.5 w-3.5 text-blue-500" />
                            <span>Graph Agent</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="deep_agent">
                        <div className="flex items-center gap-2">
                            <Cpu className="h-3.5 w-3.5 text-purple-500" />
                            <span>Medium Agent</span>
                        </div>
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}
