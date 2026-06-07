import type { Extension } from '@codemirror/state'
import { type EditorView, keymap } from '@codemirror/view'

/**
 * CodeMirror extension that overrides the Enter key.
 * When Enter is pressed, it inserts a newline and preserves the leading whitespace
 * (spaces and tabs) of the current line for the newly created line.
 */
export const latexIndentKeymap: Extension = keymap.of([
	{
		key: 'Enter',
		run: (view: EditorView) => {
			const { state } = view
			const { selection } = state
			if (selection.ranges.length > 1) return false
			const range = selection.main
			const line = state.doc.lineAt(range.from)

			// Extract leading spaces and tabs
			const match = /^[ \t]*/.exec(line.text)
			const indent = match ? match[0] : ''

			view.dispatch({
				changes: {
					from: range.from,
					to: range.to,
					insert: `\n${indent}`,
				},
				selection: { anchor: range.from + 1 + indent.length },
				scrollIntoView: true,
			})
			return true
		},
	},
])
