"use client"

import React, { useState, useCallback } from 'react'
import { AIChatPanel } from './AIChatPanel'

/**
 * AI Assistant Component with Resizable Panel
 * Features a resizable sidebar for AI chat functionality
 */
interface AIAssistantProps {
  editor?: any
  aiAssistantOpen?: boolean
  toggleAiAssistant?: () => void
  onWidthChange?: (width: number) => void
}

const AIAssistant: React.FC<AIAssistantProps> = ({ 
  editor, 
  aiAssistantOpen = false, 
  toggleAiAssistant,
  onWidthChange 
}) => {
  const [width, setWidth] = useState(320) // Default width 320px
  const [isResizing, setIsResizing] = useState(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)

    const startX = e.clientX
    const startWidth = width

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = startX - moveEvent.clientX
      const newWidth = Math.min(Math.max(startWidth + deltaX, 280), 600) // min 280px, max 600px
      setWidth(newWidth)
      if (onWidthChange) {
        onWidthChange(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [width, onWidthChange])

  if (!aiAssistantOpen) return null

  return (
    <div
      className="h-full bg-white border-l border-gray-200 shadow-lg flex shrink-0 relative"
      style={{ width: `${width}px` }}
    >
      {/* Resize Handle */}
      <div
        className={`absolute left-0 top-0 h-full w-1 cursor-ew-resize hover:bg-blue-500 transition-colors ${isResizing ? 'bg-blue-500' : 'bg-transparent hover:bg-blue-300'
          }`}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-gray-300 opacity-0 hover:opacity-100 transition-opacity" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* AI Chat Panel Content */}
        <AIChatPanel editor={editor} onClose={toggleAiAssistant} />
      </div>
    </div>
  )
}

export default AIAssistant
