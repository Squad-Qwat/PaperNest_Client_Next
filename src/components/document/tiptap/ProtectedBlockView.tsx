'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { NodeViewProps, NodeViewWrapper } from '@tiptap/react'
import { validateProtectedBlock } from '@/lib/latex/LaTeXProtectedBlockValidator'

export function ProtectedBlockView({ node, updateAttributes, selected }: NodeViewProps) {
  const blockType = (node.attrs.blockType || 'block') as string
  const committedLatex = (node.attrs.latex || '') as string
  const [draftLatex, setDraftLatex] = useState(committedLatex)

  useEffect(() => {
    if (committedLatex !== draftLatex) {
      setDraftLatex(committedLatex)
    }
  }, [committedLatex])

  const validation = useMemo(() => validateProtectedBlock(draftLatex, blockType), [draftLatex, blockType])

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value
    setDraftLatex(nextValue)

    const nextValidation = validateProtectedBlock(nextValue, blockType)
    if (nextValidation.valid) {
      updateAttributes({ latex: nextValue })
    }
  }

  return (
    <NodeViewWrapper
      className="latex-protected-block"
      data-type="latex-protected"
      data-block-type={blockType}
      style={{
        border: validation.valid ? '1px dashed #93c5fd' : '1px solid #ef4444',
        background: validation.valid ? '#eff6ff' : '#fef2f2',
        borderRadius: '6px',
        padding: '10px',
        margin: '10px 0',
        boxShadow: selected ? '0 0 0 1px rgba(59,130,246,0.35)' : 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '6px',
          fontSize: '11px',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          color: '#1f2937',
        }}
      >
        <strong style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>{blockType}</strong>
        <span style={{ color: validation.valid ? '#1d4ed8' : '#dc2626' }}>
          {validation.valid ? 'Valid' : validation.error}
        </span>
      </div>

      <textarea
        value={draftLatex}
        onChange={handleChange}
        spellCheck={false}
        style={{
          width: '100%',
          minHeight: '180px',
          resize: 'vertical',
          border: validation.valid ? '1px solid #bfdbfe' : '1px solid #fca5a5',
          borderRadius: '4px',
          padding: '8px',
          background: '#ffffff',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: '12px',
          lineHeight: 1.45,
          color: '#111827',
          outline: 'none',
        }}
      />

      {!validation.valid && (
        <p
          style={{
            marginTop: '6px',
            fontSize: '11px',
            color: '#b91c1c',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          }}
        >
          Perubahan belum disimpan karena sintaks blok belum valid.
        </p>
      )}
    </NodeViewWrapper>
  )
}
