/**
 * Custom Tiptap Extensions for preserving LaTeX commands
 * These extensions ensure LaTeX-specific commands are preserved during visual editing
 */

import { Mark, Node as TiptapNode, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ProtectedBlockView } from './ProtectedBlockView';

/**
 * Extension for LaTeX font size commands
 * Preserves: \tiny, \scriptsize, \footnotesize, \small, \normalsize,
 *            \large, \Large, \LARGE, \huge, \Huge
 */
export const LaTeXFontSize = Mark.create({
  name: 'latexFontSize',

  addAttributes() {
    return {
      size: {
        default: 'normalsize',
        parseHTML: element => element.getAttribute('data-size'),
        renderHTML: attributes => {
          return { 'data-size': attributes.size };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="latex-fontsize"]',
        getAttrs: element => ({
          size: (element as HTMLElement).getAttribute('data-size'),
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'latex-fontsize' }), 0];
  },
});

/**
 * Extension for LaTeX font style commands
 * Preserves: \bfseries, \mdseries, \itshape, \slshape, \scshape,
 *            \upshape, \rmfamily, \sffamily, \ttfamily
 */
export const LaTeXFontStyle = Mark.create({
  name: 'latexFontStyle',

  addAttributes() {
    return {
      style: {
        default: 'normalfont',
        parseHTML: element => element.getAttribute('data-style'),
        renderHTML: attributes => {
          return { 'data-style': attributes.style };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="latex-fontstyle"]',
        getAttrs: element => ({
          style: (element as HTMLElement).getAttribute('data-style'),
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'latex-fontstyle' }), 0];
  },
});

/**
 * Extension for LaTeX color commands
 * Preserves: \color{colorname}
 */
export const LaTeXColor = Mark.create({
  name: 'latexColor',

  addAttributes() {
    return {
      color: {
        default: 'black',
        parseHTML: element => element.getAttribute('data-color'),
        renderHTML: attributes => {
          return { 'data-color': attributes.color };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="latex-color"]',
        getAttrs: element => ({
          color: (element as HTMLElement).getAttribute('data-color'),
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'latex-color' }), 0];
  },
});

/**
 * Extension for LaTeX layout commands (inline)
 * Preserves: \vspace{10pt}, \hspace{2em}, \hrule height 1pt, \newline, etc.
 */
export const LaTeXLayoutCommand = TiptapNode.create({
  name: 'latexLayoutCommand',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      cmd: {
        default: '',
        parseHTML: element => element.getAttribute('data-cmd') ?? '',
        renderHTML: attributes => {
          return { 'data-cmd': attributes.cmd };
        },
      },
      val: {
        default: '',
        parseHTML: element => element.getAttribute('data-val') ?? '',
        renderHTML: attributes => {
          return { 'data-val': attributes.val };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="latex-layout"]',
        getAttrs: element => ({
          cmd: (element as HTMLElement).getAttribute('data-cmd') ?? '',
          val: (element as HTMLElement).getAttribute('data-val') ?? '',
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const cmd = HTMLAttributes.cmd || 'cmd';
    const val = HTMLAttributes.val || '';
    
    // Custom styling for common layout commands
    let style = 'color: var(--primary, #3b82f6); font-family: var(--font-mono); font-size: 0.8em;';
    let label = `[${cmd}${val ? `: ${val}` : ''}]`;
    
    if (cmd === 'hrule') {
      return [
        'div', 
        mergeAttributes(HTMLAttributes, { 
          'data-type': 'latex-layout', 
          'data-cmd': 'hrule',
          style: 'border-bottom: 2px solid var(--border, #e5e7eb); margin: 1.5rem 0; width: 100%;' 
        })
      ];
    }
    
    if (cmd === 'vspace') {
      const height = val || '1rem';
      return [
        'div', 
        mergeAttributes(HTMLAttributes, { 
          'data-type': 'latex-layout', 
          'data-cmd': 'vspace',
          style: `height: ${height}; margin: 0; pointer-events: none; border-left: 2px dotted var(--primary-subtle, #bfdbfe);` 
        })
      ];
    }
    
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'latex-layout',
        'data-cmd': cmd,
        ...(val && { 'data-val': val }),
        style
      }),
      label
    ];
  },
});

/**
 * Extension for LaTeX document commands
 * Preserves: \noindent, \centering, \label{...}
 */
export const LaTeXDocumentCommand = Mark.create({
  name: 'latexDocumentCommand',

  addAttributes() {
    return {
      cmd: {
        default: '',
        parseHTML: element => element.getAttribute('data-cmd'),
        renderHTML: attributes => {
          return { 'data-cmd': attributes.cmd };
        },
      },
      val: {
        default: '',
        parseHTML: element => element.getAttribute('data-val'),
        renderHTML: attributes => {
          return { 'data-val': attributes.val };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="latex-cmd"]',
        getAttrs: element => ({
          cmd: (element as HTMLElement).getAttribute('data-cmd'),
          val: (element as HTMLElement).getAttribute('data-val') || '',
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, {
      'data-type': 'latex-cmd',
      'data-cmd': HTMLAttributes.cmd,
      ...(HTMLAttributes.val && { 'data-val': HTMLAttributes.val })
    }), 0];
  },
});

/**
 * Extension for LaTeX comment blocks
 * Preserves: % comment text
 */
export const LaTeXComment = TiptapNode.create({
  name: 'latexComment',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      comment: {
        default: '',
        parseHTML: element => element.getAttribute('data-comment') ?? '',
        renderHTML: attributes => {
          return { 'data-comment': attributes.comment };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="latex-comment"]',
        getAttrs: element => ({
          comment: (element as HTMLElement).getAttribute('data-comment') ?? '',
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const comment = HTMLAttributes.comment || '';
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'latex-comment',
        'data-comment': comment,
        style: 'color: #6b7280; font-style: italic; opacity: 0.7;'
      }),
      `% ${comment}`
    ];
  },
});

/**
 * Extension for LaTeX environment blocks
 * Preserves: \begin{env}...\end{env} that aren't standard Tiptap nodes
 */
export const LaTeXEnvironment = TiptapNode.create({
  name: 'latexEnvironment',
  group: 'block',
  content: 'text*',
  atom: true,
  code: true,

  addAttributes() {
    return {
      env: {
        default: '',
        parseHTML: element => element.getAttribute('data-env'),
        renderHTML: attributes => {
          return { 'data-env': attributes.env };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'pre[data-type="latex-env"]',
        preserveWhitespace: 'full',
        getAttrs: element => ({
          env: (element as HTMLElement).getAttribute('data-env'),
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      'pre',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'latex-env',
        'data-env': HTMLAttributes.env,
        style: 'background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; border: 1px dashed #d1d5db;'
      }),
      ['code', {}, node.textContent || '']
    ];
  },
});

/**
 * Extension for \twocolumn[...] blocks
 * These are complex LaTeX structures that need special handling
 */
export const LaTeXTwocolumn = TiptapNode.create({
  name: 'latexTwocolumn',
  group: 'block',
  content: 'block+',
  defining: true,

  parseHTML() {
    return [
      {
        tag: 'div[data-type="latex-twocolumn"]',
        contentElement: 'div[data-role="twocolumn-content"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'latex-twocolumn',
        style: 'border: 2px dashed #3b82f6; padding: 1rem; margin: 1rem 0; background: #eff6ff;'
      }),
      ['div', { 'data-role': 'twocolumn-content' }, 0]
    ];
  },
});

/**
 * Extension for LaTeX braces (grouping)
 * Preserves: standalone { and } used for scoping
 */
export const LaTeXBrace = Mark.create({
  name: 'latexBrace',

  addAttributes() {
    return {
      braceType: {
        default: 'open',
        parseHTML: element => element.getAttribute('data-latex-brace'),
        renderHTML: attributes => {
          return { 'data-latex-brace': attributes.braceType };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-latex-brace]',
        getAttrs: element => ({
          braceType: (element as HTMLElement).getAttribute('data-latex-brace'),
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const brace = HTMLAttributes.braceType === 'open' ? '{' : '}';
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-latex-brace': HTMLAttributes.braceType,
        style: 'color: #9ca3af; font-weight: 600;'
      }),
      brace
    ];
  },
});

/**
 * Extension for protected LaTeX blocks (non-editable in visual mode)
 * Preserves: \begin{table}...\end{table}, \begin{figure}...\end{figure},
 *            \begin{thebibliography}...\end{thebibliography}, \twocolumn[...]
 * These structures store raw LaTeX and cannot be edited in visual mode.
 */
export const LaTeXProtectedBlock = TiptapNode.create({
  name: 'latexProtectedBlock',
  group: 'block',
  atom: true,  // Non-editable
  selectable: true,
  draggable: false,

  addNodeView() {
    return ReactNodeViewRenderer(ProtectedBlockView);
  },

  addAttributes() {
    return {
      latex: {
        default: '',
        parseHTML: element => element.getAttribute('data-latex') ?? '',
        renderHTML: attributes => {
          // RE-ENCODE HTML entities that browser/Tiptap decoded
          const escaped = (attributes.latex || '')
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          return { 'data-latex': escaped };
        },
      },
      blockType: {
        default: 'environment',
        parseHTML: element => element.getAttribute('data-block-type') ?? 'environment',
        renderHTML: attributes => {
          return { 'data-block-type': attributes.blockType };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="latex-protected"]',
        getAttrs: element => ({
          latex: (element as HTMLElement).getAttribute('data-latex') ?? '',
          blockType: (element as HTMLElement).getAttribute('data-block-type') ?? 'environment',
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const blockType = HTMLAttributes.blockType || 'block';
    // NOTE: data-latex is already escaped by the attribute's renderHTML
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'latex-protected',
        'data-block-type': blockType,
        'contenteditable': 'false',
        class: 'latex-protected-block',
        style: 'background: #f5f5f5; border: 1px dashed #ccc; border-radius: 4px; padding: 8px 12px; margin: 8px 0; font-family: monospace; font-size: 12px; color: #666; cursor: not-allowed; user-select: none;'
      }),
      `[${blockType}]`
    ];
  },
});

/**
 * Extension for inline LaTeX commands (non-editable chips)
 * Preserves: \cite{key}, \footnote{text}, \ref{label}, \includegraphics[opts]{path}
 * These render as small chips showing the command type.
 */
export const LaTeXInlineCommand = TiptapNode.create({
  name: 'latexInlineCommand',
  group: 'inline',
  inline: true,
  atom: true,  // Non-editable

  addAttributes() {
    return {
      cmd: {
        default: '',
        parseHTML: element => element.getAttribute('data-cmd') ?? '',
        renderHTML: attributes => {
          return { 'data-cmd': attributes.cmd };
        },
      },
      latex: {
        default: '',
        parseHTML: element => element.getAttribute('data-latex') ?? '',
        renderHTML: attributes => {
          // RE-ENCODE HTML entities that browser/Tiptap decoded
          const escaped = (attributes.latex || '')
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          return { 'data-latex': escaped };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="latex-inline-cmd"]',
        getAttrs: element => ({
          cmd: (element as HTMLElement).getAttribute('data-cmd') ?? '',
          latex: (element as HTMLElement).getAttribute('data-latex') ?? '',
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const rawLatex = typeof HTMLAttributes.latex === 'string' ? HTMLAttributes.latex : '';
    const inferredCmd = rawLatex.match(/^\\([a-zA-Z@]+)\b/)?.[1] || '';
    const cmd = HTMLAttributes.cmd || inferredCmd || 'cmd';
    const label = cmd !== 'cmd'
      ? `\\${cmd}{...}`
      : (rawLatex ? `${rawLatex.slice(0, 36)}${rawLatex.length > 36 ? '…' : ''}` : '\\cmd{...}');
    // NOTE: data-latex is already escaped by the attribute's renderHTML
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'latex-inline-cmd',
        'data-cmd': cmd,
        'contenteditable': 'false',
        class: 'latex-inline-chip',
        style: 'background: #e3f2fd; border: 1px solid #90caf9; border-radius: 3px; padding: 0 4px; font-family: monospace; font-size: 0.9em; color: #1565c0; cursor: not-allowed; user-select: none;'
      }),
      label
    ];
  },
});

/**
 * Extension for preserving single newlines in LaTeX
 * Distinguishes between:
 * - Single newlines (\n) - preserved as latex-newline nodes
 * - Paragraph breaks (\n\n) - converted to <p> tags
 *
 * This prevents single newlines from being converted to spaces during editing.
 */
export const LaTeXNewline = TiptapNode.create({
  name: 'latexNewline',

  group: 'inline',
  inline: true,
  selectable: false,
  atom: true,  // Non-editable

  addAttributes() {
    return {
      count: {
        default: 1,
        parseHTML: element => parseInt(element.getAttribute('data-count') || '1'),
        renderHTML: attributes => {
          return { 'data-count': attributes.count.toString() };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="latex-newline"]',
        getAttrs: element => ({
          count: parseInt((element as HTMLElement).getAttribute('data-count') || '1'),
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // Render as invisible marker (content is whitespace-only for accessibility)
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'latex-newline',
        'class': 'latex-newline-marker',
        'style': 'display: inline; white-space: pre; color: transparent; width: 0; font-size: 0;'
      }),
      '\n'  // Single newline character for accessibility
    ];
  },
});
