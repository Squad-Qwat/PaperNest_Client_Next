import { Node as TiptapNode, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useEffect, useRef } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { 
        ref?: React.RefObject<any>;
        onInput?: (e: any) => void;
        "focus-ring"?: string;
      }, HTMLElement>;
    }
  }
}

/**
 * Tiptap extension for MathLive math fields
 */
export const MathLiveNode = TiptapNode.create({
  name: 'math',
  group: 'inline',
  inline: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      latex: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="math"]',
        getAttrs: (element: string | HTMLElement) => ({
          latex: (element as HTMLElement).getAttribute('data-latex'),
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'math' }), `$${HTMLAttributes.latex}$`];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathLiveComponent);
  },
});

export const MathLiveBlockNode = TiptapNode.create({
  name: 'mathBlock',
  group: 'block',
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      latex: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="math-block"]',
        getAttrs: (element: string | HTMLElement) => ({
          latex: (element as HTMLElement).getAttribute('data-latex'),
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'math-block' }), `\\[${HTMLAttributes.latex}\\]`];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathLiveComponent);
  },
});

function MathLiveComponent({ node, updateAttributes }: any) {
  const mfRef = useRef<any>(null);

  useEffect(() => {
    if (mfRef.current) {
      mfRef.current.value = node.attrs.latex;
    }
  }, [node.attrs.latex]);

  const handleChange = (e: any) => {
    updateAttributes({
      latex: e.target.value,
    });
  };

  return (
    <NodeViewWrapper className="math-node-wrapper inline-block align-baseline mx-0.5 border border-transparent hover:border-primary-subtle rounded transition-all bg-primary-subtle px-1 py-0.5 cursor-pointer">
      {/* @ts-ignore */}
      <math-field
        ref={mfRef}
        onInput={handleChange}
        style={{
          display: 'inline-block',
          outline: 'none',
          border: 'none',
          background: 'transparent',
          minWidth: '1em',
          verticalAlign: 'middle',
          color: 'var(--foreground)',
        }}
        focus-ring="none"
      />
    </NodeViewWrapper>
  );
}
