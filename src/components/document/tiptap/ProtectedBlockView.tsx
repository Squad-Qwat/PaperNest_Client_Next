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
      className="latex-protected-block group"
      data-type="latex-protected"
      data-block-type={blockType}
      style={{
        border: validation.valid ? '1px dashed var(--primary-subtle, #93c5fd)' : '1px solid var(--danger, #ef4444)',
        background: validation.valid ? 'var(--info-subtle, #eff6ff)' : 'var(--danger-subtle, #fef2f2)',
        borderRadius: 'var(--radius-md, 6px)',
        padding: '12px',
        margin: '16px 0',
        boxShadow: selected ? '0 0 0 2px var(--primary, rgba(59,130,246,0.35))' : 'var(--shadow-sm)',
        transition: 'all 0.2s ease-in-out',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--foreground)',
          opacity: 0.8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <strong style={{ textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary)' }}>{blockType}</strong>
          <span style={{ height: '4px', width: '4px', borderRadius: '50%', background: validation.valid ? 'var(--success, #10b981)' : 'var(--danger, #ef4444)' }} />
        </div>
        <span style={{ fontWeight: 600, color: validation.valid ? 'var(--success-subtle-foreground)' : 'var(--danger-subtle-foreground)' }}>
          {validation.valid ? 'MODIFIED' : validation.error}
        </span>
      </div>

      <textarea
        value={draftLatex}
        onChange={handleChange}
        spellCheck={false}
        className="no-scrollbar"
        style={{
          width: '100%',
          minHeight: '180px',
          resize: 'vertical',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm, 4px)',
          padding: '12px',
          background: 'var(--background)',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          lineHeight: 1.6,
          color: 'var(--foreground)',
          outline: 'none',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
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
